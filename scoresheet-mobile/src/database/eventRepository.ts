import { getDatabase } from './database';
import { v4 as uuidv4 } from 'uuid';
import type { GameEvent, EventType } from '../types';

export interface CreateEventInput {
  gameId: number;
  gameLocalId: string;
  teamId: number;
  playerId?: number;
  coachId?: number;
  periodId: number;
  type: EventType;
  gameTime: number;
  value?: number;
  foulShots?: number;
}

interface EventRow {
  id: number;
  local_id: string;
  server_id: number | null;
  game_id: number;
  team_id: number;
  player_id: number | null;
  coach_id: number | null;
  period_id: number;
  type: string;
  game_time: number;
  value: number | null;
  foul_shots: number | null;
  synced: number;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function rowToEvent(row: EventRow): GameEvent {
  return {
    id: row.server_id || row.id,
    localId: row.local_id,
    gameId: row.game_id,
    teamId: row.team_id,
    playerId: row.player_id || undefined,
    coachId: row.coach_id || undefined,
    periodId: row.period_id,
    type: row.type as EventType,
    gameTime: row.game_time,
    value: row.value || undefined,
    foulShots: row.foul_shots || undefined,
    synced: row.synced === 1,
    syncedAt: row.synced_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || undefined,
  };
}

export const EventRepository = {
  async create(input: CreateEventInput): Promise<GameEvent> {
    const db = await getDatabase();
    const localId = uuidv4();
    const now = new Date().toISOString();

    // Get internal game_id from local_id
    const game = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM games WHERE local_id = ? OR server_id = ? OR id = ?',
      [input.gameLocalId, input.gameId, input.gameId]
    );
    
    if (!game) throw new Error('Game not found');

    await db.runAsync(
      `INSERT INTO events (
        local_id, game_id, team_id, player_id, coach_id,
        period_id, type, game_time, value, foul_shots,
        synced, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        localId,
        game.id,
        input.teamId,
        input.playerId || null,
        input.coachId || null,
        input.periodId,
        input.type,
        input.gameTime,
        input.value || null,
        input.foulShots || null,
        now,
        now,
      ]
    );

    const result = await db.getFirstAsync<EventRow>(
      'SELECT * FROM events WHERE local_id = ?',
      [localId]
    );

    if (!result) throw new Error('Failed to create event');
    
    // Add to sync queue
    await addToSyncQueue('event', localId, 'create', {
      ...input,
      localId,
    });
    
    return rowToEvent(result);
  },

  async findByGameId(gameId: number | string): Promise<GameEvent[]> {
    const db = await getDatabase();
    
    // First get the internal game id
    const game = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM games WHERE id = ? OR local_id = ? OR server_id = ?',
      [gameId, gameId, gameId]
    );
    
    if (!game) return [];

    const rows = await db.getAllAsync<EventRow>(
      `SELECT * FROM events 
       WHERE game_id = ? AND deleted_at IS NULL 
       ORDER BY created_at ASC`,
      [game.id]
    );

    return rows.map(rowToEvent);
  },

  async findByLocalId(localId: string): Promise<GameEvent | null> {
    const db = await getDatabase();
    
    const row = await db.getFirstAsync<EventRow>(
      'SELECT * FROM events WHERE local_id = ?',
      [localId]
    );

    return row ? rowToEvent(row) : null;
  },

  async update(
    localId: string, 
    updates: Partial<CreateEventInput>
  ): Promise<GameEvent> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    const fields: string[] = ['updated_at = ?', 'synced = 0'];
    const values: any[] = [now];
    
    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.gameTime !== undefined) {
      fields.push('game_time = ?');
      values.push(updates.gameTime);
    }
    if (updates.value !== undefined) {
      fields.push('value = ?');
      values.push(updates.value);
    }
    if (updates.foulShots !== undefined) {
      fields.push('foul_shots = ?');
      values.push(updates.foulShots);
    }
    if (updates.playerId !== undefined) {
      fields.push('player_id = ?');
      values.push(updates.playerId);
    }
    
    values.push(localId);
    
    await db.runAsync(
      `UPDATE events SET ${fields.join(', ')} WHERE local_id = ?`,
      values
    );

    const result = await db.getFirstAsync<EventRow>(
      'SELECT * FROM events WHERE local_id = ?',
      [localId]
    );

    if (!result) throw new Error('Event not found');
    
    // Add to sync queue
    await addToSyncQueue('event', localId, 'update', updates);
    
    return rowToEvent(result);
  },

  async delete(localId: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    // Soft delete
    await db.runAsync(
      `UPDATE events SET deleted_at = ?, synced = 0, updated_at = ? WHERE local_id = ?`,
      [now, now, localId]
    );
    
    await addToSyncQueue('event', localId, 'delete', {});
  },

  async hardDelete(localId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM events WHERE local_id = ?', [localId]);
  },

  async getUnsyncedEvents(): Promise<GameEvent[]> {
    const db = await getDatabase();
    
    const rows = await db.getAllAsync<EventRow>(
      'SELECT * FROM events WHERE synced = 0 ORDER BY created_at ASC'
    );
    
    return rows.map(rowToEvent);
  },

  async markSynced(localId: string, serverId: number): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `UPDATE events SET server_id = ?, synced = 1, synced_at = ? WHERE local_id = ?`,
      [serverId, now, localId]
    );
  },

  async getEventsByPeriod(gameId: number | string, periodId: number): Promise<GameEvent[]> {
    const db = await getDatabase();
    
    const game = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM games WHERE id = ? OR local_id = ? OR server_id = ?',
      [gameId, gameId, gameId]
    );
    
    if (!game) return [];

    const rows = await db.getAllAsync<EventRow>(
      `SELECT * FROM events 
       WHERE game_id = ? AND period_id = ? AND deleted_at IS NULL 
       ORDER BY game_time DESC, created_at ASC`,
      [game.id, periodId]
    );

    return rows.map(rowToEvent);
  },

  async getScoreForGame(gameId: number | string): Promise<{ home: number; away: number }> {
    const db = await getDatabase();
    
    const game = await db.getFirstAsync<{ id: number; home_team_id: number; away_team_id: number }>(
      'SELECT id, home_team_id, away_team_id FROM games WHERE id = ? OR local_id = ? OR server_id = ?',
      [gameId, gameId, gameId]
    );
    
    if (!game) return { home: 0, away: 0 };

    const scoringEvents = ['FT', '2PT', '3PT'];
    
    const homeScore = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(value), 0) as total FROM events 
       WHERE game_id = ? AND team_id = ? AND type IN (${scoringEvents.map(() => '?').join(',')}) 
       AND deleted_at IS NULL`,
      [game.id, game.home_team_id, ...scoringEvents]
    );
    
    const awayScore = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(value), 0) as total FROM events 
       WHERE game_id = ? AND team_id = ? AND type IN (${scoringEvents.map(() => '?').join(',')}) 
       AND deleted_at IS NULL`,
      [game.id, game.away_team_id, ...scoringEvents]
    );

    return {
      home: homeScore?.total || 0,
      away: awayScore?.total || 0,
    };
  },

  async getFoulsForGame(gameId: number | string): Promise<{ home: number; away: number }> {
    const db = await getDatabase();
    
    const game = await db.getFirstAsync<{ id: number; home_team_id: number; away_team_id: number }>(
      'SELECT id, home_team_id, away_team_id FROM games WHERE id = ? OR local_id = ? OR server_id = ?',
      [gameId, gameId, gameId]
    );
    
    if (!game) return { home: 0, away: 0 };

    const foulEvents = ['PF', 'TF', 'UF', 'DF'];
    
    const homeFouls = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) as total FROM events 
       WHERE game_id = ? AND team_id = ? AND type IN (${foulEvents.map(() => '?').join(',')}) 
       AND deleted_at IS NULL`,
      [game.id, game.home_team_id, ...foulEvents]
    );
    
    const awayFouls = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) as total FROM events 
       WHERE game_id = ? AND team_id = ? AND type IN (${foulEvents.map(() => '?').join(',')}) 
       AND deleted_at IS NULL`,
      [game.id, game.away_team_id, ...foulEvents]
    );

    return {
      home: homeFouls?.total || 0,
      away: awayFouls?.total || 0,
    };
  },

  async upsertFromServer(serverEvent: any, gameLocalId: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    const game = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM games WHERE local_id = ?',
      [gameLocalId]
    );
    
    if (!game) return;

    const existing = await db.getFirstAsync<{ local_id: string }>(
      'SELECT local_id FROM events WHERE server_id = ?',
      [serverEvent.id]
    );
    
    if (existing) {
      await db.runAsync(
        `UPDATE events SET
          type = ?, game_time = ?, value = ?, foul_shots = ?,
          synced = 1, synced_at = ?, updated_at = ?
         WHERE server_id = ?`,
        [
          serverEvent.type,
          serverEvent.game_time,
          serverEvent.value,
          serverEvent.foul_shots,
          now,
          now,
          serverEvent.id,
        ]
      );
    } else {
      const localId = uuidv4();
      await db.runAsync(
        `INSERT INTO events (
          local_id, server_id, game_id, team_id, player_id, coach_id,
          period_id, type, game_time, value, foul_shots, synced,
          synced_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          localId,
          serverEvent.id,
          game.id,
          serverEvent.team_id,
          serverEvent.player_id,
          serverEvent.coach_id,
          serverEvent.period_id,
          serverEvent.type,
          serverEvent.game_time,
          serverEvent.value,
          serverEvent.foul_shots,
          now,
          now,
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
