# Building a Voice-Controlled Metronome + Tuner iOS App with AI

## The Idea

I wanted a simple iPhone app for musicians: a metronome and a reference tone player (for tuning by ear), controlled by voice. Instead of tapping buttons, you just say things like:

- "Set BPM to 80"
- "Give me a C"
- "Speed up a bit"
- "Play A flat 3"

The AI layer interprets natural language and converts it to app actions — so "slow it down to like 60" works just as well as "set BPM to 60".

---

## Architecture

```
Voice input (text for now, mic coming soon)
    ↓
Claude API (Haiku) — parses natural language → structured JSON action
    ↓
App state (BPM, note, octave)
    ↓
Audio engine (expo-av + programmatic WAV generation)
    ↓
Sound output on device
```

The key insight: use Apple's on-device speech-to-text for transcription (fast, free, private), and Claude only for the NLP parsing step. Each voice command costs a fraction of a cent.

### Why Claude for command parsing?

Simple regex can't handle:
- "A bit faster" (relative, no number)
- "Give me A flat" (enharmonic — maps to G#)
- "Start" vs "Stop" vs "Play" (ambiguous intent)
- "Something around 90" (approximate)

Claude Haiku handles all of these and costs ~$0.0001 per command.

### Audio without samples

Rather than bundling audio files for every note, tones are generated programmatically in JavaScript:

1. Build a PCM buffer (sine wave at the target frequency, with fade in/out to avoid clicks)
2. Wrap it in a WAV header
3. Write to device cache as a `.wav` file via `expo-file-system`
4. Play with `expo-av`

This keeps the app bundle tiny and works for any note/octave combination.

### Note frequencies

All 12 notes × 7 octaves are derived from one formula:

```
frequency = 440 × 2^((midi - 69) / 12)
```

Where A4 = MIDI note 69 = 440 Hz.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React Native (Expo) | JavaScript, iOS + Android, fast iteration |
| Audio | expo-av + custom WAV gen | No sample files needed |
| AI | Claude Haiku via fetch | Cheapest model, perfect for short parsing tasks |
| Speech | expo-speech-recognition (dev build) / text input (Expo Go) | Graceful fallback |
| Navigation | Simple state-based tabs | No expo-router needed for 2 screens |

---

## Pain Points & Lessons Learned

### 1. Expo Go is locked to a specific SDK version

**Pain:** Created the project with `create-expo-app` which scaffolded Expo SDK 56. Expo Go on the App Store only supported SDK 54. Got "project is incompatible" immediately after scanning.

**Lesson:** Expo Go supports exactly 1–2 SDK versions at a time. It updates on the App Store schedule, not yours. The error message says "download the latest version" — but you *have* the latest version. It means *your project* is on the wrong version.

**Fix:** Check what SDK Expo Go supports before creating your project, or pin to a known-supported version. Better long-term solution: use EAS Dev Build which removes this constraint entirely.

### 2. React Native version mismatch causes cryptic TurboModule errors

**Pain:** After downgrading to SDK 54, the app loaded but immediately crashed with:
```
TurboModuleRegistry... PlatformConstants could not be found.
Verify that a module by this name is registered in native binary.
```

**Cause:** The `react-native` version in `package.json` was `0.76.9`, but SDK 54 bundles React Native `0.81.5`. The JS bundle and native binary were out of sync.

**How to find the right version:**
```bash
cat node_modules/expo/bundledNativeModules.json | grep react-native
```

**Lesson:** When changing Expo SDK versions, always let `npx expo install --fix` determine the correct peer dependency versions. Don't manually pin `react-native`.

### 3. expo-file-system changed its API between SDK versions

**Pain:** In SDK 56, `expo-file-system` moved to a new class-based API (`File`, `Directory`, `Paths`). The old `FileSystem.cacheDirectory` and `FileSystem.writeAsStringAsync` were moved to `expo-file-system/legacy`. In SDK 54, the classic API is still the default.

**Lesson:** Read the changelog when upgrading SDK versions. The `/legacy` import path was the hint — SDK 56 deprecated the flat API.

### 4. npm install fails on /mnt/c/ (WSL2 + Windows filesystem)

**Pain:** Running `npm install` from WSL2 on a project stored in Dropbox (`/mnt/c/Users/.../Dropbox/...`) caused cascading permission errors:
```
ENOTEMPTY: directory not empty, rename '...node_modules/...'
EACCES: permission denied, rmdir '...'
```

**Cause:** WSL2 accesses the Windows NTFS filesystem via a translation layer. npm's atomic rename operations (used during installs) don't work reliably because Windows holds file locks.

**Fix:** Move the project to the Linux filesystem:
```bash
rsync -av --exclude='node_modules' /mnt/c/.../music-app/ ~/music-app/
cd ~/music-app && npm install
```

**Lesson:** Never put an active Node.js project in `/mnt/c/` if you're developing from WSL2. Keep code on the Linux filesystem (`~/`) and use git (not Dropbox) for backup/sync.

### 5. Expo SDK 50+ requires explicit splash screen dismissal

**Pain:** After all version issues were resolved, the app loaded the JS bundle but showed nothing — just the splash screen forever.

**Cause:** Since Expo SDK 50, `expo-splash-screen` automatically calls `preventAutoHideAsync()` at startup. The splash screen waits for you to explicitly call `hideAsync()`. Without it, the app renders behind the splash screen indefinitely.

**Fix:**
```typescript
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  // ...
}
```

**Lesson:** This is now standard boilerplate for any Expo app on SDK 50+. Always include it.

---

## Cost Breakdown

| Item | Cost |
|---|---|
| Claude Haiku (command parsing) | ~$0.0001 per command |
| 100 commands/day personal use | ~$0.01/day ≈ $0.30/month |
| Expo Go testing | Free |
| EAS Build (dev build) | Free tier available |
| Apple Developer Account (App Store publish) | $99/year |
| Backend/server | $0 (everything runs on-device) |

---

## What's Next

- [ ] Add actual voice input (requires EAS dev build with `expo-speech-recognition`)
- [ ] Chromatic tuner (listen via mic, detect pitch in real-time using FFT)
- [ ] Time signatures and accent patterns for the metronome
- [ ] Haptic feedback on each beat

---

## Running It Yourself

```bash
git clone <repo>
cd music-app
npm install --legacy-peer-deps
cp .env.example .env
# Add your Anthropic API key to .env
npx expo start --tunnel
```

Scan the QR code with Expo Go (SDK 54 required).

---

## Session 1 — Scaffolding, version hell, and getting it on the phone
**Date:** 2026-05-31

### What we built / changed
- Designed full architecture: metronome + reference tone player + Claude API voice command parser
- Scaffolded Expo project with TypeScript
- Built audio engine: programmatic sine wave WAV generation (no audio samples needed)
- Built metronome scheduler: lookahead interval-based beat scheduling
- Built Claude Haiku command parser: speech text → structured JSON action
- Built UI: dark-themed metronome screen + note player screen + shared command input
- Added tab navigation (no expo-router, simple state-based)
- Moved project from /mnt/c/ to ~/music-app to fix npm permission issues

### Pain points & fixes
- Expo Go SDK mismatch: scaffolded SDK 56, Expo Go wanted 54 → downgraded
- RN version mismatch: had 0.76.9, SDK 54 needs 0.81.5 → found via `bundledNativeModules.json`
- expo-file-system API: SDK 56 uses new class-based API, SDK 54 uses classic `cacheDirectory` / `writeAsStringAsync`
- WSL2 + Windows filesystem: npm install on /mnt/c/ fails with ENOTEMPTY/EACCES → moved to ~/music-app
- Splash screen stuck: SDK 50+ requires explicit `SplashScreen.hideAsync()` in root component

### What's next
- Verify app fully renders and audio works on device
- Add voice input (requires EAS dev build with expo-speech-recognition)
- Add chromatic tuner (mic input → pitch detection via FFT)
