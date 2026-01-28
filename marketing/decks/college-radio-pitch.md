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

  .gold {
    color: #ffd700;
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

  .grid div, .grid-3 div {
    font-size: 0.85em;
    line-height: 1.4;
  }

  .grid strong, .grid-3 strong {
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

  .metric-label {
    font-size: 0.7em;
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

  .leaderboard {
    font-family: monospace;
    font-size: 0.8em;
    background: #111;
    padding: 20px;
    margin-top: 20px;
    border-left: 3px solid #ffd700;
  }

  .leaderboard-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid #222;
  }

  .leaderboard-rank {
    color: #666;
    width: 35px;
  }

  .leaderboard-name {
    color: #fff;
    flex: 1;
  }

  .leaderboard-score {
    color: #ffd700;
    font-weight: 500;
  }

---

# WAXFEED

### COLLEGE RADIO PARTNERSHIP

*Q1 2026*

---

### THE PROBLEM

# College radio is invisible.

*DJs discover artists before anyone. But there's no proof.*

---

### THE TRUTH

## Every college radio DJ has said:

# "I played them before they blew up."

*But where's the receipt?*

---

### THE OPPORTUNITY

# 1,400

## college radio stations in the US

*100,000+ DJs. Zero platform to prove their taste.*

---

### INTRODUCING

# WAXFEED

## Letterboxd for music.

*Review albums. Follow friends. Prove your taste.*

---

### FOR COLLEGE RADIO

# FIRST SPIN

## Prove you called it first.

---

### HOW IT WORKS

1. Your DJs review albums on Waxfeed
2. They're timestamped — position recorded
3. Album later trends or charts
4. DJs who reviewed early get **badges**

*Your station's taste becomes provable.*

---

### FIRST SPIN BADGES

<div class="grid-3">
<div class="metric">
<div class="metric-value" style="color: #ffd700">●</div>
<div class="metric-label">Gold Spin</div>
First 10 reviewers
</div>
<div class="metric">
<div class="metric-value" style="color: #c0c0c0">●</div>
<div class="metric-label">Silver Spin</div>
First 50 reviewers
</div>
<div class="metric">
<div class="metric-value" style="color: #cd7f32">●</div>
<div class="metric-label">Bronze Spin</div>
First 100 reviewers
</div>
</div>

*Retroactive rewards. Your early calls are tracked forever.*

---

### TASTEMAKER SCORE

## Your aggregate taste credential.

```
SCORE = (Gold × 10) + (Silver × 5) + (Bronze × 2)
```

*Station totals create leaderboards.*

---

### STATION LEADERBOARDS

<div class="leaderboard">
<div style="color: #666; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8em">IVY LEAGUE TASTEMAKER RANKINGS — WINTER 2026</div>
<div class="leaderboard-row">
<span class="leaderboard-rank">#1</span>
<span class="leaderboard-name">WBRU — BROWN</span>
<span class="leaderboard-score">847</span>
</div>
<div class="leaderboard-row">
<span class="leaderboard-rank">#2</span>
<span class="leaderboard-name">WPRB — PRINCETON</span>
<span class="leaderboard-score">712</span>
</div>
<div class="leaderboard-row">
<span class="leaderboard-rank">#3</span>
<span class="leaderboard-name">WHRB — HARVARD</span>
<span class="leaderboard-score">698</span>
</div>
<div class="leaderboard-row">
<span class="leaderboard-rank">#4</span>
<span class="leaderboard-name">WVBR — CORNELL</span>
<span class="leaderboard-score">623</span>
</div>
</div>

---

### WHY COMPETE?

# "Our station is ranked #3 in the Ivy League."

*Now there's something to fight for.*

---

### FOUNDING STATION PROGRAM

# First 50 stations

## Permanent premium benefits.

*Free forever. First mover advantage.*

---

### WHAT FOUNDING STATIONS GET

- **Verified Station Profile** — credibility marker
- **Station Dashboard** — team stats and analytics
- **All DJ Badges** — verified DJ status
- **Leaderboard Position** — conference rankings
- **API Access** — export to station website
- **Priority Support** — direct line to founders

*$0/month. Forever.*

---

### FOR YOUR DJS

<div class="grid">
<div>

**PROFILE**
Verified DJ badge
Personal Tastemaker Score
Review history

</div>
<div>

**DISCOVERY**
Trending predictions
Early access features
First Spin tracking

</div>
</div>

---

### FOR YOUR STATION

<div class="grid">
<div>

**ANALYTICS**
Team review velocity
Badge distribution
Genre coverage

</div>
<div>

**CREDIBILITY**
Provable taste
Conference rankings
Artist discovery claims

</div>
</div>

---

### THE VIRAL MECHANIC

1. DJ gets Gold Spin badge
2. Posts to Twitter: **"Just got my 5th Gold Spin"**
3. Music Twitter: **"What's a Gold Spin?"**
4. They sign up
5. Your station gets credit

*Your DJs become the marketing.*

---

### WHAT WE ASK

# Your DJs review albums.

*That's it. They're probably doing it already.*

---

### THE COMMITMENT

- Onboard your DJ staff to Waxfeed
- Encourage album reviews (not mandatory)
- Share station achievements
- Provide feedback on product

*We build for you. You help us grow.*

---

### TIMELINE

<div class="grid">
<div>

**JANUARY**
Founding stations onboard
Station dashboards live
DJ verification

</div>
<div>

**FEBRUARY**
Conference leaderboards
First competitions
Public launch

</div>
</div>

---

### WHO'S IN

<div class="grid-3">
<div class="metric">
<div class="metric-value">50</div>
<div class="metric-label">Founding Spots</div>
</div>
<div class="metric">
<div class="metric-value">12</div>
<div class="metric-label">Claimed</div>
</div>
<div class="metric">
<div class="metric-value">38</div>
<div class="metric-label">Remaining</div>
</div>
</div>

*Spots fill fast. First come, first served.*

---

### WHY NOW

# "First station in your conference to join."

*Bragging rights are permanent.*

---

### THE VISION

## College radio discovers artists.
## Waxfeed proves it.

*You break the music. We timestamp the receipts.*

---

### NEXT STEPS

1. **Confirm interest** — reply to this deck
2. **Station onboarding call** — 30 min setup
3. **DJ accounts created** — same day
4. **You're live** — start building your score

---

### CONTACT

**Shadrack Annor**
Founder, Waxfeed
WBRU Creative Director
shadrack@brown.edu

<span class="small">© 2026 POLARITY LAB LLC</span>

---

# WAXFEED

### YOUR STATION'S TASTE — PROVEN

