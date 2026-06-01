@AGENTS.md

# Project: Voice-Controlled Metronome + Tuner

Active path: `~/music-app` (NOT /mnt/c/ — see memory for why)

## Blog post
`BLOG.md` is a running developer blog documenting this project's build journey.
**At the end of every session where something meaningful happened, append a new entry to BLOG.md.**

Each entry should follow this format:
```
## Session [N] — [short title]
**Date:** YYYY-MM-DD

### What we built / changed
- bullet points

### Pain points & fixes
- issue → fix (if any)

### What's next
- bullet
```

The blog is cumulative — never rewrite old entries, only append new ones.

## Session traces
`claude-traces/` contains full transcripts of each Claude session.
**When the user says "wrap up", "end the session", "save the trace", or similar — write the conversation to `claude-traces/session-N.md`** (increment N from the last file in that folder).

Each trace file should capture: user messages, assistant responses, key decisions, commands run, and errors hit. Write it as a readable Q&A — not raw JSON. Future sessions can read these to understand the full history of decisions made.

Claude cannot detect session end automatically — this must be user-triggered.

## Current state
- Expo SDK 54, React Native 0.81.5
- expo-av for audio (programmatic WAV tone generation)
- expo-file-system (classic API, not the new class-based one from SDK 56+)
- Claude Haiku via direct fetch for voice command parsing
- expo-splash-screen must call hideAsync() in App useEffect
- npm install must be run from ~/music-app (Linux fs), not /mnt/c/
