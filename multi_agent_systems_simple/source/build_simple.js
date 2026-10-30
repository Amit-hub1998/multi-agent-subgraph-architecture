// build_simple.js — builds ../Multi-Agent-Systems-Simple.pptx: the simpler, static version of slides 1–6
// for a wider audience. No Morph, no animation. Built chapter by chapter.
// Run (from this folder):  node build_simple.js
// Speaker notes come from ../SPEAKER_NOTES.md ("## Slide 2a — …" sections).

const fs = require("fs");
const os = require("os");
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const tb = require("react-icons/tb");
const sharp = require("sharp");

const ROOT = __dirname;
const OUT = process.argv[2] || path.join(ROOT, "..", "Multi-Agent-Systems-Simple.pptx");
const ICON_DIR = path.join(os.tmpdir(), "deck-icons");
fs.mkdirSync(ICON_DIR, { recursive: true });

// ---------- Design system (same as the full deck, white background) ----------
const C = {
  purple: { f: "EEEDFE", o: "534AB7", t: "3C3489" },
  teal:   { f: "E1F5EE", o: "0F6E56", t: "085041" },
  coral:  { f: "FAECE7", o: "993C1D", t: "712B13" },
  amber:  { f: "FAEEDA", o: "854F0B", t: "633806" },
  gray:   { f: "F1EFE8", o: "888780", t: "2C2C2A" },
};
const TEXT = "2C2C2A", TEXT2 = "5F5E5A", HAIR = "D3D1C7";
const FONT = "Calibri", BODY = "Arial";

async function icon(name, color) {
  const file = path.join(ICON_DIR, `${name}_${color}.png`);
  if (!fs.existsSync(file)) {
    let svg = renderToStaticMarkup(React.createElement(tb[name], { size: 256 }));
    svg = svg.replace(/currentColor/g, "#" + color);
    if (!svg.includes("xmlns=")) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    await sharp(Buffer.from(svg)).resize(256, 256).png().toFile(file);
  }
  return file;
}
function box(sl, text, x, y, w, h, o = {}) {
  const col = o.col || C.gray;
  sl.addText(text || "", { shape: o.oval ? "ellipse" : "roundRect", x, y, w, h, rectRadius: o.oval ? undefined : (o.r ?? 0.08),
    fill: { color: o.fill || col.f }, line: { color: o.line || col.o, width: o.lw || 1, dashType: o.dash ? "dash" : "solid" },
    fontFace: o.mono ? "Consolas" : FONT, fontSize: o.fs || 12, color: o.color || col.t, bold: !!o.bold,
    align: o.align || "center", valign: o.valign || "middle", margin: o.margin ?? 4, objectName: o.name });
}
function txt(sl, text, x, y, w, h, o = {}) {
  sl.addText(text, { x, y, w, h, fontFace: o.font || FONT, fontSize: o.fs || 14, color: o.color || TEXT, bold: !!o.bold, italic: !!o.italic,
    align: o.align || "left", valign: o.valign || "top", margin: o.margin ?? 0, isTextBox: true, paraSpaceAfter: o.psa || 0, objectName: o.name });
}
// House style: bold title, thin grey rule, one or two lead sentences, page number (Office adds the classification label).
function header(sl, title, lead) {
  txt(sl, title, 0.45, 0.22, 12.4, 0.58, { fs: 26, bold: true, color: "1A1A1A", valign: "bottom" });
  sl.addShape("line", { x: 0.45, y: 0.88, w: 12.43, h: 0, line: { color: "7F7F7F", width: 0.75 } });
  if (lead) txt(sl, lead, 0.45, 0.97, 12.4, 0.48, { font: BODY, fs: 14, color: "404040" });
  sl.slideNumber = { x: 6.17, y: 6.98, w: 1.0, h: 0.22, fontFace: BODY, fontSize: 10, color: "595959", align: "center" };
}
function line(sl, x1, y1, x2, y2, o = {}) {
  sl.addShape("line", { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
    flipH: x2 < x1, flipV: y2 < y1, line: Object.assign({ color: o.color || "5F5E5A", width: o.width || 1.5, dashType: o.dash ? "dash" : "solid" }, o.end === false ? {} : { endArrowType: "triangle" }) });
}
function source(sl, text) {
  txt(sl, "Sources: " + text, 0.45, 6.68, 12.4, 0.3, { font: BODY, fs: 9, color: "7F7F7F" });
}
function notes() {
  const md = fs.readFileSync(path.join(ROOT, "..", "SPEAKER_NOTES.md"), "utf8");
  const out = {};
  md.split(/\n## Slide /).slice(1).forEach((sec) => {
    const id = sec.match(/^([\w-]+)/)[1];
    out[id] = sec.split("\n").slice(1).filter((l) => !l.startsWith("*~") && l.trim() !== "---").join("\n").replace(/\*\*|`/g, "").trim();
  });
  return out;
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 × 7.5 in
  pres.title = "Multi-Agent Systems · Simple version";
  pres.author = "Amitkumar";
  pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
  const NOTE = notes();
  const newSlide = (sec) => { const s = pres.addSlide({ sectionTitle: sec }); s.background = { color: "FFFFFF" }; return s; };

  // =========================== CHAPTER 2 · Why single agents fail ===========================
  pres.addSection({ title: "2 · Why Single Agents Fail" });

  // ---- Why single agents fail: four cards ----
  {
    const sl = newSlide("2 · Why Single Agents Fail");
    header(sl, "Why Single Agents Fail",
      "A single agent is one AI model doing every job on its own: planning, using tools and checking its own work. That works for small tasks, but breaks down as tasks grow.");
    const R = [
      ["TbEyeOff", "Ego blindness", "It reviews its own work with the same logic that made the mistake, so it calls it correct.",
        "Like proofreading your own essay: you miss your own mistakes."],
      ["TbInfinity", "No limits", "Nothing tells it when to stop: no step limit, no budget, no time-out.",
        "A five-minute task still running an hour later."],
      ["TbStack2", "Context overcrowding", "Raw data, logs and API responses pile up and bury the original instructions.",
        "Told “keep it under one page” at the start, it hands back five pages."],
      ["TbMasksTheater", "Prompt dilution", "One prompt can't be a creative writer and a strict compliance officer at once.",
        "Asked to be bold and careful at once, it ends up bland."],
      ["TbTool", "Too many tools", "It must choose from dozens of tools at every step, and each extra tool is another way to choose wrong.",
        "It emails the customer when it meant to search the database."],
      ["TbHourglass", "One step at a time", "It works through every step in sequence; if one step hangs, everything stops.",
        "One slow website holds up the whole report."],
    ];
    const W = (12.43 - 2 * 0.2) / 3, H = 2.38, GX = 0.2, GY = 0.2, X0 = 0.45, Y0 = 1.62;
    for (let i = 0; i < R.length; i++) {
      const [ic, title, fail, seen] = R[i];
      const x = X0 + (i % 3) * (W + GX), y = Y0 + Math.floor(i / 3) * (H + GY);
      box(sl, "", x, y, W, H, { fill: "FFFFFF", line: HAIR, r: 0.1 });
      box(sl, "", x + 0.25, y + 0.22, 0.58, 0.58, { oval: true, col: C.coral, lw: 0.75 });
      sl.addImage({ path: await icon(ic, C.coral.o), x: x + 0.385, y: y + 0.355, w: 0.31, h: 0.31 });
      txt(sl, title, x + 1.0, y + 0.22, W - 1.2, 0.58, { fs: 18, bold: true, color: C.coral.t, valign: "middle" });
      txt(sl, fail, x + 0.25, y + 0.95, W - 0.5, 0.72, { fs: 13, color: TEXT });
      box(sl, [{ text: "What it looks like  ", options: { bold: true } }, { text: seen, options: { italic: true } }], x + 0.25, y + 1.68, W - 0.5, 0.5,
        { col: C.gray, lw: 0.5, fs: 12, align: "left", margin: 7, r: 0.06, color: TEXT });
    }
    sl.addNotes(NOTE["2"] || "");
  }

  // ---- Why single agents fail – Part 2: thinking, acting and checking mixed ----
  pres.addSection({ title: "3 · Why Single Agents Fail – Part 2" });
  {
    const sl = newSlide("3 · Why Single Agents Fail – Part 2");
    header(sl, "Why Single Agents Fail – Part 2",
      "Every agent has three jobs: thinking, acting and checking. Here is one everyday task, with a single agent doing all three in one loop, and where its decisions go wrong.");

    // One everyday task, step by step through the single agent's loop
    box(sl, [{ text: "Task  ", options: { bold: true } }, { text: "“Send the October sales report to the finance team.”" }],
      0.45, 1.62, 12.43, 0.46, { col: C.gray, fs: 14, align: "left", margin: 12, r: 0.08, color: TEXT });
    const JOB = { T: ["Thinking", C.purple], A: ["Acting", C.teal], K: ["Checking", C.coral] };
    const STEPS = [
      ["T", "I need October sales, so I'll query the sales database.", ""],
      ["A", "Query returns 48,000 rows. Buried inside: “warning: 3 regions missing”.", "Warning lost in raw data"],
      ["T", "Totals look low… maybe I should fix the date format first.", "Drifts from the goal"],
      ["A", "Rewrites the query → error. Retries the same query → same error.", "Stuck in a loop"],
      ["T", "I'll use September's data instead, so the report can go out.", "Wrong decision"],
      ["K", "Does the report match my plan? Yes ✓", "Checks its own work"],
      ["A", "Emails the report to finance.", ""],
    ];
    const y0 = 2.2, rh = 0.46, rg = 0.075, tx = 9.6;
    STEPS.forEach(([j, what, tag], i) => {
      const y = y0 + i * (rh + rg), [name, col] = JOB[j];
      txt(sl, String(i + 1), 0.45, y, 0.3, rh, { fs: 13, bold: true, color: TEXT2, valign: "middle", align: "center" });
      box(sl, name, 0.85, y, 1.35, rh, { col, fs: 13, bold: true, r: 0.23, margin: 0 });
      box(sl, what, 2.3, y, tx - 2.45, rh, { fill: tag === "Wrong decision" ? C.coral.f : "FFFFFF", line: tag ? C.coral.o : HAIR, lw: tag === "Wrong decision" ? 2 : tag ? 1 : 0.75, fs: 13.5,
        align: "left", margin: 10, r: 0.06, color: TEXT });
      if (tag) {
        line(sl, tx - 0.15, y + rh / 2, tx + 0.12, y + rh / 2, { color: C.coral.o, width: 1.25 });
        const key = tag === "Wrong decision";
        box(sl, tag, tx + 0.16, y + 0.05, 12.88 - tx - 0.16, rh - 0.1, key
          ? { fill: C.coral.o, line: C.coral.o, color: "FFFFFF", fs: 12.5, bold: true, r: 0.18, margin: 0 }
          : { col: C.coral, fs: 12.5, bold: true, r: 0.18, margin: 0 });
      }
    });
    box(sl, [{ text: "Result  ", options: { bold: true } }, { text: "Finance receives September's numbers labelled as October's, and the agent marks the task done." }],
      0.45, 6.02, 12.43, 0.5, { fill: C.coral.o, line: C.coral.o, color: "FFFFFF", fs: 14.5, align: "left", margin: 12, r: 0.08 });
    sl.addNotes(NOTE["3"] || "");
  }

  // ---- Failure modes: the full-deck slide, shown in its final state (no reveals) ----
  pres.addSection({ title: "4 · Failure Modes" });
  {
    const sl = newSlide("4 · Failure Modes");
    header(sl, "Failure Modes: What You Observe",
      "Too much work in one loop shows up as recognisable errors, like picking the wrong tool. They fall into three families: thinking, acting and checking.");
    const FAM = [
      ["Thinking failures", "TbBrain", C.purple, [
        ["Goal drift", "TbRouteOff", "wanders off the original ask", "long, crowded context", "asked to summarise a report, starts rewriting it"],
        ["Wrong tool", "TbTool", "right intent, wrong action", "too many similar tools", "books the meeting instead of checking the calendar"]]],
      ["Acting failures", "TbPlayerPlay", C.teal, [
        ["Infinite loop", "TbRepeat", "same step again and again", "no step limit, no memory of failures", "keeps re-searching the same flight"],
        ["Error cascade", "TbStack2", "one bad step spoils the rest", "no isolation or checkpoints", "wrong customer ID used in every later step"]]],
      ["Checking failures", "TbChecklist", C.coral, [
        ["False success", "TbMoodCheck", "says “done” when it isn't", "grades its own work", "“report sent” but the attachment is empty"],
        ["Premature stop", "TbPlayerStop", "quits halfway, sounds confident", "“stopped talking” read as “finished”", "answers 2 of 5 questions"]]]];
    const W = (12.43 - 2 * 0.2) / 3;
    for (let f = 0; f < 3; f++) {
      const [fn, fic, col, cards] = FAM[f], x = 0.45 + f * (W + 0.2);
      sl.addImage({ path: await icon(fic, col.o), x, y: 1.6, w: 0.32, h: 0.32 });
      txt(sl, fn, x + 0.42, 1.6, W - 0.42, 0.34, { fs: 17, bold: true, color: col.t, valign: "middle" });
      for (let c = 0; c < 2; c++) {
        const [cn, cic, see, , ex] = cards[c], y = 2.1 + c * 2.0;
        box(sl, "", x, y, W, 1.82, { col, r: 0.14, lw: 1 });
        sl.addImage({ path: await icon(cic, col.o), x: x + 0.2, y: y + 0.2, w: 0.3, h: 0.3 });
        txt(sl, cn, x + 0.6, y + 0.18, W - 0.8, 0.36, { fs: 16, bold: true, color: col.t, valign: "middle" });
        txt(sl, [
          { text: "See: ", options: { bold: true, color: col.t } }, { text: see, options: { breakLine: true } },
          { text: "Example: ", options: { bold: true, color: col.t } }, { text: ex }],
          x + 0.2, y + 0.65, W - 0.4, 1.1, { fs: 15.5, color: TEXT, psa: 6 });
      }
    }
    txt(sl, "Every failure is one of three jobs going wrong: thinking, acting or checking.", 0.45, 6.2, 12.43, 0.45,
      { fs: 17, italic: true, bold: true, color: TEXT, align: "center" });
    sl.addNotes(NOTE["4"] || "");
  }

  pres.addSection({ title: "5 · Root Cause" });
  // ---- Root cause (b): the evidence ----
  {
    const sl = newSlide("5 · Root Cause");
    header(sl, "Root Cause: A System Design Problem",
      "Without structure, quality degrades. A smarter model doesn't fix it; a better design does.");
    const F = [
      ["TbBooks", C.purple, "More memory, worse thinking", "1 page vs a book",
        "Same question, same model: far more reliable with one focused page than with a whole history to read through.",
        "An agent that carries everything forgets what matters."],
      ["TbSitemap", C.teal, "Structure beats size", "~90% better",
        "The same model did about 90% better when a lead agent split the work between specialists.",
        "How the work is organised matters more than how clever the model is."],
      ["TbSettingsCog", C.coral, "Better models won't fix bad design", "4 in 5 failures",
        "Most failures come from unclear roles and poor hand-offs, not from the model itself.",
        "Upgrading the model won't fix a broken design."],
    ];
    const W = (12.43 - 2 * 0.25) / 3, Y = 1.7, H = 4.05;
    for (let i = 0; i < F.length; i++) {
      const [ic, col, claim, num, body, means] = F[i], x = 0.45 + i * (W + 0.25);
      box(sl, "", x, Y, W, H, { fill: "FFFFFF", line: col.o, lw: 1.25, r: 0.08 });
      box(sl, "", x, Y, W, 0.62, { fill: col.f, line: col.o, lw: 1.25, r: 0.08 });
      box(sl, "", x + 0.012, Y + 0.45, W - 0.024, 0.2, { fill: col.f, line: col.f, r: 0 });   // square off the header's lower corners
      sl.addImage({ path: await icon(ic, col.o), x: x + 0.25, y: Y + 0.15, w: 0.32, h: 0.32 });
      txt(sl, claim, x + 0.7, Y + 0.08, W - 0.85, 0.48, { fs: 15.5, bold: true, color: col.t, valign: "middle" });
      txt(sl, num, x + 0.25, Y + 0.85, W - 0.5, 0.75, { fs: 30, bold: true, color: col.o, valign: "middle" });
      txt(sl, body, x + 0.25, Y + 1.72, W - 0.5, 1.2, { fs: 14, color: TEXT });
      sl.addShape("line", { x: x + 0.25, y: Y + 3.0, w: W - 0.5, h: 0, line: { color: HAIR, width: 0.75 } });
      txt(sl, means, x + 0.25, Y + 3.12, W - 0.5, 0.8, { fs: 14, bold: true, italic: true, color: col.t });
    }
    box(sl, [{ text: "It's not the brain, it's the org chart.  ", options: { bold: true } }, { text: "Next: what good structure looks like →" }],
      0.45, 6.0, 12.43, 0.55, { fill: C.purple.o, line: C.purple.o, color: "FFFFFF", fs: 16, align: "left", margin: 14, r: 0.08 });
    sl.addNotes(NOTE["5"] || "");
  }

  // ---- Core idea (a): a team, not a monolith — the October report again ----
  pres.addSection({ title: "6 · Core Idea" });
  {
    const sl = newSlide("6 · Core Idea");
    header(sl, "The Core Idea of Multi-Agent Systems",
      "Split the work between small agents, each with one job, its own clean memory and only the tools it needs. Simple code decides who goes next.");

    // Manager
    const MX = 1.9, MW = 4.9;
    box(sl, [{ text: "Manager  ", options: { bold: true, fontSize: 15 } }, { text: "holds the goal: “Send the October sales report”", options: { fontSize: 12.5 } }],
      MX, 1.72, MW, 0.6, { col: C.purple, r: 0.1, lw: 1.25 });
    // Agents
    const AY = 3.05, AW = 2.4, AH = 1.25, AX = [0.45, 3.25, 6.05];
    const AG = [
      ["Data agent", C.teal, "Tool: sales database", "Gets the October numbers"],
      ["Writer agent", C.teal, "Tool: report template", "Turns the summary into a report"],
      ["Reviewer agent", C.coral, "No tools: reads and checks", "Compares the report with the request"],
    ];
    AG.forEach(([name, col, tool, job], i) => {
      box(sl, "", AX[i], AY, AW, AH, { col, r: 0.1, lw: 1.25 });
      txt(sl, name, AX[i] + 0.18, AY + 0.1, AW - 0.36, 0.36, { fs: 15, bold: true, color: col.t });
      txt(sl, job, AX[i] + 0.18, AY + 0.45, AW - 0.36, 0.4, { fs: 11.5, color: TEXT });
      txt(sl, tool, AX[i] + 0.18, AY + 0.88, AW - 0.36, 0.28, { fs: 11, italic: true, color: TEXT2 });
      line(sl, MX + MW * (0.18 + 0.32 * i), 2.32, AX[i] + AW / 2, AY - 0.03, { color: C.purple.o, width: 1, dash: true });
    });
    txt(sl, "assigns each job", MX + MW + 0.1, 2.45, 1.8, 0.3, { fs: 10.5, italic: true, color: C.purple.t });
    // Hand-offs
    line(sl, AX[0] + AW + 0.02, AY + 0.62, AX[1] - 0.02, AY + 0.62, { width: 1.5 });
    line(sl, AX[1] + AW + 0.02, AY + 0.62, AX[2] - 0.02, AY + 0.62, { width: 1.5 });
    const mid = (AX[0] + AW + AX[1]) / 2;
    sl.addShape("line", { x: mid, y: AY + 0.62, w: 0, h: 4.62 - AY - 0.62, line: { color: C.amber.o, width: 1, dashType: "dash" } });
    box(sl, [{ text: "Hands over a short summary: ", options: { bold: true } }, { text: "totals + “⚠ 3 regions missing”" }],
      mid - 2.45, 4.62, 4.9, 0.42, { col: C.amber, fs: 11.5, r: 0.21, margin: 6 });
    // Reviewer outcomes
    const RX = AX[2];
    line(sl, RX + AW / 2, AY + AH + 0.02, RX + AW / 2, 4.62, { color: C.coral.o, width: 1.5 });
    box(sl, [{ text: "✗ Regions missing  ", options: { bold: true } }, { text: "→ back to data agent" }],
      RX - 0.4, 4.66, AW + 0.8, 0.42, { col: C.coral, fs: 11.5, r: 0.21, margin: 4 });
    box(sl, [{ text: "✓ All regions in  ", options: { bold: true } }, { text: "→ sent to finance" }],
      RX - 0.4, 5.18, AW + 0.8, 0.42, { col: C.teal, fs: 11.5, r: 0.21, margin: 4 });
    txt(sl, "The mistake from our example is caught before it leaves the team.", 0.45, 5.85, 8.0, 0.4,
      { fs: 14, bold: true, italic: true, color: TEXT });

    // Right: what changes
    const px = 8.95, pw = 12.88 - px;
    box(sl, "", px, 1.72, pw, 4.45, { fill: "FFFFFF", line: HAIR, r: 0.08 });
    txt(sl, "What changes", px + 0.25, 1.85, pw - 0.5, 0.4, { fs: 16, bold: true, color: TEXT });
    const CH = [
      ["TbFilter", C.purple, "Clean memory", "Agents pass short summaries, not raw data."],
      ["TbTool", C.teal, "Fewer tools", "Each agent sees only the tools its job needs."],
      ["TbScale", C.amber, "Right-sized models", "A strong model to plan; a small, fast one for simple steps."],
    ];
    for (let i = 0; i < CH.length; i++) {
      const [ic, col, h, d] = CH[i], y = 2.42 + i * 1.22;
      box(sl, "", px + 0.25, y + 0.05, 0.5, 0.5, { oval: true, col, lw: 0.75 });
      sl.addImage({ path: await icon(ic, col.o), x: px + 0.36, y: y + 0.16, w: 0.28, h: 0.28 });
      txt(sl, [{ text: h, options: { bold: true, fontSize: 14.5, color: col.t, breakLine: true } }, { text: d, options: { fontSize: 12.5, color: TEXT } }],
        px + 0.9, y, pw - 1.1, 1.05);
    }
    sl.addNotes(NOTE["6"] || "");
  }

  // ===== Slides 14–16, copied as is from ../multi_agent_systems_slide_14_to_16/source/build_slides.js =====
  // =========================== SLIDE 14 — Common mistakes ===========================
  pres.addSection({ title: "14 · Common Mistakes" });
  {
    const sl = newSlide("14 · Common Mistakes");
    header(sl, "Common Mistakes in Multi-Agent Design", "Most multi-agent failures are design mistakes, not model mistakes. Each card shows the symptom you will see and the fix that prevents it.", "14");
    const M = [
      ["TbTarget", "No clear goal or “done”", "Agents loop or stop early; nobody knows when the task is finished.", "Write success criteria and an exit condition for every agent."],
      ["TbUsers", "Vague, overlapping roles", "Two agents do the same work, or a step falls between them.", "One job per agent, with written inputs and outputs."],
      ["TbInfinity", "No rules or limits", "Endless retries, runaway cost, any agent can call any tool.", "Step limits, retry budgets and least-privilege tools."],
      ["TbHammer", "Wrong use case", "Multi-agent for a simple task: more cost, latency and failure points.", "Start with one agent or a fixed workflow; split when it breaks."],
      ["TbMessages", "Agents chat instead of hand off", "Full histories passed around; context bloats and decisions drift.", "Pass structured results through a small shared state."],
      ["TbEyeOff", "No independent check or human gate", "“Done” is reported when it isn't; risky actions go out unreviewed.", "A separate checker, plus human approval for irreversible steps."],
    ];
    const W = 3.95, H = 2.38, GX = 0.18, GY = 0.2, X0 = 0.55, Y0 = 1.5;
    for (let i = 0; i < M.length; i++) {
      const [ic, title, what, fix] = M[i], x = X0 + (i % 3) * (W + GX), y = Y0 + Math.floor(i / 3) * (H + GY), n = String(i + 1);
      box(sl, "", x, y, W, H, { fill: "FFFFFF", line: HAIR, r: 0.1, lw: 1, name: "!!card" + n });
      box(sl, "", x + 0.22, y + 0.22, 0.5, 0.5, { oval: true, col: C.coral, lw: 0.75, name: "!!dot" + n });
      sl.addImage({ path: await icon(ic, C.coral.o), x: x + 0.32, y: y + 0.32, w: 0.3, h: 0.3, objectName: "!!ic" + n });
      txt(sl, title, x + 0.86, y + 0.2, W - 1.0, 0.55, { fs: 16, bold: true, color: C.coral.t, valign: "middle", name: "!!mt" + n });
      txt(sl, what, x + 0.22, y + 0.88, W - 0.44, 0.7, { fs: 13, color: TEXT, name: "!!mw" + n });
      box(sl, [{ text: "Fix  ", options: { bold: true, color: C.teal.t } }, { text: fix, options: { color: C.teal.t } }],
        x + 0.22, y + 1.58, W - 0.44, 0.6, { col: C.teal, lw: 0.5, fs: 12.5, align: "left", margin: 8, r: 0.06, name: "!!fix" + n });
    }
    txt(sl, "Every mistake here is a missing decision: who does what, when is it done, and who checks.", 0.55, 6.53, 12.2, 0.4,
      { fs: 16, bold: true, italic: true, align: "center", name: "!!take" });
    sl.addNotes(NOTE["14"]);
  }

  // =========================== SLIDE 15 — Choose the pattern ===========================
  pres.addSection({ title: "15 · Choose the Pattern" });
  {
    const sl = newSlide("15 · Choose the Pattern");
    header(sl, "How to Choose the Right Pattern", "Start from the need, not the pattern. Find the row that sounds like your problem, then plan for its typical failure before you build.", "15");
    const rows = [
      ["Route each request to the right specialist", "Supervisor–Worker", "A service desk sends each query to billing, tech support or refunds", "The supervisor becomes a bottleneck"],
      ["Reuse a self-contained capability inside bigger flows", "Subgraph", "One identity check reused in account opening, payments and complaints", "Keep its input and output state small and explicit"],
      ["A long task that needs a plan before doing", "Planner–Executor", "Plan a market-research report, then research and write each section", "Re-plan when a step fails; don't push on"],
      ["A known, fixed sequence of stages", "Specialist Pipeline", "Invoices: read → extract → validate → post to accounts", "Errors flow downstream; check between stages"],
      ["Judgement calls where quality beats speed", "Peer + Debate", "Two reviewers challenge a contract summary before it goes out", "Cost and time; cap the number of rounds"],
      ["Many independent sub-tasks, then a sign-off", "Parallel Swarm + Human Gate", "Screen 50 supplier documents in parallel; a manager approves the shortlist", "Merging results, and approval fatigue"],
    ];
    const head = (t, col = C.gray) => ({ text: t, options: { bold: true, color: col.t, fill: { color: col.f }, fontSize: 13 } });
    const data = [[head("If you need…"), head("Use this pattern", C.purple), head("Example"), head("Watch out for", C.coral)]];
    rows.forEach(([need, pat, ex, watch]) => data.push([
      { text: need, options: { fontSize: 13, color: TEXT } },
      { text: pat, options: { fontSize: 13.5, bold: true, color: C.purple.t } },
      { text: ex, options: { fontSize: 12.5, color: TEXT2 } },
      { text: watch, options: { fontSize: 12.5, color: C.coral.t } },
    ]));
    sl.addTable(data, {
      x: 0.55, y: 1.5, w: 12.23, colW: [3.35, 2.55, 3.55, 2.78], rowH: [0.42, 0.66, 0.66, 0.66, 0.66, 0.66, 0.66],
      fontFace: FONT, valign: "middle", margin: [4, 8, 4, 8], border: { type: "solid", pt: 0.75, color: HAIR }, objectName: "!!table",
    });
    box(sl, [{ text: "Rule of thumb  ", options: { bold: true } }, { text: "Pick the simplest pattern that meets the need. Start with one agent; add structure only when it breaks." }],
      0.55, 6.35, 12.23, 0.55, { col: C.teal, fs: 14, align: "left", margin: 12, r: 0.1, color: C.teal.t, name: "!!rule" });
    sl.addNotes(NOTE["15"]);
  }

  // =========================== SLIDE 16 — Design principles ===========================
  pres.addSection({ title: "16 · Design Principles" });
  {
    const sl = newSlide("16 · Design Principles");
    header(sl, "Design Principles You Can Apply Tomorrow", "Eight habits that prevent the mistakes on slide 14. Capture them in a role card for every agent before any code is written.", "16");
    const P = [
      ["One job per agent", "A clear goal, its own tools, inputs and outputs."],
      ["Define “done”", "Return a structured status, not free text."],
      ["Few tools, least privilege", "A handful of tools per agent, read-only where possible."],
      ["Pass state, not chat", "A small typed state; each agent writes only its keys."],
      ["Bound everything", "Max steps, retries, timeouts and tokens."],
      ["Separate maker and checker", "The agent that does the work never grades it."],
      ["Human gate for the irreversible", "Approve before send, deploy, delete or close."],
      ["Make it observable", "Trace every hand-off: status, tokens, latency."],
    ];
    const CW = 3.6, RH = 1.22, X0 = 0.55, Y0 = 1.55;
    P.forEach(([h, d], i) => {
      const x = X0 + (i % 2) * (CW + 0.2), y = Y0 + Math.floor(i / 2) * RH, n = String(i + 1);
      box(sl, n, x, y + 0.05, 0.42, 0.42, { oval: true, fill: C.purple.o, line: C.purple.o, color: "FFFFFF", bold: true, fs: 14, margin: 0, name: "!!pn" + n });
      txt(sl, [{ text: h, options: { bold: true, fontSize: 15.5, color: C.purple.t, breakLine: true } }, { text: d, options: { fontSize: 13, color: TEXT2 } }],
        x + 0.58, y, CW - 0.6, 0.95, { name: "!!pt" + n });
    });
    // Role card example
    const cx = 8.25, cy = 1.5, cw = 4.53, ch = 4.75;
    box(sl, "", cx, cy, cw, ch, { col: C.teal, r: 0.12, lw: 1.25, name: "!!card" });
    sl.addImage({ path: await icon("TbId", C.teal.o), x: cx + 0.25, y: cy + 0.22, w: 0.38, h: 0.38, objectName: "!!cardic" });
    txt(sl, [{ text: "Role card · Research agent", options: { bold: true, fontSize: 16, color: C.teal.t, breakLine: true } }, { text: "Market brief", options: { fontSize: 12, color: C.teal.o } }],
      cx + 0.75, cy + 0.17, cw - 0.9, 0.6, { name: "!!cardh" });
    const F = [
      ["Goal", "Gather the latest facts for one market brief"],
      ["Tools", "web_search, read_document (read-only)"],
      ["Reads", "brief, plan"],
      ["Writes", "findings, status"],
      ["Done when", "every key point has a cited source"],
      ["Limits", "6 steps · 2 retries · 20k tokens"],
      ["Hands off to", "Checker"],
    ];
    F.forEach(([k, v], i) => {
      const y = cy + 0.95 + i * 0.52;
      if (i) line(sl, cx + 0.25, y - 0.05, cx + cw - 0.25, y - 0.05, { end: false, color: "9FE1CB", width: 0.5 });
      txt(sl, k, cx + 0.25, y, 1.25, 0.45, { fs: 12, bold: true, color: C.teal.t, valign: "middle", name: "!!ck" + i });
      txt(sl, v, cx + 1.5, y, cw - 1.75, 0.45, { fs: 12, color: TEXT, valign: "middle", name: "!!cv" + i });
    });
    txt(sl, "Write the role card before the code. If you can't fill it in, the agent's job isn't clear yet.", cx, cy + ch + 0.15, cw, 0.6,
      { fs: 12.5, italic: true, color: TEXT2, name: "!!cardcap" });
    sl.addNotes(NOTE["16"]);
  }

  // ===== 16a · LangChain and LangGraph (no code) =====
  pres.addSection({ title: "16a · LangChain and LangGraph" });

  // ---- 16a (1): what each one is ----
  {
    const sl = newSlide("16a · LangChain and LangGraph");
    header(sl, "LangChain and LangGraph",
      "Both connect AI steps into a workflow. The difference is the shape: LangChain runs steps in a fixed sequence; LangGraph connects them as a graph, so they can run in any order.");
    const half = (12.43 - 0.3) / 2, Y = 1.65, H = 2.62;
    // LangChain card: a straight chain
    const L = 0.45;
    box(sl, "", L, Y, half, H, { col: C.purple, r: 0.08, lw: 1.25 });
    sl.addImage({ path: await icon("TbPuzzle", C.purple.o), x: L + 0.25, y: Y + 0.2, w: 0.34, h: 0.34 });
    txt(sl, "LangChain · sequential", L + 0.7, Y + 0.17, half - 0.9, 0.4, { fs: 17, bold: true, color: C.purple.t, valign: "middle" });
    const chain = ["Question", "AI model", "Tool", "Answer"], cw = 1.05, cg = 0.38;
    const cx0 = L + (half - (chain.length * cw + (chain.length - 1) * cg)) / 2;
    chain.forEach((t, i) => {
      const x = cx0 + i * (cw + cg);
      box(sl, t, x, Y + 0.78, cw, 0.48, { fill: "FFFFFF", line: C.purple.o, fs: 12.5, bold: true, color: C.purple.t, r: 0.1, margin: 0 });
      if (i < chain.length - 1) line(sl, x + cw + 0.03, Y + 1.02, x + cw + cg - 0.03, Y + 1.02, { color: C.purple.o, width: 1.5 });
    });
    txt(sl, "Fixed order: each step runs once, one after another.", L + 0.25, Y + 1.62, half - 0.5, 0.3, { fs: 12, italic: true, color: C.purple.t, align: "center" });
    txt(sl, "Best when the steps are known up front and never change order, like finding the right document and answering a question.",
      L + 0.25, Y + 1.97, half - 0.5, 0.6, { fs: 12.5, color: TEXT });
    // LangGraph card: a small loop
    const R = L + half + 0.3;
    box(sl, "", R, Y, half, H, { col: C.teal, r: 0.08, lw: 1.25 });
    sl.addImage({ path: await icon("TbGitBranch", C.teal.o), x: R + 0.25, y: Y + 0.2, w: 0.34, h: 0.34 });
    txt(sl, "LangGraph · non-sequential (a graph)", R + 0.7, Y + 0.17, half - 0.9, 0.4, { fs: 17, bold: true, color: C.teal.t, valign: "middle" });
    const gw = 1.05, gy = Y + 0.78, gx0 = R + 0.45;
    [["Plan", 0], ["Do", 1], ["Check", 2]].forEach(([t, i]) => {
      box(sl, t, gx0 + i * (gw + 0.38), gy, gw, 0.48, { fill: "FFFFFF", line: C.teal.o, fs: 12.5, bold: true, color: C.teal.t, r: 0.1, margin: 0 });
      if (i < 2) line(sl, gx0 + i * (gw + 0.38) + gw + 0.03, gy + 0.24, gx0 + (i + 1) * (gw + 0.38) - 0.03, gy + 0.24, { color: C.teal.o, width: 1.5 });
    });
    const chkR = gx0 + 2 * (gw + 0.38) + gw;
    line(sl, chkR + 0.03, gy + 0.24, chkR + 0.35, gy + 0.24, { color: C.teal.o, width: 1.5 });
    box(sl, "✓ Done", chkR + 0.38, gy + 0.04, 0.85, 0.4, { col: C.teal, fs: 11.5, bold: true, r: 0.2, margin: 0 });
    // loop back from Check to Do (under the boxes)
    const doC = gx0 + (gw + 0.38) + gw / 2, chkC = gx0 + 2 * (gw + 0.38) + gw / 2, ly2 = gy + 0.48 + 0.2;
    line(sl, chkC, gy + 0.5, chkC, ly2, { end: false, color: C.coral.o, width: 1.25, dash: true });
    line(sl, chkC, ly2, doC, ly2, { end: false, color: C.coral.o, width: 1.25, dash: true });
    line(sl, doC, ly2, doC, gy + 0.5, { color: C.coral.o, width: 1.25, dash: true });
    txt(sl, "✗ try again", (doC + chkC) / 2 - 0.5, ly2 + 0.01, 1.0, 0.25, { fs: 10.5, bold: true, color: C.coral.t, align: "center" });
    txt(sl, "Any order: steps can loop back, branch, run in parallel or wait for a person.", R + 0.25, Y + 1.62, half - 0.5, 0.3, { fs: 12, italic: true, color: C.teal.t, align: "center" });
    txt(sl, "Best when the next step depends on the result: try again, pick a path, or hand over to another agent. Built for multi-agent teams.",
      R + 0.25, Y + 1.97, half - 0.5, 0.6, { fs: 12.5, color: TEXT });

    // Comparison
    const head = (t, col) => ({ text: t, options: { bold: true, color: col.t, fill: { color: col.f }, fontSize: 13 } });
    const rows = [
      ["How steps run", "A fixed sequence: A → B → C", "A graph: loops, branches, parallel steps"],
      ["Memory", "Passed along from step to step", "One shared state, saved after every step"],
      ["Human approval", "Hard to pause halfway", "Built in: pause, approve, then carry on"],
      ["Best for", "Simple pipelines and document Q&A", "Multi-agent teams and self-correcting loops"],
    ];
    const data = [[head("", C.gray), head("LangChain", C.purple), head("LangGraph", C.teal)]];
    rows.forEach(([k, a, g]) => data.push([
      { text: k, options: { bold: true, fontSize: 13, color: TEXT } },
      { text: a, options: { fontSize: 13, color: TEXT } },
      { text: g, options: { fontSize: 13, color: TEXT } },
    ]));
    sl.addTable(data, { x: 0.45, y: 4.45, w: 12.43, colW: [2.33, 5.05, 5.05], rowH: 0.34, fontFace: FONT, valign: "middle",
      margin: [3, 8, 3, 8], border: { type: "solid", pt: 0.75, color: HAIR } });
    txt(sl, "Both connect the steps: LangChain in a straight line, LangGraph in any shape.", 0.45, 6.38, 12.43, 0.4,
      { fs: 16, bold: true, italic: true, color: TEXT, align: "center" });
    sl.addNotes(NOTE["16a-1"] || "");
  }

  // ---- 16a (2): reading the graph ----
  {
    const sl = newSlide("16a · LangChain and LangGraph");
    header(sl, "LangChain and LangGraph – Reading the Graph",
      "A LangGraph flow is drawn as a graph. Each numbered part on the left is explained on the right.");
    // graph
    const mid = 2.75, nw = 2.1, nh = 0.75, yS = 1.75, yW = 2.45, yC = 3.75, yE = 5.05;
    const badge = (n, x, y) => box(sl, String(n), x, y, 0.34, 0.34, { oval: true, fill: C.purple.o, line: C.purple.o, color: "FFFFFF", bold: true, fs: 12, margin: 0 });
    box(sl, "START", mid - 0.55, yS, 1.1, 0.36, { col: C.gray, r: 0.18, fs: 11, bold: true, margin: 0 });
    line(sl, mid, yS + 0.36, mid, yW, { width: 1.5 });
    box(sl, [{ text: "Worker", options: { bold: true, fontSize: 15, breakLine: true } }, { text: "does the job", options: { fontSize: 11 } }],
      mid - nw / 2, yW, nw, nh, { col: C.teal, r: 0.1, lw: 1.25 });
    line(sl, mid, yW + nh, mid, yC, { width: 1.5 });
    box(sl, [{ text: "Checker", options: { bold: true, fontSize: 15, breakLine: true } }, { text: "verifies the work", options: { fontSize: 11 } }],
      mid - nw / 2, yC, nw, nh, { col: C.coral, r: 0.1, lw: 1.25 });
    line(sl, mid, yC + nh, mid, yE, { width: 1.5 });
    txt(sl, "pass", mid + 0.1, yC + nh + 0.08, 0.6, 0.3, { fs: 11, bold: true, color: C.teal.t });
    box(sl, "END", mid - 0.55, yE, 1.1, 0.36, { col: C.gray, r: 0.18, fs: 11, bold: true, margin: 0 });
    const lx = mid - nw / 2 - 0.5;
    line(sl, mid - nw / 2, yC + nh / 2, lx, yC + nh / 2, { end: false, dash: true, color: C.coral.o, width: 1.5 });
    line(sl, lx, yC + nh / 2, lx, yW + nh / 2, { end: false, dash: true, color: C.coral.o, width: 1.5 });
    line(sl, lx, yW + nh / 2, mid - nw / 2 - 0.02, yW + nh / 2, { dash: true, color: C.coral.o, width: 1.5 });
    txt(sl, "fail", lx + 0.08, yC + nh / 2 + 0.02, 0.45, 0.28, { fs: 11, bold: true, color: C.coral.t });
    // state panel
    const sx = 4.55, sw = 1.95;
    line(sl, mid + nw / 2, yW + nh / 2, sx, yW + nh / 2, { end: false, dash: true, color: C.purple.o, width: 0.75 });
    line(sl, mid + nw / 2, yC + nh / 2, sx, yC + nh / 2, { end: false, dash: true, color: C.purple.o, width: 0.75 });
    box(sl, "", sx, yW, sw, yC + nh - yW, { col: C.purple, r: 0.08, lw: 1.25 });
    txt(sl, "State", sx + 0.15, yW + 0.1, sw - 0.3, 0.3, { fs: 13, bold: true, color: C.purple.t });
    [["request", "the input"], ["result", "from Worker"], ["status", "from Checker"]].forEach(([k, v], i) =>
      txt(sl, [{ text: k, options: { bold: true, fontSize: 12, color: C.purple.t, breakLine: true } }, { text: v, options: { fontSize: 10.5, color: TEXT2 } }],
        sx + 0.15, yW + 0.45 + i * 0.5, sw - 0.3, 0.45));
    // numbered badges on the graph
    badge(1, mid + nw / 2 - 0.2, yW - 0.17);                 // node
    badge(2, mid + 0.1, yW + nh + 0.32);                     // edge
    badge(3, lx - 0.17, yW + nh + 0.12);                     // conditional edge
    badge(4, sx + sw - 0.2, yW - 0.17);                      // state
    badge(5, mid + 0.6, yS - 0.05);                          // start / end

    // explanations
    const px = 7.0, pw = 12.88 - px;
    const EX = [
      ["Node", "The boxes", "One step of work: an agent, a tool or plain code. It reads the state, does its job and writes its result."],
      ["Edge", "The solid arrows", "A fixed hand-off: when one node finishes, the next one starts."],
      ["Conditional edge", "The dashed arrow", "A decision: it looks at the result and picks the next step. Pass → finish, fail → try again."],
      ["State", "The purple panel", "The shared memory every node reads and writes. Nodes pass state, not long chat history."],
      ["START and END", "The grey pills", "Where the work comes in, and where the result goes out."],
    ];
    EX.forEach(([name, where, what], i) => {
      const y = 1.68 + i * 0.84;
      badge(i + 1, px, y + 0.04);
      txt(sl, [{ text: name + "  ", options: { bold: true, fontSize: 14.5, color: C.purple.t } }, { text: where, options: { fontSize: 11.5, italic: true, color: TEXT2 } }],
        px + 0.48, y, pw - 0.5, 0.32, { valign: "middle" });
      txt(sl, what, px + 0.48, y + 0.32, pw - 0.5, 0.48, { fs: 12, color: TEXT });
    });
    box(sl, [{ text: "Also built in  ", options: { bold: true } }, { text: "Progress is saved after every step, so a run can resume after a failure or pause for a person to approve." }],
      0.45, 5.95, 12.43, 0.5, { col: C.teal, fs: 13, align: "left", margin: 12, r: 0.08 });
    sl.addNotes(NOTE["16a-2"] || "");
  }

  await pres.writeFile({ fileName: OUT });
  console.log("Wrote", OUT);
})();
