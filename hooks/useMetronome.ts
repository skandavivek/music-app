import { useRef, useState, useCallback, useEffect } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { getClickUri } from '../lib/audioUtils';

export function useMetronome() {
  const [bpm, setBpmState] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextBeatRef = useRef(0);
  const bpmRef = useRef(bpm);
  const clickUriRef = useRef<string | null>(null);
  const tapTimesRef = useRef<number[]>([]);
  const scheduledBeatsRef = useRef<Set<number>>(new Set());

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
    getClickUri().then(uri => { clickUriRef.current = uri; });
  }, []);

  const playClick = useCallback(() => {
    if (!clickUriRef.current) return;
    try {
      const player = createAudioPlayer({ uri: clickUriRef.current });
      player.play();
      const check = setInterval(() => {
        if (!player.playing) { clearInterval(check); player.remove(); }
      }, 50);
    } catch {}
  }, []);

  const scheduleBeats = useCallback(() => {
    const now = Date.now();
    const lookahead = 100;
    while (nextBeatRef.current < now + lookahead) {
      const beatTime = Math.round(nextBeatRef.current);
      if (!scheduledBeatsRef.current.has(beatTime)) {
        scheduledBeatsRef.current.add(beatTime);
        const delay = Math.max(0, beatTime - now);
        setTimeout(() => {
          playClick();
          setBeat(b => b + 1);
          // prune old entries so the set doesn't grow forever
          const cutoff = Date.now() - 2000;
          scheduledBeatsRef.current.forEach(t => { if (t < cutoff) scheduledBeatsRef.current.delete(t); });
        }, delay);
      }
      nextBeatRef.current += (60 / bpmRef.current) * 1000;
    }
  }, [playClick]);

  const start = useCallback(() => {
    nextBeatRef.current = Date.now();
    intervalRef.current = setInterval(scheduleBeats, 25);
    setIsPlaying(true);
  }, [scheduleBeats]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    scheduledBeatsRef.current.clear();
    setIsPlaying(false);
    setBeat(0);
  }, []);

  const toggle = useCallback(() => {
    if (intervalRef.current) stop();
    else start();
  }, [start, stop]);

  const setBpm = useCallback((value: number) => {
    setBpmState(Math.max(20, Math.min(300, Math.round(value))));
  }, []);

  const adjustBpm = useCallback((delta: number) => {
    setBpmState(prev => Math.max(20, Math.min(300, Math.round(prev + delta))));
  }, []);

  const tapTempo = useCallback(() => {
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current.filter(t => now - t < 3000), now];
    const taps = tapTimesRef.current;
    if (taps.length >= 2) {
      const intervals = taps.slice(1).map((t, i) => t - taps[i]);
      const avg = intervals.reduce((a, b) => a + b) / intervals.length;
      setBpm(Math.round(60000 / avg));
    }
  }, [setBpm]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return { bpm, setBpm, adjustBpm, isPlaying, toggle, beat, tapTempo };
}
