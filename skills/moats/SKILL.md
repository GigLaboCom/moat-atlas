---
name: moats
description: Check defensibility against the Moat Atlas — 35 mechanics on one depth ruler, scored through twelve questions. Two modes - scan finds the moats in a project automatically from its code and live surfaces, interview walks the operator through the twelve questions like the atlas calculator, probing every high answer for evidence. Produces an index, a depth verdict (ditch/trench/moat/canyon), the mechanics held, the cheapest ones worth digging, and how each held moat gets bypassed. Use when the user says "/moats", "check the moat", "how defensible is this", "what's our moat", "can this be copied", "score my moat", or asks what to build next for defensibility.
user-invocable: true
argument-hint: "[scan|interview|both|compare] [project]"
---

# Moat check

Score a project on the [Moat Atlas](https://moa.giglabo.com/) ruler: 35
defensibility mechanics, twelve questions, one index, one depth. The
classification is **editorial judgement, not measurement** — attribute it,
never present a depth or rock as an empirical finding. Content and the data
files behind it are MIT-licensed
([GigLaboCom/moat-atlas](https://github.com/GigLaboCom/moat-atlas)); the
scoring rules here are transcribed from `src/data/survey.ts`.

## References — read before scoring, never from memory

| File | Holds |
| --- | --- |
| `references/calculator.md` | the twelve questions, exact rung text, weights, sort rules, depth bands, hash encoding |
| `references/atlas.md` | all 35 mechanics: rock, depth, capital, solo, AI, rent, how built, **how bypassed** |
| `references/scan.md` | mode 1 — where in a repo each of the twelve answers lives, with commands |
| `references/interview.md` | mode 2 — the interview protocol, probes, and traps |

`atlas.md` and `calculator.md` are transcriptions; `scripts/check.mjs
<path-to-moat-atlas-repo>` diffs every checkable claim in them (and in this
file) against the source and must exit 0 after any edit here or in the atlas.

## The rule that makes this worth running

**Moats are almost never stormed, they are devalued.** A read that reports only
what a project built is flattery. Every mechanic reported as held gets its named
bypass path, or the read is not finished.

## Modes

**Resolve the target first**: current directory by default, otherwise
`~/projects/<name>` or the path given.

### scan — find the moats automatically

Follow `references/scan.md`. Answer all twelve from the repo, its schema, its
git history and its live surfaces. Ask the user nothing. Record for each: rung,
exact evidence (path, count, date, URL), and `evidenced | unevidenced`. Four
questions a repo structurally cannot answer — Q3 audience, Q6 exclusive rights,
Q8 breakage, Q10 rules — are scored on what is visible and flagged.

### interview — score it with the operator

Follow `references/interview.md`. One segment of three questions per message,
all five rungs quoted verbatim from `calculator.md`, digits back. Probe every
answer of 75 or 100 for evidence; downgrade a designed-but-unearned claim and
say why.

### both (default)

Scan first, present the section, then interview **only** the unevidenced
questions and anything the operator disputes. Close with a reconciliation: which
rungs moved, which direction, on what evidence.

### compare

Scan each project, then one table — project, index, depth, strongest segment,
weakest segment, held mechanics — followed by the portfolio read: which
mechanics repeat, and specifically whether mechanic **27 bundling and reach** is
live, since it is the one mechanic a multi-product solo operator gets nearly
free and no single-repo scan can see.

## Scoring

Exactly as `references/calculator.md` specifies: weights 0/25/50/75/100, segment
means, index = mean of answered questions, depth bands at 25/50/75, holding
(≥75) sorted deepest-first, dig-next (≤25) sorted cheapest-first, six each.
Unanswered questions are excluded from the mean, never counted as 0.

Evidence discipline, non-negotiable:

- **Designed ≠ earned.** Architecture aimed at a network effect with no users
  scores the rung its usage supports.
- **No customer claims that cannot be evidenced.**
- **Rung 0 is a finding, not a blank.** Say what it means for this project.
- Do not average away a zero to be encouraging.

## The bypass pass

For every mechanic in the holding set, take its three bypasses from
`atlas.md` and say in one line each whether that path is open against this
project. Rank the open ones by how cheap they are for an attacker.

Then flag the structural traps by name where they fire:

- **Shovel-only** — every strength sits on mechanic 13, 23 or 33 (depth 1). A
  lead, not a moat. Name the structural mechanic to convert it into.
- **AI-under-attack core** — a held mechanic marked `↓` (5, 6, 11, 13, 23, 33).
  All six are solo-reachable: what one person reaches fastest is what AI
  devalues fastest.
- **Wrapper, not model** — mechanic 4 counts only where the model is the
  project's own. An API client scores 0.
- **Rentable** — mechanics 4, 7, 9 can be rented instead of dug; say so rather
  than proposing a dig, and note that renting a licence rents someone else's
  risk (Synapse, 2024).

## Dig next

Filter the dig-next set to **solo-reachable** mechanics (3, 5, 6, 11, 13, 17,
21, 23, 25, 32, 33) unless the project has an org or capital behind it. For the
top three give: the mechanic, why this project can reach it, the first concrete
move, and the bypass it will still be exposed to. Never propose marketplace
liquidity, infrastructure scale or regulatory capture to a one-person product.

## Report

1. **Verdict** — `Index NN · depth N · <ditch|trench|moat|canyon>` plus the
   band's sentence from `calculator.md`.
2. **Section table** — twelve rows: question, rung, evidence, source
   (`scan` / `operator`), mechanics probed.
3. **Segments** — Pull / Ground / Grip / Leverage, strongest and weakest named.
4. **Holding** — up to six, deepest first, each with its evidence.
5. **How it gets bypassed** — per held mechanic, open paths, cheapest first.
6. **Traps** — any of the four that fired.
7. **Dig next** — three solo-reachable moves with first steps.
8. **Reproduce it** — the `#s=` link, e.g.
   `https://moa.giglabo.com/calculator/#s=041302143210`.
9. **Attribution** — link the atlas and the sheets cited.

Offer to write it to `MOATS.md` in the project root; write only on a yes. On
re-runs, diff against the existing `MOATS.md` and lead with what moved.

## Do not

- Do not cite the atlas's depth, rock or capital placements as measured facts.
- Do not inflate a rung because the project is the user's own work.
- Do not report a moat without its bypass.
- Do not recommend digging what can be rented, or what a solo operator cannot
  reach.
- Do not propose a rung to the operator before they answer in interview mode.
