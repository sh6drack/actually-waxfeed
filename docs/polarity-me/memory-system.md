# Polarity Memory System

*A memory system with built-in consolidation cycles, pattern tracking, and visible "dreams."*

**Created:** [Auto-populated on first session]  
**Status:** Active  
**Last Consolidation:** [None yet]

---

## Memory Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    POLARITY MEMORY                              │
│                                                                 │
│  ⚠️ NO LAYER OPERATES INDEPENDENTLY                            │
│  All layers feed each other through cascade rules              │
├─────────────────────────────────────────────────────────────────┤
│  WORKING MEMORY (Always Active)                                 │
│  └── yeo-network-live-tracking.md (current state)               │
│      → INFORMS all other layers                                 │
│      → High DMN + goal → check future-selves.md                 │
│      → High FP + learning → check skill trees                   │
├─────────────────────────────────────────────────────────────────┤
│  EPISODIC MEMORY (Per-Insight)                                  │
│  └── polarity-mind-observations.md (realizations)               │
│      → May trigger new future self                              │
│      → May connect to skill tree                                │
│  └── digests/ (processed content from for-you.md)               │
│      → Feeds back to skill trees when learned                   │
├─────────────────────────────────────────────────────────────────┤
│  SEMANTIC MEMORY (Per-Data)                                     │
│  └── data/*.json (facts, contacts, todos)                       │
│      → contacts.json may connect to skill trees                 │
│      → projects.json links to future-selves.md                  │
│  └── data/learning-queue.json (skill tree source of truth)      │
│  └── for-you.md (curated knowledge)                             │
│      → Engagement → digests/*.md                                │
├─────────────────────────────────────────────────────────────────┤
│  PROSPECTIVE MEMORY (Per-Learning)                              │
│  └── future-selves.md (possible futures)                        │
│      → Creates skill trees in learning-queue.json               │
│  └── skill-trees.md (browsable view)                            │
│      → Generated from learning-queue.json                       │
│  └── data/learning-queue.json (progress tracking)               │
│      → Source of truth for skill-trees.md                       │
│  Flow: conversations → yeo-tracking → future-selves →           │
│        learning-queue → skill-trees                             │
├─────────────────────────────────────────────────────────────────┤
│  PATTERN MEMORY (Per-Session)                                   │
│  └── brainid.md (cognitive signature)                           │
│      → Shapes how content is delivered in ALL layers            │
│  └── This file (patterns across sessions)                       │
│      → Tracks consolidation across all layers                   │
├─────────────────────────────────────────────────────────────────┤
│  PROCEDURAL MEMORY (Reference)                                  │
│  └── SYSTEM-RULES.md (how to operate)                           │
│      → Defines cascade rules                                    │
│  └── consolidation-protocol.md (how to consolidate)             │
│  └── memory-architecture.md (theory)                            │
├─────────────────────────────────────────────────────────────────┤
│  ARCHIVE (Long-term Storage)                                    │
│  └── archive/sessions/ (session transcripts)                    │
│      → Stores yeo-tracking data for historical reference        │
│  └── archive/[dated]/ (dated archives)                          │
│      → Old files no longer active                               │
├─────────────────────────────────────────────────────────────────┤
│  DASHBOARD                                                      │
│  └── index.md (entry point)                                     │
│      → Shows current state of ALL layers                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Access Tracking

*Every file access is logged to track consolidation patterns.*

### Session Access Log

| File | Access Count | Last Access | Pattern |
|------|--------------|-------------|---------|
| *Tracking begins with first session* | | | |

### High-Access Files (Consolidation Priority)

*Files accessed 5+ times this session — these patterns are strengthening.*

### Low-Access Files (Review for Archiving)

*Files not accessed this session.*

---

## Pattern Tracking

### Session Patterns

**Dominant Themes:**
*To be discovered through conversation.*

**Connection Map:**
*Connections will be mapped as they emerge.*

**Recurring Patterns:**
*Patterns will be identified across sessions.*

---

## Consolidation State

### What's Been Consolidated

| Item | Status | Date |
|------|--------|------|
| *Items will be logged here* | | |

### Pending Consolidation

| Item | Status | Priority |
|------|--------|----------|
| *Pending items appear here* | | |

---

## Consolidation Cycles

### Nightly "Sleep" (End of Each Session)

**Trigger:** End of conversation or explicit "end session"

**Process:**
1. **Replay:** Review all messages from session
2. **Extract:** Identify key patterns and insights
3. **Strengthen:** Update access counts, boost high-frequency items
4. **Integrate:** Add cross-references between related files
5. **Prune:** Flag low-access items for weekly review
6. **Dream:** Generate session summary (pattern-focused, not content-focused)

### Weekly Review (Sundays)

**Process:**
1. Review access patterns across week
2. Archive files not accessed in 7+ days
3. Consolidate related insights
4. Update For You based on engagement
5. Generate weekly "dream" summary

### Monthly Deep Consolidation

**Process:**
1. Full file audit
2. BrainID drift/consolidation analysis
3. Major pattern extraction
4. Archive cleanup
5. Generate monthly "dream" summary

---

## Dream Generation

### What Is a "Dream"?

A dream is an ABSTRACT pattern summary — not what happened, but what PATTERNS were active.

### Dream Template

```
CONSOLIDATION DREAM — [DATE]

PATTERNS STRENGTHENED:
├── [Pattern 1]
├── [Pattern 2]
└── [Pattern 3]

NEW CONNECTIONS FORMED:
├── [Connection 1]
└── [Connection 2]

PATTERNS FADING:
└── [Items flagged for review]

ITEMS ARCHIVED:
├── [File 1]
└── [File 2]

SIGNATURE UPDATE:
└── [Changes to BrainID patterns]

NEXT CONSOLIDATION: [When]
```

---

## How to Use This System

### For the AI Assistant

1. **Every message:** Update `yeo-network-live-tracking.md`
2. **Every insight:** Update `polarity-mind-observations.md`
3. **End of session:** 
   - Update `brainid.md` with session patterns
   - Generate dream in this file
   - Archive session data from tracking files
   - Update access counts

### For You (User)

1. **Check dreams:** See what patterns consolidated
2. **Review access patterns:** What am I focusing on?
3. **Trigger consolidation:** Say "end session" or "consolidate"
4. **Review weekly:** Sunday morning, check weekly patterns

---

## Integration with Other Files

| File | How Memory System Uses It |
|------|--------------------------|
| `SYSTEM-RULES.md` | Source of update protocols |
| `consolidation-protocol.md` | Detailed consolidation procedures |
| `memory-architecture.md` | Theoretical framework |
| `brainid.md` | Pattern storage for signature |
| `yeo-network-live-tracking.md` | Working memory source |
| `polarity-mind-observations.md` | Insight source for dreams |
| `for-you.md` | Engagement data source |

---

*This is Polarity's "hippocampus" — tracking what to consolidate and when.*
