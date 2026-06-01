import { Audio } from 'expo-av';
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
  view.setUint16(20, 1, true);   // PCM
  view.setUint16(22, 1, true);   // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);   // block align
  view.setUint16(34, 16, true);  // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 32768 : s * 32767, true);
  }
  return buffer;
}

export function generateTone(frequency: number, duration = 1.5, sampleRate = 44100): ArrayBuffer {
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  const fadeMs = 20;
  const fadeSamples = Math.floor((fadeMs / 1000) * sampleRate);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let amp = 0.7 * Math.sin(2 * Math.PI * frequency * t);
    // fade in/out to avoid clicks
    if (i < fadeSamples) amp *= i / fadeSamples;
    if (i > numSamples - fadeSamples) amp *= (numSamples - i) / fadeSamples;
    samples[i] = amp;
  }
  return buildWav(samples, sampleRate);
}

export function generateClick(sampleRate = 44100): ArrayBuffer {
  const duration = 0.04;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const decay = Math.exp(-t * 80);
    samples[i] = 0.9 * Math.sin(2 * Math.PI * 1200 * t) * decay;
  }
  return buildWav(samples, sampleRate);
}

async function wavToFileUri(wav: ArrayBuffer, filename: string): Promise<string> {
  const uri = FileSystem.cacheDirectory + filename;
  const base64 = arrayBufferToBase64(wav);
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return uri;
}

let clickUri: string | null = null;
const noteUriCache: Record<string, string> = {};

export async function getClickUri(): Promise<string> {
  if (!clickUri) {
    const wav = generateClick();
    clickUri = await wavToFileUri(wav, 'metronome_click.wav');
  }
  return clickUri;
}

export async function getNoteUri(frequency: number, key: string): Promise<string> {
  if (!noteUriCache[key]) {
    const wav = generateTone(frequency);
    noteUriCache[key] = await wavToFileUri(wav, `note_${key}.wav`);
  }
  return noteUriCache[key];
}

export async function playSound(uri: string): Promise<Audio.Sound> {
  const { sound } = await Audio.Sound.createAsync({ uri });
  await sound.playAsync();
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync();
    }
  });
  return sound;
}
