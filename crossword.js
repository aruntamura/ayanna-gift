/* ═════════════════════════════════════════════════════════════════════════════
   ROOM VI · THE PUZZLE
   A freeform criss-cross over the real answers. Click to select, click again to
   flip direction, type to fill, arrows to move, tab between entries. Progress
   is kept in localStorage.
   ═════════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var P = window.PUZZLE;
  var rows = P.rows, H = rows.length, W = rows[0].length;
  var host = document.getElementById("xw");
  if (!host || !P) return;

  var KEY = "fsx-xw-v1";
  var open = function (r, c) { return r >= 0 && r < H && c >= 0 && c < W && rows[r][c] !== "."; };
  var id = function (r, c) { return r + "," + c; };

  /* ── numbering, and a cell -> entry map ─────────────────────────────────── */
  var entries = P.entries.slice();
  var cellsOf = function (e) {
    var out = [];
    for (var k = 0; k < e.answer.length; k++) {
      out.push(e.dir === "across" ? [e.r, e.c + k] : [e.r + k, e.c]);
    }
    return out;
  };
  entries.forEach(function (e) { e.cells = cellsOf(e); });

  var numAt = {}, entryAt = {};                 // "r,c" -> number / {across,down}
  entries.forEach(function (e) {
    numAt[id(e.r, e.c)] = e.num;
    e.cells.forEach(function (rc) {
      var k = id(rc[0], rc[1]);
      (entryAt[k] = entryAt[k] || {})[e.dir] = e;
    });
  });

  /* ── state ──────────────────────────────────────────────────────────────── */
  var letters = {};                             // "r,c" -> typed letter
  var cur = { r: null, c: null, dir: "across" };
  var checking = false;

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (saved && typeof saved === "object") letters = saved;
  } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(letters)); } catch (e) {} }

  /* ── build the grid ─────────────────────────────────────────────────────── */
  host.style.gridTemplateColumns = "repeat(" + W + ", var(--cell))";
  var cellEls = {};
  var html = [];
  for (var r = 0; r < H; r++) {
    for (var c = 0; c < W; c++) {
      if (!open(r, c)) { html.push('<div class="xw__cell xw__cell--block" role="presentation"></div>'); continue; }
      var n = numAt[id(r, c)];
      html.push(
        '<div class="xw__cell" role="gridcell" tabindex="-1" data-r="' + r + '" data-c="' + c + '">' +
        (n ? '<span class="xw__num">' + n + "</span>" : "") +
        '<span class="xw__ch"></span></div>');
    }
  }
  host.innerHTML = html.join("");
  Array.prototype.forEach.call(host.querySelectorAll("[data-r]"), function (el) {
    cellEls[id(+el.dataset.r, +el.dataset.c)] = el;
  });

  /* ── clue lists ─────────────────────────────────────────────────────────── */
  var clueEls = {};
  ["across", "down"].forEach(function (dir) {
    var ol = document.getElementById("clues-" + dir);
    ol.innerHTML = entries.filter(function (e) { return e.dir === dir; })
      .sort(function (a, b) { return a.num - b.num; })
      .map(function (e) {
        return '<li><button class="clue" type="button" data-num="' + e.num + '" data-dir="' + dir + '">' +
          '<span class="clue__n">' + e.num + "</span><span>" + e.clue + "</span></button></li>";
      }).join("");
    Array.prototype.forEach.call(ol.querySelectorAll(".clue"), function (btn) {
      clueEls[btn.dataset.dir + btn.dataset.num] = btn;
      btn.addEventListener("click", function () {
        var e = find(+btn.dataset.num, btn.dataset.dir);
        select(e.r, e.c, e.dir);
      });
    });
  });
  function find(num, dir) {
    return entries.filter(function (e) { return e.num === num && e.dir === dir; })[0];
  }
  function currentEntry() {
    if (cur.r === null) return null;
    var at = entryAt[id(cur.r, cur.c)];
    return at && (at[cur.dir] || at.across || at.down);
  }

  /* ── paint ──────────────────────────────────────────────────────────────── */
  var input   = document.getElementById("xw-input");
  var status  = document.getElementById("xw-status");
  var solved  = document.getElementById("xw-solved");
  var curLbl  = document.getElementById("xw-current-label");
  var curClue = document.getElementById("xw-current-clue");

  function paint() {
    var entry = currentEntry();
    var inEntry = {};
    if (entry) entry.cells.forEach(function (rc) { inEntry[id(rc[0], rc[1])] = true; });

    Object.keys(cellEls).forEach(function (k) {
      var el = cellEls[k];
      var ch = letters[k] || "";
      el.querySelector(".xw__ch").textContent = ch;
      el.classList.toggle("xw__cell--in-entry", !!inEntry[k] && k !== id(cur.r, cur.c));
      el.classList.toggle("xw__cell--active", k === id(cur.r, cur.c));
      var wrong = checking && ch && ch !== answerAt(k);
      el.classList.toggle("xw__cell--wrong", !!wrong);
      el.setAttribute("aria-label", label(k));
    });

    Object.keys(clueEls).forEach(function (k) { clueEls[k].removeAttribute("aria-current"); });
    entries.forEach(function (e) {
      var el = clueEls[e.dir + e.num];
      if (el) el.classList.toggle("is-done", done(e));
    });
    if (entry) {
      var el = clueEls[entry.dir + entry.num];
      if (el) el.setAttribute("aria-current", "true");
      curLbl.textContent = entry.num + " " + (entry.dir === "across" ? "Across" : "Down");
      curClue.textContent = entry.clue;
    }
    checkSolved();
  }

  function answerAt(k) {
    var at = entryAt[k];
    var e = at.across || at.down;
    var i = e.dir === "across" ? (+k.split(",")[1] - e.c) : (+k.split(",")[0] - e.r);
    return e.answer[i];
  }
  function label(k) {
    var rc = k.split(",");
    var n = numAt[k];
    return (n ? "Square " + n + ". " : "Square. ") + (letters[k] ? letters[k] : "empty");
  }
  function done(e) {
    return e.cells.every(function (rc) { return letters[id(rc[0], rc[1])]; });
  }

  /* ── selection and movement ─────────────────────────────────────────────── */
  function select(r, c, dir) {
    if (!open(r, c)) return;
    var at = entryAt[id(r, c)];
    if (dir && at[dir]) cur.dir = dir;
    else if (!at[cur.dir]) cur.dir = at.across ? "across" : "down";
    cur.r = r; cur.c = c;
    paint();
    input.focus({ preventScroll: true });
  }

  host.addEventListener("mousedown", function (e) {
    var cell = e.target.closest("[data-r]");
    if (!cell) return;
    e.preventDefault();
    var r = +cell.dataset.r, c = +cell.dataset.c;
    // clicking the selected square flips direction, which is the convention
    if (cur.r === r && cur.c === c) {
      var at = entryAt[id(r, c)];
      var other = cur.dir === "across" ? "down" : "across";
      if (at[other]) cur.dir = other;
      paint();
      input.focus({ preventScroll: true });
    } else {
      select(r, c);
    }
  });

  function step(dr, dc) {
    var r = cur.r + dr, c = cur.c + dc;
    while (r >= 0 && r < H && c >= 0 && c < W) {
      if (open(r, c)) { select(r, c, dr ? "down" : "across"); return true; }
      r += dr; c += dc;
    }
    return false;
  }
  function advance() {
    var e = currentEntry();
    if (!e) return;
    var i = e.cells.findIndex(function (rc) { return rc[0] === cur.r && rc[1] === cur.c; });
    if (i < e.cells.length - 1) {
      var rc = e.cells[i + 1];
      cur.r = rc[0]; cur.c = rc[1];
      paint();
    }
  }
  function retreat() {
    var e = currentEntry();
    if (!e) return;
    var i = e.cells.findIndex(function (rc) { return rc[0] === cur.r && rc[1] === cur.c; });
    if (i > 0) {
      var rc = e.cells[i - 1];
      cur.r = rc[0]; cur.c = rc[1];
      paint();
    }
  }
  function nextEntry(back) {
    var e = currentEntry();
    var list = entries.slice().sort(function (a, b) {
      return a.dir === b.dir ? a.num - b.num : (a.dir === "across" ? -1 : 1);
    });
    var i = list.indexOf(e);
    var j = ((i + (back ? -1 : 1)) + list.length) % list.length;
    var t = list[j];
    select(t.r, t.c, t.dir);
  }

  /* ── typing ─────────────────────────────────────────────────────────────── */
  function type(ch) {
    if (cur.r === null) return;
    letters[id(cur.r, cur.c)] = ch;
    checking = false;
    save();
    advance();
    paint();
  }
  function erase() {
    if (cur.r === null) return;
    var k = id(cur.r, cur.c);
    if (letters[k]) { delete letters[k]; }
    else { retreat(); delete letters[id(cur.r, cur.c)]; }
    checking = false;
    save();
    paint();
  }

  input.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case "ArrowLeft":  e.preventDefault(); step(0, -1); return;
      case "ArrowRight": e.preventDefault(); step(0,  1); return;
      case "ArrowUp":    e.preventDefault(); step(-1, 0); return;
      case "ArrowDown":  e.preventDefault(); step( 1, 0); return;
      case "Backspace":  e.preventDefault(); erase(); return;
      case "Delete":     e.preventDefault(); delete letters[id(cur.r, cur.c)]; save(); paint(); return;
      case "Tab":        e.preventDefault(); nextEntry(e.shiftKey); return;
      case " ":
        e.preventDefault();
        var at = entryAt[id(cur.r, cur.c)];
        var other = cur.dir === "across" ? "down" : "across";
        if (at[other]) { cur.dir = other; paint(); }
        return;
    }
    if (/^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); type(e.key.toUpperCase()); }
  });
  // soft keyboards fire input rather than keydown
  input.addEventListener("input", function () {
    var v = input.value.replace(/[^a-zA-Z]/g, "");
    input.value = "";
    if (v) type(v[v.length - 1].toUpperCase());
  });

  /* ── controls ───────────────────────────────────────────────────────────── */
  document.getElementById("xw-check").addEventListener("click", function () {
    checking = true;
    var filled = 0, right = 0, total = 0;
    Object.keys(cellEls).forEach(function (k) {
      total++;
      if (letters[k]) { filled++; if (letters[k] === answerAt(k)) right++; }
    });
    status.textContent = filled === 0
      ? "Nothing to check yet."
      : right + " of " + filled + " filled squares are right. " + (total - filled) + " still empty.";
    paint();
  });
  document.getElementById("xw-clear").addEventListener("click", function () {
    letters = {}; checking = false; save();
    status.textContent = "Cleared.";
    solved.hidden = true;
    paint();
  });

  function checkSolved() {
    var all = Object.keys(cellEls).every(function (k) { return letters[k] === answerAt(k); });
    solved.hidden = !all;
    if (all) {
      Object.keys(cellEls).forEach(function (k) { cellEls[k].classList.add("xw__cell--solved"); });
      status.textContent = "";
    } else {
      Object.keys(cellEls).forEach(function (k) { cellEls[k].classList.remove("xw__cell--solved"); });
    }
  }

  /* start on the first across entry */
  var first = entries.filter(function (e) { return e.dir === "across"; })
    .sort(function (a, b) { return a.num - b.num; })[0];
  cur.r = first.r; cur.c = first.c; cur.dir = "across";
  paint();
})();
