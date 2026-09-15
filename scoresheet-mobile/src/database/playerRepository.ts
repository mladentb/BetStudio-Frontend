import { getDatabase } from './database';
import { v4 as uuidv4 } from 'uuid';
import type { Player } from '../types';

export interface CreatePlayerInput {
  teamId: number;
  gameId: number;
  jerseyNumber: number;
  firstName: string;
  lastName: string;
  isStarter?: boolean;
  isPlayerIn?: boolean;
  externalId?: number;
}

interface PlayerRow {
  id: number;
  local_id: string;
  server_id: number | null;
  team_id: number;
  game_id: number;
  jersey_number: number;
  first_name: string;
  last_name: string;
  is_starter: number;
  is_player_in: number;
  external_id: number | null;
  synced: number;
  created_at: string;
  updated_at: string;
}

function rowToPlayer(row: PlayerRow): Player {
  return {
    id: row.server_id || row.id,
    localId: row.local_id,
    teamId: row.team_id,
    jerseyNumber: row.jersey_number,
    firstName: row.first_name,
    lastName: row.last_name,
    isStarter: row.is_starter === 1,
    isPlayerIn: row.is_player_in === 1,
    externalId: row.external_id || undefined,
  };
}

export const PlayerRepository = {
  async create(input: CreatePlayerInput): Promise<Player> {
    const db = await getDatabase();
    const localId = uuidv4();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO players (
        local_id, team_id, game_id, jersey_number, first_name, last_name,
        is_starter, is_player_in, external_id, synced, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        localId,
        input.teamId,
        input.gameId,
        input.jerseyNumber,
        input.firstName,
        input.lastName,
        input.isStarter ? 1 : 0,
        input.isPlayerIn ? 1 : 0,
        input.externalId || null,
        now,
        now,
      ]
    );

    const result = await db.getFirstAsync<PlayerRow>(
      'SELECT * FROM players WHERE local_id = ?',
      [localId]
    );

    if (!result) throw new Error('Failed to create player');
    return rowToPlayer(result);
  },

  async createBatch(players: CreatePlayerInput[]): Promise<Player[]> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const results: Player[] = [];

    for (const input of players) {
      const localId = uuidv4();
      
      await db.runAsync(
        `INSERT INTO players (
          local_id, team_id, game_id, jersey_number, first_name, last_name,
          is_starter, is_player_in, external_id, synced, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          localId,
          input.teamId,
          input.gameId,
          input.jerseyNumber,
          input.firstName,
          input.lastName,
          input.isStarter ? 1 : 0,
          input.isPlayerIn ? 1 : 0,
          input.externalId || null,
          now,
          now,
        ]
      );

      const result = await db.getFirstAsync<PlayerRow>(
        'SELECT * FROM players WHERE local_id = ?',
        [localId]
      );

      if (result) {
        results.push(rowToPlayer(result));
      }
    }

    return results;
  },

  async findByGameAndTeam(gameId: number, teamId: number): Promise<Player[]> {
    const db = await getDatabase();
    
    const rows = await db.getAllAsync<PlayerRow>(
      `SELECT * FROM players 
       WHERE game_id = ? AND team_id = ? 
       ORDER BY jersey_number ASC`,
      [gameId, teamId]
    );

    return rows.map(rowToPlayer);
  },

  async findByLocalId(localId: string): Promise<Player | null> {
    const db = await getDatabase();
    
    const row = await db.getFirstAsync<PlayerRow>(
      'SELECT * FROM players WHERE local_id = ?',
      [localId]
    );

    return row ? rowToPlayer(row) : null;
  },

  async findById(id: number): Promise<Player | null> {
    const db = await getDatabase();
    
    const row = await db.getFirstAsync<PlayerRow>(
      'SELECT * FROM players WHERE id = ? OR server_id = ?',
      [id, id]
    );

    return row ? rowToPlayer(row) : null;
  },

  async updatePlayerStatus(
    localId: string, 
    isPlayerIn: boolean
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `UPDATE players SET is_player_in = ?, updated_at = ?, synced = 0 WHERE local_id = ?`,
      [isPlayerIn ? 1 : 0, now, localId]
    );
  },

  async updateStarterStatus(
    localId: string, 
    isStarter: boolean
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    await db.runAsync(
      `UPDATE players SET is_starter = ?, updated_at = ?, synced = 0 WHERE local_id = ?`,
      [isStarter ? 1 : 0, now, localId]
    );
  },

  async getPlayersOnCourt(gameId: number, teamId: number): Promise<Player[]> {
    const db = await getDatabase();
    
    const rows = await db.getAllAsync<PlayerRow>(
      `SELECT * FROM players 
       WHERE game_id = ? AND team_id = ? AND is_player_in = 1
       ORDER BY jersey_number ASC`,
      [gameId, teamId]
    );

    return rows.map(rowToPlayer);
  },

  async getStarters(gameId: number, teamId: number): Promise<Player[]> {
    const db = await getDatabase();
    
    const rows = await db.getAllAsync<PlayerRow>(
      `SELECT * FROM players 
       WHERE game_id = ? AND team_id = ? AND is_starter = 1
       ORDER BY jersey_number ASC`,
      [gameId, teamId]
    );

    return rows.map(rowToPlayer);
  },

  async markSynced(localId: string, serverId: number): Promise<void> {
    const db = await getDatabase();
    
    await db.runAsync(
      `UPDATE players SET server_id = ?, synced = 1 WHERE local_id = ?`,
      [serverId, localId]
    );
  },

  async deleteByGame(gameId: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM players WHERE game_id = ?', [gameId]);
  },

  async upsertFromServer(serverPlayer: any, gameId: number): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    const existing = await db.getFirstAsync<{ local_id: string }>(
      'SELECT local_id FROM players WHERE server_id = ? AND game_id = ?',
      [serverPlayer.id, gameId]
    );
    
    if (existing) {
      await db.runAsync(
        `UPDATE players SET
          jersey_number = ?, first_name = ?, last_name = ?,
          is_starter = ?, is_player_in = ?, synced = 1, updated_at = ?
         WHERE server_id = ? AND game_id = ?`,
        [
          serverPlayer.jersey_number,
          serverPlayer.first_name,
          serverPlayer.last_name,
          serverPlayer.is_starter ? 1 : 0,
          serverPlayer.is_player_in ? 1 : 0,
          now,
          serverPlayer.id,
          gameId,
        ]
      );
    } else {
      const localId = uuidv4();
      await db.runAsync(
        `INSERT INTO players (
          local_id, server_id, team_id, game_id, jersey_number, first_name,
          last_name, is_starter, is_player_in, external_id, synced, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          localId,
          serverPlayer.id,
          serverPlayer.team_id,
          gameId,
          serverPlayer.jersey_number,
          serverPlayer.first_name,
          serverPlayer.last_name,
          serverPlayer.is_starter ? 1 : 0,
          serverPlayer.is_player_in ? 1 : 0,
          serverPlayer.external_id,
          now,
          now,
        ]
      );
    }
  },
};
