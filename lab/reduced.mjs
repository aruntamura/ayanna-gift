import { chromium } from 'playwright-core';
const CH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const b=await chromium.launch({executablePath:CH});
const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',deviceScaleFactor:2});
const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:4500/',{waitUntil:'load'});
await p.waitForTimeout(700);
await p.fill('#door-input','561'); await p.waitForTimeout(1800);
const doorGone=(await p.$('#door'))===null;

// the long wall is NAVIGATION, not decoration: under reduced motion its
// objects must still be fully reachable and never sit faded
await p.evaluate(()=>document.getElementById('room-ii').scrollIntoView());
await p.waitForTimeout(600);
const rail = await p.evaluate(()=>{
  const rail=document.getElementById('wall-rail');
  const objs=[...rail.querySelectorAll('.rail__obj')];
  return { overflowX:getComputedStyle(rail).overflowX,
           overflow: rail.scrollWidth-rail.clientWidth,
           objs:objs.length,
           anyFaded: objs.filter(o=>+getComputedStyle(o).opacity<0.99).length,
           fwdEnabled: !document.querySelector('[data-wall="1"]').disabled };
});
await p.screenshot({path:'lab/reduced-room-ii.png'});

// nothing should be stuck invisible
await p.evaluate(()=>document.getElementById('salon').scrollIntoView({block:'center'}));
await p.waitForTimeout(600);
const salonVisible = await p.evaluate(()=>{
  const objs=[...document.querySelectorAll('.salon__obj')];
  return objs.map(o=>+getComputedStyle(o).opacity).filter(o=>o<0.9).length;
});
await p.screenshot({path:'lab/reduced-room-iv.png'});
await p.evaluate(()=>document.getElementById('room-v').scrollIntoView({block:'center'}));
await p.waitForTimeout(600);
const principalTransform = await p.evaluate(()=>getComputedStyle(document.querySelector('.principal__frame')).transform);
console.log(JSON.stringify({errs,doorGone,rail,salonHiddenCount:salonVisible,principalTransform},null,1));
await b.close();
