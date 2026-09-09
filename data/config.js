/* ─────────────────────────────────────────────────────────────────────────────
   THE KNOBS
   ---------------------------------------------------------------------------
   Everything you are likely to want to change lives here.
   ───────────────────────────────────────────────────────────────────────────── */

window.CONFIG = {

  /* Who it is for. Used in the browser tab and in the puzzle's win message.
     Leave it "" and the copy still reads fine. */
  NAME: "Ayanna",

  /* Who it is from. Signs the note at the end. */
  FROM: "Arun",

  /* The collection's name, shown in the top bar and in the browser tab.
     Museum signage, deadpan, on a site that is nothing but photographs.
     Alternatives in the same register if you want to swap it:
       "please do not touch"   "recent acquisitions"   "not available for loan"
     The very first name was the door code spelled out, which gave it away. */
  MARK: "no photography permitted",

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
  DOOR_HINT: "three digits. you know them.",

  /* Wrong-guess replies, in order. The last one repeats after that. */
  DOOR_WRONG: [
    "nope. try the obvious one.",
    "still no. think smaller.",
    "it is three digits and you know them.",
    "i can do this all day.",
  ],
};
