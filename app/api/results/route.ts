import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const results = await prisma.result.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load results' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // Results are generated via /api/evaluate and should not be bulk-replaced
  return NextResponse.json({ error: 'Bulk update of results is disabled' }, { status: 403 });
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const familyCode = searchParams.get('familyCode');
    if (!familyCode) {
      return NextResponse.json({ error: 'Missing familyCode' }, { status: 400 });
    }
    
    await prisma.result.deleteMany({
      where: { familyCode },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete family results' },
      { status: 500 }
    );
  }
}
