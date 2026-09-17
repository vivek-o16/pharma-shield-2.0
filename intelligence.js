(async function(){
"use strict";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const reasons={
 "assay": "Assay failure means the measured amount or potency of the active ingredient did not meet the specified standard.",
 "dissolution": "Dissolution evaluates how a drug substance is released from its dosage form under defined test conditions.",
 "disintegration": "Disintegration measures how a solid dosage form breaks apart within the specified time.",
 "sterility": "Sterility testing checks whether specified viable microorganisms are absent from products required to be sterile.",
 "sub-standard": "Sub-standard indicates that a product does not meet the applicable quality specification; the exact test should be checked in the source record."
};
function reasonHelp(label){const l=label.toLowerCase();for(const k of Object.keys(reasons))if(l.includes(k))return reasons[k];return "Review the original source record for the exact test method and acceptance criterion.";}
try{
 const res=await fetch("./drugAlerts.json?intelligence=3",{cache:"no-store"}); if(!res.ok)throw new Error(res.status);
 const db=await res.json(), records=Array.isArray(db.records)?db.records:[];
 const nsq=records.filter(r=>String(r.category||"").toUpperCase()==="NSQ");
 const reasonMap=new Map(); nsq.forEach(r=>{const raw=String(r.reason||"Not specified").trim(); const key=raw.length>42?raw.slice(0,39)+"…":raw;reasonMap.set(key,(reasonMap.get(key)||0)+1)});
 const reasonsTop=[...reasonMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
 const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
 const trend=new Map(); records.forEach(r=>{if(!r.alertYear)return;const mi=months.findIndex(m=>m.toLowerCase()===String(r.alertMonth||"").toLowerCase());const k=`${r.alertYear}-${String(mi<0?0:mi+1).padStart(2,"0")}`;trend.set(k,(trend.get(k)||0)+1)});
 const labels=[...trend.keys()].sort(), values=labels.map(k=>trend.get(k));
 const palette=["#d94a5a","#e08a2e","#d3b23f","#4b9bc2","#5d78b7","#6eaa7a","#8a6db7","#4b8f8a"];
 const common={responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{usePointStyle:true,padding:16}},tooltip:{callbacks:{}}}};
 const c1=document.getElementById("nsq-reasons-chart");
 if(c1) new Chart(c1,{type:"doughnut",data:{labels:reasonsTop.map(x=>x[0]),datasets:[{data:reasonsTop.map(x=>x[1]),backgroundColor:palette,borderWidth:2,borderColor:"#fff"}]},options:{...common,cutout:"58%",plugins:{...common.plugins,tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${ctx.raw} records`,afterLabel:ctx=>reasonHelp(ctx.label)}}}}});
 const c2=document.getElementById("monthly-trend-chart");
 if(c2) new Chart(c2,{type:"line",data:{labels:labels.map(k=>{const [y,m]=k.split("-");return `${months[Number(m)-1]||"Unknown"} ${y}`}),datasets:[{label:"Drug alerts",data:values,borderColor:"#087f73",backgroundColor:"rgba(8,127,115,.12)",fill:true,tension:.28,pointRadius:3,pointHoverRadius:6}]},options:{...common,scales:{x:{ticks:{maxRotation:55,minRotation:30,maxTicksLimit:18}},y:{beginAtZero:true,ticks:{precision:0}}},plugins:{...common.plugins,tooltip:{callbacks:{label:ctx=>`${ctx.raw} alert records`}}}}});
 const m=document.getElementById("intelligence-metrics"); if(m)m.innerHTML=`<div><b>${records.length.toLocaleString("en-IN")}</b><span>Total alert records</span></div><div><b>${nsq.length.toLocaleString("en-IN")}</b><span>NSQ records</span></div><div><b>${reasonMap.size}</b><span>Distinct reason labels</span></div><div><b>${labels.length}</b><span>Alert months represented</span></div>`;
}catch(e){console.error(e);document.querySelector(".intelligence-dashboard").insertAdjacentHTML("beforeend","<p class='analytics-empty'>The intelligence dataset could not be loaded. Please refresh.</p>");}
})();