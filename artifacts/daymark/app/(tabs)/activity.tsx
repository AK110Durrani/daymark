import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Header, ProgressBar, Screen, SectionLabel } from '@/src/components/DaymarkUI';
import { useDaymark } from '@/src/context/DaymarkContext';
import { ActivityEvent } from '@/src/types';

const eventLabel: Record<string, string> = { completed: 'completed', created: 'created', undone: 'reopened', rolled_over: 'carried forward', edited: 'updated' };
type GraphMode = 'daily' | 'weekly';

const localDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shortDay = (date: Date) => new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date).slice(0, 1);

function ActivityGraph({ activity, mode, onModeChange }: { activity: ActivityEvent[]; mode: GraphMode; onModeChange: (mode: GraphMode) => void }) {
  const colors = useColors();
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  }), []);
  const weeklyBars = useMemo(() => dates.map((date) => ({
    label: shortDay(date),
    dateLabel: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date),
    value: activity.filter((event) => localDateKey(new Date(event.timestamp)) === localDateKey(date)).length,
  })), [activity, dates]);
  const dailyBars = useMemo(() => [0, 3, 6, 9, 12, 15, 18, 21].map((hour) => ({
    label: hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`,
    value: activity.filter((event) => {
      const date = new Date(event.timestamp);
      return localDateKey(date) === localDateKey(new Date()) && Math.floor(date.getHours() / 3) * 3 === hour;
    }).length,
  })), [activity]);
  const bars = mode === 'daily' ? dailyBars : weeklyBars;
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  const total = bars.reduce((sum, bar) => sum + bar.value, 0);
  const selectedLabel = mode === 'daily'
    ? `${total} ${total === 1 ? 'event' : 'events'} today`
    : `${total} ${total === 1 ? 'event' : 'events'} this week`;

  return (
    <View style={[styles.chartCard, { backgroundColor: colors.ink }]}>
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleCopy}>
          <Text style={[styles.chartEyebrow, { color: colors.sage }]}>{mode === 'daily' ? 'TODAY' : 'LAST 7 DAYS'}</Text>
          <Text style={[styles.chartTitle, { color: colors.primaryForeground }]}>{selectedLabel}</Text>
        </View>
        <View style={[styles.graphToggle, { backgroundColor: colors.card }]}>
          {(['daily', 'weekly'] as GraphMode[]).map((item) => (
            <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: mode === item }} onPress={() => onModeChange(item)} style={[styles.graphToggleItem, { backgroundColor: mode === item ? colors.coral : 'transparent' }]}>
              <Text style={[styles.graphToggleText, { color: mode === item ? colors.ink : colors.mutedForeground }]}>{item === 'daily' ? 'Daily' : 'Weekly'}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.chartPlot}>
        <View style={[styles.gridLine, { top: 0, backgroundColor: colors.border }]} />
        <View style={[styles.gridLine, { top: '50%', backgroundColor: colors.border }]} />
        <View style={[styles.gridLine, { bottom: 0, backgroundColor: colors.border }]} />
        <View style={styles.chartBars}>
          {bars.map((bar, index) => (
            <View key={`${bar.label}-${index}`} style={styles.barColumn}>
              <View style={[styles.bar, { height: `${Math.max(bar.value ? 13 : 4, (bar.value / max) * 100)}%`, backgroundColor: mode === 'daily' ? colors.coral : colors.sky }]} />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.chartLabels}>
        {bars.map((bar) => <Text key={bar.label} style={[styles.chartLabel, { color: colors.sage }]}>{bar.label}</Text>)}
      </View>
      <Text style={[styles.chartNote, { color: colors.sage }]}>{mode === 'daily' ? 'Task activity grouped into three-hour windows' : 'Task activity grouped by day'}</Text>
    </View>
  );
}

export default function ActivityScreen() {
  const colors = useColors();
  const { activity, todayTasks, completedToday, completionPercent } = useDaymark();
  const [expanded, setExpanded] = useState(false);
  const [graphMode, setGraphMode] = useState<GraphMode>('weekly');
  const rolloverCount = activity.filter((event) => event.type === 'rolled_over').length;
  const metrics = [
    { label: 'Created', value: todayTasks.length, color: colors.sky },
    { label: 'Completed', value: completedToday, color: colors.success },
    { label: 'Open', value: todayTasks.length - completedToday, color: colors.coral },
  ];
  const graphRows = useMemo(() => [
    { label: 'Planned', value: todayTasks.length, color: colors.sky },
    { label: 'Completed', value: completedToday, color: colors.success },
    { label: 'Open', value: todayTasks.length - completedToday, color: colors.coral },
    { label: 'Carried forward', value: rolloverCount, color: colors.amber },
  ], [colors.amber, colors.coral, colors.sky, colors.success, completedToday, rolloverCount, todayTasks.length]);
  const graphMax = Math.max(...graphRows.map((row) => row.value), 1);

  return (
    <Screen>
      <Header eyebrow="Your momentum" title="Activity" subtitle="A clear view of the small actions adding up over time." />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Today's completion statistics"
        accessibilityHint="Expand to see a visual breakdown of today's task activity"
        accessibilityState={{ expanded }}
        onFocus={() => setExpanded(true)}
        onPress={() => setExpanded((current) => !current)}
        style={({ pressed }) => [styles.scoreCard, { backgroundColor: colors.secondary, opacity: pressed ? 0.88 : 1 }]}
      >
        <View style={styles.scoreHeader}><View><Text style={[styles.scoreEyebrow, { color: colors.mutedForeground }]}>TODAY</Text><Text style={[styles.score, { color: colors.foreground }]}>{completionPercent}%</Text></View><View style={[styles.scoreBadge, { backgroundColor: colors.coral }]}><Feather name="trending-up" size={20} color={colors.ink} /></View></View>
        <ProgressBar value={completionPercent} color={colors.coral} />
        <Text style={[styles.scoreNote, { color: colors.mutedForeground }]}>Completion is calculated from tasks on your plan today.</Text>
        <View style={styles.expandHint}><Text style={[styles.expandHintText, { color: colors.mutedForeground }]}>{expanded ? 'Tap to hide details' : 'Tap to see the breakdown'}</Text><Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={colors.mutedForeground} /></View>
        {expanded ? (
          <View style={[styles.graph, { borderTopColor: colors.border }]}>
            <View style={styles.graphHeader}><Text style={[styles.graphTitle, { color: colors.foreground }]}>Today at a glance</Text><Text style={[styles.graphCaption, { color: colors.mutedForeground }]}>{todayTasks.length} total</Text></View>
            {graphRows.map((row) => (
              <View key={row.label} style={styles.graphRow}>
                <View style={styles.graphRowTop}><Text style={[styles.graphLabel, { color: colors.mutedForeground }]}>{row.label}</Text><Text style={[styles.graphValue, { color: colors.foreground }]}>{row.value}</Text></View>
                <View style={[styles.graphTrack, { backgroundColor: colors.card }]}><View style={[styles.graphFill, { width: `${(row.value / graphMax) * 100}%`, backgroundColor: row.color }]} /></View>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>
      <ActivityGraph activity={activity} mode={graphMode} onModeChange={setGraphMode} />
      <View style={styles.metricRow}>{metrics.map((metric) => <View key={metric.label} style={[styles.metric, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.metricDot, { backgroundColor: metric.color }]} /><Text style={[styles.metricValue, { color: colors.foreground }]}>{metric.value}</Text><Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{metric.label}</Text></View>)}</View>
      <SectionLabel>Recent events</SectionLabel>
      <View style={[styles.timeline, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {activity.slice(0, 8).map((event, index) => (
          <View key={event.id} style={[styles.event, index < Math.min(activity.length, 8) - 1 ? { borderBottomColor: colors.border, borderBottomWidth: 1 } : null]}>
            <View style={[styles.eventDot, { backgroundColor: event.type === 'completed' ? colors.success : colors.sky }]} />
            <View style={styles.eventCopy}><Text style={[styles.eventTitle, { color: colors.foreground }]}><Text style={{ fontFamily: 'Inter_700Bold' }}>{event.taskTitle}</Text> {eventLabel[event.type]}</Text><Text style={[styles.eventDetail, { color: colors.mutedForeground }]}>{event.detail} · {new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(event.timestamp))}</Text></View>
          </View>
        ))}
        {!activity.length ? <Text style={[styles.noEvents, { color: colors.mutedForeground }]}>Your task activity will appear here.</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scoreCard: { padding: 20, borderRadius: 22, marginBottom: 14 },
  scoreHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  scoreEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, marginBottom: 5 },
  score: { fontFamily: 'Inter_700Bold', fontSize: 40, letterSpacing: -1 },
  scoreBadge: { alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 14 },
  scoreNote: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 12 },
  expandHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 14 },
  expandHintText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  graph: { borderTopWidth: 1, marginTop: 15, paddingTop: 16 },
  graphHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  graphTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  graphCaption: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  graphRow: { marginBottom: 11 },
  graphRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  graphLabel: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  graphValue: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  graphTrack: { height: 7, overflow: 'hidden', borderRadius: 4 },
  graphFill: { height: '100%', borderRadius: 4 },
  chartCard: { padding: 18, borderRadius: 22, marginBottom: 14 },
  chartHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 22 },
  chartTitleCopy: { flex: 1 },
  chartEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.35, marginBottom: 7 },
  chartTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.4 },
  graphToggle: { flexDirection: 'row', padding: 3, borderRadius: 17 },
  graphToggleItem: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 14 },
  graphToggleText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  chartPlot: { height: 142, position: 'relative', justifyContent: 'flex-end' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, opacity: 0.35 },
  chartBars: { height: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', gap: 7, paddingHorizontal: 4 },
  barColumn: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '55%', minWidth: 6, maxWidth: 22, borderRadius: 7 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-around', gap: 7, paddingHorizontal: 4, marginTop: 9 },
  chartLabel: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 10, textAlign: 'center' },
  chartNote: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 15 },
  metricRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  metric: { flex: 1, padding: 13, borderWidth: 1, borderRadius: 16 },
  metricDot: { width: 7, height: 7, borderRadius: 4, marginBottom: 13 },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 22, marginBottom: 3 },
  metricLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  timeline: { paddingHorizontal: 14, borderWidth: 1, borderRadius: 18 },
  event: { flexDirection: 'row', gap: 12, paddingVertical: 15 },
  eventDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  eventCopy: { flex: 1 },
  eventTitle: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  eventDetail: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  noEvents: { fontFamily: 'Inter_400Regular', fontSize: 13, paddingVertical: 22, textAlign: 'center' },
});