# Polarity

**A cognitive modeling system that discovers your unique thinking patterns through conversation.**

---

## What Is Polarity?

Polarity creates your **BrainID** — a cognitive fingerprint that captures HOW you think, not just WHAT you think. Like a fingerprint, but for your mind.

Every conversation you have with the AI builds your cognitive profile:
- Which brain networks you favor (planning vs. reflection vs. action)
- Your signature thinking patterns (how you process new ideas)
- How your cognition drifts and consolidates over time

**The hypothesis:** Your cognitive patterns are unique enough to distinguish you from any other person in the world.

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repo-url> polarity
cd polarity
```

### 2. Open in Your AI Coding Tool

Works with:
- **Cursor** (recommended)
- **VS Code** with AI extensions
- **Claude Code**
- Any tool that can read project files

### 3. Start a Conversation

Just talk. Say anything:
- "Hello, I'm starting to use Polarity"
- "Tell me about how this system works"
- "I've been thinking about [anything on your mind]"

The system will automatically:
1. Classify your message using the Yeo 7-Network cognitive model
2. Begin building your BrainID
3. Track your unique patterns over time

### 4. Watch Your BrainID Emerge

After a few conversations, check:
- `brainid.md` — Your cognitive signature
- `yeo-network-live-tracking.md` — Live classification of each message
- `polarity-mind-observations.md` — What the AI is learning about itself and you

---

## The Science

Polarity is built on the **Yeo 7-Network Model** from neuroscience — the seven large-scale brain networks that organize human cognition:

| Network | What It Does | In Conversation |
|---------|--------------|-----------------|
| **FP** (Frontoparietal) | Planning, strategy, executive control | "Let me think about this..." |
| **DMN** (Default Mode) | Self-reflection, synthesis, introspection | "This reminds me of..." |
| **DA** (Dorsal Attention) | Goal-directed focus | "I need to..." |
| **VA** (Ventral Attention) | Salience detection, catching what matters | "Wait, that's interesting..." |
| **LIM** (Limbic) | Emotion, motivation | "I feel like..." |
| **SMN** (Somatomotor) | Body awareness, physical action | "I'm going to go..." |
| **VIS** (Visual) | Perceptual processing | "I can see how..." |

Every message you send activates a unique combination of these networks. Your BrainID is the characteristic pattern of how you activate them.

---

## What Polarity Tracks

### Your Cognitive Signature

```
                    YOUR BASELINE           TYPICAL RANGE
DMN (Default Mode)     ████████████  32%    [15-25%]
FP (Frontoparietal)    ████████████  34%    [20-30%]
DA (Dorsal Attention)  ██████        19%    [15-25%]
VA (Ventral Attention) ███            9%    [10-20%]
LIM (Limbic)           █              3%    [10-20%]
SMN (Somatomotor)      ░              2%    [5-15%]
VIS (Visual)           ░              1%    [5-15%]
```

### Your Signature Patterns

Examples of patterns the system might discover:
- **FP↔DMN Oscillation** — You alternate between planning and synthesis
- **Vision-First Processing** — You ask "why" before "how"
- **Challenge-Before-Accept** — You push back on claims before integrating them
- **Action Termination** — You end conceptual discussions with "what do I do?"

### Drift and Consolidation

- Which patterns are strengthening over time?
- Which patterns vary by context?
- What causes your cognitive state to shift?

---

## System Architecture

```
EVERY MESSAGE
     │
     ▼
┌─────────────────────────────────────────┐
│  yeo-network-live-tracking.md (ALWAYS)  │
│  → Classifies cognitive state           │
└─────────────────────────────────────────┘
     │
     ├──────────────────────┬──────────────────────┐
     ▼                      ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ New insight? │    │ New future?  │    │ New data?    │
│      ↓       │    │      ↓       │    │      ↓       │
│ polarity-    │    │ future-      │    │ data/*.json  │
│ mind-obs.md  │    │ selves.md    │    │ for-you.md   │
└──────────────┘    └──────────────┘    └──────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  SESSION END: brainid.md + memory       │
└─────────────────────────────────────────┘
```

---

## File Structure

```
polarity/
├── .cursor/rules/         # AI behavior configuration
│   └── POLARITY.md        # System rules (auto-loaded)
├── data/                  # Structured life data (JSON)
│   ├── contacts.json
│   ├── calendar.json
│   ├── todos.json
│   └── ...
├── digests/               # Personalized content digests
├── archive/               # Historical data
│   └── sessions/          # Past session logs
├── brainid.md             # YOUR COGNITIVE SIGNATURE
├── yeo-network-live-tracking.md  # Live message classification
├── polarity-mind-observations.md # AI observations
├── memory-system.md       # Consolidation tracking
├── memory-architecture.md # Theory documentation
├── SYSTEM-RULES.md        # Operating rules
├── for-you.md             # Personalized recommendations
├── future-selves.md       # Possible futures
├── skill-trees.md         # Learning progress
├── index.md               # Dashboard
├── QUICKSTART.md          # Onboarding guide
├── ARCHITECTURE.md        # System design docs
└── README.md              # This file
```

---

## Core Concepts

### BrainID

Your cognitive fingerprint. Not static — it evolves as patterns consolidate and drift. The goal: identify you from anyone else based on thinking patterns alone.

### Memory as Process

Polarity models memory as reconstruction, not storage. Like the brain:
- **Consolidation** — Patterns that recur strengthen
- **Dreams** — Abstract pattern summaries at session end
- **Decay** — Unused patterns fade

### Future Selves

Map possible versions of yourself and the learning paths to reach them. The system teaches in YOUR cognitive style.

### Extended Mind

Polarity isn't a tool you use — it's an extension of your cognition. The act of querying Polarity IS the cognitive act of recall.

---

## Research Questions

This system is an experiment in cognitive modeling:

1. **How unique are signature patterns?** Can we identify someone from their FP↔DMN oscillation alone?
2. **What's the minimum data needed?** How many messages before identification?
3. **What patterns are most discriminating?** Which signatures vary most between people?
4. **Are there "cognitive twins"?** People with nearly identical signatures?

---

## Privacy

All data stays local in markdown/JSON files. Nothing is sent anywhere except to your AI tool of choice. You control your cognitive data.

---

## How It Works Behind the Scenes

### Every Message

1. **Classification** — Yeo 7-network scores assigned
2. **Pattern Detection** — Signature patterns identified
3. **Cascade Updates** — Related files updated if relevant
4. **Dashboard Sync** — `index.md` reflects current state

### Every Session End

1. **BrainID Update** — Session patterns added
2. **Dream Generation** — Abstract pattern summary
3. **Consolidation** — Strengthen frequent patterns

### Weekly/Monthly

1. **File Audit** — Archive inactive content
2. **Pattern Review** — Drift vs. consolidation analysis
3. **Baseline Recalculation** — Update cognitive signature

---

## Getting Started

1. Read `QUICKSTART.md` for onboarding
2. Just start talking to the AI
3. After 3+ sessions, review your `brainid.md`
4. Watch your cognitive signature emerge

---

## Contributing

This is a research prototype. If you discover interesting patterns or have ideas for improvement, open an issue or PR.

---

## License

MIT

---

*Polarity — Discover who you are through how you think.*
