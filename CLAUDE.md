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
- Expo SDK 56, React Native 0.85.3
- expo-audio (NOT expo-av — removed in SDK 56) for all audio playback
- expo-file-system/legacy (classic API — the new class-based API is in the main import)
- expo-speech-recognition for voice input (requires dev build, not Expo Go)
- expo-dev-client installed; build via EAS
- Claude Haiku via direct fetch for voice command parsing
- App name: "Metronome AI" (slug stays "music-app" to match existing EAS dev build)
- npm install must be run from ~/music-app (Linux fs), not /mnt/c/

## Metronome architecture (as of Session 2)
- Audio timing: pre-rendered WAV click track (`generateClickTrack`) played with `loop: true`
  - Clicks baked at exact sample offsets — no JS timer jitter
  - Beat position derived by polling `player.currentTime` every 16ms
  - Track cached by BPM + time sig key (up to 8 entries)
  - BPM/timeSig changes: 150ms debounce → regenerate track
  - Async race condition guard: `startGenRef` generation counter prevents stale async calls creating duplicate players
- Time signatures: 1/4–6/4 and 1/8–6/8, accent click on beat 1
- Voice flow: mic → speech ends → auto-submit (no Go button) → Claude → action → auto-starts metronome
- Stop fix: `toggle()` stop path increments `startGenRef.current` to cancel any in-flight `startPlayer` async call; `stopPlayer` calls `pause()` then `remove()`

## API key
- Anthropic key is NOT in the app — lives in Cloudflare Worker secret only
- Worker URL: https://yellow-king-5c2b.skandavivek.workers.dev
- `parseCommand()` takes no apiKey param; `useCommandParser` has no API_KEY constant
- Set a monthly spend limit on console.anthropic.com as backup

## GitHub push checklist
**Before every `git push`, verify:**
1. No API keys or secrets in any staged file (`git diff --cached | grep -i key`)
2. `.env` is gitignored and NOT in `git status` tracked files
3. No tokens embedded in git remote URL (`git remote -v` — should not contain `ghp_` or similar)
4. `claude-traces/` entries are scrubbed of any keys accidentally read aloud during sessions
