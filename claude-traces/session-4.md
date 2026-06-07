# Session 4 — App Store Submission
**Date:** 2026-06-05

---

## Context at session start

App was functionally complete (Session 3). Goal: submit to App Store. Active codebase at `~/music-app/`.

---

## App naming

**Q:** App Store Connect shows one choice "musicapp" when creating a new app — should I select it?

**A:** Yes — EAS strips hyphens, so "musicapp" = the `music-app` slug from `app.json`. Links the local project to the existing EAS registration.

**Q:** I want to name the app "Metronome AI" — will this work?

**A:** Yes. Changed `app.json` `"name"` field to "Metronome AI". Slug stays "music-app" to preserve EAS dev build connection.

---

## Expo Go vs Dev Client

App uses `expo-av`, `expo-file-system` — standard SDK packages, Expo Go works. Dev Client only needed when adding third-party native modules.

---

## Bundle ID mismatch

`app.json` had drifted to `com.skandavivek.metronomeai` but Apple Developer portal had `com.skandavivek.musicapp` registered from the dev build setup. Reverted `bundleIdentifier` to `com.skandavivek.musicapp`.

**Rule:** bundle ID in `app.json` must match what's registered in Apple Developer portal.

---

## Screenshots

iPhone 15 screenshots are 1179×2556. App Store requires 1284×2778 for the 6.5" slot. Resized using Pillow (LANCZOS). Copied to `C:\Users\skand\Downloads\` for Windows access.

---

## Production build + submit

```bash
cd ~/music-app && eas build --profile production --platform ios
eas submit --platform ios --latest
```

EAS auto-created App Store Connect API Key, linked via `projectId` in `app.json` and `bundleIdentifier`. Build 2 submitted successfully.

---

## Apple rejection: ITMS-90683

**Error:** Missing `NSPhotoLibraryUsageDescription` in Info.plist.

**Cause:** A transitive dependency references the photo library API. Purpose string required even if app doesn't use it.

**Fix:** Added to `infoPlist` in `app.json`:
```json
"NSPhotoLibraryUsageDescription": "This app does not use your photo library."
```

Rebuilt as build 3.

---

## iPad screenshot issue

`supportsTablet: true` required a 13" iPad screenshot (2048×2732). Resized phone screenshot looked stretched. 

**Fix:** Set `supportsTablet: false` in `app.json` — app is not designed for iPad. Rebuilt as build 4.

---

## App Store Connect setup

- **App Store name:** "AI Metronome & Tuner" ("Metronome AI" was already taken)
- **Home screen label:** still "Metronome AI" (from `app.json` `"name"`)
- **SKU:** `metronome-ai-001` (internal only, never shown to users)
- **Category:** Music
- **Price:** Free
- **Age rating:** 4+ (all questions answered No)
- **Content rights:** No third-party content
- **Privacy policy URL:** `https://github.com/skandavivek/music-app/blob/master/PRIVACY.md`
- **Support URL:** `https://github.com/skandavivek/music-app`
- **Keywords:** `metronome,tuner,tempo,bpm,voice,musician,practice,beat,pitch,reference tone`
- **Subtitle:** `Voice-controlled tempo & tuner`
- **App Privacy:** "Data Not Collected" — Cloudflare Worker does not store commands
- **Encryption:** No non-exempt encryption (`ITSAppUsesNonExemptEncryption: false` already set)
- **Sign-in required:** No (app has no login)

---

## App Review notes provided to Apple

- No sign-in required
- Microphone used for voice commands; text transcript (not audio) sent to Cloudflare Worker → Anthropic Claude for parsing
- No data stored or logged
- Standard HTTPS only, exempt from encryption compliance

---

## Final submission

Build 4, version 1.0.0 submitted for Apple Review. Typical review time: 1-3 days.

---

## What's next

- Wait for Apple Review result
- If approved: monitor crashes via Xcode Organizer / EAS dashboard
- Future features: haptic feedback, chromatic tuner, voice polish
