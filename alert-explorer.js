(async function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const v=(r,ks,f='Not specified')=>{for(const k of ks)if(r[k]!=null&&String(r[k]).trim())return String(r[k]);return f};
const nsq=r=>{const x=v(r,['category','reportType','type'],'').toUpperCase();return x.includes('NSQ')||x.includes('NOT OF STANDARD QUALITY')};
const key=r=>{let y=v(r,['alertYear','year'],'0000'),m=v(r,['alertMonth','month'],'');let n=parseInt(String(m).replace(/\D/g,''),10)||0;return `${y}-${String(n).padStart(2,'0')}`};
const period=r=>{let m=v(r,['alertMonth','month'],'');let y=v(r,['alertYear','year'],'');return [m,y].filter(Boolean).join(' ')||'Period not listed'};
try{
 const res=await fetch('./drugAlerts.json?explorer=3',{cache:'no-store'}); if(!res.ok)throw Error(res.status);
 const db=await res.json(); const rs=Array.isArray(db.records)?db.records:[];
 const arr=[...rs].sort((a,b)=>key(b).localeCompare(key(a))).slice(0,12);
 const grid=document.getElementById('recent-grid'); if(!grid)return;
 const count=document.getElementById('recent-count'); if(count)count.textContent=`${arr.length} recent records`;
 grid.innerHTML=arr.map((r,i)=>{const red=nsq(r);return `<article class="ps-alert-card ${red?'ps-alert-card--nsq':'ps-alert-card--other'}">
 <div class="ps-alert-card-top"><span class="ps-alert-badge ${red?'ps-alert-badge--nsq':'ps-alert-badge--other'}">${red?'● NSQ ALERT':'● ALERT'}</span><span class="ps-alert-period">${esc(period(r))}</span></div>
 <h2>${esc(v(r,['medicineName','drugName','name'],'Medicine not specified'))}</h2>
 <div class="ps-alert-facts"><div><span>Batch</span><strong>${esc(v(r,['batchNumber','batchNo','batch']))}</strong></div><div><span>Manufacturer</span><strong>${esc(v(r,['manufacturer','manufacturerName']))}</strong></div><div><span>Dosage / Form</span><strong>${esc(v(r,['dosageForm','dosage','form']))}</strong></div></div>
 <div class="ps-alert-reason"><span>Reason / Test Failure</span><p>${esc(v(r,['reason','reasonTestFailure','testFailure','failureReason']))}</p></div>
 <button class="ps-alert-details-btn" type="button" data-open="${i}" aria-expanded="false">View regulatory details <span>+</span></button>
 <div class="ps-alert-details" id="alert-detail-${i}"><dl><div><dt>Report Type</dt><dd>${esc(v(r,['reportType','category','type']))}</dd></div><div><dt>Alert Period</dt><dd>${esc(period(r))}</dd></div><div><dt>Source</dt><dd>${esc(v(r,['sourceFile','source'],'Source not listed'))}</dd></div><div><dt>Drawn By</dt><dd>${esc(v(r,['drawnBy','sampleDrawnBy']))}</dd></div></dl></div></article>`}).join('');
 grid.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{const d=document.getElementById('alert-detail-'+b.dataset.open),o=d.classList.toggle('open');b.setAttribute('aria-expanded',o);b.querySelector('span').textContent=o?'−':'+'});
}catch(e){console.error(e);const g=document.getElementById('recent-grid');if(g)g.innerHTML='<div class="ps-alert-error">Recent alert records could not be loaded. Please refresh.</div>'}
})();
