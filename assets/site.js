/* Helping Us Help Her concept: shared behaviour. Progressive: the page reads fully without any of this. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, body = doc.body;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* ---------- Scroll reveals: IntersectionObserver, no library dependency ---------- */
  function showEl(el, instant) {
    if (el.classList.contains("rv")) {
      el.style.transition = (reduce || instant) ? "none" : "opacity 900ms cubic-bezier(0.23,1,0.32,1), transform 900ms cubic-bezier(0.23,1,0.32,1)";
      el.style.transitionDelay = instant ? "0s" : (parseFloat(el.dataset.delay) || 0) + "s";
      el.style.opacity = 1; el.style.transform = "none";
    }
    if (el.classList.contains("rv-img")) el.classList.add("is-in");
  }
  function showAll(instant) { $$(".rv, .rv-img").forEach(function (el) { showEl(el, instant); }); }
  /* A tab that loads in the background never animates. When it comes forward, everything is simply there. */
  doc.addEventListener("visibilitychange", function () { if (!doc.hidden) { showAll(true); finishLoader(true); } });
  var revealsStarted = false;
  function startReveals() {
    if (revealsStarted) return; revealsStarted = true;
    var els = $$(".rv, .rv-img");
    if (reduce || doc.hidden || !("IntersectionObserver" in window)) { els.forEach(function (el) { showEl(el, true); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { showEl(e.target); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    els.forEach(function (el) { io.observe(el); });
    /* Safety net: nothing near the top of the page stays hidden. */
    setTimeout(function () { els.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight * 1.2) showEl(el); }); }, 2500);
  }

  /* ---------- Preloader (home only) ---------- */
  var loader = $("#loader");
  function finishLoader(instant) {
    if (!loader || loader.dataset.done) return;
    loader.dataset.done = "1";
    loader.setAttribute("aria-hidden", "true");
    var done = function () { if (loader.parentNode) loader.parentNode.removeChild(loader); startReveals(); };
    if (instant || reduce || doc.hidden) { done(); return; }
    loader.style.transition = "clip-path 550ms cubic-bezier(0.77,0,0.175,1)";
    loader.style.clipPath = "inset(0 0 100% 0)";
    setTimeout(startReveals, 250); /* the hero wakes while the wipe is still clearing */
    setTimeout(done, 600);
  }
  if (loader) {
    var seen = false;
    try { seen = sessionStorage.getItem("huhh-intro") === "1"; sessionStorage.setItem("huhh-intro", "1"); } catch (e) {}
    var frames = $$(".loader__frames img", loader), mark = $(".loader__mark", loader);
    if (seen || reduce || doc.hidden || !hasGsap) { finishLoader(true); }
    else {
      frames.forEach(function (f) { if (f.dataset.src) f.src = f.dataset.src; });
      var tl = gsap.timeline({ onComplete: finishLoader });
      frames.forEach(function (f, i) { tl.set(f, { opacity: 1 }, 0.1 * i).set(f, { opacity: 0 }, 0.1 * i + 0.1); });
      tl.to(mark, { opacity: 1, scale: 1, duration: 0.4, ease: "expo.out" }, 0.08).to({}, { duration: 0.15 });
      setTimeout(finishLoader, 2200); /* never trap the visitor */
    }
  } else { startReveals(); }

  /* ---------- Navigation ---------- */
  var nav = $(".nav"), burger = $(".nav__burger"), menu = $("#menu"), lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    if (nav) {
      nav.classList.toggle("is-solid", y > 40);
      if (y > 420 && y > lastY + 6 && !root.classList.contains("menu-open")) nav.classList.add("is-hidden");
      else if (y < lastY - 6 || y < 420) nav.classList.remove("is-hidden");
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle("is-open", open); root.classList.toggle("menu-open", open);
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    $$("main, footer").forEach(function (el) { if (open) el.setAttribute("inert", ""); else el.removeAttribute("inert"); });
    if (open) { nav.classList.remove("is-hidden"); var first = $("a", menu); if (first) first.focus(); } else if (burger) burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setMenu(!menu.classList.contains("is-open")); });
  if (menu) { $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); }); }
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu && menu.classList.contains("is-open")) setMenu(false); });

  /* ---------- Pinned story band (desktop) ---------- */
  if (hasGsap && !reduce) {
    ScrollTrigger.matchMedia({
      "(min-width: 900px)": function () {
        $$("[data-pin]").forEach(function (sec) {
          var title = $(".pin__title", sec), items = $(".pin__items", sec);
          if (!title || !items) return;
          ScrollTrigger.create({ trigger: title, start: "top 120px", end: function () { return "+=" + Math.max(0, items.offsetHeight - title.offsetHeight); }, pin: title, pinSpacing: false, invalidateOnRefresh: true });
        });
        /* Card stacking: the covered card settles back and dims a touch. Desktop only; phones read the cards flat. */
        $$(".stack").forEach(function (stack) {
          var cards = $$(".stack__card", stack);
          cards.forEach(function (card, i) {
            if (i === cards.length - 1) return;
            gsap.fromTo(card, { scale: 1, filter: "brightness(1)" }, { scale: 0.95, filter: "brightness(0.9)", ease: "none",
              scrollTrigger: { trigger: cards[i + 1], start: "top 60%", end: "top 15%", scrub: true } });
          });
        });
      }
    });
  }

  /* ---------- Counters ---------- */
  $$("[data-count]").forEach(function (el) {
    var target = parseFloat(el.dataset.count), prefix = el.dataset.prefix || "", suffix = el.dataset.suffix || "";
    function render(v) { el.textContent = prefix + Math.round(v).toLocaleString("en-US") + suffix; }
    if (!hasGsap || reduce || !("IntersectionObserver" in window)) { render(target); return; }
    render(0);
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return; io.disconnect();
      var o = { v: 0 }; gsap.to(o, { v: target, duration: 1.6, ease: "expo.out", onUpdate: function () { render(o.v); } });
    }, { threshold: 0.5 });
    io.observe(el);
  });

  /* ---------- Modules accordion ---------- */
  $$(".acc").forEach(function (acc) {
    var items = $$(".acc__item", acc);
    function open(target) {
      items.forEach(function (it) {
        var on = it === target;
        it.classList.toggle("is-open", on);
        var b = $(".acc__head", it), bd = $(".acc__body", it);
        if (b) b.setAttribute("aria-expanded", on ? "true" : "false");
        if (bd) bd.setAttribute("aria-hidden", on ? "false" : "true");
      });
    }
    items.forEach(function (it, i) {
      var head = $(".acc__head", it), bd = $(".acc__body", it);
      if (bd && !bd.id) bd.id = "acc-body-" + i; if (head && bd) head.setAttribute("aria-controls", bd.id);
      head.addEventListener("click", function () { open(it.classList.contains("is-open") && window.innerWidth < 900 ? null : it); });
      head.addEventListener("focus", function () { if (window.innerWidth >= 900) open(it); });
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        it.addEventListener("mouseenter", function () { if (window.innerWidth >= 900) open(it); });
      }
    });
    open(items[0]);
  });

  /* ---------- Voices carousel (phones and tablets; wide screens show all three) ---------- */
  $$(".voices").forEach(function (v) {
    var track = $(".voices__track", v), prev = $("[data-prev]", v), next = $("[data-next]", v), count = $("[data-count-of]", v);
    var cards = $$(".voice", track);
    function index() { var c = cards[0]; if (!c) return 0; var w = c.getBoundingClientRect().width + 24; return Math.round(track.scrollLeft / w); }
    function update() {
      var i = index();
      if (count) count.textContent = (i + 1) + " / " + cards.length;
      if (prev) prev.disabled = i <= 0;
      if (next) next.disabled = i >= cards.length - 1;
    }
    function step(dir) {
      var card = cards[0]; if (!card) return;
      var w = card.getBoundingClientRect().width + 24;
      track.scrollBy({ left: dir * w, behavior: reduce ? "auto" : "smooth" });
    }
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
    track.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); });
    track.addEventListener("scroll", function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update); update();
  });

  /* ---------- Demo forms ---------- */
  function errorFor(f) {
    if (f.tagName === "SELECT") return "Please choose one.";
    if (f.type === "email") return "Please enter a valid email address.";
    return "Please fill this in.";
  }
  function setError(f, msg) {
    var field = f.closest(".field"), err = field && $(".field__err", field);
    if (msg) {
      f.setAttribute("aria-invalid", "true");
      if (field && !err) { err = doc.createElement("p"); err.className = "field__err"; err.id = f.id + "-err"; field.appendChild(err); }
      if (err) { err.textContent = msg; f.setAttribute("aria-describedby", err.id); }
    } else {
      f.removeAttribute("aria-invalid"); f.removeAttribute("aria-describedby");
      if (err) err.remove();
    }
  }
  $$("form[data-demo]").forEach(function (form) {
    $$("[required]", form).forEach(function (f) { var field = f.closest(".field"); if (field) field.classList.add("is-required"); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var hp = $(".hp input", form); if (hp && hp.value) return;
      var bad = [];
      $$("[required]", form).forEach(function (f) {
        var invalid = !f.value.trim() || (f.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
        setError(f, invalid ? errorFor(f) : ""); if (invalid) bad.push(f);
      });
      if (bad.length) { bad[0].focus(); return; }
      var name = $("[name=name]", form), who = $(".form__done [data-name]", form);
      if (name && who) who.textContent = name.value.trim().split(" ")[0] || "";
      form.classList.add("is-done");
      var done = $(".form__done", form); if (done) { done.setAttribute("tabindex", "-1"); done.focus(); }
    });
    $$("[required]", form).forEach(function (f) { f.addEventListener("input", function () { setError(f, ""); }); f.addEventListener("change", function () { setError(f, ""); }); });
  });

  /* ---------- Sponsor tier prefill ---------- */
  function syncChips(value) { $$(".designate [data-designate]").forEach(function (s) { s.setAttribute("aria-pressed", s.dataset.designate === value ? "true" : "false"); }); }
  $$("[data-tier]").forEach(function (b) {
    b.addEventListener("click", function () {
      var sel = $("#interest"); if (sel) { sel.value = b.dataset.tier; setError(sel, ""); }
      syncChips(b.dataset.tier);
      var target = $("#give"); if (target) target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      if (!coarse) setTimeout(function () { var n = $("#inquire [name=name]"); if (n) n.focus({ preventScroll: true }); }, reduce ? 0 : 700);
    });
  });
  $$(".designate [data-designate]").forEach(function (s) {
    s.addEventListener("click", function () { syncChips(s.dataset.designate); var sel = $("#interest"); if (sel) { sel.value = s.dataset.designate; setError(sel, ""); } });
  });
  var sel = $("#interest");
  if (sel) sel.addEventListener("change", function () { syncChips(sel.value); });

  /* ---------- Givebutter: load the giving form only when the give section is near ---------- */
  var gbHost = $("givebutter-widget");
  if (gbHost) {
    var loadGb = function () {
      if (doc.getElementById("gb-script")) return;
      var s = doc.createElement("script"); s.id = "gb-script"; s.async = true;
      s.src = "https://widgets.givebutter.com/latest.umd.cjs?acct=GDTPx1yHlpTT6v1U&p=huhh-concept"; doc.body.appendChild(s);
    };
    if ("IntersectionObserver" in window) {
      var gio = new IntersectionObserver(function (entries) { if (entries[0].isIntersecting) { gio.disconnect(); loadGb(); } }, { rootMargin: "1200px 0px" });
      gio.observe(gbHost);
    } else loadGb();
    if (location.hash === "#give") loadGb();
  }

  /* ---------- Deep links land where they should once layout settles ---------- */
  function settle() {
    if (hasGsap) { try { ScrollTrigger.refresh(); } catch (e) {} }
    if (location.hash) { var t = $(location.hash); if (t) { t.scrollIntoView({ block: "start" }); lastY = window.scrollY; if (nav) nav.classList.remove("is-hidden"); } }
  }
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { setTimeout(settle, 60); });
  window.addEventListener("load", function () { setTimeout(settle, 200); });
})();
