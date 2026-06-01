export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// A4 = 440Hz, MIDI note 69
export function noteFrequency(note: NoteName, octave: number): number {
  const semitone = NOTE_NAMES.indexOf(note);
  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function formatNote(note: NoteName, octave: number): string {
  return `${note}${octave}`;
}

export function formatFrequency(freq: number): string {
  return `${freq.toFixed(1)} Hz`;
}

// Enharmonic display names
export const NOTE_DISPLAY: Record<NoteName, string> = {
  'C': 'C', 'C#': 'C#', 'D': 'D', 'D#': 'D#',
  'E': 'E', 'F': 'F', 'F#': 'F#', 'G': 'G',
  'G#': 'G#', 'A': 'A', 'A#': 'A#', 'B': 'B',
};
