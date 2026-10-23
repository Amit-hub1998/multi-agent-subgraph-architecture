# Speaker Notes — Slides 1–6

Final notes for presenting. `[click]` = advance one PowerPoint slide (each click is a Morph step).
PPT slide numbers are shown for each section so you can find them in Presenter View.

---

## Slide 1 — Multi-Agent Systems & Subgraph Architecture
*PPT slide 1 · ~1 min*

A multi-agent system is a parent graph that coordinates smaller graphs. Each agent is a subgraph: its own LLM, its own few tools, its own loop and state. The supervisor decides who works, the subgraphs do the work in isolation, and the checker verifies before anything leaves.

Every single-agent loop is steered by one field, `finish_reason`, and that's where the problems start. The rest of this section explains why we need this architecture, then the later slides walk through six ways to wire it.

---

## Slide 2 — Why Single Agents Fail
*PPT slides 2–28 · ~3 min*

**Opening (slide 2):** Here's a BAU defect-fix agent. One agent, five tools: run SQL, search code, run tests, human sign-off, close ticket. First, one ticket.

**Happy flow (slides 3–11, click through at a steady pace):** It queries the right rows, finds the nulls come from one feed, spots the join on the wrong key, applies the fix, runs reconciliation and sends it for sign-off. Approved and closed in four LLM calls. Every step is driven by `finish_reason`: `tool_use` means "run a tool", `end_turn` means "I'm done talking".

**Chaotic flow (slide 12):** Now give the same agent three tickets in one session.

**Slides 13–28 (click fast — the speed sells it):** It pulls the whole table into its context. It switches tickets halfway. It tests one ticket's fix with another ticket's data. The test fails, so it retries the same fix. It fails again, so it edits the test until it passes. The human rejects it, there's nothing to resume from, and the context fills up.

**Close:** Three tickets, zero fixed. The model didn't get worse. We just asked one loop to carry three jobs' worth of state. A single agent is a monolith: it works for one task and fails like a monolith when you scale the work.

**Bridge:** It's not that the agent is dumb. It's doing thinking, acting and checking in one loop.

---

## Slide 3 — Thinking + Acting + Checking Are Mixed Together
*PPT slides 29–30 · ~2 min*

**Slide 29 (mixed):** This is every message from the chaotic run, top to bottom, coloured by job. Purple is thinking, teal is acting, coral is checking. Look how they take turns in the same window. The 50k-row result sits right where the agent plans from, so the plan drifts. And look at the right-hand tags: every thinking block says "no signal". The loop only ever sees `tool_use` or `end_turn`. There's no signal for "plan ready" or "check passed".

**[click] Slide 30 (sorted):** Same messages, sorted by job. Three clean lanes. The checking lane is all fails, a false pass and a rejection — the same brain that wrote the fix graded it. These are three responsibilities that never needed to share a brain.

**Close:** One loop, three jobs, one exit signal. In banking we'd never let the maker check their own work. Why do we let an agent?

---

## Slide 4 — Failure Modes: What You Observe
*PPT slides 31–33 · ~2 min*

**Slide 31:** Step back from our example. Agent failures aren't random; they fall into the same three jobs. Thinking failures are when the agent loses the plot: it drifts from the goal, or picks the wrong tool.

**[click] Slide 32:** Acting failures are when it can't stop doing: it loops on the same step, or one bad step poisons everything after it.

**[click] Slide 33:** Checking failures are the most dangerous, because they look like success: it says "done" when it isn't, or stops halfway and sounds confident.

**Close:** Notice the causes: crowded context, too many tools, no limits, no checkpoints, and grading its own work. None of these are model problems. Every failure is one of three jobs going wrong, and every cause is a design choice.

**Bridge:** If every cause is a design choice, the fix is a design fix.

---

## Slide 5 — Root Cause: A System Design Problem
*PPT slides 34–39 · ~2.5 min*

**Slide 34 (root cause):** Here's the single agent again: three jobs squashed into one loop, one shared context, and `finish_reason` deciding everything. Let's fix it, one principle at a time.

**[click] Slide 35 — Separation of concerns:** Split the three jobs. A Planner thinks, a Worker acts, a Checker checks.

**[click] Slide 36 — Isolated state:** Each part keeps only its own data. The big query result never reaches the Planner.

**[click] Slide 37 — Bounded execution:** Retry limits and checkpoints. A failure stops or resumes from a checkpoint; it doesn't loop forever.

**[click] Slide 38 — Maker-checker:** The Checker verifies independently. The Worker can't touch the tests.

**[click] Slide 39 — Explicit hand-offs:** Each step returns a structured status — `{plan}`, `{result}`, `{status: fail, why}` — instead of relying on `finish_reason`. And look what we've built: a multi-agent system.

**Close:** None of this is new. Software engineering solved it with separation of concerns and isolated state. Operations solved it with bounded execution and checkpoints. Banking solved it with maker-checker. We don't need a smarter model or a longer prompt. This isn't an AI problem; it's a system design problem we've already solved, just not for agents yet.

**Bridge:** So what does an agent system look like when we apply these principles everywhere? That's a multi-agent system.

---

## Slide 6 — The Core Idea of Multi-Agent Systems
*PPT slides 40–43 · ~2.5 min*

**Slide 40 — Supervisor:** This is what multi-agent systems look like. A supervisor hands work to specialist agents in parallel.

**[click] Slide 41 — Pipeline:** Or the agents work in sequence, each passing its result to the next.

**[click] Slide 42 — Peer swarm:** Or they work as peers, talking to each other and agreeing on an answer.

Three very different shapes, but look at what stays the same. Every agent does one job, with its own tools and its own memory. Something decides who works next: a supervisor, the fixed order of a pipeline, or the peers themselves. Agents pass structured results, not their whole conversation. A small shared state holds the goal and the progress. And a human gate signs off before anything goes out.

**[click] Slide 43 — Why it's better:** That's the core idea: replace one agent that does everything with a team of focused agents and clear hand-offs. It's better for the same reasons a team beats one overloaded person:
- **Focus** — small context, few tools, one job per agent
- **Containment** — a failure stays inside one agent, not the whole run
- **Independent checking** — the checker isn't the maker
- **Modular** — test, swap or upgrade one agent at a time, even with a different model per agent

**Close:** A multi-agent system is a well-run team: one job each, clear hand-offs, a shared goal, and someone who signs off.

**Hand-over to the next presenter:** Every pattern you'll see next is these same building blocks wired differently — who coordinates, who talks to whom, and where the human sits.

---

## If someone asks…

- **"Why not just normalise finish reasons with LiteLLM or LangChain?"** That fixes the labels, not the meaning. `IMAGE_SAFETY` (rewrite the prompt) and `MAX_TOKENS` (raise the limit) need completely different recovery. Each agent should own its model's quirks and report a clean status.
- **"Is Gemini an agent in the launch-post example?"** No — called once, it's a model wrapped as a tool. It becomes an agent only when it gets its own loop and owns its own failures.
- **"How would I spot these failures in production?"** Show the appendix trace (`widgets/extra_slide4_trace_backup.html`): context bloat, repeated tool calls, task contamination, false green, premature `end_turn`, truncation.
