/* SQLite (WAL) persistence. Uses Node's built-in node:sqlite
   (stable on Node 24) so there is no native dependency to compile.
   One row per card; edit tokens are stored hashed. Reports kept for the
   abuse workflow. */

import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes } from 'node:crypto';
import { customAlphabet } from 'nanoid';
import { Card, CardInput, LinkPlatform, LINK_PLATFORMS } from './types.js';

/* nanoid, 9 chars, no lookalike chars */
const newId = customAlphabet('23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ', 9);

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export interface CardStore {
  create(input: CardInput): { card: Card; editToken: string };
  get(id: string): Card | null;
  update(id: string, editToken: string, input: CardInput): 'ok' | 'not-found' | 'forbidden';
  verifyToken(id: string, editToken: string): boolean;
  unpublish(id: string): boolean;
  report(id: string, reason: string, ip: string): boolean;
  close(): void;
}

interface Row {
  id: string;
  data: string;
  edit_token_hash: string;
  published: number;
  created_at: string;
  updated_at: string;
}

export function openStore(path: string): CardStore {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      edit_token_hash TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      ip TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const insert = db.prepare(
    `INSERT INTO cards (id, data, edit_token_hash, published, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?)`
  );
  const selectById = db.prepare(`SELECT * FROM cards WHERE id = ?`);
  const updateData = db.prepare(`UPDATE cards SET data = ?, updated_at = ? WHERE id = ?`);
  const unpublishStmt = db.prepare(`UPDATE cards SET published = 0, updated_at = ? WHERE id = ?`);
  const insertReport = db.prepare(
    `INSERT INTO reports (card_id, reason, ip, created_at) VALUES (?, ?, ?, ?)`
  );

  function rowToCard(row: Row): Card {
    const data = JSON.parse(row.data) as CardInput;
    // keep links limited to known platforms even if the DB was edited by hand
    const links: Partial<Record<LinkPlatform, string>> = {};
    for (const p of LINK_PLATFORMS) if (data.links?.[p]) links[p] = data.links[p];
    return {
      ...data,
      links,
      avatarKind: data.avatarKind ?? 'initial', // rows created before avatars existed
      id: row.id,
      published: row.published === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  return {
    create(input) {
      const editToken = randomBytes(16).toString('hex');
      const now = new Date().toISOString();
      // collision-check on generation
      for (let attempt = 0; attempt < 5; attempt++) {
        const id = newId();
        try {
          insert.run(id, JSON.stringify(input), hashToken(editToken), now, now);
          return { card: { ...input, id, published: true, createdAt: now, updatedAt: now }, editToken };
        } catch (err) {
          if (!/UNIQUE constraint failed/.test((err as Error).message)) throw err;
        }
      }
      throw new Error('could not allocate a card id');
    },

    get(id) {
      const row = selectById.get(id) as Row | undefined;
      return row ? rowToCard(row) : null;
    },

    verifyToken(id, editToken) {
      const row = selectById.get(id) as Row | undefined;
      return !!row && row.edit_token_hash === hashToken(editToken);
    },

    update(id, editToken, input) {
      const row = selectById.get(id) as Row | undefined;
      if (!row) return 'not-found';
      if (row.edit_token_hash !== hashToken(editToken)) return 'forbidden';
      updateData.run(JSON.stringify(input), new Date().toISOString(), id);
      return 'ok';
    },

    unpublish(id) {
      return unpublishStmt.run(new Date().toISOString(), id).changes > 0;
    },

    report(id, reason, ip) {
      const row = selectById.get(id) as Row | undefined;
      if (!row) return false;
      insertReport.run(id, reason.slice(0, 500), ip, new Date().toISOString());
      return true;
    },

    close() {
      db.close();
    },
  };
}
