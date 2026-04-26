import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Share, Alert, ActivityIndicator,
} from 'react-native';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useFocusEffect } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChartBar as BarChart3, Calendar, CalendarDays, CalendarRange,
  Share2, Trash2, TriangleAlert, CircleCheck as CheckCircle,
  Store, ChevronLeft,
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import {
  getAllShops, getDailyReports, getWeeklyReports, getMonthlyReports,
  generateCsvReport, deleteDailyRecord,
} from '@/lib/database';
import { formatDate } from '@/utils/date';
import type { Shop, DaySummary, WeeklyReport, MonthlyReport } from '@/types';

type ReportTab = 'daily' | 'weekly' | 'monthly';

export default function AdminReportsScreen() {
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [loadingShops, setLoadingShops] = useState(true);

  const [activeTab, setActiveTab] = useState<ReportTab>('daily');
  const [dailyReports, setDailyReports] = useState<DaySummary[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoadingShops(true);
      setSelectedShop(null);
      getAllShops()
        .then(setShops)
        .catch(console.error)
        .finally(() => setLoadingShops(false));
    }, [])
  );

  async function selectShop(shop: Shop) {
    setSelectedShop(shop);
    setActiveTab('daily');
    setLoadingReports(true);
    try {
      const [daily, weekly, monthly] = await Promise.all([
        getDailyReports(shop.id),
        getWeeklyReports(shop.id),
        getMonthlyReports(shop.id),
      ]);
      setDailyReports(daily);
      setWeeklyReports(weekly);
      setMonthlyReports(monthly);
    } catch (err) {
      Alert.alert('Error', 'Failed to load reports.');
    } finally {
      setLoadingReports(false);
    }
  }

  async function handleExport() {
    if (!selectedShop) return;
    setExporting(true);
    try {
      const csv = await generateCsvReport(selectedShop.id);
      await Share.share({ message: csv, title: `${selectedShop.name} — Report` });
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
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await deleteDailyRecord(id);
              if (selectedShop) selectShop(selectedShop);
            } catch {
              Alert.alert('Error', 'Failed to delete record.');
            }
          },
        },
      ]
    );
  }

  if (loadingShops) return <LoadingScreen />;

  // ── Shop picker ───────────────────────────────────────────────────────────
  if (!selectedShop) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 16 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <BarChart3 size={22} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Reports</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>Select a shop to view its reports</Text>

          {shops.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Store size={36} color={colors.subtext} />
              <Text style={[styles.emptyText, { color: colors.subtext }]}>No shops yet.</Text>
            </View>
          ) : (
            shops.map((shop) => (
              <TouchableOpacity
                key={shop.id}
                style={[styles.shopRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => selectShop(shop)}
                activeOpacity={0.8}
              >
                <View style={styles.shopRowLeft}>
                  <View style={[styles.dot, { backgroundColor: shop.is_active ? colors.success : colors.subtext }]} />
                  <Text style={[styles.shopName, { color: colors.text }]}>{shop.name}</Text>
                </View>
                <BarChart3 size={16} color={colors.subtext} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Shop reports ──────────────────────────────────────────────────────────
  const tabs: { key: ReportTab; label: string; icon: any }[] = [
    { key: 'daily', label: 'Daily', icon: Calendar },
    { key: 'weekly', label: 'Weekly', icon: CalendarDays },
    { key: 'monthly', label: 'Monthly', icon: CalendarRange },
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header with back + export */}
        <View style={styles.shopHeader}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setSelectedShop(null)}
          >
            <ChevronLeft size={18} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>All Shops</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.primary }, exporting && { opacity: 0.5 }]}
            onPress={handleExport}
            disabled={exporting}
          >
            <Share2 size={13} color="#FFF" />
            <Text style={styles.exportBtnText}>{exporting ? '…' : 'CSV'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.shopTitleRow}>
          <View style={[styles.dot, { backgroundColor: selectedShop.is_active ? colors.success : colors.subtext }]} />
          <Text style={[styles.shopTitle, { color: colors.text }]}>{selectedShop.name}</Text>
        </View>

        {loadingReports ? (
          <View style={styles.reportLoader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
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
                    <Text style={[styles.tabText, { color: active ? colors.primary : colors.subtext }, active && styles.tabTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {activeTab === 'daily' && <DailyTab reports={dailyReports} colors={colors} onDelete={handleDeleteDay} />}
            {activeTab === 'weekly' && <WeeklyTab reports={weeklyReports} colors={colors} />}
            {activeTab === 'monthly' && <MonthlyTab reports={monthlyReports} colors={colors} />}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DailyTab({ reports, colors, onDelete }: { reports: DaySummary[]; colors: any; onDelete: (id: string, date: string) => void }) {
  if (reports.length === 0) return <EmptyState colors={colors} message="No daily records for this shop yet." />;
  return (
    <>
      {reports.map((s) => (
        <View key={s.record.id} style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reportCardHeader}>
            <View style={styles.reportDateRow}>
              {s.has_missing ? <TriangleAlert size={15} color={colors.error} /> : <CheckCircle size={15} color={colors.success} />}
              <Text style={[styles.reportDate, { color: colors.text }]}>{formatDate(s.record.date)}</Text>
            </View>
            <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: colors.errorBg }]} onPress={() => onDelete(s.record.id, s.record.date)}>
              <Trash2 size={14} color={colors.error} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.entriesCount, { color: colors.subtext }]}>{s.entries.length} collection{s.entries.length !== 1 ? 's' : ''}</Text>
          <View style={styles.reportStats}>
            <ReportStat label="Full Bags" value={s.record.full_bags_received} colors={colors} color={colors.accent} />
            <ReportStat label="Collected" value={s.total_dispatched} colors={colors} color={colors.text} />
            <ReportStat label="Empty Bags" value={s.total_returned} colors={colors} color={colors.success} />
            <ReportStat label="Missing" value={s.missing} colors={colors} color={s.missing === 0 ? colors.success : colors.error} />
          </View>
        </View>
      ))}
    </>
  );
}

function WeeklyTab({ reports, colors }: { reports: WeeklyReport[]; colors: any }) {
  if (reports.length === 0) return <EmptyState colors={colors} message="No weekly data for this shop yet." />;
  return (
    <>
      {reports.map((w, i) => (
        <View key={i} style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.reportDate, { color: colors.text }]}>{w.week_label}</Text>
          <Text style={[styles.daysLabel, { color: colors.subtext }]}>{w.days_count} day{w.days_count !== 1 ? 's' : ''}</Text>
          <View style={styles.reportStats}>
            <ReportStat label="Full Bags" value={w.total_received} colors={colors} color={colors.accent} />
            <ReportStat label="Collected" value={w.total_dispatched} colors={colors} color={colors.text} />
            <ReportStat label="Empty Bags" value={w.total_returned} colors={colors} color={colors.success} />
          </View>
        </View>
      ))}
    </>
  );
}

function MonthlyTab({ reports, colors }: { reports: MonthlyReport[]; colors: any }) {
  if (reports.length === 0) return <EmptyState colors={colors} message="No monthly data for this shop yet." />;
  return (
    <>
      {reports.map((m, i) => (
        <View key={i} style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.reportDate, { color: colors.text }]}>{m.month_label}</Text>
          <Text style={[styles.daysLabel, { color: colors.subtext }]}>{m.days_count} day{m.days_count !== 1 ? 's' : ''} tracked</Text>
          <View style={styles.reportStats}>
            <ReportStat label="Full Bags" value={m.total_received} colors={colors} color={colors.accent} />
            <ReportStat label="Collected" value={m.total_dispatched} colors={colors} color={colors.text} />
            <ReportStat label="Empty Bags" value={m.total_returned} colors={colors} color={colors.success} />
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
      <BarChart3 size={36} color={colors.subtext} />
      <Text style={[styles.emptyText, { color: colors.subtext }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  reportLoader: { height: 200, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: -4 },

  shopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, padding: 16 },
  shopRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  shopName: { fontSize: 16, fontWeight: '700' },

  shopHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  backText: { fontSize: 14, fontWeight: '600' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  exportBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  shopTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shopTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },

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
  deleteBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  reportStats: { flexDirection: 'row' },
  reportStatItem: { flex: 1, alignItems: 'center', gap: 3 },
  reportStatLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  reportStatValue: { fontSize: 20, fontWeight: '800' },
  entriesCount: { fontSize: 12, fontWeight: '500', marginTop: -4 },

  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
