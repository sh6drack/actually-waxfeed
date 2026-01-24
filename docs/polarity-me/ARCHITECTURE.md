# Polarity System Architecture

*Technical documentation for how Polarity works under the hood.*

---

## Overview

Polarity is a **cognitive modeling system** that builds a profile of how you think through conversation. It's implemented as a set of markdown and JSON files that AI assistants read and update during conversation.

**Key insight:** The "intelligence" lives in the AI + files + rules. The AI tool (Cursor, VSCode, etc.) is just a wrapper. If you give any AI access to these files and rules, you get Polarity.

---

## Core Principles

### 1. Everything Is Data

Every message you send is classified using the Yeo 7-Network cognitive model. There are no "unimportant" messages. Mundane messages reveal body/emotion states that conceptual messages miss.

### 2. Layers Feed Each Other

No file operates independently. Updates cascade:
- An insight might trigger a new future self
- A new future self creates a skill tree
- A skill tree connects to contacts
- Contacts connect back to skill trees

### 3. BrainID Is the Goal

The purpose of all tracking is to build your cognitive signature — the characteristic pattern of how you think that distinguishes you from anyone else.

### 4. Memory as Process

Following neuroscience and Buddhist epistemology, Polarity models memory as reconstruction, not storage. We track patterns and conditions, not static facts.

---

## File Architecture

### Tier 1: Working Memory (Every Message)

```
yeo-network-live-tracking.md
├── Every message gets classified
├── Network scores assigned (VIS, SMN, DA, VA, LIM, FP, DMN)
├── Cognitive state inferred
└── Feeds all other layers
```

### Tier 2: Episodic Memory (Per Insight)

```
polarity-mind-observations.md
├── AI observations about user
├── AI observations about itself
├── Realizations log
└── Black box mapping progress

digests/
├── Personalized content from for-you.md
├── Created when user engages with recommendation
└── Feeds back to skill trees
```

### Tier 3: Semantic Memory (Per Data)

```
data/
├── contacts.json      # People
├── calendar.json      # Events
├── todos.json         # Tasks
├── projects.json      # Projects
├── finance.json       # Money
├── car.json           # Vehicles
├── house.json         # Property
├── maintenance.json   # Scheduled tasks
├── shopping.json      # Wishlist
├── planning.json      # Event planning
├── meals.json         # Nutrition
├── pets.json          # Pets
└── learning-queue.json # Skill tree data (source of truth)

for-you.md
├── Curated recommendations
├── Knowledge constellation
├── Perspective gaps
└── Engagement tracking
```

### Tier 4: Prospective Memory (Per Learning)

```
future-selves.md
├── Possible futures
├── Learning paths
├── Timeline tracking
└── Triggers skill tree creation

skill-trees.md
├── Browsable view of learning-queue.json
├── Visual progress tracking
├── Activation phrases
└── Verification protocol
```

### Tier 5: Pattern Memory (Per Session)

```
brainid.md
├── Cognitive signature
├── Network baseline
├── Signature patterns
├── Drift/consolidation tracking
└── Session log

memory-system.md
├── Consolidation tracking
├── File access patterns
├── Dreams (abstract pattern summaries)
└── Sleep cycle implementation
```

### Tier 6: Procedural Memory (Reference)

```
SYSTEM-RULES.md       # How the AI operates
memory-architecture.md # Theory documentation
consolidation-protocol.md # Cleanup procedures
ARCHITECTURE.md       # This file
```

### Tier 7: Archive (Long-term Storage)

```
archive/
├── sessions/          # Historical session logs
└── [dated folders]/   # Old files no longer active
```

### Entry Points

```
.cursor/rules/POLARITY.md  # AI auto-reads this
README.md                  # Human entry point
QUICKSTART.md             # Onboarding guide
index.md                   # Dashboard
```

---

## Data Flow

### Every Message

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER MESSAGE                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Classification (ALWAYS)                                │
│  yeo-network-live-tracking.md                                   │
│  → Assign network scores                                        │
│  → Infer cognitive state                                        │
│  → This informs ALL subsequent processing                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Content Analysis                                       │
│                                                                  │
│  Check for:                                                      │
│  ├── New insight? → polarity-mind-observations.md               │
│  ├── New future self? → future-selves.md                        │
│  ├── Learning content? → learning-queue.json                    │
│  ├── New data? → data/*.json                                    │
│  └── Recommendation engagement? → digests/*.md                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Cascade Updates                                        │
│                                                                  │
│  If insight logged → check for new future self                  │
│  If future self added → create skill tree                       │
│  If skill tree updated → regenerate skill-trees.md              │
│  If contact added → check skill tree connections                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  RESPONSE TO USER                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Session End

```
SESSION END TRIGGER
        │
        ▼
┌───────────────────────────────────────┐
│  1. Archive session data               │
│     yeo-tracking → archive/sessions/   │
├───────────────────────────────────────┤
│  2. Update brainid.md                  │
│     Add session patterns               │
│     Update network baseline            │
│     Log drift/consolidation            │
├───────────────────────────────────────┤
│  3. Generate dream                     │
│     Abstract pattern summary           │
│     Add to memory-system.md            │
├───────────────────────────────────────┤
│  4. Update memory-system.md            │
│     File access counts                 │
│     Consolidation state                │
└───────────────────────────────────────┘
```

---

## The Yeo 7-Network Model

Polarity uses the Yeo 7-Network parcellation from neuroscience — seven large-scale functional networks that organize human brain activity.

| Network | Abbreviation | Function | Conversation Indicators |
|---------|--------------|----------|------------------------|
| Visual | VIS | Perceptual processing | "I can see...", imagery |
| Somatomotor | SMN | Body awareness | "I'm going to...", physical |
| Dorsal Attention | DA | Goal-directed focus | "I need to...", task focus |
| Ventral Attention | VA | Salience detection | "Wait...", "interesting" |
| Limbic | LIM | Emotion/motivation | "I feel...", affect words |
| Frontoparietal | FP | Planning/strategy | "Let me think...", planning |
| Default Mode | DMN | Self-reflection | "I...", "this reminds me" |

### Classification Protocol

For each message:
1. Identify linguistic markers for each network
2. Assign scores (should sum to ~1.0)
3. Determine dominant network(s)
4. Infer cognitive state
5. Log to yeo-network-live-tracking.md

### BrainID Construction

Over sessions:
1. Calculate average network activation (baseline)
2. Identify recurring patterns (signature patterns)
3. Track drift (changes over time)
4. Track consolidation (stable patterns)

---

## Learning System Architecture

### Data Store

`data/learning-queue.json` — Source of truth

```json
{
  "skillTrees": [
    {
      "id": "tree-xxx",
      "futureSelves": ["Future Self Name"],
      "domain": "Domain Name",
      "skillTree": {
        "level1": {
          "name": "Level Name",
          "nodes": [
            {
              "skill": "Skill name",
              "status": "unknown|curious|understood|strong",
              "verified": true|false,
              "verificationMethod": "teach-back|application|connection",
              "activationPhrase": "Question to ask"
            }
          ]
        }
      }
    }
  ]
}
```

### View Layer

`skill-trees.md` — Human-readable view generated from JSON

### Verification Protocol

| Transition | Requirement | Method |
|------------|-------------|--------|
| Unknown → Curious | Express interest | Automatic |
| Curious → Understood | Explain back correctly | Teach-back |
| Understood → Strong | Apply or connect | Application test |

### Decay Protocol

Understanding can degrade. Nodes can move backward if:
- User can't explain anymore
- User fails application
- 30+ days since verification

---

## Memory System Design

### Consolidation Model

Based on neuroscience and Buddhist epistemology:
- Memory is reconstruction, not storage
- Patterns consolidate through repetition, emotion, connection, novelty, relevance
- "Dreams" are abstract pattern summaries

### Sleep Implementation

```
POLARITY "SLEEP" (Session End)
├── Replay: Review session messages
├── Extract: Identify key patterns
├── Strengthen: Update access counts
├── Integrate: Add cross-references
├── Prune: Flag low-access items
└── Dream: Generate pattern summary
```

### Dream Format

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
└── [Flagged items]

SIGNATURE UPDATE:
└── [Changes to BrainID]
```

---

## Extension Points

### Adding New Data Types

1. Create `data/[type].json` with structure
2. Add to index.md dashboard
3. Add cascade rules to SYSTEM-RULES.md

### Adding New Network Indicators

Update the classification protocol in:
- `.cursor/rules/POLARITY.md`
- `yeo-network-live-tracking.md`

### Custom Future Selves

Users define through conversation:
1. Express goal/interest
2. System creates timeline in future-selves.md
3. System creates skill tree in learning-queue.json
4. Regenerate skill-trees.md

---

## Security & Privacy

- All data stays local in files
- No external API calls (except AI tool's normal operation)
- Git sync is optional (user controls)
- User owns all data

---

## Compatibility

### Supported AI Tools

Any tool that can:
1. Read project files
2. Write/edit files
3. Follow system prompts from `.cursor/rules/`

Tested with:
- Cursor
- VS Code + AI extensions
- Claude Code

### File Format

All files are:
- Markdown (.md) for human readability
- JSON for structured data
- No binary files required

---

*Polarity — Cognitive modeling through conversation.*
