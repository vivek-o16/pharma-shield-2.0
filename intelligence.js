(async function(){
"use strict";

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];

function clean(value){
  const v=String(value??"").trim();
  return v && v!=="-" ? v : "";
}
function labelOrSource(value){ return clean(value) || "Not reported in source"; }
function monthIndex(value){
  const i=MONTHS.findIndex(m=>m.toLowerCase()===clean(value).toLowerCase());
  return i;
}
function monthKey(record){
  const y=Number(record.alertYear);
  const m=monthIndex(record.alertMonth);
  return Number.isFinite(y)&&y>0&&m>=0 ? `${y}-${String(m+1).padStart(2,"0")}` : null;
}
function countBy(records, getter){
  const map=new Map();
  records.forEach(r=>{
    const value=getter(r);
    if(!value)return;
    map.set(value,(map.get(value)||0)+1);
  });
  return map;
}
function sortedEntries(map){
  return [...map.entries()].sort((a,b)=>b[1]-a[1]||String(a[0]).localeCompare(String(b[0])));
}
function wrapLabel(value,max=34){
  const s=String(value);
  if(s.length<=max)return s;
  const words=s.split(/\s+/), out=[]; let line="";
  for(const word of words){
    if((line+" "+word).trim().length>max && line){out.push(line);line=word;}
    else line=(line+" "+word).trim();
  }
  if(line)out.push(line);
  return out;
}
function commonOptions(){
  return {
    responsive:true, maintainAspectRatio:false,
    interaction:{mode:"index",intersect:false},
    plugins:{
      legend:{position:"bottom",labels:{usePointStyle:true,padding:16}},
      tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label ? ctx.dataset.label+": " : ""}${Number(ctx.raw).toLocaleString("en-IN")} records`}}
    },
    scales:{
      x:{ticks:{maxRotation:55,minRotation:0}},
      y:{beginAtZero:true,ticks:{precision:0}}
    }
  };
}
function makeChart(id,config){
  const canvas=document.getElementById(id);
  if(!canvas)return;
  return new Chart(canvas,config);
}

try{
  const res=await fetch("./drugAlerts.json?intelligence=4",{cache:"no-store"});
  if(!res.ok)throw new Error(`Dataset request failed: ${res.status}`);
  const db=await res.json();
  const records=Array.isArray(db.records)?db.records:[];
  if(!records.length)throw new Error("Dataset contains no records.");

  const nsq=records.filter(r=>clean(r.category).toUpperCase()==="NSQ");
  const manufacturerMap=countBy(records,r=>clean(r.manufacturer).toLowerCase()==="under investigation" ? "Under Investigation" : clean(r.manufacturer));
  const manufacturerTop=sortedEntries(manufacturerMap).filter(([name])=>name!=="Under Investigation").slice(0,10);

  const reasonMap=countBy(nsq,r=>clean(r.reason));
  const reasonsTop=sortedEntries(reasonMap).slice(0,10);

  const yearMap=countBy(records,r=>clean(r.alertYear));
  const yearEntries=[...yearMap.entries()].sort((a,b)=>Number(a[0])-Number(b[0]));

  const categoryMap=countBy(records,r=>clean(r.category));
  const categoryEntries=sortedEntries(categoryMap);

  const monthMap=countBy(records,r=>monthKey(r));
  const monthEntries=[...monthMap.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  const monthLabels=monthEntries.map(([key])=>{
    const [y,m]=key.split("-");
    return `${MONTHS[Number(m)-1]} ${y}`;
  });
  const monthValues=monthEntries.map(([,v])=>v);
  const recent=monthEntries.slice(-12);

  const uniqueManufacturers=new Set(
    records.map(r=>clean(r.manufacturer)).filter(v=>v && v.toLowerCase()!=="under investigation")
  ).size;
  const latestYear=Math.max(...records.map(r=>Number(r.alertYear)||0));
  const latestMonthEntries=monthEntries.filter(([key])=>Number(key.slice(0,4))===latestYear);
  const latestCoverage=clean(db.lastUpdated) || (latestMonthEntries.length ? monthLabels[monthLabels.length-1] : "Not reported in source");

  const metrics=document.getElementById("intelligence-metrics");
  if(metrics)metrics.innerHTML=`
    <div><b>${records.length.toLocaleString("en-IN")}</b><span>Alert Index</span></div>
    <div><b>${nsq.length.toLocaleString("en-IN")}</b><span>NSQ Signals</span></div>
    <div><b>${uniqueManufacturers.toLocaleString("en-IN")}</b><span>Manufacturers</span></div>
    <div><b>${esc(latestCoverage)}</b><span>Updated</span></div>
    <div><b>${yearEntries.length}</b><span>Reporting Years</span></div>
    <div><b>${recent.reduce((sum,[,v])=>sum+v,0).toLocaleString("en-IN")}</b><span>Recent Reported Alerts</span></div>
    <div><b>${new Set(records.map(r=>clean(r.medicineName)).filter(Boolean)).size.toLocaleString("en-IN")}</b><span>Unique Drug Names</span></div>
    <div><b>${monthLabels[monthLabels.length-1]||"Not reported in source"}</b><span>Most Recent Alert Period</span></div>`;

  const palette=["#087f73","#c63d3d","#4b78a8","#c57a21","#6eaa7a","#8a6db7","#4b8f8a","#b66b8a","#6d7f86","#9a7b4f"];

  makeChart("monthly-trend-chart",{
    type:"line",
    data:{labels:monthLabels,datasets:[{label:"Drug alerts",data:monthValues,borderColor:"#087f73",backgroundColor:"rgba(8,127,115,.12)",fill:true,tension:.28,pointRadius:2,pointHoverRadius:5}]},
    options:{...commonOptions(),plugins:{...commonOptions().plugins,tooltip:{callbacks:{label:ctx=>`${Number(ctx.raw).toLocaleString("en-IN")} alert records`}}}}
  });

  makeChart("nsq-reasons-chart",{
    type:"bar",
    data:{labels:reasonsTop.map(([k])=>wrapLabel(k,28)),datasets:[{label:"NSQ records",data:reasonsTop.map(([,v])=>v),backgroundColor:"#087f73",borderRadius:5}]},
    options:{...commonOptions(),indexAxis:"y",scales:{x:{beginAtZero:true,ticks:{precision:0}},y:{ticks:{autoSkip:false}}},plugins:{...commonOptions().plugins,legend:{display:false}}}
  });

  makeChart("alerts-year-chart",{
    type:"bar",
    data:{labels:yearEntries.map(([y])=>y),datasets:[{label:"Alert records",data:yearEntries.map(([,v])=>v),backgroundColor:"#4b78a8",borderRadius:5}]},
    options:{...commonOptions(),plugins:{...commonOptions().plugins,legend:{display:false}}}
  });

  makeChart("report-type-chart",{
    type:"doughnut",
    data:{labels:categoryEntries.map(([k])=>labelOrSource(k)),datasets:[{label:"Records",data:categoryEntries.map(([,v])=>v),backgroundColor:palette,borderWidth:2,borderColor:"#fff"}]},
    options:{...commonOptions(),cutout:"58%",plugins:{...commonOptions().plugins,tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${Number(ctx.raw).toLocaleString("en-IN")} records`}}}}
  });

  makeChart("manufacturer-chart",{
    type:"bar",
    data:{labels:manufacturerTop.map(([k])=>wrapLabel(k,30)),datasets:[{label:"Alert records",data:manufacturerTop.map(([,v])=>v),backgroundColor:"#c57a21",borderRadius:5}]},
    options:{...commonOptions(),indexAxis:"y",scales:{x:{beginAtZero:true,ticks:{precision:0}},y:{ticks:{autoSkip:false}}},plugins:{...commonOptions().plugins,legend:{display:false}}}
  });

  makeChart("recent-activity-chart",{
    type:"line",
    data:{labels:recent.map(([key])=>{const [y,m]=key.split("-");return `${MONTHS[Number(m)-1]} ${y}`}),datasets:[{label:"Alert records",data:recent.map(([,v])=>v),borderColor:"#c63d3d",backgroundColor:"rgba(198,61,61,.1)",fill:true,tension:.25,pointRadius:3,pointHoverRadius:6}]},
    options:{...commonOptions(),plugins:{...commonOptions().plugins,tooltip:{callbacks:{label:ctx=>`${Number(ctx.raw).toLocaleString("en-IN")} alert records`}}}}
  });

  makeChart("category-chart",{
    type:"doughnut",
    data:{labels:categoryEntries.map(([k])=>labelOrSource(k)),datasets:[{label:"Alert category",data:categoryEntries.map(([,v])=>v),backgroundColor:palette.slice().reverse(),borderWidth:2,borderColor:"#fff"}]},
    options:{...commonOptions(),cutout:"62%",plugins:{...commonOptions().plugins,tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${Number(ctx.raw).toLocaleString("en-IN")} records`}}}}
  });

}catch(e){
  console.error("Pharma Shield intelligence:",e);
  const dashboard=document.querySelector(".intelligence-dashboard");
  if(dashboard){
    const msg=document.createElement("p");
    msg.className="analytics-empty";
    msg.textContent="Unable to load the Pharma Shield alert dataset. Please refresh the page.";
    dashboard.appendChild(msg);
  }
}
})();