
(async function(){
  "use strict";
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const period=r=>r.alertMonth&&r.alertYear?`${r.alertMonth} ${r.alertYear}`:(r.alertYear||"");
  try{
    const res=await fetch("./drugAlerts.json",{cache:"no-store"}); if(!res.ok) throw new Error(res.status);
    const db=await res.json(), records=Array.isArray(db.records)?db.records:[];
    const sorted=[...records].sort((a,b)=>String(period(b)).localeCompare(String(period(a)))).slice(0,12);
    const grid=document.getElementById("recent-grid");
    if(!grid)return;
    grid.innerHTML=sorted.map((r,i)=>{
      const nsq=(r.category||"").toUpperCase()==="NSQ";
      return `<article class="recent-card recent-card--${nsq?"nsq":"alerted"}"><span class="recent-tag recent-tag--${nsq?"nsq":"alerted"}">${nsq?"🔴 NSQ":"🟠 ALERT"}</span><h4>${esc(r.medicineName||"Medicine not specified")}</h4><p class="recent-meta">Batch <span class="batch">${esc(r.batchNumber||"Not specified")}</span></p><p class="recent-meta">${esc(r.manufacturer||"Manufacturer not listed")}</p><p class="recent-meta">Alerted ${esc(period(r)||"Period not listed")}</p><button class="recent-view" type="button" data-open="${i}" aria-expanded="false"><span>View details</span></button><div class="details-body" id="alert-detail-${i}"><dl class="result-grid" style="margin-top:14px;padding-top:14px"><div><dt>Reason for alert</dt><dd>${esc(r.reason||"Not specified")}</dd></div><div><dt>Manufacturing date</dt><dd>${esc(r.manufacturingDate||"Not specified")}</dd></div><div><dt>Expiry date</dt><dd>${esc(r.expiryDate||"Not specified")}</dd></div><div><dt>Drawn by</dt><dd>${esc(r.drawnBy||"Not specified")}</dd></div></dl></div></article>`;
    }).join("");
    grid.querySelectorAll("[data-open]").forEach(btn=>btn.addEventListener("click",()=>{
      const body=document.getElementById("alert-detail-"+btn.dataset.open), open=body.classList.toggle("open");
      btn.setAttribute("aria-expanded",String(open)); btn.querySelector("span").textContent=open?"Hide details":"View details";
    }));
  }catch(err){
    const grid=document.getElementById("recent-grid"); if(grid) grid.innerHTML="<p>Recent alert records could not be loaded. Please refresh.</p>";
  }
})();
