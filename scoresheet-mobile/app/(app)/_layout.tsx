import { Stack } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { useAuthStore } from '../../src/stores';
import { router } from 'expo-router';

export default function AppLayout() {
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1f2937' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: '#111827' },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 8 }}>
            <Text style={{ color: '#f87171', fontSize: 14 }}>Logout</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen 
        name="games/index" 
        options={{ title: 'Games' }} 
      />
      <Stack.Screen 
        name="games/[id]" 
        options={{ title: 'Game Details' }} 
      />
      <Stack.Screen 
        name="live/[id]" 
        options={{ 
          title: 'Live Game',
          headerBackVisible: false,
        }} 
      />
    </Stack>
  );
}
