/* ═════════════════════════════════════════════════════════════════════════════
   THE DOOR
   A closed gallery and a three-digit plate. This is the page's title moment,
   which is why the collection behind it opens on object one with no separate
   hero treatment.

   Cosmetic, not security. See data/config.js.
   ═════════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  // FNV-1a. Enough to keep the number out of plain sight in the source.
  function codeHash(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
    }
    return h >>> 0;
  }
  window.__codeHash = codeHash;   // so the code can be changed from the console

  var C      = window.CONFIG;
  var door   = document.getElementById("door");
  var plate  = door.querySelector(".door__plate");
  var form   = document.getElementById("door-form");
  var input  = document.getElementById("door-input");
  var msg    = document.getElementById("door-msg");
  var pips   = Array.prototype.slice.call(door.querySelectorAll(".door__pip"));
  var wrongs = 0;

  function paint() {
    var v = input.value;
    pips.forEach(function (pip, i) {
      pip.textContent = v[i] ? "•" : "";
      pip.classList.toggle("is-next", i === v.length);
    });
  }

  function open(instant) {
    document.body.classList.remove("is-locked");
    try { sessionStorage.setItem("fsx-open", "1"); } catch (e) {}

    if (instant) { door.remove(); window.dispatchEvent(new Event("fsx:open")); return; }

    door.classList.add("is-open");
    // let the wipe run, then take the door out of the tree entirely so it can
    // never trap focus
    var done = function () { door.remove(); window.dispatchEvent(new Event("fsx:open")); };
    door.addEventListener("transitionend", done, { once: true });
    setTimeout(done, 1400);                      // belt and braces
  }

  function reject() {
    plate.classList.remove("is-wrong");
    void plate.offsetWidth;                      // restart the animation
    plate.classList.add("is-wrong");
    msg.textContent = C.DOOR_WRONG[Math.min(wrongs, C.DOOR_WRONG.length - 1)];
    wrongs++;
    input.value = "";
    paint();
    input.focus();
  }

  function submit() {
    if (input.value.length !== C.CODE_LENGTH) { reject(); return; }
    if (codeHash(input.value) === C.CODE_HASH) { open(false); } else { reject(); }
  }

  input.addEventListener("input", function () {
    input.value = input.value.replace(/\D/g, "").slice(0, C.CODE_LENGTH);
    msg.textContent = "";
    paint();
    if (input.value.length === C.CODE_LENGTH) submit();   // no need to press Enter
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); submit(); });
  door.addEventListener("click", function () { input.focus(); });

  // Already through the door this session: do not make her do it twice.
  var was = false;
  try { was = sessionStorage.getItem("fsx-open") === "1"; } catch (e) {}
  if (was) { open(true); } else { paint(); setTimeout(function () { input.focus(); }, 260); }
})();
