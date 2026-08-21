# Scan mode — find the moats without asking

Answer all twelve questions from the repository and its live surfaces alone.
Ask the user nothing. Where the evidence does not exist, the rung is what the
evidence supports — usually 0 — and the question is marked **unevidenced** so
interview mode knows what to re-ask.

Work through the project, not through its README. A README is a pitch; it is
evidence of intent, never of a rung.

## Orientation pass

```bash
ls -la; cat README.md 2>/dev/null | head -60
cat package.json 2>/dev/null | head -40
git log --oneline | wc -l; git log -1 --date=short --format='%ad'; git log --reverse -1 --date=short --format='%ad'
find . -name '*.md' -maxdepth 3 -not -path './node_modules/*' | head -40
```

Establish: what the product does, who pays, whether it is live, how old it is,
whether it is one of several projects by the same operator (mechanic 27 lives
at portfolio level and a single repo will never show it).

## Per-question evidence map

### Q1 compounding use — mechanics 1, 11, 20

Look for cross-account value, not multi-user support.

```bash
grep -rniE 'tenant|workspace|organization_id|team_id|shared|public_by_default' --include='*.ts' --include='*.sql' --include='*.py' -l . | head
grep -rniE 'plugin|extension|addon|webhook.*register|mcp' -l . | head
```

- Schema rows scoped to one account only, nothing crossing accounts → **0**.
- Sharing that exists but nothing depends on it → **25**.
- Real team-scoped value (presence, co-edit, permissions), nothing across
  teams → **50**.
- Value crossing every account (a shared corpus, a public graph, a
  ranking that improves with volume) → **75**.
- That, plus evidence leaving gets harder as it grows → **100**.

### Q2 distribution — mechanics 2, 16, 27

```bash
ls -a | grep -iE 'vercel|netlify|wrangler|cname|robots|sitemap'
grep -rniE 'utm_|referrer|plausible|posthog|google-analytics|search-console' -l . | head
```

Also check: is it listed anywhere (npm, a store, a directory)? Is there a
domain that resolves? Does the operator run more than one product that could
carry it (mechanic 27)? No live surface at all → **0**. Paid-only → **25**.

### Q3 audience — mechanics 8, 21, 32, 34

A repo almost never evidences this. Look for a list, subscriber counts, a
community link, a changelog with an audience. **Mark unevidenced** and default
to what is visible; this is a first-class interview question.

### Q4 data — mechanics 3, 4

The decisive test is **accrual**, not storage.

```bash
ls -R | grep -iE '\.sql$|schema|migrations' | head -20
grep -rniE 'CREATE TABLE|createTable|@Entity|model [A-Z]' --include='*.sql' --include='*.ts' --include='*.prisma' . | head -30
```

- Nothing stored beyond a session → **0**.
- Stores only what the vendor API returns, re-fetchable → **25**.
- Real history accruing (observations with `first_seen`, time series,
  corrections) → **50–75** by age and irreproducibility.
- **100** only when usage produces data that measurably improves the product.
- Mechanic 4 counts only where the model is the project's own. Check:

```bash
grep -rniE 'anthropic|openai|@ai-sdk|bedrock|ollama|transformers|torch|onnx' -l . | head
```

An API client is a wrapper — score mechanic 4 at 0 and say so.

### Q5 heavy assets — mechanics 9, 10, 22, 31

```bash
ls -a | grep -iE 'docker|compose|terraform|k8s|systemd|ansible'
```

For nearly every solo repo the honest answer is rung 0, "a laptop and a
weekend," or 25 if it runs on paid managed infrastructure. Do not inflate a
docker-compose file into rung 50.

### Q6 exclusive rights — mechanics 12, 18, 26

Licences, content deals, datasets under contract, anything a rival cannot sign
tomorrow. Usually 0 in a repo. **Mark unevidenced** — an operator may hold a
right the code does not show.

### Q7 switching cost — mechanics 5, 6

What would a customer have to move?

```bash
grep -rniE 'export|backup|dump|migrate' --include='*.ts' --include='*.py' -l . | head
grep -rniE 'oauth|webhook|integration|connector|api_key' -l . | head
```

Stored config, history and connected integrations raise it; a working export
path lowers it — note both. A product whose whole state is re-derivable in one
run is rung 0 regardless of how much it stores.

### Q8 habit / breakage — mechanics 19, 25, 33

Cron/schedule config, daily-use surfaces, whether anything downstream consumes
its output. A tool run once a quarter is not a habit. **Partly unevidenced** —
the customer's day is not in the repo.

### Q9 craft — mechanics 13, 17, 23

```bash
git log --oneline | wc -l
find . -name '*test*' -o -name '*spec*' | grep -v node_modules | wc -l
cloc . 2>/dev/null || find . -name '*.ts' -not -path './node_modules/*' | xargs wc -l | tail -1
```

Age plus test depth plus the count of handled edge cases a clone would miss.
Be strict: this is mechanic 13, depth 1, `↓ under attack`. A year of polish is
rung 50, not 75. Rung 100 requires evidence that copying the surface produces
the wrong result.

### Q10 rules — mechanics 7, 14, 30

Certifications, audits, regulated data, licences held. Handling personal data
is not compliance. Almost always 0 or 25 for a solo product.

### Q11 standard — mechanics 24, 29

```bash
grep -rniE 'openapi|swagger|\.proto$|json-?schema|mcp|sdk' -l . | head
ls docs 2>/dev/null | head
```

A public API, format or MCP surface is rung 25 only if someone actually builds
against it. Publishing a schema nobody consumes is rung 0.

### Q12 cost curve — mechanics 15, 28, 35

Find the marginal cost per unit of use:

```bash
grep -rniE 'model:|max_tokens|gpt-|claude-|per_request|rate_limit|pricing' -l . | head
```

- Per-request LLM inference or per-seat vendor cost that does not fall with
  volume → **rung 0, "it rises."** Say it explicitly; an inverted cost curve is
  a finding, not a blank.
- Flat hosting, negligible marginal cost → **25**.
- Anything above 50 needs a cost that demonstrably falls with cumulative
  output. A solo software product almost never has one.

## Output of a scan

For each question: rung, the exact evidence (path, count, date, URL), and
`evidenced | unevidenced`. Then score per `calculator.md`, run the bypass pass,
and end with the list of unevidenced questions offered as an interview.
