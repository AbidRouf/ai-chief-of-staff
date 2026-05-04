import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseCommand } from '@/lib/openai';

export async function POST(request) {
  try {
    const { command } = await request.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'No command provided' }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      include: { triage: true },
      orderBy: { timestamp: 'desc' },
    });

    const result = await parseCommand(command, messages);

    if (result.type === 'rule' && result.rule) {
      const newRule = await prisma.rule.create({
        data: {
          type: result.rule.type,
          condition: JSON.stringify(result.rule.condition),
          action: JSON.stringify(result.rule.action),
          naturalText: command,
        },
      });

      const updatedTriages = [];
      for (const msg of messages) {
        const condition = result.rule.condition;
        const action = result.rule.action;
        let fieldValue = '';

        if (condition.field === 'from') fieldValue = msg.sender || '';
        else if (condition.field === 'subject') fieldValue = msg.subject || '';
        else if (condition.field === 'body') fieldValue = msg.body || '';
        else if (condition.field === 'channel') fieldValue = msg.channel || '';

        const matches =
          condition.operator === 'contains'
            ? fieldValue.toLowerCase().includes(condition.value.toLowerCase())
            : condition.operator === 'equals'
            ? fieldValue.toLowerCase() === condition.value.toLowerCase()
            : false;

        if (matches && msg.triage && action.set_category) {
          const updated = await prisma.triage.update({
            where: { messageId: msg.id },
            data: {
              category: action.set_category,
              overriddenBy: 'rule',
            },
          });
          updatedTriages.push(updated);
        }
      }

      const allMessages = await prisma.message.findMany({
        include: { triage: true },
        orderBy: { timestamp: 'asc' },
      });
      const rules = await prisma.rule.findMany({ where: { active: true } });

      return NextResponse.json({
        type: 'rule',
        response: result.response,
        rule: newRule,
        updatedCount: updatedTriages.length,
        messages: allMessages,
        rules,
      });
    }

    if (result.type === 'action' && result.action) {
      const { messageId, newCategory, delegateTo } = result.action;

      if (messageId) {
        const triage = await prisma.triage.findUnique({ where: { messageId } });
        if (triage) {
          await prisma.triage.update({
            where: { messageId },
            data: {
              category: newCategory,
              overriddenBy: 'user',
              delegateTo: delegateTo || null,
            },
          });
        }
      }

      const allMessages = await prisma.message.findMany({
        include: { triage: true },
        orderBy: { timestamp: 'asc' },
      });

      return NextResponse.json({
        type: 'action',
        response: result.response,
        messages: allMessages,
      });
    }

    return NextResponse.json({
      type: 'query',
      response: result.response || result.answer,
      relatedMessageIds: result.relatedMessageIds || [],
    });
  } catch (error) {
    console.error('Command error:', error);
    return NextResponse.json(
      { error: 'Failed to process command', details: error.message },
      { status: 500 }
    );
  }
}
