import { useState, useCallback } from 'react';
import { Audio } from 'expo-av';
import { NOTE_NAMES, NoteName, noteFrequency } from '../lib/notes';
import { getNoteUri } from '../lib/audioUtils';

export function useNotePlayer() {
  const [note, setNoteState] = useState<NoteName>('A');
  const [octave, setOctaveState] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);

  const setNote = useCallback((n: NoteName) => setNoteState(n), []);
  const setOctave = useCallback((o: number) => setOctaveState(Math.max(1, Math.min(7, o))), []);

  const playNote = useCallback(async (n = note, o = octave) => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const freq = noteFrequency(n, o);
      const key = `${n}_${o}`.replace('#', 's');
      const uri = await getNoteUri(freq, key);
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          setIsPlaying(false);
        }
      });
    } catch {
      setIsPlaying(false);
    }
  }, [note, octave, isPlaying]);

  return { note, setNote, octave, setOctave, playNote, isPlaying, NOTE_NAMES };
}
