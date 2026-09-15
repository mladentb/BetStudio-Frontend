'use client';

import { useState } from 'react';
import { Copy, Check, Code2, Terminal, Zap, Package, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function SDKPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language = 'typescript', id }: { code: string; language?: string; id: string }) => (
    <div className="relative">
      <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => copyCode(code, id)}
        className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
      >
        {copiedCode === id ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-gray-400" />
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-purple-600">
            BetStudio SDK
          </Link>
          <div className="flex gap-4">
            <Link
              href="/api-docs"
              className="text-gray-600 dark:text-gray-300 hover:text-purple-600"
            >
              API Docs
            </Link>
            <Link
              href="/swagger"
              className="text-gray-600 dark:text-gray-300 hover:text-purple-600"
            >
              Swagger
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Get API Key
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-4">
            <Package className="h-4 w-4" />
            @betstudio/sdk v1.0.0
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            BetStudio JavaScript SDK
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Official TypeScript/JavaScript client for BetStudio API. 
            Full type support, zero dependencies, works everywhere.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Code2 className="h-10 w-10 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">TypeScript First</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Full type definitions included. Autocomplete and type checking out of the box.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Zap className="h-10 w-10 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Zero Dependencies</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Uses native fetch API. No external dependencies to worry about.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Terminal className="h-10 w-10 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Universal</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Works in Node.js, browsers, React, Next.js, and any JavaScript runtime.
            </p>
          </div>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Installation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
              <p className="text-sm text-gray-500 mb-2">npm</p>
              <CodeBlock code="npm install @betstudio/sdk" language="bash" id="npm" />
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
              <p className="text-sm text-gray-500 mb-2">yarn</p>
              <CodeBlock code="yarn add @betstudio/sdk" language="bash" id="yarn" />
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
              <p className="text-sm text-gray-500 mb-2">pnpm</p>
              <CodeBlock code="pnpm add @betstudio/sdk" language="bash" id="pnpm" />
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Quick Start
          </h2>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <CodeBlock
              id="quickstart"
              code={`import { createBetStudioClient } from '@betstudio/sdk';

// Initialize the client
const client = createBetStudioClient({
  apiKey: 'your-api-key-here',
});

// Get live games
const { data: liveGames } = await client.getLiveGames();
console.log('Live games:', liveGames);

// Get today's games
const { data: todayGames } = await client.getTodayGames();
console.log('Today\\'s games:', todayGames);

// Get games with filters
const games = await client.getGames({
  sport_id: 1,
  status: 'scheduled',
  per_page: 20,
});
console.log('Filtered games:', games.data);`}
            />
          </div>
        </section>

        {/* API Methods */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            API Methods
          </h2>
          
          <div className="space-y-6">
            {/* Sports */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">Sports</h3>
              <CodeBlock
                id="sports"
                code={`// Get all sports
const { data: sports } = await client.getSports();

// Response type: Sport[]
// { id, name, slug, leagues_count, games_count }`}
              />
            </div>

            {/* Leagues */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">Leagues</h3>
              <CodeBlock
                id="leagues"
                code={`// Get all leagues
const { data: leagues } = await client.getLeagues();

// Get leagues by sport
const { data: handballLeagues } = await client.getLeagues(1);

// Response type: League[]
// { id, name, sport: { id, name }, country, games_count }`}
              />
            </div>

            {/* Games */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">Games</h3>
              <CodeBlock
                id="games"
                code={`// Get games with filters
const games = await client.getGames({
  sport_id: 1,        // Filter by sport
  league_id: 5,       // Filter by league
  date: '2026-02-05', // Filter by date
  status: 'live',     // 'scheduled' | 'live' | 'finished'
  per_page: 50,       // Max 100
  page: 1,
});

// Get single game
const { data: game } = await client.getGame(123);

// Get live games
const { data: live } = await client.getLiveGames();

// Get today's games
const { data: today } = await client.getTodayGames();

// Get upcoming games (next 7 days)
const { data: upcoming } = await client.getUpcomingGames(7);`}
              />
            </div>

            {/* Statistics */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">Statistics</h3>
              <CodeBlock
                id="stats"
                code={`// Get platform stats
const { data: stats } = await client.getStats();

console.log(stats.total_games);    // Total games in database
console.log(stats.live_games);     // Currently live
console.log(stats.today_games);    // Games today
console.log(stats.upcoming_games); // Scheduled games`}
              />
            </div>
          </div>
        </section>

        {/* React Example */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">React Example</h2>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <CodeBlock
              id="react"
              code={`import { useState, useEffect } from 'react';
import { createBetStudioClient, Game } from '@betstudio/sdk';

const client = createBetStudioClient({ 
  apiKey: process.env.NEXT_PUBLIC_BETSTUDIO_API_KEY! 
});

export function LiveGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { data } = await client.getLiveGames();
        setGames(data);
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
    // Refresh every 30 seconds
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Live Games ({games.length})</h2>
      {games.map(game => (
        <div key={game.id}>
          {game.home_team} {game.home_score} - {game.away_score} {game.away_team}
        </div>
      ))}
    </div>
  );
}`}
            />
          </div>
        </section>

        {/* Error Handling */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Handling</h2>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <CodeBlock
              id="errors"
              code={`try {
  const games = await client.getLiveGames();
} catch (error: any) {
  switch (error.status) {
    case 401:
      console.error('Invalid API key');
      break;
    case 403:
      console.error('API key expired or permission denied');
      break;
    case 429:
      console.error('Rate limit exceeded');
      break;
    default:
      console.error('API error:', error.message);
  }
}`}
            />
          </div>
        </section>

        {/* TypeScript Types */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">TypeScript Types</h2>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <CodeBlock
              id="types"
              code={`import { 
  BetStudioSDK,
  Sport,
  League,
  Game,
  GamesFilter,
  StatsOverview,
  ApiResponse,
  PaginatedResponse,
  BetStudioConfig,
  ApiError
} from '@betstudio/sdk';

// All types are fully exported and documented`}
            />
          </div>
        </section>

        {/* Links */}
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="https://github.com/betstudio/sdk-js"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/@betstudio/sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Package className="h-5 w-5" />
            npm
          </a>
          <Link
            href="/api-docs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            API Documentation
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-500">
          <p>© 2026 BetStudio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
