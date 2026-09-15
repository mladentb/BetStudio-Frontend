import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { EventType } from '../types';

interface EventButtonsProps {
  onEventPress: (type: EventType, value?: number) => void;
  disabled?: boolean;
}

export function EventButtons({ onEventPress, disabled = false }: EventButtonsProps) {
  const scoringButtons = [
    { type: 'FT' as EventType, label: 'FT', value: 1, color: '#10b981' },
    { type: 'FTM' as EventType, label: 'FT ❌', color: '#6b7280' },
    { type: '2PT' as EventType, label: '2PT', value: 2, color: '#3b82f6' },
    { type: '2PTM' as EventType, label: '2PT ❌', color: '#6b7280' },
    { type: '3PT' as EventType, label: '3PT', value: 3, color: '#8b5cf6' },
    { type: '3PTM' as EventType, label: '3PT ❌', color: '#6b7280' },
  ];

  const foulButtons = [
    { type: 'PF' as EventType, label: 'PF', color: '#f59e0b' },
    { type: 'TF' as EventType, label: 'TF', color: '#ef4444' },
    { type: 'UF' as EventType, label: 'UF', color: '#dc2626' },
    { type: 'DF' as EventType, label: 'DF', color: '#991b1b' },
  ];

  const otherButtons = [
    { type: 'TO' as EventType, label: '⏱️ TO', color: '#6366f1' },
  ];

  return (
    <View style={styles.container}>
      {/* Scoring */}
      <Text style={styles.sectionTitle}>Scoring</Text>
      <View style={styles.buttonRow}>
        {scoringButtons.map((btn) => (
          <TouchableOpacity
            key={btn.type}
            style={[styles.button, { backgroundColor: btn.color }, disabled && styles.disabled]}
            onPress={() => onEventPress(btn.type, btn.value)}
            disabled={disabled}
          >
            <Text style={styles.buttonText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fouls */}
      <Text style={styles.sectionTitle}>Fouls</Text>
      <View style={styles.buttonRow}>
        {foulButtons.map((btn) => (
          <TouchableOpacity
            key={btn.type}
            style={[styles.button, { backgroundColor: btn.color }, disabled && styles.disabled]}
            onPress={() => onEventPress(btn.type)}
            disabled={disabled}
          >
            <Text style={styles.buttonText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Other */}
      <View style={styles.buttonRow}>
        {otherButtons.map((btn) => (
          <TouchableOpacity
            key={btn.type}
            style={[styles.button, styles.wideButton, { backgroundColor: btn.color }, disabled && styles.disabled]}
            onPress={() => onEventPress(btn.type)}
            disabled={disabled}
          >
            <Text style={styles.buttonText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  sectionTitle: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  wideButton: {
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.5,
  },
});
