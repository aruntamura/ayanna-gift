import { chromium } from 'playwright-core';
const CH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
async function code(p){return await p.evaluate(()=>{const h=s=>{let x=0x811c9dc5;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=(x+(x<<1)+(x<<4)+(x<<7)+(x<<8)+(x<<24))>>>0}return x>>>0};const n=window.CONFIG.CODE_LENGTH,m=Math.pow(10,n);for(let i=0;i<m;i++){const s=String(i).padStart(n,'0');if(h(s)===window.CONFIG.CODE_HASH)return s}return null});}
const b=await chromium.launch({executablePath:CH});
const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1})).newPage();
await p.goto('http://localhost:4500/',{waitUntil:'load'});
await p.waitForTimeout(900);
await p.fill('#door-input', await code(p)); await p.waitForTimeout(1800);
// walk the whole page so every lazy image starts loading
await p.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=400){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,40));}});
// then wait until they have all actually decoded
try {
  await p.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0),null,{timeout:15000});
} catch (e) {
  const stuck = await p.evaluate(()=>Array.from(document.images)
    .filter(i=>!(i.complete&&i.naturalWidth>0))
    .map(i=>({src:i.getAttribute('src'), complete:i.complete, nw:i.naturalWidth, loading:i.getAttribute('loading')})));
  console.log('STUCK IMAGES:', JSON.stringify(stuck,null,1));
}
await p.waitForTimeout(500);
const report = await p.evaluate(()=>{
  const bad=[];
  document.querySelectorAll('.salon__obj img, .rail__obj img').forEach(i=>{
    const r=i.getBoundingClientRect();
    if(r.height < 40) bad.push({src:i.src.split('/').pop(), w:Math.round(r.width), h:Math.round(r.height)});
  });
  const sal=document.getElementById('salon');
  return {collapsed:bad, salonHeight:Math.round(sal.getBoundingClientRect().height),
          cols:getComputedStyle(sal).columnCount};
});
console.log(JSON.stringify(report,null,1));
for (const [id,name] of [['room-iii','small'],['room-iv','pile']]) {
  await p.evaluate(i=>document.getElementById(i).scrollIntoView({block:'center',behavior:'instant'}), id);
  await p.waitForTimeout(700);
  await p.screenshot({path:`lab/look-${name}.png`});
}
await p.evaluate(()=>{const e=document.getElementById('salon');scrollTo({top:e.getBoundingClientRect().top+scrollY-60,behavior:'instant'})});
await p.waitForTimeout(700);
await p.screenshot({path:'lab/look-pile-top.png'});
await b.close();
