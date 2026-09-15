import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import type { Player } from '../types';

interface PlayerListProps {
  players: Player[];
  teamColor: string;
  onPlayerPress: (player: Player) => void;
  selectedPlayerId?: number;
  showOnCourt?: boolean;
}

export function PlayerList({
  players,
  teamColor,
  onPlayerPress,
  selectedPlayerId,
  showOnCourt = false,
}: PlayerListProps) {
  const displayPlayers = showOnCourt 
    ? players.filter(p => p.isPlayerIn)
    : players;

  const renderPlayer = ({ item: player }: { item: Player }) => {
    const isSelected = player.id === selectedPlayerId;
    const isOnCourt = player.isPlayerIn;

    return (
      <TouchableOpacity
        style={[
          styles.playerCard,
          isSelected && styles.selectedCard,
          isOnCourt && styles.onCourtCard,
        ]}
        onPress={() => onPlayerPress(player)}
        activeOpacity={0.7}
      >
        <View style={[styles.jerseyBadge, { backgroundColor: teamColor }]}>
          <Text style={styles.jerseyNumber}>{player.jerseyNumber}</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>
            {player.lastName}
          </Text>
          <Text style={styles.playerFirstName}>
            {player.firstName}
          </Text>
        </View>
        {isOnCourt && (
          <View style={styles.onCourtIndicator}>
            <Text style={styles.onCourtText}>🏀</Text>
          </View>
        )}
        {player.isStarter && (
          <View style={styles.starterBadge}>
            <Text style={styles.starterText}>S</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={displayPlayers}
      renderItem={renderPlayer}
      keyExtractor={(item) => item.localId || String(item.id)}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  playerCard: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  onCourtCard: {
    backgroundColor: '#1f4d3a',
  },
  jerseyBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jerseyNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  playerFirstName: {
    color: '#9ca3af',
    fontSize: 12,
  },
  onCourtIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  onCourtText: {
    fontSize: 12,
  },
  starterBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#f59e0b',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  starterText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
