import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Share, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartBar as BarChart3, Calendar, CalendarDays, CalendarRange, Share2, Trash2, TriangleAlert, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import StatCard from '@/components/StatCard';
import {
  getDailyReports, getWeeklyReports, getMonthlyReports,
  generateCsvReport, formatDate, deleteDailyRecord,
} from '@/lib/database';
import type { DaySummary, WeeklyReport, MonthlyReport } from '@/types';

type ReportTab = 'daily' | 'weekly' | 'monthly';

export default function ReportsScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<ReportTab>('daily');
  const [dailyReports, setDailyReports] = useState<DaySummary[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(() => {
    try {
      setDailyReports(getDailyReports());
      setWeeklyReports(getWeeklyReports());
      setMonthlyReports(getMonthlyReports());
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  async function handleExport() {
    setExporting(true);
    try {
      const csv = generateCsvReport();
      await Share.share({ message: csv, title: 'Bag Tracker Report' });
    } catch {
      Alert.alert('Export Failed', 'Unable to export report.');
    } finally {
      setExporting(false);
    }
  }

  function handleDeleteDay(id: string, date: string) {
    Alert.alert(
      'Delete Day Record',
      `Delete all data for ${formatDate(date)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: () => {
            try {
              deleteDailyRecord(id);
              loadData();
            } catch {
              Alert.alert('Error', 'Failed to delete record.');
            }
          }
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  const tabs: { key: ReportTab; label: string; icon: any }[] = [
    { key: 'daily', label: 'Daily', icon: Calendar },
    { key: 'weekly', label: 'Weekly', icon: CalendarDays },
    { key: 'monthly', label: 'Monthly', icon: CalendarRange },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <BarChart3 size={26} color={colors.primary} />
            <Text style={[styles.screenTitle, { color: colors.text }]}>Reports</Text>
          </View>
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.primary }, exporting && styles.btnDisabled]}
            onPress={handleExport} disabled={exporting}
          >
            <Share2 size={14} color="#FFFFFF" />
            <Text style={styles.exportBtnText}>{exporting ? 'Exporting…' : 'Export CSV'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {tabs.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.tab, active && [styles.tabActive, { backgroundColor: colors.background }]]}
                onPress={() => setActiveTab(key)}
              >
                <Icon size={14} color={active ? colors.primary : colors.subtext} />
                <Text style={[styles.tabText, { color: active ? colors.primary : colors.subtext }, active && styles.tabTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'daily' && <DailyTab reports={dailyReports} colors={colors} onDelete={handleDeleteDay} />}
        {activeTab === 'weekly' && <WeeklyTab reports={weeklyReports} colors={colors} />}
        {activeTab === 'monthly' && <MonthlyTab reports={monthlyReports} colors={colors} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function DailyTab({ reports, colors, onDelete }: { reports: DaySummary[]; colors: any; onDelete: (id: string, date: string) => void }) {
  if (reports.length === 0) return <EmptyState colors={colors} message="No daily records yet. Start tracking to see your history." />;
  return (
    <>
      {reports.map((s) => (
        <View key={s.record.id} style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reportCardHeader}>
            <View style={styles.reportDateRow}>
              {s.has_mismatch
                ? <TriangleAlert size={15} color={colors.warning} />
                : <CheckCircle size={15} color={colors.success} />}
              <Text style={[styles.reportDate, { color: colors.text }]}>{formatDate(s.record.date)}</Text>
            </View>
            <TouchableOpacity style={[styles.deleteSmallBtn, { backgroundColor: colors.errorBg }]} onPress={() => onDelete(s.record.id, s.record.date)}>
              <Trash2 size={14} color={colors.error} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.entriesCount, { color: colors.subtext }]}>{s.entries.length} collection{s.entries.length !== 1 ? 's' : ''}</Text>
          <View style={styles.reportStats}>
            <ReportStat label="Received" value={s.record.full_bags_received} colors={colors} color={colors.accent} />
            <ReportStat label="Dispatched" value={s.total_dispatched} colors={colors} color={colors.text} />
            <ReportStat label="Returned" value={s.total_returned} colors={colors} color={colors.success} />
            <ReportStat label="Diff" value={s.difference} colors={colors} color={s.difference === 0 ? colors.success : colors.error} />
          </View>
        </View>
      ))}
    </>
  );
}

function WeeklyTab({ reports, colors }: { reports: WeeklyReport[]; colors: any }) {
  if (reports.length === 0) return <EmptyState colors={colors} message="No weekly data yet. Keep tracking to see weekly summaries." />;
  return (
    <>
      {reports.map((w, i) => (
        <View key={i} style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.reportDate, { color: colors.text }]}>{w.week_label}</Text>
          <Text style={[styles.daysLabel, { color: colors.subtext }]}>{w.days_count} day{w.days_count !== 1 ? 's' : ''}</Text>
          <View style={styles.reportStats}>
            <ReportStat label="Received" value={w.total_received} colors={colors} color={colors.accent} />
            <ReportStat label="Dispatched" value={w.total_dispatched} colors={colors} color={colors.text} />
            <ReportStat label="Returned" value={w.total_returned} colors={colors} color={colors.success} />
          </View>
        </View>
      ))}
    </>
  );
}

function MonthlyTab({ reports, colors }: { reports: MonthlyReport[]; colors: any }) {
  if (reports.length === 0) return <EmptyState colors={colors} message="No monthly data yet. Keep tracking to see monthly summaries." />;
  return (
    <>
      {reports.map((m, i) => (
        <View key={i} style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.reportDate, { color: colors.text }]}>{m.month_label}</Text>
          <Text style={[styles.daysLabel, { color: colors.subtext }]}>{m.days_count} day{m.days_count !== 1 ? 's' : ''} tracked</Text>
          <View style={styles.reportStats}>
            <ReportStat label="Received" value={m.total_received} colors={colors} color={colors.accent} />
            <ReportStat label="Dispatched" value={m.total_dispatched} colors={colors} color={colors.text} />
            <ReportStat label="Returned" value={m.total_returned} colors={colors} color={colors.success} />
          </View>
        </View>
      ))}
    </>
  );
}

function ReportStat({ label, value, colors, color }: { label: string; value: number; colors: any; color: string }) {
  return (
    <View style={styles.reportStatItem}>
      <Text style={[styles.reportStatLabel, { color: colors.subtext }]}>{label}</Text>
      <Text style={[styles.reportStatValue, { color }]}>{value}</Text>
    </View>
  );
}

function EmptyState({ colors, message }: { colors: any; message: string }) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <BarChart3 size={40} color={colors.subtext} />
      <Text style={[styles.emptyText, { color: colors.subtext }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  screenTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  exportBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  tabBar: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9 },
  tabActive: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  tabText: { fontSize: 13, fontWeight: '600' },
  tabTextActive: { fontWeight: '700' },
  reportCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  reportCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportDateRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reportDate: { fontSize: 15, fontWeight: '700' },
  daysLabel: { fontSize: 12, fontWeight: '500', marginTop: -4 },
  deleteSmallBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  reportStats: { flexDirection: 'row', gap: 0 },
  reportStatItem: { flex: 1, alignItems: 'center', gap: 3 },
  reportStatLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  reportStatValue: { fontSize: 22, fontWeight: '800' },
  entriesCount: { fontSize: 12, fontWeight: '500', marginTop: -4 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 40, alignItems: 'center', gap: 14 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
