import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { reclassifyMessage } from '@/lib/openai';

export async function POST(request) {
  try {
    const { messageId, newCategory } = await request.json();

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { triage: true },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const oldCategory = message.triage?.category || 'ignore';

    const result = await reclassifyMessage(
      { id: message.id, from: message.sender, channel: message.channel, subject: message.subject, body: message.body },
      oldCategory,
      newCategory
    );

    const updated = await prisma.triage.update({
      where: { messageId },
      data: {
        category: newCategory,
        originalCategory: message.triage?.originalCategory || oldCategory,
        overriddenBy: 'user',
        delegateTo: result.delegateTo || null,
        draftedResponse: result.draftedResponse || message.triage?.draftedResponse || '',
        reasoning: result.reasoning || message.triage?.reasoning || '',
        urgency: result.urgency || message.triage?.urgency || 3,
      },
    });

    return NextResponse.json({ triage: updated });
  } catch (error) {
    console.error('Reclassify error:', error);
    return NextResponse.json(
      { error: 'Failed to reclassify', details: error.message },
      { status: 500 }
    );
  }
}
