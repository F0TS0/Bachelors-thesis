import Database from "better-sqlite3";
import fs from "fs";
import path from "path";


//  DB schema
export type FaqRow = {
  id: number;
  question: string;
  answer: string;
  category: string | null;
  created_at: string;
};

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