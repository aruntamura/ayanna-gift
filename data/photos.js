/* ─────────────────────────────────────────────────────────────────────────────
   THE PHOTOS
   ---------------------------------------------------------------------------
   Eighteen of them. To swap one in:

     1. Drop the file into  assets/photos/
     2. Point  src  at it, and set  w  and  h  to its real pixel dimensions
        (both, or the page reflows as the images arrive)
     3. Write the  caption. This is the whole point. It is handwritten on the
        photo, so write it like you would actually say it, lowercase and short.
        "you, refusing to admit you were lost" beats "a lovely day out".
     4. Optionally add  when  ("july", "last winter", "3am"). Leave it "" to
        show nothing.
     5. Write  alt  as a plain description of the shot, for anyone using a
        screen reader.

   Which pile a photo lands in is the  room  field:

     I    the first one, on its own
     II   the long wall, scrolls sideways        (6)
     III  small things, one at a time            (3)
     IV   everything at once, has the loupe      (7)
     V    the big one                            (1)
   ───────────────────────────────────────────────────────────────────────────── */

window.PHOTOS = [
  { n: "01", room: "I", src: "assets/photos/plate-01.svg", w: 1500, h: 1000,
    caption: "write something here", when: "",
    alt: "Placeholder photo 01" },
  { n: "02", room: "II", src: "assets/photos/plate-02.svg", w: 1000, h: 1250,
    caption: "write something here", when: "",
    alt: "Placeholder photo 02" },
  { n: "03", room: "II", src: "assets/photos/plate-03.svg", w: 1500, h: 1000,
    caption: "write something here", when: "",
    alt: "Placeholder photo 03" },
  { n: "04", room: "II", src: "assets/photos/plate-04.svg", w: 1100, h: 1100,
    caption: "write something here", when: "",
    alt: "Placeholder photo 04" },
  { n: "05", room: "II", src: "assets/photos/plate-05.svg", w: 1000, h: 1250,
    caption: "write something here", when: "",
    alt: "Placeholder photo 05" },
  { n: "06", room: "II", src: "assets/photos/plate-06.svg", w: 1500, h: 1000,
    caption: "write something here", when: "",
    alt: "Placeholder photo 06" },
  { n: "07", room: "II", src: "assets/photos/plate-07.svg", w: 1000, h: 1250,
    caption: "write something here", when: "",
    alt: "Placeholder photo 07" },
  { n: "08", room: "III", src: "assets/photos/plate-08.svg", w: 1100, h: 1100,
    caption: "write something here", when: "",
    alt: "Placeholder photo 08" },
  { n: "09", room: "III", src: "assets/photos/plate-09.svg", w: 1000, h: 1250,
    caption: "write something here", when: "",
    alt: "Placeholder photo 09" },
  { n: "10", room: "III", src: "assets/photos/plate-10.svg", w: 1500, h: 1000,
    caption: "write something here", when: "",
    alt: "Placeholder photo 10" },
  { n: "11", room: "IV", src: "assets/photos/plate-11.svg", w: 1100, h: 1100,
    caption: "write something here", when: "",
    alt: "Placeholder photo 11" },
  { n: "12", room: "IV", src: "assets/photos/plate-12.svg", w: 1000, h: 1250,
    caption: "write something here", when: "",
    alt: "Placeholder photo 12" },
  { n: "13", room: "IV", src: "assets/photos/plate-13.svg", w: 1500, h: 1000,
    caption: "write something here", when: "",
    alt: "Placeholder photo 13" },
  { n: "14", room: "IV", src: "assets/photos/plate-14.svg", w: 1000, h: 1250,
    caption: "write something here", when: "",
    alt: "Placeholder photo 14" },
  { n: "15", room: "IV", src: "assets/photos/plate-15.svg", w: 1100, h: 1100,
    caption: "write something here", when: "",
    alt: "Placeholder photo 15" },
  { n: "16", room: "IV", src: "assets/photos/plate-16.svg", w: 1500, h: 1000,
    caption: "write something here", when: "",
    alt: "Placeholder photo 16" },
  { n: "17", room: "IV", src: "assets/photos/plate-17.svg", w: 1500, h: 1000,
    caption: "write something here", when: "",
    alt: "Placeholder photo 17" },
  { n: "18", room: "V", src: "assets/photos/plate-18.svg", w: 1000, h: 1250,
    caption: "write something here", when: "",
    alt: "Placeholder photo 18" },
];
