-- SQLite schema for AI FAQ Chat
-- Run: sqlite3 db/faq.db < db/schema.sql

-- FAQ table: Q&A pairs for direct lookup before AI fallback
CREATE TABLE IF NOT EXISTS faq (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profile/about-me table (AI context)
CREATE TABLE IF NOT EXISTS profile (
    key TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat history table (optional, for logging conversations)
CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_message TEXT,
    bot_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed FAQ data (personal info examples)
INSERT INTO faq (question, answer, category) VALUES
('What is your name?', 'My name is Regor Fotso.', 'Personal'),
('How old are you?', 'I am 24 years old.', 'Personal'),
('What year were you born?', 'I was born in 2001.', 'Personal');