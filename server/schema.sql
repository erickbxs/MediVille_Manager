-- ==============================================================================
-- Arquivo: server/schema.sql
-- 1. O que este arquivo faz?
-- Define o esquema SQL relacional para o banco de dados Cloudflare D1 do MediVille Manager.
-- 2. Para que foi criado no contexto do sistema?
-- Armazenar contas de usuários, backups de saves em nuvem e a tabela global de leaderboard (Ranking).
-- 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
-- Execute via Wrangler: npx wrangler d1 execute mediville-db --file=./server/schema.sql
-- Conecta-se com: server/worker.ts, src/services/ranking-service.ts
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  provider_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saves (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  slot_index INTEGER NOT NULL,
  save_data TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL,
  days INTEGER NOT NULL,
  patients_treated INTEGER NOT NULL,
  unit_type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_saves_user_slot ON saves(user_id, slot_index);
