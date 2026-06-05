import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
  }
  return btoa(chunks.join(''));
}

function buildWav(samples: Float32Array, sampleRate = 44100): ArrayBuffer {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, buffer.byteLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 32768 : s * 32767, true);
  }
  return buffer;
}

async function wavToFileUri(wav: ArrayBuffer, filename: string): Promise<string> {
  const uri = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(uri, arrayBufferToBase64(wav), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return uri;
}

// ── raw sample helpers ──────────────────────────────────────────────────────

function clickSamples(sampleRate = 44100): Float32Array {
  const n = Math.floor(sampleRate * 0.04);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    s[i] = 0.9 * Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 80);
  }
  return s;
}

function accentSamples(sampleRate = 44100): Float32Array {
  const n = Math.floor(sampleRate * 0.05);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    s[i] = 1.0 * Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t * 60);
  }
  return s;
}

// ── click track ─────────────────────────────────────────────────────────────

export function generateClickTrack(
  bpm: number,
  timeSig: { num: number; den: 4 | 8 },
  measures = 2,
  sampleRate = 44100,
): ArrayBuffer {
  const intervalMs = timeSig.den === 8 ? 30000 / bpm : 60000 / bpm;
  const intervalSamples = Math.round((intervalMs / 1000) * sampleRate);
  const totalBeats = measures * timeSig.num;
  const totalSamples = intervalSamples * totalBeats;

  const track = new Float32Array(totalSamples);
  const normal = clickSamples(sampleRate);
  const accent = accentSamples(sampleRate);

  for (let b = 0; b < totalBeats; b++) {
    const start = b * intervalSamples;
    const src = b % timeSig.num === 0 ? accent : normal;
    for (let i = 0; i < src.length && start + i < totalSamples; i++) {
      track[start + i] += src[i];
    }
  }

  return buildWav(track, sampleRate);
}

const trackCache = new Map<string, string>();
const trackCacheKeys: string[] = [];
const MAX_TRACK_CACHE = 8;

export async function getClickTrackUri(
  bpm: number,
  timeSig: { num: number; den: 4 | 8 },
): Promise<string> {
  const key = `${bpm}_${timeSig.num}_${timeSig.den}`;
  if (trackCache.has(key)) return trackCache.get(key)!;

  const wav = generateClickTrack(bpm, timeSig);
  const uri = await wavToFileUri(wav, `track_${key}.wav`);

  trackCache.set(key, uri);
  trackCacheKeys.push(key);
  if (trackCacheKeys.length > MAX_TRACK_CACHE) {
    trackCache.delete(trackCacheKeys.shift()!);
  }

  return uri;
}

// ── tones ────────────────────────────────────────────────────────────────────

export function generateTone(frequency: number, duration = 4, sampleRate = 44100): ArrayBuffer {
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  const fadeSamples = Math.floor(0.02 * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let amp = 0.7 * Math.sin(2 * Math.PI * frequency * t);
    if (i < fadeSamples) amp *= i / fadeSamples;
    if (i > numSamples - fadeSamples) amp *= (numSamples - i) / fadeSamples;
    samples[i] = amp;
  }
  return buildWav(samples, sampleRate);
}

const noteUriCache: Record<string, string> = {};

export async function getNoteUri(frequency: number, key: string): Promise<string> {
  if (!noteUriCache[key])
    noteUriCache[key] = await wavToFileUri(generateTone(frequency), `note_${key}.wav`);
  return noteUriCache[key];
}

export async function playSound(uri: string): Promise<void> {
  const player = createAudioPlayer({ uri });
  player.play();
  const check = setInterval(() => {
    if (!player.playing) { clearInterval(check); player.remove(); }
  }, 100);
}

export async function initAudio() {
  await setAudioModeAsync({ playsInSilentMode: true });
}
