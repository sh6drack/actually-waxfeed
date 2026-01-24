# Skill Trees

*Your paths to your future selves. Browse, find what pulls you, say the phrase.*

**Last Updated:** [Auto-populated]

---

## Quick Start

| Tree | Future Self | Your Level | Next Step |
|------|-------------|------------|-----------|
| *Skill trees will appear as you define learning goals* | | | |

---

## How This Works

1. **Browse** this file to see your trees
2. **Find** a node that pulls you
3. **Say** the activation phrase in conversation
4. **Learn** — I teach in your style (based on BrainID)
5. **Progress** — node advances, tree updates

---

## Skill Tree Template

**[Domain Name]**

**→ [Future Self]**

```
Current Position: ◉ [Level Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### What You Know
- ✓ [Known item 1]
- ✓ [Known item 2]

### Level 1: [Foundation] `[STATUS]`

| Node | Status | To Learn | Time |
|------|--------|----------|------|
| [Skill name] | ○ Unknown | "[Activation phrase]" | X min |
| **[Current focus]** | **◉ NEXT** | **"[Activation phrase]"** | **X min** |

### Level 2: [Intermediate] `[STATUS]`

| Node | Status | To Learn | Time |
|------|--------|----------|------|
| [Skill name] | ○ Locked | — | — |

### Level 3: [Advanced] `[STATUS]`

| Node | Status | To Learn | Time |
|------|--------|----------|------|
| [Skill name] | ○ Locked | — | — |

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Source: [Where this tree came from] | Captured: [Date]
```

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ● | Strong — you know this well |
| ◐ | Curious/Partial — you've touched it |
| ◉ | **NEXT** — suggested next step |
| ○ | Unknown/Locked |
| ✓ | Confirmed knowledge |

---

## Node Status Progression

| Status | Meaning | How You Get Here |
|--------|---------|------------------|
| Unknown | Haven't encountered | Default state |
| Curious | Expressed interest | Asked about it |
| Understood | Can explain back | Passed teach-back |
| Strong | Can apply/connect | Passed application test |

### Verification Protocol

Node progression requires DEMONSTRATED knowledge:

| Transition | Requirement | How It's Verified |
|------------|-------------|-------------------|
| Unknown → Curious | You ask about it | Automatic — the question is proof |
| Curious → Understood | You explain it back correctly | "In your own words, what's the key idea?" |
| Understood → Strong | You apply, connect, or teach it | "How would this apply to [scenario]?" |

---

## Learning Decay

**Understanding can degrade. Nodes can move BACKWARD.**

| Trigger | Action |
|---------|--------|
| "I don't remember how X works" | Re-verify, potentially downgrade |
| Get application question wrong | Downgrade strong → understood |
| Contradict previous understanding | Re-verify from scratch |
| 30+ days since last verification | Mark with decay warning |

**Decay transitions:**
- Strong → Understood: Can't apply, but can still explain
- Understood → Curious: Can't explain clearly anymore
- Curious → Unknown: Forgot entirely

**Re-verification is normal.** The skill tree is a living document, not a trophy case.

---

## Data Flow

```
Conversations → learning-queue.json → skill-trees.md
                     ↑
              future-selves.md (filter: which future self?)
```

**Source of truth:** `data/learning-queue.json`  
**This file:** Browsable view, generated from the JSON

---

## Your Active Skill Trees

*Skill trees will appear here as you define learning goals through conversation.*

---

*This file updates automatically as you learn. The JSON in `data/learning-queue.json` is the data store; this is the browsable view.*
