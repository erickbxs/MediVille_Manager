/**
 * Arquivo: scripts/revalida/gabaritos.mjs
 * Parte do pipeline que gera public/revalida/questions.json a partir dos PDFs oficiais do INEP (Revalida).
 * Ordem: 1) baixar provas e gabaritos de gov.br/inep para uma pasta (ex.: inep/AAAA-N_prova.pdf e inep/AAAA-N_gabarito.pdf);
 * 2) node extract.mjs <pasta> <pasta>/json  3) node gabaritos.mjs <pasta> <pasta>/gabaritos.json
 * 4) node parse.mjs <pasta> <pasta>/questions.json <pasta>/img  5) copiar para public/revalida (ver CHANGELOG v3.0.0).
 * Dependências (fora do package.json do jogo): npm i pdfjs-dist@4.10.38 @napi-rs/canvas em uma pasta separada.
 * Conecta-se com: public/revalida/questions.json, public/revalida/img/
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs';
import path from 'node:path';

const [, , inDir, outFile] = process.argv;
const ANNUL = /^(?:-|–|—|̶|X|Anulada)$/;

// Transcritos visualmente dos PDFs (imagem/fonte ilegível no texto)
const MANUAL = {
  '2020': 'ACCABDCDACBBDBBACCBCBCCBAAAABBCAACDCBABBBABCDCCCB' + 'DDCCABDCABDCDBBABCDDDADCCBADADBCDCBDDCBADDCBBCDDCDA',
  '2025-2': 'ABADCB-B--' + '-DCBABDDDC' + 'AABDACDBAC' + 'BDCBDCDDDB' + 'CD-BBCCDBC' + 'BCCB-BCACD' + 'CACBBBBBDB' + 'ACDDCBADDA' + 'DDAA-A-ABD' + 'DAABCCAAAB',
  '2026-1': 'DCCDBDDCDDDDCBBBBDBB' + 'ABCCAABAACCCCCCBABBC' + 'AACAADCADDBDDADCDBAB' + 'AABABBDDCDADACCAACDC' + 'BBAACACBDBCDCAABBDBD',
};
// 2025/2: gabarito definitivo + nota do Inep (questão 10 do caderno 1 anulada para ambos os exames)
const NOTE_ANNULLED = { '2025-2': [10] };

async function pdfLines(file) {
  const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(file)), verbosity: 0 }).promise;
  const lines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const tc = await (await doc.getPage(p)).getTextContent();
    const rows = new Map();
    for (const i of tc.items) {
      if (!i.str.trim()) continue;
      const y = Math.round(i.transform[5] / 3);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push({ x: i.transform[4], s: i.str });
    }
    [...rows.entries()].sort((a, b) => b[0] - a[0]).forEach(([, r]) => lines.push(r.sort((a, b) => a.x - b.x).map((t) => t.s.trim()).filter(Boolean)));
  }
  return lines;
}

function toAnswer(tok) { return ANNUL.test(tok) ? null : tok; }

// Formato grade: linha "Questão n..." seguida de "Gabarito x..."
function parseGrid(lines) {
  const out = {};
  for (let i = 0; i < lines.length - 1; i++) {
    const q = lines[i];
    if (q[0] !== 'Questão' || lines[i + 1][0] !== 'Gabarito') continue;
    const nums = q.slice(1).flatMap((t) => t.split(/\s+/)).map(Number);
    const ans = lines[i + 1].slice(1).flatMap((t) => t.split(/\s+/)).filter(Boolean);
    if (nums.length !== ans.length) throw new Error(`grade desalinhada linha ${i}: ${nums.length} x ${ans.length} (${ans.join(' ')})`);
    nums.forEach((n, k) => { out[n] = toAnswer(ans[k]); });
  }
  return out;
}

// Formato pares "número resposta" em colunas (2021, 2022)
function parsePairs(lines) {
  const out = {};
  const text = lines.map((l) => l.join(' ')).join('\n');
  for (const m of text.matchAll(/(?:^|\s)(\d{1,3})\s+(A|B|C|D|X|Anulada)(?=\s|$)/gm)) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 100 && !(n in out)) out[n] = toAnswer(m[2]);
  }
  return out;
}

// Formato 2025/2: blocos "q resp q+10" e "resp q+20 resp"
function parse20252(lines) {
  const out = {};
  for (const l of lines) {
    const t = l.join(' ').split(/\s+/);
    if (t.length === 3 && /^\d+$/.test(t[0]) && /^\d+$/.test(t[2])) out[+t[0]] = toAnswer(t[1]);
    if (t.length === 3 && /^\d+$/.test(t[1]) && !/^\d+$/.test(t[0])) { out[+t[1] - 10] = toAnswer(t[0]); out[+t[1]] = toAnswer(t[2]); }
    if (t.length === 2 && /^\d+$/.test(t[0]) && +t[0] > 90) out[+t[0]] = toAnswer(t[1]);
  }
  return out;
}

const result = {};
for (const [ed, s] of Object.entries(MANUAL)) result[ed] = Object.fromEntries([...s].map((c, i) => [i + 1, c === '-' ? null : c]));
for (const ed of ['2021', '2022-1', '2022-2', '2023-1', '2023-2', '2024-1', '2024-2', '2025-1']) {
  const lines = await pdfLines(path.join(inDir, `${ed}_gabarito.pdf`));
  const parsed = ed === '2025-2' ? parse20252(lines) : ed.startsWith('2021') || ed.startsWith('2022') ? parsePairs(lines) : parseGrid(lines);
  for (const n of NOTE_ANNULLED[ed] ?? []) parsed[n] = null;
  result[ed] = parsed;
}
for (const [ed, map] of Object.entries(result)) {
  const missing = [];
  for (let i = 1; i <= 100; i++) if (!(i in map)) missing.push(i);
  const annulled = Object.entries(map).filter(([, v]) => v === null).map(([k]) => k);
  console.log(ed, 'total', Object.keys(map).length, 'faltando', missing.join(',') || '-', 'anuladas', annulled.join(',') || '-');
}
fs.writeFileSync(outFile, JSON.stringify(result, null, 1));
