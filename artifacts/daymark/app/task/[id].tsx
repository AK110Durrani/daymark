import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { IconButton } from '@/src/components/DaymarkUI';
import { formatMode, useDaymark } from '@/src/context/DaymarkContext';
import { getLocalDateKey } from '@/src/notifications';

export default function TaskDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTask, toggleTask, deleteTask, updateTask } = useDaymark();
  const task = getTask(id);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(task?.notes ?? '');

  if (!task) {
    return <View style={[styles.missing, { backgroundColor: colors.background }]}><Feather name="search" size={28} color={colors.mutedForeground} /><Text style={[styles.missingTitle, { color: colors.foreground }]}>Task not found</Text><Pressable onPress={() => router.back()}><Text style={[styles.backText, { color: colors.coral }]}>Go back</Text></Pressable></View>;
  }

  const remove = () => Alert.alert('Remove task?', 'This will remove the task from your local plan.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => { deleteTask(task.id); router.back(); } }]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}><IconButton icon="arrow-left" label="Back" onPress={() => router.back()} /><View style={styles.topActions}><IconButton icon="trash-2" label="Delete task" onPress={remove} tint={colors.destructive} /></View></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.modeTag, { backgroundColor: colors.secondary }]}><Text style={[styles.modeText, { color: colors.secondaryForeground }]}>{formatMode(task.mode)} plan</Text>{task.reminderEnabled ? <><View style={[styles.tagDot, { backgroundColor: colors.coral }]} /><Feather name="bell" size={12} color={colors.coral} /></> : null}</View>
        <Text style={[styles.title, { color: task.status === 'completed' ? colors.mutedForeground : colors.foreground, textDecorationLine: task.status === 'completed' ? 'line-through' : 'none' }]}>{task.title}</Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{task.overdueFrom ? `Originally planned for ${task.scheduledDate}` : task.scheduledDate === getLocalDateKey() ? 'Planned for today' : `Planned for ${task.scheduledDate}`} · {task.section}</Text>
        {task.overdueFrom ? <View style={[styles.overdueBanner, { backgroundColor: colors.secondary }]}><Feather name="corner-up-right" size={15} color={colors.coral} /><Text style={[styles.overdueLabel, { color: colors.secondaryForeground }]}>Overdue from {task.overdueFrom}</Text></View> : null}
        <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.noteHeader}><Feather name="file-text" size={16} color={colors.coral} /><Text style={[styles.noteLabel, { color: colors.mutedForeground }]}>TASK NOTE</Text></View>
          {editingNotes ? (
            <>
              <TextInput autoFocus value={notes} onChangeText={setNotes} multiline textAlignVertical="top" placeholder="Add context, a next step, or a little encouragement" placeholderTextColor={colors.mutedForeground} style={[styles.notesInput, { color: colors.foreground, borderColor: colors.border }]} />
              <View style={styles.noteActions}>
                <Pressable onPress={() => { setNotes(task.notes ?? ''); setEditingNotes(false); }} style={[styles.noteActionButton, { borderColor: colors.border }]}><Text style={[styles.noteActionText, { color: colors.mutedForeground }]}>Cancel</Text></Pressable>
                <Pressable onPress={() => { updateTask(task.id, { notes: notes.trim() || undefined }); setEditingNotes(false); }} style={[styles.noteActionButton, { backgroundColor: colors.coral, borderColor: colors.coral }]}><Text style={[styles.noteActionText, { color: colors.ink }]}>Save note</Text></Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.noteText, { color: task.notes ? colors.foreground : colors.mutedForeground }]}>{task.notes || 'No notes yet. Add context, checklists, or the next small step here.'}</Text>
              <Pressable onPress={() => { setNotes(task.notes ?? ''); setEditingNotes(true); }} style={[styles.noteAction, { borderTopColor: colors.border }]}><Feather name="edit-3" size={15} color={colors.coral} /><Text style={[styles.noteActionText, { color: colors.coral }]}>Edit notes</Text></Pressable>
            </>
          )}
        </View>
        <Pressable onPress={() => toggleTask(task.id)} style={({ pressed }) => [styles.completeButton, { backgroundColor: task.status === 'completed' ? colors.secondary : colors.ink, opacity: pressed ? 0.78 : 1 }]}><Feather name={task.status === 'completed' ? 'rotate-ccw' : 'check'} size={18} color={task.status === 'completed' ? colors.secondaryForeground : colors.primaryForeground} /><Text style={[styles.completeText, { color: task.status === 'completed' ? colors.secondaryForeground : colors.primaryForeground }]}>{task.status === 'completed' ? 'Mark as open' : 'Mark complete'}</Text></Pressable>
        <View style={styles.infoRow}><Feather name="info" size={15} color={colors.mutedForeground} /><Text style={[styles.infoText, { color: colors.mutedForeground }]}>Completing this task records the moment in your activity timeline and stops any active reminders for today.</Text></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  topActions: { flexDirection: 'row', gap: 9 },
  content: { paddingTop: 30, paddingBottom: 40 },
  modeTag: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 15, marginBottom: 16 },
  modeText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  tagDot: { width: 4, height: 4, borderRadius: 2 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 34, lineHeight: 40, letterSpacing: -1, marginBottom: 9 },
  date: { fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 20 },
  overdueBanner: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderRadius: 13, marginBottom: 18 },
  overdueLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  noteCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 16 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  noteLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2 },
  noteText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, minHeight: 44 },
  notesInput: { minHeight: 110, borderWidth: 1, borderRadius: 12, padding: 12, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  noteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  noteActionButton: { paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1, borderRadius: 16 },
  noteAction: { flexDirection: 'row', alignItems: 'center', gap: 7, borderTopWidth: 1, paddingTop: 13, marginTop: 16 },
  noteActionText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  completeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 15, borderRadius: 17, marginBottom: 15 },
  completeText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  infoRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 6 },
  infoText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  missingTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  backText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});