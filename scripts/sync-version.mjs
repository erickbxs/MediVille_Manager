/**
 * Arquivo: scripts/sync-version.mjs
 *
 * 1. O que este arquivo faz?
 * Sincroniza a versão semântica do package.json com o Service Worker (public/sw.js),
 * o manifesto do Tauri (tauri.conf.json) e a pasta dist (se existente), garantindo
 * cache-busting automático no PWA e expurgo de versões obsoletas no navegador do usuário.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 1 e 2 do Prompt 20 e a Skill release-e-deploy-web, impedindo que a aplicação
 * web permaneça presa em caches legados e centralizando a versão única no package.json.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute via `node scripts/sync-version.mjs`. Verifique o valor de CACHE_NAME em public/sw.js
 * e certifique-se de que corresponda ao valor do package.json.
 *
 * Importa: node:fs, node:path
 * Conecta-se com: package.json, public/sw.js, tauri.conf.json, dist/sw.js
 */

import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const pkgPath = path.resolve(rootDir, 'package.json');
const swPath = path.resolve(rootDir, 'public/sw.js');
const tauriPath = path.resolve(rootDir, 'tauri.conf.json');
const distSwPath = path.resolve(rootDir, 'dist/sw.js');

if (!fs.existsSync(pkgPath)) {
  console.error('[sync-version] Erro: package.json não encontrado.');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const version = pkg.version;
if (!version) {
  console.error('[sync-version] Erro: Campo "version" não encontrado no package.json.');
  process.exit(1);
}

const newCacheName = `mediville-cache-v${version}`;

// 1. Atualiza public/sw.js
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf-8');
  // Substitui a constante CACHE_NAME
  const cacheRegex = /const\s+CACHE_NAME\s*=\s*['"][^'"]+['"];/;
  if (cacheRegex.test(swContent)) {
    swContent = swContent.replace(cacheRegex, `const CACHE_NAME = '${newCacheName}';`);
  } else {
    swContent = `const CACHE_NAME = '${newCacheName}';\n` + swContent;
  }
  fs.writeFileSync(swPath, swContent, 'utf-8');
  console.log(`[sync-version] public/sw.js atualizado -> CACHE_NAME: ${newCacheName}`);
}

// 2. Atualiza tauri.conf.json se existir
if (fs.existsSync(tauriPath)) {
  try {
    const tauriConfig = JSON.parse(fs.readFileSync(tauriPath, 'utf-8'));
    tauriConfig.version = version;
    fs.writeFileSync(tauriPath, JSON.stringify(tauriConfig, null, 2) + '\n', 'utf-8');
    console.log(`[sync-version] tauri.conf.json atualizado -> version: ${version}`);
  } catch (err) {
    console.warn('[sync-version] Aviso ao atualizar tauri.conf.json:', err);
  }
}

// 3. Atualiza dist/sw.js se a pasta dist já foi gerada
if (fs.existsSync(distSwPath)) {
  let distSw = fs.readFileSync(distSwPath, 'utf-8');
  distSw = distSw.replace(/const\s+CACHE_NAME\s*=\s*['"][^'"]+['"];/, `const CACHE_NAME = '${newCacheName}';`);
  fs.writeFileSync(distSwPath, distSw, 'utf-8');
  console.log(`[sync-version] dist/sw.js sincronizado -> CACHE_NAME: ${newCacheName}`);
}

console.log(`✅ [sync-version] Sincronização v${version} finalizada com sucesso!`);
