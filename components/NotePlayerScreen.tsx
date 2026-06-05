import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useNotePlayer } from '../hooks/useNotePlayer';
import { useCommandParser } from '../hooks/useCommandParser';
import { CommandInput } from './CommandInput';
import { AppAction } from '../lib/claude';
import { NoteName, noteFrequency, formatFrequency } from '../lib/notes';
import { colors, spacing } from '../constants/theme';

export function NotePlayerScreen() {
  const { note, setNote, octave, setOctave, playNote, isPlaying, NOTE_NAMES } = useNotePlayer();

  const handleAction = useCallback((action: AppAction) => {
    switch (action.action) {
      case 'set_note':
        setNote(action.note as NoteName);
        setOctave(action.octave);
        playNote(action.note as NoteName, action.octave);
        break;
      case 'play_note':
        playNote();
        break;
    }
  }, [setNote, setOctave, playNote]);

  const { submit, loading, error } = useCommandParser(handleAction);

  const freq = noteFrequency(note, octave);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reference Tone</Text>

      <View style={styles.center}>
        <Text style={styles.noteDisplay}>{note}{octave}</Text>
        <Text style={styles.freqDisplay}>{formatFrequency(freq)}</Text>

        <TouchableOpacity
          style={[styles.playBtn, isPlaying && styles.playBtnActive]}
          onPress={() => playNote()}
          disabled={isPlaying}
        >
          {isPlaying
            ? <ActivityIndicator color={colors.text} />
            : <Text style={styles.playBtnText}>Play</Text>
          }
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Note</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.noteRow}
        >
          {NOTE_NAMES.map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.noteChip, n === note && styles.noteChipActive]}
              onPress={() => setNote(n)}
            >
              <Text style={[styles.noteChipText, n === note && styles.noteChipTextActive]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Octave</Text>
        <View style={styles.octaveRow}>
          {[1, 2, 3, 4, 5, 6, 7].map(o => (
            <TouchableOpacity
              key={o}
              style={[styles.octaveChip, o === octave && styles.octaveChipActive]}
              onPress={() => setOctave(o)}
            >
              <Text style={[styles.octaveChipText, o === octave && styles.octaveChipTextActive]}>
                {o}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <CommandInput
        onSubmit={submit}
        loading={loading}
        error={error}
        placeholder='e.g. "give me a C" or "play A flat 3"'
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
    paddingBottom: spacing.lg,
  },
  noteDisplay: {
    color: colors.text,
    fontSize: 88,
    fontWeight: '200',
    letterSpacing: -2,
    lineHeight: 92,
  },
  freqDisplay: {
    color: colors.accentLight,
    fontSize: 18,
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
  },
  playBtn: {
    backgroundColor: colors.accent,
    borderRadius: 50,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  playBtnActive: { backgroundColor: colors.accentDim },
  playBtnText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginLeft: spacing.md,
    marginBottom: spacing.xs,
  },
  noteRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  noteChip: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 44,
    alignItems: 'center',
  },
  noteChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  noteChipText: { color: colors.textSecondary, fontSize: 15, fontWeight: '500' },
  noteChipTextActive: { color: colors.text },
  octaveRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  octaveChip: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  octaveChipActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  octaveChipText: { color: colors.textSecondary, fontSize: 15 },
  octaveChipTextActive: { color: colors.accentLight },
});
