import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database.sqlite');
const jsonDbPath = path.resolve(__dirname, '../database_fallback.json');

let dbInstance = null;

try {
  const { default: Database } = await import('better-sqlite3');
  dbInstance = new Database(dbPath);
  dbInstance.pragma('foreign_keys = ON');

  dbInstance.exec(`
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

    CREATE TABLE IF NOT EXISTS user_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, movie_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  try {
    dbInstance.exec(`ALTER TABLE users ADD COLUMN authentik_sub TEXT;`);
  } catch (e) {
    // Column already exists
  }

  console.log('⚡ SQLite Database connected & initialized at', dbPath);
} catch (nativeErr) {
  console.warn('⚠️ Native better-sqlite3 bindings unavailable on this Node version. Utilizing resilient file-backed fallback storage engine.');

  class FallbackDb {
    constructor(filePath) {
      this.filePath = filePath;
      this.data = {
        users: [],
        watchlists: [],
        hosted_sessions: [],
        user_likes: [],
        lastUserId: 0,
        lastWatchlistId: 0,
        lastLikeId: 0
      };
      this.load();
    }

    load() {
      if (fs.existsSync(this.filePath)) {
        try {
          const raw = fs.readFileSync(this.filePath, 'utf8');
          this.data = { ...this.data, ...JSON.parse(raw) };
        } catch (e) {
          console.warn('Error reading fallback json db:', e);
        }
      }
    }

    save() {
      try {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
      } catch (e) {
        console.error('Error saving fallback json db:', e);
      }
    }

    pragma() {}
    exec() {}

    prepare(sql) {
      const self = this;
      const lowerSql = sql.toLowerCase().trim();

      return {
        get(...params) {
          // Users query by username/email/id/sub
          if (lowerSql.includes('from users')) {
            if (lowerSql.includes('authentik_sub = ?') || lowerSql.includes('username = ?')) {
              const term = params[0];
              const term2 = params[1] || term;
              return self.data.users.find(u =>
                (u.authentik_sub && u.authentik_sub === term) ||
                (u.username && u.username.toLowerCase() === String(term).toLowerCase()) ||
                (u.email && u.email.toLowerCase() === String(term2).toLowerCase())
              ) || null;
            }
            if (lowerSql.includes('id = ?')) {
              return self.data.users.find(u => u.id === params[0]) || null;
            }
          }
          // Hosted sessions query by id
          if (lowerSql.includes('from hosted_sessions')) {
            if (lowerSql.includes('id = ?')) {
              return self.data.hosted_sessions.find(s => s.id === params[0]) || null;
            }
          }
          return null;
        },

        all(...params) {
          if (lowerSql.includes('from watchlists') && lowerSql.includes('user_id = ?')) {
            return self.data.watchlists.filter(w => w.user_id === params[0]);
          }
          if (lowerSql.includes('from user_likes') && lowerSql.includes('user_id = ?')) {
            return self.data.user_likes.filter(l => l.user_id === params[0]);
          }
          return [];
        },

        run(...params) {
          let changes = 0;
          let lastInsertRowid = 0;

          // Insert User
          if (lowerSql.includes('insert into users')) {
            self.data.lastUserId += 1;
            const newUser = {
              id: self.data.lastUserId,
              username: params[0],
              email: params[1],
              password_hash: params[2] || null,
              authentik_sub: params[2] && String(params[2]).startsWith('authentik') ? params[2] : (params[2] && params[2].length < 20 ? null : params[2]),
              created_at: new Date().toISOString()
            };
            self.data.users.push(newUser);
            changes = 1;
            lastInsertRowid = newUser.id;
          }
          // Update User
          else if (lowerSql.includes('update users set authentik_sub')) {
            const user = self.data.users.find(u => u.id === params[1]);
            if (user) { user.authentik_sub = params[0]; changes = 1; }
          }
          // Insert Watchlist
          else if (lowerSql.includes('insert into watchlists')) {
            self.data.lastWatchlistId += 1;
            const newW = {
              id: self.data.lastWatchlistId,
              user_id: params[0],
              title: params[1],
              movie_ids: params[2],
              created_at: new Date().toISOString()
            };
            self.data.watchlists.push(newW);
            changes = 1;
            lastInsertRowid = newW.id;
          }
          // Delete Watchlist
          else if (lowerSql.includes('delete from watchlists')) {
            const initialLen = self.data.watchlists.length;
            self.data.watchlists = self.data.watchlists.filter(w => w.id !== params[0]);
            changes = initialLen - self.data.watchlists.length;
          }
          // Insert Hosted Session
          else if (lowerSql.includes('insert into hosted_sessions')) {
            const newSession = {
              id: params[0],
              host_user_id: params[1],
              partner_mode: params[2],
              session_name: params[3],
              deck_movie_ids: params[4],
              p1_likes: '',
              p2_likes: '',
              matched_movie_id: null,
              created_at: new Date().toISOString()
            };
            self.data.hosted_sessions.push(newSession);
            changes = 1;
          }
          // Update Hosted Session Partner
          else if (lowerSql.includes('update hosted_sessions set partner_user_id')) {
            const s = self.data.hosted_sessions.find(x => x.id === params[1]);
            if (s) { s.partner_user_id = params[0]; changes = 1; }
          }
          // Update Hosted Session P1 Likes
          else if (lowerSql.includes('update hosted_sessions set p1_likes')) {
            const s = self.data.hosted_sessions.find(x => x.id === params[1]);
            if (s) { s.p1_likes = params[0]; changes = 1; }
          }
          // Update Hosted Session P2 Likes
          else if (lowerSql.includes('update hosted_sessions set p2_likes')) {
            const s = self.data.hosted_sessions.find(x => x.id === params[1]);
            if (s) { s.p2_likes = params[0]; changes = 1; }
          }
          // Update Hosted Session Matched Movie
          else if (lowerSql.includes('update hosted_sessions set matched_movie_id')) {
            const s = self.data.hosted_sessions.find(x => x.id === params[1]);
            if (s) { s.matched_movie_id = params[0]; changes = 1; }
          }
          // Delete Old Sessions
          else if (lowerSql.includes('delete from hosted_sessions')) {
            changes = 0;
          }
          // Insert User Like
          else if (lowerSql.includes('insert into user_likes')) {
            const existing = self.data.user_likes.find(l => l.user_id === params[0] && l.movie_id === params[1]);
            if (!existing) {
              self.data.lastLikeId += 1;
              self.data.user_likes.push({
                id: self.data.lastLikeId,
                user_id: params[0],
                movie_id: params[1],
                created_at: new Date().toISOString()
              });
              changes = 1;
              lastInsertRowid = self.data.lastLikeId;
            }
          }

          self.save();
          return { changes, lastInsertRowid };
        }
      };
    }
  }

  dbInstance = new FallbackDb(jsonDbPath);
}

export default dbInstance;
