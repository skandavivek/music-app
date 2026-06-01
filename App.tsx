import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { MetronomeScreen } from './components/MetronomeScreen';
import { NotePlayerScreen } from './components/NotePlayerScreen';
import { colors, spacing } from './constants/theme';

SplashScreen.preventAutoHideAsync();

type Tab = 'metronome' | 'notes';

export default function App() {
  const [tab, setTab] = useState<Tab>('metronome');

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {tab === 'metronome' ? <MetronomeScreen /> : <NotePlayerScreen />}
      </View>
      <View style={styles.tabBar}>
        <TabItem label="Metronome" icon="♩" active={tab === 'metronome'} onPress={() => setTab('metronome')} />
        <TabItem label="Tuner" icon="♪" active={tab === 'notes'} onPress={() => setTab('notes')} />
      </View>
    </SafeAreaView>
  );
}

function TabItem({ label, icon, active, onPress }: {
  label: string; icon: string; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress}>
      <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingBottom: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  tabIcon: { fontSize: 20, color: colors.textSecondary, marginBottom: 2 },
  tabIconActive: { color: colors.accentLight },
  tabLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  tabLabelActive: { color: colors.accentLight },
});
