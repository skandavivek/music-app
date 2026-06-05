import React, { useState, useEffect, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = () => {};
try {
  const mod = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch {}
import { colors, spacing } from '../constants/theme';

interface Props {
  onSubmit: (text: string) => void;
  loading: boolean;
  error: string;
  placeholder?: string;
}

export function CommandInput({ onSubmit, loading, error, placeholder }: Props) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];
  const transcriptRef = useRef('');

  useEffect(() => {
    try {
      setSpeechAvailable(ExpoSpeechRecognitionModule?.isRecognitionAvailable() ?? false);
    } catch {
      setSpeechAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (listening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [listening]);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    // fallback: if isFinal never fired, submit whatever we heard
    const t = transcriptRef.current;
    if (t) {
      transcriptRef.current = '';
      setTranscript('');
      onSubmit(t);
    }
  });
  useSpeechRecognitionEvent('result', (event: any) => {
    const t = event.results[0]?.transcript ?? '';
    setTranscript(t);
    transcriptRef.current = t;
    if (event.isFinal && t) {
      transcriptRef.current = '';
      setTranscript('');
      onSubmit(t);
    }
  });
  useSpeechRecognitionEvent('error', () => setListening(false));

  const startListening = async () => {
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) return;
    setTranscript('');
    ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true, continuous: false });
  };

  const stopListening = () => ExpoSpeechRecognitionModule.stop();

  const handleSubmitText = () => {
    if (!text.trim() || loading) return;
    onSubmit(text.trim());
    setText('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {transcript ? <Text style={styles.transcript}>"{transcript}"</Text> : null}

        <View style={styles.row}>
          {speechAvailable && (
            <TouchableOpacity
              onPress={listening ? stopListening : startListening}
              disabled={loading}
            >
              <Animated.View style={[
                styles.micBtn,
                listening && styles.micBtnActive,
                { transform: [{ scale: pulseAnim }] },
              ]}>
                {loading
                  ? <ActivityIndicator size="small" color={colors.text} />
                  : <Text style={styles.micIcon}>{listening ? '⏹' : '🎤'}</Text>
                }
              </Animated.View>
            </TouchableOpacity>
          )}

          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={placeholder ?? 'Or type a command...'}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="send"
            onSubmitEditing={handleSubmitText}
            editable={!loading && !listening}
          />
        </View>

        {!speechAvailable && (
          <Text style={styles.hint}>Voice input requires a dev build · Type commands above</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  micIcon: { fontSize: 20 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing.sm },
  transcript: { color: colors.accentLight, fontSize: 13, marginTop: spacing.sm, fontStyle: 'italic' },
  hint: { color: colors.textSecondary, fontSize: 11, marginTop: spacing.xs },
});
