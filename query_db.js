const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://postgres:GG2kyLvcETx9r7PBGSNa1qNovMYxFx5nSKmih2TjlCgHVapJ0G4LPG6sWZytxRGY@185.217.131.26:5437/postgres"
    }
  }
});

async function main() {
  const results = await prisma.result.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const target = results.filter(r => {
    const code = r.familyCode || (r.answers && r.answers['0.1']);
    return code === 'F2026_ABC';
  });

  console.log("Found:", target.length);
  target.forEach(r => {
    console.log(`\nID: ${r.id} | Parent: ${r.parentRole} | SJT: ${r.sjtScore}`);
    console.log(`Status: ${r.status}`);
    console.log(`AI: ${JSON.stringify(r.aiAnalysis).substring(0, 200)}`);
  });
}

main().finally(() => prisma.$disconnect());
