"""
fix_pdf_links.py — make the "► Play animation" links work in a PDF exported from PowerPoint.

    python fix_pdf_links.py                         # asks for the PDF
    python fix_pdf_links.py deck-with-gifs.pdf      # or give it directly
    python fix_pdf_links.py deck.pdf --base https://yourcompany.sharepoint.com/.../gifs/

Why it's needed:
    In PowerPoint the button links to "gifs/<file>.gif". When PowerPoint exports to PDF, it rewrites
    links to local files: as a full path (C:\\Users\\…\\gifs\\x.gif) or as a "launch this file" action.
    Edge's PDF viewer blocks launch actions, and full paths break on any other computer.

What it does:
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

from pypdf import PdfReader, PdfWriter
from pypdf.generic import DictionaryObject, NameObject, TextStringObject


def ask(question, default=None):
    hint = f" [{default}]" if default else ""
    answer = input(f"{question}{hint}: ").strip().strip('"').strip("'")
    return answer or (default or "")


def link_target(action):
    """Return the file/URL a link points to, whatever form PowerPoint used."""
    if action is None:
        return None
    if "/URI" in action:                                   # web-style link (may be file:///C:/…)
        return str(action["/URI"])
    f = action.get("/F")                                   # Launch / GoToR: a file specification
    if f is None:
        return None
    f = f.get_object()
    if isinstance(f, DictionaryObject):
        f = f.get("/UF") or f.get("/F")
    return str(f) if f is not None else None


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
            if not target or not target.lower().split("?")[0].endswith(".gif"):
                continue
            name = target.replace("\\", "/").rstrip("/").split("/")[-1]
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


def main():
    ap = argparse.ArgumentParser(description="Rewrite GIF links in a PowerPoint-exported PDF as plain links")
    ap.add_argument("pdf", nargs="?")
    ap.add_argument("--base", default="gifs/", help='link prefix (default "gifs/", relative to the PDF)')
    a = ap.parse_args()
    pdf = a.pdf or ask("PDF exported from PowerPoint (path)")
    if not os.path.isfile(pdf):
        sys.exit(f"Not found: {pdf}")
    base = a.base if a.base.endswith("/") else a.base + "/"
    changed, ok = fix(pdf, base)
    if not changed and ok:
        print(f"✓ All {ok} GIF link(s) are already plain links. Nothing to change.")
        return
    if not changed:
        print("No links to .gif files found (nothing changed). Was the PDF made with File → Export, not Print to PDF?")
        return
    for page, kind, old, new in changed:
        print(f"  page {page}: {kind} {old}  →  {new}")
    print(f"✓ Fixed {len(changed)} link(s) in {pdf}  (original kept as .orig.pdf)")
    if base == "gifs/":
        print("  Keep the gifs folder next to the PDF.")


if __name__ == "__main__":
    main()
