import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function processMessages(messages, rules = []) {
  const rulesContext = rules.length > 0
    ? `\n\nCEO PERSISTENT RULES (always apply these):\n${rules.map((r, i) => `${i + 1}. ${r.naturalText}`).join('\n')}`
    : '';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: getTriageSystemPrompt() + rulesContext,
      },
      {
        role: 'user',
        content: `Here are the CEO's 20 morning messages. Process all of them:\n\n${JSON.stringify(messages, null, 2)}`,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function reclassifyMessage(message, oldCategory, newCategory, allMessages = []) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: getReclassifyPrompt(),
      },
      {
        role: 'user',
        content: JSON.stringify({
          message,
          oldCategory,
          newCategory,
          contextMessages: allMessages.slice(0, 5),
        }),
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function parseCommand(command, existingMessages = []) {
  const messageSummaries = existingMessages.map(m => ({
    id: m.id,
    from: m.sender,
    channel: m.channel,
    subject: m.subject,
    preview: m.body.substring(0, 100),
    timestamp: m.timestamp,
  }));

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: getCommandPrompt(),
      },
      {
        role: 'user',
        content: JSON.stringify({
          command,
          availableMessages: messageSummaries,
        }),
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content);
}

function getTriageSystemPrompt() {
  return `You are an AI Chief of Staff for a CEO. You receive all morning communications and must process them intelligently.

YOUR TASKS:
1. TRIAGE each message as: "decide" (CEO must personally act), "delegate" (assign to someone with a handoff), or "ignore" (safe to skip)
2. DETECT THREADS: group related messages into conversation threads
3. FLAG anything the CEO should know about (risks, conflicts, deadlines, contradictions)
4. GENERATE a daily briefing readable in under 2 minutes

CRITICAL — CROSS-MESSAGE INTELLIGENCE:
- Cross-reference ALL messages. Messages are interconnected.
- Identify scheduling conflicts across channels (same time slot mentioned in different messages)
- Detect contradictions (someone says one thing, then reverses it)
- Track escalating situations across multiple messages
- Note when the same person contacts through different channels
- Extract implicit deadlines ("by end of day", "before Friday", "within 24 hours")

TRIAGE GUIDELINES:
- DECIDE: investor relations, production emergencies, contract negotiations, strategic decisions only the CEO can make
- DELEGATE: routine updates that need a response, HR matters with clear owners, operational tasks
- IGNORE: spam, phishing, newsletters, FYI-only updates that need no response, personal messages
- For phishing/spam: still FLAG it so IT security is aware, but categorize as ignore

FOR EACH MESSAGE provide:
- category: decide/delegate/ignore
- urgency: 1-5 (5 = most urgent)
- reasoning: one sentence explaining why
- delegateTo: person or role (null if not delegate)
- draftedResponse: contextually appropriate response draft
- deadline: extracted deadline if any (null otherwise)
- flags: array of flag keywords if flagworthy

Return this exact JSON structure:
{
  "triage": [
    {
      "id": <message_id>,
      "category": "decide|delegate|ignore",
      "urgency": 1-5,
      "reasoning": "...",
      "delegateTo": "name/role or null",
      "drafted_responses": ["Option 1...", "Option 2..."],
      "deadline": "deadline string or null",
      "flags": ["flag_keyword"]
    }
  ],
  "threads": [
    {
      "name": "Thread name",
      "messageIds": [1, 2, 3],
      "summary": "Brief thread summary"
    }
  ],
  "flags": [
    {
      "title": "Short flag title",
      "severity": "critical|warning|info",
      "description": "What the CEO needs to know",
      "relatedMessages": [1, 2]
    }
  ],
  "briefing": {
    "executiveSummary": "2-3 sentence overview of the morning",
    "decisionsNeeded": [
      {
        "title": "...",
        "description": "...",
        "messageIds": [1],
        "deadline": "..."
      }
    ],
    "delegatedItems": [
      {
        "task": "...",
        "assignedTo": "...",
        "messageIds": [1]
      }
    ],
    "timeline": [
      {
        "timeframe": "NOW|TODAY|THIS WEEK",
        "item": "...",
        "messageIds": [1]
      }
    ]
  }
}`;
}

function getReclassifyPrompt() {
  return `A CEO has manually reclassified a message in their AI triage system.

Given the message, its old category, and its new category, provide:
1. If new category is "delegate": suggest WHO should handle it and draft a brief handoff message
2. If new category is "decide": draft a response for the CEO
3. If new category is "ignore": confirm it's safe to ignore
4. Updated reasoning for the new category

Return JSON:
{
  "delegateTo": "person/role or null",
  "drafted_responses": [
    "Option 1: Draft response agreeing/confirming",
    "Option 2: Draft response pushing back/declining"
  ],
  "reasoning": "why this category makes sense",
  "urgency": 1-5
}`;
}

function getCommandPrompt() {
  return `You are parsing a CEO's natural language input in their AI triage system. The input can be one of three types:

1. QUERY: asking about messages ("what did Mark send?", "summarize the Horizon situation")
2. RULE: setting a persistent preference ("flag all messages from James", "always delegate newsletters to EA", "put tom's messages to ignore")
3. ACTION: reclassifying a specific message ("delegate message 4 to IT security")

CRITICAL FOR RULES:
- When the user references a person with pronouns ("his", "her", "their") or context-dependent references, you MUST resolve them to the actual sender name from the available messages. For example, if the previous query was about "Tom" and the user says "put all his messages to ignore", the condition.value should be "tom" NOT "his" or "the specified sender".
- The condition.value must be a concrete, matchable string (a name, keyword, or channel name).
- Always use "contains" operator for sender matching so partial matches work (e.g., "tom" matches "tom.bradley").

Determine the type and respond accordingly.

For QUERY: search the available messages and answer the question.
For RULE: parse into a structured rule with a clear human-readable description.
For ACTION: identify the message and new category.

Return JSON:
{
  "type": "query|rule|action",
  "response": "human-readable confirmation or answer",
  
  // For QUERY:
  "answer": "detailed answer to the question",
  "relatedMessageIds": [1, 2],
  
  // For RULE:
  "rule": {
    "type": "sender_priority|keyword_flag|channel_filter|category_override",
    "condition": {"field": "from|subject|body|channel", "operator": "contains|equals", "value": "the actual resolved name/keyword, never pronouns"},
    "action": {"set_category": "decide|delegate|ignore", "flag": true, "flag_reason": "..."},
    "description": "A clear one-sentence summary like: Always ignore messages from Tom Bradley"
  },
  
  // For ACTION:
  "action": {
    "messageId": 4,
    "newCategory": "delegate",
    "delegateTo": "IT Security"
  }
}`; 
}

export default openai;
