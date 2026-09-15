import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useLiveGameStore, useSyncStore } from '../../../src/stores';
import { 
  Scoreboard, 
  PlayerList, 
  EventButtons, 
  Button 
} from '../../../src/components';
import type { Player, EventType } from '../../../src/types';

type ActiveTeam = 'home' | 'away';

export default function LiveGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isOnline, pendingCount } = useSyncStore();
  
  const {
    game,
    homeRoster,
    awayRoster,
    currentPeriod,
    gameTime,
    score,
    periods,
    isLoading,
    error,
    loadGame,
    addEvent,
    startPeriod,
    endPeriod,
    endGame,
    setGameTime,
  } = useLiveGameStore();

  const [activeTeam, setActiveTeam] = useState<ActiveTeam>('home');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (id) {
      loadGame(id);
    }
    return () => {
      useLiveGameStore.getState().reset();
    };
  }, [id]);

  // Simple timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && gameTime > 0) {
      interval = setInterval(() => {
        setGameTime(gameTime - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, gameTime]);

  const handleEventPress = useCallback(async (type: EventType, value?: number) => {
    if (!selectedPlayer && ['FT', 'FTM', '2PT', '2PTM', '3PT', '3PTM', 'PF', 'TF', 'UF', 'DF'].includes(type)) {
      Alert.alert('Select Player', 'Please select a player first');
      return;
    }

    try {
      await addEvent({
        teamId: activeTeam === 'home' ? game!.homeTeamId : game!.awayTeamId,
        playerId: selectedPlayer?.id,
        type,
        value,
      });
      
      // Clear selection after scoring events
      if (['FT', '2PT', '3PT'].includes(type)) {
        setSelectedPlayer(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add event');
    }
  }, [selectedPlayer, activeTeam, game, addEvent]);

  const handlePlayerPress = useCallback((player: Player) => {
    setSelectedPlayer(prev => prev?.id === player.id ? null : player);
  }, []);

  const handlePeriodControl = async () => {
    const currentPeriodData = periods.find(p => p.number === currentPeriod);
    
    if (!currentPeriodData?.startsAt) {
      // Start period
      await startPeriod(currentPeriod);
      setTimerRunning(true);
      setGameTime(600); // 10 minutes
    } else if (!currentPeriodData?.endsAt) {
      // End period
      setTimerRunning(false);
      await endPeriod();
      
      if (currentPeriod < 4) {
        Alert.alert(
          'Period Ended',
          `Quarter ${currentPeriod} has ended. Ready for Q${currentPeriod + 1}?`
        );
      } else {
        setShowEndGameModal(true);
      }
    }
  };

  const handleEndGame = async () => {
    setShowEndGameModal(false);
    await endGame();
    
    Alert.alert(
      'Game Finished',
      `Final Score: ${score.home} - ${score.away}`,
      [{ text: 'OK', onPress: () => router.replace('/(app)/games') }]
    );
  };

  const getCurrentPeriodStatus = () => {
    const period = periods.find(p => p.number === currentPeriod);
    if (!period?.startsAt) return 'not_started';
    if (!period?.endsAt) return 'in_progress';
    return 'ended';
  };

  if (isLoading || !game) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  const periodStatus = getCurrentPeriodStatus();
  const roster = activeTeam === 'home' ? homeRoster : awayRoster;
  const teamColor = activeTeam === 'home' 
    ? (game.homeTeam?.color || '#dc2626')
    : (game.awayTeam?.color || '#2563eb');

  return (
    <View style={styles.container}>
      {/* Offline/Sync indicator */}
      {(!isOnline || pendingCount > 0) && (
        <View style={[styles.statusBar, !isOnline ? styles.offline : styles.pending]}>
          <Text style={styles.statusText}>
            {!isOnline ? '📴 Offline Mode' : `⏳ ${pendingCount} pending sync`}
          </Text>
        </View>
      )}

      {/* Scoreboard */}
      <Scoreboard
        homeTeam={game.homeTeam?.name || 'Home'}
        awayTeam={game.awayTeam?.name || 'Away'}
        homeScore={score.home}
        awayScore={score.away}
        homeColor={game.homeTeam?.color}
        awayColor={game.awayTeam?.color}
        period={currentPeriod}
        gameTime={gameTime}
      />

      {/* Period Controls */}
      <View style={styles.periodControls}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            periodStatus === 'in_progress' ? styles.periodActive : styles.periodInactive
          ]}
          onPress={handlePeriodControl}
        >
          <Text style={styles.periodButtonText}>
            {periodStatus === 'not_started' 
              ? `▶️ Start Q${currentPeriod}` 
              : periodStatus === 'in_progress'
                ? `⏹️ End Q${currentPeriod}`
                : `Q${currentPeriod} Ended`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.timerButton}
          onPress={() => setTimerRunning(!timerRunning)}
          disabled={periodStatus !== 'in_progress'}
        >
          <Text style={styles.timerButtonText}>
            {timerRunning ? '⏸️' : '▶️'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Team Selector */}
      <View style={styles.teamSelector}>
        <TouchableOpacity
          style={[
            styles.teamTab,
            activeTeam === 'home' && styles.teamTabActive,
            { borderColor: game.homeTeam?.color || '#dc2626' }
          ]}
          onPress={() => {
            setActiveTeam('home');
            setSelectedPlayer(null);
          }}
        >
          <Text style={[
            styles.teamTabText,
            activeTeam === 'home' && styles.teamTabTextActive
          ]}>
            {game.homeTeam?.name || 'Home'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.teamTab,
            activeTeam === 'away' && styles.teamTabActive,
            { borderColor: game.awayTeam?.color || '#2563eb' }
          ]}
          onPress={() => {
            setActiveTeam('away');
            setSelectedPlayer(null);
          }}
        >
          <Text style={[
            styles.teamTabText,
            activeTeam === 'away' && styles.teamTabTextActive
          ]}>
            {game.awayTeam?.name || 'Away'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Player List */}
      <View style={styles.playerSection}>
        <PlayerList
          players={roster}
          teamColor={teamColor}
          onPlayerPress={handlePlayerPress}
          selectedPlayerId={selectedPlayer?.id}
        />
      </View>

      {/* Event Buttons */}
      <View style={styles.eventSection}>
        <EventButtons
          onEventPress={handleEventPress}
          disabled={periodStatus !== 'in_progress'}
        />
      </View>

      {/* End Game Modal */}
      <Modal
        visible={showEndGameModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>End Game?</Text>
            <Text style={styles.modalText}>
              Final Score: {score.home} - {score.away}
            </Text>
            <View style={styles.modalButtons}>
              <Button
                title="Continue Playing"
                onPress={() => setShowEndGameModal(false)}
                variant="secondary"
              />
              <Button
                title="End Game"
                onPress={handleEndGame}
                variant="danger"
              />
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 16,
    marginBottom: 16,
  },
  statusBar: {
    padding: 8,
    alignItems: 'center',
  },
  offline: {
    backgroundColor: '#dc2626',
  },
  pending: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  periodControls: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodActive: {
    backgroundColor: '#10b981',
  },
  periodInactive: {
    backgroundColor: '#374151',
  },
  periodButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timerButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  timerButtonText: {
    fontSize: 20,
  },
  teamSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  teamTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamTabActive: {
    backgroundColor: '#374151',
  },
  teamTabText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  teamTabTextActive: {
    color: '#fff',
  },
  playerSection: {
    flex: 1,
    minHeight: 150,
  },
  eventSection: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalText: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    gap: 12,
  },
});
