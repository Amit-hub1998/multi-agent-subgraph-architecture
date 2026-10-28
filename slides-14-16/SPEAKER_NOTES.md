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
