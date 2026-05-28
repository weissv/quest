import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { createdAt: 'asc' }
    });
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

    const validQuestions = questions.filter((q: any) => 
      q && typeof q.block === 'string' && typeof q.type === 'string' && typeof q.text === 'string'
    );

    if (validQuestions.length === 0 && questions.length > 0) {
      return NextResponse.json({ error: 'No valid questions found in payload' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.question.deleteMany(),
      prisma.question.createMany({
        data: validQuestions.map((q: any) => ({
          id: q.id || undefined,
          code: q.code || null,
          cohort: q.cohort || null,
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
