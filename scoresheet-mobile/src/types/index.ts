// ==========================================
// CORE TYPES - Matching Laravel Models
// ==========================================

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

export interface Competition {
  id: number;
  name: string;
  season: string;
  external_id?: number;
}

export interface Team {
  id: number;
  name: string;
  color: string;
  logo?: string;
}

export interface Player {
  id: number;
  localId?: string; // For offline-created players
  teamId: number;
  jerseyNumber: number;
  firstName: string;
  lastName: string;
  isStarter: boolean;
  isPlayerIn: boolean;
  externalId?: number;
}

export interface Coach {
  id: number;
  localId?: string;
  teamId: number;
  firstName: string;
  lastName: string;
  role: 'head_coach' | 'assistant_coach' | 'team_manager';
  externalId?: number;
}

export interface GameOfficial {
  id: number;
  firstName: string;
  lastName: string;
  screenName: string;
  role: 'delegate' | 'first_referee' | 'second_referee' | 'third_referee';
  externalId?: number;
}

export interface Period {
  id: number;
  localId?: string;
  gameId: number;
  number: number;
  startsAt?: string;
  endsAt?: string;
}

export interface Game {
  id: number;
  localId?: string; // UUID for offline-created games
  competitionId: number;
  homeTeamId: number;
  awayTeamId: number;
  place: string;
  scheduledAt: string;
  startsAt?: string;
  endsAt?: string;
  status: GameStatus;
  
  // Officials
  delegateId?: number;
  firstRefereeId?: number;
  secondRefereeId?: number;
  thirdRefereeId?: number;
  
  // Relationships (populated from joins)
  homeTeam?: Team;
  awayTeam?: Team;
  competition?: Competition;
  periods?: Period[];
  delegate?: GameOfficial;
  firstReferee?: GameOfficial;
  secondReferee?: GameOfficial;
  thirdReferee?: GameOfficial;
}

export type GameStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

// ==========================================
// EVENT TYPES - Core of the scoring system
// ==========================================

export type EventType = 
  | 'FT'      // Free Throw
  | 'FTM'     // Free Throw Missed
  | '2PT'     // 2-Point Shot
  | '2PTM'    // 2-Point Missed
  | '3PT'     // 3-Point Shot
  | '3PTM'    // 3-Point Missed
  | 'PF'      // Personal Foul
  | 'TF'      // Technical Foul
  | 'UF'      // Unsportsmanlike Foul
  | 'DF'      // Disqualifying Foul
  | 'TO'      // Timeout
  | 'SUB_IN'  // Substitution In
  | 'SUB_OUT' // Substitution Out
  | 'PERIOD_START'
  | 'PERIOD_END';

export interface GameEvent {
  id: number;
  localId: string; // UUID - essential for offline sync
  gameId: number;
  teamId: number;
  playerId?: number;
  coachId?: number;
  periodId: number;
  
  type: EventType;
  gameTime: number; // seconds remaining in period
  value?: number;   // points scored, foul count, etc.
  
  // Foul-specific
  foulShots?: number;
  
  // Sync tracking
  synced: boolean;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // Soft delete for sync
}

// ==========================================
// SYNC TYPES - Offline/Online management
// ==========================================

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncQueueItem {
  id: number;
  localId: string;
  entityType: 'game' | 'event' | 'player' | 'period' | 'signature';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: string; // JSON stringified
  status: SyncStatus;
  attempts: number;
  lastError?: string;
  createdAt: string;
  processedAt?: string;
}

export interface SyncResult {
  success: boolean;
  localId: string;
  serverId?: number;
  error?: string;
}

// ==========================================
// UI/STATE TYPES
// ==========================================

export interface LiveGameState {
  game: Game;
  homeTeam: Team;
  awayTeam: Team;
  homeRoster: Player[];
  awayRoster: Player[];
  homeStaff: Coach[];
  awayStaff: Coach[];
  periods: Period[];
  events: GameEvent[];
  
  // Current state
  currentPeriod: number;
  gameTime: number;
  score: {
    home: number;
    away: number;
  };
  bonus: {
    home: number;
    away: number;
  };
  possession?: 'home' | 'away';
  
  // Court state
  homePlayersIn: number[];
  awayPlayersIn: number[];
}

export interface Signature {
  id: number;
  localId: string;
  gameId: number;
  personType: 'home_coach' | 'away_coach' | 'first_referee' | 'second_referee' | 'delegate';
  personId?: number;
  signatureData: string; // Base64 encoded
  signedAt: string;
  synced: boolean;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SyncBatchResponse {
  results: SyncResult[];
  serverTime: string;
}
