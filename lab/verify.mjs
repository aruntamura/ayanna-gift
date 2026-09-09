import { chromium } from 'playwright-core';
import fs from 'node:fs';

const URL = 'http://localhost:4500/';
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = process.argv.includes('--mobile');
const size = W ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const tag  = W ? 'mobile' : 'desktop';
const out  = `lab/${tag}`;
fs.mkdirSync(out, { recursive: true });

/* The gate is cosmetic, so the tests derive the code rather than hard coding
   it: three digits against an FNV-1a hash is a thousand tries. This keeps the
   number out of a public repo, and it is also an honest demonstration of
   exactly how much the door is worth. */
async function doorCode(page) {
  return await page.evaluate(() => {
    const h = (s) => {
      let x = 0x811c9dc5;
      for (let i = 0; i < s.length; i++) {
        x ^= s.charCodeAt(i);
        x = (x + (x << 1) + (x << 4) + (x << 7) + (x << 8) + (x << 24)) >>> 0;
      }
      return x >>> 0;
    };
    const n = window.CONFIG.CODE_LENGTH;
    const max = Math.pow(10, n);
    for (let i = 0; i < max; i++) {
      const s = String(i).padStart(n, '0');
      if (h(s) === window.CONFIG.CODE_HASH) return s;
    }
    return null;
  });
}

const browser = await chromium.launch({ executablePath: CH });
const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2,
  hasTouch: W, isMobile: W });
const page = await ctx.newPage();

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));

await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(900);

/* ── 1. the door ─────────────────────────────────────────────────────────── */
await page.screenshot({ path: `${out}/00-door.png` });
const doorVisible = await page.isVisible('#door');

const CODE = await doorCode(page);
if (!CODE) { console.error('could not derive the door code from CONFIG'); process.exit(1); }
const WRONG = CODE === '000' ? '111' : '000';

// wrong code first
await page.fill('#door-input', WRONG);
await page.waitForTimeout(500);
const wrongMsg = (await page.textContent('#door-msg')).trim();
const stillLocked = await page.isVisible('#door');
await page.screenshot({ path: `${out}/01-door-wrong.png` });

// then the real one
await page.fill('#door-input', CODE);
await page.waitForTimeout(1800);
const unlocked = (await page.$('#door')) === null;
const bodyLocked = await page.evaluate(() => document.body.classList.contains('is-locked'));

/* ── 2. the long wall must have somewhere to travel, and the controls must
      actually move it ────────────────────────────────────────────────────── */
// instant: scrollcraft.css sets scroll-behavior:smooth, so the default glides
// and every measurement taken during the glide is of a moving target
await page.evaluate(() => document.getElementById('room-ii').scrollIntoView({ block: 'center', behavior: 'instant' }));
await page.waitForTimeout(500);
const wallStart = await page.evaluate(() => {
  const rail = document.getElementById('wall-rail');
  const back = document.querySelector('[data-wall="-1"]');
  const fwd = document.querySelector('[data-wall="1"]');
  return { overflow: rail.scrollWidth - rail.clientWidth, scrollLeft: rail.scrollLeft,
           backDisabledAtStart: back.disabled, fwdDisabledAtStart: fwd.disabled,
           bar: document.getElementById('wall-bar').style.width };
});
// press "further along" twice
await page.click('[data-wall="1"]'); await page.waitForTimeout(600);
await page.click('[data-wall="1"]');
/* Generous, on purpose. The button animates toward 747, and if that animation
   is still in flight when the drag starts it keeps pulling the wall back to its
   own target and beats every write the drag makes. The drag itself is reliable:
   six for six from a settled start. */
await page.waitForTimeout(1600);
const wallAfter = await page.evaluate(() => {
  const rail = document.getElementById('wall-rail');
  return { scrollLeft: Math.round(rail.scrollLeft), bar: document.getElementById('wall-bar').style.width,
           backDisabled: document.querySelector('[data-wall="-1"]').disabled };
});
/* Park the wall at a known position instantly before testing the drag. The
   arrow buttons animate, and a synthesised drag against a still-animating,
   snap-enabled scroller is not reproducible: waiting for it to settle was not
   enough. This tests the same end-to-end gesture from a deterministic start. */
const dragFrom = await page.evaluate(() => {
  const rail = document.getElementById('wall-rail');
  rail.scrollTo({ left: 747, behavior: 'instant' });
  return Math.round(rail.scrollLeft);
});
await page.waitForTimeout(400);

// and drag it back with the pointer
const railBox = await page.locator('#wall-rail').boundingBox();
/* The rail is taller than a viewport-half, so its own centre can sit below the
   fold: a synthesised press at an off-screen coordinate simply does not land.
   Clamp the grab point into the visible area. */
const vpH = size.height;
const grabX = railBox.x + railBox.width * 0.5;
const grabY = Math.min(Math.max(railBox.y + railBox.height * 0.5, 60), vpH - 60);
await page.mouse.move(grabX, grabY);
await page.mouse.down();
// drag further than one snap stride, or proximity snapping legitimately
// returns the wall to the same photograph and the assertion reads as a bug
for (const dx of [40, 140, 280, 420, 560]) await page.mouse.move(railBox.x + railBox.width * 0.5 + dx, railBox.y + railBox.height * 0.5);
await page.mouse.up();
await page.waitForTimeout(800);
const wallDragged = await page.evaluate(() => Math.round(document.getElementById('wall-rail').scrollLeft));
// the wall must NOT hijack the page scroll any more
const beforePageY = await page.evaluate(() => Math.round(scrollY));
await page.mouse.wheel(0, 400);
await page.waitForTimeout(400);
const afterPageY = await page.evaluate(() => Math.round(scrollY));
const wall = {
  ...wallStart,
  afterButtons: wallAfter,
  dragFrom: dragFrom,
  draggedTo: wallDragged,
  buttonsMove: wallAfter.scrollLeft > wallStart.scrollLeft + 50,
  // dragging right must move the wall back toward the start. Snapping then
  // settles it on the nearest photograph, so this is not an exact distance.
  dragMoves: wallDragged < dragFrom - 50,
  verticalWheelStillScrollsPage: afterPageY > beforePageY + 100,
};
const railOverflow = { overflow: wallStart.overflow };

/* ── 3. walk the collection, shooting each room at three positions ───────── */
const rooms = await page.evaluate(() =>
  ['room-i','room-ii','room-iii','room-iv','room-v','room-close'].map(id => {
    const el = document.getElementById(id);
    const r = el.getBoundingClientRect();
    return { id, top: r.top + scrollY, height: r.height };
  }));

const deadScroll = [];
for (const room of rooms) {
  let prev = null;
  for (const [i, f] of [0.1, 0.5, 0.9].entries()) {
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }),
      room.top + room.height * f);
    await page.waitForTimeout(650);
    const shot = await page.screenshot({ path: `${out}/${room.id}-${i}.png` });
    if (prev && Buffer.compare(prev, shot) === 0) deadScroll.push(`${room.id} @ ${f}`);
    prev = shot;
  }
}

/* ── 4. contrast, measured on the composited page ────────────────────────── */
const contrast = await page.evaluate(() => {
  const lin = v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
  const L = ([r,g,b]) => 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
  const parse = s => (s.match(/\d+(\.\d+)?/g) || []).slice(0,3).map(Number);
  const ratio = (a,b) => { const [x,y] = [L(a), L(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05); };
  const bgOf = el => {
    let n = el;
    while (n && n !== document.documentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      const p = parse(bg);
      if (p.length === 3 && !/rgba\(.*,\s*0\)/.test(bg)) return p;
      n = n.parentElement;
    }
    return [253,246,240];
  };
  const out = [];
  let checked = 0;
  const sel = [
    '.cap__text', '.cap__when',                       // the handwriting
    '.vestibule__room', '.vestibule__hed', '.vestibule__sub',
    '.vitrine__hed', '.principal__kicker',
    '.inquiry__hand', '.inquiry__sub', '.inquiry__cta',
    '.rail__eyebrow', '.wall__head h2', '.wall__head p', '.rail__tail p',
    '.salon__head p', '.salon__head h2',
    '.chrome__btn', '.index__link', '.index__count',
    '.clue', '.xw__btn', '.puzzle__head p', '.puzzle__eyebrow',
    '.door__body', '.door__title', '.door__eyebrow', '.xw__status',
  ].join(',');
  document.querySelectorAll(sel).forEach(el => {
    const cs = getComputedStyle(el);
    const fg = parse(cs.color);
    if (fg.length !== 3) return;
    const px = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    checked++;
    const r = ratio(fg, bgOf(el));
    const need = large ? 3 : 4.5;
    if (r < need) out.push({ sel: el.className, px: +px.toFixed(1), ratio: +r.toFixed(2), need });
  });
  return { failures: out, checked: checked, matched: document.querySelectorAll(sel).length };
});

/* ── 5. the puzzle ──────────────────────────────────────────────────────── */
await page.click('#tab-puzzle');
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/puzzle.png`, fullPage: false });
const gridInfo = await page.evaluate(() => {
  const cells = document.querySelectorAll('.xw__cell:not(.xw__cell--block)');
  const clues = document.querySelectorAll('.clue');
  const r = document.getElementById('xw').getBoundingClientRect();
  return { cells: cells.length, clues: clues.length, gridW: Math.round(r.width),
           overflowsViewport: r.width > innerWidth };
});
// type into the first entry
await page.click('.xw__cell:not(.xw__cell--block)');
await page.keyboard.type('BAN');
await page.waitForTimeout(250);
const typed = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.xw__ch')).map(e=>e.textContent).join('').slice(0,6));
// solve it outright to prove the win state fires
const solvedFires = await page.evaluate(() => {
  const P = window.PUZZLE, letters = {};
  P.rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') letters[r+','+c] = ch; }));
  localStorage.setItem('fsx-xw-v1', JSON.stringify(letters));
  return true;
});
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(700);
// the session already went through the door, so it should reopen instantly
const doorSkipped = (await page.$('#door')) === null;
if (!doorSkipped) { await page.fill('#door-input', CODE); await page.waitForTimeout(1600); }
await page.click('#tab-puzzle');
await page.waitForTimeout(400);
const winShown = await page.isVisible('#xw-solved');
await page.screenshot({ path: `${out}/puzzle-solved.png` });

console.log(JSON.stringify({
  tag, errors, doorVisible, wrongMsg, stillLocked, unlocked, bodyLocked,
  railOverflow, wall, deadScroll, contrastFailures: contrast.failures, contrastChecked: contrast,
  gridInfo, typed, winShown, doorSkipped,
}, null, 2));

await browser.close();
