# AI FAQ Chat

Next.js monorepo: FAQ-first chat with Groq AI fallback. SQLite stores FAQs; unmatched questions go to Groq (Llama).

## How to Run

```bash
# Install dependencies
npm install

# Create database (first time only)
sqlite3 db/faq.db < db/schema.sql

# Seed your about-me profile (so the AI can answer questions about you)
npm run seed-profile

# Development
npm run dev
# Open http://localhost:3000

# Production build
npm run build
npm start
```

## Env Vars

Create `.env.local` (or `.env`):

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes* | Groq API key ([console.groq.com](https://console.groq.com)) |
| `GROQ_MODEL` | No | Default: `llama-3.3-70b-versatile` |
| `GROQ_FALLBACK_ENABLED` | No | Set to `false` to disable AI fallback |
| `GROQ_TIMEOUT_MS` | No | Request timeout (default: 30000) |
| `ADMIN_PASSWORD` | Yes** | Password for `/admin` FAQ CRUD |

*Required for Groq AI fallback. If `GROQ_FALLBACK_ENABLED=false`, you can omit it.
**Required for admin access.

## Structure

```
app/           # Next.js App Router pages
components/    # React components (chat, admin)
hooks/         # useChat
lib/           # db, groqAI, config, errors
pages/api/     # API routes (chat, admin/faq)
services/      # chatService (API client)
types/         # Shared TypeScript types
db/            # SQLite schema
```

## Admin Dashboard

- `/dashboard` — Unified admin: Overview, Profile (about me), FAQs
- `/admin` — Redirects to `/dashboard?section=faq`
- Auth: `ADMIN_PASSWORD` for login
