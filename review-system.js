/* PHARMA SHIELD — Public Community Reviews
 *
 * Cloud mode:
 *   Set REVIEW_API_URL to your deployed Spring Boot API, e.g.
 *   https://api.example.com/api/reviews
 *
 * Required endpoints:
 *   GET    /api/reviews
 *   POST   /api/reviews
 *   DELETE /api/admin/reviews/{id}
 *
 * The frontend never changes drugAlerts.json.
 * If REVIEW_API_URL is empty, reviews are stored locally as a development
 * fallback and are explicitly labelled as device-only.
 */
(() => {
  "use strict";

  const REVIEW_API_URL = ""; // <-- put your deployed review API here
  const LOCAL_KEY = "pharmaShieldPublicReviews";
  const ADMIN_KEY_STORAGE = "pharmaShieldAdminKey";

  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));

  function stars(n){
    n = Math.max(0, Math.min(5, Number(n)||0));
    return "★".repeat(n) + "☆".repeat(5-n);
  }

  function dateLabel(v){
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});
  }

  function getLocal(){
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)||"[]"); }
    catch { return []; }
  }

  function saveLocal(items){
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  }

  async function request(path="", options={}){
    const res = await fetch(REVIEW_API_URL + path, {
      ...options,
      headers: {"Content-Type":"application/json", ...(options.headers||{})}
    });
    if(!res.ok) throw new Error("Review service returned " + res.status);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async function loadReviews(){
    if(!REVIEW_API_URL) return getLocal();
    const data = await request();
    return Array.isArray(data) ? data : (Array.isArray(data.reviews) ? data.reviews : []);
  }

  function renderStats(items){
    const count = items.length;
    const avg = count ? items.reduce((s,r)=>s+(Number(r.rating)||0),0)/count : 0;
    $("#review-average").textContent = count ? avg.toFixed(1) : "—";
    $("#review-stars").textContent = count ? stars(Math.round(avg)) : "☆☆☆☆☆";
    $("#review-count").textContent = count;

    const bars = $("#review-bars");
    bars.innerHTML = [5,4,3,2,1].map(n=>{
      const num = items.filter(r=>Number(r.rating)===n).length;
      const pct = count ? Math.round(num/count*100) : 0;
      return `<div class="rating-row"><span>${n} ★</span><div class="rating-track"><div class="rating-fill" style="width:${pct}%"></div></div><span>${pct}%</span></div>`;
    }).join("");
  }

  function renderReviews(items){
    const list = $("#reviews-list");
    if(!items.length){
      list.innerHTML = `<div class="review-empty">No reviews yet. Be the first to share your experience.</div>`;
      return;
    }
    items.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
    list.innerHTML = items.map(r=>`
      <article class="review-card">
        <div class="review-card-top">
          <div><div class="review-author">${esc(r.name||"Anonymous")}</div><div class="review-meta">${esc(r.role||"Community member")} · ${dateLabel(r.createdAt)}</div></div>
          <div class="review-card-stars" aria-label="${Number(r.rating)||0} out of 5 stars">${stars(Number(r.rating)||0)}</div>
        </div>
        <p class="review-body">${esc(r.review||"")}</p>
      </article>`).join("");
  }

  async function refresh(){
    try{
      const items = await loadReviews();
      renderStats(items); renderReviews(items);
      return items;
    }catch(err){
      console.error(err);
      $("#reviews-list").innerHTML = `<div class="review-empty">Reviews are temporarily unavailable. Please try again later.</div>`;
      return [];
    }
  }

  function initStars(){
    let selected = 5;
    const hidden = $("#review-rating");
    document.querySelectorAll("#star-picker button").forEach(btn=>{
      btn.addEventListener("click",()=>{
        selected = Number(btn.dataset.rating);
        hidden.value = selected;
        document.querySelectorAll("#star-picker button").forEach(b=>b.classList.toggle("active", Number(b.dataset.rating)<=selected));
      });
    });
    document.querySelectorAll("#star-picker button").forEach(b=>b.classList.add("active"));
  }

  async function submitReview(e){
    e.preventDefault();
    const status=$("#review-status");
    const data={
      name:$("#review-name").value.trim(),
      rating:Number($("#review-rating").value),
      role:$("#review-role").value,
      review:$("#review-text").value.trim(),
      createdAt:new Date().toISOString()
    };
    if(!data.name || !data.review || data.rating<1 || data.rating>5){
      status.textContent="Please enter your name, review and rating.";
      return;
    }
    status.textContent="Publishing review…";
    try{
      if(REVIEW_API_URL){
        await request("",{method:"POST",body:JSON.stringify(data)});
      }else{
        const items=getLocal();
        items.push({...data,id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now())});
        saveLocal(items.slice(-100));
      }
      $("#review-form").reset();
      $("#review-rating").value="5";
      document.querySelectorAll("#star-picker button").forEach(b=>b.classList.add("active"));
      status.textContent=REVIEW_API_URL ? "Review published. Thank you!" : "Saved on this device. Cloud reviews are not configured yet.";
      await refresh();
    }catch(err){
      console.error(err);
      status.textContent="Could not publish the review. Please try again.";
    }
  }

  async function adminLoad(){
    const status=$("#admin-status"), key=$("#admin-key").value.trim();
    if(!REVIEW_API_URL){ status.textContent="Configure REVIEW_API_URL first."; return; }
    if(!key){ status.textContent="Enter the admin key."; return; }
    sessionStorage.setItem(ADMIN_KEY_STORAGE,key);
    status.textContent="Loading…";
    try{
      const items=await request("",{headers:{"X-Admin-Key":key}});
      const rows=Array.isArray(items)?items:(items.reviews||[]);
      $("#admin-review-list").innerHTML=rows.length ? rows.map(r=>`
        <div class="admin-review-row">
          <div><strong>${esc(r.name||"Anonymous")}</strong> · ${Number(r.rating)||0}/5 · ${dateLabel(r.createdAt)}<br>${esc(r.review||"")}</div>
          <button class="admin-remove" type="button" data-remove-id="${esc(r.id)}">Remove</button>
        </div>`).join("") : `<div class="review-empty">No reviews.</div>`;
      $("#admin-reviews").hidden=false;
      status.textContent=`${rows.length} review(s) loaded.`;
      document.querySelectorAll("[data-remove-id]").forEach(b=>b.addEventListener("click",()=>adminRemove(b.dataset.removeId)));
    }catch(err){ status.textContent="Admin access failed. Check the key or API."; }
  }

  async function adminRemove(id){
    const key=sessionStorage.getItem(ADMIN_KEY_STORAGE)||$("#admin-key").value.trim();
    if(!id || !key || !confirm("Remove this review permanently?")) return;
    try{
      await request(`/../admin/reviews/${encodeURIComponent(id)}`,{method:"DELETE",headers:{"X-Admin-Key":key}});
      await adminLoad(); await refresh();
    }catch(err){ $("#admin-status").textContent="Could not remove the review."; }
  }

  document.addEventListener("DOMContentLoaded",()=>{
    if(!$("#review-form")) return;
    initStars();
    $("#review-form").addEventListener("submit",submitReview);
    $("#admin-load")?.addEventListener("click",adminLoad);
    refresh();
  });
})();
