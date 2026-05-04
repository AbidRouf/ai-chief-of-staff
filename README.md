# AI Chief of Staff

An intelligent triage system that processes a CEO's morning communications across email, Slack, and WhatsApp. Built with Next.js, OpenAI GPT-4o, and SQLite.

## What It Does

Every morning, a CEO receives 20+ messages across multiple channels. This system:

1. **Triages** every message as Decide (CEO must act), Delegate (assign to someone), or Ignore (safe to skip)
2. **Detects threads** across channels (e.g., same investor contacting via email and WhatsApp)
3. **Flags risks** like scheduling conflicts, contradictions, and production incidents
4. **Generates a daily briefing** readable in under 2 minutes
5. **Learns CEO preferences** through natural language rules

## Key Features

| Feature | Description |
|---------|-------------|
| **Cross-message intelligence** | All 20 messages processed in a single LLM context. Catches scheduling conflicts, contradictions, and escalations that per-message processing would miss. |
| **AI Command Bar** | Natural language interface for queries ("what did Mark send?"), rules ("flag all messages from James"), and actions ("delegate #4 to IT"). |
| **Drag-to-reclassify** | Drag messages between Decide/Delegate/Ignore. AI auto-drafts handoff messages when moving to Delegate. |
| **Persistent rules engine** | CEO preferences stored in SQLite. Rules like "always flag messages from Sarah" persist across sessions and re-apply on new data. |
| **Thread detection** | Links related messages across email, Slack, and WhatsApp into conversation threads. |
| **Delegation tracking** | Toggle delegated items between Pending and Done. |
| **Response approval** | Approve AI-drafted responses before sending. |
| **Deadline extraction** | AI pulls implicit deadlines from messages into a timeline view. |

## Quick Start

### Prerequisites
- Node.js 18+ 
- An OpenAI API key

### Setup (3 steps)

```bash
# 1. Clone and install
git clone <your-repo-url>
cd ai-chief-of-staff
npm install

# 2. Add your API key
cp .env.example .env.local
# Edit .env.local and add your OPENAI_API_KEY

# 3. Set up database and run
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Load Sample Data** to process the 20 sample messages.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
├──────────────┬──────────────────┬────────────────────────┤
│   Frontend   │   API Routes     │   Database             │
│              │                  │                        │
│  3-panel     │  /api/process    │  SQLite + Prisma       │
│  dashboard   │  /api/reclassify │                        │
│  + command   │  /api/command    │  Messages, Triage,     │
│  bar         │  /api/rules      │  Rules, Threads,       │
│              │  /api/triage     │  Flags, Briefings      │
└──────────────┴──────────────────┴────────────────────────┘
                        │
                   OpenAI GPT-4o
              (structured JSON output)
```

### Why one LLM call for all messages?

Most naive implementations triage each message individually. This misses critical cross-message intelligence:

- **Sarah Chen** contacts via email (#1) AND WhatsApp (#18) about the same Thursday meeting
- **James (COO)** contradicts himself: asks to push the board deck (#3), then reverses (#10)
- **Horizon project** has conflicting reports (#5 optimistic, #6 pessimistic) that resolve (#17)
- **API migration** (#2) escalates from routine update to production crisis (#9, #16)
- **Thursday 2pm** has a triple scheduling conflict across three messages

Processing all messages together lets the AI detect these patterns.

## Approach

### Design Philosophy

- **Functionality first**: Every requirement from the brief is explicitly implemented and tested
- **CEO-centric UX**: Minimal interaction needed. AI auto-drafts, auto-suggests, auto-detects
- **Production thinking**: SQLite persistence, error handling, session history, rule engine

### Design System

The UI uses a warm light theme (designed for a CEO reading at 7:30am, not an SRE at 2am):
- OKLCH color space for perceptually uniform colors
- Newsreader serif for headings (editorial warmth)
- System sans-serif for body text (clarity)
- No gradients, no glassmorphism, no dark mode by default

### Tech Choices

| Decision | Rationale |
|----------|-----------|
| **SQLite** over Postgres/Supabase | Zero setup for reviewer. Production would use Supabase for multi-user + real-time. |
| **Single LLM call** over per-message | Cross-message intelligence is the key differentiator |
| **Next.js App Router** | API routes + SSR + single deploy |
| **Vanilla CSS** over Tailwind | Full control over design system, OKLCH support |
| **HTML5 drag-and-drop** | No extra dependencies for reclassification |

## Assumptions

1. Messages arrive as a JSON array (production would integrate with Gmail/Slack/WhatsApp APIs)
2. CEO is the sole user (multi-user auth is a production feature)
3. Drafted responses are reviewed before sending (no auto-send)
4. Rules are additive (new rules don't retroactively change historical sessions)

## Future Features (Production Roadmap)

- **Live integrations**: Gmail, Slack, WhatsApp OAuth sign-in (integration modals already in UI)
- **Send responses**: Send approved drafts directly from the dashboard
- **Multi-user**: Different C-suite roles with role-based access
- **Calendar integration**: Auto-detect scheduling conflicts with live calendar data
- **Supabase migration**: Real-time sync, multi-device access
- **Mobile app**: React Native wrapper for on-the-go morning briefings

## Testing with New Data

To test with your own messages:

1. Create a JSON file matching the format in `data/messages.json`
2. Either upload it via the drag-and-drop zone, or replace the sample file
3. Existing rules will be applied to the new data automatically

Required fields per message:
```json
{
  "id": 1,
  "channel": "email|slack|whatsapp",
  "from": "sender name or email",
  "body": "message content",
  "timestamp": "2026-03-18T08:12:00Z",
  "to": "optional",
  "subject": "optional",
  "channel_name": "optional, for slack channels"
}
```

## Project Structure

```
├── prisma/schema.prisma     # Database schema
├── data/messages.json       # Sample data
├── src/
│   ├── app/
│   │   ├── globals.css      # Design system (OKLCH tokens)
│   │   ├── layout.js        # Root layout
│   │   ├── page.js          # Main page (upload → dashboard)
│   │   └── api/             # 5 API routes
│   ├── components/          # 11 React components
│   └── lib/
│       ├── openai.js        # LLM client + prompts
│       ├── db.js            # Prisma singleton
│       └── rules-engine.js  # Rule matching logic
```

## Built With

- [Next.js 16](https://nextjs.org/) (App Router + Turbopack)
- [OpenAI GPT-4o](https://openai.com/) (structured JSON output)
- [Prisma](https://www.prisma.io/) + SQLite
- Vanilla CSS with OKLCH color space
