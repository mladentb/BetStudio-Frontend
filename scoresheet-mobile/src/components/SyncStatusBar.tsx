import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSyncStore } from '../stores';

export function SyncStatusBar() {
  const { isOnline, isSyncing, pendingCount, syncNow } = useSyncStore();

  if (isOnline && pendingCount === 0) {
    return null; // Don't show when everything is synced
  }

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        !isOnline ? styles.offline : isSyncing ? styles.syncing : styles.pending
      ]}
      onPress={syncNow}
      disabled={!isOnline || isSyncing}
    >
      <View style={styles.dot} />
      <Text style={styles.text}>
        {!isOnline 
          ? '📴 Offline' 
          : isSyncing 
            ? '🔄 Syncing...' 
            : `⏳ ${pendingCount} pending`
        }
      </Text>
      {isOnline && !isSyncing && pendingCount > 0 && (
        <Text style={styles.tapText}>Tap to sync</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  offline: {
    backgroundColor: '#dc2626',
  },
  syncing: {
    backgroundColor: '#2563eb',
  },
  pending: {
    backgroundColor: '#f59e0b',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  tapText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
});
