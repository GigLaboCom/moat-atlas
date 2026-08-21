# Sheet II — the twelve-question section

Source: [Moat Atlas calculator](https://moa.giglabo.com/calculator/), MIT.
Twelve questions in four segments. Five rungs each, weighted **0 / 25 / 50 / 75
/ 100**. Between them the twelve cover all 35 mechanics exactly once — no
mechanic is asked about twice, none is missed.

## Scoring

Transcribed from `src/data/survey.ts` in
[GigLaboCom/moat-atlas](https://github.com/GigLaboCom/moat-atlas) (MIT). Use
these exact rules — do not approximate.

- **Rung → weight**: option index `0 1 2 3 4` → `0 25 50 75 100`.
- **Segment score** = `round(mean(answered questions in that segment))`.
- **Index** = `round(mean(every answered question))`. Unanswered questions are
  excluded from the mean, not counted as 0.
- **Depth** = `index < 25 → 1` · `< 50 → 2` · `< 75 → 3` · `≥ 75 → 4`.
- **Holding** = mechanics behind any answer **≥ 75**, deduped, sorted
  `depth desc → capital desc → number asc`, first **6**.
- **Dig next** = mechanics behind any answer **≤ 25**, deduped, sorted
  `capital asc → depth asc → number asc`, first **6**. Cheapest and shallowest
  first — the atlas's own ordering, and the right one for a solo operator.
- **Strongest / weakest segment** by score; ties resolve to the declared order
  `pull → ground → grip → leverage`, so the verdict is stable.

## The shareable section

Answers encode as a **12-character string of option indices** (`0`–`4`, `-` for
unanswered), one per question in the order below. The live calculator reads it
from the URL hash under the prefix `#s=`:

```
https://moa.giglabo.com/calculator/#s=041302143210
```

Emit that link with every completed section — it reproduces the same result on
the source site, stores nothing, and is the artifact worth keeping. Nothing is
persisted server-side there; keep the same posture here.

## Verdict bands

| Depth | Verdict |
| --- | --- |
| 1 · shovel · weeks–months | **A ditch.** Everything here can be reproduced in weeks — what you have is a head start, not a moat. |
| 2 · excavator · 1–3 years | **A trench.** Copying you costs a rival about a year of work, but nothing in the section deepens on its own yet. |
| 3 · drill rig · 3–10 years | **A moat.** Three to ten years of digging stand between you and a copy; the work now is keeping the water in it. |
| 4 · mine · 10+ years | **A canyon.** What you hold takes a decade to reproduce — the risk is no longer imitation, it is erosion. |

---

## Segment 1 — Pull

*Whether demand compounds on its own — users, liquidity, audience.*

### Q1. Does each new user make the product better for everyone else? — *Compounding use*

0 Not at all — every user is alone in the product · 25 Barely — a little shared content · 50 Inside a team, yes; across teams, no · 75 Yes, across the whole base · 100 Yes, and it accelerates — the more users, the harder it is to leave

Mechanics: **1** network effects, **11** collaboration, **20** developer ecosystem

### Q2. Where does the next customer come from? — *Distribution*

0 I chase every one of them by hand · 25 Ads — the flow stops when I stop paying · 50 A mix of paid and word of mouth · 75 Mostly referrals, search and partners · 100 They arrive by default — I sit where the demand already forms

Mechanics: **2** marketplace liquidity, **16** distribution and defaults, **27** bundling and reach

### Q3. If you launched something new tomorrow, who would hear about it? — *Audience*

0 Nobody I have a channel to · 25 A handful of personal contacts · 50 A mailing list of strangers · 75 An audience that answers back · 100 A community that would follow me to a new product

Mechanics: **8** brand and trust, **21** community, **32** owned audience, **34** locked-in reputation

## Segment 2 — Ground

*What you own that a rival cannot buy — data, capital, exclusive rights.*

### Q4. What data do you hold that a rival cannot buy, scrape or regenerate? — *Data*

0 None · 25 The same data everyone in the category has · 50 Some proprietary history, nothing decisive · 75 Years of data a newcomer cannot reconstruct · 100 A closed loop — usage produces data that makes the product better

Mechanics: **3** proprietary data, **4** proprietary models

### Q5. What would a rival have to spend on physical or infrastructure assets to match you? — *Heavy assets*

0 Nothing — a laptop and a weekend · 25 Off-the-shelf cloud, paid monthly · 50 Serious infrastructure, but purchasable · 75 Capital that has to be raised first · 100 Capital and years — plants, fleets, locations, silicon

Mechanics: **9** infrastructure scale, **10** hardware, **22** capital as a moat, **31** physical presence

### Q6. What do you have exclusive access to? — *Exclusive rights*

0 Nothing exclusive · 25 Partnerships anyone else can also sign · 50 A licence others could obtain with effort · 75 Rights or supply a rival cannot get today · 100 A cornered resource — catalogue, contract or installed base that is not for sale

Mechanics: **12** content and rights, **18** cornered resource, **26** installed base

## Segment 3 — Grip

*How badly the customer's day breaks without you.*

### Q7. How long would it take a customer to replace you? — *Switching cost*

0 An afternoon · 25 A few days · 50 Weeks, with a migration · 75 A quarter and a project team · 100 A rewrite nobody would approve

Mechanics: **5** switching costs, **6** integrations

### Q8. How broken is the customer's day without you? — *Habit*

0 They would not notice · 25 A minor annoyance · 50 There is a workaround · 75 Real, visible pain · 100 The business stops

Mechanics: **19** process power, **25** habit, **33** category leadership

### Q9. How far ahead is your execution? — *Craft*

0 Copyable over a weekend · 25 A few months of catching up · 50 About a year of tuning · 75 Years of accumulated detail · 100 Rivals copy the surface and get the result wrong

Mechanics: **13** execution polish, **17** counter-positioning, **23** speed

## Segment 4 — Leverage

*What works for you without you — rules, standards, cost curves.*

### Q10. What must a rival obtain before they can even sell against you? — *Rules*

0 Nothing at all · 25 Standard paperwork · 50 A certification that takes months · 75 Licences, audits and approvals · 100 A regulatory position that takes years and is rarely granted

Mechanics: **7** compliance, **14** patents and IP, **30** regulatory capture

### Q11. Does anyone build against your format, API or process? — *Standard*

0 No one · 25 A couple of one-off integrations · 50 A small ecosystem of partners · 75 Partners depend on my interfaces · 100 My format is the standard the category has to follow

Mechanics: **24** efficient scale, **29** standard and format

### Q12. What happens to your unit cost as you grow? — *Cost curve*

0 It rises — growth costs me money · 25 It stays flat · 50 It falls slowly · 75 It falls fast enough to set a price they struggle to meet · 100 It falls so far a newcomer cannot serve the same customer profitably

Mechanics: **15** economies of scale, **28** vertical integration, **35** experience curve

> Rung 0 is the live answer for most AI products: per-request inference is a
> variable cost that does not fall with volume. Score it 0 and say so — an
> inverted cost curve is a finding, not a blank.
