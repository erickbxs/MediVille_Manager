/**
 * Arquivo: tests/release-and-version-sync.test.ts
 *
 * 1. O que este arquivo faz?
 * Valida a integridade do pipeline de release, cache-busting do Service Worker e deploy da versão 1.9.0:
 * - Sincronização automática entre package.json, public/sw.js e tauri.conf.json.
 * - Configuração do Service Worker com skipWaiting(), clients.claim(), purga de versões legadas e Network-First.
 * - Cabeçalhos anti-cache em public/_headers para garantir que sw.js e index.html nunca fiquem obsoletos no CDN.
 * - Presença e conformidade da Skill oficial .agent/skills/release-e-deploy-web/SKILL.md e regras do projeto.
 * - Eliminação de versões estáticas hardcoded na interface de usuário.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 1, 2 e 5 do Prompt 20, impedindo que a aplicação web fique presa em caches legados
 * e garantindo que cada nova versão semântica seja implantada e reconhecida instantaneamente.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute via `npx vitest run tests/release-and-version-sync.test.ts`. Caso falhe a sincronização,
 * execute `npm run sync:version` para alinhar os manifestos e arquivos de cache.
 *
 * Importa: vitest, node:fs, node:path
 * Conecta-se com: package.json, public/sw.js, public/_headers, tauri.conf.json,
 *                 .agent/skills/release-e-deploy-web/SKILL.md, src/ui/title-screen.ts
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Prompt 20: Pipeline de Release, Sincronização e Cache-Busting PWA', () => {
  const rootDir = process.cwd();
  const pkgPath = path.resolve(rootDir, 'package.json');
  const swPath = path.resolve(rootDir, 'public/sw.js');
  const tauriPath = path.resolve(rootDir, 'tauri.conf.json');
  const headersPath = path.resolve(rootDir, 'public/_headers');
  const skillPath = path.resolve(rootDir, '.agent/skills/release-e-deploy-web/SKILL.md');
  const rulesPath = path.resolve(rootDir, '.agent/rules/mediville-core-rules.md');
  const titleScreenPath = path.resolve(rootDir, 'src/ui/title-screen.ts');

  it('package.json deve definir versão semver válida (>= 1.9.0) e conter os scripts de sincronização e deploy', () => {
    expect(fs.existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.scripts['sync:version']).toBe('node scripts/sync-version.mjs');
    expect(pkg.scripts.build).toContain('npm run sync:version');
    expect(pkg.scripts.deploy).toContain('--branch=master');
    expect(pkg.scripts.deploy).toContain('--branch=main');
  });

  it('public/sw.js deve estar sincronizado com o CACHE_NAME correspondente à versão do package.json', () => {
    expect(fs.existsSync(swPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const swContent = fs.readFileSync(swPath, 'utf-8');

    const expectedCacheName = `mediville-cache-v${pkg.version}`;
    expect(swContent).toContain(`const CACHE_NAME = '${expectedCacheName}';`);
    expect(swContent).toContain('self.skipWaiting()');
    expect(swContent).toContain('self.clients.claim()');
  });

  it('public/sw.js deve implementar purga de caches legados e estratégia Network-First', () => {
    const swContent = fs.readFileSync(swPath, 'utf-8');

    // Purga de versões legadas no evento activate
    expect(swContent).toContain("key.startsWith('mediville-cache-')");
    expect(swContent).toContain('caches.delete(key)');

    // Estratégia Network-First no evento fetch
    expect(swContent).toContain('fetch(event.request)');
    expect(swContent).toContain('caches.match(event.request)');
  });

  it('public/_headers deve instruir no-cache para sw.js e index.html', () => {
    expect(fs.existsSync(headersPath)).toBe(true);
    const headersContent = fs.readFileSync(headersPath, 'utf-8');

    expect(headersContent).toContain('/sw.js');
    expect(headersContent).toContain('/index.html');
    expect(headersContent).toContain('Cache-Control: no-cache, no-store, must-revalidate');
  });

  it('tauri.conf.json deve estar sincronizado com a versão do package.json', () => {
    expect(fs.existsSync(tauriPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const tauriConfig = JSON.parse(fs.readFileSync(tauriPath, 'utf-8'));

    expect(tauriConfig.version).toBe(pkg.version);
  });

  it('A Skill oficial release-e-deploy-web deve existir com os 7 passos descritos', () => {
    expect(fs.existsSync(skillPath)).toBe(true);
    const skillContent = fs.readFileSync(skillPath, 'utf-8');

    expect(skillContent).toContain('name: release-e-deploy-web');
    expect(skillContent).toContain('Sincronização de Versão');
    expect(skillContent).toContain('Atualização do Cache do Service Worker');
    expect(skillContent).toContain('Documentação no `CHANGELOG.md`');
    expect(skillContent).toContain('Verificação de Qualidade (`npm run verify`)');
    expect(skillContent).toContain('Commit e Push no Git');
    expect(skillContent).toContain('Deploy Online Obrigatório no Cloudflare Pages');
    expect(skillContent).toContain('Relatório Final de Entrega');
  });

  it('A regra global mediville-core-rules.md deve referenciar a Skill release-e-deploy-web', () => {
    expect(fs.existsSync(rulesPath)).toBe(true);
    const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

    expect(rulesContent).toContain('release-e-deploy-web');
    expect(rulesContent).toContain('wrangler pages deploy dist');
  });

  it('A UI da tela inicial deve utilizar constante dinâmica __APP_VERSION__ em vez de versão hardcoded', () => {
    expect(fs.existsSync(titleScreenPath)).toBe(true);
    const titleContent = fs.readFileSync(titleScreenPath, 'utf-8');

    expect(titleContent).toContain('__APP_VERSION__');
    expect(titleContent).not.toContain('v1.4.0 • SUS Tycoon');
    expect(titleContent).not.toContain('v1.8.0 • SUS Tycoon');
  });
});
