(async function(){
"use strict";
const official="https://www.cdsco.gov.in/opencms/opencms/en/Alerts/";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const months={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
const states=["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Jammu and Kashmir"];
let rows=[], sortKey="date", dir=-1, page=1;
const PAGE_SIZE=25;
function stateOf(r){const text=String(r.manufacturer||"");return states.find(s=>new RegExp("\\b"+s.replace(/ /g,"\\s+")+"\\b","i").test(text))||"Not listed"}
function dateVal(r){const y=Number(r.alertYear)||0,m=months[String(r.alertMonth||"").toLowerCase()]||0;return y*100+m}
function category(r){const c=String(r.category||"").trim();return c||"Alert"}
function sortRows(){rows.sort((a,b)=>{let av,bv;if(sortKey==="date"){av=dateVal(a);bv=dateVal(b)}else if(sortKey==="manufacturer"){av=String(a.manufacturer||"").toLowerCase();bv=String(b.manufacturer||"").toLowerCase()}else if(sortKey==="state"){av=stateOf(a).toLowerCase();bv=stateOf(b).toLowerCase()}else if(sortKey==="category"){av=category(a).toLowerCase();bv=category(b).toLowerCase()}else{av=String(a.medicineName||"").toLowerCase();bv=String(b.medicineName||"").toLowerCase()}if(av<bv)return -1*dir;if(av>bv)return 1*dir;return 0})}
function renderPagination(totalPages){
  const nav=document.getElementById("explorer-pagination");
  if(!nav)return;
  if(totalPages<=1){nav.innerHTML="";return}
  const btn=(label,p,disabled,active)=>`<button type="button" ${disabled?"disabled":""} data-page="${p}" class="${active?"active":""}">${label}</button>`;
  let html=btn("← Prev",page-1,page===1,false);
  const add=(p)=>html+=btn(String(p),p,false,p===page);
  add(1);
  if(page>3)html+='<span style="padding:0 4px">…</span>';
  for(let p=Math.max(2,page-1);p<=Math.min(totalPages-1,page+1);p++)add(p);
  if(page<totalPages-2)html+='<span style="padding:0 4px">…</span>';
  if(totalPages>1)add(totalPages);
  html+=btn("Next →",page+1,page===totalPages,false);
  nav.innerHTML=html;
  nav.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>{
    const p=Number(b.dataset.page);
    if(p>=1&&p<=totalPages&&p!==page){page=p;render();document.querySelector(".explorer-table-wrap").scrollIntoView({behavior:"smooth",block:"start"})}
  }));
}
function render(){
  sortRows();
  const tbody=document.getElementById("explorer-tbody");
  const totalPages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
  page=Math.min(page,totalPages);
  const start=(page-1)*PAGE_SIZE, end=Math.min(start+PAGE_SIZE,rows.length);
  document.getElementById("explorer-count").innerHTML=`${rows.length.toLocaleString("en-IN")} records <span class="explorer-count-note">— showing ${rows.length?start+1:0}–${end}, sorted</span>`;
  tbody.innerHTML=rows.slice(start,end).map((r,i)=>{
    const mfr=esc(r.manufacturer||"Not listed");
    const isNsq=String(r.category||"").toUpperCase()==="NSQ";
    return `<tr><td>${esc([r.alertMonth,r.alertYear].filter(Boolean).join(" ")||"—")}</td><td><strong>${esc(r.medicineName||"—")}</strong><small>Batch: ${esc(r.batchNumber||"—")}</small></td><td title="${mfr}"><span class="cell-clamp">${mfr}</span></td><td>${esc(stateOf(r))}</td><td><span class="explorer-badge explorer-badge--${isNsq?"nsq":"other"}" title="${isNsq?"Not of Standard Quality":esc(category(r))}">${isNsq?"NSQ":esc(category(r))}</span></td><td><a class="source-link" href="${official}" target="_blank" rel="noopener noreferrer">View Official CDSCO Source ↗</a></td></tr>`;
  }).join("")||"<tr><td colspan='6'>No records available.</td></tr>";
  renderPagination(totalPages);
}
function csv(){const h=["Date","Medicine","Batch","Manufacturer","State","Alert Category","Reason","Source File"];const body=rows.map(r=>[ [r.alertMonth,r.alertYear].filter(Boolean).join(" "),r.medicineName,r.batchNumber,r.manufacturer,stateOf(r),category(r),r.reason,r.sourceFile].map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(","));const blob=new Blob([[h.join(","),...body].join("\\n")],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="pharma-shield-alert-explorer.csv";a.click();}
function pdf(){if(!(window.jspdf&&window.jspdf.jsPDF)){window.print();return}const doc=new window.jspdf.jsPDF({unit:"pt",format:"a4"});doc.setFontSize(15);doc.text("Pharma Shield — Alert Explorer",40,40);doc.setFontSize(8);let y=62;rows.slice(0,120).forEach((r,i)=>{const text=`${i+1}. ${r.alertMonth||""} ${r.alertYear||""} | ${r.medicineName||"—"} | ${r.category||"Alert"} | ${r.manufacturer||"—"}`;const lines=doc.splitTextToSize(text,510);if(y+lines.length*11>800){doc.addPage();y=40}doc.text(lines,40,y);y+=lines.length*11+5});doc.save("pharma-shield-alert-explorer.pdf")}
document.addEventListener("DOMContentLoaded",async()=>{try{const r=await fetch("./drugAlerts.json?explorer=3",{cache:"no-store"});const d=await r.json();rows=Array.isArray(d.records)?d.records:[];render()}catch(e){document.getElementById("explorer-tbody").innerHTML="<tr><td colspan='6'>Could not load the alert dataset.</td></tr>"}document.querySelectorAll("[data-sort]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.sort;if(sortKey===k)dir*=-1;else{sortKey=k;dir=1}page=1;render()}));document.getElementById("explorer-csv").addEventListener("click",csv);document.getElementById("explorer-pdf").addEventListener("click",pdf)});
})();