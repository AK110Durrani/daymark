import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { formatMode, useDaymark } from '@/src/context/DaymarkContext';
import { Task } from '@/src/types';

export function Screen({ children, scroll = true, style }: { children: React.ReactNode; scroll?: boolean; style?: ViewStyle }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const top = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottom = Platform.OS === 'web' ? 34 : insets.bottom;
  const content = (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: top, paddingBottom: bottom + 92 }, style]}>
      {children}
    </View>
  );
  return scroll ? <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content;
}

export function Header({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.coral }]}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function IconButton({ icon, onPress, label, tint }: { icon: keyof typeof Feather.glyphMap; onPress: () => void; label: string; tint?: string }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityLabel={label}
      testID={`icon-${label.toLowerCase().replaceAll(' ', '-')}`}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}
    >
      <Feather name={icon} size={19} color={tint ?? colors.foreground} />
    </Pressable>
  );
}

export function ModePill({ mode, active, onPress }: { mode: 'daily' | 'weekly' | 'monthly'; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.modePill, { backgroundColor: active ? colors.ink : colors.card, borderColor: active ? colors.ink : colors.border, opacity: pressed ? 0.8 : 1 }]}>
      <Text style={{ color: active ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>{formatMode(mode)}</Text>
    </Pressable>
  );
}

export function TaskRow({ task, compact = false }: { task: Task; compact?: boolean }) {
  const colors = useColors();
  const { toggleTask } = useDaymark();
  return (
    <Pressable
      onPress={() => router.push(`/task/${task.id}`)}
      onLongPress={() => toggleTask(task.id)}
      accessibilityLabel={`${task.status === 'completed' ? 'Completed' : 'Open'} task ${task.title}`}
      style={({ pressed }) => [styles.taskRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.78 : 1 }]}
    >
      <Pressable onPress={() => toggleTask(task.id)} hitSlop={8} style={[styles.check, { borderColor: task.status === 'completed' ? colors.success : colors.border, backgroundColor: task.status === 'completed' ? colors.success : 'transparent' }]}>
        {task.status === 'completed' ? <Feather name="check" size={14} color={colors.primaryForeground} /> : null}
      </Pressable>
      <View style={styles.taskCopy}>
        <Text numberOfLines={compact ? 1 : 2} style={[styles.taskTitle, { color: task.status === 'completed' ? colors.mutedForeground : colors.foreground, textDecorationLine: task.status === 'completed' ? 'line-through' : 'none' }]}>{task.title}</Text>
        <View style={styles.metaLine}>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{task.section}</Text>
          {task.overdueFrom ? <Text style={[styles.overdueText, { color: colors.coral }]}>Overdue from {task.overdueFrom}</Text> : null}
          {task.recurrence ? <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{task.recurrence}</Text> : null}
        </View>
      </View>
      <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
    </Pressable>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const colors = useColors();
  return <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}><View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color ?? colors.coral }]} /></View>;
}

export function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  const colors = useColors();
  return <View style={styles.sectionLabel}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{children}</Text>{action}</View>;
}

export function EmptyState({ icon, title, body }: { icon: keyof typeof Feather.glyphMap; title: string; body: string }) {
  const colors = useColors();
  return <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={22} color={colors.ink} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{body}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: '100%', paddingHorizontal: 20 },
  scrollContent: { flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 24 },
  headerCopy: { flex: 1 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.6, marginBottom: 8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 31, lineHeight: 36, letterSpacing: -0.7 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 8 },
  iconButton: { alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderWidth: 1, borderRadius: 21 },
  modePill: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15, height: 36, borderWidth: 1, borderRadius: 18 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 70, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderRadius: 16, marginBottom: 9 },
  check: { alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderWidth: 1.5, borderRadius: 12 },
  taskCopy: { flex: 1, gap: 6 },
  taskTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 20 },
  metaLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  metaText: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  overdueText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  progressTrack: { height: 8, overflow: 'hidden', borderRadius: 4 },
  progressFill: { height: '100%', borderRadius: 4 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 10 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.2 },
  empty: { alignItems: 'center', paddingHorizontal: 26, paddingVertical: 28, borderWidth: 1, borderRadius: 18 },
  emptyIcon: { alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 16, marginBottom: 12 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 6 },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center' },
});