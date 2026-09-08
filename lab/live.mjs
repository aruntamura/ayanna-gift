/* Smoke test against the deployed site. Loads the real Pages URL, derives the
   door code, goes through it, and drives the long wall and the puzzle. */
import { chromium } from 'playwright-core';

const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'https://aruntamura.github.io/ayanna-gift/';

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
    const n = window.CONFIG.CODE_LENGTH, max = Math.pow(10, n);
    for (let i = 0; i < max; i++) {
      const s = String(i).padStart(n, '0');
      if (h(s) === window.CONFIG.CODE_HASH) return s;
    }
    return null;
  });
}

const b = await chromium.launch({ executablePath: CH });
for (const [tag, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const p = await (await b.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: tag === 'mobile' })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  p.on('requestfailed', r => errs.push('failed: ' + r.url()));

  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForTimeout(1400);
  const title = await p.title();
  await p.fill('#door-input', await doorCode(p));
  await p.waitForTimeout(2000);
  const inside = (await p.$('#door')) === null;

  await p.evaluate(() => document.getElementById('room-ii').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(600);
  const wallBefore = await p.evaluate(() => Math.round(document.getElementById('wall-rail').scrollLeft));
  await p.click('[data-wall="1"]');
  await p.waitForTimeout(1200);
  const wallAfter = await p.evaluate(() => Math.round(document.getElementById('wall-rail').scrollLeft));

  const name = await p.evaluate(() => document.getElementById('close-coll').textContent.trim());
  await p.click('#tab-puzzle');
  await p.waitForTimeout(700);
  const clues = await p.evaluate(() => document.querySelectorAll('.clue').length);
  await p.screenshot({ path: `lab/live-${tag}.png` });

  console.log(tag, JSON.stringify({ title, inside, wallMoves: wallAfter > wallBefore, name, clues, errs }));
  await p.close();
}
await b.close();
