import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { notFound } from '@/lib/errors';
import { logger, Events } from '@/lib/logger';
import {
  generateContent,
  isGeminiConfigured,
  functionResponse,
  modelText,
  userText,
  type GeminiContent,
} from '@/lib/ai/gemini';
import { buildSystemPrompt, FALLBACK_REPLY, ESCALATION_ACKNOWLEDGEMENT } from '@/lib/ai/prompts';
import { executeTool, toolDeclarations, type ToolContext } from '@/lib/ai/tools';
import { loadRecentMessages } from '@/lib/conversations/conversation.service';

/**
 * The agent loop.
 *
 * Responsibilities, in order: load the clinic's configuration, replay recent
 * history, ask the model, run whatever tools it asks for, feed the results back,
 * and stop when it produces prose. The loop is bounded — a model that keeps
 * calling tools is cut off and asked for a final answer, so a bad turn costs a
 * fixed amount rather than looping until the request times out.
 *
 * The agent never writes to the conversation itself; it returns text and the
 * caller decides how to deliver it. That keeps the WhatsApp transport out of the
 * reasoning path and makes the loop directly testable.
 */

const MAX_TOOL_ROUNDS = 3;

export interface AgentTurnInput {
  clinicId: string;
  conversationId: string;
  patientId: string;
  leadId: string;
  /** The patient's message for this turn. */
  message: string;
  /** Provider message id; seeds tool idempotency keys. */
  idempotencySeed: string;
  locale?: 'en' | 'ar';
  now?: Date;
}

export interface AgentTurnResult {
  reply: string;
  escalated: boolean;
  /** Redacted trace persisted alongside the outbound message for the admin view. */
  toolCalls: Array<{ name: string; ok: boolean }>;
  usedFallback: boolean;
  buttons?: Array<{ id: string; title: string }>;
}

export async function runAgentTurn(input: AgentTurnInput): Promise<AgentTurnResult> {
  const startedAt = Date.now();
  const now = input.now ?? new Date();
  const locale = input.locale ?? 'en';
  console.log('\n🤖 [AGENT] runAgentTurn start | clinicId:', input.clinicId, '| locale:', locale);
  logger.info(Events.AI_STARTED, 'AI agent turn started', {
    clinicId: input.clinicId,
    conversationId: input.conversationId,
    locale,
  });
  console.log('🤖 [AGENT] message:', input.message?.slice(0, 100));

  const clinic = await prisma.clinic.findUnique({
    where: { id: input.clinicId },
    select: {
      id: true,
      name: true,
      description: true,
      addressLine: true,
      city: true,
      country: true,
      phone: true,
      email: true,
      website: true,
      timezone: true,
      isActive: true,
      hours: {
        select: { weekday: true, startMinute: true, endMinute: true, isClosed: true },
        orderBy: { weekday: 'asc' },
      },
      services: {
        where: { isActive: true },
        select: { id: true, name: true, durationMinutes: true, priceMinor: true, currency: true },
        orderBy: { name: 'asc' },
        take: 30,
      },
      doctors: {
        where: { isActive: true },
        select: { id: true, name: true, specialty: true },
        orderBy: { name: 'asc' },
        take: 30,
      },
      aiConfiguration: true,
      settings: true,
    },
  });
  if (!clinic) throw notFound('Clinic not found.');
  console.log('🤖 [AGENT] Clinic found:', clinic.name, '| isActive:', clinic.isActive);

  const ai = clinic.aiConfiguration;
  console.log('🤖 [AGENT] AI config:', ai ? `model=${ai.model} isEnabled=${ai.isEnabled}` : 'NULL — NOT CONFIGURED');

  if (!clinic.isActive || !ai || !ai.isEnabled || !isGeminiConfigured()) {
    console.log('🔴 [AGENT] Agent disabled/unconfigured. isActive:', clinic.isActive, 'hasAI:', !!ai, 'aiEnabled:', ai?.isEnabled, 'geminiConfigured:', isGeminiConfigured());
    logger.warn(Events.AI_FAILED, 'Agent disabled or unconfigured; using fallback reply', {
      clinicId: clinic.id,
      clinicActive: clinic.isActive,
      hasConfig: Boolean(ai),
      aiEnabled: ai?.isEnabled ?? false,
      geminiConfigured: isGeminiConfigured(),
    });
    return { reply: FALLBACK_REPLY, escalated: false, toolCalls: [], usedFallback: true };
  }

  const patient = await prisma.patient.findUnique({
    where: { id: input.patientId },
    select: { name: true, phone: true, email: true, createdAt: true },
  });

  const promptClinic = {
    name: clinic.name,
    description: clinic.description,
    addressLine: clinic.addressLine,
    city: clinic.city,
    country: clinic.country,
    phone: clinic.phone,
    email: clinic.email,
    website: clinic.website,
    timezone: clinic.timezone,
    hours: clinic.hours,
    services: clinic.services.map((s) => ({
      id: s.id,
      name: s.name,
      durationMinutes: s.durationMinutes,
      price: s.priceMinor !== null ? `${s.currency ?? ''} ${(s.priceMinor / 100).toFixed(2)}`.trim() : null,
    })),
    doctors: clinic.doctors.map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
    })),
  };

  const systemInstruction = buildSystemPrompt({
    clinic: promptClinic,
    ai: {
      assistantName: ai.assistantName,
      greeting: ai.greeting,
      tone: ai.tone,
      personality: ai.personality,
      primaryLanguage: ai.primaryLanguage,
      supportedLanguages: ai.supportedLanguages,
      customInstructions: ai.customInstructions,
      escalationRules: ai.escalationRules,
    },
    settings: {
      minAdvanceBookingMinutes: clinic.settings?.minAdvanceBookingMinutes ?? 60,
      maxAdvanceBookingDays: clinic.settings?.maxAdvanceBookingDays ?? 60,
      cancellationCutoffHours: clinic.settings?.cancellationCutoffHours ?? 4,
      allowPatientCancellation: clinic.settings?.allowPatientCancellation ?? true,
      allowPatientReschedule: clinic.settings?.allowPatientReschedule ?? true,
      cancellationPolicy: clinic.settings?.cancellationPolicy ?? null,
      reschedulingPolicy: clinic.settings?.reschedulingPolicy ?? null,
    },
    now,
    patientName: patient?.name ?? null,
    isReturningPatient: Boolean(
      patient && now.getTime() - patient.createdAt.getTime() > 24 * 3_600_000,
    ),
  });

  // Replay history. Keep context small (max 8 messages) for fast token generation.
  const historyLimit = Math.min(ai.historyWindow || 6, 8);
  const history = await loadRecentMessages(input.conversationId, historyLimit);
  const contents: GeminiContent[] = history.map((m) =>
    m.direction === 'INBOUND' ? userText(m.body) : modelText(m.body),
  );
  if (contents.length === 0 || history[history.length - 1]?.direction !== 'INBOUND') {
    contents.push(userText(input.message));
  }

  const ctx: ToolContext = {
    clinicId: clinic.id,
    patientId: input.patientId,
    leadId: input.leadId,
    conversationId: input.conversationId,
    timezone: clinic.timezone,
    locale,
    now,
    idempotencySeed: input.idempotencySeed,
  };

  const trace: Array<{ name: string; ok: boolean }> = [];
  let escalated = false;
  let turnButtons: Array<{ id: string; title: string }> | undefined;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const isFinalRound = round === MAX_TOOL_ROUNDS - 1;
    console.log(`\n🤖 [AGENT] Round ${round}${isFinalRound ? ' (FINAL — tools withheld)' : ''} | model:`, ai.model);
    console.log('🤖 [AGENT] contents count:', contents.length);

    logger.debug(Events.AI_REQUEST, 'Calling Gemini', {
      clinicId: clinic.id,
      conversationId: input.conversationId,
      round,
      model: ai.model,
    });

    const result = await generateContent({
      model: ai.model,
      systemInstruction,
      contents,
      functionDeclarations: isFinalRound ? undefined : toolDeclarations,
      temperature: ai.temperature,
      maxOutputTokens: ai.maxOutputTokens,
    });

    console.log(`🤖 [AGENT] Round ${round} result: text=${result.text?.slice(0,80) ?? 'null'} | functionCalls:`, result.functionCalls.map(c => c.name), '| finishReason:', result.finishReason);
    console.log(`🤖 [AGENT] rawModelContent parts count:`, result.rawModelContent?.parts?.length ?? 0);

    if (result.functionCalls.length === 0) {
      const reply = result.text?.trim();
      if (reply) {
        console.log('✅ [AGENT] Agent produced a reply:', reply.slice(0, 120));
        logger.info(Events.AI_COMPLETED, 'Agent turn completed', {
          clinicId: clinic.id,
          conversationId: input.conversationId,
          rounds: round + 1,
          toolCalls: trace.length,
          ms: Date.now() - startedAt,
        });

        // If no tool buttons yet, extract buttons from options/numbered list or confirmation prompt
        if (!turnButtons) {
          // 1. Check for numbered list options (e.g. "1. Option A\n2. Option B\n3. Option C")
          const numberedLines = reply
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => /^\d+[\.\)]\s+.+/.test(line));

          if (numberedLines.length >= 2 && numberedLines.length <= 10) {
            turnButtons = numberedLines.map((line, idx) => {
              const cleanTitle = line
                .replace(/^\d+[\.\)]\s*/, '')
                .replace(/\*+/g, '')
                .replace(/\([^\)]*\)/g, '')
                .trim();
              return {
                id: `option_${idx + 1}`,
                title: cleanTitle.slice(0, 24) || `Option ${idx + 1}`,
              };
            });
          }

          // 2. Check if the reply is asking the user to confirm a booking
          if (!turnButtons) {
            const lower = reply.toLowerCase();
            if (
              (lower.includes('confirm') || lower.includes('shall i book') || lower.includes('ready to book') || lower.includes('تأكيد') || lower.includes('تاكيد')) &&
              (lower.includes('appointment') || lower.includes('slot') || lower.includes('booking') || lower.includes('موعد') || lower.includes('حجز'))
            ) {
              turnButtons = [
                { id: 'confirm_booking', title: locale === 'ar' ? '✅ تأكيد الموعد' : '✅ Confirm Booking' },
                { id: 'change_time', title: locale === 'ar' ? '🔄 اختيار وقت آخر' : '🔄 Change Time' },
                { id: 'cancel_booking', title: locale === 'ar' ? '❌ إلغاء' : '❌ Cancel' },
              ];
            }
          }
        }

        return { reply, escalated, toolCalls: trace, usedFallback: false, buttons: turnButtons };
      }
      console.log('🔴 [AGENT] Empty completion (no text, no function calls) — breaking loop');
      break;
    }

    for (const call of result.functionCalls) {
      console.log(`🤖 [AGENT] Executing tool: ${call.name} with args:`, JSON.stringify(call.args));
      if (result.rawModelContent && !contents.includes(result.rawModelContent)) {
        contents.push(result.rawModelContent);
      }
      const output = await executeTool(call.name, call.args, ctx);
      console.log(`🤖 [AGENT] Tool ${call.name} result:`, JSON.stringify(output).slice(0, 200));
      trace.push({ name: call.name, ok: output.ok !== false });
      if (call.name === 'escalate_to_human' && output.ok !== false) escalated = true;
      if (Array.isArray(output.buttons) && output.buttons.length > 0) {
        turnButtons = output.buttons as Array<{ id: string; title: string }>;
      }
      contents.push(functionResponse(call.name, output));
    }

    if (escalated) {
      console.log('🤖 [AGENT] Escalated to human — returning escalation acknowledgement');
      return {
        reply: ESCALATION_ACKNOWLEDGEMENT,
        escalated: true,
        toolCalls: trace,
        usedFallback: false,
      };
    }
  }

  console.log('🔴 [AGENT] Max rounds reached or empty completion — using fallback reply');
  logger.warn(Events.AI_FAILED, 'Agent produced no usable reply; using fallback', {
    clinicId: clinic.id,
    conversationId: input.conversationId,
    toolCalls: trace.length,
    ms: Date.now() - startedAt,
  });
  return { reply: FALLBACK_REPLY, escalated, toolCalls: trace, usedFallback: true };
}
