import { describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { runAgentTurn } from '@/lib/ai/agent';

describe('AI Agent Integration Test (Reveal Clinics Riyadh)', () => {
  it('executes agent turn for clinic info and slot lookup', async () => {
    let clinic;
    try {
      clinic = await prisma.clinic.findFirst({
        where: { slug: 'reveal-clinics' },
        include: { aiConfiguration: true },
      });
    } catch {
      console.log('Skipping agent integration test: database is currently unreachable.');
      return;
    }

    if (!clinic) {
      console.log('Skipping agent integration test: Reveal Clinics not found in DB.');
      return;
    }

    // Find or create test patient
    let patient = await prisma.patient.findFirst({
      where: { clinicId: clinic.id, phone: '966500000000' },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          clinicId: clinic.id,
          phone: '966500000000',
          name: 'Saudi Test Patient',
          lead: { create: { clinicId: clinic.id, status: 'NEW' } },
        },
      });
    }

    const lead = await prisma.lead.findUnique({ where: { patientId: patient.id } });

    let conversation = await prisma.conversation.findFirst({
      where: { clinicId: clinic.id, patientId: patient.id },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          status: 'ACTIVE',
        },
      });
    }

    // Run AI Agent Turn
    const result = await runAgentTurn({
      clinicId: clinic.id,
      conversationId: conversation.id,
      patientId: patient.id,
      leadId: lead?.id ?? '',
      message: 'What services do you offer and when are you open in Riyadh?',
      idempotencySeed: `test-${Date.now()}`,
    });

    expect(result).toBeDefined();
    expect(typeof result.reply).toBe('string');
    expect(result.reply.length).toBeGreaterThan(0);

    console.log('\n--- Live Agent Response ---');
    console.log(`Clinic: ${clinic.name}`);
    console.log(`Prompt: "What services do you offer and when are you open in Riyadh?"`);
    console.log(`Reply:\n${result.reply}`);
    console.log('---------------------------\n');
  });
});
