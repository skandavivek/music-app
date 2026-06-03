# MusicApp — Voice-Controlled Metronome + Tuner

A minimal iOS app for musicians. Control a metronome and reference tone player entirely by voice using AI.

**"Set BPM to 80"** · **"Give me a C"** · **"Speed up a bit"** · **"Play A flat 3"**

---

## How it works

### The voice pipeline

```
You speak
    ↓
Apple Speech Recognition (on-device, free, private)
    ↓  text string
Claude Haiku API (~200ms, ~$0.0001)
    ↓  JSON action
App updates state
    ↓
Audio plays / BPM changes
```

Two steps intentionally separated:

- **Speech → text**: handled by Apple's on-device `SFSpeechRecognizer`. Fast, free, works offline, never leaves your phone.
- **Text → action**: handled by Claude Haiku. Natural language is hard — "slow it down to like 60", "give me A flat", "a bit faster" all need real understanding, not regex.

### Why Claude for a simple command parser?

A regex-based parser would need to handle every phrasing variation explicitly. Claude handles all of these correctly out of the box:

| You say | Claude returns |
|---|---|
| "set bpm to 120" | `{"action":"set_bpm","value":120}` |
| "slow it down to like 60" | `{"action":"set_bpm","value":60}` |
| "speed up a bit" | `{"action":"adjust_bpm","delta":5}` |
| "give me a C" | `{"action":"set_note","note":"C","octave":4}` |
| "play A flat" | `{"action":"set_note","note":"G#","octave":4}` |
| "start" / "stop" / "go" | `{"action":"toggle_play"}` |

Claude never controls the app directly — it only parses intent into a fixed set of typed actions. The app stays in control.

### Metronome engine

Uses a **lookahead scheduler** — a `setInterval` polling at 25ms schedules beats 100ms ahead using `setTimeout`. This prevents the drift you'd get from naive `setInterval` alone, and a `Set` of scheduled beat times prevents double-firing if the scheduler ticks twice within the same lookahead window.

### Tone generation

Notes are generated **programmatically** — no audio samples bundled. Every note frequency is derived from:

```
frequency = 440 × 2^((midi - 69) / 12)
```

A sine wave is computed into a PCM buffer, wrapped with a WAV header, written to the device cache, and played via `expo-av`. This keeps the app bundle tiny and works for any note/octave combination.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | React Native (Expo SDK 54) |
| Audio | expo-av + programmatic WAV generation |
| Voice input | expo-speech-recognition (Apple SFSpeechRecognizer) |
| AI parsing | Claude Haiku via Anthropic API |
| Navigation | State-based tab bar (no expo-router) |

---

## Running locally

### Prerequisites
- Node.js 18+
- Expo Go app on your iPhone (SDK 54)
- Anthropic API key — [get one here](https://console.anthropic.com)

### Setup

```bash
git clone https://github.com/skandavivek/music-app
cd music-app
npm install --legacy-peer-deps
cp .env.example .env
# Add your key to .env:
# EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```

### Run (Expo Go — text commands only, no voice)

```bash
npx expo start --tunnel
```

Scan the QR code with Expo Go. Voice input shows a hint but is disabled — it requires a development build.

### Run (dev build — full voice input)

```bash
eas build --profile development --platform ios
```

Requires an Apple Developer account. EAS builds in the cloud (~10 min) and sends you an install link.

---

## Cost

| Usage | Cost |
|---|---|
| Personal (you only) | ~$0–$1/month |
| 100 daily active users | ~$20–30/month |
| Apple Developer (App Store) | $99/year |
| Backend / server | $0 — all on-device |

Each voice command costs ~$0.0001 (Claude Haiku, ~50 tokens per call).

---

## Project structure

```
App.tsx                     root — tab navigation + splash screen
components/
  MetronomeScreen.tsx       BPM display, start/stop, tap tempo
  NotePlayerScreen.tsx      note/octave picker, play button, freq display
  CommandInput.tsx          mic button + text fallback + transcript display
hooks/
  useMetronome.ts           lookahead scheduler, tap tempo
  useNotePlayer.ts          note selection + WAV playback
  useCommandParser.ts       Claude API call + error handling
lib/
  audioUtils.ts             WAV generation, file cache, expo-av playback
  claude.ts                 Anthropic API fetch + JSON extraction
  notes.ts                  note names, frequency formula
constants/
  theme.ts                  dark theme colors + spacing
```

---

## Roadmap

- [x] Metronome with BPM control and tap tempo
- [x] Reference tone player (all 12 notes × 7 octaves)
- [x] Claude Haiku voice command parser
- [x] Text input fallback for Expo Go testing
- [x] Voice input via Apple Speech Recognition
- [ ] Chromatic tuner (mic → FFT pitch detection → "you're playing F#, 12 cents flat")
- [ ] Time signatures with accented downbeat
- [ ] Haptic feedback on each beat
- [ ] BPM presets
