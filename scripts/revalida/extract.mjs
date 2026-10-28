/**
 * Arquivo: scripts/revalida/extract.mjs
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

const [, , inDir, outDir, only] = process.argv;
fs.mkdirSync(outDir, { recursive: true });

function splitColumns(items, w) {
  const mid = w / 2;
  const text = items.filter((i) => i.s.trim());
  const cross = text.filter((i) => i.x < mid - 6 && i.x + i.w > mid + 6).length;
  const right = text.filter((i) => i.x >= mid - 6).length;
  const twoCol = text.length > 0 && right > text.length * 0.15 && cross < Math.max(3, text.length * 0.08);
  if (!twoCol) return [{ x0: 0, x1: w, items }];
  return [{ x0: 0, x1: mid, items: items.filter((i) => i.x < mid - 6) }, { x0: mid, x1: w, items: items.filter((i) => i.x >= mid - 6) }];
}

function toLines(allItems, h) {
  const sizes = allItems.filter((i) => i.s.trim()).map((i) => i.size).sort((a, b) => a - b);
  const med = sizes[Math.floor(sizes.length / 2)] ?? 8;
  const small = allItems.filter((i) => i.size < med * 0.78 && i.s.trim().length <= 3);
  const items = allItems.filter((i) => !small.includes(i));
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const out = [];
  let cur = null;
  for (const it of sorted) {
    if (!cur || Math.abs(cur.y - it.y) > 2.5) { cur = { y: it.y, size: it.size, parts: [] }; out.push(cur); }
    cur.parts.push(it);
    cur.size = Math.max(cur.size, it.size);
  }
  for (const s of small) {
    let best = null;
    for (const l of out) { const d = Math.abs(l.y - s.y); if (d < med * 1.1 && (!best || d < Math.abs(best.y - s.y))) best = l; }
    if (best) best.parts.push({ ...s, sup: true });
  }
  return out.map((l) => {
    const parts = l.parts.sort((a, b) => a.x - b.x);
    let t = '';
    let lastEnd = null;
    for (const p of parts) { if (lastEnd !== null && p.x - lastEnd > 1.5 && !t.endsWith(' ') && !p.s.startsWith(' ')) t += ' '; t += p.s; lastEnd = p.x + p.w; }
    return { top: h - l.y - l.size, bottom: h - l.y + l.size * 0.25, x: parts[0].x, text: t.replace(/\s+/g, ' ').trim() };
  }).filter((l) => l.text);
}

for (const f of fs.readdirSync(inDir).filter((n) => n.endsWith('_prova.pdf') && (!only || n.startsWith(only)))) {
  const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(path.join(inDir, f))), verbosity: 0 }).promise;
  const pages = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const items = tc.items.filter((i) => typeof i.str === 'string').map((i) => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width, size: Math.abs(i.transform[3]) || 8 }));
    const cols = splitColumns(items, vp.width).map((c) => ({ x0: c.x0, x1: c.x1, lines: toLines(c.items, vp.height) }));
    pages.push({ n: p, w: vp.width, h: vp.height, cols });
  }
  fs.writeFileSync(path.join(outDir, f.replace(/\.pdf$/, '.json')), JSON.stringify({ file: f, pages }));
  console.log('ok', f, doc.numPages);
}
