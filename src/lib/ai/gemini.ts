import 'server-only';
import { env } from '@/env';
import { configurationError, integrationError } from '@/lib/errors';
import { logger, Events } from '@/lib/logger';

/**
 * AI Model Transport.
 *
 * Supports both Gemini Native API and OpenRouter API (OpenAI-compatible wire format).
 * Automatically detects OpenRouter when the key starts with `sk-or-` or model contains `/`.
 */

export type GeminiRole = 'user' | 'model';

export interface FunctionCall {
  name: string;
  args: Record<string, unknown>;
}

/** A single part as returned by the API — may include thought, text, functionCall, etc. */
export type GeminiPart = Record<string, unknown> & {
  text?: string;
  functionCall?: FunctionCall;
  functionResponse?: { name: string; response: Record<string, unknown> };
};

export interface GeminiContent {
  role: GeminiRole;
  parts: GeminiPart[];
}

/** OpenAPI-subset schema, as function declarations expect. */
export interface GeminiSchema {
  type: 'OBJECT' | 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY';
  description?: string;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  items?: GeminiSchema;
  enum?: string[];
  nullable?: boolean;
}

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters?: GeminiSchema;
}

export interface GenerateOptions {
  model: string;
  systemInstruction: string;
  contents: GeminiContent[];
  functionDeclarations?: FunctionDeclaration[];
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateResult {
  text: string | null;
  functionCalls: FunctionCall[];
  finishReason: string | null;
  usage?: { promptTokens?: number; responseTokens?: number };
  rawModelContent: GeminiContent | null;
}

interface NativeRawResponse {
  candidates?: Array<{
    content?: { role?: string; parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  error?: { message?: string; status?: string };
}

export const isGeminiConfigured = (): boolean =>
  Boolean(env.OPENROUTER_API_KEY || env.GEMINI_API_KEY);

export async function generateContent(options: GenerateOptions): Promise<GenerateResult> {
  const apiKey = env.OPENROUTER_API_KEY || env.GEMINI_API_KEY;
  if (!apiKey) {
    throw configurationError('OpenRouter API key is not configured. Set OPENROUTER_API_KEY.');
  }

  let model = options.model || env.GEMINI_MODEL || 'google/gemma-4-26b-a4b-it:free';
  if (!model.includes('/')) {
    model = `google/${model}`;
  }

  return generateOpenRouterContent(options, apiKey, model);
}

/**
 * Parses raw tool call strings emitted in text by some OpenRouter models, e.g.:
 * `<|tool_call>call:get_available_slots{from_date:"2026-08-19"}<tool_call|>`
 */
function parseRawToolCallInText(rawText: string | null | undefined): {
  text: string | null;
  toolCalls: FunctionCall[];
} {
  if (!rawText || (!rawText.includes('tool_call') && !rawText.includes('call:'))) {
    return { text: rawText ?? null, toolCalls: [] };
  }

  const calls: FunctionCall[] = [];
  let cleanedText = rawText;

  const regex = /<\|?tool_call\|?>\s*(?:call:)?(\w+)\s*(\{[\s\S]*?\})\s*<\|?tool_call\|?>?/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rawText)) !== null) {
    const fnName = match[1];
    if (!fnName) continue;
    const rawArgs = match[2] ?? '{}';
    let args: Record<string, unknown> = {};
    try {
      // Fix unquoted keys if present: {from_date:"2026-08-19"} -> {"from_date":"2026-08-19"}
      const formattedArgs = rawArgs.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      args = JSON.parse(formattedArgs);
    } catch {
      args = {};
    }
    calls.push({ name: fnName, args });
    cleanedText = cleanedText.replace(match[0], '').trim();
  }

  return { text: cleanedText.length > 0 ? cleanedText : null, toolCalls: calls };
}

function toJsonSchema(schema?: GeminiSchema): Record<string, unknown> {
  if (!schema) return { type: 'object', properties: {} };

  const rawType = (schema.type || 'OBJECT').toLowerCase();
  const result: Record<string, unknown> = {
    type: rawType,
  };

  if (schema.description) {
    result.description = schema.description;
  }

  if (rawType === 'object') {
    const props: Record<string, unknown> = {};
    if (schema.properties) {
      for (const [key, val] of Object.entries(schema.properties)) {
        props[key] = toJsonSchema(val);
      }
    }
    result.properties = props;
    if (schema.required && schema.required.length > 0) {
      result.required = schema.required;
    }
  } else if (rawType === 'array') {
    if (schema.items) {
      result.items = toJsonSchema(schema.items);
    }
  }

  if (schema.enum && schema.enum.length > 0) {
    result.enum = schema.enum;
  }

  return result;
}

/** OpenRouter (OpenAI-compatible Chat Completions format) */
async function generateOpenRouterContent(
  options: GenerateOptions,
  apiKey: string,
  model: string,
): Promise<GenerateResult> {
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const messages: Array<Record<string, unknown>> = [];
  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }

  const toolCallIds: Record<string, string> = {};

  for (const item of options.contents) {
    const role = item.role === 'model' ? 'assistant' : 'user';
    for (const part of item.parts) {
      if (typeof part.text === 'string' && part.text.length > 0) {
        messages.push({ role, content: part.text });
      } else if (part.functionCall) {
        const id = `call_${Math.random().toString(36).slice(2, 10)}`;
        toolCallIds[part.functionCall.name] = id;
        messages.push({
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id,
              type: 'function',
              function: {
                name: part.functionCall.name,
                arguments: JSON.stringify(part.functionCall.args ?? {}),
              },
            },
          ],
        });
      } else if (part.functionResponse) {
        const id = toolCallIds[part.functionResponse.name] || 'call_0';
        messages.push({
          role: 'tool',
          tool_call_id: id,
          name: part.functionResponse.name,
          content: JSON.stringify(part.functionResponse.response ?? {}),
        });
      }
    }
  }

  const tools = options.functionDeclarations?.map((fn) => ({
    type: 'function',
    function: {
      name: fn.name,
      description: fn.description,
      parameters: toJsonSchema(fn.parameters),
    },
  }));

  const candidateModels = [
    model,
    'openrouter/free',
  ];

  let raw = '';
  let lastStatus = 500;
  let succeeded = false;

  for (const currentModel of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const body: Record<string, unknown> = {
        model: currentModel,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxOutputTokens ?? 1024,
      };

      if (tools?.length) {
        body.tools = tools;
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), env.GEMINI_TIMEOUT_MS);

      let response: Response | null = null;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': env.APP_URL,
            'X-Title': 'AI Clinic Platform',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (error) {
        const isTimeout = error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'));
        const message = isTimeout
          ? `OpenRouter request timed out after ${env.GEMINI_TIMEOUT_MS}ms`
          : error instanceof Error
            ? error.message
            : 'network failure';
        console.log(`🔴 [OPENROUTER] ${message}`);
      } finally {
        clearTimeout(timer);
      }

      if (response && response.ok) {
        raw = await response.text();
        succeeded = true;
        break;
      }

      if (response) {
        lastStatus = response.status;
        const errText = await response.text();
        console.log(`⚠️ [OPENROUTER] Model ${currentModel} returned ${response.status} (attempt ${attempt + 1}):`, errText.slice(0, 250));

        // On 429: don't waste an attempt retrying same model, just try next candidate
        if (response.status === 429) {
          break;
        }

        // On other transient errors (500, 502, 503): retry once after short delay
        if ((response.status >= 500 || response.status === 408) && attempt === 0) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
      }

      // Non-retryable error — break attempt loop and try next candidate
      break;
    }

    if (succeeded) break;
  }

  if (!succeeded) {
    logger.error(Events.AI_FAILED, 'OpenRouter returned an error after retries', {
      model,
      status: lastStatus,
    });
    throw integrationError('The assistant is temporarily unavailable.');
  }

  let parsed: {
    choices?: Array<{
      finish_reason?: string;
      message?: {
        content?: string | null;
        tool_calls?: Array<{
          id?: string;
          function?: { name?: string; arguments?: string };
        }>;
      };
    }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw integrationError('OpenRouter returned an unreadable response.');
  }

  const choice = parsed.choices?.[0];
  const msg = choice?.message;
  let text = msg?.content ?? null;

  const functionCalls: FunctionCall[] = [];

  // 1. Native OpenAI tool_calls structure
  if (Array.isArray(msg?.tool_calls)) {
    for (const tc of msg.tool_calls) {
      if (tc.function?.name) {
        let args: Record<string, unknown> = {};
        try {
          args = typeof tc.function.arguments === 'string'
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments ?? {};
        } catch {
          args = {};
        }
        functionCalls.push({ name: tc.function.name, args });
      }
    }
  }

  // 2. Intercept raw `<|tool_call>...` text emitted by some models
  const parsedText = parseRawToolCallInText(text);
  text = parsedText.text;
  if (parsedText.toolCalls.length > 0) {
    functionCalls.push(...parsedText.toolCalls);
  }

  const rawParts: GeminiPart[] = [];
  if (text) {
    rawParts.push({ text });
  }
  for (const fc of functionCalls) {
    rawParts.push({ functionCall: fc });
  }

  const rawModelContent: GeminiContent | null = rawParts.length > 0
    ? { role: 'model', parts: rawParts }
    : null;

  return {
    text: text ? text.trim() : null,
    functionCalls,
    finishReason: choice?.finish_reason ?? null,
    usage: {
      promptTokens: parsed.usage?.prompt_tokens,
      responseTokens: parsed.usage?.completion_tokens,
    },
    rawModelContent,
  };
}

/** Gemini Native REST API */
async function generateNativeGeminiContent(
  options: GenerateOptions,
  apiKey: string,
  model: string,
): Promise<GenerateResult> {
  const url = `${env.GEMINI_API_BASE_URL}/models/${encodeURIComponent(model)}:generateContent`;

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: options.systemInstruction }] },
    contents: options.contents,
    generationConfig: {
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: options.maxOutputTokens ?? 1024,
    },
  };

  if (options.functionDeclarations?.length) {
    body.tools = [{ functionDeclarations: options.functionDeclarations }];
    body.toolConfig = { functionCallingConfig: { mode: 'AUTO' } };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.GEMINI_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    const isTimeout = error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'));
    const message = isTimeout
      ? `Request timed out after ${env.GEMINI_TIMEOUT_MS}ms`
      : error instanceof Error
        ? error.message
        : 'network failure';
    console.log(`🔴 [GEMINI] ${message}`);
    logger.error(Events.AI_FAILED, 'Gemini request failed', { model, message });
    throw integrationError('The assistant is temporarily unavailable.');
  } finally {
    clearTimeout(timer);
  }

  const raw = await response.text();
  if (!response.ok) {
    logger.error(Events.AI_FAILED, 'Gemini returned an error', {
      model,
      status: response.status,
      body: raw.slice(0, 500),
    });
    throw integrationError('The assistant is temporarily unavailable.');
  }

  let parsed: NativeRawResponse;
  try {
    parsed = JSON.parse(raw) as NativeRawResponse;
  } catch {
    throw integrationError('The assistant returned an unreadable response.');
  }

  if (parsed.promptFeedback?.blockReason) {
    logger.warn(Events.AI_FAILED, 'Gemini blocked the prompt', {
      model,
      reason: parsed.promptFeedback.blockReason,
    });
    return { text: null, functionCalls: [], finishReason: 'BLOCKED', rawModelContent: null };
  }

  const candidate = parsed.candidates?.[0];
  const parts = (candidate?.content?.parts ?? []) as GeminiPart[];

  const textChunks = parts
    .map((p) => p.text)
    .filter((t): t is string => typeof t === 'string' && t.length > 0);
  const functionCalls = parts
    .map((p) => p.functionCall)
    .filter((c): c is FunctionCall => Boolean(c?.name))
    .map((c) => ({ name: c!.name, args: c!.args ?? {} }));

  const rawModelContent: GeminiContent | null =
    candidate?.content?.parts && candidate.content.parts.length > 0
      ? { role: 'model', parts: parts }
      : null;

  return {
    text: textChunks.length > 0 ? textChunks.join('\n').trim() : null,
    functionCalls,
    finishReason: candidate?.finishReason ?? null,
    usage: {
      promptTokens: parsed.usageMetadata?.promptTokenCount,
      responseTokens: parsed.usageMetadata?.candidatesTokenCount,
    },
    rawModelContent,
  };
}

// --- Content helpers ------------------------------------------------------

export const userText = (text: string): GeminiContent => ({ role: 'user', parts: [{ text }] });

export const modelText = (text: string): GeminiContent => ({ role: 'model', parts: [{ text }] });

export const modelFunctionCall = (call: FunctionCall): GeminiContent => ({
  role: 'model',
  parts: [{ functionCall: call }],
});

export const functionResponse = (
  name: string,
  response: Record<string, unknown>,
): GeminiContent => ({
  role: 'user',
  parts: [{ functionResponse: { name, response } }],
});
