import { chromium } from "@playwright/test";
const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:320,height:900}});
const p=await ctx.newPage();
await p.goto("https://myskinwise.vercel.app/pigmentation",{waitUntil:"domcontentloaded"});
await p.waitForTimeout(700);
const r=await p.evaluate(()=>{
  const vw=document.documentElement.clientWidth;
  const out=[];
  for(const el of document.querySelectorAll("body *")){
    const b=el.getBoundingClientRect();
    if(b.width>0 && Math.round(b.right)>vw+1){
      out.push({tag:el.tagName.toLowerCase(),cls:(typeof el.className==="string"?el.className:"").slice(0,70),
                w:Math.round(b.width),right:Math.round(b.right),txt:(el.textContent||"").trim().slice(0,40)});
    }
  }
  return {vw,count:out.length,worst:out.sort((a,b)=>b.right-a.right).slice(0,6)};
});
console.log("  viewport:",r.vw,"| overflowing elements:",r.count);
for(const e of r.worst) console.log(`   <${e.tag} class="${e.cls}"> w=${e.w} right=${e.right} "${e.txt}"`);
await browser.close();
