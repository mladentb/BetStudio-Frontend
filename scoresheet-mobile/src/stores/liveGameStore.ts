import { create } from 'zustand';
import { GameRepository, EventRepository, PlayerRepository, PeriodRepository } from '../database';
import { syncService } from '../services/sync';
import type { Game, GameEvent, Player, Period, EventType } from '../types';

interface LiveGameState {
  // Game data
  game: Game | null;
  homeRoster: Player[];
  awayRoster: Player[];
  periods: Period[];
  events: GameEvent[];
  
  // Live state
  currentPeriod: number;
  gameTime: number;
  score: { home: number; away: number };
  bonus: { home: number; away: number };
  
  // Loading
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadGame: (gameId: number | string) => Promise<void>;
  
  // Event actions
  addEvent: (data: {
    teamId: number;
    playerId?: number;
    coachId?: number;
    type: EventType;
    value?: number;
    foulShots?: number;
  }) => Promise<GameEvent>;
  
  updateEvent: (localId: string, updates: Partial<GameEvent>) => Promise<void>;
  deleteEvent: (localId: string) => Promise<void>;
  
  // Period actions
  startPeriod: (periodNumber: number) => Promise<void>;
  endPeriod: () => Promise<void>;
  
  // Game status
  startGame: () => Promise<void>;
  endGame: () => Promise<void>;
  
  // Timer
  setGameTime: (seconds: number) => void;
  
  // Player substitution
  substitutePlayer: (playerIn: Player, playerOut: Player) => Promise<void>;
  
  // Refresh
  refreshScore: () => Promise<void>;
  
  // Reset
  reset: () => void;
}

export const useLiveGameStore = create<LiveGameState>((set, get) => ({
  game: null,
  homeRoster: [],
  awayRoster: [],
  periods: [],
  events: [],
  currentPeriod: 1,
  gameTime: 600, // 10 minutes default
  score: { home: 0, away: 0 },
  bonus: { home: 0, away: 0 },
  isLoading: false,
  error: null,

  loadGame: async (gameId) => {
    set({ isLoading: true, error: null });
    
    try {
      const game = await GameRepository.findWithRelations(gameId);
      if (!game) throw new Error('Game not found');

      const [homeRoster, awayRoster, periods, events] = await Promise.all([
        PlayerRepository.findByGameAndTeam(game.id, game.homeTeamId),
        PlayerRepository.findByGameAndTeam(game.id, game.awayTeamId),
        PeriodRepository.findByGameId(game.id),
        EventRepository.findByGameId(game.id),
      ]);

      const score = await EventRepository.getScoreForGame(game.id);
      const bonus = await EventRepository.getFoulsForGame(game.id);

      // Find current period
      const activePeriod = periods.find(p => p.startsAt && !p.endsAt);
      
      set({
        game,
        homeRoster,
        awayRoster,
        periods,
        events,
        score,
        bonus,
        currentPeriod: activePeriod?.number || 1,
        isLoading: false,
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load game',
        isLoading: false,
      });
    }
  },

  addEvent: async (data) => {
    const { game, currentPeriod, gameTime, periods } = get();
    if (!game) throw new Error('No game loaded');

    const period = periods.find(p => p.number === currentPeriod);
    if (!period) throw new Error('Period not found');

    const event = await EventRepository.create({
      gameId: game.id,
      gameLocalId: game.localId || String(game.id),
      teamId: data.teamId,
      playerId: data.playerId,
      coachId: data.coachId,
      periodId: period.id,
      type: data.type,
      gameTime,
      value: data.value,
      foulShots: data.foulShots,
    });

    set(state => ({ events: [...state.events, event] }));
    
    // Refresh score
    await get().refreshScore();
    
    return event;
  },

  updateEvent: async (localId, updates) => {
    await EventRepository.update(localId, updates);
    
    set(state => ({
      events: state.events.map(e => 
        e.localId === localId ? { ...e, ...updates } : e
      ),
    }));
    
    await get().refreshScore();
  },

  deleteEvent: async (localId) => {
    await EventRepository.delete(localId);
    
    set(state => ({
      events: state.events.filter(e => e.localId !== localId),
    }));
    
    await get().refreshScore();
  },

  startPeriod: async (periodNumber) => {
    const { game, periods } = get();
    if (!game) return;

    let period = periods.find(p => p.number === periodNumber);
    
    if (!period) {
      period = await PeriodRepository.create({
        gameId: game.id,
        number: periodNumber,
      });
      set(state => ({ periods: [...state.periods, period!] }));
    }

    const updated = await PeriodRepository.startPeriod(period.localId!);
    
    set(state => ({
      periods: state.periods.map(p => 
        p.localId === period!.localId ? updated : p
      ),
      currentPeriod: periodNumber,
    }));
  },

  endPeriod: async () => {
    const { periods, currentPeriod } = get();
    const period = periods.find(p => p.number === currentPeriod);
    
    if (period?.localId) {
      const updated = await PeriodRepository.endPeriod(period.localId);
      
      set(state => ({
        periods: state.periods.map(p => 
          p.localId === period.localId ? updated : p
        ),
      }));
    }
  },

  startGame: async () => {
    const { game } = get();
    if (!game?.localId) return;

    await GameRepository.updateStatus(game.localId, 'live', new Date().toISOString());
    
    set(state => ({
      game: state.game ? { ...state.game, status: 'live' } : null,
    }));
    
    // Create default periods if none exist
    const { periods } = get();
    if (periods.length === 0 && game) {
      const newPeriods = await PeriodRepository.createDefaultPeriods(game.id, 4);
      set({ periods: newPeriods });
    }
  },

  endGame: async () => {
    const { game } = get();
    if (!game?.localId) return;

    // End current period if active
    await get().endPeriod();

    await GameRepository.updateStatus(game.localId, 'completed', new Date().toISOString());
    
    set(state => ({
      game: state.game ? { ...state.game, status: 'completed' } : null,
    }));

    // Trigger sync
    syncService.syncNow();
  },

  setGameTime: (seconds) => {
    set({ gameTime: Math.max(0, seconds) });
  },

  substitutePlayer: async (playerIn, playerOut) => {
    const { game, gameTime, currentPeriod } = get();
    if (!game) return;

    // Update player status
    if (playerOut.localId) {
      await PlayerRepository.updatePlayerStatus(playerOut.localId, false);
    }
    if (playerIn.localId) {
      await PlayerRepository.updatePlayerStatus(playerIn.localId, true);
    }

    // Create substitution events
    const period = get().periods.find(p => p.number === currentPeriod);
    if (period) {
      await EventRepository.create({
        gameId: game.id,
        gameLocalId: game.localId || String(game.id),
        teamId: playerIn.teamId,
        playerId: playerOut.id,
        periodId: period.id,
        type: 'SUB_OUT',
        gameTime,
      });

      await EventRepository.create({
        gameId: game.id,
        gameLocalId: game.localId || String(game.id),
        teamId: playerIn.teamId,
        playerId: playerIn.id,
        periodId: period.id,
        type: 'SUB_IN',
        gameTime,
      });
    }

    // Refresh rosters
    const [homeRoster, awayRoster] = await Promise.all([
      PlayerRepository.findByGameAndTeam(game.id, game.homeTeamId),
      PlayerRepository.findByGameAndTeam(game.id, game.awayTeamId),
    ]);

    set({ homeRoster, awayRoster });
  },

  refreshScore: async () => {
    const { game } = get();
    if (!game) return;

    const [score, bonus] = await Promise.all([
      EventRepository.getScoreForGame(game.id),
      EventRepository.getFoulsForGame(game.id),
    ]);

    set({ score, bonus });
  },

  reset: () => {
    set({
      game: null,
      homeRoster: [],
      awayRoster: [],
      periods: [],
      events: [],
      currentPeriod: 1,
      gameTime: 600,
      score: { home: 0, away: 0 },
      bonus: { home: 0, away: 0 },
      isLoading: false,
      error: null,
    });
  },
}));
