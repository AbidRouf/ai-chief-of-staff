import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { processMessages } from '@/lib/openai';
import { applyRules } from '@/lib/rules-engine';
import { randomUUID } from 'crypto';

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const sessionId = randomUUID();

    const rules = await prisma.rule.findMany({ where: { active: true } });

    const result = await processMessages(messages, rules);

    const enrichedTriage = result.triage.map(t => {
      const msg = messages.find(m => m.id === t.id);
      return { ...t, _message: msg };
    });
    const finalTriage = applyRules(enrichedTriage, rules);

    for (const msg of messages) {
      await prisma.message.upsert({
        where: { id: msg.id },
        update: {
          channel: msg.channel,
          sender: msg.from,
          recipient: msg.to || null,
          subject: msg.subject || null,
          channelName: msg.channel_name || null,
          body: msg.body,
          timestamp: new Date(msg.timestamp),
          sessionId,
        },
        create: {
          id: msg.id,
          channel: msg.channel,
          sender: msg.from,
          recipient: msg.to || null,
          subject: msg.subject || null,
          channelName: msg.channel_name || null,
          body: msg.body,
          timestamp: new Date(msg.timestamp),
          sessionId,
        },
      });
    }

    for (const t of finalTriage) {
      const triageData = {
        category: t.category,
        originalCategory: t.originalCategory || t.category,
        urgency: t.urgency,
        reasoning: t.reasoning,
        delegateTo: t.delegateTo || null,
        draftedResponse: t.draftedResponse || '',
        deadline: t.deadline || null,
        overriddenBy: t.overriddenBy || null,
        sessionId,
      };

      await prisma.triage.upsert({
        where: { messageId: t.id },
        update: triageData,
        create: { messageId: t.id, ...triageData },
      });
    }

    if (result.threads) {
      for (const thread of result.threads) {
        await prisma.thread.create({
          data: {
            name: thread.name,
            messageIds: JSON.stringify(thread.messageIds),
            sessionId,
          },
        });
      }
    }

    if (result.flags) {
      for (const flag of result.flags) {
        await prisma.flag.create({
          data: {
            title: flag.title,
            severity: flag.severity,
            description: flag.description,
            relatedMessages: JSON.stringify(flag.relatedMessages),
            sessionId,
          },
        });
      }
    }

    if (result.briefing) {
      await prisma.briefing.create({
        data: {
          executiveSummary: result.briefing.executiveSummary,
          decisionsNeeded: JSON.stringify(result.briefing.decisionsNeeded),
          delegatedItems: JSON.stringify(result.briefing.delegatedItems),
          timeline: JSON.stringify(result.briefing.timeline),
          sessionId,
        },
      });
    }

    const savedMessages = await prisma.message.findMany({
      where: { sessionId },
      include: { triage: true },
      orderBy: { timestamp: 'asc' },
    });

    const threads = await prisma.thread.findMany({ where: { sessionId } });
    const flags = await prisma.flag.findMany({ where: { sessionId } });
    const briefing = await prisma.briefing.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });
    const activeRules = await prisma.rule.findMany({ where: { active: true } });

    return NextResponse.json({
      sessionId,
      messages: savedMessages,
      threads: threads.map(t => ({ ...t, messageIds: JSON.parse(t.messageIds) })),
      flags: flags.map(f => ({ ...f, relatedMessages: JSON.parse(f.relatedMessages) })),
      briefing: briefing ? {
        ...briefing,
        decisionsNeeded: JSON.parse(briefing.decisionsNeeded),
        delegatedItems: JSON.parse(briefing.delegatedItems),
        timeline: JSON.parse(briefing.timeline),
      } : null,
      rules: activeRules,
    });
  } catch (error) {
    console.error('Process error:', error);
    return NextResponse.json(
      { error: 'Failed to process messages', details: error.message },
      { status: 500 }
    );
  }
}
