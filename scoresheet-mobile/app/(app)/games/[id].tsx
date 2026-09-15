import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { GameRepository, PlayerRepository, PeriodRepository } from '../../../src/database';
import { syncService } from '../../../src/services';
import { useSyncStore } from '../../../src/stores';
import { Button } from '../../../src/components';
import type { Game, Player } from '../../../src/types';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [homeRoster, setHomeRoster] = useState<Player[]>([]);
  const [awayRoster, setAwayRoster] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOnline } = useSyncStore();

  useEffect(() => {
    loadGame();
  }, [id]);

  const loadGame = async () => {
    if (!id) return;
    
    try {
      const gameData = await GameRepository.findWithRelations(id);
      if (!gameData) {
        Alert.alert('Error', 'Game not found');
        router.back();
        return;
      }

      setGame(gameData);

      const [home, away] = await Promise.all([
        PlayerRepository.findByGameAndTeam(gameData.id, gameData.homeTeamId),
        PlayerRepository.findByGameAndTeam(gameData.id, gameData.awayTeamId),
      ]);

      setHomeRoster(home);
      setAwayRoster(away);
    } catch (error) {
      console.error('Failed to load game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!game?.localId) return;

    try {
      await GameRepository.updateStatus(game.localId, 'live', new Date().toISOString());
      
      // Create periods if needed
      const periods = await PeriodRepository.findByGameId(game.id);
      if (periods.length === 0) {
        await PeriodRepository.createDefaultPeriods(game.id, 4);
      }

      router.replace(`/(app)/live/${game.localId}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to start game');
    }
  };

  const handleSyncGame = async () => {
    if (!game || !isOnline) return;

    try {
      await syncService.pullFromServer(game.id);
      await loadGame();
      Alert.alert('Success', 'Game synced successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync game');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Game not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Match Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Match Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Competition</Text>
          <Text style={styles.infoValue}>{game.competition?.name || 'N/A'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>
            {new Date(game.scheduledAt).toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Venue</Text>
          <Text style={styles.infoValue}>{game.place || 'TBD'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={[styles.infoValue, styles.statusText]}>
            {game.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Teams */}
      <View style={styles.teamsContainer}>
        <View style={styles.teamCard}>
          <Text style={styles.teamTitle}>🏠 Home</Text>
          <Text style={styles.teamName}>{game.homeTeam?.name}</Text>
          <Text style={styles.rosterCount}>{homeRoster.length} players</Text>
        </View>

        <Text style={styles.vsText}>VS</Text>

        <View style={styles.teamCard}>
          <Text style={styles.teamTitle}>✈️ Away</Text>
          <Text style={styles.teamName}>{game.awayTeam?.name}</Text>
          <Text style={styles.rosterCount}>{awayRoster.length} players</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {game.status === 'scheduled' && (
          <Button
            title="Start Game"
            onPress={handleStartGame}
            variant="success"
            size="large"
            fullWidth
          />
        )}

        {game.status === 'live' && (
          <Button
            title="Continue Game"
            onPress={() => router.push(`/(app)/live/${game.localId || game.id}`)}
            variant="primary"
            size="large"
            fullWidth
          />
        )}

        {isOnline && (
          <View style={styles.syncButton}>
            <Button
              title="Sync from Server"
              onPress={handleSyncGame}
              variant="secondary"
              fullWidth
            />
          </View>
        )}
      </View>

      {/* Roster Warning */}
      {(homeRoster.length === 0 || awayRoster.length === 0) && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Missing Rosters</Text>
          <Text style={styles.warningText}>
            {isOnline 
              ? 'Tap "Sync from Server" to load team rosters.'
              : 'Connect to internet and sync to load rosters.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  errorText: {
    color: '#f87171',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statusText: {
    color: '#10b981',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  teamCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  teamTitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  teamName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  rosterCount: {
    color: '#6b7280',
    fontSize: 12,
  },
  vsText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  syncButton: {
    marginTop: 4,
  },
  warningCard: {
    backgroundColor: '#78350f',
    borderRadius: 12,
    padding: 16,
  },
  warningTitle: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  warningText: {
    color: '#fde68a',
    fontSize: 14,
  },
});
