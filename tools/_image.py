#!/usr/bin/env python3
"""
Bake in EXIF orientation, then resize. Called by tools/import-media.mjs.

    python3 tools/_image.py <in.jpg> <out.jpg> <max_edge> <quality> [extra_rotate_cw]

sips resamples without applying the EXIF orientation tag, so photos taken in
portrait come out on their side. Pillow's exif_transpose rotates the pixels to
match the tag, after which the tag is meaningless and gets dropped.

extra_rotate_cw is a manual escape hatch in degrees clockwise, for the photos
that carry no orientation tag at all and are simply stored the wrong way up.
Nothing can infer those; they have to be told.
"""
import sys
from PIL import Image, ImageOps

src, dst, max_edge, quality = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
extra = int(sys.argv[5]) if len(sys.argv) > 5 else 0

im = Image.open(src)
im = ImageOps.exif_transpose(im)          # honour the tag
if extra:
    im = im.rotate(-extra, expand=True)   # PIL rotates counter-clockwise
if im.mode not in ("RGB", "L"):
    im = im.convert("RGB")
im.thumbnail((max_edge, max_edge), Image.LANCZOS)
im.save(dst, "JPEG", quality=quality, optimize=True, progressive=True)
print(f"{im.width}x{im.height}")
