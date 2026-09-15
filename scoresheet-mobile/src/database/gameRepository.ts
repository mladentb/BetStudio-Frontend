import { getDatabase } from './database';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Game, 
  GameStatus, 
  Team, 
  Competition,
  GameOfficial 
} from '../types';

export interface GameWithRelations extends Game {
  homeTeam?: Team;
  awayTeam?: Team;
  competition?: Competition;
}

export interface CreateGameInput {
  competitionId?: number;
  homeTeamId: number;
  awayTeamId: number;
  place?: string;
  scheduledAt: string;
  delegateId?: number;
  firstRefereeId?: number;
  secondRefereeId?: number;
  thirdRefereeId?: number;
}

export interface GameRow {
  id: number;
  local_id: string;
  server_id: number | null;
  competition_id: number | null;
  home_team_id: number;
  away_team_id: number;
  place: string | null;
  scheduled_at: string;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  delegate_id: number | null;
  first_referee_id: number | null;
  second_referee_id: number | null;
  third_referee_id: number | null;
  synced: number;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToGame(row: GameRow): Game {
  return {
    id: row.server_id || row.id,
    localId: row.local_id,
    competitionId: row.competition_id || 0,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    place: row.place || '',
    scheduledAt: row.scheduled_at,
    startsAt: row.starts_at || undefined,
    endsAt: row.ends_at || undefined,
    status: row.status as GameStatus,
  };
}

export const GameRepository = {
  async create(input: CreateGameInput): Promise<Game> {
    const db = await getDatabase();
    const localId = uuidv4();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO games (
        local_id, competition_id, home_team_id, away_team_id,
        place, scheduled_at, delegate_id, first_referee_id,
        second_referee_id, third_referee_id, status, synced,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', 0, ?, ?)`,
      [
        localId,
        input.competitionId || null,
        input.homeTeamId,
        input.awayTeamId,
        input.place || null,
        input.scheduledAt,
        input.delegateId || null,
        input.firstRefereeId || null,
        input.secondRefereeId || null,
        input.thirdRefereeId || null,
        now,
        now,
      ]
    );

    const result = await db.getFirstAsync<GameRow>(
      'SELECT * FROM games WHERE local_id = ?',
      [localId]
    );

    if (!result) throw new Error('Failed to create game');
    
    // Add to sync queue
    await addToSyncQueue('game', localId, 'create', result);
    
    return rowToGame(result);
  },

  async findById(id: number | string): Promise<Game | null> {
    const db = await getDatabase();
    
    const row = await db.getFirstAsync<GameRow>(
      `SELECT * FROM games WHERE id = ? OR local_id = ? OR server_id = ?`,
      [id, id, id]
    );

    return row ? rowToGame(row) : null;
  },

  async findByLocalId(localId: string): Promise<Game | null> {
    const db = await getDatabase();
    
    const row = await db.getFirstAsync<GameRow>(
      'SELECT * FROM games WHERE local_id = ?',
      [localId]
    );

    return row ? rowToGame(row) : null;
  },

  async findWithRelations(id: number | string): Promise<GameWithRelations | null> {
    const db = await getDatabase();
    
    const row = await db.getFirstAsync<GameRow & {
      home_team_name: string;
      home_team_color: string;
      away_team_name: string;
      away_team_color: string;
      competition_name: string | null;
    }>(
      `SELECT g.*, 
        ht.name as home_team_name, ht.color as home_team_color,
        at.name as away_team_name, at.color as away_team_color,
        c.name as competition_name
       FROM games g
       LEFT JOIN teams ht ON g.home_team_id = ht.id
       LEFT JOIN teams at ON g.away_team_id = at.id
       LEFT JOIN competitions c ON g.competition_id = c.id
       WHERE g.id = ? OR g.local_id = ? OR g.server_id = ?`,
      [id, id, id]
    );

    if (!row) return null;

    const game = rowToGame(row);
    
    return {
      ...game,
      homeTeam: {
        id: row.home_team_id,
        name: row.home_team_name,
        color: row.home_team_color,
      },
      awayTeam: {
        id: row.away_team_id,
        name: row.away_team_name,
        color: row.away_team_color,
      },
      competition: row.competition_id ? {
        id: row.competition_id,
        name: row.competition_name || '',
        season: '',
      } : undefined,
    };
  },

  async findAll(status?: GameStatus): Promise<Game[]> {
    const db = await getDatabase();
    
    let query = 'SELECT * FROM games';
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY scheduled_at DESC';
    
    const rows = await db.getAllAsync<GameRow>(query, params);
    return rows.map(rowToGame);
  },

  async findByStatus(status: GameStatus): Promise<Game[]> {
    return this.findAll(status);
  },

  async updateStatus(
    localId: string, 
    status: GameStatus,
    timestamp?: string
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    let updateFields = 'status = ?, updated_at = ?, synced = 0';
    const params: any[] = [status, now];
    
    if (status === 'live' && timestamp) {
      updateFields += ', starts_at = ?';
      params.push(timestamp);
    } else if (status === 'completed' && timestamp) {
      updateFields += ', ends_at = ?';
      params.push(timestamp);
    }
    
    params.push(localId);
    
    await db.runAsync(
      `UPDATE games SET ${updateFields} WHERE local_id = ?`,
      params
    );

    // Add to sync queue
    await addToSyncQueue('game', localId, 'update', { status, timestamp });
  },

  async markSynced(localId: string, serverId: number): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `UPDATE games SET server_id = ?, synced = 1, synced_at = ? WHERE local_id = ?`,
      [serverId, now, localId]
    );
  },

  async getUnsyncedGames(): Promise<Game[]> {
    const db = await getDatabase();
    
    const rows = await db.getAllAsync<GameRow>(
      'SELECT * FROM games WHERE synced = 0'
    );
    
    return rows.map(rowToGame);
  },

  async upsertFromServer(serverGame: any): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    // Check if exists by server_id
    const existing = await db.getFirstAsync<{ local_id: string }>(
      'SELECT local_id FROM games WHERE server_id = ?',
      [serverGame.id]
    );
    
    if (existing) {
      // Update existing
      await db.runAsync(
        `UPDATE games SET
          competition_id = ?, home_team_id = ?, away_team_id = ?,
          place = ?, scheduled_at = ?, starts_at = ?, ends_at = ?,
          status = ?, synced = 1, synced_at = ?, updated_at = ?
         WHERE server_id = ?`,
        [
          serverGame.competition_id,
          serverGame.home_team_id,
          serverGame.away_team_id,
          serverGame.place,
          serverGame.scheduled_at,
          serverGame.starts_at,
          serverGame.ends_at,
          serverGame.status,
          now,
          now,
          serverGame.id,
        ]
      );
    } else {
      // Insert new
      const localId = uuidv4();
      await db.runAsync(
        `INSERT INTO games (
          local_id, server_id, competition_id, home_team_id, away_team_id,
          place, scheduled_at, starts_at, ends_at, status, synced,
          synced_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          localId,
          serverGame.id,
          serverGame.competition_id,
          serverGame.home_team_id,
          serverGame.away_team_id,
          serverGame.place,
          serverGame.scheduled_at,
          serverGame.starts_at,
          serverGame.ends_at,
          serverGame.status,
          now,
          now,
          now,
        ]
      );
    }
  },

  async delete(localId: string): Promise<void> {
    const db = await getDatabase();
    
    // Soft delete - we need to sync this
    await db.runAsync(
      `UPDATE games SET status = 'cancelled', synced = 0 WHERE local_id = ?`,
      [localId]
    );
    
    await addToSyncQueue('game', localId, 'delete', {});
  },
};

// Helper function to add items to sync queue
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
