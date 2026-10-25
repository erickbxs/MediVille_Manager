/**
 * Arquivo: server/worker.ts
 *
 * 1. O que este arquivo faz?
 * Cloudflare Worker para a API serverless do MediVille Manager, fornecendo endpoints de ranking (leaderboard)
 * conectado ao Cloudflare D1 e suporte a CORS para o cliente web.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Atender à Parte 3 do Prompt 14, viabilizando o ranking global e sincronização rápida em nuvem.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Teste localmente com 'npx wrangler dev server/worker.ts'. Verifique as permissões de binding do D1 (env.DB).
 *
 * Conecta-se com: server/schema.sql, src/services/ranking-service.ts
 */

export interface Env {
  DB?: {
    prepare: (query: string) => {
      bind: (...args: unknown[]) => {
        all: () => Promise<{ results: unknown[] }>;
        run: () => Promise<{ success: boolean }>;
      };
    };
  };
}

export interface LeaderboardRow {
  id: string;
  nickname: string;
  score: number;
  days: number;
  patients_treated: number;
  unit_type: string;
  created_at: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

async function handleGetLeaderboard(env: Env): Promise<Response> {
  if (!env.DB) {
    return jsonResponse({ error: 'Database binding unavailable' }, 503);
  }
  const query = 'SELECT id, nickname, score, days, patients_treated, unit_type, created_at FROM leaderboard ORDER BY score DESC LIMIT 50';
  const { results } = await env.DB.prepare(query).bind().all();
  return jsonResponse({ leaderboard: results });
}

async function handlePostLeaderboard(request: Request, env: Env): Promise<Response> {
  if (!env.DB) {
    return jsonResponse({ error: 'Database binding unavailable' }, 503);
  }
  try {
    const body = (await request.json()) as Partial<LeaderboardRow>;
    const { nickname, score, days, patients_treated, unit_type } = body;

    if (!nickname || typeof score !== 'number' || score < 0) {
      return jsonResponse({ error: 'Invalid score payload' }, 400);
    }

    const id = `lb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const query = `
      INSERT INTO leaderboard (id, nickname, score, days, patients_treated, unit_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    await env.DB.prepare(query)
      .bind(id, nickname.trim().slice(0, 16), score, days ?? 1, patients_treated ?? 0, unit_type ?? 'ubs')
      .run();

    return jsonResponse({ success: true, id }, 201);
  } catch (err) {
    return jsonResponse({ error: 'Failed to submit score', details: String(err) }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return jsonResponse({ status: 'ok', version: '1.3.0' });
    }

    if (url.pathname === '/api/leaderboard') {
      if (request.method === 'GET') {
        return handleGetLeaderboard(env);
      }
      if (request.method === 'POST') {
        return handlePostLeaderboard(request, env);
      }
    }

    return jsonResponse({ error: 'Not Found' }, 404);
  },
};
