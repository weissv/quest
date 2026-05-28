import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const questions = await prisma.question.findMany();
    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const questions = await request.json();
    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: 'Payload must be an array' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.question.deleteMany(),
      prisma.question.createMany({
        data: questions.map((q: any) => ({
          id: q.id,
          block: q.block,
          type: q.type,
          text: q.text,
          options: q.options || null,
          dependsOn: q.dependsOn || null,
          mirrorText: q.mirrorText || null,
          position: q.position || null,
        })),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update questions:', error);
    return NextResponse.json({ error: 'Failed to update questions due to server error' }, { status: 500 });
  }
}
