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

  /* The label schema. Identical for every object, no exceptions: the schema is
     what makes this a collection instead of a grid. */
  function plate(p) {
    return '<div class="plate">' +
      '<p class="plate__no">No. ' + esc(p.n) + '</p>' +
      '<p class="plate__title">' + esc(p.title) + '</p>' +
      '<p class="plate__meta">' +
        '<span>' + esc(p.place) + '</span>' +
        '<span>' + esc(p.medium) + '</span>' +
        '<span>' + esc(p.coll) + '</span>' +
      '</p></div>';
  }

  /* width and height come in pairs, or the page reflows as media arrives. */
  function frame(p) {
    return '<span class="object__frame">' +
      '<img src="' + esc(p.src) + '" width="' + p.w + '" height="' + p.h + '" ' +
      'alt="' + esc(p.alt) + '" loading="lazy" decoding="async">' +
      '</span>';
  }

  function object(p, cls, attrs) {
    return '<figure class="object ' + cls + '"' + (attrs || "") + '>' +
      frame(p) + plate(p) + '</figure>';
  }

  /* ── ROOM I · object one, already in view, already labelled ─────────────── */
  var one = byRoom("I")[0];
  document.querySelector('[data-objects="I"]').innerHTML =
    '<figure class="object">' + frame(one) + "</figure>";
  document.querySelector('[data-plates="I"]').innerHTML = plate(one);

  /* ── ROOM II · the long wall. Objects go between the heading and the note,
        both of which are rail items in their own right: they earn their place
        and they add the width the pan travel needs. ───────────────────────── */
  var rail = document.getElementById("wall-rail");
  var tail = rail.querySelector(".rail__tail");
  byRoom("II").forEach(function (p, i) {
    var enter = (0.06 + i * 0.1).toFixed(3);
    tail.insertAdjacentHTML("beforebegin",
      object(p, "rail__obj", ' style="--enter:' + enter + '"'));
  });

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

  /* ── ROOM V · the principal work. The print is the ground: it is present at
        p = 0 and settles as she scrolls. Only the plate is cued. ──────────── */
  var star = byRoom("V")[0];
  document.querySelector('[data-objects="V"]').innerHTML =
    '<figure class="principal__frame">' +
      '<img src="' + esc(star.src) + '" width="' + star.w + '" height="' + star.h + '" ' +
      'alt="' + esc(star.alt) + '">' +
    '</figure>' +
    '<div class="principal__plate" data-sc-cue="0.16 1">' +
      '<p class="principal__kicker">The principal work</p>' + plate(star) +
    '</div>';

  /* ── copy that depends on the one configured name ───────────────────────── */
  if (C.MARK) {
    var bits = C.MARK.split(" ");
    document.getElementById("mark").innerHTML =
      esc(bits.shift()) + " <span>" + esc(bits.join(" ")) + "</span>";
  }
  if (C.NAME) {
    document.title = C.MARK + " · for " + C.NAME;
    document.getElementById("close-coll").textContent = "Collection of " + C.NAME;
    document.getElementById("xw-solved-sub").textContent =
      "Every single one was about you, " + C.NAME + ".";
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
})();
