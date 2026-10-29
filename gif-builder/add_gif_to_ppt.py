"""
add_gif_to_ppt.py — put an animated GIF on a slide, with a "► Play animation" button under it.

    python add_gif_to_ppt.py                # asks for everything
    python add_gif_to_ppt.py --pptx deck.pptx --slide 3 --gif gifs/demo.gif --pdf

It asks for:
    1. the PowerPoint file, and where to save the result (the original is never changed)
    2. which slide the GIF goes on
    3. the GIF: a file, or a folder to pick one from
    4. on that slide, or on a new slide after it
       … then offers to add another GIF (back to 2)
    5. whether to export a PDF too

What it does:
    • places the GIF (it plays by itself in PowerPoint) and a Play button under it
    • the button links to  gifs/<file>.gif  next to the saved PowerPoint, and the GIF is copied there,
      so the link keeps working in the exported PDF (a PDF can't animate; the link opens the GIF)
    • the GIF and button are normal shapes: move, resize or restyle them in PowerPoint afterwards
      (look for "GIF …" and "Play button …" in Home → Arrange → Selection Pane)

No VBA or macros: python-pptx edits the .pptx file directly.

Install:  pip install python-pptx pypdf      (+ pywin32 on Windows, or LibreOffice, for the PDF export)

Exporting the PDF yourself from PowerPoint later?  Run  python fix_pdf_links.py <file>.pdf  afterwards.
"""

import argparse
import glob
import os
import shutil
import subprocess
import sys

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

# Button look (change freely)
BTN_TEXT = "►  Play animation"
BTN_FILL, BTN_LINE, BTN_TEXT_COLOR = "EEEDFE", "534AB7", "3C3489"
BTN_W, BTN_H = 1.9, 0.34
EMU = 914400


def ask(question, default=None):
    hint = f" [{default}]" if default not in (None, "") else ""
    answer = input(f"{question}{hint}: ").strip().strip('"').strip("'")
    return answer or (str(default) if default is not None else "")


def yes(question, default=False):
    return ask(f"{question} (y/n)", "y" if default else "n").lower().startswith("y")


# ---------------------------------------------------------------- pick the GIF
def pick_gif(path):
    """A GIF file, or a folder: list the GIFs in it and let the user choose one."""
    if os.path.isfile(path) and path.lower().endswith(".gif"):
        return path
    if os.path.isdir(path):
        gifs = sorted(glob.glob(os.path.join(path, "*.gif")))
        if not gifs:
            sys.exit(f"No .gif files in {path}")
        for i, g in enumerate(gifs, 1):
            print(f"     {i}) {os.path.basename(g)}")
        n = int(ask("   Which GIF (number)", 1))
        return gifs[n - 1]
    sys.exit(f"Not a .gif file or folder: {path}")


def gif_size(path):
    with open(path, "rb") as f:
        head = f.read(10)
    if head[:3] != b"GIF":
        sys.exit(f"Not a GIF: {path}")
    return int.from_bytes(head[6:8], "little"), int.from_bytes(head[8:10], "little")


# ---------------------------------------------------------------- place GIF + button
def new_slide_after(prs, n):
    """Add an empty slide (same layout as slide n, placeholders removed) right after slide n."""
    ref = prs.slides[n - 1]
    slide = prs.slides.add_slide(ref.slide_layout)
    for ph in list(slide.placeholders):
        ph._element.getparent().remove(ph._element)
    ids = prs.slides._sldIdLst
    el = ids[-1]
    ids.remove(el)
    ids.insert(n, el)                      # position n (0-based) = right after slide n
    return slide


def place(prs, slide, gif_path, link, top_in):
    sw, sh = prs.slide_width / EMU, prs.slide_height / EMU
    box_w, box_h = sw - 1.0, sh - top_in - 0.95          # leave room for the button + footer
    w0, h0 = gif_size(gif_path)
    k = min(box_w / w0, box_h / h0)
    w, h = w0 * k, h0 * k
    x, y = (sw - w) / 2, top_in
    name = os.path.basename(gif_path)

    pic = slide.shapes.add_picture(gif_path, Inches(x), Inches(y), Inches(w), Inches(h))   # stays animated
    pic.name = f"GIF {name}"

    btn = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y + h + 0.12), Inches(BTN_W), Inches(BTN_H))
    btn.name = f"Play button {name}"
    btn.adjustments[0] = 0.5
    btn.fill.solid(); btn.fill.fore_color.rgb = RGBColor.from_string(BTN_FILL)
    btn.line.color.rgb = RGBColor.from_string(BTN_LINE); btn.line.width = Pt(1)
    btn.shadow.inherit = False
    tf = btn.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = BTN_TEXT
    run.font.size, run.font.bold = Pt(11), True
    run.font.color.rgb = RGBColor.from_string(BTN_TEXT_COLOR)
    run.hyperlink.address = link            # relative link, e.g. "gifs/demo.gif"
    return w, h


# ---------------------------------------------------------------- PDF export
def export_pdf(pptx):
    pdf = _export(pptx)
    if pdf:
        from fix_pdf_links import fix          # PowerPoint rewrites file links; put them back to gifs/<file>
        fix(pdf, "gifs/")
    return pdf


def _export(pptx):
    pdf = os.path.splitext(pptx)[0] + ".pdf"
    if os.name == "nt":
        try:
            import win32com.client
            app = win32com.client.Dispatch("PowerPoint.Application")
            pres = app.Presentations.Open(os.path.abspath(pptx), ReadOnly=True, WithWindow=False)
            pres.SaveAs(os.path.abspath(pdf), 32)        # 32 = PDF; keeps the hyperlinks
            pres.Close()
            return pdf
        except Exception as e:
            print(f"  (PowerPoint export not used: {e})")
    soffice = shutil.which("soffice") or shutil.which("libreoffice") or r"C:\Program Files\LibreOffice\program\soffice.exe"
    if shutil.which(soffice) or os.path.exists(soffice):
        subprocess.run([soffice, "--headless", "--convert-to", "pdf", "--outdir", os.path.dirname(os.path.abspath(pptx)),
                        os.path.abspath(pptx)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=600)
        return pdf
    print("  No PowerPoint (pywin32) or LibreOffice found: export it yourself with File → Export → Create PDF.")
    return None


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description="Add an animated GIF + Play button to a PowerPoint slide")
    ap.add_argument("--pptx"); ap.add_argument("--slide", type=int); ap.add_argument("--gif")
    ap.add_argument("--new-slide", action="store_true", help="put the GIF on a new slide after --slide")
    ap.add_argument("--out", help="save as (default: <name>-with-gifs.pptx)")
    ap.add_argument("--pdf", action="store_true", help="also export a PDF")
    a = ap.parse_args()
    scripted = all([a.pptx, a.slide, a.gif])

    print("\n=== add_gif_to_ppt · GIF + Play button → PowerPoint ===\n")
    src = a.pptx or ask("1) PowerPoint file (path)")
    if not os.path.isfile(src):
        sys.exit(f"Not found: {src}")
    stem, ext = os.path.splitext(src)
    out = a.out or (src if scripted is False and stem.endswith("-with-gifs") else f"{stem}-with-gifs{ext}")
    if not a.out and not scripted:
        out = ask("   Save the result as", out)
    out_dir = os.path.dirname(os.path.abspath(out))
    gif_dir = os.path.join(out_dir, "gifs")
    os.makedirs(gif_dir, exist_ok=True)
    prs = Presentation(src)
    added = []

    while True:
        total = len(prs.slides)
        n = a.slide or int(ask(f"2) Put the GIF on slide (1–{total})", 1))
        if not 1 <= n <= total:
            sys.exit(f"Slide must be between 1 and {total}.")
        gif = pick_gif(a.gif or ask("3) GIF file, or a folder of GIFs", os.path.join(out_dir, "gifs")))
        new = a.new_slide or (not scripted and ask("4) [1] on slide %d   [2] on a new slide after it" % n, 1) == "2")

        dst = os.path.join(gif_dir, os.path.basename(gif))
        if os.path.abspath(gif) != os.path.abspath(dst):
            shutil.copy2(gif, dst)                       # the link always points to gifs/ next to the PPT
        slide = new_slide_after(prs, n) if new else prs.slides[n - 1]
        place(prs, slide, dst, "gifs/" + os.path.basename(gif), 0.5 if new else 1.5)
        where = f"new slide {n + 1}" if new else f"slide {n}"
        added.append(f"{os.path.basename(gif)} → {where}")
        print(f"   ✓ added {os.path.basename(gif)} to {where}")
        if scripted or not yes("   Add another GIF?"):
            break
        a.slide = a.gif = None

    prs.save(out)
    print(f"\n✓ Saved: {os.path.abspath(out)}")
    for line in added:
        print(f"    {line}")
    print(f"  GIFs + links: {gif_dir}")

    if a.pdf or (not scripted and yes("5) Export a PDF too?")):
        pdf = export_pdf(out)
        if pdf:
            print(f"✓ PDF: {os.path.abspath(pdf)}  (keep the gifs folder next to it for the Play links)")
    print()


if __name__ == "__main__":
    main()
