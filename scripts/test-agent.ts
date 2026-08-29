import { PrismaClient } from '@prisma/client';
import { runAgentTurn } from '../src/lib/ai/agent';
import { isGeminiConfigured } from '../src/lib/ai/gemini';

const prisma = new PrismaClient();

async function main() {
  const userQuery = process.argv[2] || 'Hello! What services do you offer and when are you open?';

  console.log('\n======================================================');
  console.log('🤖 testing Clinic AI Agent Loop (Saudi Arabia / Reveal Clinics)');
  console.log('======================================================\n');

  const geminiReady = isGeminiConfigured();
  if (!geminiReady) {
    console.log('⚠️  NOTE: GEMINI_API_KEY is not set in .env.');
    console.log('   The agent will run in fallback/rule-matching mode.');
    console.log('   To test real Gemini LLM responses, add GEMINI_API_KEY=your_key in .env\n');
  } else {
    console.log('✅ GEMINI_API_KEY detected! Testing live Gemini 2.5 Flash Model.\n');
  }

  // Find Reveal Clinics Riyadh
  const clinic = await prisma.clinic.findFirst({
    where: { slug: 'reveal-clinics' },
    include: { aiConfiguration: true, services: true, doctors: true },
  });

  if (!clinic) {
    console.error('❌ Clinic "reveal-clinics" not found. Run "npx tsx prisma/seed.ts" first.');
    process.exit(1);
  }

  // Ensure AI is enabled
  if (!clinic.aiConfiguration?.isEnabled) {
    await prisma.aIConfiguration.update({
      where: { clinicId: clinic.id },
      data: { isEnabled: true },
    });
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
        name: 'Test Patient (Saudi Arabia)',
        lead: { create: { clinicId: clinic.id, status: 'NEW' } },
      },
    });
  }

  const lead = await prisma.lead.findUnique({ where: { patientId: patient.id } });

  // Find or create conversation
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

  console.log(`🏥 Clinic: ${clinic.name} (${clinic.timezone})`);
  console.log(`👤 Patient: ${patient.name} (${patient.phone})`);
  console.log(`💬 Patient Prompt: "${userQuery}"\n`);
  console.log('⏳ Running Agent Turn...\n');

  const result = await runAgentTurn({
    clinicId: clinic.id,
    conversationId: conversation.id,
    patientId: patient.id,
    leadId: lead?.id ?? '',
    message: userQuery,
    idempotencySeed: `test-${Date.now()}`,
  });

  console.log('------------------ AGENT RESULT ------------------');
  console.log(`🤖 AI Reply:\n\n${result.reply}\n`);
  console.log(`🛠️  Tools Executed:`, result.toolCalls.length === 0 ? 'None' : result.toolCalls);
  console.log(`⚠️  Escalated to Human:`, result.escalated ? 'Yes' : 'No');
  console.log(`⚡ Used Fallback Mode:`, result.usedFallback ? 'Yes' : 'No');
  console.log('--------------------------------------------------\n');
}

main()
  .catch((err) => {
    console.error('Agent test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
