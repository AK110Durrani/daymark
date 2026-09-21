import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { IconButton, ModePill } from '@/src/components/DaymarkUI';
import { useDaymark } from '@/src/context/DaymarkContext';
import { openNotificationSettings, ReminderPermissionState } from '@/src/notifications';
import { PlanningMode } from '@/src/types';

export default function NewTaskScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: PlanningMode }>();
  const { addTask, reminderPermission, requestReminderPermission } = useDaymark();
  const [mode, setMode] = useState<PlanningMode>(params.mode ?? 'daily');
  const [title, setTitle] = useState('');
  const [section, setSection] = useState('Focus');
  const [notes, setNotes] = useState('');
  const [reminder, setReminder] = useState(false);
  const canSave = title.trim().length > 0;

  const toggleReminder = async () => {
    if (!reminder) {
      await requestReminderPermission();
    }
    setReminder((value) => !value);
  };

  const reminderDetail = (permission: ReminderPermissionState) => {
    if (permission === 'granted') return 'Reminds you at the next open hour today.';
    if (permission === 'blocked') return 'Notifications are blocked in device settings.';
    if (permission === 'denied') return 'Permission denied. You can still opt in and enable it later.';
    if (permission === 'unavailable') return 'Notifications are unavailable in this preview.';
    return 'Ask for permission, then remind you hourly during the day.';
  };

  const save = () => {
    if (!canSave) return;
    const task = addTask({ title, mode, section, notes, reminderEnabled: reminder, recurrence: mode === 'weekly' ? 'Choose days later' : mode === 'monthly' ? 'Monthly plan' : undefined });
    router.replace(`/task/${task.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}><IconButton icon="x" label="Close" onPress={() => router.back()} /><Text style={[styles.topTitle, { color: colors.foreground }]}>New task</Text><Pressable onPress={save} disabled={!canSave} style={({ pressed }) => [styles.save, { backgroundColor: canSave ? colors.coral : colors.muted, opacity: pressed ? 0.75 : 1 }]}><Text style={[styles.saveText, { color: canSave ? colors.ink : colors.mutedForeground }]}>Save</Text></Pressable></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.prompt, { color: colors.foreground }]}>What would make today feel meaningful?</Text>
        <TextInput autoFocus value={title} onChangeText={setTitle} placeholder="Name your task" placeholderTextColor={colors.mutedForeground} style={[styles.titleInput, { color: colors.foreground, borderBottomColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Plan it for</Text>
        <View style={styles.modeRow}>{(['daily', 'weekly', 'monthly'] as PlanningMode[]).map((item) => <ModePill key={item} mode={item} active={mode === item} onPress={() => setMode(item)} />)}</View>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Section</Text>
        <View style={styles.sectionOptions}>{['Focus', 'Wellbeing', 'Planning', 'Growth'].map((item) => <Pressable key={item} onPress={() => setSection(item)} style={[styles.sectionChip, { backgroundColor: section === item ? colors.secondary : colors.card, borderColor: section === item ? colors.success : colors.border }]}><Text style={{ color: section === item ? colors.secondaryForeground : colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>{item}</Text></Pressable>)}</View>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Notes <Text style={{ fontFamily: 'Inter_400Regular' }}>· optional</Text></Text>
        <TextInput value={notes} onChangeText={setNotes} placeholder="Add context, a next step, or a little encouragement" placeholderTextColor={colors.mutedForeground} multiline textAlignVertical="top" style={[styles.notesInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />
        <Pressable onPress={() => toggleReminder().catch(() => undefined)} style={[styles.reminderRow, { backgroundColor: reminder ? colors.secondary : colors.card, borderColor: reminder ? colors.success : colors.border }]}><View style={[styles.reminderIcon, { backgroundColor: reminder ? colors.sage : colors.muted }]}><Feather name="bell" size={17} color={colors.ink} /></View><View style={styles.reminderCopy}><Text style={[styles.reminderTitle, { color: colors.foreground }]}>Hourly reminder</Text><Text style={[styles.reminderDetail, { color: colors.mutedForeground }]}>{reminderDetail(reminderPermission)}</Text></View><Feather name={reminder ? 'check-circle' : 'circle'} size={20} color={reminder ? colors.success : colors.mutedForeground} /></Pressable>
        {reminderPermission === 'blocked' ? <Pressable onPress={() => openNotificationSettings().catch(() => undefined)} style={styles.permissionAction}><Feather name="settings" size={14} color={colors.coral} /><Text style={[styles.permissionActionText, { color: colors.coral }]}>Open notification settings</Text></Pressable> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  topTitle: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  save: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18 },
  saveText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  content: { paddingTop: 25, paddingBottom: 40 },
  prompt: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 34, letterSpacing: -0.7, maxWidth: 320, marginBottom: 24 },
  titleInput: { fontFamily: 'Inter_600SemiBold', fontSize: 20, paddingVertical: 12, borderBottomWidth: 1, marginBottom: 26 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 11 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 25 },
  sectionOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 25 },
  sectionChip: { paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1, borderRadius: 18 },
  notesInput: { minHeight: 115, padding: 14, borderWidth: 1, borderRadius: 16, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 19 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderWidth: 1, borderRadius: 16 },
  reminderIcon: { alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 11 },
  reminderCopy: { flex: 1 },
  reminderTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 3 },
  reminderDetail: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  permissionAction: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 7, marginTop: -8 },
  permissionActionText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});