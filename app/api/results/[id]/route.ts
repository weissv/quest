import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PATCH /api/results/[id] — update a single result's status
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    if (!status || !['approved', 'rejected', 'pending', 'review', 'interview'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved, rejected, pending, review, or interview.' },
        { status: 400 }
      );
    }

    const updated = await prisma.result.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update result' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/results/[id] — delete a single result
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.result.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete result' },
      { status: 500 }
    );
  }
}
