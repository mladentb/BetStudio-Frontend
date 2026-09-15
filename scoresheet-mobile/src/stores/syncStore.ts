import { create } from 'zustand';
import { syncService, SyncStatus } from '../services/sync';

interface SyncState extends SyncStatus {
  startSync: () => void;
  stopSync: () => void;
  syncNow: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set) => {
  // Subscribe to sync service updates
  syncService.subscribe((status) => {
    set(status);
  });

  return {
    isOnline: false,
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    lastError: null,

    startSync: () => {
      syncService.startAutoSync(30000); // Every 30 seconds
    },

    stopSync: () => {
      syncService.stopAutoSync();
    },

    syncNow: async () => {
      await syncService.syncNow();
    },
  };
});
