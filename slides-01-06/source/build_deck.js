// build_deck.js — generates ../Slides-01-06.pptx (the 43-slide master) with Morph-ready step slides.
// Run (from this folder):  node build_deck.js [out.pptx] && python add_morph.py && python apply_notes.py
// Morph pairs shapes by name: every animated shape has a stable "!!name" across its step slides.

const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const tb = require("react-icons/tb");
const sharp = require("sharp");

const ROOT = __dirname;
const STEPS = JSON.parse(fs.readFileSync(path.join(ROOT, "slide2_steps.json"), "utf8"));
const ICON_DIR = path.join(require("os").tmpdir(), "deck-icons"); // icon cache, rebuilt when missing
fs.mkdirSync(ICON_DIR, { recursive: true });

// ---------- Design system (white background) ----------
const C = {
  purple: { f: "EEEDFE", o: "534AB7", t: "3C3489" },
  teal:   { f: "E1F5EE", o: "0F6E56", t: "085041" },
  coral:  { f: "FAECE7", o: "993C1D", t: "712B13" },
  amber:  { f: "FAEEDA", o: "854F0B", t: "633806" },
  red:    { f: "FCEBEB", o: "A32D2D", t: "791F1F" },
  gray:   { f: "F1EFE8", o: "888780", t: "2C2C2A" },
};
const ARROW = "5F5E5A", TEXT = "2C2C2A", TEXT2 = "5F5E5A", CODE = "444441";
const GREEN = "1D9E75", AMBER = "BA7517", RED = "A32D2D";
const FONT = "Calibri", MONO = "Consolas";

// ---------- Icons: Tabler (react-icons/tb) -> PNG ----------
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

// ---------- Drawing helpers (inches) ----------
const M = (ox, oy, s) => ({ X: (u) => ox + u * s, Y: (u) => oy + u * s, S: (u) => u * s });

function line(sl, x1, y1, x2, y2, o = {}) {
  const ln = { color: o.color || ARROW, width: o.width || 1.25 };
  if (o.dash) ln.dashType = "dash";
  if (o.end !== false) ln.endArrowType = "triangle";
  if (o.both) ln.beginArrowType = "triangle";
  sl.addShape("line", {
    x: Math.min(x1, x2), y: Math.min(y1, y2),
    w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
    flipH: x2 < x1, flipV: y2 < y1, line: ln, objectName: o.name,
  });
}
function box(sl, text, x, y, w, h, o = {}) {
  const col = o.col || C.gray;
  const opts = {
    shape: o.oval ? "ellipse" : "roundRect", x, y, w, h,
    rectRadius: o.oval ? undefined : (o.r ?? 0.08),
    fill: { color: o.fill || col.f },
    line: { color: o.line || col.o, width: o.lw || 1, dashType: o.dash ? "dash" : "solid" },
    fontFace: o.mono ? MONO : FONT, fontSize: o.fs || 12, color: o.color || col.t,
    bold: !!o.bold, align: o.align || "center", valign: o.valign || "middle",
    margin: o.margin ?? 4, objectName: o.name, isTextBox: false,
  };
  if (o.noFill) opts.fill = { color: "FFFFFF", transparency: 100 };
  sl.addText(text || "", opts);
}
function txt(sl, text, x, y, w, h, o = {}) {
  sl.addText(text, {
    x, y, w, h, fontFace: o.mono ? MONO : FONT, fontSize: o.fs || 14, color: o.color || TEXT,
    bold: !!o.bold, italic: !!o.italic, align: o.align || "left", valign: o.valign || "top",
    margin: o.margin ?? 0, objectName: o.name, isTextBox: true, paraSpaceAfter: o.psa || 0,
  });
}
function twoLine(title, sub, col, fsT = 12, fsS = 10) {
  return [
    { text: title, options: { bold: true, fontSize: fsT, color: col.t, breakLine: true } },
    { text: sub, options: { fontSize: fsS, color: col.o } },
  ];
}
// House style (matches the team deck): bold title, thin rule, a short lead line, RESTRICTED + page number footer.
const TITLE_FONT = "Calibri", BODY_FONT = "Arial";
function header(sl, t, lead) {
  txt(sl, t, 0.45, 0.22, 12.4, 0.58, { fs: 26, bold: true, color: "1A1A1A", valign: "bottom", name: "!!title" });
  line(sl, 0.45, 0.88, 12.88, 0.88, { end: false, color: "7F7F7F", width: 0.75, name: "!!rule" });
  if (lead) sl.addText(lead, { x: 0.45, y: 0.97, w: 12.4, h: 0.48, fontFace: BODY_FONT, fontSize: 14, color: "404040",
    valign: "top", margin: 0, isTextBox: true, objectName: "!!lead" });
  footer(sl);
}
function footer(sl) {
  sl.slideNumber = { x: 6.17, y: 6.98, w: 1.0, h: 0.22, fontFace: BODY_FONT, fontSize: 10, color: "595959", align: "center" };
  sl.addText("RESTRICTED", { x: 5.67, y: 7.17, w: 2.0, h: 0.22, fontFace: BODY_FONT, fontSize: 8, color: "7F7F7F",
    align: "center", margin: 0, isTextBox: true, objectName: "!!restricted" });
}
// Lead lines: one or two sentences per slide, a reminder of the point while presenting
const LEAD = {
  1: "Every LLM reply ends with a response code: the model's reason for stopping. A single agent reads it after every call to decide what to do next, and every provider names it differently.",
  2: "Agents suffer from overload too: the more work one agent carries, the weaker its decisions get. Same agent, same five tools: first one BAU ticket, then three.",
  3: "Thinking, acting and checking are mixed together in one loop. Sort the same messages by job and three separate responsibilities appear.",
  4: "Too much work in one loop shows up as recognisable errors, like picking the wrong tool. They fall into three families: thinking, acting and checking.",
  5: "Without structure, intelligence degrades. The fix is design, not a bigger model: apply five principles we already trust and the monolith becomes a multi-agent system.",
  6: "Give each agent one job and connect them with clear hand-offs. The shape can change (supervisor, pipeline, swarm); the building blocks stay the same.",
};
function pill(sl, m, cx, cy, label, name, col = C.gray) {
  const w = m.S(label.length * 7 + 22), h = m.S(20);
  box(sl, label, m.X(cx) - w / 2, m.Y(cy) - h / 2, w, h, { col, r: h / 2, fs: 9, mono: true, margin: 0, name, color: TEXT });
}

// ---------- Build ----------
(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
  pres.title = "Multi-Agent Systems & Subgraph Architecture";
  pres.author = "Amitkumar";
  pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
  const NOTE = parseNotes(fs.readFileSync(path.join(ROOT, "LOCKED.md"), "utf8"));
  const newSlide = (sec) => { const s = pres.addSlide({ sectionTitle: sec }); s.background = { color: "FFFFFF" }; return s; };

  // ===================== SLIDE 1 — Response codes =====================
  pres.addSection({ title: "1 · Response Codes" });
  {
    const sl = newSlide("1 · Response Codes");
    header(sl, "Response Codes: How an Agent Knows What Just Happened", LEAD[1]);
    // Left: one real-shaped reply
    txt(sl, "One reply from a single agent (Groq · OpenAI format)", 0.45, 1.58, 5.7, 0.3, { fs: 13, bold: true });
    const J = [
      ['{', 0], ['  "model": "openai/gpt-oss-120b",', 0], ['  "choices": [{', 0], ['    "message": {', 0],
      ['      "role": "assistant",', 0], ['      "content": null,', 0], ['      "tool_calls": [{', 0], ['        "function": {', 0],
      ['          "name": "run_sql",', 0], ['          "arguments": "{\\"ticket\\": \\"4521\\"}"', 0], ['        }', 0], ['      }]', 0],
      ['    },', 0], ['    "finish_reason": "tool_calls"', 1], ['  }],', 0], ['  "usage": {"prompt_tokens": 812, "completion_tokens": 41}', 0], ['}', 0]];
    const cy = 1.95, lh = 0.19;
    box(sl, "", 0.45, cy, 5.75, J.length * lh + 0.24, { fill: "F7F6F2", line: "D3D1C7", r: 0.05, lw: 0.75, name: "!!jsonbox" });
    const hi = J.findIndex((l) => l[1]);
    box(sl, "", 0.55, cy + 0.12 + hi * lh - 0.01, 3.1, lh + 0.02, { fill: C.amber.f, line: C.amber.o, r: 0.03, lw: 0.75, name: "!!jsonhi" });
    J.forEach(([t, h], i) => txt(sl, t, 0.65, cy + 0.12 + i * lh, 5.5, lh,   // one box per line = exact positions
      { mono: true, fs: 10.5, valign: "middle", color: h ? C.amber.t : TEXT, bold: !!h, name: "!!json" + i }));
    box(sl, "← response code", 3.85, cy + 0.12 + hi * lh - 0.02, 1.45, lh + 0.04, { col: C.amber, fs: 10, bold: true, r: 0.1, margin: 0, name: "!!jsonlbl" });
    txt(sl, [{ text: "content", options: { fontFace: MONO } }, { text: " is empty because the model wants a tool. The response code tells the loop what to do next." }],
      0.45, cy + J.length * lh + 0.36, 5.75, 0.5, { fs: 12, color: TEXT2, name: "!!jsoncap" });

    // Right: same idea, different names
    const rx = 6.55, rw = 6.33;
    txt(sl, "Same idea, different names", rx, 1.58, rw, 0.3, { fs: 13, bold: true });
    const mono = (t, col = TEXT) => ({ text: t, options: { fontFace: MONO, fontSize: 11, color: col } });
    const hd = (t, col = C.gray) => ({ text: t, options: { bold: true, color: col.t, fill: { color: col.f }, fontSize: 11.5 } });
    const rows = [
      [hd("What happened"), hd("Groq · OpenAI", C.teal), hd("Anthropic", C.coral), hd("Gemini", C.purple)],
      [{ text: "Field name", options: { bold: true, fontSize: 11.5 } }, mono("finish_reason", C.teal.t), mono("stop_reason", C.coral.t), mono("finishReason", C.purple.t)],
      [{ text: "Finished the answer", options: { fontSize: 11.5 } }, mono("stop"), mono("end_turn"), mono("STOP")],
      [{ text: "Wants a tool", options: { fontSize: 11.5 } }, mono("tool_calls"), mono("tool_use"), mono("STOP *")],
      [{ text: "Cut off (token limit)", options: { fontSize: 11.5 } }, mono("length"), mono("max_tokens"), mono("MAX_TOKENS")],
      [{ text: "Blocked or refused", options: { fontSize: 11.5 } }, mono("content_filter"), mono("refusal"), mono("SAFETY")],
    ];
    sl.addTable(rows, { x: rx, y: 1.95, w: rw, colW: [1.95, 1.55, 1.43, 1.4], rowH: 0.38, fontFace: FONT, color: TEXT,
      valign: "middle", margin: [2, 6, 2, 6], border: { type: "solid", pt: 0.75, color: "D3D1C7" }, objectName: "!!codes" });
    txt(sl, "* Gemini says STOP even when it wants a tool; the function call sits in the reply's content.", rx, 4.3, rw, 0.25, { fs: 10, italic: true, color: TEXT2, name: "!!gemnote" });
    txt(sl, "What the loop does next", rx, 4.66, rw, 0.3, { fs: 13, bold: true });
    const ACT = [["tool_calls", "run the tool, call again ↻", C.teal], ["stop", "return the answer, done", C.gray],
      ["length", "raise the limit or continue", C.amber], ["content_filter", "stop and escalate", C.coral]];
    ACT.forEach(([k, v, col], i) => {
      const x = rx + (i % 2) * (rw / 2 + 0.05), y = 5.02 + Math.floor(i / 2) * 0.5, w = rw / 2 - 0.05;
      box(sl, [{ text: k + "  →  ", options: { fontFace: MONO, bold: true, fontSize: 10.5 } }, { text: v, options: { fontSize: 11 } }],
        x, y, w, 0.42, { col, align: "left", margin: 6, r: 0.06, lw: 0.75, name: "!!act" + i });
    });
    box(sl, [{ text: "One field steers the whole loop. ", options: { bold: true } },
      { text: "Fine for one task, fragile at scale: and that's exactly where single agents start to fail →" }],
      0.45, 6.15, 12.43, 0.55, { col: C.purple, fs: 14, align: "left", margin: 12, r: 0.1, name: "!!bridge1" });
    sl.addNotes(NOTE[1] || "");
  }

  // ===================== SLIDE 2 (Morph steps) =====================
  pres.addSection({ title: "2 · Why Single Agents Fail" });
  {
    const N = STEPS.nodes, E = STEPS.edges;
    const R = { ticket: 26, agent: 40 };
    const m = M(0.45, 1.42, 0.0122);
    const ICON = { ticket: "TbTicket", agent: "TbRobot", sql: "TbDatabase", code: "TbCode", tests: "TbTestPipe", human: "TbUserCheck", close: "TbCircleCheck" };
    const key = (a, b) => [a, b].sort().join("-");
    const geo = (a, b) => { // shortened edge endpoints
      const [ax, ay] = N[a].pos, [bx, by] = N[b].pos, ra = R[a] || 28, rb = R[b] || 28;
      const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy);
      return [ax + dx / l * (ra + 4), ay + dy / l * (ra + 4), bx - dx / l * (rb + 4), by - dy / l * (rb + 4)];
    };
    const iconFiles = {};
    for (const id in ICON) iconFiles[id] = await icon(ICON[id], id === "agent" ? C.purple.o : TEXT);
    iconFiles.agentRed = await icon("TbRobot", RED);

    function frame(st) {
      const sl = newSlide("2 · Why Single Agents Fail");
      header(sl, "Why Single Agents Fail", LEAD[2]);
      // edges
      E.forEach(([a, b]) => {
        const k = key(a, b), [x1, y1, x2, y2] = geo(a, b), e = st.edges[k];
        line(sl, m.X(x1), m.Y(y1), m.X(x2), m.Y(y2), { end: false, color: e ? e.c : "B4B2A9", width: e ? (e.active ? 3.5 : 2) : 1.25, name: "!!e_" + k });
      });
      // nodes
      for (const id in N) {
        const [x, y] = N[id].pos, r = R[id] || 28, isA = id === "agent";
        const outline = isA ? (st.agentRed ? RED : C.purple.o) : "888780";
        const fill = isA && st.agentFill ? C.red.f : "FFFFFF";
        box(sl, "", m.X(x - r), m.Y(y - r), m.S(2 * r), m.S(2 * r), { oval: true, fill, line: outline, lw: isA ? 2 : 1, name: "!!n_" + id });
        const isz = m.S(r * 1.05);
        sl.addImage({ path: isA && st.agentRed ? iconFiles.agentRed : iconFiles[id], x: m.X(x) - isz / 2, y: m.Y(y) - isz / 2, w: isz, h: isz, objectName: "!!i_" + id });
        const side = ["ticket", "human", "close"].includes(id);
        if (side) txt(sl, N[id].label, m.X(x + r + 8), m.Y(y) - 0.13, 1.6, 0.26, { fs: 11, align: "left", valign: "middle", color: TEXT, name: "!!l_" + id });
        else txt(sl, N[id].label, m.X(x) - 0.9, m.Y(y + r + 6), 1.8, 0.25, { fs: 11, align: "center", color: TEXT, name: "!!l_" + id });
      }
      // dot
      const d = m.S(16);
      box(sl, "", m.X(st.dot[0]) - d / 2, m.Y(st.dot[1]) - d / 2, d, d, { oval: true, fill: st.dotC, line: st.dotC, name: "!!dot" });
      // right panel
      const px = 9.35, pw = 3.5;
      const happy = st.mode === "happy";
      box(sl, happy ? "Happy flow · 1 ticket" : "Chaotic flow · 3 tickets", px, 1.5, 2.4, 0.36,
        { col: happy ? C.teal : C.red, fs: 12, bold: true, r: 0.18, name: "!!mode" });
      txt(sl, st.stepLabel, px, 1.98, pw, 0.3, { fs: 12, color: TEXT2, name: "!!stepno" });
      txt(sl, st.caption, px, 2.26, pw, 0.95, { fs: 18, bold: true, name: "!!cap" });
      box(sl, st.code || " ", px, 3.26, pw, 0.8, { col: C.gray, mono: true, fs: 10.5, align: "left", color: CODE, margin: 8, name: "!!code" });
      txt(sl, st.smell ? "Design smell: " + st.smell : " ", px, 4.14, pw, 0.35, { fs: 13, bold: true, color: RED, name: "!!smell" });
      const stats = [["LLM calls", st.calls], ["Wasted loops", st.loops], ["Context used", st.ctx + "%"]];
      stats.forEach(([k, v], i) => {
        const x = px + i * 1.19;
        box(sl, [{ text: k, options: { fontSize: 10, color: TEXT2, breakLine: true } }, { text: String(v), options: { fontSize: 20, bold: true, color: TEXT } }],
          x, 4.58, 1.1, 0.8, { col: C.gray, line: "D3D1C7", align: "left", valign: "top", margin: 7, name: "!!stat" + i });
      });
      box(sl, "", px, 5.52, pw, 0.14, { fill: "EEEDE6", line: "EEEDE6", r: 0.07, name: "!!ctxbg" });
      const cw = Math.max(0.02, pw * st.ctx / 100);
      const cc = st.ctx < 50 ? GREEN : st.ctx < 80 ? AMBER : RED;
      box(sl, "", px, 5.52, cw, 0.14, { fill: cc, line: cc, r: 0.07, name: "!!ctxbar" });
      if (st.final) box(sl, st.final, px, 5.85, pw, 0.7, { col: st.finalCol, fs: 13, bold: true, align: "left", margin: 10, name: "!!final" });
      return sl;
    }

    function run(mode, steps, intro) {
      const edges = {}; let calls = 0, loops = 0, ctx = 0;
      const start = N.ticket.pos;
      const base = { mode, edges: {}, dot: [start[0], start[1] + 26 + 2], dotC: mode === "happy" ? GREEN : AMBER, calls: 0, loops: 0, ctx: 0 };
      const s0 = frame({ ...base, stepLabel: "Before we start", caption: intro.caption, code: intro.code });
      s0.addNotes(intro.note);
      steps.forEach((s, i) => {
        if (s.to === "agent") calls++;
        if (s.wasted) loops++;
        ctx = Math.min(100, ctx + s.ctx);
        const col = mode === "happy" ? GREEN : (loops < 2 ? AMBER : RED);
        Object.values(edges).forEach((e) => (e.active = false));
        let dot;
        if (s.from === s.to) dot = [N.agent.pos[0], N.agent.pos[1] - 40 - 10];
        else { const g = geo(s.from, s.to); dot = [g[2], g[3]]; edges[key(s.from, s.to)] = { c: col, active: true }; }
        const last = i === steps.length - 1;
        const sl = frame({
          mode, edges: JSON.parse(JSON.stringify(edges)), dot, dotC: col, calls, loops, ctx,
          stepLabel: `Step ${i + 1} of ${steps.length}`, caption: s.caption, code: s.code, smell: s.smell,
          agentRed: mode === "chaos" && ctx >= 70, agentFill: mode === "chaos" && last,
          final: last ? (mode === "happy" ? "1 ticket, 4 LLM calls, fixed and signed off." : "3 tickets, 0 fixed. The model didn't get worse; the design did.") : null,
          finalCol: mode === "happy" ? C.teal : C.red,
        });
        sl.addNotes(`${s.caption}\n${s.code}${s.smell ? "\nDesign smell: " + s.smell : ""}`);
      });
    }
    run("happy", STEPS.happy, { caption: "Same agent, same five tools. First, one ticket.", code: "messages = []  # one BAU defect", note: NOTE[2] });
    run("chaos", STEPS.chaos, { caption: "Now give the same agent three tickets in one session.", code: "messages = []  # three BAU defects", note: "Chaotic flow. Same graph, same tools — three tickets in one session. Let the clicks run quickly; the speed sells the chaos.\n\nTakeaway: A single agent is a monolith. It works for one task and fails like a monolith when you scale the work." });
  }

  // ===================== SLIDE 3 (3a mixed → 3b sorted) =====================
  pres.addSection({ title: "3 · Why Single Agents Fail – Part 2" });
  {
    const B = [
      ["T", "Read 3 tickets", "no signal"], ["A", "SQL: SELECT *", "tool_use"], ["A", "50k rows", "tool", 1], ["T", "Suspect join", "no signal"],
      ["A", "Search code", "tool_use"], ["T", "Switch to 4522", "no signal"], ["A", "SQL: 4522", "tool_use"], ["A", "Test 4521 + 4522 data", "tool_use"],
      ["C", "Fail", "tool"], ["A", "Retry same fix", "tool_use"], ["C", "Fail again", "tool"], ["A", "Edit the test", "tool_use"],
      ["C", "False pass", "tool"], ["T", "Ask sign-off", "end_turn"], ["C", "Human rejects", "user"], ["T", "Context full", "max_tokens"]];
    const COL = { T: C.purple, A: C.teal, C: C.coral }, LANE = { T: 0, A: 1, C: 2 };
    const H = 0.25, TALL = 0.5, G = 0.045, Y0 = 1.8;
    for (const sorted of [false, true]) {
      const sl = newSlide("3 · Why Single Agents Fail – Part 2");
      header(sl, "Why Single Agents Fail – Part 2", LEAD[3]);
      if (!sorted) txt(sl, "One agent, one context window  ·  time flows down ↓", 0.6, 1.47, 7.6, 0.3, { fs: 12, color: TEXT2, name: "!!hdm" });
      else ["Thinking", "Acting", "Checking"].forEach((n, i) =>
        txt(sl, n, 0.6 + i * 2.57, 1.47, 2.47, 0.3, { fs: 13, bold: true, align: "center", color: [C.purple, C.teal, C.coral][i].t, name: "!!lh" + i }));
      let y = Y0;
      B.forEach(([j, l, t, tall], i) => {
        const h = tall ? TALL : H, col = COL[j], nm = String(i + 1).padStart(2, "0");
        const x = sorted ? 0.6 + LANE[j] * 2.57 : 0.6, w = sorted ? 2.47 : 7.6;
        box(sl, l, x, y, w, h, { col, fs: 11, align: "left", margin: 8, color: TEXT, r: 0.05, lw: 0.75, name: "!!blk" + nm });
        if (!sorted) txt(sl, t, x + w - 1.6, y, 1.5, h, { fs: 10, mono: true, color: TEXT2, align: "right", valign: "middle", name: "!!tag" + nm });
        y += h + G;
      });
      const px = 8.7, pw = 4.1;
      txt(sl, "Three jobs in one loop", px, 1.8, pw, 0.4, { fs: 18, bold: true });
      const rows = [["Thinking", "which ticket, what cause, which tool next", C.purple], ["Acting", "SQL, code search, tests", C.teal], ["Checking", "did the fix work, does the evidence match", C.coral]];
      rows.forEach(([n, d, col], i) => {
        box(sl, "", px, 2.38 + i * 0.62, 0.22, 0.22, { col, r: 0.04 });
        txt(sl, [{ text: n + ": ", options: { bold: true, color: col.t } }, { text: d, options: { color: TEXT } }], px + 0.35, 2.32 + i * 0.62, pw - 0.35, 0.5, { fs: 14 });
      });
      txt(sl, [{ text: "finish_reason", options: { fontFace: MONO, bold: true } }, { text: " only signals acting (tool_use) or stopping (end_turn). There is no \"plan ready\" and no \"check passed\"." }],
        px, 4.3, pw, 0.9, { fs: 14 });
      if (sorted) box(sl, "One loop, three jobs, one exit signal. We'd never let the maker check their own work. Why let an agent?",
        px, 5.45, pw, 1.1, { col: C.coral, fs: 14, bold: true, align: "left", margin: 12, r: 0.12, name: "!!take3" });
      sl.addNotes(sorted ? NOTE[3] + "\n\n[3b] Same messages, sorted by job. Each lane is a different responsibility, and could be its own agent." : NOTE[3]);
    }
  }

  // ===================== SLIDE 4 (reveal families) =====================
  pres.addSection({ title: "4 · Failure Modes" });
  {
    const FAM = [
      ["Thinking failures", "TbBrain", C.purple, [
        ["Goal drift", "TbRouteOff", "wanders off the original ask", "long, crowded context", "asked to summarise a report, starts rewriting it"],
        ["Wrong tool", "TbTool", "right intent, wrong action", "too many similar tools", "sends the email instead of drafting it"]]],
      ["Acting failures", "TbPlayerPlay", C.teal, [
        ["Infinite loop", "TbRepeat", "same step again and again", "no step limit, no memory of failures", "keeps re-searching the same flight"],
        ["Error cascade", "TbStack2", "one bad step spoils the rest", "no isolation or checkpoints", "wrong customer ID used in every later step"]]],
      ["Checking failures", "TbChecklist", C.coral, [
        ["False success", "TbMoodCheck", "says \"done\" when it isn't", "grades its own work", "\"report sent\" but the attachment is empty"],
        ["Premature stop", "TbPlayerStop", "quits halfway, sounds confident", "\"stopped talking\" read as \"finished\"", "answers 2 of 5 questions"]]]];
    for (let reveal = 1; reveal <= 3; reveal++) {
      const sl = newSlide("4 · Failure Modes");
      header(sl, "Failure Modes: What You Observe", LEAD[4]);
      for (let f = 0; f < reveal; f++) {
        const [fn, fic, col, cards] = FAM[f], x = 0.6 + f * 4.1, w = 3.9;
        sl.addImage({ path: await icon(fic, col.o), x, y: 1.5, w: 0.32, h: 0.32, objectName: "!!fi" + f });
        txt(sl, fn, x + 0.42, 1.5, w - 0.42, 0.34, { fs: 17, bold: true, color: col.t, valign: "middle", name: "!!fh" + f });
        for (let c = 0; c < 2; c++) {
          const [cn, cic, see, cause, ex] = cards[c], y = 2.0 + c * 2.2, nm = `${f}${c}`;
          box(sl, "", x, y, w, 2.05, { col, r: 0.14, lw: 1, name: "!!card" + nm });
          sl.addImage({ path: await icon(cic, col.o), x: x + 0.2, y: y + 0.2, w: 0.3, h: 0.3, objectName: "!!ci" + nm });
          txt(sl, cn, x + 0.6, y + 0.18, w - 0.8, 0.36, { fs: 16, bold: true, color: col.t, valign: "middle", name: "!!cn" + nm });
          txt(sl, [
            { text: "See: ", options: { bold: true, color: col.t } }, { text: see, options: { breakLine: true } },
            { text: "Cause: ", options: { bold: true, color: col.t } }, { text: cause, options: { breakLine: true } },
            { text: "Example: ", options: { bold: true, color: col.t } }, { text: ex }],
            x + 0.2, y + 0.62, w - 0.4, 1.4, { fs: 14, color: TEXT, psa: 4, name: "!!cb" + nm });
        }
      }
      if (reveal === 3) txt(sl, "Every failure is one of three jobs going wrong, and every cause is a design choice.", 0.6, 6.4, 12.1, 0.45,
        { fs: 17, italic: true, bold: true, color: TEXT, align: "center", name: "!!take4" });
      sl.addNotes(reveal === 1 ? NOTE[4] : reveal === 2 ? "Acting failures: it can't stop doing — it loops, or one bad step poisons everything after it." : "Checking failures look like success: it says \"done\" when it isn't, or stops halfway and sounds confident. None of these are model problems. They're all design choices.\n\nBridge: If every cause is a design choice, the fix is a design fix.");
    }
  }

  // ===================== SLIDE 5 (monolith → multi-agent, 6 steps) =====================
  pres.addSection({ title: "5 · Root Cause" });
  {
    const m = M(0.45, 1.5, 0.0118);
    const J = [["Planner", "TbBrain", C.purple, 140], ["Worker", "TbTool", C.teal, 340], ["Checker", "TbChecklist", C.coral, 540]];
    const cluster = [[310, 165, 0.62], [370, 165, 0.62], [340, 208, 0.62]];
    const S = [
      ["Root cause", "One agent does thinking, acting and checking, shares one context, and only stops when finish_reason says so."],
      ["Separation of concerns", "Split the three jobs: a Planner thinks, a Worker acts, a Checker checks."],
      ["Isolated state", "Each part keeps only its own data. The big query result never reaches the Planner."],
      ["Bounded execution", "Retry limits and checkpoints. A failure stops or resumes from a checkpoint; it doesn't loop."],
      ["Maker-checker", "The Checker verifies independently. The Worker can't touch the tests."],
      ["Explicit hand-offs", "Each step returns a structured status instead of relying on finish_reason. This is a multi-agent system."]];
    const ticket = await icon("TbTicket", TEXT), db = await icon("TbDatabase", RED), flag = await icon("TbFlag", TEXT2), lock = await icon("TbLock", C.coral.o);
    const ok = await icon("TbCircleCheck", GREEN), todo = await icon("TbCircle", "B4B2A9");
    const jIcons = []; for (const j of J) jIcons.push(await icon(j[1], j[2].o));
    for (let s = 0; s < 6; s++) {
      const sl = newSlide("5 · Root Cause");
      header(sl, "Root Cause: A System Design Problem", LEAD[5]);
      // task
      box(sl, "", m.X(316), m.Y(16), m.S(48), m.S(48), { oval: true, fill: "FFFFFF", line: "888780", name: "!!task" });
      sl.addImage({ path: ticket, x: m.X(340) - m.S(13), y: m.Y(40) - m.S(13), w: m.S(26), h: m.S(26), objectName: "!!taski" });
      txt(sl, "Task", m.X(372), m.Y(32), 0.8, 0.22, { fs: 11, color: TEXT, name: "!!taskl" });
      if (s === 0) {
        box(sl, "", m.X(270), m.Y(110), m.S(140), m.S(140), { oval: true, noFill: true, line: RED, lw: 2, name: "!!big" });
        txt(sl, "↻ one loop, one agent", m.X(418), m.Y(110), 2.0, 0.25, { fs: 11, bold: true, color: RED, name: "!!bigl" });
        line(sl, m.X(340), m.Y(66), m.X(340), m.Y(106), { name: "!!lt0" });
        pill(sl, m, 530, 236, "finish_reason decides all", "!!fr", C.amber);
      } else {
        line(sl, m.X(316), m.Y(40), m.X(122), m.Y(40), { end: false, name: "!!lt1a" });
        line(sl, m.X(122), m.Y(40), m.X(122), m.Y(146), { name: "!!lt1b" });
        line(sl, m.X(178), m.Y(180), m.X(300), m.Y(180), { name: "!!lpw" });
        line(sl, m.X(378), m.Y(180), m.X(500), m.Y(180), { name: "!!lwc" });
        line(sl, m.X(540), m.Y(144), m.X(540), m.Y(118), { end: false, dash: true, name: "!!fb1" });
        line(sl, m.X(540), m.Y(118), m.X(160), m.Y(118), { end: false, dash: true, name: "!!fb2" });
        line(sl, m.X(160), m.Y(118), m.X(160), m.Y(146), { dash: true, name: "!!fb3" });
      }
      // agents
      J.forEach(([n, , col, x], i) => {
        const [cx, cy, sc] = s === 0 ? cluster[i] : [x, 180, 1];
        const r = 36 * sc;
        box(sl, "", m.X(cx - r), m.Y(cy - r), m.S(2 * r), m.S(2 * r), { oval: true, fill: "FFFFFF", line: col.o, lw: i === 2 && s >= 4 ? 3.5 : 1.5, name: "!!j" + i });
        const isz = m.S(r * 1.2);
        sl.addImage({ path: jIcons[i], x: m.X(cx) - isz / 2, y: m.Y(cy) - isz / 2, w: isz, h: isz, objectName: "!!ji" + i });
        if (s > 0) txt(sl, n, m.X(cx) - 0.7, m.Y(cy + 42), 1.4, 0.26, { fs: 12, bold: true, color: col.t, align: "center", name: "!!jl" + i });
      });
      // memory
      if (s < 2) {
        box(sl, "Shared context: every task, every result", m.X(190), m.Y(290), m.S(300), m.S(46), { col: C.red, fs: 11, color: C.red.t, name: "!!shm" });
        if (s === 0) line(sl, m.X(340), m.Y(252), m.X(340), m.Y(288), { name: "!!sm0" });
        else [[140, 250], [340, 340], [540, 430]].forEach(([a, b], i) => line(sl, m.X(a), m.Y(240), m.X(b), m.Y(288), { name: "!!sm1" + i }));
      } else {
        J.forEach(([, , col, x], i) => {
          box(sl, "Own state", m.X(x - 65), m.Y(292), m.S(130), m.S(42), { col, fs: 11, name: "!!own" + i });
          line(sl, m.X(x), m.Y(240), m.X(x), m.Y(290), { name: "!!owl" + i });
        });
      }
      if (s >= 3) {
        pill(sl, m, 445, 258, "↻ max 3 tries", "!!retry", C.amber);
        [240, 440].forEach((x, i) => sl.addImage({ path: flag, x: m.X(x) - m.S(9), y: m.Y(196), w: m.S(18), h: m.S(18), objectName: "!!flag" + i }));
      }
      if (s >= 4) {
        box(sl, "", m.X(556), m.Y(134), m.S(26), m.S(26), { oval: true, fill: "FFFFFF", line: C.coral.o, name: "!!lockc" });
        sl.addImage({ path: lock, x: m.X(569) - m.S(8), y: m.Y(147) - m.S(8), w: m.S(16), h: m.S(16), objectName: "!!locki" });
      }
      if (s >= 5) {
        pill(sl, m, 240, 160, "{plan}", "!!pP", C.purple);
        pill(sl, m, 440, 160, "{result}", "!!pW", C.teal);
        pill(sl, m, 350, 102, "{status: fail, why}", "!!pF", C.coral);
      }
      // right panel
      const px = 8.85, pw = 3.95;
      txt(sl, `Step ${s + 1} of 6`, px, 1.5, pw, 0.3, { fs: 12, color: TEXT2, name: "!!pstep" });
      txt(sl, S[s][0], px, 1.8, pw, 0.45, { fs: 22, bold: true, color: s === 0 ? RED : C.teal.t, name: "!!pname" });
      txt(sl, S[s][1], px, 2.35, pw, 1.15, { fs: 14, name: "!!pcap" });
      S.slice(1).forEach(([n], i) => {
        const done = s >= i + 1, y = 3.7 + i * 0.5;
        sl.addImage({ path: done ? ok : todo, x: px, y: y + 0.04, w: 0.28, h: 0.28, objectName: "!!cki" + i });
        txt(sl, n, px + 0.4, y, pw - 0.4, 0.36, { fs: 14, bold: done, color: done ? TEXT : "888780", valign: "middle", name: "!!ckt" + i });
      });
      if (s === 5) txt(sl, "This isn't an AI problem. It's a system design problem we've already solved, just not for agents yet.",
        0.6, 6.3, 12.1, 0.5, { fs: 16, italic: true, bold: true, align: "center", name: "!!take5" });
      sl.addNotes(s === 0 ? NOTE[5] : `${S[s][0]}: ${S[s][1]}${s === 5 ? "\n\nBridge: So what does an agent system look like when we apply these principles? That's a multi-agent system." : ""}`);
    }
  }

  // ===================== SLIDE 6 (three shapes → why better) =====================
  pres.addSection({ title: "6 · Core Idea" });
  {
    const robot = await icon("TbRobot", GREEN), ok = await icon("TbCircleCheck", GREEN);
    const L = [
      { name: "1 · Supervisor", c: [340, 60, "Supervisor"], g: [565, 60], a: [[140, 190], [340, 190], [540, 190]], s: "Shared state",
        e: [[442, 60, 488, 60, 1], [300, 86, 160, 158, 1], [340, 86, 340, 152, 1], [380, 86, 520, 158, 1], [140, 252, 140, 294], [340, 252, 340, 294], [540, 252, 540, 294]] },
      { name: "2 · Pipeline", c: [140, 60, "Input"], g: [565, 60], a: [[140, 190], [340, 190], [540, 190]], s: "Shared state",
        e: [[140, 86, 140, 152], [176, 190, 302, 190], [376, 190, 502, 190], [556, 160, 562, 88], [140, 252, 140, 294, 0, 1], [340, 252, 340, 294, 0, 1], [540, 252, 540, 294, 0, 1]] },
      { name: "3 · Peer swarm", c: [340, 50, "Task"], g: [565, 50], a: [[170, 230], [340, 140], [510, 230]], s: "Shared board",
        e: [[442, 50, 488, 50, 1], [340, 76, 340, 102], [200, 214, 310, 157, 1], [370, 157, 480, 214, 1], [206, 230, 474, 230, 1]] }];
    const views = [[0, M(1.83, 1.9, 0.014)], [1, M(1.83, 1.9, 0.014)], [2, M(1.83, 1.9, 0.014)], [0, M(0.5, 1.95, 0.0095)]];
    views.forEach(([li, m], vi) => {
      const sl = newSlide("6 · Core Idea");
      header(sl, "The Core Idea of Multi-Agent Systems", LEAD[6]);
      const P = L[li], fs = vi === 3 ? 11 : 14;
      if (vi < 3) L.forEach((q, k) => box(sl, q.name, 0.6 + k * 1.75, 1.5, 1.6, 0.34,
        { col: k === li ? C.purple : C.gray, fs: 12, bold: k === li, r: 0.17, color: k === li ? C.purple.t : TEXT2, name: "!!tab" + k }));
      P.e.forEach(([x1, y1, x2, y2, both, dash], k) => line(sl, m.X(x1), m.Y(y1), m.X(x2), m.Y(y2), { both: !!both, dash: !!dash, name: `!!m${li}e${k}` }));
      box(sl, P.c[2], m.X(P.c[0] - 100), m.Y(P.c[1] - 25), m.S(200), m.S(50), { col: C.purple, fs, bold: true, name: "!!coord" });
      box(sl, "Human gate", m.X(P.g[0] - 75), m.Y(P.g[1] - 25), m.S(150), m.S(50), { col: C.coral, fs, bold: true, name: "!!guard" });
      P.a.forEach(([x, y], i) => {
        box(sl, "", m.X(x - 34), m.Y(y - 34), m.S(68), m.S(68), { oval: true, fill: C.teal.f, line: C.teal.o, dash: true, name: "!!ag" + i });
        sl.addImage({ path: robot, x: m.X(x) - m.S(15), y: m.Y(y) - m.S(15), w: m.S(30), h: m.S(30), objectName: "!!agi" + i });
        txt(sl, "Agent " + "ABC"[i], m.X(x) - 0.8, m.Y(y + 40), 1.6, 0.3, { fs, bold: true, color: C.teal.t, align: "center", name: "!!agl" + i });
      });
      box(sl, P.s, m.X(50), m.Y(298), m.S(580), m.S(44), { col: C.gray, fs, bold: true, name: "!!shared" });
      if (vi === 3) {
        const px = 7.3, pw = 5.5;
        box(sl, "Replace one agent that does everything with a team of focused agents, each owning one job, coordinated through clear hand-offs.",
          px, 1.55, pw, 1.15, { col: C.purple, fs: 15, bold: true, align: "left", margin: 12, r: 0.12, name: "!!core" });
        const W = [["Focus", "small context, few tools, one job per agent"], ["Containment", "a failure stays inside one agent, not the whole run"],
          ["Independent checking", "the checker isn't the maker"], ["Modular", "test, swap or upgrade one agent at a time, even a different model per agent"]];
        W.forEach(([h, d], i) => {
          sl.addImage({ path: ok, x: px, y: 3.0 + i * 0.8, w: 0.3, h: 0.3, objectName: "!!wi" + i });
          txt(sl, [{ text: h, options: { bold: true, breakLine: true } }, { text: d, options: { color: TEXT2 } }], px + 0.45, 2.95 + i * 0.8, pw - 0.45, 0.72, { fs: 14, name: "!!wt" + i });
        });
        txt(sl, "A multi-agent system is a well-run team: one job each, clear hand-offs, a shared goal, and someone who signs off.",
          0.6, 6.3, 12.1, 0.5, { fs: 16, italic: true, bold: true, align: "center", name: "!!take6" });
      }
      sl.addNotes(vi === 0 ? NOTE[6] : vi === 3 ? "Why it's better: Focus, Containment, Independent checking, Modular.\n\nBridge to slides 8–13: Every pattern we'll see is the same five blocks wired differently — who coordinates, who talks to whom, and where the human sits."
        : vi === 1 ? "Pipeline: the agents work in sequence, each passing its result to the next." : "Peer swarm: the agents work as peers, talking to each other and agreeing on an answer.");
    });
  }

  const out = process.argv[2] || path.join(ROOT, "..", "Slides-01-06.pptx");
  await pres.writeFile({ fileName: out });
  console.log("Wrote", out);
})();

// Pull "**Speaker note:**" paragraphs per slide from LOCKED.md
function parseNotes(md) {
  const notes = {};
  md.split(/\n## Slide /).slice(1).forEach((sec) => {
    const n = parseInt(sec, 10);
    const m = sec.match(/\*\*Speaker note:\*\*\s*([^\n]+)/);
    const t = sec.match(/\*\*Takeaway:\*\*\s*([^\n]+)/);
    if (n && m) notes[n] = m[1].trim() + (t ? "\n\nTakeaway: " + t[1].trim() : "");
  });
  return notes;
}
