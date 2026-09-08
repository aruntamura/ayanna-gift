/* ─────────────────────────────────────────────────────────────────────────────
   Rebuild data/puzzle.js from tools/words.json

       node tools/build-puzzle.mjs

   Answers interlock, so you cannot edit one by hand: change the list and run
   this. It lays the answers out as a freeform criss-cross (every answer must
   cross at least one other, and no two answers may run alongside each other),
   numbers the grid the way a crossword is numbered, then verifies that the
   finished grid reads back as exactly your answers with no accidental extras.

   Spaces and punctuation are stripped, so "San Francisco" becomes SANFRANCISCO.
   Every answer needs at least one letter in common with the rest of the set, or
   it cannot be placed.
   ───────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const input = JSON.parse(fs.readFileSync(path.join(here, 'words.json'), 'utf8'));

const items = input.map(w => ({
  answer: String(w.answer).toUpperCase().replace(/[^A-Z]/g, ''),
  clue: w.clue || '',
})).filter(w => w.answer.length >= 3);

if (items.length < 2) { console.error('need at least two answers'); process.exit(1); }
const dupes = items.map(i => i.answer).filter((a, i, arr) => arr.indexOf(a) !== i);
if (dupes.length) { console.error('duplicate answers:', dupes.join(', ')); process.exit(1); }

const key = (r, c) => r + ',' + c;

function tryPlace(st, word, r, c, dir) {
  let crossings = 0;
  for (let k = 0; k < word.length; k++) {
    const rr = dir === 'V' ? r + k : r;
    const cc = dir === 'H' ? c + k : c;
    const at = st.grid.get(key(rr, cc));
    if (at !== undefined) {
      if (at !== word[k]) return null;
      if (st.dirs.get(key(rr, cc)).has(dir)) return null;  // must cross, not overlap
      crossings++;
    } else {
      const sides = dir === 'H' ? [[rr - 1, cc], [rr + 1, cc]] : [[rr, cc - 1], [rr, cc + 1]];
      for (const [sr, sc] of sides) if (st.grid.has(key(sr, sc))) return null;
    }
  }
  const ends = dir === 'H' ? [[r, c - 1], [r, c + word.length]] : [[r - 1, c], [r + word.length, c]];
  for (const [er, ec] of ends) if (st.grid.has(key(er, ec))) return null;
  return crossings;
}

function commit(st, word, r, c, dir) {
  for (let k = 0; k < word.length; k++) {
    const rr = dir === 'V' ? r + k : r;
    const cc = dir === 'H' ? c + k : c;
    const kk = key(rr, cc);
    if (!st.grid.has(kk)) { st.grid.set(kk, word[k]); st.dirs.set(kk, new Set()); }
    st.dirs.get(kk).add(dir);
  }
  st.placed.push({ word, r, c, dir });
}

function rebuild(placed) {
  const st = { grid: new Map(), dirs: new Map(), placed: [] };
  for (const p of placed) commit(st, p.word, p.r, p.c, p.dir);
  return st;
}

function bbox(st) {
  let r0 = 1e9, c0 = 1e9, r1 = -1e9, c1 = -1e9;
  for (const kk of st.grid.keys()) {
    const [r, c] = kk.split(',').map(Number);
    if (r < r0) r0 = r; if (r > r1) r1 = r;
    if (c < c0) c0 = c; if (c > c1) c1 = c;
  }
  return { r0, c0, r1, c1, h: r1 - r0 + 1, w: c1 - c0 + 1 };
}

function build(order, seed) {
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  let st = { grid: new Map(), dirs: new Map(), placed: [] };
  commit(st, order[0], 0, 0, 'H');

  for (let i = 1; i < order.length; i++) {
    const word = order[i];
    const cands = [];
    for (const [kk, letter] of st.grid) {
      const [gr, gc] = kk.split(',').map(Number);
      for (let k = 0; k < word.length; k++) {
        if (word[k] !== letter) continue;
        for (const dir of ['H', 'V']) {
          const r = dir === 'V' ? gr - k : gr;
          const c = dir === 'H' ? gc - k : gc;
          const x = tryPlace(st, word, r, c, dir);
          if (x !== null && x >= 1) cands.push({ r, c, dir, cross: x });
        }
      }
    }
    if (!cands.length) return null;
    for (const cd of cands) {
      const probe = rebuild(st.placed);
      commit(probe, word, cd.r, cd.c, cd.dir);
      const b = bbox(probe);
      cd.score = cd.cross * 3 - Math.max(b.w, b.h) * 0.35 - Math.abs(b.w - b.h) * 0.25 + rnd() * 0.6;
    }
    cands.sort((a, b) => b.score - a.score);
    commit(st, word, cands[0].r, cands[0].c, cands[0].dir);
  }
  return st;
}

const base = items.map(i => i.answer).sort((a, b) => b.length - a.length);
let best = null;
for (let seed = 1; seed <= 3000; seed++) {
  let s = seed >>> 0;
  const rnd = () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296; };
  // longest first with jitter: long answers are the hardest to interlock
  const order = base.map(w => [w.length + rnd() * 2.2, w]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  const st = build(order, seed * 2654435761);
  if (!st) continue;
  const b = bbox(st);
  let crossings = 0;
  for (const [, d] of st.dirs) if (d.size > 1) crossings++;
  const score = Math.max(b.w, b.h) + Math.abs(b.w - b.h) * 0.4 - crossings * 0.8;
  if (!best || score < best.score) best = { st, b, score, crossings };
}
if (!best) {
  console.error('could not interlock these answers. Usually one of them shares no');
  console.error('letter with any other. Add a common answer or reword that one.');
  process.exit(1);
}

const { st, b } = best;
const rows = [];
for (let r = b.r0; r <= b.r1; r++) {
  let line = '';
  for (let c = b.c0; c <= b.c1; c++) line += st.grid.get(key(r, c)) ?? '.';
  rows.push(line);
}
const H = rows.length, W = rows[0].length;
const solid = (r, c) => r >= 0 && r < H && c >= 0 && c < W && rows[r][c] !== '.';

/* ── verify: the grid must read back as exactly the supplied answers ──────── */
const runs = [];
for (let r = 0; r < H; r++) { let c = 0; while (c < W) { if (!solid(r, c)) { c++; continue; } const s0 = c; while (solid(r, c)) c++; if (c - s0 >= 2) runs.push(rows[r].slice(s0, c)); } }
for (let c = 0; c < W; c++) { let r = 0; while (r < H) { if (!solid(r, c)) { r++; continue; } const s0 = r; let w = ''; while (solid(r, c)) { w += rows[r][c]; r++; } if (w.length >= 2) runs.push(w); } }
const want = items.map(i => i.answer).sort();
const got = runs.slice().sort();
if (want.join('|') !== got.join('|')) {
  console.error('VERIFY FAILED. The grid does not read back as your answers.');
  console.error('  unexpected:', got.filter(w => !want.includes(w)));
  console.error('  missing:   ', want.filter(w => !got.includes(w)));
  process.exit(1);
}

/* ── number the grid, then emit ──────────────────────────────────────────── */
const clueOf = new Map(items.map(i => [i.answer, i.clue]));
let n = 0;
const entries = [];
for (let r = 0; r < H; r++) {
  for (let c = 0; c < W; c++) {
    if (!solid(r, c)) continue;
    const startA = !solid(r, c - 1) && solid(r, c + 1);
    const startD = !solid(r - 1, c) && solid(r + 1, c);
    if (!startA && !startD) continue;
    n++;
    if (startA) { let k = c, w = ''; while (solid(r, k)) w += rows[r][k++]; entries.push({ num: n, dir: 'across', r, c, answer: w, clue: clueOf.get(w) || '' }); }
    if (startD) { let k = r, w = ''; while (solid(k, c)) w += rows[k++][c]; entries.push({ num: n, dir: 'down', r, c, answer: w, clue: clueOf.get(w) || '' }); }
  }
}

const pad = (s, w) => String(s).padStart(w);
const line = e => `  { num: ${pad(e.num, 2)}, dir: "${e.dir}", r: ${pad(e.r, 2)}, c: ${pad(e.c, 2)}, answer: "${e.answer}", clue: ${JSON.stringify(e.clue)} },`;

const out = `/* ─────────────────────────────────────────────────────────────────────────────
   THE PUZZLE
   GENERATED FILE. Do not edit the grid by hand: the answers interlock.
   Edit tools/words.json and run  node tools/build-puzzle.mjs

   ${entries.length} entries over a ${H} by ${W} grid, ${best.crossings} crossings.
   Verified: the grid reads back as exactly the supplied answers, with no stray
   runs and no duplicates.

   Changing only a CLUE is safe to do here or in tools/words.json.
   ───────────────────────────────────────────────────────────────────────────── */

window.PUZZLE = {
  // "." is a hole in the wall. Everything else is a letter of the solution.
  rows: [
${rows.map(r => `    "${r}"`).join(',\n')}
  ],
  entries: [
    /* across */
${entries.filter(e => e.dir === 'across').map(line).join('\n')}
    /* down */
${entries.filter(e => e.dir === 'down').map(line).join('\n')}
  ],
};
`;
fs.writeFileSync(path.join(root, 'data', 'puzzle.js'), out);
console.log(`ok: ${entries.length} entries, ${H}x${W} grid, ${best.crossings} crossings`);
console.log('wrote data/puzzle.js');
