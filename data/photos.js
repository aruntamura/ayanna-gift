/* ─────────────────────────────────────────────────────────────────────────────
   THE COLLECTION
   ---------------------------------------------------------------------------
   Eighteen objects. To swap in a real photograph:

     1. Drop the file into  assets/photos/
     2. Point  src  at it, and set  w  and  h  to its real pixel dimensions
        (both, or the layout reflows as images load)
     3. Write the label:  title, place
     4. Write  alt  as a plain description of what is in the shot, for anyone
        using a screen reader. Describe the photograph, not the feeling.

   The label schema is fixed for every object, because the schema is what makes
   this a collection instead of a grid. Museum labels state fact, not pitch.
   Keep them plain:  "Untitled (kitchen, 11pm)"  reads better than  "Our love".

   room  I   vestibule, one print
   room  II  the long wall, scrolls sideways
   room  III the vitrine, lit one at a time
   room  IV  the salon wall, has the loupe over it
   room  V   the principal work, alone at full frame
   ───────────────────────────────────────────────────────────────────────────── */

window.PHOTOS = [
  { n: "01", room: "I", src: "assets/photos/plate-01.svg", w: 1500, h: 1000,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 01, warm dusk tones" },
  { n: "02", room: "II", src: "assets/photos/plate-02.svg", w: 1000, h: 1250,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 02, warm dusk tones" },
  { n: "03", room: "II", src: "assets/photos/plate-03.svg", w: 1500, h: 1000,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 03, warm dusk tones" },
  { n: "04", room: "II", src: "assets/photos/plate-04.svg", w: 1100, h: 1100,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 04, warm dusk tones" },
  { n: "05", room: "II", src: "assets/photos/plate-05.svg", w: 1000, h: 1250,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 05, warm dusk tones" },
  { n: "06", room: "II", src: "assets/photos/plate-06.svg", w: 1500, h: 1000,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 06, warm dusk tones" },
  { n: "07", room: "II", src: "assets/photos/plate-07.svg", w: 1000, h: 1250,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 07, warm dusk tones" },
  { n: "08", room: "III", src: "assets/photos/plate-08.svg", w: 1100, h: 1100,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 08, warm dusk tones" },
  { n: "09", room: "III", src: "assets/photos/plate-09.svg", w: 1000, h: 1250,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 09, warm dusk tones" },
  { n: "10", room: "III", src: "assets/photos/plate-10.svg", w: 1500, h: 1000,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 10, warm dusk tones" },
  { n: "11", room: "IV", src: "assets/photos/plate-11.svg", w: 1100, h: 1100,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 11, warm dusk tones" },
  { n: "12", room: "IV", src: "assets/photos/plate-12.svg", w: 1000, h: 1250,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 12, warm dusk tones" },
  { n: "13", room: "IV", src: "assets/photos/plate-13.svg", w: 1500, h: 1000,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 13, warm dusk tones" },
  { n: "14", room: "IV", src: "assets/photos/plate-14.svg", w: 1000, h: 1250,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 14, warm dusk tones" },
  { n: "15", room: "IV", src: "assets/photos/plate-15.svg", w: 1100, h: 1100,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 15, warm dusk tones" },
  { n: "16", room: "IV", src: "assets/photos/plate-16.svg", w: 1500, h: 1000,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 16, warm dusk tones" },
  { n: "17", room: "IV", src: "assets/photos/plate-17.svg", w: 1500, h: 1000,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 17, warm dusk tones" },
  { n: "18", room: "V", src: "assets/photos/plate-18.svg", w: 1000, h: 1250,
    title: "Untitled", place: "Where, when", medium: "Digital photograph", coll: "Private collection" ,
    alt: "Placeholder plate 18, warm dusk tones" },
];
