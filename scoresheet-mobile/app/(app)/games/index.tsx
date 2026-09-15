import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { GameRepository } from '../../../src/database';
import { apiService } from '../../../src/services';
import { useSyncStore } from '../../../src/stores';
import type { Game } from '../../../src/types';

export default function GamesScreen() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isOnline } = useSyncStore();

  const loadGames = useCallback(async (refresh = false) => {
    try {
      // First load from local DB
      const localGames = await GameRepository.findAll();
      setGames(localGames);

      // If online, fetch from server and sync
      if (isOnline && refresh) {
        try {
          const response = await apiService.getGames();
          for (const serverGame of response.data) {
            await GameRepository.upsertFromServer(serverGame);
          }
          const updatedGames = await GameRepository.findAll();
          setGames(updatedGames);
        } catch (error) {
          console.log('Failed to fetch from server, using local data');
        }
      }
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadGames(true);
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadGames(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return '#10b981';
      case 'completed': return '#6b7280';
      case 'scheduled': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'live': return '🔴 LIVE';
      case 'completed': return '✅ Completed';
      case 'scheduled': return '📅 Scheduled';
      default: return status;
    }
  };

  const renderGame = ({ item: game }: { item: Game }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => {
        if (game.status === 'live') {
          router.push(`/(app)/live/${game.localId || game.id}`);
        } else {
          router.push(`/(app)/games/${game.localId || game.id}`);
        }
      }}
    >
      <View style={styles.gameHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(game.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(game.status)}</Text>
        </View>
        <Text style={styles.gameDate}>
          {new Date(game.scheduledAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.teamsContainer}>
        <View style={styles.teamRow}>
          <Text style={styles.teamName}>{game.homeTeam?.name || 'Home'}</Text>
          <Text style={styles.teamName}>{game.awayTeam?.name || 'Away'}</Text>
        </View>
      </View>

      <View style={styles.gameFooter}>
        <Text style={styles.placeText}>📍 {game.place || 'TBD'}</Text>
        {!game.synced && (
          <View style={styles.unsyncedBadge}>
            <Text style={styles.unsyncedText}>Not synced</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={games}
        renderItem={renderGame}
        keyExtractor={(item) => item.localId || String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏀</Text>
            <Text style={styles.emptyText}>No games yet</Text>
            <Text style={styles.emptySubtext}>
              {isOnline 
                ? 'Pull down to refresh' 
                : 'Connect to internet to sync games'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  listContent: {
    padding: 16,
  },
  gameCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  gameDate: {
    color: '#9ca3af',
    fontSize: 12,
  },
  teamsContainer: {
    marginBottom: 12,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeText: {
    color: '#6b7280',
    fontSize: 12,
  },
  unsyncedBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unsyncedText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#6b7280',
    fontSize: 14,
  },
});
