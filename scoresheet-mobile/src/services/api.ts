import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { AuthResponse, User, ApiResponse, PaginatedResponse } from '../types';

const API_URL = __DEV__ 
  ? 'http://192.168.1.100:8000/api'  // Change this to your local IP
  : 'https://your-production-api.com/api';

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        if (!this.token) {
          this.token = await SecureStore.getItemAsync('auth_token');
        }
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  // ===================
  // AUTH
  // ===================
  
  async login(email: string, password: string, deviceName: string = 'mobile'): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/sanctum/token', {
      email,
      password,
      device_name: deviceName,
    });
    
    this.token = response.data.token;
    await SecureStore.setItemAsync('auth_token', response.data.token);
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/logout');
    } catch (e) {
      // Ignore logout errors
    } finally {
      this.token = null;
      await SecureStore.deleteItemAsync('auth_token');
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<{ data: User }>('/user');
    return response.data.data;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('auth_token');
    return !!token;
  }

  // ===================
  // GAMES
  // ===================

  async getGames(params?: { status?: string; page?: number }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/games', { params });
    return response.data;
  }

  async getGame(id: number): Promise<any> {
    const response = await this.client.get(`/games/${id}`);
    return response.data.data;
  }

  async getGameForEdit(id: number): Promise<any> {
    const response = await this.client.get(`/games/${id}/edit`);
    return response.data.data;
  }

  async updateGameStatus(id: number, status: string): Promise<any> {
    const response = await this.client.patch(`/games/${id}/status`, { status });
    return response.data.data;
  }

  async updateGame(id: number, data: any): Promise<any> {
    const response = await this.client.patch(`/games/${id}`, data);
    return response.data.data;
  }

  // ===================
  // EVENTS
  // ===================

  async getEvents(gameId: number): Promise<any[]> {
    const response = await this.client.get(`/games/${gameId}/events`);
    return response.data.data;
  }

  async createEvent(gameId: number, eventData: any): Promise<any> {
    const response = await this.client.post(`/games/${gameId}/events`, eventData);
    return response.data.data;
  }

  async updateEvent(eventId: number, eventData: any): Promise<any> {
    const response = await this.client.patch(`/events/${eventId}`, eventData);
    return response.data.data;
  }

  async deleteEvent(eventId: number): Promise<void> {
    await this.client.delete(`/events/${eventId}`);
  }

  // ===================
  // PERIODS
  // ===================

  async updatePeriod(gameId: number, periodId: number, data: any): Promise<any> {
    const response = await this.client.patch(`/games/${gameId}/periods/${periodId}`, data);
    return response.data.data;
  }

  // ===================
  // PLAYERS
  // ===================

  async updateTeamPlayers(gameId: number, teamId: number, players: any[]): Promise<any> {
    const response = await this.client.patch(
      `/games/${gameId}/teams/${teamId}/players`,
      { players }
    );
    return response.data.data;
  }

  // ===================
  // SIGNATURES
  // ===================

  async getSignatures(gameId: number): Promise<any[]> {
    const response = await this.client.get(`/games/${gameId}/signatures`);
    return response.data.data;
  }

  async createSignature(gameId: number, signatureData: any): Promise<any> {
    const response = await this.client.post(`/games/${gameId}/signatures`, signatureData);
    return response.data.data;
  }

  // ===================
  // EXPORT
  // ===================

  async exportGame(gameId: number): Promise<any> {
    const response = await this.client.get(`/games/${gameId}/export`);
    return response.data;
  }

  // ===================
  // SYNC - Batch operations
  // ===================

  async syncEvents(gameId: number, events: any[]): Promise<any> {
    const response = await this.client.post(`/games/${gameId}/events/batch`, { events });
    return response.data;
  }

  async syncGame(gameData: any): Promise<any> {
    // If game has server_id, update it; otherwise create
    if (gameData.serverId) {
      return this.updateGame(gameData.serverId, gameData);
    } else {
      const response = await this.client.post('/games', gameData);
      return response.data.data;
    }
  }

  // ===================
  // EXTERNAL LEAGUES
  // ===================

  async getExternalLeagues(): Promise<any[]> {
    const response = await this.client.get('/external/leagues');
    return response.data.data;
  }

  async getExternalLeague(id: number): Promise<any> {
    const response = await this.client.get(`/external/leagues/${id}`);
    return response.data.data;
  }

  // ===================
  // COMPETITIONS
  // ===================

  async getCompetitions(): Promise<any[]> {
    const response = await this.client.get('/competitions');
    return response.data.data;
  }

  // ===================
  // UTILITY
  // ===================

  setBaseUrl(url: string): void {
    this.client.defaults.baseURL = url;
  }

  getBaseUrl(): string {
    return this.client.defaults.baseURL || API_URL;
  }
}

export const apiService = new ApiService();
export default apiService;
