/* ═════════════════════════════════════════════════════════════════════════════
   THE LOUPE  ·  the signature move
   A real object you hold in front of the wall, not a replaced cursor. It stays
   where you put it on screen and the wall scrolls underneath it, so the same
   lens shows you a different print as you come down the page.

   It works by holding a second copy of the wall inside the lens and moving that
   copy so the point beneath the lens centre lands at the lens centre, scaled.
   The copy must keep the original's exact layout or the magnified view slides
   out of register, which is why nothing inside it is ever display:none.
   ═════════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var Z = 2.5;                                   // magnification
  var stage = document.getElementById("salon-stage");
  var salon = document.getElementById("salon");
  var lens  = document.getElementById("loupe");
  var inner = document.getElementById("loupe-inner");
  if (!stage || !lens || !salon) return;

  var clone = salon.cloneNode(true);
  clone.removeAttribute("id");
  clone.removeAttribute("data-objects");
  clone.setAttribute("aria-hidden", "true");
  /* the clone is not driven by the engine, so strip the scroll wipe or it
     renders permanently clipped at whatever state it was copied in */
  Array.prototype.forEach.call(clone.querySelectorAll("[data-sc-reveal]"), function (el) {
    el.removeAttribute("data-sc-reveal");
    el.removeAttribute("data-sc-reveal-at");
    el.style.clipPath = "none";
    el.style.opacity = "1";
    el.style.transform = "none";
  });
  /* nothing in the clone is focusable or announced twice */
  Array.prototype.forEach.call(clone.querySelectorAll("a,button,input"), function (el) {
    el.setAttribute("tabindex", "-1");
  });
  inner.appendChild(clone);

  var cx = 0, cy = 0;          // lens centre, in VIEWPORT coordinates
  // visible starts as null, not false, so the very first setVisible() call
  // actually applies the class instead of being swallowed by the guard
  var r = 0, placed = false, dragging = false, visible = null;

  function measure() {
    r = lens.offsetWidth / 2;
    var w = salon.offsetWidth;
    clone.style.width = w + "px";
    inner.style.width = w + "px";
  }

  function clampToViewport() {
    cx = Math.max(r, Math.min(window.innerWidth  - r, cx));
    cy = Math.max(r, Math.min(window.innerHeight - r, cy));
  }

  /* Map the lens centre into the wall's own coordinates and offset the copy so
     that point lands under the middle of the glass. */
  function place() {
    lens.style.left = (cx - r) + "px";
    lens.style.top  = (cy - r) + "px";
    var box = salon.getBoundingClientRect();
    var px = cx - box.left, py = cy - box.top;
    inner.style.transform =
      "translate(" + (r - px * Z) + "px," + (r - py * Z) + "px) scale(" + Z + ")";
  }

  /* Park it on an actual print. A blind percentage of the wall lands the glass
     in a gutter between two photographs about as often as not, and an empty
     lens is the one state that makes the whole move look broken. */
  function park() {
    measure();
    var box = salon.getBoundingClientRect();
    var top = Math.max(box.top, 0);
    var bottom = Math.min(box.bottom, window.innerHeight);
    var midY = bottom > top ? (top + bottom) / 2 : window.innerHeight * 0.46;

    var best = null, bestD = Infinity;
    Array.prototype.forEach.call(salon.querySelectorAll(".object__frame img"), function (img) {
      var b = img.getBoundingClientRect();
      if (!b.width) return;
      var d = Math.abs((b.top + b.bottom) / 2 - midY);
      if (d < bestD) { bestD = d; best = b; }
    });

    if (best) {
      cx = (best.left + best.right) / 2;
      cy = (best.top + best.bottom) / 2;
    } else {
      cx = box.left + box.width * 0.32;
      cy = midY;
    }
    clampToViewport();
    place();
  }

  /* ── only on screen while the salon wall is ─────────────────────────────── */
  function setVisible(v) {
    if (v === visible) return;
    visible = v;
    lens.classList.toggle("is-off", !v);
    lens.setAttribute("aria-hidden", String(!v));
    lens.tabIndex = v ? 0 : -1;
    if (v && !placed) park();
  }
  if ("IntersectionObserver" in window) {
    /* A ratio threshold is the wrong tool here: the wall is taller than the
       viewport, so its intersection ratio never gets near 1 and a threshold of
       even 0.05 means a hundred pixels of wall before the lens appears. Shrink
       the root instead and fire on any intersection at all, which behaves the
       same whatever height the wall ends up. */
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { setVisible(e.isIntersecting); });
    }, { threshold: 0, rootMargin: "-12% 0px -12% 0px" }).observe(stage);
  } else {
    setVisible(true);
  }

  /* ── drag, pointer and touch alike ───────────────────────────────────────── */
  lens.addEventListener("pointerdown", function (e) {
    dragging = true; placed = true;
    lens.classList.add("is-used");
    try { lens.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  lens.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    cx = e.clientX; cy = e.clientY;
    clampToViewport(); place();
  });
  function drop(e) {
    if (!dragging) return;
    dragging = false;
    try { lens.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  lens.addEventListener("pointerup", drop);
  lens.addEventListener("pointercancel", drop);

  /* ── keyboard, so the move is not mouse-only ─────────────────────────────── */
  lens.addEventListener("keydown", function (e) {
    var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d) return;
    e.preventDefault();
    placed = true;
    lens.classList.add("is-used");
    var step = e.shiftKey ? 60 : 18;
    cx += d[0] * step; cy += d[1] * step;
    clampToViewport(); place();
  });

  /* the wall moves under the glass, so the view is recomputed as she scrolls */
  window.addEventListener("scroll", function () { if (visible) place(); }, { passive: true });
  window.addEventListener("resize", function () { measure(); clampToViewport(); place(); }, { passive: true });
  window.addEventListener("fsx:open", park);
  window.addEventListener("fsx:view", function () { placed = false; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); place(); });
  Array.prototype.forEach.call(salon.querySelectorAll("img"), function (img) {
    if (!img.complete) img.addEventListener("load", function () { measure(); place(); }, { once: true });
  });

  park();
  setVisible(false);
})();
