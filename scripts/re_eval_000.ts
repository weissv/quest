import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

async function run() {
  console.log('Finding family 000...');
  // We need to find the result where answers['0.1'] == '000'
  const results = await prisma.result.findMany();
  const target = results.find(r => {
    const ans = r.answers as Record<string, string>;
    return ans['0.1'] === '000';
  });

  if (!target) {
    console.log('Family 000 not found!');
    return;
  }

  console.log(`Found result ID: ${target.id}`);
  const answers = target.answers as Record<string, string>;
  const sjtScore = target.sjtScore;

  const openAnswers = Object.entries(answers)
    .filter(([key]) => key.startsWith('B') || key.startsWith('C'))
    .map(([key, val]) => `Вопрос ${key}: ${val}`)
    .join('\n');

  if (openAnswers.length === 0) {
    console.log('No open answers for family 000.');
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No GEMINI_API_KEY');

  const genAI = new GoogleGenerativeAI(apiKey);
  const setting = await prisma.setting.findUnique({ where: { key: 'gemini_prompt' } });

  const defaultPrompt = `Ты — опытный клинический психолог...`; // simplified fallback
  const promptTemplate = setting?.value || defaultPrompt;
  const aiPrompt = promptTemplate.replace('{OPEN_ANSWERS}', openAnswers);

  console.log('Calling Gemini...');
  const model = genAI.getGenerativeModel({
    model: 'gemma-4-31b-it',
    generationConfig: { responseMimeType: 'application/json' },
  });

  let aiAnalysis: any = null;
  try {
    const result = await model.generateContent(aiPrompt);
    let responseText = result.response.text();
    console.log('RAW Gemini Response:', responseText);
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiAnalysis = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (err: any) {
    console.error('Gemini Error:', err);
    return;
  }

  console.log('Parsed AI Analysis:', aiAnalysis);

  let finalStatus = 'pending';
  if (sjtScore <= 4) finalStatus = 'rejected';
  else if (sjtScore >= 10) finalStatus = 'approved';
  else if (aiAnalysis) {
    const totalScore = sjtScore + (aiAnalysis.total_score || 0);
    if (totalScore >= 11) finalStatus = 'approved';
    else finalStatus = 'rejected';
    if (aiAnalysis.status === 'rejected') finalStatus = 'rejected';
  }

  await prisma.result.update({
    where: { id: target.id },
    data: {
      status: finalStatus,
      aiAnalysis: aiAnalysis || {},
    },
  });

  console.log(`Successfully updated family 000! Final status: ${finalStatus}`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
