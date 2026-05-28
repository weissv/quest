import { NextResponse } from 'next/server';
import { getResults, saveResults } from '@/lib/db';

export async function GET() {
  const results = await getResults();
  return NextResponse.json(results);
}

export async function PUT(request: Request) {
  try {
    const updatedResults = await request.json();
    await saveResults(updatedResults);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update results' }, { status: 500 });
  }
}
