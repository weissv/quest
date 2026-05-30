import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const families = ['Белов', 'Юсупов'];
  
  for (const code of families) {
    const results = await prisma.result.findMany({
      where: {
        familyCode: {
          contains: code,
          mode: 'insensitive'
        }
      }
    });
    console.log(`\n=== Family: ${code} ===`);
    for (const r of results) {
      console.log(`Role: ${r.parentRole}`);
      console.log(`Answers:`, JSON.stringify(r.answers));
      console.log(`AI Analysis:`, JSON.stringify(r.aiAnalysis));
      console.log(`AI Reasoning:`, r.aiReasoning);
      console.log('---------------------------');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
