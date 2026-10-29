"""
fix_pdf_links.py — make the "► Play animation" links work in a PDF exported from PowerPoint.

    python fix_pdf_links.py                         # asks for the PDF
    python fix_pdf_links.py deck-with-gifs.pdf      # or give it directly
    python fix_pdf_links.py deck.pdf --pptx deck.pptx  # also re-add links the export dropped
    python fix_pdf_links.py deck.pdf --base https://yourcompany.sharepoint.com/.../gifs/

Why it's needed:
    In PowerPoint the button links to "gifs/<file>.gif". When PowerPoint exports to PDF, it rewrites
    links to local files: as a full path (C:\\Users\\…\\gifs\\x.gif) or as a "launch this file" action.
    Edge's PDF viewer blocks launch actions, and full paths break on any other computer.

What it does:
    (with --pptx) Adds a link on every Play button the export left out, at the button's position in the PPT.
    Finds every link in the PDF that points to a .gif and rewrites it as a plain web-style link:
        gifs/<file>.gif            (default: relative to the PDF, so keep the gifs folder next to it)
        <base><file>.gif           (with --base: e.g. a SharePoint/OneDrive folder, works anywhere)
    The PDF is fixed in place; a copy of the original is kept as <name>.orig.pdf.

Install:  pip install pypdf
"""

import argparse
import os
import shutil
import sys
from urllib.parse import unquote

from pypdf import PdfReader, PdfWriter
from pypdf.generic import (ArrayObject, DictionaryObject, FloatObject, NameObject, NumberObject,
                           TextStringObject)


def ask(question, default=None):
    hint = f" [{default}]" if default else ""
    answer = input(f"{question}{hint}: ").strip().strip('"').strip("'")
    return answer or (default or "")


def _filespec(f):
    """A PDF file specification: a plain string, or a dictionary with /UF, /F or /DOS."""
    if f is None:
        return None
    f = f.get_object()
    if isinstance(f, DictionaryObject):
        f = f.get("/UF") or f.get("/F") or f.get("/DOS") or f.get("/Unix")
        f = f.get_object() if f is not None else None
    return str(f) if f is not None else None


def link_target(action):
    """Return the file/URL a link points to, whatever form PowerPoint used:
    /URI (web or file:///), /Launch or /GoToR with /F, or /Launch with a Windows /Win {/F …} block."""
    if action is None:
        return None
    action = action.get_object()
    if "/URI" in action:
        target = str(action["/URI"])
    else:
        target = _filespec(action.get("/F"))
        if target is None:
            for key in ("/Win", "/Unix", "/Mac"):          # platform-specific launch parameters
                block = action.get(key)
                if block is not None:
                    target = _filespec(block.get_object().get("/F"))
                    if target:
                        break
    if target is None and action.get("/Next") is not None:  # chained actions
        nxt = action["/Next"].get_object()
        for a in (nxt if isinstance(nxt, list) else [nxt]):
            target = link_target(a)
            if target:
                break
    return unquote(target) if target else None


def is_gif(target):
    return bool(target) and target.lower().split("?")[0].split("#")[0].rstrip("/").endswith(".gif")


def fix(pdf, base):
    reader = PdfReader(pdf)
    writer = PdfWriter(clone_from=reader)
    changed, ok = [], 0
    for page_no, page in enumerate(writer.pages, 1):
        for ref in page.get("/Annots") or []:
            annot = ref.get_object()
            if annot.get("/Subtype") != "/Link":
                continue
            action = annot.get("/A")
            action = action.get_object() if action is not None else None
            target = link_target(action)
            if not is_gif(target):
                continue
            name = target.split("?")[0].split("#")[0].replace("\\", "/").rstrip("/").split("/")[-1]
            new = base + name
            if target == new:
                ok += 1
                continue                                   # already a plain link: leave it
            annot[NameObject("/A")] = DictionaryObject({
                NameObject("/S"): NameObject("/URI"),
                NameObject("/URI"): TextStringObject(new),
            })
            changed.append((page_no, action.get("/S") if action else "?", target, new))
    if not changed:
        return [], ok
    backup = os.path.splitext(pdf)[0] + ".orig.pdf"
    shutil.copy2(pdf, backup)
    tmp = pdf + ".tmp"
    with open(tmp, "wb") as f:
        writer.write(f)
    os.replace(tmp, pdf)
    return changed, ok


def _shape_links(shapes, dx=0, dy=0):
    """(left, top, width, height, link) in EMU for every shape whose click or text links to a .gif."""
    out = []
    for sh in shapes:
        if sh.shape_type == 6:                                     # group: look inside
            out += _shape_links(sh.shapes, dx, dy)
            continue
        link = None
        try:
            if sh.click_action.hyperlink.address:
                link = sh.click_action.hyperlink.address
        except Exception:
            pass
        if not link and sh.has_text_frame:
            for p in sh.text_frame.paragraphs:
                for r in p.runs:
                    if r.hyperlink.address:
                        link = r.hyperlink.address
        if is_gif(link) and None not in (sh.left, sh.top, sh.width, sh.height):
            out.append((sh.left + dx, sh.top + dy, sh.width, sh.height, link))
    return out


def add_links_from_pptx(pdf, pptx, base="gifs/"):
    """PowerPoint's PDF export can drop links to local files entirely. Put them back:
    for every Play button in the PowerPoint, add a clickable link on the same spot of the PDF page.
    Pages that already have that link are left alone. Returns the links added."""
    from pptx import Presentation
    prs = Presentation(pptx)
    sw, sh = prs.slide_width, prs.slide_height
    reader = PdfReader(pdf)
    writer = PdfWriter(clone_from=reader)

    visible = [s for s in prs.slides if s._element.get("show") != "0"]   # hidden slides aren't exported
    if len(visible) != len(writer.pages):
        visible = list(prs.slides)
    added = []
    for page_no, (slide, page) in enumerate(zip(visible, writer.pages), 1):
        have = set()
        for ref in page.get("/Annots") or []:
            annot = ref.get_object()
            if annot.get("/Subtype") == "/Link":
                t = link_target(annot.get("/A"))
                if is_gif(t):
                    have.add(t.replace("\\", "/").split("/")[-1])
        box = page.mediabox
        x0, y0 = float(box.left), float(box.bottom)
        kx, ky = float(box.width) / sw, float(box.height) / sh
        for left, top, w, h, link in _shape_links(slide.shapes):
            name = link.replace("\\", "/").split("/")[-1]
            if name in have:
                continue
            rect = [x0 + left * kx, y0 + float(box.height) - (top + h) * ky,
                    x0 + (left + w) * kx, y0 + float(box.height) - top * ky]
            annot = DictionaryObject({
                NameObject("/Type"): NameObject("/Annot"),
                NameObject("/Subtype"): NameObject("/Link"),
                NameObject("/Rect"): ArrayObject([FloatObject(round(v, 2)) for v in rect]),
                NameObject("/Border"): ArrayObject([NumberObject(0)] * 3),
                NameObject("/A"): DictionaryObject({
                    NameObject("/S"): NameObject("/URI"),
                    NameObject("/URI"): TextStringObject(base + name)}),
            })
            if "/Annots" not in page:
                page[NameObject("/Annots")] = ArrayObject()
            page["/Annots"].get_object().append(writer._add_object(annot))
            have.add(name)
            added.append((page_no, base + name))
    if added:
        tmp = pdf + ".tmp"
        with open(tmp, "wb") as f:
            writer.write(f)
        os.replace(tmp, pdf)
    return added


def show_links(pdf, limit=15):
    """Print every link in the PDF as PowerPoint wrote it (for diagnosing)."""
    n = 0
    for page_no, page in enumerate(PdfReader(pdf).pages, 1):
        for ref in page.get("/Annots") or []:
            annot = ref.get_object()
            if annot.get("/Subtype") != "/Link":
                continue
            n += 1
            if n <= limit:
                action = annot.get("/A")
                raw = dict(action.get_object()) if action is not None else {"/Dest": annot.get("/Dest")}
                print(f"  page {page_no}: {raw}")
    if n == 0:
        print("  no links at all: the hyperlinks were not exported")
    elif n > limit:
        print(f"  … {n - limit} more")


def main():
    ap = argparse.ArgumentParser(description="Rewrite GIF links in a PowerPoint-exported PDF as plain links")
    ap.add_argument("pdf", nargs="?")
    ap.add_argument("--base", default="gifs/", help='link prefix (default "gifs/", relative to the PDF)')
    ap.add_argument("--pptx", help="the PowerPoint the PDF came from: re-adds Play links the export dropped")
    a = ap.parse_args()
    pdf = a.pdf or ask("PDF exported from PowerPoint (path)")
    if not os.path.isfile(pdf):
        sys.exit(f"Not found: {pdf}")
    base = a.base if a.base.endswith("/") else a.base + "/"
    changed, ok = fix(pdf, base)
    if a.pptx:
        for page, link in add_links_from_pptx(pdf, a.pptx.strip('"'), base):
            changed.append((page, "(missing)", "", link))
    if not changed and ok:
        print(f"✓ All {ok} GIF link(s) are already plain links. Nothing to change.")
        return
    if not changed:
        print("No links to .gif files found (nothing changed). Was the PDF made with File → Export, not Print to PDF?")
        print("What the PDF does contain:")
        show_links(pdf)
        print("If the PowerPoint dropped them, add them back from the deck:  python fix_pdf_links.py <file>.pdf --pptx <deck>.pptx")
        return
    for page, kind, old, new in changed:
        print(f"  page {page}: {kind} {old}  →  {new}")
    print(f"✓ Fixed {len(changed)} link(s) in {pdf}  (original kept as .orig.pdf)")
    if base == "gifs/":
        print("  Keep the gifs folder next to the PDF.")


if __name__ == "__main__":
    main()
