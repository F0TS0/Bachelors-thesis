/**
 * Database layer - SQLite (better-sqlite3)
 *
 * Tables: faq (Q&A), profile (about me content).
 * Connects to faq.db; creates tables if missing.
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { FaqRow, FaqCreateInput, FaqUpdateInput } from "@/types/faq";

export type { FaqRow } from "@/types/faq";

/** Possible locations for faq.db (monorepo-aware) */
const candidatePaths = [
  path.join(process.cwd(), "db", "faq.db"),
  path.join(process.cwd(), "my-ai", "db", "faq.db"),
];
const dbPath = candidatePaths.find((p) => fs.existsSync(p));

// Fail fast if DB file not found
if (!dbPath) {
  throw new Error(
    `SQLite DB not found. Looked in:\n- ${candidatePaths.join(
      "\n- "
    )}\n\nCreate it with:\n  sqlite3 db/faq.db < db/schema.sql\n(run from my-ai/)`
  );
}

const db = new Database(dbPath);

/** Ensure faq and profile tables exist; create if missing */
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
  const profileExists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='profile'"
    )
    .get();
  if (!profileExists) {
    console.warn("[db] profile table missing, creating...");
    db.exec(`
      CREATE TABLE IF NOT EXISTS profile (
        key TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}
ensureSchema();

/** Get "about me" content used as AI context (profile key "about") */
export function getAboutMe(): string | null {
  const row = db
    .prepare("SELECT content FROM profile WHERE key = ? LIMIT 1")
    .get("about") as { content: string } | undefined;
  return row?.content?.trim() ?? null;
}

/** Insert or update profile content by key (e.g. "about") */
export function updateProfile(key: string, content: string): void {
  db.prepare(
    `INSERT INTO profile (key, content, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET content = ?, updated_at = datetime('now')`
  ).run(key, content.trim(), content.trim());
}

/** Find FAQ by question: exact match first, then partial (LIKE) */
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


/** List FAQs with optional search across question, answer, category */
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

/** Get single FAQ by id */
export function getFaqById(id: number): FaqRow | null {
  const row = db
    .prepare("SELECT * FROM faq WHERE id = ? LIMIT 1")
    .get(id) as FaqRow | undefined;
  return row ?? null;
}

/** Create new FAQ; returns inserted id */
export function createFaq(input: FaqCreateInput): number {
  const info = db
    .prepare("INSERT INTO faq (question, answer, category) VALUES (?, ?, ?)")
    .run(input.question.trim(), input.answer.trim(), input.category ?? null);

  return Number(info.lastInsertRowid);
}

/** Update FAQ by id; returns number of rows changed */
export function updateFaq(id: number, input: FaqUpdateInput): number {
  const info = db
    .prepare("UPDATE faq SET question = ?, answer = ?, category = ? WHERE id = ?")
    .run(input.question.trim(), input.answer.trim(), input.category ?? null, id);

  return info.changes;
}

/** Delete FAQ by id; returns number of rows deleted */
export function deleteFaq(id: number): number {
  const info = db.prepare("DELETE FROM faq WHERE id = ?").run(id);
  return info.changes;
}
