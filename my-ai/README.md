# AI FAQ Chat

Next.js monorepo: FAQ-first chat with Vertex AI fallback. SQLite stores FAQs; unmatched questions go to Google Vertex AI (Gemini).

## How to Run

```bash
# Install dependencies
npm install

# Create database (first time only)
sqlite3 db/faq.db < db/schema.sql

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
| `GOOGLE_CLOUD_PROJECT` | Yes* | GCP project ID for Vertex AI |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes* | Path to service account JSON key |
| `VERTEX_LOCATION` | No | Default: `us-central1` |
| `VERTEX_MODEL` | No | Default: `gemini-1.0-pro` |
| `VERTEX_FALLBACK_ENABLED` | No | Set to `false` to disable AI fallback |
| `VERTEX_TIMEOUT_MS` | No | Request timeout (default: 30000) |
| `VERTEX_MAX_RETRIES` | No | Retries on failure (default: 2) |
| `ADMIN_PASSWORD` | Yes** | Password for `/admin` FAQ CRUD |

*Required for Vertex AI fallback. If `VERTEX_FALLBACK_ENABLED=false`, you can omit these.
**Required for admin access.

## Structure

```
app/           # Next.js App Router pages
components/    # React components (chat, admin)
hooks/         # useChat
lib/           # db, googleAI, config, errors
pages/api/     # API routes (chat, admin/faq)
services/      # chatService (API client)
types/         # Shared TypeScript types
db/            # SQLite schema
```

## Admin

- `/admin` — FAQ CRUD (list, search, create, edit, delete)
- Auth: `x-admin-password` header must match `ADMIN_PASSWORD`
