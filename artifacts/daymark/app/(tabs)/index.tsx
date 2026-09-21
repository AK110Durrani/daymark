import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Header, IconButton, ProgressBar, Screen, SectionLabel, TaskRow } from '@/src/components/DaymarkUI';
import { useDaymark } from '@/src/context/DaymarkContext';

export default function HomeScreen() {
  const colors = useColors();
  const { todayTasks, openTasks, completedToday, completionPercent } = useDaymark();
  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <Screen>
      <Header
        eyebrow={dateLabel}
        title="Make today count."
        subtitle={openTasks.length ? `${openTasks.length} open ${openTasks.length === 1 ? 'task' : 'tasks'} waiting for you.` : 'Your plan is clear. Protect the space.'}
        action={<IconButton icon="plus" label="Add task" onPress={() => router.push('/task/new')} tint={colors.coral} />}
      />

      <View style={[styles.focusCard, { backgroundColor: colors.ink }]}>
        <View style={styles.focusTop}>
          <View>
            <Text style={[styles.cardEyebrow, { color: colors.sage }]}>TODAY'S PULSE</Text>
            <Text style={[styles.focusNumber, { color: colors.primaryForeground }]}>{completionPercent}%</Text>
          </View>
          <View style={[styles.ring, { borderColor: colors.coral }]}>
            <Feather name={completionPercent === 100 ? 'check' : 'sunrise'} size={24} color={colors.coral} />
          </View>
        </View>
        <ProgressBar value={completionPercent} color={colors.coral} />
        <View style={styles.focusFooter}>
          <Text style={[styles.focusCaption, { color: colors.sage }]}>{completedToday} complete</Text>
          <Text style={[styles.focusCaption, { color: colors.sage }]}>{todayTasks.length} planned</Text>
        </View>
      </View>

      <SectionLabel action={<Pressable onPress={() => router.push('/(tabs)/tasks')}><Text style={[styles.link, { color: colors.coral }]}>See all</Text></Pressable>}>Up next</SectionLabel>
      {todayTasks.slice(0, 3).map((task) => <TaskRow key={task.id} task={task} compact />)}
      {!todayTasks.length ? <View style={styles.emptyWrap}><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Nothing planned yet. Add a task to get started.</Text></View> : null}

      <SectionLabel>Plan with intention</SectionLabel>
      <View style={styles.quickGrid}>
        {[
          { label: 'Daily', detail: 'Keep today focused', icon: 'sunrise' as const, color: colors.coral, mode: 'daily' as const },
          { label: 'Weekly', detail: 'Build a rhythm', icon: 'repeat' as const, color: colors.sky, mode: 'weekly' as const },
          { label: 'Monthly', detail: 'Move the big things', icon: 'calendar' as const, color: colors.sage, mode: 'monthly' as const },
        ].map((item) => (
          <Pressable key={item.label} onPress={() => router.push({ pathname: '/task/new', params: { mode: item.mode } })} style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.78 : 1 }]}>
            <View style={[styles.quickIcon, { backgroundColor: item.color }]}><Feather name={item.icon} size={19} color={colors.ink} /></View>
            <Text style={[styles.quickTitle, { color: colors.foreground }]}>{item.label}</Text>
            <Text style={[styles.quickDetail, { color: colors.mutedForeground }]}>{item.detail}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  focusCard: { borderRadius: 22, padding: 20, marginBottom: 26 },
  focusTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  cardEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, marginBottom: 7 },
  focusNumber: { fontFamily: 'Inter_700Bold', fontSize: 40, letterSpacing: -1.5 },
  ring: { alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderWidth: 2, borderRadius: 26 },
  focusFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 11 },
  focusCaption: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  emptyWrap: { padding: 24, alignItems: 'center' },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center' },
  quickGrid: { flexDirection: 'row', gap: 9 },
  quickCard: { flex: 1, minHeight: 132, padding: 13, borderWidth: 1, borderRadius: 17 },
  quickIcon: { alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 12, marginBottom: 14 },
  quickTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, marginBottom: 5 },
  quickDetail: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
});
