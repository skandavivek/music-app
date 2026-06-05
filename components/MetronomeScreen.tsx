import React, { useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView,
} from 'react-native';
import { useMetronome, TimeSig } from '../hooks/useMetronome';
import { useCommandParser } from '../hooks/useCommandParser';
import { CommandInput } from './CommandInput';
import { AppAction } from '../lib/claude';
import { colors, spacing } from '../constants/theme';

const TIME_SIGS: TimeSig[] = [
  { num: 1, den: 4 }, { num: 2, den: 4 }, { num: 3, den: 4 },
  { num: 4, den: 4 }, { num: 5, den: 4 }, { num: 6, den: 4 },
  { num: 1, den: 8 }, { num: 2, den: 8 }, { num: 3, den: 8 },
  { num: 4, den: 8 }, { num: 5, den: 8 }, { num: 6, den: 8 },
];

export function MetronomeScreen() {
  const { bpm, setBpm, adjustBpm, isPlaying, toggle, beat, timeSig, setTimeSig, beatInMeasure } = useMetronome();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 80, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    }
  }, [beat]);

  const handleAction = useCallback((action: AppAction) => {
    switch (action.action) {
      case 'set_bpm':
        setBpm(action.value);
        if (!isPlaying) toggle();
        break;
      case 'adjust_bpm':
        adjustBpm(action.delta);
        if (!isPlaying) toggle();
        break;
      case 'set_time_sig':
        setTimeSig({ num: action.num, den: action.den });
        if (!isPlaying) toggle();
        break;
      case 'toggle_play':
        toggle();
        break;
    }
  }, [setBpm, adjustBpm, toggle, setTimeSig, isPlaying]);

  const { submit, loading, error } = useCommandParser(handleAction);

  const beatInterval = timeSig.den === 8
    ? Math.round((30 / bpm) * 100) / 100
    : Math.round((60 / bpm) * 10) / 10;
  const beatUnit = timeSig.den === 8 ? 's / 8th' : 's / beat';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Metronome</Text>

      <View style={styles.center}>
        {/* Pulse indicator */}
        <Animated.View style={[styles.pulse, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.pulseDot, isPlaying && styles.pulseDotActive]} />
        </Animated.View>

        {/* Beat dots */}
        <View style={styles.beatDots}>
          {Array.from({ length: timeSig.num }, (_, i) => (
            <View
              key={i}
              style={[
                styles.beatDot,
                isPlaying && beatInMeasure === i && (i === 0 ? styles.beatAccent : styles.beatActive),
              ]}
            />
          ))}
        </View>

        <Text style={styles.bpmNumber}>{bpm}</Text>
        <Text style={styles.bpmLabel}>BPM  ·  {beatInterval}{beatUnit}</Text>

        {/* Time signature picker */}
        <View style={styles.timeSigSection}>
          <View style={styles.timeSigRow}>
            {TIME_SIGS.filter(ts => ts.den === 4).map(ts => {
              const active = timeSig.num === ts.num && timeSig.den === ts.den;
              return (
                <TouchableOpacity
                  key={`${ts.num}/4`}
                  style={[styles.timeSigChip, active && styles.timeSigChipActive]}
                  onPress={() => setTimeSig(ts)}
                >
                  <Text style={[styles.timeSigText, active && styles.timeSigTextActive]}>
                    {ts.num}/4
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.timeSigRow}>
            {TIME_SIGS.filter(ts => ts.den === 8).map(ts => {
              const active = timeSig.num === ts.num && timeSig.den === ts.den;
              return (
                <TouchableOpacity
                  key={`${ts.num}/8`}
                  style={[styles.timeSigChip, active && styles.timeSigChipActive]}
                  onPress={() => setTimeSig(ts)}
                >
                  <Text style={[styles.timeSigText, active && styles.timeSigTextActive]}>
                    {ts.num}/8
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.bpmControls}>
          <TouchableOpacity style={styles.bpmBtn} onPress={() => adjustBpm(-10)}>
            <Text style={styles.bpmBtnText}>−10</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bpmBtn} onPress={() => adjustBpm(-1)}>
            <Text style={styles.bpmBtnText}>−1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bpmBtn} onPress={() => adjustBpm(1)}>
            <Text style={styles.bpmBtnText}>+1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bpmBtn} onPress={() => adjustBpm(10)}>
            <Text style={styles.bpmBtnText}>+10</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.playBtn, isPlaying && styles.stopBtn]}
          onPress={toggle}
        >
          <Text style={styles.playBtnText}>{isPlaying ? 'Stop' : 'Start'}</Text>
        </TouchableOpacity>

      </View>

      <CommandInput
        onSubmit={submit}
        loading={loading}
        error={error}
        placeholder='e.g. "set bpm to 90" or "three four"'
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  pulse: { marginBottom: spacing.sm },
  pulseDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  pulseDotActive: { backgroundColor: colors.accentLight },
  beatDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
    minHeight: 14,
  },
  beatDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  beatActive: { backgroundColor: colors.accentLight },
  beatAccent: { backgroundColor: colors.accent },
  bpmNumber: {
    color: colors.text,
    fontSize: 96,
    fontWeight: '200',
    letterSpacing: -4,
    lineHeight: 100,
  },
  bpmLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  timeSigSection: {
    gap: 6,
    marginBottom: spacing.lg,
  },
  timeSigRow: {
    flexDirection: 'row',
    gap: 6,
  },
  timeSigChip: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeSigChipActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  timeSigText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  timeSigTextActive: { color: colors.accentLight },
  bpmControls: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  bpmBtn: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bpmBtnText: { color: colors.text, fontSize: 16, fontWeight: '500' },
  playBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl + 16,
    marginBottom: spacing.md,
  },
  stopBtn: { backgroundColor: colors.danger },
  playBtnText: { color: colors.text, fontSize: 18, fontWeight: '700' },
});
