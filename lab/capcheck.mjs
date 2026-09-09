/* Every caption must sit in its print's bottom margin, never over the image. */
import { chromium } from 'playwright-core';
const CH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
async function doorCode(page){return await page.evaluate(()=>{const h=s=>{let x=0x811c9dc5;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=(x+(x<<1)+(x<<4)+(x<<7)+(x<<8)+(x<<24))>>>0}return x>>>0};const n=window.CONFIG.CODE_LENGTH,m=Math.pow(10,n);for(let i=0;i<m;i++){const s=String(i).padStart(n,'0');if(h(s)===window.CONFIG.CODE_HASH)return s}return null});}
const b=await chromium.launch({executablePath:CH});
for (const [tag,vp] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]) {
  const p=await (await b.newContext({viewport:vp})).newPage();
  await p.goto('http://localhost:4500/',{waitUntil:'load'});
  await p.waitForTimeout(900);
  await p.fill('#door-input', await doorCode(p)); await p.waitForTimeout(1800);
  // walk the page so every lazy image has laid out
  await p.evaluate(async ()=>{ for(let y=0;y<document.documentElement.scrollHeight;y+=600){ scrollTo({top:y,behavior:'instant'}); await new Promise(r=>setTimeout(r,30)); } });
  await p.waitForTimeout(600);
  const bad = await p.evaluate(()=>{
    const out=[];
    document.querySelectorAll('.cap').forEach(cap=>{
      const frame=cap.closest('.object__frame, .principal__frame');
      const img=frame && frame.querySelector('img');
      if(!img) return;
      /* Layout offsets, not bounding rects. The prints are ROTATED, and
         getBoundingClientRect returns an axis-aligned box, so a rotated image
         and a rotated caption below it have overlapping boxes even though the
         content does not touch. offsetTop/offsetHeight are layout values and
         ignore transforms, which is exactly what this needs to compare. */
      if(!cap.offsetHeight||!img.offsetHeight) return;
      const overlap=(img.offsetTop+img.offsetHeight)-cap.offsetTop;
      if(overlap>2) out.push({
        cls: frame.className,
        photo: (img.getAttribute('alt')||'').replace('Placeholder photo ',''),
        room: (frame.closest('section')||{}).id,
        overlapPx: Math.round(overlap),
        padBottom: getComputedStyle(frame).paddingBottom,
        capH: cap.offsetHeight,
        capTop: cap.offsetTop, imgBottom: img.offsetTop+img.offsetHeight,
        capFont: getComputedStyle(cap.querySelector('.cap__text')||cap).fontSize,
      });
    });
    return out;
  });
  console.log(tag, bad.length?JSON.stringify(bad):'all captions clear of their images');
  await p.close();
}
await b.close();
