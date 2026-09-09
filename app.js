/* ═════════════════════════════════════════════════════════════════════════════
   THE COLLECTION
   Rooms are authored markup. Only the objects hanging in them come from data,
   so that swapping a photograph is a one-line edit and the structure of the
   page stays a decision somebody made.
   ═════════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var C = window.CONFIG, PHOTOS = window.PHOTOS;
  var byRoom = function (r) { return PHOTOS.filter(function (p) { return p.room === r; }); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };

  /* The caption is written into the print's bottom margin, in the same shape
     for every photo. Consistency is still what makes this read as one set
     rather than a pile; it is just handwriting now instead of a museum label. */
  function caption(p) {
    if (!p.caption && !p.when) return "";
    return '<div class="cap">' +
      (p.caption ? '<p class="cap__text">' + esc(p.caption) + '</p>' : '') +
      (p.when ? '<p class="cap__when">' + esc(p.when) + '</p>' : '') +
      '</div>';
  }

  /* A small tilt, derived from the photo's own number rather than random, so
     the wall does not reshuffle itself every time the page loads. */
  function tilt(p) {
    var n = parseInt(p.n, 10) || 0;
    return (((n * 37) % 9) - 4) * 0.6;          // -2.4deg to +2.4deg
  }

  /* width and height come in pairs, or the page reflows as media arrives. */
  function frame(p) {
    return '<div class="object__frame" style="--tilt:' + tilt(p).toFixed(2) + 'deg">' +
      '<img src="' + esc(p.src) + '" width="' + p.w + '" height="' + p.h + '" ' +
      'alt="' + esc(p.alt) + '" loading="lazy" decoding="async" draggable="false">' +
      caption(p) +
      '</div>';
  }

  function object(p, cls, attrs) {
    return '<figure class="object ' + cls + '"' + (attrs || "") + '>' +
      frame(p) + '</figure>';
  }

  /* ── ROOM I · object one, already in view, already labelled ─────────────── */
  var one = byRoom("I")[0];
  document.querySelector('[data-objects="I"]').innerHTML =
    '<figure class="object">' + frame(one) + "</figure>";

  /* ── ROOM II · the long wall. Objects go before the closing note, which is a
        rail item in its own right so the wall ends rather than just stopping.
        These deliberately do NOT use data-sc-in: that observer uses the
        viewport as its root, which is the wrong root for content clipped by a
        horizontal scroll container, and it leaves objects stuck invisible.
        The rail runs its own observer below, rooted on itself. ────────────── */
  var rail = document.getElementById("wall-rail");
  var tail = rail.querySelector(".rail__tail");
  byRoom("II").forEach(function (p) {
    tail.insertAdjacentHTML("beforebegin", object(p, "rail__obj rail__enter"));
  });
  /* Scroll anchoring: the rail held only the closing note, and inserting six
     objects BEFORE it makes the browser preserve the note's visual position by
     pushing scrollLeft to the far end. The wall then opens on its own ending,
     with "further along" correctly disabled. CSS turns anchoring off for the
     rail; this is the belt to that braces, and the wall should start at its
     beginning regardless. */
  rail.scrollLeft = 0;

  /* ── ROOM III · the vitrine. First cue greets, so the act never opens on an
        empty stage; the last cue closes at 1, because only the final act on
        the page may hold. ────────────────────────────────────────────────── */
  var VITRINE_CUES = ["0 0.34 0", "0.28 0.66", "0.60 1"];
  document.querySelector('[data-objects="III"]').innerHTML =
    byRoom("III").map(function (p, i) {
      return object(p, "vitrine__obj", ' data-sc-cue="' + VITRINE_CUES[i] + '"');
    }).join("");

  /* ── ROOM IV · the salon wall. A wipe per object, staggered across the act,
        so the hanging assembles as she comes down the page. ───────────────── */
  document.getElementById("salon").innerHTML =
    byRoom("IV").map(function (p, i) {
      var from = (0.05 + i * 0.045).toFixed(3);
      var to = (0.05 + i * 0.045 + 0.16).toFixed(3);
      return object(p, "salon__obj",
        ' data-sc-reveal="up" data-sc-reveal-at="' + from + " " + to + '"');
    }).join("");

  /* ── THE BIG ONE. The print is the ground: present at p = 0 and settling as
        she scrolls. Only the note under it is cued. ───────────────────────── */
  var star = byRoom("V")[0];
  document.querySelector('[data-objects="V"]').innerHTML =
    '<figure class="principal__frame" style="--tilt:' + tilt(star).toFixed(2) + 'deg">' +
      '<img src="' + esc(star.src) + '" width="' + star.w + '" height="' + star.h + '" ' +
      'alt="' + esc(star.alt) + '" draggable="false">' +
      caption(star) +
    '</figure>' +
    '<div class="principal__plate" data-sc-cue="0.16 1">' +
      '<p class="principal__kicker">this one especially</p>' +
    '</div>';

  /* ── copy that depends on the one configured name ───────────────────────── */
  if (C.MARK) {
    var bits = C.MARK.split(" ");
    document.getElementById("mark").innerHTML =
      esc(bits.shift()) + " <span>" + esc(bits.join(" ")) + "</span>";
  }
  if (C.NAME) {
    document.title = C.MARK + " · for " + C.NAME;
    document.getElementById("xw-solved-sub").textContent =
      "every single one was about you, " + C.NAME + ".";
  }
  /* The note at the end is signed by whoever made this, not by whoever it is
     for. Getting those two the same way round is the whole point of it. */
  if (C.FROM) {
    document.getElementById("close-coll").textContent = "yours, " + C.FROM + ", obviously";
  }
  document.getElementById("door-hint").textContent = C.DOOR_HINT;

  /* ═══ mount ══════════════════════════════════════════════════════════════
     The engine reads data-sc-* off the markup, so it mounts after the objects
     are in the DOM and never before. */
  var sc = window.ScrollCraft.mount(document);
  window.__sc = sc;

  /* ═══ CHROME ═════════════════════════════════════════════════════════════ */
  var tabC   = document.getElementById("tab-collection");
  var tabP   = document.getElementById("tab-puzzle");
  var viewC  = document.getElementById("view-collection");
  var viewP  = document.getElementById("view-puzzle");
  var idx    = document.getElementById("index");
  var idxBtn = document.getElementById("index-toggle");

  function show(which) {
    var puzzle = which === "puzzle";
    viewP.hidden = !puzzle;
    viewC.hidden = puzzle;
    tabP.setAttribute("aria-current", String(puzzle));
    tabC.setAttribute("aria-current", String(!puzzle));
    closeIndex();
    window.scrollTo({ top: 0, behavior: "instant" });
    // a hidden view measures as zero, so the engine remeasures on the way back
    if (!puzzle) sc.layout();
    window.dispatchEvent(new CustomEvent("fsx:view", { detail: which }));
  }
  function closeIndex() { idx.hidden = true; idxBtn.setAttribute("aria-expanded", "false"); }

  tabC.addEventListener("click", function () { show("collection"); });
  tabP.addEventListener("click", function () { show("puzzle"); });
  document.getElementById("close-cta").addEventListener("click", function () { show("puzzle"); });

  idxBtn.addEventListener("click", function () {
    var open = idx.hidden;
    idx.hidden = !open;
    idxBtn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", function (e) {
    if (!idx.hidden && !idx.contains(e.target) && e.target !== idxBtn) closeIndex();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeIndex();
  });

  /* the index jumps, which is what a gallery nav is for */
  Array.prototype.forEach.call(document.querySelectorAll("[data-jump]"), function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-jump");
      if (target === "puzzle") { show("puzzle"); return; }
      if (!viewP.hidden) show("collection");
      closeIndex();
      var el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* the door removes itself, then the engine remeasures against a page that is
     no longer behind an overlay */
  window.addEventListener("fsx:open", function () { sc.layout(); });

  /* ═══ ROOM II · driving the long wall ════════════════════════════════════
     The wall is a native scroll region, so swipe, trackpad and the scrollbar
     all work for free. This adds the three things that do not: the buttons,
     click-and-drag for a plain mouse, and the progress readout. */
  (function () {
    if (!rail) return;
    var bar = document.getElementById("wall-bar");
    var arrows = Array.prototype.slice.call(document.querySelectorAll("[data-wall]"));

    function maxScroll() { return rail.scrollWidth - rail.clientWidth; }

    function sync() {
      var max = maxScroll();
      if (bar) bar.style.width = (max <= 0 ? 100 : (rail.scrollLeft / max) * 100) + "%";
      arrows.forEach(function (a) {
        var dir = +a.getAttribute("data-wall");
        a.disabled = max <= 0 ||
          (dir < 0 && rail.scrollLeft <= 1) ||
          (dir > 0 && rail.scrollLeft >= max - 1);
      });
    }

    /* one object plus one gap per press, so a press always lands somewhere */
    function stride() {
      var obj = rail.querySelector(".rail__obj");
      if (!obj) return rail.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
      return obj.getBoundingClientRect().width + gap;
    }

    arrows.forEach(function (a) {
      a.addEventListener("click", function () {
        rail.scrollBy({ left: +a.getAttribute("data-wall") * stride(), behavior: "smooth" });
      });
    });

    /* Arrow keys when the rail has focus. Home and End because a long wall
       wants a way back to the start that is not thirty presses. */
    rail.addEventListener("keydown", function (e) {
      var max = maxScroll();
      var jump = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (jump) { e.preventDefault(); rail.scrollBy({ left: jump * stride(), behavior: "smooth" }); return; }
      if (e.key === "Home") { e.preventDefault(); rail.scrollTo({ left: 0, behavior: "smooth" }); }
      if (e.key === "End")  { e.preventDefault(); rail.scrollTo({ left: max, behavior: "smooth" }); }
    });

    /* Click and drag, for a mouse with no horizontal wheel. Only takes over
       once the pointer has actually travelled, so a plain click still works. */
    var down = false, moved = false, startX = 0, startLeft = 0, pid = null;
    /* Dragging an <img> starts the browser's native drag-and-drop, which
       silently cancels the pointer sequence: the wall then ignores about one
       drag in three. Refusing dragstart is what keeps the gesture ours. */
    rail.addEventListener("dragstart", function (e) { e.preventDefault(); });

    rail.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      /* Take over from any in-flight smooth scroll. The arrow buttons animate,
         and if she grabs the wall mid-glide that animation carries on writing
         scrollLeft on top of the drag, so the wall snaps back to where the
         animation was heading and the drag looks like it did nothing. */
      rail.scrollTo({ left: rail.scrollLeft, behavior: "instant" });
      down = true; moved = false; pid = e.pointerId;
      startX = e.clientX; startLeft = rail.scrollLeft;
      /* Capture on down, not part way through the first move: until the pointer
         is captured every move is hit-tested against whatever is under it, and
         a move that lands on a different child can end the sequence. */
      try { rail.setPointerCapture(pid); } catch (err) {}
    });
    rail.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) < 6) return;
      if (!moved) { moved = true; rail.classList.add("is-dragging"); }
      rail.scrollLeft = startLeft - dx;
      e.preventDefault();
    });
    function release(e) {
      if (!down) return;
      down = false;
      if (moved) { rail.classList.remove("is-dragging"); try { rail.releasePointerCapture(pid); } catch (err) {} }
      moved = false;
    }
    rail.addEventListener("pointerup", release);
    rail.addEventListener("pointercancel", release);

    /* Objects arrive as they are swiped into view. Rooted on the RAIL, not the
       viewport: these are clipped horizontally, and an observer rooted on the
       viewport reports the ones off to the right as visible. */
    var seen = null;
    function watch() {
      if (seen || !("IntersectionObserver" in window)) return;
      // A root with no box intersects nothing, and the observer will not
      // re-evaluate on its own afterwards. Wait until the rail is laid out.
      if (!rail.clientWidth) return;
      seen = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          seen.unobserve(e.target);
        });
      }, { root: rail, threshold: 0.2 });
      Array.prototype.forEach.call(rail.children, function (kid) { seen.observe(kid); });
    }

    /* Neither the measurement nor the observer can run at script time: the rail
       has no box yet, so sync() reads an overflow of zero and leaves the
       controls disabled on a wall that does in fact scroll, and the observer
       reports nothing and never looks again. Both are idempotent, so run them
       again on every signal that layout has moved on. */
    function boot() { sync(); watch(); }

    rail.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", boot, { passive: true });
    window.addEventListener("load", boot);
    window.addEventListener("fsx:open", boot);
    window.addEventListener("fsx:view", boot);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
    if (window.ResizeObserver) new ResizeObserver(boot).observe(rail);
    Array.prototype.forEach.call(rail.querySelectorAll("img"), function (img) {
      if (!img.complete) img.addEventListener("load", boot, { once: true });
    });
    requestAnimationFrame(function () { requestAnimationFrame(boot); });
  })();
})();
