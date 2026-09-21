import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Share } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Header, Screen, SectionLabel } from '@/src/components/DaymarkUI';
import { openNotificationSettings } from '@/src/notifications';
import { useDaymark } from '@/src/context/DaymarkContext';

function SettingRow({ icon, title, detail, children, onPress }: { icon: keyof typeof Feather.glyphMap; title: string; detail: string; children?: React.ReactNode; onPress?: () => void }) {
  const colors = useColors();
  const content = <><View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={17} color={colors.ink} /></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>{detail}</Text></View>{children ?? <Feather name="chevron-right" size={17} color={colors.mutedForeground} />}</>;
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.78 : 1 }]}>{content}</Pressable> : <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>{content}</View>;
}

export default function SettingsScreen() {
  const colors = useColors();
  const {
    remindersEnabled,
    reminderPermission,
    requestReminderPermission,
    setRemindersEnabled, tasks, activity,
  } = useDaymark();
  const reminderDetail =
    reminderPermission === 'granted'
      ? 'On for tasks you explicitly opt into'
      : reminderPermission === 'blocked'
        ? 'Blocked in device settings'
        : reminderPermission === 'denied'
          ? 'Permission denied — tap to try again'
          : reminderPermission === 'unavailable'
            ? 'Notifications are unavailable in this preview'
            : 'Ask before enabling a task reminder';

  const handleReminderToggle = (value: boolean) => {
    setRemindersEnabled(value);
    if (value && reminderPermission !== 'granted' && reminderPermission !== 'blocked') {
      requestReminderPermission().catch(() => undefined);
    }
  };
  const exportData = () => {
    Share.share({ title: 'Daymark backup', message: JSON.stringify({ exportedAt: new Date().toISOString(), tasks, activity, remindersEnabled }, null, 2) }).catch(() => undefined);
  };

  return (
    <Screen>
      <Header eyebrow="Make it yours" title="Settings" subtitle="A few quiet defaults to help Daymark fit your day." />
      <SectionLabel>Preferences</SectionLabel>
      <SettingRow icon="moon" title="Appearance" detail="Use system theme"><Text style={[styles.value, { color: colors.coral }]}>System</Text></SettingRow>
      <SettingRow icon="layout" title="Default template" detail="Used when you create a new board"><Text style={[styles.value, { color: colors.coral }]}>Four sections</Text></SettingRow>
      <SettingRow icon="bell" title="Hourly reminders" detail={reminderDetail}><Switch value={remindersEnabled} onValueChange={handleReminderToggle} trackColor={{ false: colors.muted, true: colors.sage }} thumbColor={remindersEnabled ? colors.success : colors.mutedForeground} /></SettingRow>
      {reminderPermission === 'blocked' ? <Pressable onPress={() => openNotificationSettings().catch(() => undefined)} style={styles.permissionAction}><Feather name="settings" size={14} color={colors.coral} /><Text style={[styles.permissionActionText, { color: colors.coral }]}>Open notification settings</Text></Pressable> : null}
      <SectionLabel>Data & privacy</SectionLabel>
      <SettingRow icon="download" title="Export your data" detail="Share a structured offline backup" onPress={exportData} />
      <SettingRow icon="shield" title="No account required" detail="Your tasks stay on this device" />
      <View style={[styles.privacyNote, { backgroundColor: colors.secondary }]}><Feather name="lock" size={16} color={colors.success} /><Text style={[styles.privacyText, { color: colors.secondaryForeground }]}>Daymark is local by design. Your plan works without an internet connection or sign-in.</Text></View>
      <Text style={[styles.version, { color: colors.mutedForeground }]}>DAYMARK · FIRST EDITION</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 70, paddingHorizontal: 13, paddingVertical: 11, borderWidth: 1, borderRadius: 16, marginBottom: 9 },
  rowIcon: { alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 11 },
  rowCopy: { flex: 1 },
  rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginBottom: 4 },
  rowDetail: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  value: { fontFamily: 'Inter_600SemiBold', fontSize: 11, maxWidth: 90, textAlign: 'right' },
  privacyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 16, marginTop: 17 },
  privacyText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  version: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4, textAlign: 'center', marginTop: 26 },
  permissionAction: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 7, marginTop: -2, marginBottom: 15 },
  permissionActionText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});