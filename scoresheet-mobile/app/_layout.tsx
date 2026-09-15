import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { getDatabase } from '../src/database';
import { useSyncStore, useAuthStore } from '../src/stores';
import { SyncStatusBar } from '../src/components';

export default function RootLayout() {
  const { startSync } = useSyncStore();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Initialize database
    getDatabase().then(() => {
      console.log('✅ Database initialized');
    });

    // Check authentication
    checkAuth();

    // Start auto-sync
    startSync();

    return () => {
      useSyncStore.getState().stopSync();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SyncStatusBar />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#111827' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#111827' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
});
