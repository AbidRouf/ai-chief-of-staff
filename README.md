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
| **Thread detection** | Links related messages across email, Slack, and WhatsApp. Click thread pills to see all related messages in a dropdown. |
| **Delegation tracking** | Toggle delegated items between Pending and Done. Re-assign delegates inline. |
| **Response approval** | Approve AI-drafted responses before sending. Approved drafts locked with clear status banners. |
| **Deadline extraction** | AI pulls implicit deadlines ("by end of day", "before Friday") into a timeline view with friendly formatting. |
| **Dark mode** | Full light/dark theme toggle with warm-tinted OKLCH dark palette. |
| **Resizable panels** | Drag panel dividers to customize workspace layout (e.g., 70% messages, 30% briefing). |
| **Mobile responsive** | Tab-based navigation on phones. Tapping a message auto-switches to the detail view. |
| **Search** | Filter messages by sender, subject, or body text. |
| **Settings panel** | View/manage active rules, connect integrations, toggle appearance. |

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
├──────────────┴──────────────────┴────────────────────────┤
│  Middleware: API Rate Limiting (per-route, per-IP)       │
└─────────────────────────────────────────────────────────┘
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

## Security

### Implemented

| Layer | Implementation |
|-------|---------------|
| **API key protection** | OpenAI API key is server-side only (Next.js API routes). Never exposed to the browser. |
| **API rate limiting** | Per-route, per-IP rate limits via Next.js middleware. `/api/process`: 5/min, `/api/command`: 30/min. Returns 429 with `Retry-After` header. |
| **Input validation** | All API routes validate request body shape and types before processing. |
| **No raw SQL** | Prisma ORM prevents SQL injection. All database access goes through parameterized queries. |

### Production security roadmap

| Feature | Notes |
|---------|-------|
| **Authentication** | NextAuth.js with OAuth providers (Google, Microsoft). Required for multi-user. |
| **Row-level security** | When migrating to Supabase: RLS policies to ensure each CEO only sees their own messages, rules, and triage data. Policy example: `(auth.uid() = user_id)` on all tables. |
| **Redis rate limiting** | Replace in-memory rate limiter with `@upstash/ratelimit` for distributed environments. |
| **CORS** | Lock `Access-Control-Allow-Origin` to the production domain. |
| **CSP headers** | Content Security Policy to prevent XSS. |
| **Audit logging** | Log all rule creation/deletion, triage overrides, and approval actions. |

## Approach

### Design Philosophy

- **Functionality first**: Every requirement from the brief is explicitly implemented and tested
- **CEO-centric UX**: Minimal interaction needed. AI auto-drafts, auto-suggests, auto-detects
- **Production thinking**: SQLite persistence, error handling, session history, rule engine

### Design System

The UI uses a warm light theme (designed for a CEO reading at 7:30am, not an SRE at 2am), with a full dark mode toggle:
- OKLCH color space for perceptually uniform colors
- Warm-tinted dark mode (amber hue 60) rather than cold blue
- Newsreader serif for headings (editorial warmth)
- System sans-serif for body text (clarity)
- Tab-based mobile navigation at 768px breakpoint

### Tech Choices

| Decision | Rationale |
|----------|-----------| 
| **SQLite** over Postgres/Supabase | Zero setup for reviewer. Production would use Supabase for multi-user + real-time + RLS. |
| **Single LLM call** over per-message | Cross-message intelligence is the key differentiator |
| **Next.js App Router** | API routes + SSR + single deploy |
| **Vanilla CSS** over Tailwind | Full control over design system, OKLCH support |
| **HTML5 drag-and-drop** | No extra dependencies for reclassification |
| **In-memory rate limiting** | Zero dependencies. Production uses Redis. |

## Assumptions

1. Messages arrive as a JSON array (production would integrate with Gmail/Slack/WhatsApp APIs)
2. CEO is the sole user (multi-user auth is a production feature)
3. Drafted responses are reviewed before sending (no auto-send)
4. Rules are additive (new rules don't retroactively change historical sessions)

## Future Features (Production Roadmap)

- **Live integrations**: Gmail, Slack, WhatsApp OAuth sign-in (integration modals already in UI)
- **Historical days**: Navigate between days to review past triage sessions and trends
- **Send responses**: Send approved drafts directly from the dashboard
- **Multi-user**: Different C-suite roles with role-based access + row-level security
- **Calendar integration**: Auto-detect scheduling conflicts with live calendar data
- **Supabase migration**: Real-time sync, multi-device access, RLS
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
├── public/data/messages.json # Sample data (20 messages)
├── src/
│   ├── middleware.js         # API rate limiting
│   ├── app/
│   │   ├── globals.css      # Design system (OKLCH tokens, mobile)
│   │   ├── layout.js        # Root layout
│   │   ├── page.js          # Main page (upload → dashboard)
│   │   └── api/             # 5 API routes
│   ├── components/          # 11 React components
│   └── lib/
│       ├── openai.js        # LLM client + prompts
│       ├── db.js            # Prisma singleton
│       ├── rate-limit.js    # Rate limiter utility
│       └── rules-engine.js  # Rule matching logic
```

## Built With

- [Next.js 16](https://nextjs.org/) (App Router + Turbopack)
- [OpenAI GPT-4o](https://openai.com/) (structured JSON output)
- [Prisma](https://www.prisma.io/) + SQLite
- Vanilla CSS with OKLCH color space
