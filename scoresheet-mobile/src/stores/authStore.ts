import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiService } from '../services/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiService.login(email, password, 'scoresheet-mobile');
      set({ 
        user: response.user, 
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiService.logout();
    } finally {
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await apiService.getCurrentUser();
      set({ 
        user, 
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      await SecureStore.deleteItemAsync('auth_token');
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
