import 'dotenv/config';

function toJsonSchema(schema: any): Record<string, unknown> {
  if (!schema) return { type: 'object', properties: {} };
  const rawType = (schema.type || 'OBJECT').toLowerCase();
  const result: Record<string, unknown> = { type: rawType };
  if (schema.description) result.description = schema.description;

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
  } else if (rawType === 'array' && schema.items) {
    result.items = toJsonSchema(schema.items);
  }

  if (schema.enum && schema.enum.length > 0) result.enum = schema.enum;
  return result;
}

async function runTest() {
  console.log('====================================================');
  console.log('🤖 TESTING OPENROUTER CONNECTION & MODEL RESPONSE');
  console.log('====================================================\n');

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  const primaryModel = process.env.GEMINI_MODEL || 'google/gemma-4-26b-a4b-it:free';

  if (!apiKey) {
    console.error('❌ ERROR: OPENROUTER_API_KEY is not set in your .env file!');
    process.exit(1);
  }

  console.log(`🔑 API Key detected: ${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`);
  console.log(`🎯 Primary Model: ${primaryModel}\n`);

  const modelsToTest = [
    primaryModel,
    'openrouter/free',
    'meta-llama/llama-3.1-8b-instruct:free',
  ];

  // Test 1: Simple chat completion in English and Arabic
  console.log('--- Test 1: Text Generation (English & Arabic) ---');
  let successModel = '';

  for (const model of modelsToTest) {
    process.stdout.write(`⏳ Trying model ${model}... `);
    const start = Date.now();
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'Clinic AI Platform',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful medical clinic AI assistant.',
            },
            {
              role: 'user',
              content: 'Hello! Please reply in one short sentence in English and Arabic saying you are ready to help patients.',
            },
          ],
          temperature: 0.3,
          max_tokens: 150,
        }),
      });

      const elapsed = Date.now() - start;
      const data: any = await response.json();

      if (response.ok && data.choices?.[0]?.message?.content) {
        console.log(`✅ SUCCESS (${elapsed}ms)`);
        console.log(`📝 Output:\n${data.choices[0].message.content.trim()}\n`);
        successModel = model;
        break;
      } else {
        console.log(`⚠️ Status ${response.status}: ${JSON.stringify(data?.error || data).slice(0, 150)}`);
      }
    } catch (err: any) {
      console.log(`❌ Network Error: ${err.message}`);
    }
  }

  // Test 2: Tool calling / Function Declarations
  console.log('--- Test 2: Tool Calling Schema Validation ---');
  const toolDeclarations = [
    {
      name: 'get_available_slots',
      description: 'Search for available clinic appointment slots.',
      parameters: {
        type: 'OBJECT',
        properties: {
          service_name: { type: 'STRING', description: 'Name of the service' },
          date: { type: 'STRING', description: 'Target date YYYY-MM-DD' },
        },
        required: ['date'],
      },
    },
  ];

  const tools = toolDeclarations.map((fn) => ({
    type: 'function',
    function: {
      name: fn.name,
      description: fn.description,
      parameters: toJsonSchema(fn.parameters),
    },
  }));

  const testModel = successModel || primaryModel;
  console.log(`⏳ Testing tool call on ${testModel}...`);
  const startTool = Date.now();

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'Clinic AI Platform',
      },
      body: JSON.stringify({
        model: testModel,
        messages: [
          {
            role: 'system',
            content: 'You are a clinic assistant. If a user asks for slots, call get_available_slots.',
          },
          {
            role: 'user',
            content: 'Please check available slots for tomorrow 2026-08-25 for Laser Treatment.',
          },
        ],
        tools,
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    const elapsedTool = Date.now() - startTool;
    const data: any = await response.json();

    if (response.ok) {
      console.log(`✅ Tool Call Request Accepted (${elapsedTool}ms)`);
      const msg = data.choices?.[0]?.message;
      if (msg?.tool_calls && msg.tool_calls.length > 0) {
        console.log(`🛠️ Tool Calls Returned:`);
        console.log(JSON.stringify(msg.tool_calls, null, 2));
      } else {
        console.log(`📝 Model Replied with Text: ${msg?.content}`);
      }
    } else {
      console.log(`⚠️ Status ${response.status}: ${JSON.stringify(data?.error || data)}`);
    }
  } catch (err: any) {
    console.log(`❌ Tool Call Network Error: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log('🎉 OpenRouter Diagnostic Complete!');
  console.log('====================================================');
}

runTest().catch(console.error);
