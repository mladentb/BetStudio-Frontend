import { getDatabase } from './database';
import { v4 as uuidv4 } from 'uuid';
import type { Period } from '../types';

export interface CreatePeriodInput {
  gameId: number;
  number: number;
  startsAt?: string;
  endsAt?: string;
}

interface PeriodRow {
  id: number;
  local_id: string;
  server_id: number | null;
  game_id: number;
  number: number;
  starts_at: string | null;
  ends_at: string | null;
  synced: number;
  created_at: string;
}

function rowToPeriod(row: PeriodRow): Period {
  return {
    id: row.server_id || row.id,
    localId: row.local_id,
    gameId: row.game_id,
    number: row.number,
    startsAt: row.starts_at || undefined,
    endsAt: row.ends_at || undefined,
  };
}

export const PeriodRepository = {
  async create(input: CreatePeriodInput): Promise<Period> {
    const db = await getDatabase();
    const localId = uuidv4();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO periods (
        local_id, game_id, number, starts_at, ends_at, synced, created_at
      ) VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [
        localId,
        input.gameId,
        input.number,
        input.startsAt || null,
        input.endsAt || null,
        now,
      ]
    );

    const result = await db.getFirstAsync<PeriodRow>(
      'SELECT * FROM periods WHERE local_id = ?',
      [localId]
    );

    if (!result) throw new Error('Failed to create period');
    
    await addToSyncQueue('period', localId, 'create', input);
    
    return rowToPeriod(result);
  },

  async findByGameId(gameId: number): Promise<Period[]> {
    const db = await getDatabase();
    
    // Get internal game id
    const game = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM games WHERE id = ? OR local_id = ? OR server_id = ?',
      [gameId, gameId, gameId]
    );
    
    if (!game) return [];

    const rows = await db.getAllAsync<PeriodRow>(
      'SELECT * FROM periods WHERE game_id = ? ORDER BY number ASC',
      [game.id]
    );

    return rows.map(rowToPeriod);
  },

  async findByLocalId(localId: string): Promise<Period | null> {
    const db = await getDatabase();
    
    const row = await db.getFirstAsync<PeriodRow>(
      'SELECT * FROM periods WHERE local_id = ?',
      [localId]
    );

    return row ? rowToPeriod(row) : null;
  },

  async findById(id: number): Promise<Period | null> {
    const db = await getDatabase();
    
    const row = await db.getFirstAsync<PeriodRow>(
      'SELECT * FROM periods WHERE id = ? OR server_id = ?',
      [id, id]
    );

    return row ? rowToPeriod(row) : null;
  },

  async getCurrentPeriod(gameId: number): Promise<Period | null> {
    const db = await getDatabase();
    
    const game = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM games WHERE id = ? OR local_id = ? OR server_id = ?',
      [gameId, gameId, gameId]
    );
    
    if (!game) return null;

    // Get the period that has started but not ended
    const row = await db.getFirstAsync<PeriodRow>(
      `SELECT * FROM periods 
       WHERE game_id = ? AND starts_at IS NOT NULL AND ends_at IS NULL
       ORDER BY number DESC LIMIT 1`,
      [game.id]
    );

    return row ? rowToPeriod(row) : null;
  },

  async getLastPeriod(gameId: number): Promise<Period | null> {
    const db = await getDatabase();
    
    const game = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM games WHERE id = ? OR local_id = ? OR server_id = ?',
      [gameId, gameId, gameId]
    );
    
    if (!game) return null;

    const row = await db.getFirstAsync<PeriodRow>(
      `SELECT * FROM periods WHERE game_id = ? ORDER BY number DESC LIMIT 1`,
      [game.id]
    );

    return row ? rowToPeriod(row) : null;
  },

  async startPeriod(localId: string): Promise<Period> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `UPDATE periods SET starts_at = ?, synced = 0 WHERE local_id = ?`,
      [now, localId]
    );

    const result = await db.getFirstAsync<PeriodRow>(
      'SELECT * FROM periods WHERE local_id = ?',
      [localId]
    );

    if (!result) throw new Error('Period not found');
    
    await addToSyncQueue('period', localId, 'update', { startsAt: now });
    
    return rowToPeriod(result);
  },

  async endPeriod(localId: string): Promise<Period> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `UPDATE periods SET ends_at = ?, synced = 0 WHERE local_id = ?`,
      [now, localId]
    );

    const result = await db.getFirstAsync<PeriodRow>(
      'SELECT * FROM periods WHERE local_id = ?',
      [localId]
    );

    if (!result) throw new Error('Period not found');
    
    await addToSyncQueue('period', localId, 'update', { endsAt: now });
    
    return rowToPeriod(result);
  },

  async createDefaultPeriods(gameId: number, count: number = 4): Promise<Period[]> {
    const periods: Period[] = [];
    
    for (let i = 1; i <= count; i++) {
      const period = await this.create({
        gameId,
        number: i,
      });
      periods.push(period);
    }
    
    return periods;
  },

  async markSynced(localId: string, serverId: number): Promise<void> {
    const db = await getDatabase();
    
    await db.runAsync(
      `UPDATE periods SET server_id = ?, synced = 1 WHERE local_id = ?`,
      [serverId, localId]
    );
  },

  async deleteByGame(gameId: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM periods WHERE game_id = ?', [gameId]);
  },

  async upsertFromServer(serverPeriod: any, gameId: number): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    const existing = await db.getFirstAsync<{ local_id: string }>(
      'SELECT local_id FROM periods WHERE server_id = ?',
      [serverPeriod.id]
    );
    
    if (existing) {
      await db.runAsync(
        `UPDATE periods SET
          number = ?, starts_at = ?, ends_at = ?, synced = 1
         WHERE server_id = ?`,
        [
          serverPeriod.number,
          serverPeriod.starts_at,
          serverPeriod.ends_at,
          serverPeriod.id,
        ]
      );
    } else {
      const localId = uuidv4();
      await db.runAsync(
        `INSERT INTO periods (
          local_id, server_id, game_id, number, starts_at, ends_at, synced, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          localId,
          serverPeriod.id,
          gameId,
          serverPeriod.number,
          serverPeriod.starts_at,
          serverPeriod.ends_at,
          now,
        ]
      );
    }
  },
};

async function addToSyncQueue(
  entityType: string,
  entityId: string,
  action: string,
  payload: any
): Promise<void> {
  const db = await getDatabase();
  const localId = uuidv4();
  const now = new Date().toISOString();
  
  await db.runAsync(
    `INSERT INTO sync_queue (local_id, entity_type, entity_id, action, payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [localId, entityType, entityId, action, JSON.stringify(payload), now]
  );
}
