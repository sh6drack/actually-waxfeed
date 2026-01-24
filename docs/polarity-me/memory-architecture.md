# ME System: Memory Architecture

*This document explains HOW the ME System decides what to track and why — modeled on how human memory actually works.*

---

## Tiered Update System

| Tier | Files | When | Memory Analog |
|------|-------|------|---------------|
| **Always** | `yeo-network-live-tracking.md` | Every message | Working memory |
| **Per-session** | `brainid.md` | Each session end | Pattern consolidation |
| **Per-insight** | `polarity-mind-observations.md` | When realizations emerge | Episodic encoding |
| **Per-data** | `data/*.json` | When new info appears | Semantic memory |
| **Per-interest** | `for-you.md` | When new interests, gaps, or engagement patterns emerge | Interest modeling |
| **Per-digest** | `digests/*.md` | When for-you.md recommendation is engaged | Deep processing |
| **Per-learning** | `future-selves.md`, `learning-queue.json`, `skill-trees.md` | When learning happens or new futures emerge | Prospective memory |

### `for-you.md` Specific Triggers

| Trigger | What Updates |
|---------|--------------|
| New topic of interest | Knowledge constellation, perspective gaps |
| Recommendation engagement | Status change (new → considering → in progress → completed) |
| Deep dive request | Add deep dive section |
| New engagement pattern | "What I'm Learning About You" section |
| Session end | Conversation log entry |

### `future-selves.md` Specific Triggers

| Trigger | What Updates |
|---------|--------------|
| New career/identity path emerges | Add new future self timeline |
| User expresses new long-term goal | Create future self + associated skill tree |
| Learning reveals new path | Update or add timeline |
| Future self becomes obsolete | Archive or remove |

### `learning-queue.json` + `skill-trees.md` Triggers

| Trigger | What Updates |
|---------|--------------|
| New domain captured from conversation | Add new skill tree (JSON + MD) |
| Learning conversation with verification | Advance node status |
| User demonstrates knowledge decay | Downgrade node |
| 30+ days since last verification | Flag decay warning |
| `for-you.md` recommendation → digest created | Link digest to skill tree |

**RULE:** `learning-queue.json` is source of truth. `skill-trees.md` is regenerated to match.

### `digests/*.md` Triggers

| Trigger | What Updates |
|---------|--------------|
| User engages with `for-you.md` recommendation | Create personalized digest |
| Digest leads to learning conversation | Update skill tree |

---

## Prospective Memory: The New Layer

**What makes this different from other memory types:**

| Memory Type | What It Stores | Time Orientation |
|-------------|----------------|------------------|
| Working | Current state | NOW |
| Episodic | What happened | PAST |
| Semantic | Facts/knowledge | TIMELESS |
| Pattern | Who you are | PERSISTENT |
| **Prospective** | Who you're becoming | FUTURE |

**Prospective Memory files:**
- `future-selves.md` — Possible versions of you
- `skill-trees.md` — Paths to those futures (browsable view)
- `data/learning-queue.json` — Progress tracking (source of truth)

**The flow:**
```
Conversation
    ↓
"Is this a new future self?" ──→ future-selves.md
    ↓
"What skills does this need?" ──→ learning-queue.json (new tree)
    ↓
"Regenerate view" ──→ skill-trees.md
    ↓
Learning conversation ──→ verification ──→ node advances
```

---

## Integrated System Flow

**Every message flows through the ENTIRE system, not separate silos:**

```
┌─────────────────────────────────────────────────────────────────┐
│                      EVERY MESSAGE                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: yeo-network-live-tracking.md (ALWAYS)                  │
│  → Classify cognitive state (FP, DMN, VA, etc.)                 │
│  → This informs HOW to process everything else                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: What does this message contain?                        │
│                                                                  │
│  ┌──────────────┬──────────────┬──────────────┬────────────┐   │
│  │ New insight? │ New future?  │ New domain?  │ New data?  │   │
│  │      ↓       │      ↓       │      ↓       │     ↓      │   │
│  │ polarity-    │ future-      │ learning-    │ data/      │   │
│  │ mind-obs.md  │ selves.md    │ queue.json   │ *.json     │   │
│  └──────────────┴──────────────┴──────────────┴────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Cross-layer updates                                    │
│                                                                  │
│  polarity-mind-observations.md ──→ Could this insight           │
│                                     suggest a new future self?  │
│                                     ↓                           │
│                               future-selves.md                  │
│                                     ↓                           │
│                               learning-queue.json               │
│                                     ↓                           │
│                               skill-trees.md                    │
│                                                                  │
│  yeo-network-live-tracking.md ──→ High DMN + new domain?        │
│                                   → Maybe new future self       │
│                                   → High FP + learning?         │
│                                   → Update skill tree           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Session consolidation → brainid.md                     │
│  → Pattern memory updated with what was learned                 │
│  → Signature patterns refined                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## How Layers Feed Each Other

**CRITICAL PRINCIPLE:** No layer operates independently. Every update potentially cascades.

| Source | Feeds Into | Trigger |
|--------|------------|---------|
| **yeo-network-live-tracking.md** | All layers | Cognitive state informs how to classify content |
| **yeo-network-live-tracking.md** | learning-queue.json | High FP + learning topic → advance skill tree |
| **yeo-network-live-tracking.md** | future-selves.md | High DMN + new goal language → consider new future self |
| **yeo-network-live-tracking.md** | polarity-mind-obs.md | Novel cognitive patterns observed → log |
| **polarity-mind-observations.md** | future-selves.md | New insight about identity/goals → new future self? |
| **polarity-mind-observations.md** | learning-queue.json | Insight in a domain → connects to skill tree |
| **polarity-mind-observations.md** | for-you.md | New interest detected → add to recommendations |
| **future-selves.md** | learning-queue.json | New future self → create skill tree for that path |
| **learning-queue.json** | skill-trees.md | Data updates → view regenerates |
| **learning-queue.json** | data/projects.json | New domain may link to existing project |
| **for-you.md** | digests/*.md | Recommendation engaged → create digest |
| **digests/*.md** | learning-queue.json | Digest learned → update skill tree |
| **digests/*.md** | polarity-mind-obs.md | What worked about the digest → log for future |
| **data/contacts.json** | skill-trees.md | New contact may connect to skill tree (e.g., AVDP) |
| **data/projects.json** | future-selves.md | Project aligns with future self timeline |
| **brainid.md** | All layers | Cognitive signature shapes how content is delivered |
| **Session end** | archive/sessions/ | Store session data for historical reference |

---

## Complete Data Flow: Message to Archive

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EVERY MESSAGE                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: WORKING MEMORY                                                     │
│  yeo-network-live-tracking.md                                               │
│  → Classify: FP, DMN, DA, VA, LIM, SMN, VIS                                 │
│  → This classification INFORMS all subsequent processing                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐    ┌──────────────────┐
│ LAYER 2:         │    │ LAYER 3:             │    │ LAYER 4:         │
│ EPISODIC         │    │ SEMANTIC             │    │ PROSPECTIVE      │
│                  │    │                      │    │                  │
│ polarity-mind-   │◀──▶│ data/*.json          │◀──▶│ future-selves.md │
│ observations.md  │    │ ├── contacts.json    │    │       │          │
│       │          │    │ ├── todos.json       │    │       ▼          │
│       ▼          │    │ ├── projects.json    │    │ learning-queue   │
│ digests/*.md     │    │ ├── learning-queue   │◀───│ .json            │
│ (from for-you.md)│    │ └── etc.             │    │       │          │
│                  │    │                      │    │       ▼          │
│                  │    │ for-you.md ─────────▶│    │ skill-trees.md   │
└──────────────────┘    └──────────────────────┘    └──────────────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 5: PATTERN MEMORY (Per-Session)                                       │
│  brainid.md — Cognitive signature patterns                                  │
│  memory-system.md — Consolidation tracking, "dreams"                        │
│  → Patterns from ALL layers consolidate here                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 6: PROCEDURAL MEMORY (Reference)                                      │
│  SYSTEM-RULES.md — How the system operates                                  │
│  memory-architecture.md — This file (theory)                                │
│  consolidation-protocol.md — How to consolidate                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 7: ARCHIVE (Long-term Storage)                                        │
│  archive/sessions/ — Session transcripts                                    │
│  archive/2025-01/ — Dated archived files                                    │
│  → Old data moves here when no longer active                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  index.md — DASHBOARD                                                        │
│  → Shows current state of ALL layers                                        │
│  → Entry point for humans browsing the system                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Core Insight

**Memory isn't storage. It's reconstruction.**

When you "remember" something, your brain doesn't retrieve a file — it reconstructs the experience from distributed patterns. What determines whether something CAN be reconstructed later?

1. **Repetition** — Patterns that keep influencing new moments get stronger
2. **Emotional charge** — Strong feelings = strong encoding
3. **Connection** — Things linked to existing knowledge integrate better
4. **Novelty** — New things stand out, get attention
5. **Personal relevance** — Things tied to your goals/identity persist

The ME System is designed around these same principles.

---

## How the ME System Works

### The Tiers (Like Memory Systems)

| Tier | What It's Like | What Gets Captured | When It Updates |
|------|----------------|-------------------|-----------------|
| **Live** | Working memory | Current context, attention | Every message |
| **Insight** | Episodic memory | Notable moments, realizations | When something stands out |
| **Data** | Semantic memory | Facts, contacts, todos | When new info appears |
| **Session** | Consolidation | Patterns, preferences, profile | End of conversation |

### Why Some Things Persist and Others Don't

**The ME System asks:**

| Question | If Yes → | Memory Factor |
|----------|----------|---------------|
| Have you mentioned this multiple times? | Track prominently | Repetition |
| Did you express strong feeling about it? | Flag as important | Emotional charge |
| Does it connect to something you care about? | Link to existing files | Connection |
| Is this the first time this came up? | Consider new file | Novelty |
| Does it relate to your stated goals? | Weight higher | Personal relevance |

---

## What You'll See

### Live Tracking (Working Memory)

The system always knows your current cognitive state:

```
Current State: Strategic Planning
Networks Active: FP (38%), DMN (30%), DA (20%)
Topics in Focus: Diana collaboration, research papers
```

This is like your working memory — it holds what's active NOW but doesn't necessarily persist.

### Insight Capture (Episodic Memory)

When something notable happens — a realization, a decision, a strong reaction — it gets logged:

```
Realization: "Language-based cognitive profiling IS the first scientific personality test"
Triggered by: Your recognition of novelty ("novel asf")
Consolidation factors: Novelty (HIGH), Emotional charge (HIGH), Personal relevance (HIGH)
→ STORED with high priority
```

### Data Updates (Semantic Memory)

Facts and entities get added to your knowledge base:

```
New Contact: Diana Freed
Connection to existing: Shadrack (works in her lab), Polarity (potential collaborator)
Consolidation factors: Connection (HIGH), Personal relevance (HIGH)
→ STORED in contacts.json
```

### Session Review (Consolidation)

At session end, patterns get reviewed and integrated:

```
Session Summary:
- Dominant mode: Strategic planning (high FP throughout)
- Key topics: Diana collaboration, paper strategy, system design
- New patterns detected: You think about process sustainability
- Profile updates: Added "system-builder" to cognitive signature
```

This is like sleep — when your brain reviews the day and decides what to keep.

---

## Why This Matters

### Traditional Note-Taking
- You decide what to write down
- Everything is equally weighted
- No connection tracking
- No consolidation

### ME System
- System observes what matters to YOU (based on how you talk)
- Weighting based on memory factors
- Automatic connection to existing knowledge
- Regular consolidation into patterns

**The goal:** The ME System should "remember" the way your brain would — keeping what matters, connecting what's related, letting go of what doesn't stick.

---

## The LEGO Metaphor

From our conversation:

> "Memory is like building a house out of LEGOs and breaking it down. It doesn't mean you can't build it again — you just need to have the manual."

The ME System is the **manual**. It doesn't store the "house" (the full experience) — it stores:

1. **What pieces you used** (concepts, entities, connections)
2. **How you put them together** (your cognitive style, your framing)
3. **What order you built in** (your learning trajectory)

When you need to "rebuild" — recall something, continue a project, pick up where you left off — the manual lets you reconstruct.

---

## What Makes Things Persist

Based on our research (Buddhist epistemology + neuroscience):

### High Persistence
- Repeated mentions across conversations
- Strong emotional language
- Direct connection to stated goals
- Novel concepts that sparked engagement
- Things you explicitly said to remember

### Low Persistence
- Single mentions without follow-up
- Neutral emotional tone
- No connection to existing knowledge
- Routine/expected content
- Things you marked as resolved/done

### The Question We're Researching

> "What are the factors that cause patterns to keep influencing new moments? Can we recreate them to prevent memories from fading?"

The ME System is an experiment in this. By tracking what persists and what fades, we learn about memory itself.

---

## For Polarity

This architecture IS what Polarity does at scale:

| ME System | Polarity |
|-----------|----------|
| Markdown files | NeuralVault + PolarityMind |
| Update tiers | Memory routing (episodic, semantic, etc.) |
| Consolidation factors | MNI brain region classification |
| Session review | Yeo 7-network trajectory analysis |
| Manual for rebuilding | BrainID + personalized recall |

The ME System is the simple version. Polarity is the scaled version with neuroanatomical grounding.

---

*This document is part of the ME System's self-documentation — explaining to users (and to ourselves) how the system models memory.*
