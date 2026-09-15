import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'scoresheet.db';
const DATABASE_VERSION = 1;

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  
  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  // Enable foreign keys
  await database.execAsync('PRAGMA foreign_keys = ON;');
  
  // Check current version
  const result = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const currentVersion = result?.user_version || 0;
  
  if (currentVersion < DATABASE_VERSION) {
    await runMigrations(database, currentVersion);
    await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
  }
}

async function runMigrations(
  database: SQLite.SQLiteDatabase, 
  fromVersion: number
): Promise<void> {
  // Version 0 -> 1: Initial schema
  if (fromVersion < 1) {
    await createInitialSchema(database);
  }
  
  // Future migrations go here:
  // if (fromVersion < 2) { ... }
}

async function createInitialSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- Users table (cached from server)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      roles TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Competitions table
    CREATE TABLE IF NOT EXISTS competitions (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      season TEXT,
      external_id INTEGER,
      synced INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Teams table
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY,
      local_id TEXT UNIQUE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#000000',
      logo TEXT,
      synced INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Game Officials table
    CREATE TABLE IF NOT EXISTS game_officials (
      id INTEGER PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      screen_name TEXT,
      role TEXT NOT NULL,
      external_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Games table
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT UNIQUE NOT NULL,
      server_id INTEGER UNIQUE,
      competition_id INTEGER,
      home_team_id INTEGER NOT NULL,
      away_team_id INTEGER NOT NULL,
      place TEXT,
      scheduled_at TEXT NOT NULL,
      starts_at TEXT,
      ends_at TEXT,
      status TEXT DEFAULT 'scheduled',
      delegate_id INTEGER,
      first_referee_id INTEGER,
      second_referee_id INTEGER,
      third_referee_id INTEGER,
      synced INTEGER DEFAULT 0,
      synced_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competition_id) REFERENCES competitions(id),
      FOREIGN KEY (home_team_id) REFERENCES teams(id),
      FOREIGN KEY (away_team_id) REFERENCES teams(id)
    );

    -- Players table
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT UNIQUE NOT NULL,
      server_id INTEGER,
      team_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      jersey_number INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      is_starter INTEGER DEFAULT 0,
      is_player_in INTEGER DEFAULT 0,
      external_id INTEGER,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    -- Coaches table
    CREATE TABLE IF NOT EXISTS coaches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT UNIQUE NOT NULL,
      server_id INTEGER,
      team_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT DEFAULT 'head_coach',
      external_id INTEGER,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    -- Periods table
    CREATE TABLE IF NOT EXISTS periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT UNIQUE NOT NULL,
      server_id INTEGER,
      game_id INTEGER NOT NULL,
      number INTEGER NOT NULL,
      starts_at TEXT,
      ends_at TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    -- Events table (core scoring data)
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT UNIQUE NOT NULL,
      server_id INTEGER,
      game_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL,
      player_id INTEGER,
      coach_id INTEGER,
      period_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      game_time INTEGER NOT NULL,
      value INTEGER,
      foul_shots INTEGER,
      synced INTEGER DEFAULT 0,
      synced_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id),
      FOREIGN KEY (player_id) REFERENCES players(id),
      FOREIGN KEY (coach_id) REFERENCES coaches(id),
      FOREIGN KEY (period_id) REFERENCES periods(id)
    );

    -- Signatures table
    CREATE TABLE IF NOT EXISTS signatures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT UNIQUE NOT NULL,
      server_id INTEGER,
      game_id INTEGER NOT NULL,
      person_type TEXT NOT NULL,
      person_id INTEGER,
      signature_data TEXT NOT NULL,
      signed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    -- Sync Queue table
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      local_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      last_error TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      processed_at TEXT
    );

    -- Auth token storage
    CREATE TABLE IF NOT EXISTS auth (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id INTEGER,
      token TEXT,
      refresh_token TEXT,
      expires_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_events_game_id ON events(game_id);
    CREATE INDEX IF NOT EXISTS idx_events_synced ON events(synced);
    CREATE INDEX IF NOT EXISTS idx_events_local_id ON events(local_id);
    CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
    CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
    CREATE INDEX IF NOT EXISTS idx_games_local_id ON games(local_id);
  `);
  
  console.log('✅ Database schema created successfully');
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

export async function resetDatabase(): Promise<void> {
  await closeDatabase();
  await SQLite.deleteDatabaseAsync(DATABASE_NAME);
  db = null;
}
