// build_slides.js — builds ../Slides-14-16.pptx: slides 14, 15, 16 and 16a (static draft; animations later).
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
function header(sl, title, sub, num) {
  txt(sl, title, 0.55, 0.3, 11.2, 0.65, { fs: 30, bold: true, name: "!!title" });
  if (sub) txt(sl, sub, 0.55, 0.95, 12.2, 0.35, { fs: 15, color: TEXT2, name: "!!sub" });
  txt(sl, num, 12.1, 7.05, 0.7, 0.25, { fs: 10, color: "888780", align: "right", name: "!!num" });
}
function notes() {
  const md = fs.readFileSync(path.join(ROOT, "..", "SPEAKER_NOTES.md"), "utf8");
  const out = {};
  md.split(/\n## Slide /).slice(1).forEach((sec) => {
    const id = sec.match(/^(\w+)/)[1];
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
    header(sl, "Common Mistakes in Multi-Agent Design", "Most multi-agent failures are design mistakes, not model mistakes.", "14");
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
    txt(sl, "Every mistake here is a missing decision: who does what, when is it done, and who checks.", 0.55, 6.6, 12.2, 0.4,
      { fs: 16, bold: true, italic: true, align: "center", name: "!!take" });
    sl.addNotes(NOTE["14"]);
  }

  // =========================== SLIDE 15 — Choose the pattern ===========================
  pres.addSection({ title: "15 · Choose the Pattern" });
  {
    const sl = newSlide("15 · Choose the Pattern");
    header(sl, "How to Choose the Right Pattern", "Start from the need, not the pattern.", "15");
    const rows = [
      ["Route each request to the right specialist", "Supervisor–Worker", "BAU triage sends a ticket to the SQL, code or test agent", "The supervisor becomes a bottleneck"],
      ["Reuse a self-contained capability inside bigger flows", "Subgraph", "One reconciliation subgraph used by the PD, LGD and EAD flows", "Keep its input and output state small and explicit"],
      ["A long task that needs a plan before doing", "Planner–Executor", "Plan a data-asset build from a BRD, then run each step", "Re-plan when a step fails; don't push on"],
      ["A known, fixed sequence of stages", "Specialist Pipeline", "Extract → transform → validate → report", "Errors flow downstream; check between stages"],
      ["Judgement calls where quality beats speed", "Peer + Debate", "Two reviewers challenge a model-change justification", "Cost and time; cap the number of rounds"],
      ["Many independent sub-tasks, then a sign-off", "Parallel Swarm + Human Gate", "Check 50 source feeds in parallel; a human approves the release", "Merging results, and approval fatigue"],
    ];
    const head = (t, col = C.gray) => ({ text: t, options: { bold: true, color: col.t, fill: { color: col.f }, fontSize: 13 } });
    const data = [[head("If you need…"), head("Use this pattern", C.purple), head("Example (our world)"), head("Watch out for", C.coral)]];
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
    header(sl, "Design Principles You Can Apply Tomorrow", "Eight habits that prevent the mistakes on slide 14.", "16");
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
    txt(sl, [{ text: "Role card · Data agent", options: { bold: true, fontSize: 16, color: C.teal.t, breakLine: true } }, { text: "BAU defect fix", options: { fontSize: 12, color: C.teal.o } }],
      cx + 0.75, cy + 0.17, cw - 0.9, 0.6, { name: "!!cardh" });
    const F = [
      ["Goal", "Find the source of the bad PD values for one ticket"],
      ["Tools", "run_sql (read-only, max 500 rows), search_code"],
      ["Reads", "ticket, plan"],
      ["Writes", "findings, status"],
      ["Done when", "the root-cause rows are identified, with evidence"],
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
    header(sl, "LangChain and LangGraph", "LangChain gives you the parts. LangGraph wires them into a graph that shares one state.", "16a");
    // Left: the two libraries
    const lx = 0.55, lw = 3.85;
    box(sl, "", lx, 1.5, lw, 2.15, { col: C.purple, r: 0.1, name: "!!lcbox" });
    sl.addImage({ path: await icon("TbPuzzle", C.purple.o), x: lx + 0.2, y: 1.66, w: 0.34, h: 0.34, objectName: "!!lcic" });
    txt(sl, "LangChain · the building blocks", lx + 0.62, 1.64, lw - 0.75, 0.4, { fs: 15, bold: true, color: C.purple.t, valign: "middle", name: "!!lch" });
    txt(sl, [
      { text: "One interface for chat models (e.g. ChatGroq, ChatAnthropic)", options: { bullet: true, breakLine: true } },
      { text: "Prompts, tools (@tool) and structured output", options: { bullet: true, breakLine: true } },
      { text: "create_agent: a ready-made agent loop", options: { bullet: true } },
    ], lx + 0.2, 2.1, lw - 0.35, 1.45, { fs: 12.5, color: TEXT, psa: 4, name: "!!lcb" });
    box(sl, "", lx, 3.85, lw, 2.15, { col: C.teal, r: 0.1, name: "!!lgbox" });
    sl.addImage({ path: await icon("TbGitBranch", C.teal.o), x: lx + 0.2, y: 4.01, w: 0.34, h: 0.34, objectName: "!!lgic" });
    txt(sl, "LangGraph · the orchestration", lx + 0.62, 3.99, lw - 0.75, 0.4, { fs: 15, bold: true, color: C.teal.t, valign: "middle", name: "!!lgh" });
    txt(sl, [
      { text: "Describe the system as nodes + edges over a shared state", options: { bullet: true, breakLine: true } },
      { text: "Loops and branching (conditional edges)", options: { bullet: true, breakLine: true } },
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
    K.forEach(([k, v], i) => box(sl, [{ text: k, options: { bold: true, fontSize: 12.5, color: C.purple.t, breakLine: true } }, { text: v, options: { fontSize: 11.5, color: TEXT2 } }],
      0.55 + i * (sw + 0.12), 6.25, sw, 0.66, { fill: "FFFFFF", line: HAIR, r: 0.08, margin: 4, name: "!!k" + i }));
    sl.addNotes(NOTE["16a"]);
  }

  await pres.writeFile({ fileName: OUT });
  console.log("Wrote", OUT);
})();
