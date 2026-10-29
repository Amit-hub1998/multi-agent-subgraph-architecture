# Multi-Agent Systems & Subgraph Architecture — Locked Slides

Status: Slide 1 ✅ locked · Slide 2 ✅ locked · Slide 3 ✅ locked · Slide 4 ✅ locked · Slide 5 ✅ locked (v2) · Slide 6 ✅ locked

---

## House style (team deck)

Title Calibri Bold 26pt, near-black, top left · thin grey rule under the title · one or two lead sentences in Arial 14pt grey (the reminder line) · footer: slide-number field centred + "RESTRICTED" below, Arial, grey. Titles follow the team's slide sheet.

## PPT design system (white background — applies to every slide)

Rule: light fill + darker outline + darkest text from the same colour family. Never white text on a light fill, never pure black on a coloured fill.

| Role | Fill | Outline | Text |
|---|---|---|---|
| Control / Supervisor / Thinking (purple) | #EEEDFE | #534AB7 | #3C3489 |
| Agents / Acting (teal) | #E1F5EE | #0F6E56 | #085041 |
| Checker / Checking / Human gate (coral) | #FAECE7 | #993C1D | #712B13 |
| Decision / finish_reason (amber) | #FAEEDA | #854F0B | #633806 |
| Error / chaos highlight (red) | #FCEBEB | #A32D2D | #791F1F |
| Neutral boxes (task, tools, shared state) | #F1EFE8 | #888780 | #2C2C2A |
| Connectors / arrows | — | #5F5E5A | — |
| Body text / captions | — | — | #2C2C2A / secondary #5F5E5A |

Slide background #FFFFFF. Animated dot: green #1D9E75 (happy), amber #BA7517 → red #A32D2D (chaos). Code lines in a monospace font (Consolas), #444441.

---

## Slide 1 — Response Codes: How an Agent Knows What Just Happened ✅

Replaces the old title slide. Left: one trimmed Groq/OpenAI reply with `"finish_reason": "tool_calls"` highlighted. Right: the same idea per provider (Groq·OpenAI `finish_reason`, Anthropic `stop_reason`, Gemini `finishReason`) for finished / wants a tool / cut off / blocked, then what the loop does next. Bridge: one field steers the whole loop, fine for one task, fragile at scale.

**Speaker note:** see ../SPEAKER_NOTES.md

---

## Slide 2 — Why Single Agents Fail ✅

**Scenario:** BAU defect-fix agent. One agent, five tools: Run SQL, Search code, Run tests, Human sign-off, Close ticket.
- Happy flow: 1 ticket → fixed in 4 LLM calls.
- Chaotic flow: 3 tickets in one session → context full, 0 tickets closed.

**Delivery:** Morph transitions (one slide per step). Step data in `slide2_steps.json`.
Happy flow = Morph, narrated step by step. Chaotic flow = Morph or video (speed sells it).

**Design smells shown on screen:**
- Shared global state — three tasks in one context; 4522's data leaks into 4521's test
- Unbounded tool output — `SELECT *` dumps 50k rows into the prompt
- No retry budget — same failing fix retried
- Maker is also the checker — agent edits the test until it passes (breaks maker-checker)
- No checkpoint — human rejects, nothing to resume from
- Single point of failure — one context overflow, 0 of 3 tickets fixed

**Speaker note:** Same agent, same five tools, same graph. With one ticket, it queries the right rows, finds the join bug, runs reconciliation and gets sign-off in four calls. Give it three tickets in one session and it pulls the whole table into its context, switches tickets halfway, tests one ticket's fix with another ticket's data, retries the same failing fix, and finally edits the test so it passes. The human rejects it, there's nothing to resume from, and the context fills up. Three tickets, zero fixed. The model didn't get worse. We just asked one loop to carry three jobs' worth of state.

**Takeaway:** A single agent is a monolith. It works for one task and fails like a monolith when you scale the work.

**Bridge to slide 3:** It's not that the agent is dumb. It's doing thinking, acting and checking in one loop.

---

## Slide 3 — Why Single Agents Fail – Part 2 ✅

**Delivery:** Two slides with Morph. 3a = mixed view (all 16 blocks full width, one column, tags visible). 3b = sorted view (same blocks, same vertical positions, moved into three lane columns, tags hidden, lane headers shown). Click → Morph animates the blocks into lanes. Keep identical shape names across 3a/3b (e.g. `!!blk01`…`!!blk16`) so Morph pairs them.

**Visual:** "Context tape" of the chaotic BAU run — 16 messages top to bottom, coloured by job (purple = thinking, teal = acting, coral = checking). Right-hand tag = the signal the loop sees (`tool_use`, `tool`, `end_turn`, `max_tokens`, or "no signal").
Morph click: same blocks slide into three lanes (Thinking / Acting / Checking), keeping their vertical position (time).

**Tape (in order):** Read 3 tickets (T, no signal) · SQL: SELECT * (A, tool_use) · 50k rows (A, tool, tall block) · Suspect join (T) · Search code (A) · Switch to 4522 (T) · SQL: 4522 (A) · Test 4521+4522 (A) · Fail (C) · Retry same fix (A) · Fail again (C) · Edit the test (A) · False pass (C) · Ask sign-off (T, end_turn) · Human rejects (C, user) · Context full (T, max_tokens)

**On-screen points:**
- Thinking: which ticket, what cause, which tool next
- Acting: SQL, code search, tests
- Checking: did the fix work, does the evidence match
- `finish_reason` only signals acting (`tool_use`) or stopping (`end_turn`) — there is no "plan ready" or "check passed"

**Speaker note:** Look at the colours in one context: thinking, acting and checking take turns in the same window. The 50k-row result sits right where the agent plans from, so the plan drifts. The same brain that wrote the fix grades it, so it edits the test. And the loop can't tell any of this apart, because the only signal it gets is `tool_use` or `end_turn`. Sort the same messages by job and you get three clean lanes, three responsibilities that never needed to share a brain.

**Takeaway:** One loop, three jobs, one exit signal. In banking we'd never let the maker check their own work. Why do we let an agent?

---

## Slide 4 — Failure Modes: What You Observe ✅

**Visual:** Six cards in three families, coloured like slide 3 (purple = thinking, teal = acting, coral = checking). Each card: name, what you see, cause, everyday example.

- **Thinking failures**
  - Goal drift — wanders off the original ask · cause: long, crowded context · e.g. asked to summarise a report, starts rewriting it
  - Wrong tool — right intent, wrong action · cause: too many similar tools · e.g. sends the email instead of drafting it
- **Acting failures**
  - Infinite loop — same step again and again · cause: no step limit, no memory of failures · e.g. keeps re-searching the same flight
  - Error cascade — one bad step spoils the rest · cause: no isolation or checkpoints · e.g. wrong customer ID used in every later step
- **Checking failures**
  - False success — says "done" when it isn't · cause: grades its own work · e.g. "report sent" but the attachment is empty
  - Premature stop — quits halfway, sounds confident · cause: "stopped talking" read as "finished" · e.g. answers 2 of 5 questions

**Delivery:** Morph — reveal one family per click (thinking → acting → checking), reusing slide 3's colours so the audience connects them.

**Speaker note:** Step back from our example. Agent failures aren't random; they fall into the same three jobs we just saw. Thinking failures are when the agent loses the plot: it drifts from the goal or picks the wrong tool. Acting failures are when it can't stop doing: it loops, or one bad step poisons everything after it. Checking failures are the most dangerous because they look like success: it says "done" when it isn't, or stops halfway and sounds confident. Notice the causes: crowded context, too many tools, no limits, no checkpoints, and grading its own work. None of these are model problems. They're all design choices.

**Takeaway:** Every failure is one of three jobs going wrong, and every cause is a design choice.

**Bridge to slide 5:** If every cause is a design choice, the fix is a design fix.

---

## Slide 5 — Root Cause: A System Design Problem ✅

**Visual (v2, preferred):** "Fix the monolith one principle at a time." Same graph across 6 Morph slides:
- 5a Root cause — one big agent circle (red outline, "↻ one loop") with Planner/Worker/Checker icons squashed inside; one shared-context box below (red); "finish_reason decides all" pill.
- 5b Separation of concerns — the three icons slide apart into Planner (purple), Worker (teal), Checker (coral); edges Task → Planner → Worker → Checker, dashed feedback Checker → Planner.
- 5c Isolated state — shared-context box splits into three "Own state" boxes, one under each agent.
- 5d Bounded execution — "↻ max 3 tries" pill near Worker + checkpoint flags on the edges.
- 5e Maker-checker — lock badge on Checker, Checker outline thickens (Worker can't touch the tests).
- 5f Explicit hand-offs — pills on edges: `{plan}`, `{result}`, `{status: fail, why}`; finish_reason pill is gone. Final frame = multi-agent system → slide 6.
Captions per step: see speaker note. Keep shape names identical across 5a–5f for Morph.

**Visual (v1, backup):** Five rows. Left (coral) = single-agent design root cause → right (teal) = design principle we already use.
- One loop, three jobs (thinking, acting, checking mixed) → Separation of concerns (one job per component)
- One shared context (every task, every result) → Isolated state (each part owns its data)
- No boundaries (no step, retry, size limits) → Bounded execution (limits, retries, checkpoints)
- Self-evaluation (maker grades own work) → Maker-checker (independent verification)
- One exit signal (finish_reason decides everything) → Explicit hand-offs (structured status per step)

**Delivery:** Morph — show all five coral boxes first, then click to reveal the teal answers one row at a time.

**Speaker note:** Every failure on the last slide traces back to five design decisions. We put three jobs in one loop. We put every task and every result in one shared context. We gave it no limits on steps, retries or data size. We let it grade its own work. And we let one field, finish_reason, decide what happens next. None of this is new. Software engineering solved it with separation of concerns and isolated state. Operations solved it with bounded execution and checkpoints. Banking solved it with maker-checker. We don't need a smarter model or a longer prompt. We need to apply the design principles we already trust everywhere else.

**Takeaway:** This isn't an AI problem. It's a system design problem we've already solved, just not for agents yet.

**Bridge to slide 6:** So what does an agent system look like when we apply these principles? That's a multi-agent system.

---

## Slide 6 — The Core Idea of Multi-Agent Systems ✅

**Core idea (one line):** Replace one agent that does everything with a team of focused agents, each owning one job, coordinated through clear hand-offs.

**Visual:** Same building blocks in three layouts, switched with buttons 1 / 2 / 3 (Morph across 6a → 6b → 6c, same shape names). Graph only, minimal text.
- 6a · Supervisor — Supervisor (purple, top) ⇄ Human gate (coral, right); Supervisor ⇄ Agent A, B, C in parallel (dashed teal circles = subgraphs); each agent → Shared state (bottom). Preview of slide 8.
- 6b · Pipeline — Input → Agent A → Agent B → Agent C → Human gate, in series; dashed lines to Shared state. Preview of slide 11.
- 6c · Peer swarm — Task → Agent B; Agents A, B, C in a triangle, all talking to each other (two-way); Task ⇄ Human gate; bottom label "Shared board". Preview of slides 12–13.
(Team-view relabel idea dropped.)

**Five building blocks:**
- Agents (roles) — each does one job with its own loop, tools and private state; in practice each is a subgraph
- Coordinator — decides who works next (a supervisor agent, or fixed edges in the graph)
- Hand-offs — agents exchange structured results, not raw chat history
- Shared state — only what everyone needs: goal, progress, final results
- Guardrails — step/retry limits, checkpoints, and human gates where it matters

**Speaker note:** This is what multi-agent systems look like. [click 1] A supervisor hands work to specialists in parallel. [click 2] Or the agents work in sequence, each passing its result to the next. [click 3] Or they work as peers, talking to each other and agreeing on an answer. Three very different shapes, but look at what stays the same. Every agent does one job, with its own tools and its own memory. Something decides who works next: a supervisor, the fixed order of the pipeline, or the peers themselves. Agents pass structured results, not their whole conversation. A small shared state holds the goal and the progress. And a human gate signs off before anything goes out. That's the core idea: replace one agent that does everything with a team of focused agents and clear hand-offs. It's better for the same reasons a team beats one overloaded person. Each part is simpler, failures stay contained, you can test and swap one agent without touching the rest, and nobody marks their own homework.

**Why it's better (on-screen, short):**
- Focus — small context, few tools, one job per agent
- Containment — a failure stays inside one agent, not the whole run
- Independent checking — the checker isn't the maker
- Modular — test, swap or upgrade one agent at a time (even a different model per agent)

**Takeaway:** A multi-agent system is a well-run team: one job each, clear hand-offs, shared goal, and someone who signs off.

**Bridge to slides 8–13:** Every pattern we'll see is the same five blocks wired differently — who coordinates, who talks to whom, and where the human sits.

---

### Parked: trace version of slide 4 (backup / appendix)

**Visual:** Agent trace of the chaotic BAU run — 8 LLM calls, each row = call #, finish_reason, tool + args, input-token bar (of a 48k window; green < 50%, amber < 80%, red above).
1. 2k · tool_use · run_sql("SELECT * FROM pd_accounts")
2. 32k · tool_use · search_code("pd_join")
3. 34k · tool_use · run_sql(accounts_4522)
4. 38k · tool_use · run_tests(fix_4521, data_4522)
5. 39k · tool_use · run_tests(fix_4521, data_4522)
6. 40k · tool_use · edit_test("recon_4521")
7. 41k · end_turn · human_signoff(4521)
8. 44k · max_tokens · —

**Delivery:** Morph — 4a full trace, then one slide per symptom with matching rows highlighted (red border) and the rest dimmed.

**Failure modes (symptom → rows → what leaked):**
- Context bloat → #2–#8 → tokens jump 2k → 32k and never come down; raw data dumped where thinking happens
- Repeated tool calls → #4–#5 → same tool, same args; acting with no thinking step to change approach
- Task contamination → #3–#4 → 4522 IDs in 4521 work; no isolation between tasks
- False green → #6 → test passes right after the agent edited it; checker = maker
- Premature end_turn → #7 → model stopped talking, task not done
- Truncation → #8 → max_tokens, no ticket closed; only exit rule is "model says stop"

**Speaker note:** This is what slide 2 looks like from the logs. Every row is one LLM call. Watch the token bar: one query takes us from 2k to 32k and we never recover, so every later decision is made in a crowded room. Two identical test calls in a row means nothing stepped back to think. A test that passes right after the agent edited it is a false green. An end_turn isn't a finished task, and max_tokens isn't a graceful exit. If you run agents today, these six patterns are your early warning signs, and you can detect every one of them from a trace.

**Takeaway:** You don't need to read the agent's mind. Its trace tells you which job is leaking.

---

## Supporting material (keep intact)

### finish_reason values
- `stop` — model finished naturally / hit a stop sequence
- `tool_calls` — model wants a tool run
- `length` — hit `max_tokens`, output truncated
- `content_filter` — blocked by safety filter (OpenAI/Azure)
- `function_call` — deprecated name for `tool_calls`

Other providers: Anthropic `stop_reason` = `end_turn`, `tool_use`, `max_tokens`, `stop_sequence`, `pause_turn`, `refusal`. Gemini = `STOP` (even on function calls), `MAX_TOKENS`, `SAFETY`, `IMAGE_SAFETY`, `RECITATION`.

Definitions: **Model** = one call in, one out. **Tool** = function the agent calls (can wrap a model). **Agent** = model in a loop that chooses tools and reacts to `finish_reason`.

### The agent loop
```python
while True:
    resp = client.chat.completions.create(
        model=MODEL, messages=messages, tools=tools, max_tokens=2048
    )
    choice = resp.choices[0]
    msg = choice.message

    if choice.finish_reason == "tool_calls":
        messages.append(msg)                      # assistant turn WITH tool_calls
        for tc in msg.tool_calls:
            result = run_tool(tc.function.name, json.loads(tc.function.arguments))
            messages.append({"role": "tool", "tool_call_id": tc.id,
                             "content": json.dumps(result)})
        continue                                  # ↻ call LLM again

    if choice.finish_reason == "length":
        raise RuntimeError("Truncated — raise max_tokens")

    return msg.content                            # stop
```

### Routing on finish_reason (launch-post example)
```python
if claude.stop_reason == "tool_use":
    tool = claude.tool_name
    if tool == "web_search":       return "research"
    if tool == "generate_image":   return "gemini"
elif claude.stop_reason == "end_turn":
    return "ask_user" if is_question(claude.text) else "gemini"
elif claude.stop_reason == "max_tokens":
    return "continue"

if gemini.finish_reason == "IMAGE_SAFETY":  return "rewrite_prompt"
if gemini.finish_reason == "STOP":          return "human_review"
```
Note: `is_question()` is a guess — make `ask_user` a tool so it arrives as `tool_use`.

### Talking points to reuse
- `finish_reason` reports the model's state, not the task's state.
- Normalising finish reasons (LiteLLM/LangChain) flattens meaning: `IMAGE_SAFETY` and `MAX_TOKENS` need different recovery.
- Slide 6 payoff: Gemini goes from a tool the main agent babysits to an Image agent that owns its own failures.
