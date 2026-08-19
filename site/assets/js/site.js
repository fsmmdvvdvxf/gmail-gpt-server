/* =============================================================
   Nicole Fields Photography — site.js
   Runtime engine (from site-builder): client-side includes,
   business.json content spine, [data-field] binding, section
   gating (hours/rating/reviews two-gate), services render.
   Plus liquid-glass UI: canvas artwork, lightbox, filters,
   theme, reveal, nav. No build step; serve over http(s).
   ============================================================= */
(function () {
  "use strict";
  var root = document.documentElement;

  /* ---- Theme: system -> light -> dark ---- */
  function applyTheme(t){ if(t==="light"||t==="dark") root.setAttribute("data-theme",t); else root.removeAttribute("data-theme"); }
  function curTheme(){ return localStorage.getItem("nf-theme") || "system"; }
  applyTheme(curTheme());

  /* ---- helpers ---- */
  var get = function (o, p){ return p.split(".").reduce(function(x,k){ return x==null?undefined:x[k]; }, o); };
  var isPending = function (v){ return v==null || v==="" || (typeof v==="string" && v.indexOf("PENDING")===0); };
  function esc(s){ return String(s).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]);}); }

  /* ---- 1. Client-side includes ---- */
  async function loadIncludes(scope){
    scope = scope || document;
    var nodes = scope.querySelectorAll("[data-include]");
    await Promise.all([].map.call(nodes, async function(el){
      try { var r = await fetch(el.getAttribute("data-include")); if(r.ok){ el.innerHTML = await r.text(); await loadIncludes(el); } }
      catch(e){ /* file:// or offline */ }
    }));
  }

  /* ---- 2/3. Bind [data-field] ---- */
  function bindFields(data){
    document.querySelectorAll("[data-field]").forEach(function(el){
      var val = get(data, el.getAttribute("data-field"));
      if(isPending(val)){ var host = el.closest("[data-hide-if-empty]"); if(host) host.hidden = true; return; }
      var attr = el.getAttribute("data-attr");
      if(attr) el.setAttribute(attr, val); else el.textContent = val;
    });
    var hideEmpty = function(el){ var h=el.closest("[data-hide-if-empty]"); if(h) h.hidden=true; else el.hidden=true; };
    document.querySelectorAll("[data-tel]").forEach(function(el){ var p=get(data,"contact.phone"); if(!isPending(p)) el.href="tel:"+String(p).replace(/[^0-9+]/g,""); else hideEmpty(el); });
    document.querySelectorAll("[data-mailto]").forEach(function(el){ var m=get(data,"contact.email"); if(!isPending(m)) el.href="mailto:"+m; else hideEmpty(el); });
    document.querySelectorAll("[data-href]").forEach(function(el){ var v=get(data, el.getAttribute("data-href")); if(!isPending(v)) el.href=v; else hideEmpty(el); });
  }

  /* ---- 4. Gate sections on google.display ---- */
  function gateDisplay(data){
    var d = get(data,"google.display") || {};
    var toggle = function(sel,on){ document.querySelectorAll(sel).forEach(function(n){ n.hidden=!on; }); };
    toggle("[data-section='hours']", !!d.show_hours && !isPending(get(data,"hours.mon")));
    toggle("[data-section='rating']", !!d.show_rating_badge && !isPending(get(data,"google.rating")));
    var reviews = (get(data,"google.curated_reviews")||[]).filter(function(r){ return r && r.approved===true; });
    var testis = get(data,"testimonials") || [];
    toggle("[data-section='reviews']", (!!(d.reviews && d.reviews.enabled) && reviews.length>0) || testis.length>0);
    return reviews;
  }

  /* ---- 5. Services render (category -> items, verbatim) ---- */
  function renderServices(data){
    var mount = document.querySelector("[data-render='services']");
    if(!mount) return;
    var cats = get(data,"services") || [];
    if(!cats.length){ var h=mount.closest("[data-hide-if-empty]"); if(h) h.hidden=true; return; }
    mount.innerHTML = cats.map(function(cat){
      return '<div class="svc-cat glass rev"><h3>'+esc(cat.category)+'</h3><ul>'+
        (cat.items||[]).map(function(it){
          var price = isPending(it.price) ? "Inquire" : esc(it.price);
          var dur = it.duration && !isPending(it.duration) ? " · "+esc(it.duration) : "";
          return '<li class="row"><span class="nm">'+esc(it.name)+'</span><span class="pr">'+price+dur+'</span></li>'+
                 (it.description ? '<li class="desc">'+esc(it.description)+'</li>' : '');
        }).join("")+
        '</ul></div>';
    }).join("");
    reobserveReveal();
  }

  /* ---- Canvas generative artwork (liquid-glass warm palette) ---- */
  function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  var PALS = [
    [[46,30,26],[232,115,94]], [[34,30,40],[247,201,148]], [[30,40,46],[107,143,156]],
    [[52,32,38],[247,201,217]], [[38,34,30],[217,226,242]], [[30,38,36],[207,232,224]],
    [[48,30,30],[255,143,120]], [[36,32,44],[143,179,192]]
  ];
  function grainTile(){ var g=document.createElement("canvas"); g.width=g.height=110; var x=g.getContext("2d"); var id=x.createImageData(110,110), d=id.data; for(var i=0;i<d.length;i+=4){ var v=200+((i*97)%55); d[i]=d[i+1]=d[i+2]=v; d[i+3]=((i*53)%22); } x.putImageData(id,0,0); return g; }
  var GRAIN = grainTile();
  function paint(cv){
    var w=cv.width, h=cv.height, ctx=cv.getContext("2d");
    var seed=parseInt(cv.getAttribute("data-seed")||"1",10), rnd=mulberry(seed*2654435761);
    var dark = root.getAttribute("data-theme")==="dark" || (!root.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
    var pal=PALS[seed % PALS.length], deep=pal[0].slice(), warm=pal[1].slice();
    if(dark) deep=deep.map(function(c){ return Math.max(8,c*0.6); });
    var rgb=function(a,al){ return "rgba("+(a[0]|0)+","+(a[1]|0)+","+(a[2]|0)+","+(al==null?1:al)+")"; };
    var g=ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,rgb(deep)); g.addColorStop(1,rgb(warm.map(function(c){return c*0.68;})));
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation="lighter";
    var blooms=3+Math.floor(rnd()*3);
    for(var b=0;b<blooms;b++){ var cx=rnd()*w, cy=rnd()*h*0.9, r=(0.3+rnd()*0.5)*Math.max(w,h);
      var rg=ctx.createRadialGradient(cx,cy,0,cx,cy,r); var tint=b%2?warm:warm.map(function(c){return Math.min(255,c*1.14);});
      rg.addColorStop(0,rgb(tint,0.28+rnd()*0.2)); rg.addColorStop(1,rgb(tint,0)); ctx.fillStyle=rg; ctx.fillRect(0,0,w,h); }
    ctx.globalCompositeOperation="source-over";
    var vg=ctx.createRadialGradient(w/2,h*0.44,Math.min(w,h)*0.2,w/2,h*0.5,Math.max(w,h)*0.72);
    vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,"rgba(0,0,0,0.4)"); ctx.fillStyle=vg; ctx.fillRect(0,0,w,h);
    var p=ctx.createPattern(GRAIN,"repeat"); ctx.globalAlpha=0.5; ctx.fillStyle=p; ctx.fillRect(0,0,w,h); ctx.globalAlpha=1;
  }
  function sizeFill(cv){ var r=cv.getBoundingClientRect(), dpr=Math.min(devicePixelRatio||1,2); cv.width=Math.max(2,Math.floor(r.width*dpr)); cv.height=Math.max(2,Math.floor(r.height*dpr)); }
  function paintAll(){
    document.querySelectorAll("canvas[data-art='fill']").forEach(function(cv){ sizeFill(cv); paint(cv); });
    document.querySelectorAll("canvas[data-art='fixed']").forEach(paint);
  }

  /* ---- Gallery build (from data-gallery spec on the mount) ---- */
  function buildGallery(){
    var gal = document.getElementById("gallery"); if(!gal) return;
    var spec = (gal.getAttribute("data-items")||"").split(",").map(function(s){return s.trim();}).filter(Boolean);
    // format: cat:w:h  e.g. families:3:4
    var labels = {families:"Families",newborn:"Maternity & Newborn",seniors:"Seniors",weddings:"Weddings",engagements:"Engagements",headshots:"Headshots",sports:"Sports & Fitness",children:"Children"};
    spec.forEach(function(item,i){
      var parts=item.split(":"), cat=parts[0], W=520, H=Math.round(W*(parseInt(parts[2],10)||4)/(parseInt(parts[1],10)||3));
      var fig=document.createElement("figure"); fig.setAttribute("data-cat",cat);
      var cv=document.createElement("canvas"); cv.width=W; cv.height=H; cv.setAttribute("data-art","fixed"); cv.setAttribute("data-seed",String(i*7+5)); cv.setAttribute("role","img"); cv.setAttribute("aria-label",(labels[cat]||cat)+" photograph");
      var tag=document.createElement("span"); tag.className="tag"; tag.textContent=labels[cat]||cat;
      fig.appendChild(tag); fig.appendChild(cv); gal.appendChild(fig);
    });
  }

  /* ---- Filters ---- */
  function initFilters(){
    var bar=document.querySelector("[data-filters]"); if(!bar) return;
    bar.addEventListener("click",function(e){ var b=e.target.closest(".fbtn"); if(!b) return;
      bar.querySelectorAll(".fbtn").forEach(function(x){x.classList.remove("active");}); b.classList.add("active");
      var f=b.getAttribute("data-filter");
      document.querySelectorAll("#gallery figure").forEach(function(fig){ fig.classList.toggle("hide", !(f==="all"||fig.getAttribute("data-cat")===f)); });
    });
  }

  /* ---- Lightbox ---- */
  function initLightbox(){
    var gal=document.querySelector("[data-lightbox]"); if(!gal) return;
    var lb=document.createElement("div"); lb.className="lb";
    lb.innerHTML='<button class="x" aria-label="Close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><button class="prev" aria-label="Previous"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><img alt="Enlarged photograph"><button class="next" aria-label="Next"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></button>';
    document.body.appendChild(lb);
    var img=lb.querySelector("img"), idx=0;
    function vis(){ return [].slice.call(gal.querySelectorAll("figure")).filter(function(f){return !f.classList.contains("hide");}); }
    function show(list,i){ idx=(i+list.length)%list.length; var m=list[idx].querySelector("canvas,img"); img.src=m.tagName==="CANVAS"?m.toDataURL("image/png"):(m.getAttribute("data-full")||m.src); }
    gal.addEventListener("click",function(e){ var fig=e.target.closest("figure"); if(!fig) return; var list=vis(); lb.classList.add("open"); document.body.style.overflow="hidden"; show(list,list.indexOf(fig)); });
    function close(){ lb.classList.remove("open"); document.body.style.overflow=""; }
    lb.querySelector(".x").addEventListener("click",close);
    lb.querySelector(".prev").addEventListener("click",function(){show(vis(),idx-1);});
    lb.querySelector(".next").addEventListener("click",function(){show(vis(),idx+1);});
    lb.addEventListener("click",function(e){ if(e.target===lb) close(); });
    document.addEventListener("keydown",function(e){ if(!lb.classList.contains("open"))return; if(e.key==="Escape")close(); if(e.key==="ArrowLeft")show(vis(),idx-1); if(e.key==="ArrowRight")show(vis(),idx+1); });
  }

  /* ---- Header / nav / theme ---- */
  function initHeader(){
    var hd=document.querySelector("[data-header]"); if(!hd) return;
    var page=document.body.getAttribute("data-page");
    var link=hd.querySelector('[data-nav="'+page+'"]'); if(link) link.classList.add("active");
    if(document.body.hasAttribute("data-hero-header")) hd.classList.add("on-dark");
    function onScroll(){ hd.classList.toggle("scrolled", scrollY>20); }
    onScroll(); addEventListener("scroll",onScroll,{passive:true});
    var burger=hd.querySelector("[data-burger]");
    if(burger){ burger.addEventListener("click",function(){ var o=document.body.classList.toggle("menu"); burger.setAttribute("aria-expanded",String(o)); });
      hd.querySelectorAll(".nav-links a").forEach(function(a){ a.addEventListener("click",function(){ document.body.classList.remove("menu"); burger.setAttribute("aria-expanded","false"); }); }); }
    var tt=hd.querySelector("[data-theme-toggle]");
    if(tt) tt.addEventListener("click",function(){ var order=["system","light","dark"], next=order[(order.indexOf(curTheme())+1)%3]; localStorage.setItem("nf-theme",next); applyTheme(next); paintAll(); });
  }

  /* ---- FAQ ---- */
  function initFaq(){ document.querySelectorAll(".fitem").forEach(function(it){ var q=it.querySelector(".fq"), a=it.querySelector(".fa"); if(!q||!a) return; q.addEventListener("click",function(){ var o=it.classList.toggle("open"); a.style.maxHeight=o?a.scrollHeight+"px":"0px"; }); }); }

  /* ---- Reveal ---- */
  var revObs;
  function initReveal(){ if(!("IntersectionObserver" in window)){ document.querySelectorAll(".rev").forEach(function(el){el.classList.add("in");}); return; }
    revObs=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("in"); revObs.unobserve(en.target); } }); },{threshold:0.12,rootMargin:"0px 0px -8% 0px"});
    document.querySelectorAll(".rev").forEach(function(el){ revObs.observe(el); }); }
  function reobserveReveal(){ if(revObs) document.querySelectorAll(".rev:not(.in)").forEach(function(el){ revObs.observe(el); }); }

  /* ---- Footer year ---- */
  function initYear(){ document.querySelectorAll("[data-year]").forEach(function(el){ el.textContent=new Date().getFullYear(); }); }

  /* ---- Contact form ---- */
  function initForm(){
    var f=document.querySelector("[data-contact-form]"); if(!f) return;
    var st=f.querySelector(".fstatus");
    f.addEventListener("submit",async function(e){ e.preventDefault();
      var btn=f.querySelector('button[type="submit"]'), original=btn.textContent;
      var data=Object.fromEntries(new FormData(f).entries());
      if(data._gotcha){ return; }
      st.className="fstatus"; btn.disabled=true; btn.textContent="Sending…";
      try {
        var r=await fetch("/api/contact",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
        var body=await r.json().catch(function(){return {};});
        if(r.ok){ f.reset(); st.textContent="Thank you — your note is on its way to Nikki. You'll hear back soon."; st.className="fstatus show ok"; }
        else { st.textContent=body.error||"Something went wrong. Please email nicolefieldsphotos@gmail.com."; st.className="fstatus show err"; }
      } catch(err){ st.textContent="Network hiccup — please try again, or email nicolefieldsphotos@gmail.com."; st.className="fstatus show err"; }
      finally { btn.disabled=false; btn.textContent=original; }
    });
  }

  /* ---- Ambient music (Web Audio, synthesized — no file, off by default) ---- */
  function initSound(){
    var btn=document.querySelector("[data-sound]"); if(!btn) return;
    var lbl=btn.querySelector("[data-sound-label]");
    var ctx, master, amp, started=false, playing=false;
    function build(){
      var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false;
      ctx=new AC();
      master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination);
      amp=ctx.createGain(); amp.gain.value=1; amp.connect(master);
      var filter=ctx.createBiquadFilter(); filter.type="lowpass"; filter.frequency.value=820; filter.Q.value=0.7; filter.connect(amp);
      [110.00,164.81,220.00,277.18,329.63].forEach(function(f,i){
        var o=ctx.createOscillator(); o.type=(i%2)?"sine":"triangle"; o.frequency.value=f; o.detune.value=(i-2)*3.5;
        var g=ctx.createGain(); g.gain.value=0.13/(1+i*0.18);
        o.connect(g); g.connect(filter); o.start();
      });
      var lfo=ctx.createOscillator(); lfo.frequency.value=0.045; var lg=ctx.createGain(); lg.gain.value=300; lfo.connect(lg); lg.connect(filter.frequency); lfo.start();
      var tr=ctx.createOscillator(); tr.frequency.value=0.07; var tg=ctx.createGain(); tg.gain.value=0.06; tr.connect(tg); tg.connect(amp.gain); tr.start();
      started=true; return true;
    }
    function on(){ if(!started && !build()) return; if(ctx.state==="suspended") ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.11, ctx.currentTime+2.2);
      playing=true; btn.classList.add("on"); btn.setAttribute("aria-pressed","true"); if(lbl) lbl.textContent="Music on"; try{localStorage.setItem("nf-sound","on");}catch(e){} }
    function off(){ if(started){ master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime); master.gain.linearRampToValueAtTime(0, ctx.currentTime+1.0);}
      playing=false; btn.classList.remove("on"); btn.setAttribute("aria-pressed","false"); if(lbl) lbl.textContent="Play music"; try{localStorage.setItem("nf-sound","off");}catch(e){} }
    btn.addEventListener("click",function(){ playing?off():on(); });
    var pref; try{ pref=localStorage.getItem("nf-sound")==="on"; }catch(e){ pref=false; }
    if(pref){ var kick=function(){ on(); window.removeEventListener("pointerdown",kick); window.removeEventListener("keydown",kick); }; window.addEventListener("pointerdown",kick); window.addEventListener("keydown",kick); }
  }

  /* ---- Content source: owner edits (via /api/content) with static fallback ---- */
  async function loadContent(){
    try { var r=await fetch("/api/content",{cache:"no-store"}); if(r.ok){ var j=await r.json(); if(j && j.data) return j.data; } } catch(e){}
    try { var r2=await fetch("business.json"); return await r2.json(); } catch(e){ return null; }
  }

  /* ---- Boot ---- */
  document.addEventListener("DOMContentLoaded", async function(){
    await loadIncludes();
    var data=await loadContent();
    if(data){ bindFields(data); gateDisplay(data); renderServices(data); }
    buildGallery();
    initHeader(); initFilters(); initLightbox(); initFaq(); initForm(); initYear(); initSound();
    paintAll(); initReveal();
    var rt; addEventListener("resize",function(){ clearTimeout(rt); rt=setTimeout(function(){ document.querySelectorAll("canvas[data-art='fill']").forEach(function(cv){ sizeFill(cv); paint(cv); }); },180); });
    root.dataset.ready="true";
  });
})();
