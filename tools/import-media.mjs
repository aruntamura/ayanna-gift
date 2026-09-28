/* ─────────────────────────────────────────────────────────────────────────────
   Import photos and videos into the site.

       node tools/import-media.mjs "~/Desktop/ayanna website"

   What it does:
     - reads every image and video in the folder
     - sorts them by the date the photo was actually taken, so the page runs
       chronologically rather than by whatever iOS named the file
     - converts HEIC to JPEG and shrinks everything to a sane size for the web
     - turns videos into looping GIFs
     - deals the result out across the five sections
     - rewrites data/photos.js

   IT WILL NOT CLOBBER YOUR CAPTIONS. Each entry records the original filename
   it came from, so re-running after you have written captions keeps them, and
   you can drop new photos into the folder and run it again.

   Re-running is the intended way to add more later.
   ───────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'assets', 'photos');
const dataFile = path.join(root, 'data', 'photos.js');

const src = process.argv[2];
if (!src) { console.error('usage: node tools/import-media.mjs "<folder of photos>"'); process.exit(1); }
const srcDir = src.replace(/^~/, process.env.HOME);
if (!fs.existsSync(srcDir)) { console.error('no such folder: ' + srcDir); process.exit(1); }

const MAX_EDGE = 1600;      // long edge of a web photo
const JPEG_Q   = 80;
/* Long edge, chosen by clip length. GIF pays for every frame AND every pixel,
   so a two second clip can afford to be sharp where an eight second one
   cannot. Flat settings either make the short clip mushy or the long one
   enormous. */
const GIF_FPS  = 10;
function gifEdge(seconds) {
  if (seconds <= 3) return 560;
  if (seconds <= 6) return 440;
  return 360;
}
/* Palette by clip length too. A short clip can afford 256 colours and error
   diffusion, which is what keeps smooth walls and skin from banding into
   flat blobs. Over a long clip that costs far too much, and ordered dither
   compresses much better frame to frame, so the long one keeps bayer. */
function gifPalette(seconds) {
  return seconds <= 3
    ? { colors: 256, dither: 'floyd_steinberg' }
    : { colors: 128, dither: 'bayer:bayer_scale=5' };
}

const IMG = /\.(heic|heif|jpg|jpeg|png|tif|tiff)$/i;

/* Manual rotation, in degrees clockwise, keyed by original filename.
   For photos that carry no EXIF orientation tag at all and are simply stored
   the wrong way up. Nothing can infer those, they have to be told. */
const ROTATE = {
};
const VID = /\.(mov|mp4|m4v|avi)$/i;

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/* ── when was this actually taken ─────────────────────────────────────────── */
function takenAt(file) {
  try {
    if (VID.test(file)) {
      const out = sh('ffprobe', ['-v', 'error', '-show_entries', 'format_tags=creation_time',
        '-of', 'default=nw=1:nk=1', file]).trim();
      if (out) return new Date(out);
    } else {
      const out = sh('sips', ['-g', 'creation', file]);
      const m = out.match(/creation:\s*(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    }
  } catch (e) { /* fall through to mtime */ }
  return fs.statSync(file).mtime;
}

const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const whenLabel = (d) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/* ── existing captions, keyed by the file they came from ──────────────────── */
const kept = new Map();
const FRESH = process.argv.includes('--redeal');   // throw away hand placement
if (fs.existsSync(dataFile) && !FRESH) {
  /* Parse ENTRY BY ENTRY. Scanning for "from" and then the next "caption" walks
     straight into the following entry, because from is written last, and every
     caption ends up attached to the wrong photograph. Which is the one thing
     this map exists to prevent. */
  const prev = fs.readFileSync(dataFile, 'utf8');
  for (const block of prev.match(/\{[^{}]*\}/g) || []) {
    const field = (k) => (block.match(new RegExp(k + ':\\s*"((?:[^"\\\\]|\\\\.)*)"')) || [])[1];
    const from = field('from');
    if (from) kept.set(from, { caption: field('caption') || '', when: field('when') || '',
                               room: field('room') || '' });
  }
}

/* ── collect and order ────────────────────────────────────────────────────── */
const files = fs.readdirSync(srcDir)
  .filter(f => !f.startsWith('.') && (IMG.test(f) || VID.test(f)))
  .map(f => {
    const full = path.join(srcDir, f);
    return { name: f, full, isVideo: VID.test(f), at: takenAt(full) };
  })
  .sort((a, b) => a.at - b.at);

if (!files.length) { console.error('no photos or videos found in ' + srcDir); process.exit(1); }

/* ── how the page is dealt out ────────────────────────────────────────────── */
function deal(n) {
  if (n <= 5) return { I: 1, II: Math.max(0, n - 2), III: 0, IV: 0, V: n > 1 ? 1 : 0 };
  const I = 1, III = 3, V = 1;
  const rest = n - I - III - V;
  const II = Math.min(Math.max(Math.round(rest * 0.4), 3), 9);
  return { I, II, III, IV: rest - II, V };
}
const plan = deal(files.length);

/* ── convert ──────────────────────────────────────────────────────────────── */
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) {
  if (/^(plate-\d+\.svg|\d+-.*\.(jpg|gif))$/i.test(f)) fs.unlinkSync(path.join(outDir, f));
}

const slug = (s) => s.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28);
const entries = [];
let i = 0;

for (const f of files) {
  i++;
  const n = String(i).padStart(2, '0');
  const base = `${n}-${slug(f.name)}`;
  let outName, w, h;

  if (f.isVideo) {
    outName = `${base}.gif`;
    const outPath = path.join(outDir, outName);
    const pal = path.join(outDir, `.pal-${n}.png`);
    const mid = path.join(outDir, `.mid-${n}.mp4`);

    /* Three passes, and the first one is not optional.
       iPhone video carries its rotation in a display matrix rather than in the
       pixels. ffmpeg applies that automatically for a simple -vf graph but NOT
       for -lavfi, and the palette pass needs -lavfi because it takes two
       inputs. Converting straight to GIF therefore produced a portrait clip
       lying on its side. So: normalise to an upright, scaled intermediate with
       -vf first, where autorotation does apply, and everything after it is
       working with pixels that are already the right way up.

       Scaling is by LONG edge, not by width. Scaling portrait footage to a
       fixed width makes it enormously taller than the same setting makes a
       landscape clip, and GIF pays for every one of those pixels. */
    let seconds = 0;
    try {
      seconds = parseFloat(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=nw=1:nk=1', f.full]).trim()) || 0;
    } catch (e) { /* fall back to the smallest */ }
    const edge = gifEdge(seconds);
    const pal_ = gifPalette(seconds);
    const scale = `scale=w='if(gte(iw,ih),${edge},-2)':h='if(gte(iw,ih),-2,${edge})':flags=lanczos`;
    sh('ffmpeg', ['-v', 'error', '-y', '-i', f.full, '-vf', `fps=${GIF_FPS},${scale}`,
      '-an', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', mid]);
    sh('ffmpeg', ['-v', 'error', '-y', '-i', mid,
      '-vf', `palettegen=max_colors=${pal_.colors}:stats_mode=diff`, pal]);
    sh('ffmpeg', ['-v', 'error', '-y', '-i', mid, '-i', pal,
      '-lavfi', `[0:v][1:v]paletteuse=dither=${pal_.dither}:diff_mode=rectangle`,
      '-loop', '0', outPath]);
    fs.unlinkSync(pal); fs.unlinkSync(mid);
    const probe = sh('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', outPath]).trim().split('x');
    w = +probe[0]; h = +probe[1];
  } else {
    outName = `${base}.jpg`;
    const outPath = path.join(outDir, outName);

    /* sips resamples without applying the EXIF orientation tag, so anything
       shot in portrait lands on its side. sips DOES carry the tag through when
       it converts HEIC to JPEG, so: use it only as a HEIC decoder, then let
       Pillow rotate the pixels to match the tag and do the resize. */
    let feed = f.full;
    let tmp = null;
    if (/\.(heic|heif)$/i.test(f.name)) {
      tmp = path.join(outDir, `.tmp-${n}.jpg`);
      sh('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '95', f.full, '--out', tmp]);
      feed = tmp;
    }
    const extra = ROTATE[f.name] || 0;
    const dims = sh('python3', [path.join(root, 'tools', '_image.py'),
      feed, outPath, String(MAX_EDGE), String(JPEG_Q), String(extra)]).trim().split('x');
    if (tmp) fs.unlinkSync(tmp);
    w = +dims[0]; h = +dims[1];
  }

  const prev = kept.get(f.name);
  entries.push({
    n, src: `assets/photos/${outName}`, w, h,
    caption: prev ? prev.caption : 'write something here',
    when: prev && prev.when ? prev.when : whenLabel(f.at),
    alt: f.isVideo ? `Short clip, ${whenLabel(f.at)}` : `Photo, ${whenLabel(f.at)}`,
    from: f.name,
    isVideo: f.isVideo,
    bytes: fs.statSync(path.join(outDir, outName)).size,
  });
  process.stdout.write(`  ${n}  ${f.name} -> ${outName}  ${w}x${h}  ${(entries[entries.length-1].bytes/1024).toFixed(0)}KB\n`);
}

/* Rooms that were moved by hand stay put. Only photos that have never been
   placed get dealt. Otherwise adding one new photo reshuffles the whole page
   and undoes every arrangement made since. --redeal forces a clean deal. */
for (const e of entries) {
  const prev = kept.get(e.from);
  if (prev && prev.room) e.pinnedRoom = prev.room;
}

/* ── assign rooms ─────────────────────────────────────────────────────────────
   Chronological, except that "the big one" is pulled out first and is always a
   PHOTO. It is the last thing on the page and it gets a whole screen, so
   letting a two second clip land there by accident of ordering wastes it.
   Change any entry's room by hand afterwards; nothing here overwrites that. */
const order = ['I', 'II', 'III', 'IV'];
for (const e of entries) if (e.pinnedRoom) e.room = e.pinnedRoom;

const loose = entries.filter(e => !e.room);
if (!entries.some(e => e.room === 'V')) {
  // the closer is always a photograph, never a clip: it gets a whole screen
  for (let j = loose.length - 1; j >= 0; j--) {
    if (!loose[j].isVideo) { loose[j].room = 'V'; break; }
  }
}
const rest = loose.filter(e => !e.room);
let k = 0;
for (const room of order) {
  const already = entries.filter(e => e.room === room).length;
  for (let c = already; c < plan[room]; c++) { if (rest[k]) rest[k].room = room; k++; }
}
for (const e of entries) if (!e.room) e.room = 'IV';

/* ── write ────────────────────────────────────────────────────────────────── */
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const body = entries.map(e =>
`  { n: "${e.n}", room: "${e.room}", src: "${e.src}", w: ${e.w}, h: ${e.h},
    caption: "${esc(e.caption)}", when: "${esc(e.when)}",
    alt: "${esc(e.alt)}", from: "${esc(e.from)}" },`).join('\n');

fs.writeFileSync(dataFile, `/* ─────────────────────────────────────────────────────────────────────────────
   THE PHOTOS
   GENERATED by tools/import-media.mjs. Re-running it keeps your captions: each
   entry remembers the file it came from, so you can drop more photos into the
   source folder and run it again without losing anything you have written.

   ${entries.length} of them, in the order they were taken.

   The one thing worth your time is  caption. It is handwritten on the photo,
   so write it the way you would say it out loud, lowercase and short.
   "you, refusing to admit you were lost" beats "a lovely day out".

     when   shows small and in colour next to the caption. "" hides it.
     alt    is read aloud by screen readers. Describe the picture.
     room   I=the first one, II=the long wall, III=small things,
            IV=everything at once, V=the big one
   ───────────────────────────────────────────────────────────────────────────── */

window.PHOTOS = [
${body}
];
`);

const total = entries.reduce((s, e) => s + e.bytes, 0);
const gifs = entries.filter(e => e.isVideo);
console.log(`\n${entries.length} items  (${entries.length - gifs.length} photos, ${gifs.length} gifs)`);
console.log(`dealt out: ` + ['I','II','III','IV','V'].map(r => `${r}=${entries.filter(e => e.room === r).length}`).join('  '));
console.log(`total weight: ${(total / 1048576).toFixed(1)} MB` +
  (gifs.length ? `, of which ${(gifs.reduce((s, e) => s + e.bytes, 0) / 1048576).toFixed(1)} MB is the gifs` : ''));
