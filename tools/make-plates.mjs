/* ─────────────────────────────────────────────────────────────────────────────
   Regenerate the eighteen placeholder plates.

       node tools/make-plates.mjs

   These are stand-ins for real photographs. Delete them as you replace them.
   They deliberately spread across the whole warm range (rose, pink, mauve,
   lilac, peach, sand) rather than sitting on one hue, because eighteen plates
   of the same colour make the entire page read as that colour.
   ───────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';

const out = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'assets', 'photos');

const RATIOS = { p: [1000, 1250], l: [1500, 1000], s: [1100, 1100] };
const SHAPE = ['l','p','l','s','p','l','p','s','p','l','s','p','l','p','s','l','l','p'];

/* Warm dusk, spread across ten families. Eighteen plates on one hue make the
   whole page read as that hue, which is what the first pass did with
   terracotta and the second did with pink. The two cool tints (sage, dusty
   teal) are heavily desaturated so they read as a faded photographic tint
   rather than as a different palette. */
const PAIRS = [
  ['#F8DEE6', '#D68FA6'],   // rose
  ['#F1DCE9', '#B98BB2'],   // mauve
  ['#FAE4DC', '#DFA489'],   // peach
  ['#E6EBE2', '#9FB29B'],   // sage
  ['#F6D9E1', '#C87E9A'],   // deep rose
  ['#F4E6D3', '#D9B27A'],   // amber sand
  ['#EEDDEC', '#A98BB6'],   // lilac
  ['#E2EAEC', '#93AFB4'],   // dusty teal
  ['#F9E1DD', '#D48F8F'],   // blush red
  ['#F0DEE9', '#A87C9E'],   // plum
];
const BLOOM = ['#E9B0A2', '#D9A4C0', '#E7C58A', '#C9A0C4', '#A9BFA6', '#9FB9BE'];

for (let i = 1; i <= 18; i++) {
  const [w, h] = RATIOS[SHAPE[i - 1]];
  /* Object 18 is the principal work and it hangs on the rose ground, so it is
     pinned to the rose family rather than taking whatever the cycle lands on.
     The cycle gave it dusty teal, which was the one genuinely jarring pairing
     on the page, on the one object that carries the most weight. */
  const [a, b] = i === 18 ? PAIRS[0] : PAIRS[(i - 1) % PAIRS.length];
  const bloom = BLOOM[(i - 1) % BLOOM.length];
  const n = String(i).padStart(2, '0');
  const cx = 28 + ((i * 37) % 44), cy = 22 + ((i * 53) % 48);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Placeholder plate ${n}">
  <defs>
    <linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </linearGradient>
    <radialGradient id="s${i}" cx="${cx}%" cy="${cy}%" r="56%">
      <stop offset="0" stop-color="${bloom}" stop-opacity=".62"/>
      <stop offset="1" stop-color="${bloom}" stop-opacity="0"/>
    </radialGradient>
    <filter id="n${i}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/>
      <feColorMatrix type="saturate" values="0"/></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g${i})"/>
  <rect width="${w}" height="${h}" fill="url(#s${i})"/>
  <rect width="${w}" height="${h}" filter="url(#n${i})" opacity=".07"/>
  <text x="${w / 2}" y="${h / 2}" fill="#46203A" fill-opacity=".26" font-family="Georgia,serif"
        font-size="${Math.min(w, h) * 0.26}" text-anchor="middle" dominant-baseline="central">${n}</text>
  <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="#46203A" stroke-opacity=".12" stroke-width="3"/>
</svg>`;
  fs.writeFileSync(path.join(out, `plate-${n}.svg`), svg);
}
console.log('wrote 18 plates across', PAIRS.length, 'colour families');
