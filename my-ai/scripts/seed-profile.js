/**
 * Seeds the profile/about-me content into SQLite.
 * Run from my-ai/: node scripts/seed-profile.js
 */

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "../db/faq.db");
if (!fs.existsSync(dbPath)) {
  console.error("DB not found at", dbPath);
  process.exit(1);
}

const db = new Database(dbPath);

// Ensure profile table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS profile (
    key TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

const aboutContent = `Regor Fotso (preferred name: Fotso). Based in Tallinn, Estonia. Infrastructure Engineer / MS SQL Database Engineer (Platform DBA) at Swedbank since August 2025. Background in Site Reliability Engineering (~3–3.5 years at Eesti Energia) and earlier IT Help Desk experience (~1.5 years). Works with enterprise MSSQL environments: Always On Availability Groups, WSFC clusters, listener and endpoint troubleshooting, compatibility management, encryption checks, automation with PowerShell and T-SQL, production support, and structured operational communication in regulated banking systems.

Currently studying Web Technologies at Estonian Entrepreneurship University of Applied Sciences (Mainor). Writing a thesis on an AI-powered FAQ/chatbot system (Next.js full-stack architecture, API-based logic, database-backed knowledge, LLM integration). Interested in IT law / cyber-law for future master's studies. Strong preference for structured systems, clean architecture, and automation-driven solutions.

Entrepreneurial background includes co-founding the watch brand "Après Hier" (luxury-meets-Y2K aesthetic, mechanical watches, limited drops, e-commerce strategy, performance marketing). Also exploring automation/consulting services for SMEs and scalable digital systems. Previously helped launch the brand "Icecartel" before school, contributing to early-stage brand building and rollout efforts.

Hobbies and personal interests:

Basketball (plays actively; competitive mindset)

Sports overall; values performance, discipline, and physical development

Video games (strategic and competitive engagement)

Reading books occasionally, especially when aligned with growth, strategy, or self-development

Interest in design, branding, and product aesthetics (watch design focus)

Personality traits:

Ambitious and long-term oriented

Systems thinker; prefers structure, clarity, and leverage

Competitive, especially in sports and professional growth

Entrepreneurial mindset; comfortable taking initiative

Analytical and financially aware; evaluates decisions through scalability and ROI

Execution-focused; prefers practical outputs over abstract theory

Balances corporate discipline with creative business building

Direct communication style; values honesty and critical feedback

Overall profile: enterprise-focused infrastructure engineer with strong entrepreneurial drive, competitive athletic mindset, interest in digital systems and branding, and long-term orientation toward independence, scale, and strategic positioning.`;

// Upsert profile row with key "about"
db.prepare(
  `INSERT OR REPLACE INTO profile (key, content, updated_at) VALUES (?, ?, datetime('now'))`
).run("about", aboutContent);

console.log("Profile seeded successfully.");
db.close();
