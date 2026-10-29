"""
ppt_to_pdf.py — PowerPoint → PDF with working "► Play animation" links, in one step.

    python ppt_to_pdf.py                       # asks for the PowerPoint
    python ppt_to_pdf.py Slides-01-06-GIF.pptx

Use it on a deck that already has its GIFs and Play buttons (e.g. made with add_gif_to_ppt.py).
It does not add or move anything; it:
    1. EXPORTS the PowerPoint to PDF (PowerPoint on Windows, otherwise LibreOffice), next to the PPT
    2. FIXES the GIF links PowerPoint rewrote, back to  gifs/<file>.gif   (see fix_pdf_links.py)
    3. CHECKS that each linked GIF exists in the gifs folder next to the PDF

Install:  pip install python-pptx pypdf      (+ pywin32 on Windows, or LibreOffice)
"""

import os
import sys

from add_gif_to_ppt import ask, export_pdf
from pypdf import PdfReader


def main():
    print("\n=== ppt_to_pdf · PowerPoint → PDF with working Play links ===\n")
    pptx = sys.argv[1] if len(sys.argv) > 1 else ask("PowerPoint file (path)")
    pptx = pptx.strip('"').strip("'")
    if not os.path.isfile(pptx):
        sys.exit(f"Not found: {pptx}")

    print("Exporting and fixing links…")
    pdf = export_pdf(pptx)                      # export + fix_pdf_links, as in add_gif_to_ppt.py
    if not pdf or not os.path.isfile(pdf):
        sys.exit("PDF export failed. Export it in PowerPoint, then run: python fix_pdf_links.py <file>.pdf")

    folder = os.path.dirname(os.path.abspath(pdf))
    links = []
    for page_no, page in enumerate(PdfReader(pdf).pages, 1):
        for ref in page.get("/Annots") or []:
            action = ref.get_object().get("/A")
            uri = str(action.get_object().get("/URI", "")) if action is not None else ""
            if uri.lower().endswith(".gif"):
                links.append((page_no, uri))

    print(f"\n✓ PDF: {os.path.abspath(pdf)}")
    if not links:
        print("  (no Play links found in this deck)")
    for page_no, uri in links:
        local = os.path.join(folder, uri) if not uri.startswith("http") else None
        status = "web link" if local is None else ("found" if os.path.isfile(local) else "MISSING: copy it into the gifs folder")
        print(f"  page {page_no}: {uri}  ({status})")
    print("\nShare the PDF together with its gifs folder.\n")


if __name__ == "__main__":
    main()
