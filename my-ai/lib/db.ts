import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { FaqRow, FaqCreateInput, FaqUpdateInput } from "@/types/faq";

export type { FaqRow } from "@/types/faq";

// I allow multiple possible DB locations 
const candidatePaths = [
  path.join(process.cwd(), "db", "faq.db"),
  path.join(process.cwd(), "my-ai", "db", "faq.db"),
];
const dbPath = candidatePaths.find((p) => fs.existsSync(p));

// No database found, stop immediately.
if (!dbPath) {
  throw new Error(
    `SQLite DB not found. Looked in:\n- ${candidatePaths.join(
      "\n- "
    )}\n\nCreate it with:\n  sqlite3 db/faq.db < db/schema.sql\n(run from my-ai/)`
  );
}

// I keep a single database connection for the whole app.
const db = new Database(dbPath);

// Schema check on startup: ensure faq table exists.
function ensureSchema(): void {
  const exists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='faq'"
    )
    .get();
  if (!exists) {
    console.warn("[db] faq table missing, creating...");
    db.exec(`
      CREATE TABLE IF NOT EXISTS faq (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}
ensureSchema();

// This function tries to find the most relevant FAQ for a user question.
// I start with an exact match, then fall back to a partial match.
export function getFaqByQuestion(question: string): FaqRow | null {
  const q = question.trim();
  if (!q) return null;

  // Exact match first to avoid ambiguous answers.
  const direct = db
    .prepare("SELECT * FROM faq WHERE LOWER(question) = LOWER(?) LIMIT 1")
    .get(q) as FaqRow | undefined;

  if (direct) return direct;

  // Fallback match allows some flexibility in phrasing.
  const like = db
    .prepare("SELECT * FROM faq WHERE LOWER(question) LIKE LOWER(?) LIMIT 1")
    .get(`%${q}%`) as FaqRow | undefined;

  return like ?? null;
}


//CRUD Function....

// FAQ list for admin view, optional search filter
export function getAllFaqs(search?: string): FaqRow[] {
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    return db
      .prepare(
        `SELECT * FROM faq 
         WHERE LOWER(question) LIKE LOWER(?) 
            OR LOWER(answer) LIKE LOWER(?) 
            OR LOWER(COALESCE(category,'')) LIKE LOWER(?)
         ORDER BY created_at DESC, id DESC`
      )
      .all(term, term, term) as FaqRow[];
  }
  return db
    .prepare("SELECT * FROM faq ORDER BY created_at DESC, id DESC")
    .all() as FaqRow[];
}

// Single FAQ by id
export function getFaqById(id: number): FaqRow | null {
  const row = db
    .prepare("SELECT * FROM faq WHERE id = ? LIMIT 1")
    .get(id) as FaqRow | undefined;
  return row ?? null;
}

// Create new FAQ
export function createFaq(input: FaqCreateInput): number {
  const info = db
    .prepare("INSERT INTO faq (question, answer, category) VALUES (?, ?, ?)")
    .run(input.question.trim(), input.answer.trim(), input.category ?? null);

  return Number(info.lastInsertRowid);
}

// Update existing FAQ
export function updateFaq(id: number, input: FaqUpdateInput): number {
  const info = db
    .prepare("UPDATE faq SET question = ?, answer = ?, category = ? WHERE id = ?")
    .run(input.question.trim(), input.answer.trim(), input.category ?? null, id);

  return info.changes;
}

// Delete FAQ
export function deleteFaq(id: number): number {
  const info = db.prepare("DELETE FROM faq WHERE id = ?").run(id);
  return info.changes;
}
