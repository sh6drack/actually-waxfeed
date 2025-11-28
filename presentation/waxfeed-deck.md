---
marp: true
theme: uncover
class: invert
paginate: false
backgroundColor: #0a0a0a
color: #ededed
style: |
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;900&display=swap');

  section {
    font-family: 'Helvetica Neue', 'Inter', Arial, sans-serif;
    background-color: #0a0a0a;
    color: #ededed;
    padding: 80px;
  }

  h1 {
    font-weight: 900;
    letter-spacing: -0.05em;
    font-size: 5em;
    margin: 0;
    line-height: 0.9;
  }

  h2 {
    font-weight: 300;
    letter-spacing: -0.02em;
    font-size: 2.4em;
    margin: 0;
    line-height: 1.2;
  }

  h3 {
    font-weight: 400;
    font-size: 1.2em;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin: 0 0 40px 0;
  }

  p {
    font-weight: 300;
    font-size: 1.1em;
    line-height: 1.6;
    color: #888;
    margin-top: 40px;
  }

  strong {
    color: #fff;
    font-weight: 500;
  }

  em {
    font-style: normal;
    color: #555;
    font-size: 0.9em;
  }

  .small {
    font-size: 0.65em;
    color: #444;
    text-transform: uppercase;
    letter-spacing: 0.25em;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 40px 0 0 0;
  }

  li {
    font-weight: 300;
    font-size: 1.2em;
    margin: 24px 0;
    color: #999;
  }

  li::before {
    content: "—";
    margin-right: 20px;
    color: #333;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    text-align: left;
    margin-top: 40px;
  }

  .grid div {
    font-size: 0.95em;
  }

  .grid strong {
    display: block;
    margin-bottom: 16px;
    font-size: 1.1em;
    letter-spacing: 0.05em;
  }

  img {
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }

  section.screenshot {
    padding: 40px;
  }

  section.screenshot img {
    max-height: 70vh;
    width: auto;
  }

---

# WAXFEED

### LETTERBOXD FOR MUSIC

*2025*

---

### THE OPPORTUNITY

# $0

## spent on social music discovery

*Film has Letterboxd. Books has Goodreads. Music has nothing.*

---

### THE GAP

# LETTERBOXD

## 15M+ users — $10M+ revenue

*No equivalent exists for music*

---

### WHAT EXISTS

- **Spotify** — streaming, no community
- **RateYourMusic** — archaic UX, no social
- **Last.fm** — dead product, scrobbles only
- **Apple Music** — playlists, no reviews

*None let you review, rate, and discover through friends*

---

### THE INSIGHT

# Friends > Algorithms

*Letterboxd proved this for film*

---

# WAXFEED

---

### THE PRODUCT

## Review albums. Follow friends. Discover music through taste.

---

<!-- _class: screenshot -->

### HOME FEED

![home](screenshots/home.png)

---

### THE CORE LOOP

<div class="grid">
<div>

**LISTEN**
Stream anywhere
Find on Waxfeed

**DISCOVER**
See friends' reviews
Find new favorites

</div>
<div>

**REVIEW**
Rate 0–10
Write your take

**CONNECT**
Build taste profile
Earn reputation

</div>
</div>

---

### FEATURES

- Album reviews with 0–10 ratings
- Friends-only social feed
- Curated music lists
- Genius lyrics integration
- Personal listening diary

---

### WAX

### SOCIAL CURRENCY

## Give wax to great reviews. Earn wax for taste.

*Reputation system that rewards quality*

---

### WHY NOW

- Streaming killed ownership—people want connection
- Gen Z craves authenticity over algorithms
- Music discourse is fragmented across Twitter
- Letterboxd proved the model

*Infrastructure exists. Product doesn't.*

---

### THE MARKET

# 616M

## paid streaming subscribers

*All want to share their taste*

---

### TARGET USER

## The music person in every friend group

- Active Letterboxd user
- Curates playlists for friends
- Posts album recs in group chats
- No platform exists for this

---

### MOAT

# SOCIAL GRAPH + TASTE DATA

*Once friends are here, you stay*

---

### BUSINESS MODEL

<div class="grid">
<div>

**FREE**
Review albums
Follow friends
Basic lists

</div>
<div>

**PRO — $5/mo**
Advanced stats
Custom profiles
Premium wax

</div>
</div>

---

### TECH

<div class="grid">
<div>

**FRONTEND**
Next.js 15
React 19
Tailwind CSS

</div>
<div>

**BACKEND**
Prisma ORM
PostgreSQL
NextAuth.js

</div>
</div>

*Spotify API — Genius API*

---

### ROADMAP

- Mobile apps
- Year in review stats
- Artist accounts
- Label partnerships
- API integrations

---

### THE VISION

## The canonical place to discuss, rate, and discover music

*Like Letterboxd owns film discourse*

---

### THE ASK

# Join early. Shape the culture.

*The music community we deserve*

---

# WAXFEED

### YOUR TASTE — YOUR FRIENDS — YOUR FEED

---

# FIN

*"MUSIC SOUNDS BETTER WITH FRIENDS"*

<span class="small">© 2025 WAXFEED</span>
