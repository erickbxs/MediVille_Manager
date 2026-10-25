/**
 * Arquivo: capacitor.config.ts
 *
 * 1. O que este arquivo faz?
 * Configuração oficial do Capacitor para empacotamento mobile nativo (Android e iOS) do MediVille Manager.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 5 do Prompt 15, apontando para o diretório de build dist/ e definindo app ID e servidor local.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Para testar no emulador, execute npx cap sync android ou npx cap open android.
 *
 * Importa: (nenhum)
 * Conecta-se com: package.json, dist/
 */

export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  server?: {
    androidScheme?: string;
    iosScheme?: string;
  };
}

const config: CapacitorConfig = {
  appId: 'com.erickgames.medivillemanager',
  appName: 'MediVille Manager',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
};

export default config;
