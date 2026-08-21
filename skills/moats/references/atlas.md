# Moat Atlas — 35 defensibility mechanics

Source: [Moat Atlas](https://moa.giglabo.com/) (GigLabo, Denis Esakov), MIT.
Sheet N lives at `https://moa.giglabo.com/moats/N/`; append `.md` for the
plain-Markdown twin. The matrix is **editorial judgement, not measurement** —
cite it as the atlas's classification, never as an empirical finding.

## Legend

| Axis        | Values                                                                         |
| ----------- | ------------------------------------------------------------------------------ |
| **Rock**    | Human networks · Minds · Assets · Mathematics · Rules · Locks · Position        |
| **Depth**   | 1 shovel (weeks–months) · 2 excavator (1–3y) · 3 drill rig (3–10y) · 4 mine (10y+) |
| **Capital** | ○ low · ◐ medium · ● high · ◉ extreme                                          |
| **Solo**    | ✓ solo-reachable · ~ partly · ✗ no                                             |
| **AI**      | ↑ AI-resistant · → eroding · ↓ under attack                                    |
| **Rent**    | ✓ rentable · ~ partly · ✗ not for sale                                         |

**The load-bearing half of every sheet is "bypassed."** Moats are almost never
stormed, they are devalued. A read that reports only how a moat is built
misrepresents the source and flatters the project.

---

### 1 · Network effects

`Human networks` · depth **4** mine (10y+) · capital ◐–● · solo ~ · AI ↑ · rent ✗

Value grows non-linearly with participants; an empty product is worthless — the cold start is the hardest problem for builder and attacker alike.
**Built:** Facebook, density beats size · Slack, a network the size of one org · Discord, a federation of small networks
**Bypassed:** change the kind of graph (TikTok vs Instagram) · remove the requirement to be on the network (Zoom vs Skype) · multi-tenanting — win the use case, not the user

### 2 · Marketplace liquidity

`Human networks` · depth **3** drill rig (3–10y) · capital ● · solo ✗ · AI ↑ · rent ~

Two sides need each other; a two-sided network effect with an aggravated cold start, and one of the most durable moats once liquidity exists.
**Built:** Airbnb, seed supply parasitically · Amazon, first-party stock as starting liquidity · Uber, hyperlocal density
**Bypassed:** verticalise and add what the generalist cannot (StockX) · a tool instead of a venue (Shopify) · attack the take rate, disintermediate

### 3 · Proprietary data

`Assets` · depth **2.5** drill rig (3–10y) · capital ◐ · solo ✓ · AI → · rent ~

Data that cannot be reassembled at a sane price. The formula is capital × time: even with money, a rival needs years of history.
**Built:** Ahrefs/Semrush, crawling as capital construction · Waze, users generate the data · Strava, a user-generated archive
**Bypassed:** open data covers 80% (OpenStreetMap) · change the collection technology (Waze vs TomTom) · buy the raw material wholesale

### 4 · Proprietary models

`Assets` · depth **3.5** mine (10y+) · capital ◉ · solo ✗ · AI ↑ · rent ✓

Models you trained yourself plus the compute under them. **Not for wrappers around someone else's API** — the moat exists only where the model is genuinely yours.
**Built:** OpenAI/Anthropic, the frontier as a capital race · Synthesia/HeyGen, narrow model on data you gathered · Midjourney, sharpened by community feedback
**Bypassed:** open source commoditises the capability · distillation and fast-follow · value leaks to the application layer (Cursor, Perplexity)

### 5 · Switching costs

`Locks` · depth **2** excavator (1–3y) · capital ○ · solo ✓ · AI ↓ · rent ✗

Accumulated history, configuration and habit make leaving painful regardless of quality. Real, but rarely enough alone.
**Built:** Salesforce/Jira, growing into the processes · Apple, ecosystem lock · QuickBooks, a lock held by a third party
**Bypassed:** importers and white-glove migration (Linear, HubSpot) · greenfield instead of conversion (Notion) · AI migration and regulated portability

### 6 · Integrations

`Locks` · depth **2** excavator (1–3y) · capital ◐ · solo ✓ · AI ↓ · rent ~

Breadth of connectors and the endless work of keeping them alive. Boring, historically effective — nobody wants to repair a thousand connectors forever.
**Built:** Zapier, the long tail as the product · Plaid, fragility as the barrier · Segment/Calendly, depth instead of breadth
**Bypassed:** standardisation (PSD2, MCP) · AI writes and repairs connectors · attack the head of demand (Make vs Zapier)

### 7 · Compliance

`Rules` · depth **3** drill rig (3–10y) · capital ● · solo ✗ · AI ↑ · rent ✓

Regulated ground: licences, payroll, tax, KYC, HIPAA/SOC 2, liability. Time, lawyers, and a right to be wrong small players do not have.
**Built:** Deel/Gusto, jurisdictions as a collection · Stripe, licences plus banking relationships · DocuSign, legal force as the product
**Bypassed:** compliance-as-a-service (Vanta, Drata) · rent the licence (BaaS) · the regulatory ladder (Revolut) — renting a licence rents someone else's risk

### 8 · Brand and trust

`Minds` · depth **4** mine (10y+) · capital ◐ · solo ~ · AI ↑ · rent ~

People pay because it is *this* vendor. The most durable mechanic — it lives in heads, not in the product, and code cannot reproduce it.
**Built:** 1Password, reputation as an accumulated asset · Bitwarden/Signal, open source accelerating trust · "nobody got fired for IBM"
**Bypassed:** one incident collapses it (LastPass) · borrowed trust · redefine whose trust matters (Zoom vs Cisco)

### 9 · Infrastructure scale

`Assets` · depth **3.5** mine (10y+) · capital ◉ · solo ✗ · AI → · rent ✓

Infrastructure one person cannot stand up: global hosting, uptime, media pipelines, email deliverability.
**Built:** Cloudflare, own hardware in hundreds of locations · email deliverability as reputation · Netflix Open Connect, scale as bargaining position
**Bypassed:** the cloud as equaliser · specialised wholesalers (Resend, Postmark) · local-first removes the question

### 10 · Hardware

`Assets` · depth **3** drill rig (3–10y) · capital ● · solo ~ · AI ↑ · rent ~

Physical devices, or data only the vendor's hardware produces.
**Built:** Whoop/Oura, subscription to your own sensor's data · Peloton, hardware anchoring content · Timeular, a physical artefact as interface
**Bypassed:** the phone is a good-enough sensor · platform data aggregators (Apple Health) · commodity hardware (Xiaomi vs Fitbit)

### 11 · Collaboration

`Human networks` · depth **2** excavator (1–3y) · capital ○ · solo ✓ · AI ↓ · rent ✗

The product only pays off with the whole team on it. Unlike network effects, here it is *your* team, not strangers.
**Built:** Figma, multiplayer as architecture · Google Docs, collaboration as category killer · GitHub, workflow as industry habit
**Bypassed:** the single-player wedge (Obsidian, Superhuman) · AI compresses the team · delegate collaboration to someone else's platform

### 12 · Content and rights

`Rules` · depth **2.5** drill rig (3–10y) · capital ● · solo ~ · AI → · rent ~

Licensed content, media rights, curricula, template and asset libraries. Contracts and production, not code.
**Built:** Spotify, catalogue licences · MasterClass/Brilliant, production instead of licensing · Canva, the library as half the product
**Bypassed:** generated substitutes (Suno, AI stock vs Getty) · user-generated libraries · go past the aggregator to the author (Substack)

### 13 · Execution polish

`Locks` · depth **1** shovel (weeks–months) · capital ○ · solo ✓ · AI ↓ · rent ✗

Polish, reliability, sync quality, workflow depth, import accuracy. **Execution, not structure — the moat AI eats.** The one mechanic carrying a warning: a product with only this has no structural defence.
**Built:** Superhuman, one metric to the point of cult · Linear, craft as the brand · Bear/Lightroom, years grinding on details
**Bypassed:** AI code generation eats it directly · sherlocking — the platform builds it in · open-source and freemium clones (Raycast vs Alfred)

### 14 · Patents and IP

`Rules` · depth **3** drill rig (3–10y) · capital ● · solo ✗ · AI ↑ · rent ✗

State-granted monopoly on an invention, or hidden know-how. Real in hardware/pharma/standards; **after Alice, close to empty in software.**
**Built:** Qualcomm, a portfolio as the business model · Dyson, a thicket around the category · Amazon 1-Click, while it lasted
**Bypassed:** design-around past the claims · expiry and the patent cliff · weak applicability to software

### 15 · Economies of scale

`Mathematics` · depth **3** drill rig (3–10y) · capital ● · solo ✗ · AI ↑ · rent ✗

Your unit costs are lower, so you live profitably at prices that kill rivals. Unit economics — not "one person cannot stand it up."
**Built:** Costco, purchasing scale plus a model forbidding margin · Amazon, logistics density · Hetzner/Backblaze, cost as the product
**Bypassed:** change the cost structure instead of competing inside someone else's · go premium, make price irrelevant · a technological reset of the curve

### 16 · Distribution and defaults

`Position` · depth **3** drill rig (3–10y) · capital ● · solo ~ · AI → · rent ~

Owning the channel the product reaches the user through. A worse product wins because it is already where the user is.
**Built:** Google/Apple, the default, bought · Teams, the bundle against the better product · Salesforce/Oracle, the sales machine as channel
**Bypassed:** enter from below with product-led growth · take the next cheap channel before it prices in · regulatory and platform resets

### 17 · Counter-positioning

`Position` · depth **3** drill rig (3–10y) · capital ◐ · solo ✓ · AI → · rent ✗

A model the incumbent sees, understands, and cannot copy because copying destroys its own revenue. The attacker's moat.
**Built:** Netflix vs Blockbuster, a model that kills the other P&L · Vanguard, ownership structure as irreproducibility · Dollar Shave Club vs Gillette
**Bypassed:** the incumbent swallows the pill · it buys what it cannot copy · second followers with no baggage — a melting moat

### 18 · Cornered resource

`Assets` · depth **3** drill rig (3–10y) · capital ◉ · solo ✗ · AI ↑ · rent ✗

Sole access to a scarce asset: talent, capacity, rights, compute.
**Built:** ASML and the queue at TSMC · concentration of talent (DeepMind, Pixar) · compute and exclusive rights
**Bypassed:** outbidding — a corner on people leaks · engineer a substitute (DeepSeek, Huawei under sanctions) · a second source, or the buyer integrating backwards

### 19 · Process power

`Locks` · depth **4** mine (10y+) · capital ◐ · solo ✗ · AI ↑ · rent ✗

Know-how embedded in an organisation: thousands of interlocking practices uncopyable even when observed in the open. Execution polish is its weak product-level relative.
**Built:** TSMC, yield as accumulated knowledge · Toyota, a moat publicity does not drain · Amazon/SpaceX, mechanisms as an operating system
**Bypassed:** hire the system, not the person · codification — consultants yesterday, **AI agents today** · jump over the process (Tesla gigacasting)

### 20 · Developer ecosystem

`Human networks` · depth **3** drill rig (3–10y) · capital ◐ · solo ~ · AI ↑ · rent ~

Third parties build businesses *on* you. Opposite direction to integrations: their investment becomes your moat.
**Built:** the App Store, other people's livelihoods · AppExchange/Shopify, partners cover every niche · WordPress/VS Code, openness as gravity
**Bypassed:** a compatible fork steals the ecosystem · raid it with incentives · wait for the platform to squeeze its own

### 21 · Community

`Human networks` · depth **2** excavator (1–3y) · capital ○ · solo ✓ · AI ↑ · rent ✗

People who identify with the product and do its work for free. **The cheapest of the strong moats, and the only one where a solo builder has a structural advantage over a corporation.**
**Built:** Notion, community as marketing and product dept · Figma, the identity of a profession · Obsidian, a cult around a tiny team
**Bypassed:** a community follows craft and leaves after a betrayal · you cannot buy one, only seed it patiently · communities live on neutral ground

### 22 · Capital as a moat

`Assets` · depth **4** mine (10y+) · capital ◉ · solo ✗ · AI → · rent ✗

Access to money a competitor does not have: patient investors, cheap debt, float, cash.
**Built:** Amazon, investor patience as an asset · blitzscaling and the subsidy wars · float and balance sheet (Berkshire, Apple)
**Bypassed:** efficiency outlasts money · do not play where subsidies decide · AI compresses the need for capital itself

### 23 · Speed

`Locks` · depth **1** shovel (weeks–months) · capital ○ · solo ✓ · AI ↓ · rent ✗

Iteration tempo as compounding advantage. **A meta-moat: a multiplier on building every other moat, and nothing on its own.**
**Built:** SpaceX, iteration against perfection · Shein, a cycle in days · Linear/Vercel, tempo as a public signal
**Bypassed:** the tools of speed are commoditised · the giant's burst mode · speed without accumulation is a window, not a wall

### 24 · Efficient scale

`Mathematics` · depth **4** mine (10y+) · capital ◐ · solo ~ · AI → · rent ✗

A market that feeds one player or two: a second entrant is guaranteed not to pay back, so rational rivals never come. Arithmetic of entry, not superiority.
**Built:** Moody's/S&P, a market needing everyone but no newcomer · pipes, towers, airports · Veeva, a micro-niche as a fortress
**Bypassed:** wait for the market to outgrow the moat · the regulator breaks up the comfort · eat the niche as a feature — and AI lowers the entry threshold

### 25 · Habit

`Minds` · depth **2** excavator (1–3y) · capital ○ · solo ✓ · AI → · rent ✗

Behaviour on autopilot: the user does not choose the product, they use it without thinking. Neural pathways, not stored config.
**Built:** Google, search as a reflex · Duolingo/Wordle, engineering the loop · Excel, the muscle memory of an industry
**Bypassed:** a change of context resets the reflex · generational rotation · interrupt with a 10x moment that preserves the old muscle memory

### 26 · Installed base

`Assets` · depth **3** drill rig (3–10y) · capital ● · solo ✗ · AI ↑ · rent ✗

Anchor sold at cost, profit taken for decades from consumables and service. Annuity on a fleet.
**Built:** Otis/KONE, lift almost free, service forever · HP, printer at a loss, cartridge at a profit · consoles as a ticket into the store
**Bypassed:** third parties crack open consumables and service · an honest price without blades · technology that removes the need for blades

### 27 · Bundling and reach

`Mathematics` · depth **2** excavator (1–3y) · capital ◐ · solo ~ · AI → · rent ✗

Economies of scope: sell the next product to the same base at almost no cost. The single-product rival competes with "included in what you already pay for."
**Built:** Microsoft 365, the bundle as a weapon · Amazon Prime, the bundle as retention glue · Adobe CC, boxes to subscription bundle
**Bypassed:** unbundling with best-in-class · regulatory unbundling · rebundling around a new axis

### 28 · Vertical integration

`Mathematics` · depth **3** drill rig (3–10y) · capital ◉ · solo ✗ · AI → · rent ✗

Owning several layers of the stack. Works where the interfaces between layers are the product's bottleneck.
**Built:** Apple Silicon, control of the stack · SpaceX, vertical for speed and price · Zara, production next to the shelf
**Bypassed:** the modular counter-attack — specialists outrun the integrator · asset-light in a downturn · the attacker's surgical integration of one layer

### 29 · Standard and format

`Rules` · depth **4** mine (10y+) · capital ● · solo ✗ · AI ↑ · rent ~

Your format or protocol is the language an industry stores its work in. The lock is on the industry's data, not on the user.
**Built:** Autodesk DWG, forty years of drawings hostage · Adobe PDF, give away the standard, keep the canon · consortia and pools (Bluetooth, USB)
**Bypassed:** lawful reverse-engineering for interoperability · an open standard by coalition · a change of medium buries the format

### 30 · Regulatory capture

`Rules` · depth **4** mine (10y+) · capital ● · solo ✗ · AI ↑ · rent ✗

Not following rules better — that is compliance — but helping write them and owning the state as a customer.
**Built:** Intuit, rules that guard the market · taxi medallions, regulation as cartel · the defence primes, clearances as an asset
**Bypassed:** a regulatory blitzkrieg of accomplished facts · sue for the right to compete · political cycles and the toxicity of capture

### 31 · Physical presence

`Assets` · depth **4** mine (10y+) · capital ◉ · solo ✗ · AI ↑ · rent ~

Locations and density: the spot your building stands on is a spot a rival can no longer take. Barely appears in digital products.
**Built:** McDonald's, a real-estate company selling burgers · Starbucks, pre-emption by clusters · American Tower, site plus permits
**Bypassed:** delivery removes the point of the place · mobile ordering redraws the map · rent someone else's presence

### 32 · Owned audience

`Minds` · depth **2** excavator (1–3y) · capital ○ · solo ✓ · AI → · rent ✗

A direct relationship with your readers — list, subscribers, channel — with no platform between. **Distribution you own, and it carries over to whatever you build next.**
**Built:** Morning Brew/The Hustle, the list as a balance-sheet asset · MrBeast, an audience as a launch pad · the indie pattern: build in public
**Bypassed:** attention goes stale without feeding · new platforms mint new stars · the AI flood splits relationships from worthless traffic

### 33 · Category leadership

`Minds` · depth **1** shovel (weeks–months) · capital ◐ · solo ✓ · AI ↓ · rent ✗

Not winning a category but inventing one: whoever names it sets the criteria buyers choose by. The softest moat here — and one practitioners keep naming.
**Built:** Salesforce, "the end of software" · HubSpot, a category as a curriculum · Gong, a category out of thin air plus the analysts
**Bypassed:** declare the category obsolete · the category dissolves into a platform · analysts and time work for hire — it needs feeding forever

### 34 · Locked-in reputation

`Human networks` · depth **3** drill rig (3–10y) · capital ○–◐ · solo ~ · AI → · rent ✗

Reputation a user earned inside your platform — ratings, statuses — that does not travel outside. Built by other people's work, held up by their ambition.
**Built:** eBay, the inventor of the mechanic · Uber/Airbnb, a two-sided rating as a licence to earn · Stack Overflow, reputation as a work record
**Bypassed:** subsidise the starting reputation · portability (so far more declared than delivered) · inflation of the signal itself

### 35 · Experience curve

`Mathematics` · depth **3** drill rig (3–10y) · capital ◉ · solo ✗ · AI ↑ · rent ✗

Unit costs fall 10–25% per doubling of *cumulative* output. Unlike scale economies (current volume), this is total history — a rival at equal volume today with nothing accumulated sits higher on the curve.
**Built:** semiconductors, yield as the sum of every wafer · Boeing vs Airbus vs COMAC · Wright's law in batteries
**Bypassed:** change the curve instead of chasing it · buy or siphon the experience · move the learning into simulation

---

## Cross-cuts worth reading off the matrix

- **Solo-reachable (✓):** 3, 5, 6, 11, 13, 17, 21, 23, 25, 32, 33. Everything
  else needs capital, an org, or both. A suggestion outside this set is not a
  plan for a one-person portfolio.
- **AI under attack (↓):** 5, 6, 11, 13, 23, 33 — every one of them
  solo-reachable. The mechanics a solo builder can reach fastest are
  the mechanics AI is devaluing fastest. Say this out loud in any read.
- **Rentable (✓):** 4, 7, 9. Do not dig what you can rent — but renting a
  licence rents someone else's risk (Synapse, 2024).
- **Shovel depth (1):** 13, 23, 33. Head starts, never walls. If every strength
  a project holds is on this list, it has no moat, it has a lead.
- **Cheapest strong mechanic:** 21 Community — depth 2, capital ○, solo ✓,
  AI-resistant. The only mechanic where one person beats a corporation.
