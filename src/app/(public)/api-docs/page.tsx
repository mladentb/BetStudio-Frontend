'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, Code2, Zap, Shield, Globe } from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

interface EndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  response?: string;
}

function Endpoint({ method, path, description, parameters, response }: EndpointProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const methodColors = {
    GET: 'bg-green-500',
    POST: 'bg-blue-500',
    PUT: 'bg-yellow-500',
    DELETE: 'bg-red-500',
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fullUrl = `${API_BASE}/v1${path}`;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className={`px-2 py-1 text-xs font-bold text-white rounded ${methodColors[method]}`}>
          {method}
        </span>
        <code className="flex-1 text-left text-sm font-mono text-gray-700 dark:text-gray-300">
          /v1{path}
        </code>
        <span className="text-sm text-gray-500 hidden md:block">{description}</span>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/30">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>

          {/* Full URL */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase font-medium">Full URL</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 p-2 bg-gray-900 text-green-400 rounded text-sm font-mono overflow-x-auto">
                {fullUrl}
              </code>
              <button
                onClick={() => copyToClipboard(fullUrl)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Parameters */}
          {parameters && parameters.length > 0 && (
            <div className="mb-4">
              <label className="text-xs text-gray-500 uppercase font-medium">Parameters</label>
              <table className="w-full mt-2 text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Required</th>
                    <th className="pb-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((param) => (
                    <tr key={param.name} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="py-2 font-mono text-purple-600">{param.name}</td>
                      <td className="py-2 text-gray-500">{param.type}</td>
                      <td className="py-2">
                        {param.required ? (
                          <span className="text-red-500">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Example Response */}
          {response && (
            <div>
              <label className="text-xs text-gray-500 uppercase font-medium">Example Response</label>
              <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-sm">
                {response}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApiDocsPage() {
  const [copied, setCopied] = useState(false);

  const copyApiKey = () => {
    navigator.clipboard.writeText('X-API-Key: your_api_key_here');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-purple-600">
            BetStudio API
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/sdk"
              className="text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors"
            >
              SDK
            </Link>
            <Link
              href="/swagger"
              className="text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors"
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
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            BetStudio Public API
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Access real-time sports data, match schedules, and live results. 
            Build prediction markets, betting apps, or sports analytics platforms.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Zap className="h-10 w-10 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time Data</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Live scores and match updates with minimal latency
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Shield className="h-10 w-10 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Reliable & Secure</h3>
            <p className="text-gray-600 dark:text-gray-400">
              99.9% uptime with API key authentication and rate limiting
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <Globe className="h-10 w-10 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Global Coverage</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Handball, Basketball, Volleyball leagues worldwide
            </p>
          </div>
        </div>

        {/* Authentication */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication</h2>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              All API requests require authentication via API key. Include your key in the request header:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-gray-900 text-green-400 rounded-lg font-mono">
                X-API-Key: your_api_key_here
              </code>
              <button
                onClick={copyApiKey}
                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Don&apos;t have an API key? <Link href="/login" className="text-purple-600 hover:underline">Sign up</Link> to get one.
            </p>
          </div>
        </section>

        {/* Rate Limits */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Rate Limits</h2>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Requests/Day</th>
                  <th className="pb-3">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 font-medium">Free</td>
                  <td className="py-3">100</td>
                  <td className="py-3">$0/month</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 font-medium">Starter</td>
                  <td className="py-3">1,000</td>
                  <td className="py-3">$49/month</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 font-medium">Pro</td>
                  <td className="py-3">10,000</td>
                  <td className="py-3">$199/month</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Enterprise</td>
                  <td className="py-3">Unlimited</td>
                  <td className="py-3">Contact us</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Endpoints</h2>
          
          {/* Sports */}
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-8 mb-4">Sports</h3>
          <div className="space-y-3">
            <Endpoint
              method="GET"
              path="/sports"
              description="List all available sports"
              response={`{
  "data": [
    {
      "id": 1,
      "name": "Rukomet",
      "slug": "rukomet",
      "leagues_count": 5,
      "games_count": 234
    }
  ],
  "meta": { "total": 3 }
}`}
            />
          </div>

          {/* Leagues */}
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-8 mb-4">Leagues</h3>
          <div className="space-y-3">
            <Endpoint
              method="GET"
              path="/leagues"
              description="List all leagues"
              parameters={[
                { name: 'sport_id', type: 'integer', required: false, description: 'Filter by sport ID' },
              ]}
              response={`{
  "data": [
    {
      "id": 1,
      "name": "Bundesliga",
      "sport": { "id": 1, "name": "Rukomet" },
      "country": "Germany",
      "games_count": 45
    }
  ],
  "meta": { "total": 15 }
}`}
            />
          </div>

          {/* Games */}
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-8 mb-4">Games</h3>
          <div className="space-y-3">
            <Endpoint
              method="GET"
              path="/games"
              description="List games with filters"
              parameters={[
                { name: 'sport_id', type: 'integer', required: false, description: 'Filter by sport' },
                { name: 'league_id', type: 'integer', required: false, description: 'Filter by league' },
                { name: 'date', type: 'string', required: false, description: 'Filter by date (YYYY-MM-DD)' },
                { name: 'date_from', type: 'string', required: false, description: 'Date range start' },
                { name: 'date_to', type: 'string', required: false, description: 'Date range end' },
                { name: 'status', type: 'string', required: false, description: 'scheduled, live, finished' },
                { name: 'per_page', type: 'integer', required: false, description: 'Results per page (max 100)' },
              ]}
              response={`{
  "data": [
    {
      "id": 123,
      "home_team": "THW Kiel",
      "away_team": "Flensburg",
      "game_datetime": "2026-02-05T18:00:00Z",
      "status": "scheduled",
      "home_score": null,
      "away_score": null,
      "league": { "id": 1, "name": "Bundesliga" },
      "sport": { "id": 1, "name": "Rukomet" }
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 50,
    "total": 234
  }
}`}
            />
            <Endpoint
              method="GET"
              path="/games/live"
              description="Get all live games"
              response={`{
  "data": [...],
  "meta": { "total": 5, "timestamp": "2026-02-05T15:30:00Z" }
}`}
            />
            <Endpoint
              method="GET"
              path="/games/today"
              description="Get today's games"
              response={`{
  "data": [...],
  "meta": { "date": "2026-02-05", "total": 12 }
}`}
            />
            <Endpoint
              method="GET"
              path="/games/upcoming"
              description="Get upcoming games"
              parameters={[
                { name: 'days', type: 'integer', required: false, description: 'Number of days (default: 7, max: 30)' },
              ]}
            />
            <Endpoint
              method="GET"
              path="/games/{id}"
              description="Get single game details"
              parameters={[
                { name: 'id', type: 'integer', required: true, description: 'Game ID' },
              ]}
            />
          </div>

          {/* Statistics */}
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-8 mb-4">Statistics</h3>
          <div className="space-y-3">
            <Endpoint
              method="GET"
              path="/stats/overview"
              description="Get platform statistics overview"
              response={`{
  "data": {
    "sports_count": 3,
    "leagues_count": 15,
    "total_games": 689,
    "live_games": 2,
    "today_games": 12,
    "upcoming_games": 156
  },
  "meta": { "generated_at": "2026-02-05T15:30:00Z" }
}`}
            />
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Code Examples</h2>
          
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">JavaScript / Node.js</h3>
            <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-sm">
{`const response = await fetch('${API_BASE}/v1/games/today', {
  headers: {
    'X-API-Key': 'your_api_key_here'
  }
});

const data = await response.json();
console.log(data.data); // Array of today's games`}
            </pre>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm mt-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Python</h3>
            <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-sm">
{`import requests

response = requests.get(
    '${API_BASE}/v1/games/today',
    headers={'X-API-Key': 'your_api_key_here'}
)

data = response.json()
print(data['data'])  # List of today's games`}
            </pre>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm mt-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">cURL</h3>
            <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-sm">
{`curl -X GET "${API_BASE}/v1/games/today" \\
  -H "X-API-Key: your_api_key_here"`}
            </pre>
          </div>
        </section>

        {/* Contact */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Need Help?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Contact our API support team for assistance with integration or custom solutions.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/sdk"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Code2 className="h-5 w-5" />
              JavaScript SDK
            </Link>
            <Link
              href="/swagger"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Globe className="h-5 w-5" />
              Try in Swagger
            </Link>
            <a
              href="mailto:api@betstudio.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Shield className="h-5 w-5" />
              Contact Support
            </a>
          </div>
        </section>
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
