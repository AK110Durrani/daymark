import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Header, IconButton, ModePill, Screen, SectionLabel, TaskRow } from '@/src/components/DaymarkUI';
import { useDaymark } from '@/src/context/DaymarkContext';
import { PlanningMode } from '@/src/types';

export default function TasksScreen() {
  const colors = useColors();
  const { tasks } = useDaymark();
  const [mode, setMode] = useState<PlanningMode>('daily');
  const filtered = useMemo(() => tasks.filter((task) => task.mode === mode), [mode, tasks]);
  const sections = [...new Set(filtered.map((task) => task.section))];

  return (
    <Screen>
      <Header eyebrow="Your system" title="Tasks" subtitle="A flexible plan for the work and life you want to make room for." action={<IconButton icon="plus" label="New task" onPress={() => router.push({ pathname: '/task/new', params: { mode } })} tint={colors.coral} />} />
      <View style={styles.modeRow}>
        {(['daily', 'weekly', 'monthly'] as PlanningMode[]).map((item) => <ModePill key={item} mode={item} active={mode === item} onPress={() => setMode(item)} />)}
      </View>
      <View style={[styles.templateBanner, { backgroundColor: colors.secondary }]}>
        <View style={[styles.templateIcon, { backgroundColor: colors.sage }]}><Feather name="layout" size={17} color={colors.ink} /></View>
        <View style={styles.templateCopy}><Text style={[styles.templateTitle, { color: colors.foreground }]}>Workspace · Four sections</Text><Text style={[styles.templateDetail, { color: colors.mutedForeground }]}>Tap a task to add notes and details.</Text></View>
        <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
      </View>
      {sections.map((section) => (
        <View key={section}>
          <SectionLabel>{section}</SectionLabel>
          {filtered.filter((task) => task.section === section).map((task) => <TaskRow key={task.id} task={task} />)}
        </View>
      ))}
      {!filtered.length ? <View style={styles.empty}><Feather name="inbox" size={28} color={colors.mutedForeground} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>No {mode} tasks yet</Text><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Start with one meaningful task and let the plan grow around it.</Text><Pressable onPress={() => router.push({ pathname: '/task/new', params: { mode } })} style={[styles.emptyButton, { backgroundColor: colors.ink }]}><Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>Add a task</Text></Pressable></View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  templateBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 16, marginBottom: 14 },
  templateIcon: { alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 11 },
  templateCopy: { flex: 1 },
  templateTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 3 },
  templateDetail: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  empty: { alignItems: 'center', paddingHorizontal: 26, paddingVertical: 42, gap: 10 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, marginTop: 5 },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  emptyButton: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 20, marginTop: 7 },
  emptyButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});