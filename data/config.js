/* ─────────────────────────────────────────────────────────────────────────────
   THE KNOBS
   ---------------------------------------------------------------------------
   Everything you are likely to want to change lives here.
   ───────────────────────────────────────────────────────────────────────────── */

window.CONFIG = {

  /* Her name, or whatever you actually call her. Used on the closing plate and
     in the page title. Leave it as "" and the copy reads fine without it. */
  NAME: "Ayanna",

  /* The collection's name, shown in the top bar and in the browser tab.
     The old name was the door code spelled out, which rather gave it away. */
  MARK: "Permanent Collection",

  /* ── The door ───────────────────────────────────────────────────────────────
     The code is checked in the browser, so this is a lovely moment, NOT
     security. Anyone who opens the page source can get past it. Do not put
     anything behind it that you would mind being seen.

     It is stored as a hash rather than as plain digits so the number is not
     sitting in plain sight for someone idly poking at the page.

     To change the code: open the site, open the browser console, and run
         __codeHash("1234")
     then paste the number it prints in as CODE_HASH, and set CODE_LENGTH.      */
  CODE_HASH: 816297241,
  CODE_LENGTH: 3,

  /* Shown under the door's heading. Keep it a nudge, not the answer. */
  DOOR_HINT: "Three digits. You already know them.",

  /* Wrong-guess replies, in order. The last one repeats after that. */
  DOOR_WRONG: [
    "Not it. Try the obvious one.",
    "Still no. Think smaller.",
    "It is three digits and you know them.",
    "I can do this all day.",
  ],
};
