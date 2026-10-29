"""
pptx_to_gifs.py — turn a multi-slide PowerPoint into one animated GIF per section.

    python pptx_to_gifs.py                                   # ../Slides-01-06.pptx → ../gifs/
    python pptx_to_gifs.py my_deck.pptx --out some/folder    # any deck, any folder

THE IDEA
    The 43-slide deck is the master. Each section ("2 · Why Single Agents Fail", ...) is a run of
    step slides. Played one after another, those steps ARE the animation. So:

        1. RENDER   every slide to a PNG image
        2. GROUP    the images by the deck's sections (stored inside the .pptx)
        3. STITCH   each group into a looping GIF, with a short cross-fade between steps

    Result: ../gifs/2-why-single-agents-fail-happy-path.gif, ../gifs/5-root-cause.gif, ...

WHAT IT CAPTURES (AND DOESN'T)
    It captures each step, not PowerPoint's Morph motion between steps: the cross-fade softens the
    jump. For the true Morph glide, use PowerPoint: File → Export → Create an Animated GIF.

REQUIREMENTS
    pip install pillow numpy
    + one way to render slides (the script picks the first that works):
      a) Windows with PowerPoint installed:  pip install pywin32      (best: real PowerPoint rendering)
      b) LibreOffice installed + PyMuPDF:    pip install pymupdf
      c) LibreOffice installed + Poppler's pdftoppm on the PATH
"""

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from xml.etree import ElementTree as ET

import numpy as np
from PIL import Image

# --------------------------------------------------------------------------------------------
# Settings you may want to tweak
# --------------------------------------------------------------------------------------------
WIDTH = 3200            # rendered slide width in pixels: render big, then shrink = crisp text (supersampling)
GIF_WIDTH = 1600        # final GIF width; ~130 px per inch when shown 12" wide on a slide
COLORS = 256            # GIF maximum; slides use flat colours, so 256 keeps them exact
CROP_TOP_INCHES = 1.42      # cut off title + rule + lead line (the GIF slide has its own); 0 = keep them
CROP_BOTTOM_INCHES = 0.56   # cut off the page number + RESTRICTED footer; 0 = keep it
HOLD_MS = 1300          # how long each step stays on screen
FIRST_HOLD_MS = 2000    # first step stays a bit longer
LAST_HOLD_MS = 3000     # last step stays longest, so the "result" can be read before the loop restarts
FADE_FRAMES = 3         # in-between frames for the cross-fade (0 = hard cut)
FADE_MS = 70            # duration of each in-between frame

# Per-section speed overrides (matched on the start of the section name)
SECTION_HOLD_MS = {
    "2": 1000,   # slide 2 has 27 steps; a bit faster keeps each GIF short
}

# Split a section into several GIFs: (file suffix, first slide, slide after the last), counted from 0
# inside the section. Section 2 = 1 intro + 9 happy steps, then 1 intro + 16 chaotic steps.
SPLIT_SECTIONS = {
    "2": [("happy-path", 0, 10), ("chaotic-path", 10, None)],
}

# The deck's own colours (from LOCKED.md). They are pinned into every GIF palette so flat fills,
# outlines and text keep their EXACT colour instead of drifting during colour reduction.
PIN_COLORS = [
    "FFFFFF", "2C2C2A", "5F5E5A", "444441", "888780", "B4B2A9", "D3D1C7", "EEEDE6", "F1EFE8",   # neutrals
    "EEEDFE", "534AB7", "3C3489", "7F77DD",                                                     # purple
    "E1F5EE", "0F6E56", "085041", "1D9E75",                                                     # teal / green
    "FAECE7", "993C1D", "712B13",                                                               # coral
    "FAEEDA", "854F0B", "633806", "BA7517",                                                     # amber
    "FCEBEB", "A32D2D", "791F1F",                                                               # red
]

SLIDE_W_INCHES = 13.333  # LAYOUT_WIDE; used to convert CROP_TOP_INCHES to pixels

NS = {
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "p14": "http://schemas.microsoft.com/office/powerpoint/2010/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


# --------------------------------------------------------------------------------------------
# Step 1 · RENDER every slide to PNG
# --------------------------------------------------------------------------------------------
def render_slides(pptx_path, work_dir):
    """Return a list of PNG paths, one per slide, in slide order."""
    for renderer in (render_with_powerpoint, render_with_libreoffice):
        try:
            pngs = renderer(pptx_path, work_dir)
            if pngs:
                print(f"  rendered {len(pngs)} slides with {renderer.__name__.replace('render_with_', '')}")
                return pngs
        except Exception as e:  # this renderer isn't available here; try the next one
            print(f"  ({renderer.__name__.replace('render_with_', '')} not used: {e})")
    sys.exit("Could not render slides. Install PowerPoint + pywin32 (Windows), or LibreOffice + pymupdf.")


def render_with_powerpoint(pptx_path, work_dir):
    """Windows only: ask PowerPoint itself to export each slide as a PNG (most faithful)."""
    if os.name != "nt":
        raise RuntimeError("not Windows")
    import win32com.client  # from pywin32

    app = win32com.client.Dispatch("PowerPoint.Application")
    pres = app.Presentations.Open(os.path.abspath(pptx_path), ReadOnly=True, WithWindow=False)
    height = int(WIDTH * pres.PageSetup.SlideHeight / pres.PageSetup.SlideWidth)
    pngs = []
    for i, slide in enumerate(pres.Slides, 1):
        out = os.path.join(work_dir, f"slide-{i:03d}.png")
        slide.Export(out, "PNG", WIDTH, height)
        pngs.append(out)
    pres.Close()
    return pngs


def render_with_libreoffice(pptx_path, work_dir):
    """Any OS: LibreOffice converts the deck to PDF, then each PDF page becomes a PNG."""
    soffice = shutil.which("soffice") or shutil.which("libreoffice") or r"C:\Program Files\LibreOffice\program\soffice.exe"
    if not os.path.exists(soffice) and not shutil.which(soffice):
        raise RuntimeError("LibreOffice not found")
    subprocess.run([soffice, "--headless", "--convert-to", "pdf", "--outdir", work_dir, pptx_path],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=600)
    pdf = os.path.join(work_dir, os.path.splitext(os.path.basename(pptx_path))[0] + ".pdf")

    try:  # PyMuPDF: pure Python, easiest on Windows
        import pymupdf
        doc = pymupdf.open(pdf)
        pngs = []
        for i, page in enumerate(doc, 1):
            zoom = WIDTH / page.rect.width
            out = os.path.join(work_dir, f"slide-{i:03d}.png")
            page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom)).save(out)
            pngs.append(out)
        return pngs
    except ImportError:  # fall back to Poppler's pdftoppm
        subprocess.run(["pdftoppm", "-png", "-scale-to-x", str(WIDTH), "-scale-to-y", "-1", pdf,
                        os.path.join(work_dir, "slide")], check=True)
        return sorted(os.path.join(work_dir, f) for f in os.listdir(work_dir) if f.startswith("slide") and f.endswith(".png"))


# --------------------------------------------------------------------------------------------
# Step 2 · GROUP slides by section (sections live in ppt/presentation.xml inside the .pptx)
# --------------------------------------------------------------------------------------------
def read_sections(pptx_path):
    """Return [(section_name, [slide_index, ...]), ...] using 0-based slide indexes."""
    with zipfile.ZipFile(pptx_path) as z:
        root = ET.fromstring(z.read("ppt/presentation.xml"))

    # Slide order: <p:sldIdLst><p:sldId id="256" .../> ... — the position in this list is the slide number
    order = [el.get("id") for el in root.find("p:sldIdLst", NS)]
    position = {sid: i for i, sid in enumerate(order)}

    # Sections: <p14:sectionLst><p14:section name="..."><p14:sldIdLst><p14:sldId id="256"/> ...
    sections = []
    for sec in root.iter(f"{{{NS['p14']}}}section"):
        ids = [el.get("id") for el in sec.iter(f"{{{NS['p14']}}}sldId")]
        sections.append((sec.get("name"), [position[i] for i in ids if i in position]))

    if not sections:  # deck without sections: treat the whole deck as one animation
        sections = [("deck", list(range(len(order))))]
    return sections


def slugify(name):
    """'2 · Why Single Agents Fail' -> '2-why-single-agents-fail'"""
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


# --------------------------------------------------------------------------------------------
# Step 3 · STITCH each section into a GIF
# --------------------------------------------------------------------------------------------
def load_frame(png):
    img = Image.open(png).convert("RGB")
    px_per_in = img.width / SLIDE_W_INCHES
    top, bottom = round(CROP_TOP_INCHES * px_per_in), round(CROP_BOTTOM_INCHES * px_per_in)
    img = img.crop((0, top, img.width, img.height - bottom))
    h = round(img.height * GIF_WIDTH / img.width)
    return img.resize((GIF_WIDTH, h), Image.LANCZOS)


def build_palette(sample):
    """256-colour palette = the deck's pinned colours + the best remaining colours found in the frames.

    Colour reduction averages similar colours, so beige F1EFE8 can come out as grey E9E8EA and white as
    FCFCFC. Pinning the deck colours, and snapping any automatic colour that sits right next to a pinned
    one onto it, keeps every flat fill exact. The remaining slots cover anti-aliased edges and cross-fades.
    """
    pins = [tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) for h in PIN_COLORS]
    free = COLORS - len(pins)
    auto = sample.quantize(colors=free, method=Image.Quantize.MAXCOVERAGE).getpalette()[: free * 3]
    entries = [tuple(auto[i:i + 3]) for i in range(0, len(auto), 3)]
    snapped = []
    for e in entries:
        near = min(pins, key=lambda p: sum((a - b) ** 2 for a, b in zip(e, p)))
        snapped.append(near if max(abs(a - b) for a, b in zip(e, near)) <= 10 else e)
    flat = [v for c in pins + snapped for v in c]
    pal_img = Image.new("P", (1, 1))
    pal_img.putpalette(flat + [0] * (768 - len(flat)))
    return pal_img


def to_indexed(frames, pal_img):
    """Map every pixel of every frame to its EXACT nearest palette colour.

    Pillow's own quantize(palette=...) uses a fast approximate lookup that can pick a colour a few
    shades off (beige F1EFE8 → EEEDE6). Here we:
      1. pack each pixel's RGB into one number (fast to sort and compare),
      2. collect the distinct colours used across ALL frames (a few thousand),
      3. find the nearest palette colour for each distinct colour once,
      4. look every pixel up in that table.
    """
    flat_pal = pal_img.getpalette()[: COLORS * 3]
    pal = np.array(flat_pal, dtype=np.int32).reshape(-1, 3)
    packed = []
    for f in frames:
        a = np.asarray(f, dtype=np.int32)
        packed.append((a[..., 0] << 16) | (a[..., 1] << 8) | a[..., 2])
    uniq = np.unique(np.concatenate([np.unique(p) for p in packed]))
    rgb = np.stack([(uniq >> 16) & 255, (uniq >> 8) & 255, uniq & 255], axis=1)
    lut = np.empty(len(uniq), dtype=np.uint8)
    for s in range(0, len(uniq), 20000):  # chunks keep memory small
        d = ((rgb[s:s + 20000, None, :] - pal[None, :, :]) ** 2).sum(axis=2)
        lut[s:s + 20000] = d.argmin(axis=1)
    out = []
    for p in packed:
        img = Image.fromarray(lut[np.searchsorted(uniq, p)], mode="P")
        img.putpalette(flat_pal)
        out.append(img)
    return out


def build_gif(pngs, out_path, hold_ms):
    steps = [load_frame(p) for p in pngs]
    frames, durations = [], []
    for i, img in enumerate(steps):
        # hold this step
        frames.append(img)
        durations.append(FIRST_HOLD_MS if i == 0 else LAST_HOLD_MS if i == len(steps) - 1 else hold_ms)
        # cross-fade to the next step (the last step fades back to the first, so the loop is smooth)
        nxt = steps[(i + 1) % len(steps)]
        for k in range(1, FADE_FRAMES + 1):
            frames.append(Image.blend(img, nxt, k / (FADE_FRAMES + 1)))
            durations.append(FADE_MS)

    # One shared palette for every frame (avoids colour flicker). Build it from ALL steps at FULL size,
    # so thin coloured lines and small text keep their exact colours.
    w, h = steps[0].size
    palette_src = Image.new("RGB", (w, h * len(steps)), "white")
    for j, img in enumerate(steps):
        palette_src.paste(img, (0, j * h))
    palette = build_palette(palette_src)
    gif_frames = to_indexed(frames, palette)

    gif_frames[0].save(out_path, save_all=True, append_images=gif_frames[1:], duration=durations, loop=0, optimize=True)
    return len(steps), sum(durations) / 1000


# --------------------------------------------------------------------------------------------
def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description="One animated GIF per section of a PowerPoint deck")
    ap.add_argument("pptx", nargs="?", default=os.path.join(here, "..", "Slides-01-06.pptx"))
    ap.add_argument("--out", default=os.path.join(here, "..", "gifs"), help="folder for the GIFs")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    print(f"Deck: {args.pptx}")
    sections = read_sections(args.pptx)
    print("Sections: " + ", ".join(f"{n} ({len(s)})" for n, s in sections))

    with tempfile.TemporaryDirectory() as work:
        pngs = render_slides(args.pptx, work)
        for name, idx in sections:
            if len(idx) < 2:
                print(f"  skip  {name}: one slide, nothing to animate")
                continue
            hold = next((ms for key, ms in SECTION_HOLD_MS.items() if name.startswith(key)), HOLD_MS)
            split = next((parts for key, parts in SPLIT_SECTIONS.items() if name.startswith(key)), None)
            jobs = [(f"{slugify(name)}-{suffix}", idx[a:b]) for suffix, a, b in split] if split else [(slugify(name), idx)]
            for file_name, part in jobs:
                out = os.path.join(args.out, file_name + ".gif")
                n, secs = build_gif([pngs[i] for i in part], out, hold)
                print(f"  wrote {os.path.relpath(out)}  ·  {n} steps, {secs:.0f}s loop, {os.path.getsize(out) / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
