/* Helping Us Help Her concept: shared behaviour. Progressive: the page reads fully without any of this. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, body = doc.body;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* ---------- Reveal everything (fallback when GSAP is missing or motion is reduced) ---------- */
  function showAll() {
    $$(".rv").forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
    $$(".rv-img").forEach(function (el) { el.style.clipPath = "none"; var im = $("img", el); if (im) im.style.transform = "none"; });
  }

  /* ---------- Preloader (home only) ---------- */
  var loader = $("#loader");
  function finishLoader() {
    if (!loader) return;
    loader.setAttribute("aria-hidden", "true");
    if (reduce || !hasGsap) { loader.style.transition = "opacity 240ms ease"; loader.style.opacity = 0; setTimeout(function () { loader.remove(); }, 260); return; }
    gsap.to(loader, { clipPath: "inset(0 0 100% 0)", duration: 0.7, ease: "expo.inOut", onComplete: function () { loader.remove(); } });
  }
  if (loader) {
    var seen = false;
    try { seen = sessionStorage.getItem("huhh-intro") === "1"; sessionStorage.setItem("huhh-intro", "1"); } catch (e) {}
    var frames = $$(".loader__frames img", loader), mark = $(".loader__mark", loader);
    if (seen || reduce || !hasGsap) { finishLoader(); }
    else {
      var tl = gsap.timeline({ onComplete: finishLoader });
      frames.forEach(function (f, i) { tl.set(f, { opacity: 1 }, 0.12 * i).set(f, { opacity: 0 }, 0.12 * i + 0.12); });
      tl.to(mark, { opacity: 1, scale: 1, duration: 0.5, ease: "expo.out" }, 0.1).to({}, { duration: 0.45 });
    }
    setTimeout(function () { if (doc.contains(loader)) finishLoader(); }, 2200); /* never trap the visitor */
  }

  /* ---------- Navigation ---------- */
  var nav = $(".nav"), burger = $(".nav__burger"), menu = $("#menu"), lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    if (nav) {
      nav.classList.toggle("is-solid", y > 40);
      if (y > 420 && y > lastY + 6 && !body.classList.contains("menu-open")) nav.classList.add("is-hidden");
      else if (y < lastY - 6 || y < 420) nav.classList.remove("is-hidden");
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle("is-open", open); body.classList.toggle("menu-open", open);
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) { var first = $("a", menu); if (first) first.focus(); } else if (burger) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setMenu(!menu.classList.contains("is-open")); });
  if (menu) { $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); }); }
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu && menu.classList.contains("is-open")) setMenu(false); });

  /* ---------- Scroll reveals ---------- */
  if (!hasGsap || reduce) { showAll(); }
  else {
    $$(".rv").forEach(function (el) {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", delay: (parseFloat(el.dataset.delay) || 0),
        scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    });
    $$(".rv-img").forEach(function (el) {
      var im = $("img", el);
      var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      tl.to(el, { clipPath: "inset(0 0 0% 0)", duration: 1.1, ease: "expo.out" }, 0);
      if (im) tl.to(im, { scale: 1, duration: 1.5, ease: "expo.out" }, 0);
    });
    /* Safety net: anything still hidden after 2.5s shows itself. */
    setTimeout(function () {
      $$(".rv").forEach(function (el) { if (parseFloat(getComputedStyle(el).opacity) < 0.05 && el.getBoundingClientRect().top < window.innerHeight) { el.style.opacity = 1; el.style.transform = "none"; } });
    }, 2500);
  }

  /* ---------- Pinned story band ---------- */
  if (hasGsap && !reduce) {
    ScrollTrigger.matchMedia({
      "(min-width: 900px)": function () {
        $$("[data-pin]").forEach(function (sec) {
          var title = $(".pin__title", sec), items = $(".pin__items", sec);
          if (!title || !items) return;
          ScrollTrigger.create({ trigger: sec, start: "top 96px", end: function () { return "+=" + (items.offsetHeight - title.offsetHeight); }, pin: title, pinSpacing: false, invalidateOnRefresh: true });
        });
      }
    });
  }

  /* ---------- Card stacking (sponsor tiers, programs) ---------- */
  if (hasGsap && !reduce) {
    $$(".stack").forEach(function (stack) {
      var cards = $$(".stack__card", stack);
      cards.forEach(function (card, i) {
        if (i === cards.length - 1) return;
        var next = cards[i + 1];
        gsap.to(card, { scale: 0.94, filter: "brightness(0.82)", ease: "none",
          scrollTrigger: { trigger: next, start: "top 85%", end: "top 20%", scrub: true } });
      });
    });
  }

  /* ---------- Counters ---------- */
  $$("[data-count]").forEach(function (el) {
    var target = parseFloat(el.dataset.count), prefix = el.dataset.prefix || "", suffix = el.dataset.suffix || "";
    function render(v) { el.textContent = prefix + Math.round(v).toLocaleString("en-US") + suffix; }
    if (!hasGsap || reduce) { render(target); return; }
    render(0);
    var o = { v: 0 };
    gsap.to(o, { v: target, duration: 1.6, ease: "expo.out", onUpdate: function () { render(o.v); },
      scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  /* ---------- Modules accordion ---------- */
  $$(".acc").forEach(function (acc) {
    var items = $$(".acc__item", acc);
    function open(target) {
      items.forEach(function (it) {
        var on = it === target;
        it.classList.toggle("is-open", on);
        var b = $(".acc__head", it); if (b) b.setAttribute("aria-expanded", on ? "true" : "false");
      });
    }
    items.forEach(function (it) {
      var head = $(".acc__head", it);
      head.addEventListener("click", function () { open(it.classList.contains("is-open") && window.innerWidth < 900 ? null : it); });
      head.addEventListener("focus", function () { if (window.innerWidth >= 900) open(it); });
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        it.addEventListener("mouseenter", function () { if (window.innerWidth >= 900) open(it); });
      }
    });
    open(items[0]);
  });

  /* ---------- Voices carousel ---------- */
  $$(".voices").forEach(function (v) {
    var track = $(".voices__track", v), prev = $("[data-prev]", v), next = $("[data-next]", v);
    function step(dir) {
      var card = $(".voice", track); if (!card) return;
      var w = card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 24);
      track.scrollBy({ left: dir * w, behavior: reduce ? "auto" : "smooth" });
    }
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
    track.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); });
  });

  /* ---------- Demo forms ---------- */
  $$("form[data-demo]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if ($(".hp input", form) && $(".hp input", form).value) return;
      var bad = $$("[required]", form).filter(function (f) { return !f.value.trim() || (f.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value)); });
      bad.forEach(function (f) { f.setAttribute("aria-invalid", "true"); });
      if (bad.length) { bad[0].focus(); return; }
      var name = $("[name=name]", form), who = $(".form__done [data-name]", form);
      if (name && who) who.textContent = name.value.trim().split(" ")[0] || "";
      form.classList.add("is-done");
      var done = $(".form__done", form); if (done) { done.setAttribute("tabindex", "-1"); done.focus(); }
    });
    $$("[required]", form).forEach(function (f) { f.addEventListener("input", function () { f.removeAttribute("aria-invalid"); }); });
  });

  /* ---------- Sponsor tier prefill ---------- */
  $$("[data-tier]").forEach(function (b) {
    b.addEventListener("click", function () {
      var sel = $("#interest"); if (sel) { sel.value = b.dataset.tier; sel.dispatchEvent(new Event("change")); }
      var strip = $$(".designate [data-designate]"); strip.forEach(function (s) { s.setAttribute("aria-pressed", s.dataset.designate === b.dataset.tier ? "true" : "false"); });
      var target = $("#inquire"); if (target) { target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
      setTimeout(function () { var n = $("#inquire [name=name]"); if (n) n.focus({ preventScroll: true }); }, reduce ? 0 : 600);
    });
  });
  $$(".designate [data-designate]").forEach(function (s) {
    s.addEventListener("click", function () {
      $$(".designate [data-designate]").forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
      s.setAttribute("aria-pressed", "true");
      var sel = $("#interest"); if (sel) sel.value = s.dataset.designate;
    });
  });
  var sel = $("#interest");
  if (sel) sel.addEventListener("change", function () { $$(".designate [data-designate]").forEach(function (o) { o.setAttribute("aria-pressed", o.dataset.designate === sel.value ? "true" : "false"); }); });

  /* ---------- Deep links land where they should once layout settles ---------- */
  function settle() { if (hasGsap) ScrollTrigger.refresh(); if (location.hash) { var t = $(location.hash); if (t) t.scrollIntoView({ block: "start" }); } }
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { setTimeout(settle, 60); });
  window.addEventListener("load", function () { setTimeout(settle, 200); });
})();
