# Speaker Notes — Slides 14, 15, 16, 16a

Draft notes. Animations and Morph come later; for now each slide is one static slide.

---

## Slide 14 — Common Mistakes in Multi-Agent Design
*~2 min*

We've seen the patterns. Now the traps. Almost every multi-agent system that fails in practice fails for a design reason, not because the model was weak.

The first three are about definition. No clear goal or "done": agents loop, or stop early, because nobody wrote down when the task is finished. Vague roles: two agents do the same work, or a step falls between them. No rules: no step limits, no retry budget, every agent can call every tool.

The next three are about wiring. Using multi-agent for a simple task adds cost, latency and failure points for no gain. Agents chatting instead of handing off pass whole histories around, and the context bloats exactly like our single agent on slide 2. And with no independent check or human gate, "done" gets reported when it isn't.

**Close:** Every mistake here is a missing decision: who does what, when is it done, and who checks.

---

## Slide 15 — How to Choose the Right Pattern
*~2.5 min*

Start from the need, not the pattern. Read the left column and find the one that sounds like your problem.

If you need to route each request to the right specialist, that's supervisor–worker. If you have a capability you'll reuse inside bigger flows, wrap it as a subgraph. Long task that needs a plan first: planner–executor. A known, fixed sequence: specialist pipeline. Judgement calls where quality matters more than speed: peer and debate. Many independent sub-tasks that end in a sign-off: parallel swarm with a human gate.

The right-hand column matters as much as the pattern: every pattern has a typical way to fail, and it's cheaper to design for it up front.

**Close:** Pick the simplest pattern that meets the need. Start with one agent; add structure only when it breaks.

---

## Slide 16 — Design Principles You Can Apply Tomorrow
*~2 min*

These are the eight habits that prevent the mistakes on slide 14. None of them need a framework; you can apply them to the agent you're building this week.

One job per agent. Define "done" as a structured status, not free text, so the next step doesn't have to guess from finish_reason. Give each agent a handful of tools, with least privilege. Pass state, not chat. Bound everything: steps, retries, timeouts, tokens. Keep the maker and the checker separate. Put a human gate in front of anything irreversible. And trace every hand-off so you can see where it went wrong.

The card on the right is the practical version: before you write any code, write one of these for every agent. If you can't fill it in, the agent's job isn't clear yet.

**Close:** Write the role card first; the code gets much simpler.

---

## Slide 16a — LangChain and LangGraph
*~2.5 min*

Two libraries, two jobs. LangChain gives you the building blocks: a common interface to models, prompts, tools, and structured output, plus create_agent for a ready-made agent loop. LangGraph is the orchestration layer: you describe your system as a graph of nodes sharing a state, and it runs it, with loops, branching, persistence and human-in-the-loop built in.

The two core ideas are node and graph. A node is one job: a Python function that reads the state and returns the keys it changed. Edges are the hand-offs. A conditional edge is a router: here the checker's status decides whether we finish or go back to the worker. That's exactly the explicit hand-off from slide 5, replacing the finish_reason if/else.

The code is the whole thing: a state, two nodes, three edges, compile, invoke. recursion_limit is our bounded execution. And a compiled graph can itself be used as a node, which is how subgraphs work.

**Close:** LangChain for the parts, LangGraph for the wiring. Every pattern in this deck is a LangGraph graph.

---

## Slide 16b-overview — Reading the Graph: What Each Part Does
*~1 min · click the buttons to move between parts*

This is the same graph as the last slide, but we'll read it one part at a time. Boxes are nodes: who does the work. Solid arrows are edges: who goes next. The dashed arrow is a decision. And the purple panel is the state that every node shares.

**Close:** Six words cover all of LangGraph. Let's take them one by one.

---

## Slide 16b-node — Node
A node is one step of work. In code it's just a function: it reads the state and returns the part it changed. Here the worker does the job and the checker verifies it. A node can be an LLM agent, a tool call, or plain Python.

**Close:** Think of a person at a desk with one job.

---

## Slide 16b-edge — Edge
An edge is a fixed hand-off. When the worker finishes, the checker always runs next. Nobody decides this at run time; it is wired in when you build the graph.

**Close:** Passing the file to the next desk, always the same desk.

---

## Slide 16b-cond — Conditional edge
A conditional edge is a decision point. A small rule looks at the state and picks where to go: if the status is pass we finish, if it's fail we go back to the worker. This is the explicit replacement for the finish_reason if/else we started with on slide 1.

**Close:** An approval rule: approved goes out, rejected goes back for rework.

---

## Slide 16b-state — State
The state is the shared data. Every node reads it and writes only its own keys: the ticket comes in, the worker writes the result, the checker writes the status. Nodes pass state, not long chat histories, which keeps context small.

**Close:** One shared case folder that travels with the work.

---

## Slide 16b-subgraph — Subgraph
A subgraph is a whole graph used as a single node. Compile this worker–checker loop and drop it into a bigger flow as fix_ticket: triage, then fix_ticket, then report. From outside it's one box; inside it has its own team and its own loop. This is the "subgraph architecture" in our title.

**Close:** A department: one box from outside, its own team inside.

---

## Slide 16b-checkpoint — Checkpointer
The checkpointer saves the state after every step. If something fails, the run resumes from the last save instead of starting over. It also lets the graph pause, for example before finishing, and wait for a human to approve.

**Close:** Save points in a game, plus a manager's sign-off.
