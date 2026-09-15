'use client';

import { useEffect, useRef } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

// OpenAPI specification
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'BetStudio Public API',
    version: '1.0.0',
    description: 'API za pristup sportskim podacima, rasporedima mečeva i live rezultatima.\n\n## Autentifikacija\nSvi zahtevi moraju sadržati API ključ u `X-API-Key` header-u.\n\n## Rate Limiting\n- Free: 100 zahteva/dan\n- Starter: 1,000 zahteva/dan\n- Pro: 10,000 zahteva/dan\n- Enterprise: 100,000 zahteva/dan',
    contact: {
      name: 'BetStudio API Support',
      email: 'api@betstudio.com',
    },
  },
  servers: [
    {
      url: 'http://127.0.0.1:8000/api/v1',
      description: 'Development server',
    },
    {
      url: 'https://api.betstudio.com/v1',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
    schemas: {
      Sport: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Rukomet' },
          slug: { type: 'string', example: 'rukomet' },
          leagues_count: { type: 'integer', example: 5 },
          games_count: { type: 'integer', example: 234 },
        },
      },
      League: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Bundesliga' },
          sport: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
            },
          },
          country: { type: 'string', example: 'Germany' },
          games_count: { type: 'integer', example: 45 },
        },
      },
      Game: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 123 },
          home_team: { type: 'string', example: 'THW Kiel' },
          away_team: { type: 'string', example: 'Flensburg' },
          game_datetime: { type: 'string', format: 'date-time', example: '2026-02-05T18:00:00Z' },
          status: { type: 'string', enum: ['scheduled', 'live', 'finished'], example: 'scheduled' },
          home_score: { type: 'integer', nullable: true, example: null },
          away_score: { type: 'integer', nullable: true, example: null },
          venue: { type: 'string', nullable: true, example: 'Sparkassen-Arena' },
          round: { type: 'string', nullable: true, example: '15' },
          league: { $ref: '#/components/schemas/League' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    '/sports': {
      get: {
        summary: 'Lista svih sportova',
        description: 'Vraća listu svih dostupnih sportova sa brojem liga i utakmica.',
        tags: ['Sports'],
        responses: {
          '200': {
            description: 'Uspešno',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Sport' },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        cached_at: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Neispravan API ključ' },
        },
      },
    },
    '/leagues': {
      get: {
        summary: 'Lista svih liga',
        description: 'Vraća listu svih liga sa opcionalnim filterom po sportu.',
        tags: ['Leagues'],
        parameters: [
          {
            name: 'sport_id',
            in: 'query',
            description: 'Filter po ID sporta',
            required: false,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '200': {
            description: 'Uspešno',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/League' },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/games': {
      get: {
        summary: 'Lista mečeva sa filterima',
        description: 'Vraća paginiranu listu mečeva sa različitim filterima.',
        tags: ['Games'],
        parameters: [
          { name: 'sport_id', in: 'query', schema: { type: 'integer' }, description: 'Filter po sportu' },
          { name: 'league_id', in: 'query', schema: { type: 'integer' }, description: 'Filter po ligi' },
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter po datumu (YYYY-MM-DD)' },
          { name: 'date_from', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Početak opsega datuma' },
          { name: 'date_to', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Kraj opsega datuma' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['scheduled', 'live', 'finished'] }, description: 'Filter po statusu' },
          { name: 'per_page', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 }, description: 'Rezultata po stranici' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Broj stranice' },
        ],
        responses: {
          '200': {
            description: 'Uspešno',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Game' } },
                    meta: {
                      type: 'object',
                      properties: {
                        current_page: { type: 'integer' },
                        per_page: { type: 'integer' },
                        total: { type: 'integer' },
                        last_page: { type: 'integer' },
                      },
                    },
                    links: {
                      type: 'object',
                      properties: {
                        first: { type: 'string' },
                        last: { type: 'string' },
                        prev: { type: 'string', nullable: true },
                        next: { type: 'string', nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/games/live': {
      get: {
        summary: 'Mečevi uživo',
        description: 'Vraća sve mečeve koji su trenutno uživo.',
        tags: ['Games'],
        responses: {
          '200': {
            description: 'Uspešno',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Game' } },
                    meta: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        timestamp: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/games/today': {
      get: {
        summary: 'Današnji mečevi',
        description: 'Vraća sve mečeve za današnji dan.',
        tags: ['Games'],
        responses: {
          '200': {
            description: 'Uspešno',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Game' } },
                    meta: {
                      type: 'object',
                      properties: {
                        date: { type: 'string', format: 'date' },
                        total: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/games/upcoming': {
      get: {
        summary: 'Predstojeći mečevi',
        description: 'Vraća sve zakazane mečeve u narednih N dana.',
        tags: ['Games'],
        parameters: [
          {
            name: 'days',
            in: 'query',
            schema: { type: 'integer', default: 7, maximum: 30 },
            description: 'Broj dana unapred (max 30)',
          },
        ],
        responses: {
          '200': {
            description: 'Uspešno',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Game' } },
                    meta: {
                      type: 'object',
                      properties: {
                        days: { type: 'integer' },
                        total: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/games/{id}': {
      get: {
        summary: 'Detalji meča',
        description: 'Vraća detaljne informacije o pojedinačnom meču.',
        tags: ['Games'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'ID meča',
          },
        ],
        responses: {
          '200': {
            description: 'Uspešno',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { $ref: '#/components/schemas/Game' },
                  },
                },
              },
            },
          },
          '404': { description: 'Meč nije pronađen' },
        },
      },
    },
    '/stats/overview': {
      get: {
        summary: 'Statistički pregled',
        description: 'Vraća opšti statistički pregled platforme.',
        tags: ['Statistics'],
        responses: {
          '200': {
            description: 'Uspešno',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        sports_count: { type: 'integer' },
                        leagues_count: { type: 'integer' },
                        total_games: { type: 'integer' },
                        live_games: { type: 'integer' },
                        today_games: { type: 'integer' },
                        upcoming_games: { type: 'integer' },
                      },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        generated_at: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Sports', description: 'Operacije vezane za sportove' },
    { name: 'Leagues', description: 'Operacije vezane za lige' },
    { name: 'Games', description: 'Operacije vezane za mečeve' },
    { name: 'Statistics', description: 'Statistički podaci' },
  ],
};

export default function SwaggerPage() {
  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI spec={openApiSpec} />
    </div>
  );
}
