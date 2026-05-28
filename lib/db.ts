import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

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

const prismaClientSingleton = () => {
  const connectionString = getDatabaseUrl(process.env.DATABASE_URL);
  const pool = new Pool({
    connectionString,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = global as unknown as { prisma: PrismaClientSingleton };

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
