/**
 * Arquivo: vite.config.ts
 *
 * 1. O que este arquivo faz?
 * Configura o pipeline de build e testes do Vite, incluindo plugin Tailwind CSS v4, suporte ao Vitest
 * e injeção em tempo de compilação da constante global __APP_VERSION__ lida diretamente do package.json.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Ponto central de compilação da aplicação web do MediVille Manager publicada no Cloudflare Pages,
 * garantindo eliminação de versões hardcoded na interface e alinhamento com a Skill release-e-deploy-web.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para adicionar variáveis globais injetadas, configure a propriedade define. Para ajustar orçamentos de chunks,
 * modifique build.chunkSizeWarningLimit.
 *
 * Importa: vitest/config, @tailwindcss/vite, package.json
 * Conecta-se com: index.html, src/main.ts, src/styles.css, src/vite-env.d.ts, scripts/sync-version.mjs
 */

import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
