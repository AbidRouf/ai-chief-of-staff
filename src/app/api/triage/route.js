import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(request) {
  try {
    const { messageId, approved, delegateStatus, category, urgency } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    const data = {};
    if (typeof approved === 'boolean') data.approved = approved;
    if (delegateStatus) data.delegateStatus = delegateStatus;
    if (category && ['decide', 'delegate', 'ignore'].includes(category)) {
      data.category = category;
      data.overriddenBy = 'user';
    }
    if (typeof urgency === 'number' && urgency >= 1 && urgency <= 5) {
      data.urgency = urgency;
    }

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
