import * as Network from 'expo-network';
import { SyncQueueRepository, GameRepository, EventRepository, PeriodRepository } from '../database';
import apiService from './api';
import type { SyncQueueItem } from '../types';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
}

class SyncService {
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  private status: SyncStatus = {
    isOnline: false,
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    lastError: null,
  };

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private updateStatus(updates: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...updates };
    this.listeners.forEach(l => l(this.status));
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      const state = await Network.getNetworkStateAsync();
      const online = !!(state.isConnected && state.isInternetReachable);
      this.updateStatus({ isOnline: online });
      return online;
    } catch {
      this.updateStatus({ isOnline: false });
      return false;
    }
  }

  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) return;
    this.syncNow();
    this.syncInterval = setInterval(() => this.syncNow(), intervalMs);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncNow(): Promise<void> {
    if (this.isSyncing) return;
    
    const isOnline = await this.checkConnectivity();
    if (!isOnline) return;

    this.isSyncing = true;
    this.updateStatus({ isSyncing: true });

    try {
      const stats = await SyncQueueRepository.getQueueStats();
      this.updateStatus({ pendingCount: stats.pending });

      if (stats.pending === 0) return;

      const items = await SyncQueueRepository.getPendingItems(50);
      
      for (const item of items) {
        await this.processItem(item);
      }

      await SyncQueueRepository.deleteSyncedItems();
      
      const newStats = await SyncQueueRepository.getQueueStats();
      this.updateStatus({ 
        pendingCount: newStats.pending,
        lastSyncAt: new Date().toISOString(),
        lastError: null,
      });
    } catch (error) {
      this.updateStatus({ lastError: error instanceof Error ? error.message : 'Sync failed' });
    } finally {
      this.isSyncing = false;
      this.updateStatus({ isSyncing: false });
    }
  }

  private async processItem(item: SyncQueueItem): Promise<void> {
    await SyncQueueRepository.markAsSyncing(item.id);
    
    try {
      const payload = JSON.parse(item.payload);
      
      if (item.entityType === 'event') {
        await this.syncEvent(item, payload);
      } else if (item.entityType === 'game') {
        await this.syncGame(item, payload);
      } else if (item.entityType === 'period') {
        await this.syncPeriod(item, payload);
      }
      
      await SyncQueueRepository.markAsSynced(item.id);
    } catch (error) {
      await SyncQueueRepository.markAsFailed(item.id, error instanceof Error ? error.message : 'Failed');
    }
  }

  private async syncEvent(item: SyncQueueItem, payload: any): Promise<void> {
    const event = await EventRepository.findByLocalId(item.entityId);
    if (!event) return;

    if (item.action === 'create') {
      const result = await apiService.createEvent(payload.gameId, {
        team_id: event.teamId,
        player_id: event.playerId,
        coach_id: event.coachId,
        period_id: event.periodId,
        type: event.type,
        game_time: event.gameTime,
        value: event.value,
        foul_shots: event.foulShots,
      });
      await EventRepository.markSynced(event.localId, result.id);
    } else if (item.action === 'update' && event.id) {
      await apiService.updateEvent(event.id, payload);
    } else if (item.action === 'delete' && event.id) {
      await apiService.deleteEvent(event.id);
    }
  }

  private async syncGame(item: SyncQueueItem, payload: any): Promise<void> {
    const game = await GameRepository.findByLocalId(item.entityId);
    if (!game) return;

    if (item.action === 'update' && game.id && payload.status) {
      await apiService.updateGameStatus(game.id, payload.status);
      await GameRepository.markSynced(game.localId!, game.id);
    }
  }

  private async syncPeriod(item: SyncQueueItem, payload: any): Promise<void> {
    const period = await PeriodRepository.findByLocalId(item.entityId);
    if (!period || !period.gameId) return;

    if (item.action === 'update') {
      await apiService.updatePeriod(period.gameId, period.id, payload);
      await PeriodRepository.markSynced(period.localId!, period.id);
    }
  }

  async pullFromServer(gameId: number): Promise<void> {
    const isOnline = await this.checkConnectivity();
    if (!isOnline) throw new Error('No internet connection');

    const gameData = await apiService.getGameForEdit(gameId);
    await GameRepository.upsertFromServer(gameData);

    if (gameData.relationships?.home_team?.roster) {
      for (const player of gameData.relationships.home_team.roster) {
        await import('../database/playerRepository').then(m => 
          m.PlayerRepository.upsertFromServer(player, gameId)
        );
      }
    }

    if (gameData.relationships?.away_team?.roster) {
      for (const player of gameData.relationships.away_team.roster) {
        await import('../database/playerRepository').then(m => 
          m.PlayerRepository.upsertFromServer(player, gameId)
        );
      }
    }

    const events = await apiService.getEvents(gameId);
    const game = await GameRepository.findById(gameId);
    if (game?.localId) {
      for (const event of events) {
        await EventRepository.upsertFromServer(event, game.localId);
      }
    }
  }
}

export const syncService = new SyncService();
export default syncService;
