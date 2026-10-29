"""
ppt_to_pdf.py — PowerPoint → PDF with working "► Play animation" links, in one step.

    python ppt_to_pdf.py                       # asks for the PowerPoint
    python ppt_to_pdf.py Slides-01-06-GIF.pptx

Use it on a deck that already has its GIFs and Play buttons (e.g. made with add_gif_to_ppt.py).
It does not add or move anything; it:
    1. CHECKS which slides of the PowerPoint link to a GIF (the Play buttons)
    2. EXPORTS the PowerPoint to PDF (PowerPoint on Windows, otherwise LibreOffice), next to the PPT
    3. FIXES the GIF links PowerPoint rewrote, back to  gifs/<file>.gif   (see fix_pdf_links.py)
    4. CHECKS that each linked GIF exists in the gifs folder next to the PDF

Install:  pip install python-pptx pypdf      (+ pywin32 on Windows, or LibreOffice)
"""

import os
import sys

from pptx import Presentation
from pypdf import PdfReader

from add_gif_to_ppt import _export, ask
from fix_pdf_links import fix, is_gif, link_target, show_links


def gif_links_in_pptx(pptx):
    """(slide number, link) for every hyperlink in the deck that points to a .gif."""
    found = []
    for n, slide in enumerate(Presentation(pptx).slides, 1):
        for rel in slide.part.rels.values():
            if rel.reltype.endswith("/hyperlink") and rel.is_external and is_gif(rel.target_ref):
                found.append((n, rel.target_ref))
    return found


def gif_links_in_pdf(pdf):
    found = []
    for page_no, page in enumerate(PdfReader(pdf).pages, 1):
        for ref in page.get("/Annots") or []:
            annot = ref.get_object()
            if annot.get("/Subtype") == "/Link":
                target = link_target(annot.get("/A"))
                if is_gif(target):
                    found.append((page_no, target))
    return found


def main():
    print("\n=== ppt_to_pdf · PowerPoint → PDF with working Play links ===\n")
    pptx = sys.argv[1] if len(sys.argv) > 1 else ask("PowerPoint file (path)")
    pptx = pptx.strip('"').strip("'")
    if not os.path.isfile(pptx):
        sys.exit(f"Not found: {pptx}")

    # 1 · what the PowerPoint links to
    in_ppt = gif_links_in_pptx(pptx)
    print(f"1) PowerPoint: {len(in_ppt)} Play link(s)")
    for n, target in in_ppt:
        print(f"   slide {n}: {target}")
    if not in_ppt:
        sys.exit("   This deck has no links to GIFs. Add them first with add_gif_to_ppt.py "
                 "(or select the button text → Ctrl+K → type gifs/<file>.gif).")

    # 2 · export
    print("\n2) Exporting to PDF… (close the PDF if it's open)")
    pdf = _export(pptx)
    if not pdf or not os.path.isfile(pdf):
        sys.exit("   PDF export failed. Export it in PowerPoint, then run: python fix_pdf_links.py <file>.pdf")

    # 3 · fix the links PowerPoint rewrote
    changed, ok = fix(pdf, "gifs/")
    print(f"\n3) Links: {len(changed)} fixed, {ok} already fine")
    for page, kind, old, new in changed:
        print(f"   page {page}: {kind} {old}  →  {new}")

    # 4 · check
    in_pdf = gif_links_in_pdf(pdf)
    folder = os.path.dirname(os.path.abspath(pdf))
    print(f"\n4) PDF: {os.path.abspath(pdf)}")
    for page_no, uri in in_pdf:
        status = "web link" if uri.startswith("http") else (
            "found" if os.path.isfile(os.path.join(folder, uri)) else "MISSING: copy it into the gifs folder")
        print(f"   page {page_no}: {uri}  ({status})")
    if not in_pdf:
        print("   No Play links came through to the PDF. This is how the export wrote the links:")
        show_links(pdf)
        print("   Send this output to fix the script, or export with File → Export → Create PDF/XPS "
              "and run: python fix_pdf_links.py <file>.pdf")
        return
    print("\nShare the PDF together with its gifs folder.\n")


if __name__ == "__main__":
    main()
