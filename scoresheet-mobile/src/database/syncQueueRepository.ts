import { getDatabase } from './database';
import type { SyncQueueItem, SyncStatus, SyncResult } from '../types';

interface SyncQueueRow {
  id: number;
  local_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  payload: string;
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
  processed_at: string | null;
}

function rowToSyncItem(row: SyncQueueRow): SyncQueueItem {
  return {
    id: row.id,
    localId: row.local_id,
    entityType: row.entity_type as SyncQueueItem['entityType'],
    entityId: row.entity_id,
    action: row.action as SyncQueueItem['action'],
    payload: row.payload,
    status: row.status as SyncStatus,
    attempts: row.attempts,
    lastError: row.last_error || undefined,
    createdAt: row.created_at,
    processedAt: row.processed_at || undefined,
  };
}

export const SyncQueueRepository = {
  async getPendingItems(limit: number = 50): Promise<SyncQueueItem[]> {
    const db = await getDatabase();
    
    const rows = await db.getAllAsync<SyncQueueRow>(
      `SELECT * FROM sync_queue 
       WHERE status IN ('pending', 'failed') AND attempts < 5
       ORDER BY created_at ASC
       LIMIT ?`,
      [limit]
    );

    return rows.map(rowToSyncItem);
  },

  async markAsSyncing(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`UPDATE sync_queue SET status = 'syncing' WHERE id = ?`, [id]);
  },

  async markAsSynced(id: number): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(`UPDATE sync_queue SET status = 'synced', processed_at = ? WHERE id = ?`, [now, id]);
  },

  async markAsFailed(id: number, error: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE sync_queue SET status = 'failed', attempts = attempts + 1, last_error = ? WHERE id = ?`,
      [error, id]
    );
  },

  async getQueueStats(): Promise<{ pending: number; failed: number; total: number }> {
    const db = await getDatabase();
    const stats = await db.getFirstAsync<{ pending: number; failed: number; total: number }>(`
      SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        COUNT(*) as total
      FROM sync_queue
    `);
    return stats || { pending: 0, failed: 0, total: 0 };
  },

  async deleteSyncedItems(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM sync_queue WHERE status = 'synced'`);
  },
};
