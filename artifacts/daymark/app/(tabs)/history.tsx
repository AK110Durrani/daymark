import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Header, Screen, SectionLabel } from '@/src/components/DaymarkUI';
import { useDaymark } from '@/src/context/DaymarkContext';

export default function HistoryScreen() {
  const colors = useColors();
  const { activity, tasks } = useDaymark();
  const month = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date());
  const completed = tasks.filter((task) => task.status === 'completed').length;
  return (
    <Screen>
      <Header eyebrow="Your archive" title="History" subtitle="Look back at the work you made room for. Past months stay yours." />
      <View style={[styles.currentCard, { backgroundColor: colors.ink }]}>
        <View style={styles.currentTop}><View><Text style={[styles.currentEyebrow, { color: colors.sage }]}>ACTIVE MONTH</Text><Text style={[styles.currentTitle, { color: colors.primaryForeground }]}>{month}</Text></View><View style={[styles.archiveIcon, { backgroundColor: colors.coral }]}><Feather name="archive" size={20} color={colors.ink} /></View></View>
        <View style={styles.currentStats}><View><Text style={[styles.statNumber, { color: colors.primaryForeground }]}>{tasks.length}</Text><Text style={[styles.statLabel, { color: colors.sage }]}>planned</Text></View><View><Text style={[styles.statNumber, { color: colors.primaryForeground }]}>{completed}</Text><Text style={[styles.statLabel, { color: colors.sage }]}>completed</Text></View><View><Text style={[styles.statNumber, { color: colors.primaryForeground }]}>{activity.length}</Text><Text style={[styles.statLabel, { color: colors.sage }]}>events</Text></View></View>
      </View>
      <SectionLabel>Previous months</SectionLabel>
      <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Feather name="calendar" size={21} color={colors.ink} /></View>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your archive is just beginning</Text>
        <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>When a month closes, Daymark will keep a read-only summary here so your progress never disappears.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  currentCard: { padding: 20, borderRadius: 22, marginBottom: 24 },
  currentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  currentEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, marginBottom: 8 },
  currentTitle: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  archiveIcon: { alignItems: 'center', justifyContent: 'center', width: 43, height: 43, borderRadius: 14 },
  currentStats: { flexDirection: 'row', gap: 34 },
  statNumber: { fontFamily: 'Inter_700Bold', fontSize: 25 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  empty: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32, borderWidth: 1, borderRadius: 18 },
  emptyIcon: { alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 15, marginBottom: 12 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 7, textAlign: 'center' },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center' },
});