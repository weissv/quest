import { NextResponse } from 'next/server';
import { getQuestions, saveQuestions } from '@/lib/db';

export async function GET() {
  const questions = await getQuestions();
  return NextResponse.json(questions);
}

export async function PUT(req: Request) {
  try {
    const questions = await req.json();
    await saveQuestions(questions);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
  }
}
