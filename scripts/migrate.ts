import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs/promises';

function getDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  if (url.startsWith('prisma+postgres://')) {
    try {
      const parsedUrl = new URL(url);
      const apiKey = parsedUrl.searchParams.get('api_key');
      if (apiKey) {
        const decoded = Buffer.from(apiKey, 'base64').toString('utf-8');
        const config = JSON.parse(decoded);
        if (config.databaseUrl) {
          return config.databaseUrl;
        }
      }
    } catch (e) {
      console.error('Failed to parse prisma+postgres URL, using original:', e);
    }
  }
  return url;
}

const connectionString = getDatabaseUrl(process.env.DATABASE_URL);
const pool = new Pool({
  connectionString,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting data migration to PostgreSQL...');

  try {
    // 1. Migrate Questions
    const questionsPath = path.join(process.cwd(), 'data', 'db', 'questions.json');
    if (await fileExists(questionsPath)) {
      const qData = await fs.readFile(questionsPath, 'utf-8');
      const questions = JSON.parse(qData);
      console.log(`Found ${questions.length} questions. Migrating...`);
      for (const q of questions) {
        await prisma.question.upsert({
          where: { id: q.id },
          update: {
            block: q.block,
            type: q.type,
            text: q.text,
            options: q.options || null,
            dependsOn: q.dependsOn || null,
            mirrorText: q.mirrorText || null,
            position: q.position || null,
          },
          create: {
            id: q.id,
            block: q.block,
            type: q.type,
            text: q.text,
            options: q.options || null,
            dependsOn: q.dependsOn || null,
            mirrorText: q.mirrorText || null,
            position: q.position || null,
          },
        });
      }
    }

    // 2. Migrate Results
    const resultsPath = path.join(process.cwd(), 'data', 'db', 'results.json');
    if (await fileExists(resultsPath)) {
      const rData = await fs.readFile(resultsPath, 'utf-8');
      const results = JSON.parse(rData);
      console.log(`Found ${results.length} results. Migrating...`);
      for (const r of results) {
        await prisma.result.upsert({
          where: { id: r.id },
          update: {}, // We don't update existing results if they have the same ID
          create: {
            id: r.id,
            answers: r.answers || {},
            sjtScore: r.sjtScore || 0,
            status: r.status || 'pending',
            aiAnalysis: r.aiAnalysis || null,
            createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          },
        });
      }
    }

    // 3. Migrate Settings
    const settingsPath = path.join(process.cwd(), 'data', 'db', 'settings.json');
    if (await fileExists(settingsPath)) {
      const sData = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(sData);
      if (settings.aiPrompt) {
        await prisma.setting.upsert({
          where: { key: 'gemini_prompt' },
          update: { value: settings.aiPrompt },
          create: { key: 'gemini_prompt', value: settings.aiPrompt },
        });
        console.log('Migrated settings (gemini_prompt).');
      }
    }

    console.log('Migration completed successfully. You can now delete the `data/db/` JSON files.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function fileExists(filePath: string) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

main();
