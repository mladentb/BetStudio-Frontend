import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ScoreboardProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeColor?: string;
  awayColor?: string;
  period: number;
  gameTime: number;
}

export function Scoreboard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  homeColor = '#dc2626',
  awayColor = '#2563eb',
  period,
  gameTime,
}: ScoreboardProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Home Team */}
      <View style={styles.teamSection}>
        <View style={[styles.teamBadge, { backgroundColor: homeColor }]}>
          <Text style={styles.teamInitial}>{homeTeam.charAt(0)}</Text>
        </View>
        <Text style={styles.teamName} numberOfLines={1}>{homeTeam}</Text>
        <Text style={styles.score}>{homeScore}</Text>
      </View>

      {/* Center - Period & Time */}
      <View style={styles.centerSection}>
        <Text style={styles.period}>Q{period}</Text>
        <Text style={styles.time}>{formatTime(gameTime)}</Text>
      </View>

      {/* Away Team */}
      <View style={styles.teamSection}>
        <Text style={styles.score}>{awayScore}</Text>
        <Text style={styles.teamName} numberOfLines={1}>{awayTeam}</Text>
        <View style={[styles.teamBadge, { backgroundColor: awayColor }]}>
          <Text style={styles.teamInitial}>{awayTeam.charAt(0)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  teamSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  teamName: {
    color: '#9ca3af',
    fontSize: 12,
    flex: 1,
  },
  score: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'center',
  },
  centerSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  period: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
});
