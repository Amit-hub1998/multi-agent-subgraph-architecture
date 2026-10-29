# Multi-Agent Systems & Subgraph Architecture

Team deck, built in parts. Each folder is one block of slides from the deck structure.

| Folder | Slides | Status |
|---|---|---|
| `multi_agent_systems_slide_1_to_6/` | 1 Response Codes · 2 Why Single Agents Fail · 3 Why Single Agents Fail – Part 2 · 4 Failure Modes · 5 Root Cause · 6 Core Idea | 🔒 Locked (house style) |
| `gif-builder/` | Tools: any PPT slides → GIF, and GIF → slide with a Play button + PDF | 🛠 Demo-ready |
| `multi_agent_systems_slide_14_to_16/` | 14 Common Mistakes · 15 How to Choose the Right Pattern · 16 Design Principles · 16a LangChain and LangGraph · 16b Reading the Graph (click-through) | ✅ Ready (house style; Morph click-through on 16b) |

```
multi-agent-deck/
├── multi_agent_systems_slide_1_to_6/
│   ├── Slides-01-06.pptx          ← master: 43 slides, Morph — present this live
│   ├── Slides-01-06-GIF.pptx      ← short version: 9 slides, GIFs + Morph
│   ├── Slides-01-06-GIF.pdf       ← PDF export (keep gifs/ next to it)
│   ├── gifs/                      ← one GIF per animation
│   ├── SPEAKER_NOTES.md
│   └── source/                    ← scripts + data to rebuild (see below)
├── gif-builder/                   ← make_gif.py · add_gif_to_ppt.py · ppt_to_pdf.py · fix_pdf_links.py
└── multi_agent_systems_slide_14_to_16/
    ├── Slides-14-16.pptx          ← 11 slides: 14, 15, 16, 16a + 7 click-through 16b slides
    ├── SPEAKER_NOTES.md
    └── source/                    ← build_slides.js + add_morph.py
```

## Slides 1–6: master → GIFs → short deck → PDF

```mermaid
flowchart TD
    M["<b>Slides-01-06.pptx</b><br/>master · 43 slides · 6 sections"]:::file
    subgraph P["source/pptx_to_gifs.py"]
        R["1 · Render<br/>slides → PNG"]:::script --> G["2 · Group<br/>by section"]:::script --> S["3 · Stitch<br/>PNGs → GIF"]:::script
    end
    M --> R
    S --> GIFS["<b>gifs/*.gif</b><br/>happy path · chaotic path · core idea · …"]:::file
    M --> B["<b>source/build_gif_deck.py</b><br/>keep master slides + add GIF slides"]:::script
    GIFS --> B
    B --> D["<b>Slides-01-06-GIF.pptx</b><br/>9 slides · GIFs play · Morph kept"]:::file
    D --> E["PowerPoint: File → Export → Create PDF"]:::manual
    E --> F["<b>Slides-01-06-GIF.pdf</b><br/>still frames + ► Play links"]:::file
    F -. "click ► Play → opens gifs/…" .-> GIFS
    classDef file fill:#E1F5EE,stroke:#0F6E56,color:#085041
    classDef script fill:#EEEDFE,stroke:#534AB7,color:#3C3489
    classDef manual fill:#F1EFE8,stroke:#888780,color:#2C2C2A
```

*Purple: script you run · Teal: file · Grey: manual step.*

```bash
cd multi_agent_systems_slide_1_to_6/source
pip install pillow numpy python-pptx pymupdf     # + LibreOffice, or on Windows: pip install pywin32
python pptx_to_gifs.py                           # → ../gifs/
python build_gif_deck.py                         # → ../Slides-01-06-GIF.pptx
```
Then make the PDF with working Play links in one step:
```bash
python ../../gif-builder/ppt_to_pdf.py ../Slides-01-06-GIF.pptx
```
(Or export it yourself in PowerPoint with File → Export → Create PDF/XPS, then run `python ../../gif-builder/fix_pdf_links.py ../Slides-01-06-GIF.pdf`.)
Share the PDF together with its `gifs` folder.

Rebuilding the master itself (only if the content changes): `node build_deck.js && python add_morph.py && python apply_notes.py` (needs `npm install pptxgenjs react react-dom react-icons sharp`).

## Slides 14–16

```bash
cd multi_agent_systems_slide_14_to_16/source
node build_slides.js && python add_morph.py      # → ../Slides-14-16.pptx (notes from ../SPEAKER_NOTES.md; Morph + button links on 16b)
```

## Design system

House style (from the team deck): bold title + thin rule, one or two lead sentences, page number footer (the RESTRICTED/INTERNAL label comes from Office's sensitivity labelling, so the deck doesn't add its own). White background; light fill + darker outline + darkest text from one colour family. Purple = control/thinking, teal = agents/acting/fixes, coral = checking/mistakes, grey = neutral. Full palette in `multi_agent_systems_slide_1_to_6/source/LOCKED.md`.
