
(async function(){
  "use strict";
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  try{
    const res=await fetch("./drugAlerts.json",{cache:"no-store"});
    if(!res.ok) throw new Error("HTTP "+res.status);
    const db=await res.json();
    const records=Array.isArray(db.records)?db.records:[];
    const years=new Map();
    records.forEach(r=>{if(r.alertYear) years.set(r.alertYear,(years.get(r.alertYear)||0)+1)});
    const max=Math.max(...years.values(),1);
    const yearHost=document.getElementById("chart-years");
    if(yearHost) yearHost.innerHTML=[...years.entries()].sort((a,b)=>a[0]-b[0]).map(([y,c])=>`<div class="bar-col" title="${y}: ${c} records"><div class="bar-track"><div class="bar-fill" style="height:${Math.max(6,Math.round(c/max*100))}%"></div></div><span class="bar-count">${c}</span><span class="bar-label">${y}</span></div>`).join("");
    const nsq=records.filter(r=>(r.category||"").toUpperCase()==="NSQ").length, other=records.length-nsq, total=records.length||1;
    const split=document.getElementById("chart-category-split");
    if(split) split.innerHTML=`<div class="split-bar"><div class="split-seg split-seg--nsq" style="width:${Math.round(nsq/total*100)}%"></div><div class="split-seg split-seg--alerted" style="width:${Math.round(other/total*100)}%"></div></div><div class="split-legend"><span><i class="dot dot--nsq"></i> NSQ — ${nsq.toLocaleString("en-IN")} (${Math.round(nsq/total*100)}%)</span><span><i class="dot dot--alerted"></i> Other alerts — ${other.toLocaleString("en-IN")} (${Math.round(other/total*100)}%)</span></div>`;
    function ranked(sel,arr){
      const host=document.getElementById(sel); if(!host)return;
      const maxc=Math.max(...arr.map(x=>x[1]),1);
      host.innerHTML=arr.map(([l,c])=>`<div class="rank-row"><span class="rank-label" title="${esc(l)}">${esc(l)}</span><div class="rank-track"><div class="rank-fill" style="width:${Math.max(6,Math.round(c/maxc*100))}%"></div></div><span class="rank-count">${c}</span></div>`).join("")||"<p class='analytics-empty'>Not enough data.</p>";
    }
    const mc=new Map(); records.forEach(r=>{const m=(r.manufacturer||"").trim();if(m&&m.toLowerCase()!=="under investigation"){const k=m.length>42?m.slice(0,39)+"…":m;mc.set(k,(mc.get(k)||0)+1)}});
    ranked("chart-manufacturers",[...mc.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6));
    const rc=new Map(); records.forEach(r=>{const k=(r.reason||"").trim();if(k)rc.set(k,(rc.get(k)||0)+1)});
    ranked("chart-reasons",[...rc.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6));
    const ys=[...new Set(records.map(r=>r.alertYear).filter(Boolean))].sort();
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
    set("hist-years",ys.length?`${ys[0]}–${ys[ys.length-1]}`:"—");
    set("hist-total",records.length.toLocaleString("en-IN"));
    set("hist-nsq",nsq.toLocaleString("en-IN"));
    set("hist-alerted",other.toLocaleString("en-IN"));
    set("hist-coverage-note",db.coverage||"");
  }catch(err){
    console.error(err);
    const host=document.getElementById("chart-years");
    if(host) host.innerHTML="<p class='analytics-empty'>The alert dataset could not be loaded. Please refresh.</p>";
  }
})();
