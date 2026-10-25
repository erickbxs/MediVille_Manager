/**
 * Arquivo: scripts/check-bundle-size.mjs
 * 1. O que este arquivo faz: Verifica o tamanho dos arquivos gerados na pasta dist/ após o build e garante que o total permaneça abaixo do orçamento de 5 MB do GDD (Prompt 15).
 * 2. Para que foi criado: Permitir maior riqueza visual 3D, áudio Web Audio procedural e localização completa sem estourar o limite de carregamento em mobile.
 * 3. Como modificar/debugar: Execute `node scripts/check-bundle-size.mjs`. Se ultrapassar 5.00 MB, analise os maiores chunks listados no relatório do terminal.
 * Importa: node:fs, node:path
 * Conecta-se com: package.json, dist/
 */
import fs from 'node:fs';
import path from 'node:path';

const MAX_TOTAL_BYTES = 5 * 1024 * 1024; // 5 MB (Prompt 15)
const distDir = path.resolve(process.cwd(), 'dist');

if (!fs.existsSync(distDir)) {
  console.error('[bundle-check] Erro: Diretório dist/ não encontrado. Execute o build primeiro.');
  process.exit(1);
}

function getFilesRecursively(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getFilesRecursively(distDir);
let totalBytes = 0;

console.log('\n📦 [bundle-check] Relatório de tamanho do pacote:');
for (const file of files) {
  const stats = fs.statSync(file);
  totalBytes += stats.size;
  const rel = path.relative(distDir, file);
  const kb = (stats.size / 1024).toFixed(2);
  console.log(`  - ${rel}: ${kb} KB`);
}

const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
console.log(`\nTotal do build: ${totalMb} MB (${totalBytes} bytes) / Limite: 5.00 MB`);

if (totalBytes > MAX_TOTAL_BYTES) {
  console.error(`❌ [bundle-check] Falha: O pacote excedeu o orçamento de 5 MB!`);
  process.exit(1);
} else {
  console.log('✅ [bundle-check] Sucesso: Pacote dentro do orçamento do GDD!\n');
}
