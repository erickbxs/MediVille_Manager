/**
 * Arquivo: scripts/code-backup.d.ts
 *
 * 1. O que este arquivo faz?
 * Declara as tipagens TypeScript para o módulo scripts/code-backup.mjs.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Permitir importação com tipagem estrita e zero any nos testes e utilitários da versão 2.2.0.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Ao adicionar novos métodos ao code-backup.mjs, reflita as assinaturas aqui.
 *
 * Importa: (nenhum)
 * Conecta-se com: scripts/code-backup.mjs, tests/code-backup-manchester-exams-and-heatmap.test.ts
 */

export interface BackupRecord {
  id: string;
  version: string;
  label: string;
  timestamp: string;
  gitCommit: string;
  gitTag: string;
  snapshotPath: string;
}

export interface BackupOptions {
  baseDir?: string;
  skipGitReset?: boolean;
}

export function saveCheckpoint(label?: string, options?: BackupOptions): BackupRecord;
export function listCheckpoints(options?: BackupOptions): BackupRecord[];
export function rollbackCheckpoint(target?: string, options?: BackupOptions): BackupRecord | null;
