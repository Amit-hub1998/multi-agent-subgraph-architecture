# Speaker Notes — Multi-Agent Systems, simple version

A shorter, static version of slides 2–6 and 14–16 for a wider audience: no response codes, no animation, one slide per chapter. Titles follow the team's slide sheet.

---

## Slide 2 — Why Single Agents Fail
*~2.5 min*

A single agent is one AI model doing every job on its own: it plans, it uses the tools, and it checks its own work. For a small task that's fine. As the task grows, six things go wrong.

Ego blindness: the agent reviews its own work with the same logic that made the mistake, so it looks at its own error and calls it correct. It's like proofreading your own essay: you read what you meant, not what you wrote, so you miss your own mistakes.

No limits: nothing tells the agent when to stop. There's no step limit, no budget and no time-out, so a five-minute task can still be running an hour later.

Context overcrowding: documents, data, logs and API responses all pile into the same memory, and the original instructions get buried; this is often called "lost in the middle". You said "keep it under one page" at the start, and you get five pages back.

Prompt dilution: you can't write one prompt that makes a model a creative writer and a strict compliance officer at the same time; the instructions pull against each other, and the result is bland.

Too many tools: the agent has to choose from dozens of tools at every step, and every extra tool is another way to choose wrong: it emails the customer when it meant to search the database.

One step at a time: a single agent thinks, acts and checks in sequence, so gathering data from five sources happens one by one, and one slow website holds up the whole report.

**Close:** None of these is fixed by a bigger model. So what does fix them? That's where we go next.

---

## Slide 3 — Why Single Agents Fail – Part 2
*~2 min*

Every agent has three jobs: thinking (working out the plan), acting (using the tools) and checking (verifying the result). Let's follow one everyday task where a single agent does all three in the same loop, with the same memory.

The task: send the October sales report to the finance team.

Step 1, thinking: sensible. It decides to query the sales database.

Step 2, acting: the query returns 48,000 rows, and somewhere inside is a warning that three regions are missing. That warning is now buried in the same memory as the plan, and the agent never sees it.

Step 3, thinking: the totals look low, but instead of asking why, it decides the date format must be the problem. It has drifted away from the actual goal.

Step 4, acting: it rewrites the query and gets an error, then retries the same query and gets the same error. Nobody outside the loop is there to stop it.

Step 5 is the key moment, a wrong decision: to get the report out, it quietly uses September's data instead.

Step 6, checking: it asks itself "does the report match my plan?", and of course it does, because it's checking against its own plan. It passes.

Step 7: the email goes out. Finance receives September's numbers labelled as October's, and the agent marks the task done.

Notice that every single step looked reasonable from inside the loop. The problem is that the same "head" planned, acted and judged, so nothing ever challenged it.

**Close:** The problem isn't any single job. It's doing all three in the same head.

---

## Slide 4 — Failure Modes: What You Observe
*~2 min*

Step back from the example. The first slide was about why agents fail; this one is about what you actually see when they do. These symptoms aren't random: they fall into the same three jobs we just saw.

Thinking failures are when the agent loses the plot: it drifts from the goal, or picks the wrong tool.

Acting failures are when it can't stop doing: it loops on the same step, or one bad step poisons everything after it.

Checking failures are the most dangerous, because they look like success: it says "done" when it isn't, or stops halfway and sounds confident.

Each of these symptoms traces back to the reasons on the first slide: a crowded memory, too many tools, no limits, and an agent grading its own work.

**Close:** Every failure is one of three jobs going wrong: thinking, acting or checking. And because the reasons are design choices, the fix is a design fix.

---

## Slide 5 — Root Cause: A System Design Problem
*~2 min*

By now the obvious question is: can't we just use a better model? The research says no. Without structure, quality degrades, and a smarter model doesn't fix it.

More memory, worse thinking. Researchers tested 18 leading AI models and found that performance gets less reliable as the input grows, even on simple tasks. Asked the same question, models did far better with a focused prompt of about a page than with the full history of around a hundred thousand words. An agent that carries everything forgets what matters.

Structure beats size. In one published comparison, the same top model did about 90% better on research tasks when a lead agent split the work between specialist sub-agents, instead of doing it all alone. It costs more to run, so it's worth it for valuable tasks, but the point stands: how the work is organised matters more than how clever the model is.

Better models won't fix bad design. A study of seven popular agent frameworks found that roughly four in five failures came from design problems: unclear roles and specifications, and agents not lining up with each other. The authors concluded that better base models alone won't be enough.

**Close:** It's not the brain, it's the org chart. Next, what good structure looks like.

*Sources for questions: Chroma, "Context Rot" (July 2025, 18 models; ~300 vs ~113k tokens). Anthropic, multi-agent research system (June 2025; +90.2% vs single agent, ~15× tokens). UC Berkeley, "Why Do Multi-Agent LLM Systems Fail?" (MAST, 2025; 41.8% specification + 36.9% inter-agent misalignment).*

---

## Slide 6 — The Core Idea of Multi-Agent Systems
*~2 min*

So what does good structure look like? Instead of one agent doing everything, we split the work between small agents, each with one job, its own clean memory and only the tools it needs. And simple, ordinary code decides who goes next, so the route is predictable.

Let's replay the October sales report. A manager holds the goal. It hands the first job to a data agent, which only has access to the sales database. The data agent does the messy work, all 48,000 rows, but it passes on only a short summary: the totals, and the warning that three regions are missing.

A writer agent turns that summary into a report. Its memory is clean, because it never saw the raw data.

Then a separate reviewer agent, with no tools at all, compares the report with the original request. It spots the missing regions and sends the job back to the data agent. Only when everything is in does the report go to finance.

The same mistake from our example is caught before it leaves the team.

Three things change. Clean memory: agents pass summaries, not raw data. Fewer tools: each agent only sees what its job needs. And right-sized models: you can use a strong model where planning is hard and a small, fast, cheap one for simple steps, which also helps with cost.

**Close:** Same task, same kind of model. The difference is the structure.

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

## Slide 16a-1 — LangChain and LangGraph
*~2 min*

Two names you'll hear a lot. They come from the same team, and both do the same basic thing: they connect AI steps into a workflow, using models, prompts, your data and tools. The difference is the shape of that workflow.

LangChain is sequential. Steps run in a fixed order, one after another: the question goes to the model, the model uses a tool, out comes the answer. Each step runs once. That's ideal when you know the steps up front and they never change order, like finding the right document and answering a question.

LangGraph is non-sequential: it connects the steps as a graph. The next step can depend on the result. Work can loop back and try again, branch to a different path, run steps in parallel, or stop and wait for a person to approve. Every step shares one memory, and progress is saved as it goes. That's what a multi-agent team needs.

They also work together: LangChain's own agents now run on LangGraph underneath.

**Close:** Both connect the steps: LangChain in a straight line, LangGraph in any shape.

---

## Slide 16a-2 — LangChain and LangGraph – Reading the Graph
*~2 min*

When you build with LangGraph, you draw the flow as a graph. Here's how to read one. This is the same worker-and-checker loop we've seen: the worker does the job and the checker verifies it.

One, the boxes are nodes. A node is one step of work: it can be an AI agent, a tool, or plain code. It reads the state, does its job, and writes its result.

Two, the solid arrows are edges: fixed hand-offs. When the worker finishes, the checker always runs next.

Three, the dashed arrow is a conditional edge: a decision. The checker's result decides where to go: pass, and we finish; fail, and it goes back to the worker to try again. This is the explicit, predictable version of the decision a single agent used to make on its own.

Four, the purple panel is the state: the shared memory. The request comes in, the worker writes its result, the checker writes its status. Nodes pass state, not long chat histories, so each step's memory stays clean.

Five, START and END: where the work comes in and where the result goes out.

And built in underneath, LangGraph saves progress after every step, so a run can resume after a failure, or pause for a person to approve before it continues.

**Close:** Every pattern in this deck can be drawn with these five parts.
