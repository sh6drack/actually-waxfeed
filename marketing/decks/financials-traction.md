---
marp: true
theme: uncover
class: invert
paginate: false
size: 16:9
backgroundColor: #0a0a0a
color: #ededed
style: |
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;900&display=swap');

  :root {
    --color-background: #0a0a0a;
  }

  section::after {
    display: none;
  }

  section {
    font-family: 'Helvetica Neue', 'Inter', Arial, sans-serif;
    background-color: #0a0a0a;
    color: #ededed;
    padding: 50px 60px;
    overflow: hidden;
  }

  h1 {
    font-weight: 900;
    letter-spacing: -0.05em;
    font-size: 3.5em;
    margin: 0;
    line-height: 0.95;
  }

  h2 {
    font-weight: 300;
    letter-spacing: -0.02em;
    font-size: 1.8em;
    margin: 0;
    line-height: 1.2;
  }

  h3 {
    font-weight: 400;
    font-size: 0.9em;
    color: #b0b0b0;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin: 0 0 20px 0;
  }

  p {
    font-weight: 300;
    font-size: 1em;
    line-height: 1.5;
    color: #d0d0d0;
    margin-top: 20px;
  }

  strong {
    color: #ffd700;
    font-weight: 500;
  }

  em {
    font-style: normal;
    color: #a0a0a0;
    font-size: 0.9em;
  }

  .small {
    font-size: 0.6em;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.25em;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 20px 0 0 0;
  }

  li {
    font-weight: 300;
    font-size: 1em;
    margin: 12px 0;
    color: #d0d0d0;
  }

  li::before {
    content: "—";
    margin-right: 15px;
    color: #666;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    text-align: left;
    margin-top: 25px;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 30px;
    text-align: left;
    margin-top: 25px;
  }

  .grid-4 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 20px;
    text-align: left;
    margin-top: 25px;
  }

  .grid div, .grid-3 div, .grid-4 div {
    font-size: 0.85em;
    line-height: 1.4;
  }

  .grid strong, .grid-3 strong, .grid-4 strong {
    display: block;
    margin-bottom: 8px;
    font-size: 1em;
    letter-spacing: 0.05em;
    color: #fff;
  }

  .metric {
    text-align: center;
  }

  .metric-value {
    font-size: 2.5em;
    font-weight: 900;
    color: #ffd700;
    line-height: 1;
    margin-bottom: 8px;
  }

  .metric-value-small {
    font-size: 1.8em;
    font-weight: 900;
    color: #ffd700;
    line-height: 1;
    margin-bottom: 6px;
  }

  .metric-label {
    font-size: 0.65em;
    color: #b0b0b0;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    font-size: 0.75em;
  }

  th {
    text-align: left;
    color: #b0b0b0;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 8px 0;
    border-bottom: 1px solid #333;
  }

  td {
    padding: 10px 0;
    border-bottom: 1px solid #333;
    color: #d0d0d0;
  }

  td:first-child {
    color: #fff;
  }

  .chart-bar {
    height: 25px;
    background: linear-gradient(90deg, #ffd700, #ff8c00);
    margin: 6px 0;
    display: flex;
    align-items: center;
    padding-left: 12px;
    font-weight: 500;
    color: #000;
    font-size: 0.8em;
  }

---

# POLARITY LAB

### FINANCIALS & UNIT ECONOMICS

*Q1 2026*

---

### WHAT WE'VE BUILT

<div class="grid-4">
<div class="metric">
<div class="metric-value">2</div>
<div class="metric-label">Patents</div>
</div>
<div class="metric">
<div class="metric-value">23</div>
<div class="metric-label">Claims</div>
</div>
<div class="metric">
<div class="metric-value">4</div>
<div class="metric-label">Products</div>
</div>
<div class="metric">
<div class="metric-value">1</div>
<div class="metric-label">Builder</div>
</div>
</div>

*Patent-protected framework. Full product suite. Zero funding.*

---

### WAXFEED PRODUCT STATUS

<div class="grid">
<div>

**CORE FEATURES**
Album reviews (0–10 scale)
User profiles + social graph
Activity feed + discovery
Friends + following system

</div>
<div>

**DIFFERENTIATORS**
TasteID cognitive profiling
First Spin badge system
Wax economy + tipping
Real-time messaging + rooms

</div>
</div>

*Complete feature set. Stripe payments live.*

---

### TECH STACK

<div class="grid">
<div>

**FRONTEND**
Next.js 16
React 19
Tailwind CSS
Framer Motion

</div>
<div>

**BACKEND**
PostgreSQL (Neon)
Prisma ORM
NextAuth v5
Stripe + webhooks

</div>
</div>

*Spotify API — Genius API — Cloudinary — Vercel*

---

### INFRASTRUCTURE COSTS

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| Vercel Pro | $20 | Hosting + edge functions |
| Neon PostgreSQL | $19 | Serverless database |
| Cloudinary | $0 | Free tier sufficient |
| Stripe | 2.9% + $0.30 | Per transaction |
| Domain + DNS | ~$2 | Amortized |

*~$41/month fixed. Variable costs scale with revenue.*

---

### GROSS MARGIN ANALYSIS

| Revenue Stream | Price | COGS | Gross Margin |
|----------------|-------|------|--------------|
| Waxfeed+ Monthly | $4.99 | $0.45 | 91% |
| Waxfeed+ Annual | $47.88 | $5.00 | 90% |
| Station Plan | $19.99 | $1.00 | 95% |
| Wax Pax (avg) | $8.99 | $0.90 | 90% |

*COGS: payment processing + marginal compute*

---

### WAXFEED+ ECONOMICS

<div class="grid">
<div>

**MONTHLY**
Price: $4.99
Payment processing: $0.45
Server costs: ~$0.05
**Gross profit: $4.49**
**Margin: 90%**

</div>
<div>

**ANNUAL**
Price: $47.88 ($3.99/mo)
Payment processing: $1.69
Server costs: ~$0.60
**Gross profit: $45.59**
**Margin: 95%**

</div>
</div>

---

### STATION PLAN ECONOMICS

## $19.99/month per station team

| Component | Value |
|-----------|-------|
| Payment processing | $0.88 |
| Additional compute | $0.12 |
| **Gross profit** | **$18.99** |
| **Gross margin** | **95%** |

*B2B pricing at consumer scale. Higher ARPU, lower CAC.*

---

### WAX PAX PRICING

| Pack | Wax | Price | $/Wax | Margin |
|------|-----|-------|-------|--------|
| Starter | 100 | $0.99 | $0.0099 | 85% |
| Standard | 500 | $3.99 | $0.0080 | 88% |
| Premium | 1,500 | $9.99 | $0.0067 | 90% |
| Collector | 5,000 | $24.99 | $0.0050 | 92% |

*Volume discount incentivizes larger purchases. Zero marginal cost.*

---

### WAX UTILITY

## What users spend Wax on:

- **Tipping reviews** — social currency transfer
- **Boosting reviews** — visibility in feed
- **Cosmetic items** — badges, profile frames
- **Username changes** — $4.99 equivalent

*Virtual goods. 100% gross margin after payment processing.*

---

### CAC BY CHANNEL

| Channel | CAC | Method | Scalability |
|---------|-----|--------|-------------|
| College radio | $0.50 | Direct outreach | 100K users |
| Music Twitter | $0 | Viral badges | Unknown |
| Reddit organic | $0 | Community seeding | Medium |
| Meta/Instagram | $3.20 | Paid acquisition | High |
| TikTok | $2.80 | Spark Ads | High |

*Power law: one channel will drive 80% of growth.*

---

### COLLEGE RADIO CAC

## $0.50 per user

| Cost Component | Amount |
|----------------|--------|
| Station outreach | $0 (founder time) |
| Founding program perks | $25 Wax × users |
| Setup support | $0 (self-serve) |
| **Blended CAC** | **$0.50** |

*Distribution moat. Competitors can't replicate access.*

---

### PAID ACQUISITION ECONOMICS

<div class="grid">
<div>

**META/INSTAGRAM**
CPC: $0.80
Landing conversion: 25%
CAC: $3.20
LTV/CAC: 17x

</div>
<div>

**TIKTOK**
CPC: $0.70
Landing conversion: 25%
CAC: $2.80
LTV/CAC: 19x

</div>
</div>

*Unit economics support paid scale.*

---

### LTV CALCULATION

| Input | Value | Rationale |
|-------|-------|-----------|
| ARPU | $4.50/mo | Blended subscriptions + transactions |
| Gross margin | 90% | Software economics |
| Monthly churn | 5% | Consumer social benchmark |
| Lifetime | 12 months | 1/churn with cap |
| **LTV** | **$54** | ARPU × margin × lifetime |

---

### LTV/CAC BY CHANNEL

<div class="grid-4">
<div class="metric">
<div class="metric-value-small">108x</div>
<div class="metric-label">College Radio</div>
</div>
<div class="metric">
<div class="metric-value-small">∞</div>
<div class="metric-label">Viral</div>
</div>
<div class="metric">
<div class="metric-value-small">19x</div>
<div class="metric-label">TikTok</div>
</div>
<div class="metric">
<div class="metric-value-small">17x</div>
<div class="metric-label">Meta</div>
</div>
</div>

*All channels above 3x threshold. College radio dominates.*

---

### PAYBACK PERIOD

| Channel | CAC | Monthly GP | Payback |
|---------|-----|------------|---------|
| College radio | $0.50 | $4.05 | 4 days |
| TikTok | $2.80 | $4.05 | 21 days |
| Meta | $3.20 | $4.05 | 24 days |

*Gross profit = ARPU × margin. All channels < 1 month payback.*

---

### CONVERSION FUNNEL

| Stage | Rate | Benchmark |
|-------|------|-----------|
| Visit → Signup | 25% | Above industry avg |
| Signup → First review | 40% | Activation |
| First review → D7 active | 30% | Retention |
| D7 active → Premium | 5% | Monetization |

*Letterboxd converts 6-8%. Target 5% is conservative.*

---

### MARKET SIZE

<div class="grid-3">
<div class="metric">
<div class="metric-value-small">$6.2B</div>
<div class="metric-label">TAM</div>
</div>
<div class="metric">
<div class="metric-value-small">$620M</div>
<div class="metric-label">SAM</div>
</div>
<div class="metric">
<div class="metric-value-small">$62M</div>
<div class="metric-label">SOM</div>
</div>
</div>

*616M streaming subscribers × $10/year potential spend*

---

### TAM BREAKDOWN

| Segment | Users | Spend Potential |
|---------|-------|-----------------|
| Spotify | 226M | $2.3B |
| Apple Music | 88M | $880M |
| Amazon Music | 82M | $820M |
| YouTube Music | 80M | $800M |
| Others | 140M | $1.4B |

*10% engage deeply (SAM). 1% early adopters (SOM).*

---

### 3-YEAR PROJECTIONS

| Metric | 2026 | 2027 | 2028 |
|--------|------|------|------|
| Users | 100K | 500K | 2M |
| Premium % | 4% | 5% | 6% |
| Premium users | 4K | 25K | 120K |
| ARPU | $4.50 | $4.50 | $4.50 |
| **ARR** | **$180K** | **$1.35M** | **$6.5M** |

*Conservative conversion rates. Improving with scale.*

---

### REVENUE MIX (2028)

| Stream | % | Amount |
|--------|---|--------|
| Waxfeed+ subscriptions | 60% | $3.9M |
| Station plans | 18% | $1.17M |
| Wax Pax transactions | 15% | $975K |
| Other (boosts, etc.) | 7% | $455K |

*Subscription-dominant. Predictable recurring revenue.*

---

### P&L PROJECTION (2028)

| Line Item | Amount |
|-----------|--------|
| Gross revenue | $6.5M |
| Payment processing (3%) | -$195K |
| Infrastructure | -$120K |
| **Gross profit** | **$6.2M** |
| **Gross margin** | **95%** |

*Software economics at scale.*

---

### OPERATING EXPENSES (2028)

| Category | Amount | % Revenue |
|----------|--------|-----------|
| Salaries (8 FTE) | $1.2M | 18% |
| Marketing | $800K | 12% |
| Research | $200K | 3% |
| G&A | $300K | 5% |
| **Total OpEx** | **$2.5M** | **38%** |

---

### PATH TO PROFITABILITY

| Year | Revenue | Gross Profit | OpEx | EBITDA |
|------|---------|--------------|------|--------|
| 2026 | $180K | $162K | $400K | -$238K |
| 2027 | $1.35M | $1.2M | $1.2M | $0 |
| 2028 | $6.5M | $6.2M | $2.5M | $3.7M |

*Break-even in 2027. Profitable in 2028.*

---

### ASSET VALUE: IP PORTFOLIO

## Patent portfolio appreciates independently

| Asset | Status | Value Driver |
|-------|--------|--------------|
| CCX Framework | Patent pending | Core methodology |
| TasteID Algorithm | Trade secret | User matching |
| BrainID Model | Research | Cognitive profiling |
| Data corpus | Growing | Research fuel |

*Defensive moat + acquisition currency.*

---

### RESEARCH OUTPUT VALUE

| Year | Papers | Patents | Value |
|------|--------|---------|-------|
| 2026 | 2 | 0 | Credibility |
| 2027 | 4 | 1 | Licensing potential |
| 2028 | 6 | 2 | Partnership leverage |

*Academic validation → enterprise credibility → revenue.*

---

### USE OF FUNDS

| Category | Amount | % |
|----------|--------|---|
| Engineering (2 hires) | $425K | 50% |
| Research (1 hire) | $127K | 15% |
| Marketing | $170K | 20% |
| Operations + reserve | $128K | 15% |
| **Total** | **$850K** | **100%** |

---

### HIRING PLAN

<div class="grid-3">
<div>

**ENGINEER #1**
Full-stack / Mobile
$100K–$130K
Q1 2026

</div>
<div>

**ENGINEER #2**
Backend / ML
$100K–$130K
Q2 2026

</div>
<div>

**RESEARCHER**
Cognitive science
$80K–$100K
Q2 2026

</div>
</div>

*Founder remains full-time through seed.*

---

### MILESTONES

| Milestone | Timeline | Budget Impact |
|-----------|----------|---------------|
| 50 college stations | Q1 2026 | $0 (organic) |
| 25K users | Q2 2026 | $40K marketing |
| First paper published | Q2 2026 | Research hire |
| $100K ARR | Q3 2026 | Validation |
| 100K users | Q4 2026 | Paid scale begins |

---

### SERIES A POSITION

<div class="grid">
<div>

**METRICS TARGET**
100K+ users
$850K+ ARR
6%+ conversion
Strong retention

</div>
<div>

**NARRATIVE**
Patent-protected moat
Research validation
Clear category leadership
Mobile apps launched

</div>
</div>

*Target: Q4 2026 / Q1 2027*

---

### COMPARABLE VALUATIONS

| Company | Stage | Valuation | Multiple |
|---------|-------|-----------|----------|
| Letterboxd (2023) | Growth | ~$100M | 15x ARR |
| Last.fm (2007) | Acquisition | $280M | N/A |
| Goodreads (2013) | Acquisition | $150M | N/A |

*Vertical social + IP = premium multiple.*

---

### RISK FACTORS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low activation | Revenue delay | Onboarding iteration |
| Retention drop | LTV compression | Social hooks, streaks |
| Patent challenge | IP value | 23 claims breadth |
| Platform dependency | Data access | Multi-source integration |

---

### THE NUMBERS

<div class="grid-3">
<div class="metric">
<div class="metric-value-small">90%+</div>
<div class="metric-label">Gross Margin</div>
</div>
<div class="metric">
<div class="metric-value-small">17x+</div>
<div class="metric-label">LTV/CAC</div>
</div>
<div class="metric">
<div class="metric-value-small">$6.5M</div>
<div class="metric-label">2028 ARR</div>
</div>
</div>

*Software economics. Consumer scale. Research upside.*

---

# POLARITY LAB

### UNIT ECONOMICS THAT COMPOUND

<span class="small">Patent Pending | 23 Claims</span>

