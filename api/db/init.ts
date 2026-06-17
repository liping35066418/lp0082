import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { mockData } from './mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'research.db');

let dbInstance: sqlite3.Database | null = null;

export const initDatabase = (): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const dbDir = dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('SQLite database connected');

      db.serialize(() => {
        db.run(`PRAGMA foreign_keys = ON`);

        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('researcher', 'admin')),
            avatar TEXT,
            department TEXT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            subject TEXT NOT NULL,
            description TEXT,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'planning',
            progress INTEGER DEFAULT 0,
            leader_id TEXT REFERENCES users(id)
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS project_nodes (
            id TEXT PRIMARY KEY,
            project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            progress INTEGER DEFAULT 0,
            assignee_id TEXT REFERENCES users(id),
            achievements TEXT DEFAULT '[]',
            difficulties TEXT DEFAULT '[]',
            priority TEXT NOT NULL DEFAULT 'medium'
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS member_assignments (
            id TEXT PRIMARY KEY,
            member_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
            node_id TEXT REFERENCES project_nodes(id) ON DELETE CASCADE,
            role TEXT NOT NULL
          )
        `);

        db.run(`CREATE INDEX IF NOT EXISTS idx_projects_subject ON projects(subject)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_nodes_project ON project_nodes(project_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_nodes_status ON project_nodes(status)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_nodes_assignee ON project_nodes(assignee_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_assignments_member ON member_assignments(member_id)`);

        db.get(`SELECT COUNT(*) as count FROM users`, (err, row: { count: number }) => {
          if (err) {
            reject(err);
            return;
          }
          if (row.count === 0) {
            console.log('Initializing mock data...');
            mockData(db)
              .then(() => {
                console.log('Mock data initialized successfully');
                dbInstance = db;
                resolve(db);
              })
              .catch(reject);
          } else {
            dbInstance = db;
            resolve(db);
          }
        });
      });
    });
  });
};

export const getDb = (): sqlite3.Database => {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  return dbInstance;
};

export const runQuery = <T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
};

export const runQuerySingle = <T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | null);
    });
  });
};

export const runExecute = (sql: string, params: unknown[] = []): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};
