# Multi-Agent Systems & Subgraph Architecture

Why single AI agents break down, why that's a system-design problem, and the core idea of multi-agent systems — a Morph-animated PowerPoint (slides 1–6) with speaker notes, plus interactive HTML versions of every visual.

## What's here

```
multi-agent-deck/
├── output/
│   └── Multi-Agent-Systems.pptx   ← the deck: 43 slides (presents as 6), Morph + speaker notes
├── deck/
│   ├── SPEAKER_NOTES.md           ← final speaker notes, slide by slide, with click cues and PPT slide numbers
│   ├── LOCKED.md                  ← locked content, design decisions, palette (source of truth for text)
│   └── slide2_steps.json          ← step data for the slide 2 animation
├── widgets/                       ← interactive HTML version of every visual
│   ├── index.html                 ← start here
│   ├── slide1_parent_graph.html … slide6_three_layouts.html
│   ├── extra_*.html               ← finish_reason loop, launch-post loop, trace (appendix)
│   ├── _base.css                  ← white-background palette
│   └── vendor/                    ← Tabler icon font (works offline)
├── assets/icons/                  ← icon PNGs used in the deck
├── build_deck.js                  ← generates the .pptx
└── add_morph.py                   ← adds Morph transitions to the generated .pptx
```

## Presenting

Open `output/Multi-Agent-Systems.pptx` in PowerPoint (Microsoft 365 or 2019+). Every step slide uses **Morph**, so each click animates the change. Sections map to the six slide titles:

| Section | Slides | What each click does |
|---|---|---|
| 1 · Title | 1 | — |
| 2 · Why Single Agents Fail | 2–28 | Dot moves node to node. Happy flow (9 steps), then chaotic flow (16 steps) |
| 3 · Thinking + Acting + Checking | 29–30 | Mixed context tape → blocks slide into three lanes |
| 4 · Failure Modes | 31–33 | Reveals thinking → acting → checking families |
| 5 · Root Cause | 34–39 | Applies one design principle per click until it's a multi-agent system |
| 6 · Core Idea | 40–43 | Supervisor → pipeline → peer swarm → why it's better |

Speaker notes are on every slide and match `deck/SPEAKER_NOTES.md` (click cues, timings, and answers to likely questions).

Morph needs PowerPoint 2019+ or Microsoft 365. Older PowerPoint, Keynote and Google Slides fall back to a fade. **Don't export to PDF to share it** (animation is lost). For a shareable preview, use PowerPoint → File → Export → Create a Video, which keeps Morph.

## Rebuilding the deck

Only needed if you change content in `deck/` or the script. Once you start hand-editing the `.pptx`, treat that file as the master and don't regenerate over it.

```bash
npm install pptxgenjs react react-dom react-icons sharp
node build_deck.js
python3 add_morph.py output/Multi-Agent-Systems.pptx
python3 apply_notes.py output/Multi-Agent-Systems.pptx
```

Edited the notes only? Rebuild all three steps (`apply_notes.py` expects a freshly built deck).

Morph pairs shapes by name. Every animated shape is named `!!something` and keeps the same name across its step slides; keep that if you edit by hand (Selection Pane in PowerPoint).

## Interactive visuals

Open `widgets/index.html` in a browser. Everything works offline. To share as a live link, turn on GitHub Pages for the repo and point it at the `widgets/` folder.

## Putting it on GitHub

```bash
cd multi-agent-deck
git init
git add .
git commit -m "Slides 1–6: deck, widgets, build script"
git branch -M main
git remote add origin https://github.com/<you>/multi-agent-deck.git   # create it as a PRIVATE repo first
git push -u origin main
```

The `.pptx` is committed as-is, so all Morph animations stay inside the file. Before pushing work material, check your organisation's policy on external repositories.
