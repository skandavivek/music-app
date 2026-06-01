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

## Current state
- Expo SDK 54, React Native 0.81.5
- expo-av for audio (programmatic WAV tone generation)
- expo-file-system (classic API, not the new class-based one from SDK 56+)
- Claude Haiku via direct fetch for voice command parsing
- expo-splash-screen must call hideAsync() in App useEffect
- npm install must be run from ~/music-app (Linux fs), not /mnt/c/
