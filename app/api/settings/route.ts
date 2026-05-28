import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'gemini_prompt' } });
    return NextResponse.json({ aiPrompt: setting?.value || '' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { aiPrompt } = await request.json();
    if (typeof aiPrompt !== 'string') {
      return NextResponse.json({ error: 'aiPrompt must be a string' }, { status: 400 });
    }

    await prisma.setting.upsert({
      where: { key: 'gemini_prompt' },
      update: { value: aiPrompt },
      create: { key: 'gemini_prompt', value: aiPrompt },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save prompt:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
