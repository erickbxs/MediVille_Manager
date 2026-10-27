/**
 * Arquivo: scripts/code-backup.mjs
 *
 * 1. O que este arquivo faz?
 * Gerencia checkpoints de código e máquina do tempo local combinando Git Tags e snapshots
 * compactos em .backups/. Permite salvar (save), listar (list) e restaurar (rollback) versões com 1 comando.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Cumprir a Parte 1 do Prompt 24, garantindo segurança de código, prevenção contra regressões
 * e possibilidade de rollback imediato a qualquer momento antes ou depois de alterações complexas.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * Execute via terminal: `node scripts/code-backup.mjs list` para inspecionar os backups existentes.
 * As configurações de retenção estão em MAX_BACKUPS_RETAINED.
 *
 * Importa: node:fs, node:path, node:child_process
 * Conecta-se com: package.json, .backups/manifest.json, scripts/sync-version.mjs, tests/code-backup-manchester-exams-and-heatmap.test.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BACKUPS_DIR = path.join(ROOT_DIR, '.backups');
const MAX_BACKUPS_RETAINED = 10;

const BACKUP_ENTRIES = [
  'src',
  'public',
  'tests',
  'scripts',
  'package.json',
  'vite.config.ts',
  'CHANGELOG.md',
];

function getAppVersion() {
  const pkgPath = path.join(ROOT_DIR, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.version || '0.0.0';
}

function ensureBackupsDir(baseDir = BACKUPS_DIR) {
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
}

function loadManifest(baseDir = BACKUPS_DIR) {
  ensureBackupsDir(baseDir);
  const manifestFile = path.join(baseDir, 'manifest.json');
  if (fs.existsSync(manifestFile)) {
    try {
      return JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    } catch {
      return { backups: [] };
    }
  }
  return { backups: [] };
}

function saveManifest(manifest, baseDir = BACKUPS_DIR) {
  ensureBackupsDir(baseDir);
  const manifestFile = path.join(baseDir, 'manifest.json');
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), 'utf8');
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function pruneOldBackups(manifest) {
  while (manifest.backups.length > MAX_BACKUPS_RETAINED) {
    const oldest = manifest.backups.shift();
    if (oldest && oldest.snapshotPath && fs.existsSync(oldest.snapshotPath)) {
      try {
        fs.rmSync(oldest.snapshotPath, { recursive: true, force: true });
      } catch (err) {
        console.warn(`[backup] Aviso ao remover snapshot antigo: ${err.message}`);
      }
    }
  }
}

function getGitCommitShort() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function createGitTag(tagName) {
  try {
    execSync(`git tag -f ${tagName}`, { cwd: ROOT_DIR, stdio: 'ignore' });
  } catch {
    // Ignora se git tag falhar
  }
}

function copyEntries(srcBase, destBase) {
  fs.mkdirSync(destBase, { recursive: true });
  for (const entry of BACKUP_ENTRIES) {
    const srcPath = path.join(srcBase, entry);
    const destPath = path.join(destBase, entry);
    copyRecursive(srcPath, destPath);
  }
}

function findSelectedBackup(backups, target) {
  if (!target) return backups[backups.length - 1] ?? null;
  const index = parseInt(target, 10);
  if (!Number.isNaN(index) && index >= 1 && index <= backups.length) {
    return backups[index - 1] ?? null;
  }
  return backups.find((b) => b.id === target || b.gitTag === target || b.version === target) ?? null;
}

export function saveCheckpoint(label = 'manual', options = {}) {
  const baseDir = options.baseDir || BACKUPS_DIR;
  const version = getAppVersion();
  const dateObj = new Date();
  const dateStr = dateObj.toISOString().replace(/[:.]/g, '-');
  const id = `v${version}-${dateStr}`;
  const tagName = `backup-v${version}-${dateStr.slice(0, 19)}`;
  const snapshotPath = path.join(baseDir, id);

  ensureBackupsDir(baseDir);
  const gitCommit = getGitCommitShort();
  if (!options.baseDir) createGitTag(tagName);

  copyEntries(ROOT_DIR, snapshotPath);

  const manifest = loadManifest(baseDir);
  const record = { id, version, label, timestamp: dateObj.toISOString(), gitCommit, gitTag: tagName, snapshotPath };
  manifest.backups.push(record);
  pruneOldBackups(manifest);
  saveManifest(manifest, baseDir);

  console.log(`\n🛡️ [Checkpoint Salvo com Sucesso!] v${version} (${id})\n`);
  return record;
}

export function listCheckpoints(options = {}) {
  const baseDir = options.baseDir || BACKUPS_DIR;
  const manifest = loadManifest(baseDir);
  console.log(`\n📋 [MediVille Manager — Lista de Checkpoints de Código]`);
  if (!manifest.backups || manifest.backups.length === 0) {
    console.log('   Nenhum checkpoint salvo até o momento.\n');
    return [];
  }

  console.log('─'.repeat(88));
  console.log(`#   | Versão  | Data/Hora            | Tag Git                    | Label / Descrição`);
  console.log('─'.repeat(88));
  manifest.backups.forEach((b, idx) => {
    const num = String(idx + 1).padEnd(3);
    const ver = String(`v${b.version}`).padEnd(7);
    const dt = new Date(b.timestamp).toLocaleString('pt-BR').padEnd(20);
    const tag = String(b.gitTag || '-').slice(0, 26).padEnd(26);
    console.log(`${num} | ${ver} | ${dt} | ${tag} | ${b.label || 'manual'}`);
  });
  console.log('─'.repeat(88) + '\n');
  return manifest.backups;
}

function restoreSnapshotFiles(snapshotPath) {
  copyEntries(snapshotPath, ROOT_DIR);
  try {
    execSync('npm run sync:version', { cwd: ROOT_DIR, stdio: 'inherit' });
  } catch {
    // Ignora erro se comando falhar
  }
}

export function rollbackCheckpoint(target, options = {}) {
  const baseDir = options.baseDir || BACKUPS_DIR;
  const manifest = loadManifest(baseDir);
  if (!manifest.backups || manifest.backups.length === 0) return null;

  const selected = findSelectedBackup(manifest.backups, target);
  if (!selected || !selected.snapshotPath || !fs.existsSync(selected.snapshotPath)) {
    console.error(`❌ Checkpoint alvo não encontrado: ${target}`);
    return null;
  }

  console.log(`\n⏪ [Restaurando Checkpoint: ${selected.id}]...`);
  if (!options.skipGitReset) restoreSnapshotFiles(selected.snapshotPath);

  console.log(`✅ [Rollback Concluído com Sucesso!] v${selected.version} (${selected.id}).\n`);
  return selected;
}

// Execução direta via CLI
const command = process.argv[2] || 'list';
const arg = process.argv[3];

if (command === 'save') {
  saveCheckpoint(arg || 'manual_save');
} else if (command === 'list') {
  listCheckpoints();
} else if (command === 'rollback') {
  rollbackCheckpoint(arg);
}
