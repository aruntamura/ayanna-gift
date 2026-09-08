import { chromium } from 'playwright-core';
const CH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL='https://aruntamura.github.io/ayanna-gift/';
const b=await chromium.launch({executablePath:CH});
for (const [tag,vp] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]) {
  const p=await (await b.newContext({viewport:vp,deviceScaleFactor:2,hasTouch:tag==='mobile'})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
  p.on('requestfailed',r=>errs.push('failed: '+r.url()));
  await p.goto(URL,{waitUntil:'load'});
  await p.waitForTimeout(1500);
  await p.screenshot({path:`lab/live-${tag}-door.png`});
  const title = await p.title();
  await p.fill('#door-input','561');
  await p.waitForTimeout(2000);
  const inside = (await p.$('#door'))===null;
  // does her name land where it should
  const name = await p.evaluate(()=>({
    coll: document.getElementById('close-coll').textContent.trim(),
    solved: document.getElementById('xw-solved-sub').textContent.trim(),
  }));
  // instant, not smooth: a screenshot taken mid-smooth-scroll catches the
  // fixed bar at a stale offset and looks like a layout bug
  await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  await p.waitForTimeout(700);
  await p.screenshot({path:`lab/live-${tag}-close.png`});
  await p.click('#tab-puzzle'); await p.waitForTimeout(700);
  await p.screenshot({path:`lab/live-${tag}-puzzle.png`});
  console.log(tag, JSON.stringify({title, inside, name, errs}));
  await p.close();
}
await b.close();
