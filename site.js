
(function(){
  "use strict";
  const answers = {
    search:["How do I search a medicine?","Enter a medicine name or batch number in Check Drug. Pharma Shield checks the available CDSCO-derived alert index."],
    nsq:["What is an NSQ drug alert?","NSQ means Not of Standard Quality. It indicates that the reported sample failed a specified quality standard or test in the regulatory record."],
    batch:["What is a batch number?","A batch number identifies a particular manufactured lot of a medicine and can help narrow a regulatory record search."],
    alerted:["What does an Alerted result mean?","A matching record was found in the Pharma Shield drug-alert dataset. Open the result to review its available regulatory details and source information."],
    noalert:["What does No Alert Found mean?","No matching record was found in the available dataset for the information searched. This does not certify that a medicine is safe, genuine, approved, or of standard quality."],
    prohibited:["What are Prohibited Drugs?","The Prohibited Drugs page provides the entries included in the supplied prohibited-drugs reference dataset, with searchable notification and regulatory details."],
    analytics:["How does Analytics work?","The Intelligence page calculates charts and summary metrics directly from the loaded drug-alert dataset."],
    data:["Where does the data come from?","Pharma Shield uses its included CDSCO-derived drug-alert dataset and the supplied prohibited-drugs reference dataset. Coverage and source notes are shown on the Sources page."],
    about:["About Pharma Shield","Pharma Shield is a student-developed pharmaceutical information platform focused on drug-quality alerts and regulatory information. The project team is Vivek Ramteke and Nikhil Mohare."]
  };
  function init(){
    const toggle=document.getElementById("ps-help-toggle"), panel=document.getElementById("ps-help-panel");
    if(!toggle||!panel) return;
    const close=document.getElementById("ps-help-close"), answer=document.getElementById("ps-help-answer");
    const open=()=>{panel.hidden=false;toggle.setAttribute("aria-expanded","true")};
    const shut=()=>{panel.hidden=true;toggle.setAttribute("aria-expanded","false")};
    toggle.addEventListener("click",()=>panel.hidden?open():shut());
    if(close) close.addEventListener("click",shut);
    document.querySelectorAll("[data-help-q]").forEach(b=>b.addEventListener("click",()=>{
      const item=answers[b.dataset.helpQ]; if(!item) return;
      answer.innerHTML="<strong>"+item[0]+"</strong><span>"+item[1]+"</span>";
      answer.hidden=false;
    }));
    const nav=document.getElementById("main-nav"), nt=document.getElementById("nav-toggle");
    if(nav&&nt){
      nt.addEventListener("click",()=>{const o=nav.classList.toggle("mobile-open");nt.setAttribute("aria-expanded",String(o))});
      nav.querySelectorAll("[data-nav]").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("mobile-open");nt.setAttribute("aria-expanded","false")}));
    }
  }
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",init):init();
})();
