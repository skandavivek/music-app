import { useRef, useState, useCallback, useEffect } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { getClickTrackUri } from '../lib/audioUtils';

export type TimeSig = { num: number; den: 4 | 8 };

const TRACK_MEASURES = 2;
const POLL_MS = 16;

export function useMetronome() {
  const [bpm, setBpmState] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [timeSig, setTimeSigState] = useState<TimeSig>({ num: 4, den: 4 });
  const [beatInMeasure, setBeatInMeasure] = useState(0);

  const playerRef = useRef<any>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const regenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);
  const bpmRef = useRef(120);
  const timeSigRef = useRef<TimeSig>({ num: 4, den: 4 });
  const lastBeatIdxRef = useRef(-1);
  const startGenRef = useRef(0);

  const stopPlayer = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (regenTimerRef.current) { clearTimeout(regenTimerRef.current); regenTimerRef.current = null; }
    if (playerRef.current) {
      try { playerRef.current.pause(); } catch {}
      try { playerRef.current.remove(); } catch {}
      playerRef.current = null;
    }
  }, []);

  const startPlayer = useCallback(async (bpmVal: number, ts: TimeSig) => {
    stopPlayer();
    const gen = ++startGenRef.current;
    lastBeatIdxRef.current = -1;

    await setAudioModeAsync({ playsInSilentMode: true });
    const uri = await getClickTrackUri(bpmVal, ts);

    if (gen !== startGenRef.current) return; // superseded by a newer call

    const player = createAudioPlayer({ uri }, { updateInterval: POLL_MS });
    player.loop = true;
    player.play();
    playerRef.current = player;

    const beatSec = (ts.den === 8 ? 30 : 60) / bpmVal;
    const totalBeats = TRACK_MEASURES * ts.num;

    pollRef.current = setInterval(() => {
      const ct: number = playerRef.current?.currentTime ?? 0;
      const idx = Math.floor(ct / beatSec) % totalBeats;
      if (idx !== lastBeatIdxRef.current) {
        lastBeatIdxRef.current = idx;
        setBeat(b => b + 1);
        setBeatInMeasure(idx % ts.num);
      }
    }, POLL_MS);

    setIsPlaying(true);
    isPlayingRef.current = true;
  }, [stopPlayer]);

  // debounced restart used when BPM or timeSig changes while playing
  const scheduleRestart = useCallback(() => {
    if (!isPlayingRef.current) return;
    if (regenTimerRef.current) clearTimeout(regenTimerRef.current);
    regenTimerRef.current = setTimeout(() => {
      startPlayer(bpmRef.current, timeSigRef.current);
    }, 150);
  }, [startPlayer]);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      startGenRef.current++;   // cancel any in-flight startPlayer
      isPlayingRef.current = false;
      stopPlayer();
      setIsPlaying(false);
      setBeat(0);
      setBeatInMeasure(0);
    } else {
      startPlayer(bpmRef.current, timeSigRef.current);
    }
  }, [startPlayer, stopPlayer]);

  const setBpm = useCallback((value: number) => {
    const v = Math.max(20, Math.min(300, Math.round(value)));
    bpmRef.current = v;
    setBpmState(v);
    scheduleRestart();
  }, [scheduleRestart]);

  const adjustBpm = useCallback((delta: number) => {
    setBpmState(prev => {
      const v = Math.max(20, Math.min(300, Math.round(prev + delta)));
      bpmRef.current = v;
      return v;
    });
    scheduleRestart();
  }, [scheduleRestart]);

  const setTimeSig = useCallback((ts: TimeSig) => {
    timeSigRef.current = ts;
    setTimeSigState(ts);
    setBeatInMeasure(0);
    scheduleRestart();
  }, [scheduleRestart]);

  useEffect(() => () => stopPlayer(), []);

  return { bpm, setBpm, adjustBpm, isPlaying, toggle, beat, timeSig, setTimeSig, beatInMeasure };
}
