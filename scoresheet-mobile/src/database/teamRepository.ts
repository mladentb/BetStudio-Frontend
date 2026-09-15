import { getDatabase } from './database';
import type { Team } from '../types';

interface TeamRow {
  id: number;
  local_id: string | null;
  name: string;
  color: string;
  logo: string | null;
  synced: number;
}

function rowToTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    logo: row.logo || undefined,
  };
}

export const TeamRepository = {
  async findById(id: number): Promise<Team | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<TeamRow>(
      'SELECT * FROM teams WHERE id = ?',
      [id]
    );
    return row ? rowToTeam(row) : null;
  },

  async findAll(): Promise<Team[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<TeamRow>('SELECT * FROM teams ORDER BY name');
    return rows.map(rowToTeam);
  },

  async upsertFromServer(serverTeam: any): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const existing = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM teams WHERE id = ?',
      [serverTeam.id]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE teams SET name = ?, color = ?, logo = ?, synced = 1, updated_at = ? WHERE id = ?`,
        [serverTeam.name, serverTeam.color || '#000000', serverTeam.logo, now, serverTeam.id]
      );
    } else {
      await db.runAsync(
        `INSERT INTO teams (id, name, color, logo, synced, created_at, updated_at) 
         VALUES (?, ?, ?, ?, 1, ?, ?)`,
        [serverTeam.id, serverTeam.name, serverTeam.color || '#000000', serverTeam.logo, now, now]
      );
    }
  },
};
