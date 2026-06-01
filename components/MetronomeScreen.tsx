import React, { useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { useMetronome } from '../hooks/useMetronome';
import { useCommandParser } from '../hooks/useCommandParser';
import { CommandInput } from './CommandInput';
import { AppAction } from '../lib/claude';
import { colors, spacing } from '../constants/theme';

export function MetronomeScreen() {
  const { bpm, setBpm, adjustBpm, isPlaying, toggle, beat, tapTempo } = useMetronome();
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
      case 'set_bpm': setBpm(action.value); break;
      case 'adjust_bpm': adjustBpm(action.delta); break;
      case 'toggle_play': toggle(); break;
      case 'tap_tempo': tapTempo(); break;
    }
  }, [setBpm, adjustBpm, toggle, tapTempo]);

  const { submit, loading, error } = useCommandParser(handleAction);

  const bpmInterval = Math.round((60 / bpm) * 10) / 10;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Metronome</Text>

      <View style={styles.center}>
        <Animated.View style={[styles.pulse, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.beatDot, isPlaying && styles.beatDotActive]} />
        </Animated.View>

        <Text style={styles.bpmNumber}>{bpm}</Text>
        <Text style={styles.bpmLabel}>BPM  ·  {bpmInterval}s / beat</Text>

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

        <TouchableOpacity style={styles.tapBtn} onPress={tapTempo}>
          <Text style={styles.tapBtnText}>Tap Tempo</Text>
        </TouchableOpacity>
      </View>

      <CommandInput
        onSubmit={submit}
        loading={loading}
        error={error}
        placeholder='e.g. "set bpm to 90" or "start"'
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
  pulse: { marginBottom: spacing.lg },
  beatDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  beatDotActive: { backgroundColor: colors.accentLight },
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
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
  },
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
  tapBtn: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tapBtnText: { color: colors.textSecondary, fontSize: 15 },
});
