/**
 * Arquivo: vite.config.ts
 * O que faz: Configura o Vite (build e servidor de desenvolvimento), o plugin do Tailwind CSS v4 e o Vitest.
 * Por que existe: Ponto único de build do protótipo web publicado no Cloudflare Pages.
 * Como modificar/debugar: Rode `npm run build` e confira o relatório de peso. Para testes, ajuste `test.include`.
 * Importa: vitest/config, @tailwindcss/vite
 * Conecta-se com: index.html, src/main.ts, src/styles.css, tests/*.test.ts, scripts/check-bundle-size.mjs
 */
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
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
