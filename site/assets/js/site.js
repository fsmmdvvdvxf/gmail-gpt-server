/* =============================================================
   Nicole Fields Photography — site.js
   Client-side runtime: partial includes, nav state, theme,
   scroll reveal, filterable gallery, lightbox, FAQ, form.
   No dependencies.
   ============================================================= */
(function () {
  "use strict";

  /* ---------- Theme (set ASAP to avoid flash; also inlined in <head>) ---------- */
  function applyTheme(t) {
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  function currentTheme() {
    return localStorage.getItem("nf-theme") || "system";
  }
  applyTheme(currentTheme());

  /* ---------- Partial includes ---------- */
  async function loadPartials() {
    const slots = document.querySelectorAll("[data-include]");
    await Promise.all([...slots].map(async (slot) => {
      const url = slot.getAttribute("data-include");
      try {
        const res = await fetch(url);
        if (res.ok) slot.innerHTML = await res.text();
      } catch (e) { /* file:// or offline — leave empty */ }
    }));
  }

  /* ---------- Header behaviour ---------- */
  function initHeader() {
    const header = document.querySelector("[data-header]");
    if (!header) return;

    // Mark active nav link
    const page = document.body.getAttribute("data-page");
    const link = header.querySelector('[data-nav="' + page + '"]');
    if (link) link.classList.add("active");

    // Transparent-over-hero mode
    if (document.body.hasAttribute("data-hero-header")) header.classList.add("on-dark");
    else header.classList.add("solid");

    const onScroll = () => {
      if (window.scrollY > 20) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Mobile menu
    const toggle = header.querySelector("[data-nav-toggle]");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const open = document.body.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      header.querySelectorAll(".nav-links a").forEach((a) =>
        a.addEventListener("click", () => document.body.classList.remove("nav-open"))
      );
    }

    // Theme toggle: system -> light -> dark -> system
    const tt = header.querySelector("[data-theme-toggle]");
    if (tt) {
      tt.addEventListener("click", () => {
        const order = ["system", "light", "dark"];
        const next = order[(order.indexOf(currentTheme()) + 1) % order.length];
        localStorage.setItem("nf-theme", next);
        applyTheme(next);
      });
    }
  }

  /* ---------- Footer year ---------- */
  function initFooter() {
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Gallery filters ---------- */
  function initFilters() {
    const bar = document.querySelector("[data-filters]");
    if (!bar) return;
    const items = document.querySelectorAll("[data-cat]");
    bar.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        bar.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const f = btn.getAttribute("data-filter");
        items.forEach((it) => {
          const show = f === "all" || it.getAttribute("data-cat") === f;
          it.classList.toggle("hide", !show);
        });
      });
    });
  }

  /* ---------- Lightbox ---------- */
  function initLightbox() {
    const triggers = [...document.querySelectorAll("[data-lightbox] img")];
    if (!triggers.length) return;

    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML =
      '<button class="lb-close" aria-label="Close">' + icon("close") + "</button>" +
      '<button class="lb-nav lb-prev" aria-label="Previous">' + icon("prev") + "</button>" +
      '<img alt="">' +
      '<button class="lb-nav lb-next" aria-label="Next">' + icon("next") + "</button>";
    document.body.appendChild(lb);

    const img = lb.querySelector("img");
    let idx = 0;
    const visible = () => triggers.filter((t) => {
      const fig = t.closest("[data-cat]");
      return !fig || !fig.classList.contains("hide");
    });

    function show(list, i) {
      idx = (i + list.length) % list.length;
      img.src = list[idx].getAttribute("data-full") || list[idx].src;
      img.alt = list[idx].alt || "";
    }
    function open(t) {
      const list = visible();
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
      show(list, list.indexOf(t));
    }
    function close() { lb.classList.remove("open"); document.body.style.overflow = ""; }

    triggers.forEach((t) => t.addEventListener("click", () => open(t)));
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", () => show(visible(), idx - 1));
    lb.querySelector(".lb-next").addEventListener("click", () => show(visible(), idx + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(visible(), idx - 1);
      if (e.key === "ArrowRight") show(visible(), idx + 1);
    });
  }

  function icon(name) {
    const p = {
      close: '<path d="M6 6l12 12M18 6L6 18"/>',
      prev: '<path d="M15 5l-7 7 7 7"/>',
      next: '<path d="M9 5l7 7-7 7"/>'
    }[name];
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + "</svg>";
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    document.querySelectorAll(".faq-item").forEach((item) => {
      const q = item.querySelector(".faq-q");
      const a = item.querySelector(".faq-a");
      if (!q || !a) return;
      q.addEventListener("click", () => {
        const open = item.classList.toggle("open");
        a.style.maxHeight = open ? a.scrollHeight + "px" : "0px";
      });
    });
  }

  /* ---------- Contact form ---------- */
  function initForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;
    const status = form.querySelector(".form-status");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const data = Object.fromEntries(new FormData(form).entries());
      status.className = "form-status";
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = "Sending…";
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok) {
          form.reset();
          status.textContent = "Thank you — your message is on its way. I'll be in touch within 48 hours.";
          status.className = "form-status show ok";
        } else {
          status.textContent = body.error || "Something went wrong. Please email hello@nicolefieldsphotography.net.";
          status.className = "form-status show err";
        }
      } catch (err) {
        status.textContent = "Network hiccup. Please try again, or email hello@nicolefieldsphotography.net.";
        status.className = "form-status show err";
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", async () => {
    await loadPartials();
    initHeader();
    initFooter();
    initReveal();
    initFilters();
    initLightbox();
    initFaq();
    initForm();
  });
})();
