import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    authentik_sub TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS watchlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    movie_ids TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS hosted_sessions (
    id TEXT PRIMARY KEY,
    host_user_id INTEGER,
    partner_user_id INTEGER,
    partner_mode TEXT DEFAULT 'guest',
    session_name TEXT NOT NULL,
    deck_movie_ids TEXT NOT NULL,
    p1_likes TEXT DEFAULT '',
    p2_likes TEXT DEFAULT '',
    matched_movie_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(host_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY(partner_user_id) REFERENCES users(id) ON DELETE SET NULL
  );
`);

// Migration safeguard: Ensure columns exist for upgraded schemas
try {
  db.exec(`ALTER TABLE users ADD COLUMN authentik_sub TEXT;`);
} catch (e) {
  // Column already exists
}

console.log('⚡ SQLite Database connected & initialized at', dbPath);

export default db;
