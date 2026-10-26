/**
 * Arquivo: src/vite-env.d.ts
 *
 * 1. O que este arquivo faz?
 * Declara os tipos do cliente Vite e as constantes globais injetadas em tempo de compilação,
 * especificamente __APP_VERSION__ lida dinamicamente do package.json.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir suporte a TypeScript estrito (zero any) ao acessar metadados de versão da aplicação na interface gráfica.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Novas variáveis definidas no define do vite.config.ts devem ser tipadas aqui.
 *
 * Importa: vite/client
 * Conecta-se com: vite.config.ts, src/ui/title-screen.ts, src/main.ts
 */

/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
