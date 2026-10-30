// build_slides.js — builds ../Slides-14-16.pptx: slides 14, 15, 16 and 16a (static, house style; no animation needed).
// Run (from this folder):  node build_slides.js
// Speaker notes come from ../SPEAKER_NOTES.md ("## Slide 14 — …" sections).

const fs = require("fs");
const os = require("os");
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const tb = require("react-icons/tb");
const sharp = require("sharp");

const ROOT = __dirname;
const OUT = process.argv[2] || path.join(ROOT, "..", "Slides-14-16.pptx");
const ICON_DIR = path.join(os.tmpdir(), "deck-icons");
fs.mkdirSync(ICON_DIR, { recursive: true });

// ---------- Design system (same as slides 1–6, white background) ----------
const C = {
  purple: { f: "EEEDFE", o: "534AB7", t: "3C3489" },
  teal:   { f: "E1F5EE", o: "0F6E56", t: "085041" },
  coral:  { f: "FAECE7", o: "993C1D", t: "712B13" },
  amber:  { f: "FAEEDA", o: "854F0B", t: "633806" },
  gray:   { f: "F1EFE8", o: "888780", t: "2C2C2A" },
};
const ARROW = "5F5E5A", TEXT = "2C2C2A", TEXT2 = "5F5E5A", HAIR = "D3D1C7";
const FONT = "Calibri", MONO = "Consolas";

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
function line(sl, x1, y1, x2, y2, o = {}) {
  const ln = { color: o.color || ARROW, width: o.width || 1.25 };
  if (o.dash) ln.dashType = "dash";
  if (o.end !== false) ln.endArrowType = "triangle";
  sl.addShape("line", { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
    flipH: x2 < x1, flipV: y2 < y1, line: ln, objectName: o.name });
}
function box(sl, text, x, y, w, h, o = {}) {
  const col = o.col || C.gray;
  sl.addText(text || "", { shape: o.oval ? "ellipse" : "roundRect", x, y, w, h, rectRadius: o.oval ? undefined : (o.r ?? 0.08),
    fill: { color: o.fill || col.f }, line: { color: o.line || col.o, width: o.lw || 1, dashType: o.dash ? "dash" : "solid" },
    fontFace: o.mono ? MONO : FONT, fontSize: o.fs || 12, color: o.color || col.t, bold: !!o.bold,
    align: o.align || "center", valign: o.valign || "middle", margin: o.margin ?? 4, objectName: o.name });
}
function txt(sl, text, x, y, w, h, o = {}) {
  sl.addText(text, { x, y, w, h, fontFace: o.mono ? MONO : FONT, fontSize: o.fs || 14, color: o.color || TEXT, bold: !!o.bold, italic: !!o.italic,
    align: o.align || "left", valign: o.valign || "top", margin: o.margin ?? 0, isTextBox: true, paraSpaceAfter: o.psa || 0,
    lineSpacingMultiple: o.lsm, objectName: o.name });
}
// House style (same as slides 1–6): bold title, thin grey rule, one lead line, page-number footer.
// No "RESTRICTED" text: Office adds the classification label itself.
function header(sl, title, sub) {
  txt(sl, title, 0.45, 0.22, 12.4, 0.58, { fs: 26, bold: true, color: "1A1A1A", valign: "bottom", name: "!!title" });
  line(sl, 0.45, 0.88, 12.88, 0.88, { end: false, color: "7F7F7F", width: 0.75, name: "!!rule" });
  if (sub) sl.addText(sub, { x: 0.45, y: 0.97, w: 12.4, h: 0.48, fontFace: "Arial", fontSize: 14, color: "404040", valign: "top",
    margin: 0, isTextBox: true, objectName: "!!lead" });
  sl.slideNumber = { x: 6.17, y: 6.98, w: 1.0, h: 0.22, fontFace: "Arial", fontSize: 10, color: "595959", align: "center" };
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
  pres.title = "Multi-Agent Systems · Slides 14–16";
  pres.author = "Amitkumar";
  pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
  const NOTE = notes();
  const newSlide = (sec) => { const s = pres.addSlide({ sectionTitle: sec }); s.background = { color: "FFFFFF" }; return s; };

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

  // =========================== SLIDE 16a — LangChain and LangGraph ===========================
  pres.addSection({ title: "16a · LangChain and LangGraph" });
  {
    const sl = newSlide("16a · LangChain and LangGraph");
    header(sl, "LangChain and LangGraph", "Both connect AI steps into a workflow. LangChain runs them in a fixed sequence; LangGraph connects them as a graph, so steps can loop, branch and pause for a person.", "16a");
    // Left: the two libraries
    const lx = 0.55, lw = 3.85;
    box(sl, "", lx, 1.5, lw, 2.15, { col: C.purple, r: 0.1, name: "!!lcbox" });
    sl.addImage({ path: await icon("TbPuzzle", C.purple.o), x: lx + 0.2, y: 1.66, w: 0.34, h: 0.34, objectName: "!!lcic" });
    txt(sl, "LangChain · sequential chains", lx + 0.62, 1.64, lw - 0.75, 0.4, { fs: 15, bold: true, color: C.purple.t, valign: "middle", name: "!!lch" });
    txt(sl, [
      { text: "Steps run in a fixed sequence: A → B → C", options: { bullet: true, breakLine: true } },
      { text: "One interface for chat models (e.g. ChatGroq, ChatAnthropic)", options: { bullet: true, breakLine: true } },
      { text: "Prompts, tools (@tool) and structured output", options: { bullet: true } },
    ], lx + 0.2, 2.1, lw - 0.35, 1.45, { fs: 12.5, color: TEXT, psa: 4, name: "!!lcb" });
    box(sl, "", lx, 3.85, lw, 2.15, { col: C.teal, r: 0.1, name: "!!lgbox" });
    sl.addImage({ path: await icon("TbGitBranch", C.teal.o), x: lx + 0.2, y: 4.01, w: 0.34, h: 0.34, objectName: "!!lgic" });
    txt(sl, "LangGraph · graphs", lx + 0.62, 3.99, lw - 0.75, 0.4, { fs: 15, bold: true, color: C.teal.t, valign: "middle", name: "!!lgh" });
    txt(sl, [
      { text: "Steps in any order: loops, branches, parallel", options: { bullet: true, breakLine: true } },
      { text: "Nodes + edges over a shared state", options: { bullet: true, breakLine: true } },
      { text: "Checkpoints: resume, and pause for a human", options: { bullet: true } },
    ], lx + 0.2, 4.45, lw - 0.35, 1.45, { fs: 12.5, color: TEXT, psa: 4, name: "!!lgb" });

    // Middle: the graph the code builds
    const gx = 4.75, gw = 2.95, mid = gx + gw / 2;
    txt(sl, "The graph", gx, 1.5, gw, 0.3, { fs: 13, bold: true, color: TEXT2, align: "center", name: "!!gt" });
    box(sl, "START", mid - 0.55, 1.88, 1.1, 0.36, { col: C.gray, r: 0.18, fs: 11, bold: true, mono: true, name: "!!gs" });
    line(sl, mid, 2.24, mid, 2.56, { name: "!!ge1" });
    box(sl, [{ text: "worker", options: { bold: true, fontSize: 14, breakLine: true } }, { text: "node · does the job", options: { fontSize: 11 } }],
      mid - 0.95, 2.6, 1.9, 0.72, { col: C.teal, name: "!!gw" });
    line(sl, mid, 3.32, mid, 3.74, { name: "!!ge2" });
    box(sl, [{ text: "checker", options: { bold: true, fontSize: 14, breakLine: true } }, { text: "node · verifies", options: { fontSize: 11 } }],
      mid - 0.95, 3.78, 1.9, 0.72, { col: C.coral, name: "!!gc" });
    line(sl, mid, 4.5, mid, 4.98, { name: "!!ge3" });
    txt(sl, "pass", mid + 0.08, 4.58, 0.6, 0.3, { fs: 11, bold: true, color: C.teal.t, name: "!!gpass" });
    box(sl, "END", mid - 0.55, 5.02, 1.1, 0.36, { col: C.gray, r: 0.18, fs: 11, bold: true, mono: true, name: "!!gend" });
    // fail: loop back from checker to worker
    line(sl, mid - 0.95, 4.14, gx + 0.12, 4.14, { end: false, dash: true, color: C.coral.o, name: "!!gf1" });
    line(sl, gx + 0.12, 4.14, gx + 0.12, 2.96, { end: false, dash: true, color: C.coral.o, name: "!!gf2" });
    line(sl, gx + 0.12, 2.96, mid - 0.97, 2.96, { dash: true, color: C.coral.o, name: "!!gf3" });
    txt(sl, "fail", gx + 0.2, 3.38, 0.6, 0.3, { fs: 11, bold: true, color: C.coral.t, name: "!!gfail" });
    box(sl, [{ text: "State  ", options: { bold: true } }, { text: "{ticket, result, status}", options: { fontFace: MONO, fontSize: 10 } }],
      gx, 5.62, gw, 0.38, { col: C.purple, fs: 11.5, r: 0.06, margin: 2, name: "!!gstate" });

    // Right: the code
    const kx = 8.0, kw = 4.78;
    const CODE = [
      ["from typing import TypedDict", ""],
      ["from langgraph.graph import StateGraph, START, END", ""],
      ["", ""],
      ["class State(TypedDict):", "# shared state"],
      ["    ticket: str", ""],
      ["    result: str", ""],
      ["    status: str", "# \"pass\" | \"fail\""],
      ["", ""],
      ["def worker(state: State) -> dict:", "# a node"],
      ["    return {\"result\": fix(state[\"ticket\"])}", ""],
      ["", ""],
      ["def checker(state: State) -> dict:", ""],
      ["    ok = verify(state[\"result\"])", ""],
      ["    return {\"status\": \"pass\" if ok else \"fail\"}", ""],
      ["", ""],
      ["g = StateGraph(State)", ""],
      ["g.add_node(\"worker\", worker)", ""],
      ["g.add_node(\"checker\", checker)", ""],
      ["g.add_edge(START, \"worker\")", ""],
      ["g.add_edge(\"worker\", \"checker\")", ""],
      ["g.add_conditional_edges(\"checker\",", "# route on status"],
      ["    lambda s: END if s[\"status\"] == \"pass\"", ""],
      ["              else \"worker\")", ""],
      ["", ""],
      ["app = g.compile()", ""],
      ["app.invoke({\"ticket\": \"4521\"}, {\"recursion_limit\": 10})", ""],
    ];
    const runs = [];
    CODE.forEach(([code, comment], i) => {
      const last = i === CODE.length - 1;
      runs.push({ text: code || " ", options: { color: TEXT, breakLine: !comment && !last } });
      if (comment) runs.push({ text: (code ? "  " : "") + comment, options: { color: C.teal.o, breakLine: !last } });
    });
    box(sl, "", kx, 1.5, kw, 4.5, { fill: "F7F6F2", line: HAIR, r: 0.06, lw: 0.75, name: "!!codebox" });
    txt(sl, runs, kx + 0.18, 1.62, kw - 0.3, 4.3, { mono: true, fs: 9.5, lsm: 0.98, name: "!!code" });

    // Bottom: concept → meaning strip
    const K = [["State", "the shared state"], ["Node", "one agent or step"], ["Edge", "a hand-off"], ["Conditional edge", "route on status"],
      ["Subgraph", "a graph used as a node"], ["Checkpointer", "resume + human gate"]];
    const sw = (12.23 - 5 * 0.12) / 6;
    const JUMP = { "State": 9, "Node": 6, "Edge": 7, "Conditional edge": 8, "Subgraph": 10, "Checkpointer": 11 };   // 16b slides
    K.forEach(([k, v], i) => box(sl, [{ text: k, options: { bold: true, fontSize: 12.5, color: C.purple.t, breakLine: true, hyperlink: { slide: JUMP[k], tooltip: "Explain " + k } } }, { text: v, options: { fontSize: 11.5, color: TEXT2 } }],
      0.55 + i * (sw + 0.12), 6.25, sw, 0.66, { fill: "FFFFFF", line: HAIR, r: 0.08, margin: 4, name: "!!k" + i }));
    sl.addNotes(NOTE["16a"]);
  }

  // =========================== SLIDE 16b — Reading the graph (click-through) ===========================
  // One slide per part. The buttons at the bottom jump between them; Morph (add_morph.py) animates the highlight.
  pres.addSection({ title: "16b · Reading the Graph" });
  const FIRST = 5;                                   // slide number of the overview in this file (after 14, 15, 16, 16a)
  const PARTS = [
    { key: "overview", btn: "Overview", title: "How to read it",
      rows: [["Boxes", "nodes: who does the work"], ["Solid arrows", "edges: who goes next"], ["Dashed arrow", "a decision: pass or fail"],
             ["Purple panel", "the state everyone shares"]],
      foot: "Click a button below to look at one part." },
    { key: "node", btn: "Node", title: "Node",
      what: "One step of work: a function that reads the state and returns what it changed.",
      here: "worker does the job; checker verifies it. A node can be an LLM agent, a tool call or plain code.",
      like: "A person at a desk with one job.", code: 'g.add_node("worker", worker)\ng.add_node("checker", checker)' },
    { key: "edge", btn: "Edge", title: "Edge",
      what: "A fixed hand-off: when one node finishes, the next one runs.",
      here: "START → worker → checker. Nobody decides this at run time; it is wired in.",
      like: "Passing the file to the next desk, always the same desk.", code: 'g.add_edge(START, "worker")\ng.add_edge("worker", "checker")' },
    { key: "cond", btn: "Conditional edge", title: "Conditional edge",
      what: "A decision point: a small rule looks at the state and picks the next node.",
      here: "After checker: pass → END, fail → back to worker. This replaces the finish_reason if/else.",
      like: "An approval rule: approved goes out, rejected goes back for rework.",
      code: 'g.add_conditional_edges("checker",\n    lambda s: END if s["status"] == "pass"\n              else "worker")' },
    { key: "state", btn: "State", title: "State",
      what: "The shared data every node reads and writes. Nodes pass state, not chat history.",
      here: "ticket is the input, worker writes result, checker writes status.",
      like: "One shared case folder that travels with the work.", code: "class State(TypedDict):\n    ticket: str\n    result: str\n    status: str" },
    { key: "subgraph", btn: "Subgraph", title: "Subgraph",
      what: "A whole graph used as a single node inside a bigger graph.",
      here: "This worker–checker loop becomes one node, fix_ticket, in a larger flow: triage → fix_ticket → report.",
      like: "A department: one box from outside, its own team inside.", code: 'app = g.compile()\nparent.add_node("fix_ticket", app)' },
    { key: "checkpoint", btn: "Checkpointer", title: "Checkpointer",
      what: "Saves the state after every step, so a run can resume after a failure or pause for a person.",
      here: "Saved after worker and after checker. Before it finishes, the run can stop and wait for a human to approve.",
      like: "Save points in a game, plus a manager's sign-off.", code: 'app = g.compile(checkpointer=InMemorySaver())\n\n# inside a node: wait for a person\nok = interrupt("Approve this fix?")' },
  ];
  // which graph elements light up for each part
  const LIT = {
    node: ["worker", "checker"], edge: ["e1", "e2", "e3"], cond: ["loop", "e3"], state: ["state", "sl"],
    subgraph: ["worker", "checker", "e1", "e2", "e3", "loop", "frame"], checkpoint: ["e2", "e3", "save", "human"],
  };
  const DIM = { f: "FAFAF7", o: "E3E1D8", t: "B4B2A9" };
  const LEAD16B = "The same graph as the last slide, one part at a time. Click a button to see what that part does, in plain words and in code.";

  for (let p = 0; p < PARTS.length; p++) {
    const part = PARTS[p];
    const sl = newSlide("16b · Reading the Graph");
    header(sl, "Reading the Graph: What Each Part Does", LEAD16B);
    const on = (el) => part.key === "overview" || (LIT[part.key] || []).includes(el);
    const col = (el, c) => (on(el) ? c : DIM);
    const lw = (el, base) => (on(el) && part.key !== "overview" ? base + 1.25 : base);
    const lc = (el, c) => (on(el) ? c : DIM.o);

    // ---- the graph (left) ----
    const mid = 3.95, nw = 2.2, nh = 0.8;
    const yS = 1.72, yW = 2.32, yC = 3.57, yE = 4.82;
    if (part.key === "subgraph") {
      box(sl, "", 1.75, 1.6, 4.4, 3.85, { fill: "FFFFFF", line: C.purple.o, lw: 1.5, dash: true, r: 0.08, name: "!!frame" });
      box(sl, "fix_ticket · one node in the bigger graph", 2.05, 5.3, 3.8, 0.32, { col: C.purple, fs: 10.5, bold: true, r: 0.16, margin: 0, name: "!!framelbl" });
    }
    box(sl, "START", mid - 0.55, yS, 1.1, 0.36, { col: col("se", C.gray), r: 0.18, fs: 11, bold: true, mono: true, name: "!!gs" });
    line(sl, mid, yS + 0.36, mid, yW, { color: lc("e1", ARROW), width: lw("e1", 1.25), name: "!!e1" });
    box(sl, [{ text: "worker", options: { bold: true, fontSize: 15, breakLine: true } }, { text: "does the job", options: { fontSize: 11 } }],
      mid - nw / 2, yW, nw, nh, { col: col("worker", C.teal), lw: lw("worker", 1), name: "!!gw" });
    line(sl, mid, yW + nh, mid, yC, { color: lc("e2", ARROW), width: lw("e2", 1.25), name: "!!e2" });
    box(sl, [{ text: "checker", options: { bold: true, fontSize: 15, breakLine: true } }, { text: "verifies the work", options: { fontSize: 11 } }],
      mid - nw / 2, yC, nw, nh, { col: col("checker", C.coral), lw: lw("checker", 1), name: "!!gc" });
    line(sl, mid, yC + nh, mid, yE, { color: lc("e3", ARROW), width: lw("e3", 1.25), name: "!!e3" });
    txt(sl, "pass", mid + 0.1, yC + nh + 0.06, 0.6, 0.3, { fs: 11, bold: true, color: on("e3") ? C.teal.t : DIM.t, name: "!!gpass" });
    box(sl, "END", mid - 0.55, yE, 1.1, 0.36, { col: col("se", C.gray), r: 0.18, fs: 11, bold: true, mono: true, name: "!!gend" });
    // fail loop: checker → back to worker
    const lx = mid - nw / 2 - 0.55, loopC = on("loop") ? C.coral.o : DIM.o, loopW = lw("loop", 1.25);
    line(sl, mid - nw / 2, yC + nh / 2, lx, yC + nh / 2, { end: false, dash: true, color: loopC, width: loopW, name: "!!gf1" });
    line(sl, lx, yC + nh / 2, lx, yW + nh / 2, { end: false, dash: true, color: loopC, width: loopW, name: "!!gf2" });
    line(sl, lx, yW + nh / 2, mid - nw / 2 - 0.02, yW + nh / 2, { dash: true, color: loopC, width: loopW, name: "!!gf3" });
    txt(sl, "fail", lx - 0.5, yC - 0.2, 0.45, 0.3, { fs: 11, bold: true, color: on("loop") ? C.coral.t : DIM.t, align: "right", name: "!!gfail" });
    // shared state panel + read/write links
    const sx = 5.85, sw2 = 1.75, sy = yW, sh2 = yC + nh - yW;
    const stc = col("state", C.purple);
    line(sl, mid + nw / 2, yW + nh / 2, sx, yW + nh / 2, { end: false, dash: true, color: lc("sl", C.purple.o), width: lw("sl", 0.75), name: "!!sl1" });
    line(sl, mid + nw / 2, yC + nh / 2, sx, yC + nh / 2, { end: false, dash: true, color: lc("sl", C.purple.o), width: lw("sl", 0.75), name: "!!sl2" });
    box(sl, "", sx, sy, sw2, sh2, { col: stc, r: 0.08, lw: lw("state", 1), name: "!!st" });
    txt(sl, "State", sx + 0.15, sy + 0.1, sw2 - 0.3, 0.3, { fs: 13, bold: true, color: stc.t, name: "!!sth" });
    [["ticket", "input"], ["result", "by worker"], ["status", "by checker"]].forEach(([k, v], i) =>
      txt(sl, [{ text: k, options: { fontFace: MONO, fontSize: 11.5, bold: true, color: stc.t, breakLine: true } }, { text: v, options: { fontSize: 10, color: on("state") ? TEXT2 : DIM.t } }],
        sx + 0.15, sy + 0.42 + i * 0.52, sw2 - 0.3, 0.5, { name: "!!str" + i }));
    if (part.key === "checkpoint") {
      for (const [y, n] of [[(yW + nh + yC) / 2, 1], [(yC + nh + yE) / 2, 2]]) {
        box(sl, "", mid - 0.6 - 0.17, y - 0.17, 0.34, 0.34, { oval: true, col: C.amber, lw: 1, name: "!!save" + n });
        sl.addImage({ path: await icon("TbDeviceFloppy", C.amber.o), x: mid - 0.6 - 0.11, y: y - 0.11, w: 0.22, h: 0.22, objectName: "!!saveic" + n });
      }
      txt(sl, "saved", mid - 1.45, (yW + nh + yC) / 2 - 0.13, 0.55, 0.26, { fs: 10, bold: true, color: C.amber.t, align: "right", name: "!!savel" });
      box(sl, [{ text: "pause: ", options: { bold: true } }, { text: "human approves" }], mid + 0.75, yE - 0.02, 1.6, 0.4,
        { col: C.amber, fs: 10.5, r: 0.2, margin: 2, name: "!!human" });
    }

    // ---- the explanation panel (right) ----
    const px = 7.95, pw = 4.93, py = 1.6, ph = 4.35;
    box(sl, "", px, py, pw, ph, { fill: "FFFFFF", line: HAIR, r: 0.08, lw: 1, name: "!!panel" });
    txt(sl, part.title, px + 0.3, py + 0.2, pw - 0.6, 0.45, { fs: 20, bold: true, color: C.purple.t, valign: "middle", name: "!!ptitle" });
    if (part.rows) {
      part.rows.forEach(([k, v], i) => {
        const y = py + 0.9 + i * 0.62;
        txt(sl, k, px + 0.3, y, 1.55, 0.5, { fs: 13.5, bold: true, color: TEXT, valign: "middle", name: "!!ok" + i });
        txt(sl, v, px + 1.9, y, pw - 2.2, 0.5, { fs: 13.5, color: TEXT2, valign: "middle", name: "!!ov" + i });
      });
      txt(sl, part.foot, px + 0.3, py + ph - 0.75, pw - 0.6, 0.45, { fs: 13.5, italic: true, bold: true, color: C.purple.o, name: "!!pfoot" });
    } else {
      const label = (t, y, n) => txt(sl, t, px + 0.3, y, pw - 0.6, 0.26, { fs: 10.5, bold: true, color: TEXT2, name: "!!pl" + n });
      label("WHAT IT IS", py + 0.78, 1);
      txt(sl, part.what, px + 0.3, py + 1.03, pw - 0.6, 0.62, { fs: 13.5, color: TEXT, name: "!!pwhat" });
      label("IN THIS GRAPH", py + 1.7, 2);
      txt(sl, part.here, px + 0.3, py + 1.95, pw - 0.6, 0.62, { fs: 13, color: TEXT, name: "!!phere" });
      box(sl, [{ text: "Think of it as  ", options: { bold: true } }, { text: part.like }], px + 0.3, py + 2.65, pw - 0.6, 0.5,
        { col: C.teal, fs: 12.5, align: "left", margin: 8, r: 0.06, name: "!!plike" });
      box(sl, part.code, px + 0.3, py + 3.27, pw - 0.6, ph - 3.27 - 0.22,
        { fill: "F7F6F2", line: HAIR, lw: 0.5, mono: true, fs: 10, color: TEXT, align: "left", valign: "middle", margin: 8, r: 0.04, name: "!!pcode" });
    }

    // ---- buttons (bottom): jump to each part ----
    const gap = 0.1, bw = (12.43 - gap * (PARTS.length - 1)) / PARTS.length;
    PARTS.forEach((b, i) => {
      const active = i === p;
      box(sl, [{ text: b.btn, options: { hyperlink: { slide: FIRST + i, tooltip: b.title } } }],
        0.45 + i * (bw + gap), 6.2, bw, 0.46,
        { fill: active ? C.purple.o : "FFFFFF", line: C.purple.o, color: active ? "FFFFFF" : C.purple.t, bold: active, fs: 12.5, r: 0.23, margin: 0, name: "!!btn" + i });
    });
    sl.addNotes(NOTE["16b-" + part.key] || "");
  }

  await pres.writeFile({ fileName: OUT });
  console.log("Wrote", OUT);
})();
