# Interview mode — twelve questions, asked properly

Walk the operator through the same twelve questions the source calculator asks,
one segment at a time. The exact question and rung text is in
`calculator.md` — quote it verbatim, do not paraphrase the ladders.

The website lets a founder click 100 on every rung. This does not. The value
added over the source is the **probe** and the **challenge**.

## Protocol

1. **Announce the shape once**: twelve questions, four segments of three, five
   rungs each, and that a rung of 0 is a legitimate answer that produces a
   better read than a flattering one.
2. **Ask one segment per message** — three questions, each with all five rungs
   printed and numbered `0–4`. Ask for three digits back (`0 2 4`), and accept
   prose just as readily.
3. **Probe every answer ≥ 3 (75 or 100).** One question: *what is the evidence?*
   Accept a number, a date, a customer, a file. Accept "no evidence, it is
   designed that way" — and then write down rung 1 or 2, not 3, saying why.
   Designed ≠ earned.
4. **Challenge a contradiction.** If a scan ran first and the repo says
   otherwise, quote the scan finding and ask which is right. The operator wins
   ties they can evidence; the repo wins ties they cannot.
5. **Never suggest a rung before they answer.** Reading back the scan's rung as
   a proposal makes the interview worthless.
6. **Let them skip.** An unanswered question is excluded from the mean, not
   scored 0. Say which ones were skipped in the report.

## Segment order and framing

| Segment | Ask it as | Questions |
| --- | --- | --- |
| **Pull** | does demand compound without you | Q1 compounding use · Q2 distribution · Q3 audience |
| **Ground** | what you own that cannot be bought | Q4 data · Q5 heavy assets · Q6 exclusive rights |
| **Grip** | how badly their day breaks without you | Q7 switching cost · Q8 habit · Q9 craft |
| **Leverage** | what works for you without you | Q10 rules · Q11 standard · Q12 cost curve |

## The four questions a repo cannot answer

Always interview these, even in a mostly automatic run. They are the ones where
the operator holds evidence the code does not:

- **Q3 audience** — a list, subscribers, a community that would follow them.
- **Q6 exclusive rights** — licences, deals, data under contract.
- **Q8 breakage** — what actually happens to a customer's day.
- **Q10 rules** — certifications and audits held.

## Known traps to name while asking

- **Q4 data**: "we store a lot" is not the question. The question is whether a
  rival could regenerate it. Ask how old the oldest row is.
- **Q9 craft**: the most over-answered question on the sheet. Mechanic 13 is
  depth 1 and `↓ under attack` — rungs 3 and 4 need evidence that a copy of the
  surface produces the wrong result.
- **Q12 cost curve**: for anything LLM-backed, rung 0 ("it rises") is the
  common correct answer. Ask for the per-request cost before accepting 25.
- **Q1 compounding use**: multi-user is not a network effect. Ask what a second
  customer gives the first.
- **Q2 distribution**: "we get organic traffic" → ask for the number and the
  share against paid.

## Closing the interview

Score per `calculator.md`, then:

1. Verdict line, section table, segment scores.
2. **Holding** and **dig next**, from the exact sort rules.
3. Bypass pass on everything held — from `atlas.md`, and this is the half the
   source calls load-bearing.
4. The `#s=` link so the section is reproducible on the source calculator.
5. If a scan also ran: a short **reconciliation** — which rungs the interview
   moved, in which direction, and on what evidence. Two numbers that disagree
   are more useful than one that was never challenged.
