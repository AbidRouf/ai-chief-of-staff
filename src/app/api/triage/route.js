import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(request) {
  try {
    const { messageId, approved, delegateStatus } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    const data = {};
    if (typeof approved === 'boolean') data.approved = approved;
    if (delegateStatus) data.delegateStatus = delegateStatus;

    const updated = await prisma.triage.update({
      where: { messageId },
      data,
    });

    return NextResponse.json({ triage: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update triage', details: error.message },
      { status: 500 }
    );
  }
}
