/**
 * Arquivo: scripts/revalida/parse.mjs
 * Parte do pipeline que gera public/revalida/questions.json a partir dos PDFs oficiais do INEP (Revalida).
 * Ordem: 1) baixar provas e gabaritos de gov.br/inep para uma pasta (ex.: inep/AAAA-N_prova.pdf e inep/AAAA-N_gabarito.pdf);
 * 2) node extract.mjs <pasta> <pasta>/json  3) node gabaritos.mjs <pasta> <pasta>/gabaritos.json
 * 4) node parse.mjs <pasta> <pasta>/questions.json <pasta>/img  5) copiar para public/revalida (ver CHANGELOG v3.0.0).
 * Dependências (fora do package.json do jogo): npm i pdfjs-dist@4.10.38 @napi-rs/canvas em uma pasta separada.
 * Conecta-se com: public/revalida/questions.json, public/revalida/img/
 */
import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';

const [, , inepDir, outJson, imgDir] = process.argv;
const GAB = JSON.parse(fs.readFileSync(path.join(inepDir, 'gabaritos.json'), 'utf8'));
const EDITIONS = Object.keys(GAB).sort();
const MARKER = /^QUEST(?:Ã|A)O\s*0*(\d{1,3})(?!\d)\s*(.*)$/;
const NOISE = [/^ÁREA LIVRE$/i, /^\*?R\d{3,}\S*\*?$/, /^PRIMEIRA EDIÇÃO$/i, /^SEGUNDA EDIÇÃO$/i, /^REVALIDA\s*\d{4}/i, /^\d{4}\s*(PRIMEIRA|SEGUNDA) EDIÇÃO$/i, /^CADERNO\s*\d+/i, /^RASCUNHO$/i, /^\d+\.\s*ITEM\s+\d+/i, /^ITEM\s+\d+/i];
const FIG_GAP = 26;
const SCALE = 2.2;

function flatten(doc) {
  const out = [];
  for (const p of doc.pages) p.cols.forEach((c, ci) => c.lines.forEach((l) => out.push({ ...l, page: p.n, col: ci, x0: c.x0, x1: c.x1, ph: p.h })));
  return out;
}

function repeatedNoise(lines) {
  const count = new Map();
  for (const l of lines) count.set(l.text, (count.get(l.text) ?? 0) + 1);
  return new Set([...count].filter(([t, n]) => n >= 6 && !/^[A-D]\s/.test(t)).map(([t]) => t));
}

function isNoise(l, rep) {
  if (rep.has(l.text) || NOISE.some((r) => r.test(l.text))) return true;
  const nearEdge = l.top > l.ph * 0.93 || l.top < l.ph * 0.05;
  return nearEdge && /^\d{1,3}$/.test(l.text);
}

function splitQuestions(lines) {
  const qs = [];
  let expected = 1;
  for (const l of lines) {
    const m = l.text.match(MARKER);
    if (m && Number(m[1]) === expected) { qs.push({ n: expected, lines: m[2] && !/ÁREA LIVRE/i.test(m[2]) ? [{ ...l, text: m[2] }] : [] }); expected++; continue; }
    if (expected > 100 && /QUESTIONÁRIO|PERCEPÇÃO|PERGUNTA\s+\d/i.test(l.text)) expected = 999;
    if (qs.length && expected <= 101) qs[qs.length - 1].lines.push(l);
  }
  return qs;
}

function findOptions(lines) {
  const idx = {};
  let end = lines.length;
  for (const key of ['D', 'C', 'B', 'A']) {
    let found = -1;
    for (let i = end - 1; i >= 0; i--) if (new RegExp(`^\\(?${key}\\)?(\\s|$)`).test(lines[i].text)) { found = i; break; }
    if (found < 0) return null;
    idx[key] = found;
    end = found;
  }
  return idx;
}

function joinLines(lines, medianLen) {
  let out = '';
  lines.forEach((l, i) => {
    const prev = lines[i - 1];
    if (prev) {
      const sameFlow = prev.page === l.page && prev.col === l.col;
      const gap = sameFlow ? l.top - prev.bottom : 0;
      const shortPrev = prev.text.length < medianLen * 0.62;
      if (out.endsWith('-') && !shortPrev) out = out.slice(0, -1) + (/[a-zà-ú]-$/i.test(prev.text) && /^[a-zà-ú]/.test(l.text) ? '-' : '');
      else out += gap > 9 || shortPrev || /[.:;?]$/.test(prev.text) && prev.text.length < medianLen * 0.9 ? '\n' : ' ';
    }
    out += l.text;
  });
  return out.replace(/ +/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

const FIG_REF = /(imagem|figura|gráfico|fotografia|eletrocardiograma|partograma|radiografia|tomografia|ultrassonografia|curva|heredograma|esquema|quadro)[^.\n]{0,80}(a seguir|abaixo|:\s*$)/im;

function cutParagraph(seg) {
  const out = [seg[0]];
  for (let i = 1; i < seg.length; i++) {
    const a = seg[i - 1], b = seg[i];
    const samePage = a.page === b.page && a.col === b.col;
    if (samePage && b.top - a.bottom > 14) break;
    out.push(b);
  }
  return out;
}

function fixText(s) {
  return s.replace(/(\d)\s?o\s?C\b/g, "$1 °C").replace(/ ,/g, ",");
}

function joinStemWithFigures(lines, figs, medianLen) {
  if (!figs.length) return joinLines(lines, medianLen);
  const parts = [];
  let start = 0;
  figs.forEach((f, k) => { parts.push(joinLines(lines.slice(start, f.after), medianLen), `[[FIG:${k + 1}]]`); start = f.after; });
  parts.push(joinLines(lines.slice(start), medianLen));
  return parts.filter(Boolean).join('\n');
}

function figureRegions(stem) {
  const regs = [];
  for (let i = 1; i < stem.length; i++) {
    const a = stem[i - 1], b = stem[i];
    if (a.page === b.page && a.col === b.col && b.top - a.bottom > FIG_GAP) regs.push({ page: a.page, x0: a.x0, x1: a.x1, y0: a.bottom + 1, y1: b.top - 1, after: i });
  }
  return regs;
}

function classify(text) {
  const t = text.toLowerCase();
  const score = { pediatria: 0, ginecologia_obstetricia: 0, cirurgia: 0, medicina_familia_comunidade: 0, clinica_medica: 1 };
  const add = (k, re, w) => { const m = t.match(re); if (m) score[k] += w * m.length; };
  add('pediatria', /recém-nascid|lactente|\bcriança|pré-escolar|escolar de|puericultura|neonat|\bmenin[oa] de \d|aleitamento|apgar|vacinação infantil|meses de idade|\bbebê/g, 3);
  add('ginecologia_obstetricia', /gestante|gestação|gravidez|grávida|pré-natal|semanas de idade gestacional|parto|puerpér|útero|uterin|ovári|menstrua|menopaus|colo do útero|vagin|mamografia|contracep|obstétric|amenorreia/g, 3);
  add('cirurgia', /trauma|fratura|tratamento cirúrgico|indicação cirúrgica|abordagem cirúrgica|pós-operatóri|intraoperatóri|abdome agudo|apendic|hérnia|queimadura|politrauma|laparotomia|colecistectomia|ferimento|atropelad|acidente automobilístico|colisão|perfura|obstrução intestinal/g, 3);
  add('medicina_familia_comunidade', /sensibilidade|especificidade|prevalência|incidência|epidemiológic|estudo de coorte|caso-controle|ensaio clínico|notifica|vigilância|sistema único de saúde|\bsus\b|atenção primária|estratégia saúde da família|agente comunitário|equipe de saúde da família|território|matriciamento|controle social|princípio|nasf|e-multi|indicador|coeficiente|mortalidade infantil|saúde do trabalhador|acidente de trabalho|ética|sigilo|declaração de óbito|comunicação de|bioética/g, 2);
  return Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
}

function editionLabel(ed) {
  const [y, n] = ed.split('-');
  return n ? `${y}/${n}` : y;
}

async function renderCrops(pdfPath, figs, edition, n) {
  if (!figs.length) return [];
  const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)), verbosity: 0 }).promise;
  const out = [];
  for (const [k, f] of figs.entries()) {
    const page = await doc.getPage(f.page);
    const vp = page.getViewport({ scale: SCALE });
    const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    const sx = Math.max(0, f.x0 * SCALE), sy = Math.max(0, f.y0 * SCALE), sw = (f.x1 - f.x0) * SCALE, sh = (f.y1 - f.y0) * SCALE;
    const crop = createCanvas(Math.round(sw), Math.round(sh));
    crop.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    const rel = `${edition}/q${String(n).padStart(3, '0')}${figs.length > 1 ? '-' + (k + 1) : ''}.webp`;
    fs.mkdirSync(path.join(imgDir, edition), { recursive: true });
    fs.writeFileSync(path.join(imgDir, rel), await crop.encode('webp', 82));
    out.push(rel);
  }
  return out;
}

const all = [];
const problems = [];
for (const ed of EDITIONS) {
  const doc = JSON.parse(fs.readFileSync(path.join(inepDir, 'json', `${ed}_prova.json`), 'utf8'));
  const lines = flatten(doc);
  const rep = repeatedNoise(lines);
  const clean = lines.filter((l) => !isNoise(l, rep));
  const medianLen = [...clean].map((l) => l.text.length).sort((a, b) => a - b)[Math.floor(clean.length * 0.7)];
  for (const q of splitQuestions(clean)) {
    const answer = GAB[ed][q.n] ?? null;
    const idx = findOptions(q.lines);
    if (!idx) { problems.push(`${ed} Q${q.n}: alternativas não encontradas`); continue; }
    const stemLines = q.lines.slice(0, idx.A);
    const opts = ['A', 'B', 'C', 'D'].map((k, i, arr) => {
      const seg = cutParagraph(q.lines.slice(idx[k], i < 3 ? idx[arr[i + 1]] : q.lines.length));
      seg[0] = { ...seg[0], text: seg[0].text.replace(/^\(?[A-D]\)?\s*/, '') };
      return { key: k, text: fixText(joinLines(seg, medianLen)) };
    });
    const figs = figureRegions(stemLines);
    const images = await renderCrops(path.join(inepDir, `${ed}_prova.pdf`), figs, ed, q.n);
    const stem = fixText(joinStemWithFigures(stemLines, figs, medianLen));
    all.push({
      id: `revalida-${ed}-q${String(q.n).padStart(3, '0')}`,
      edition: ed,
      editionLabel: editionLabel(ed),
      number: q.n,
      area: classify(stem + ' ' + opts.map((o) => o.text).join(' ')),
      stem,
      options: opts,
      answer,
      annulled: answer === null,
      images,
      preliminaryKey: ed === '2020',
      needsReview: images.length === 0 && FIG_REF.test(stem),
    });
  }
}
fs.writeFileSync(outJson, JSON.stringify(all, null, 1));
console.log('questões', all.length, 'com figura', all.filter((q) => q.images.length).length, 'anuladas', all.filter((q) => q.annulled).length);
console.log(problems.join('\n'));
const byEd = {}; for (const q of all) byEd[q.edition] = (byEd[q.edition] ?? 0) + 1; console.log(byEd);
const byArea = {}; for (const q of all) byArea[q.area] = (byArea[q.area] ?? 0) + 1; console.log(byArea);
