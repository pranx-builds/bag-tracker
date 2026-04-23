import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  ShieldCheck, Package, Store, TriangleAlert,
  CircleCheck as CheckCircle, Calendar,
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import StatCard from '@/components/StatCard';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { getAllShopsTodaySummary } from '@/lib/database';
import { getTodayDate, formatDate } from '@/utils/date';
import type { ShopTodaySummary } from '@/types';

export default function AdminDashboard() {
  const { colors } = useTheme();
  const [summaries, setSummaries] = useState<ShopTodaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const today = getTodayDate();

  const loadData = useCallback(async () => {
    try {
      const data = await getAllShopsTodaySummary();
      setSummaries(data);
    } catch (err) {
      // error logged by caller
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

  const totalReceived = summaries.reduce((s, x) => s + (x.record?.full_bags_received ?? 0), 0);
  const totalDispatched = summaries.reduce((s, x) => s + x.total_dispatched, 0);
  const totalReturned = summaries.reduce((s, x) => s + x.total_returned, 0);
  const activeShops = summaries.filter((x) => x.record !== null).length;

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.headerRow}>
          <View>
            <View style={styles.titleRow}>
              <ShieldCheck size={22} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Admin Overview</Text>
            </View>
            <View style={styles.dateRow}>
              <Calendar size={13} color={colors.subtext} />
              <Text style={[styles.dateText, { color: colors.subtext }]}>{formatDate(today)}</Text>
            </View>
          </View>
          <View style={[styles.adminBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
            <ShieldCheck size={13} color={colors.primary} />
            <Text style={[styles.adminBadgeText, { color: colors.primary }]}>Admin</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Totals</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Full Bags" value={totalReceived} variant="accent" />
            <StatCard label="Collected" value={totalDispatched} variant="default" />
          </View>
          <View style={styles.statsGrid}>
            <StatCard label="Empty Bags" value={totalReturned} variant="success" />
            <StatCard label="Active Shops" value={activeShops} variant="warning" />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Shops Today ({summaries.length})
        </Text>

        {summaries.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Store size={36} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              No shops yet. Go to the Shops tab to create one.
            </Text>
          </View>
        ) : (
          summaries.map(({ shop, record, total_dispatched, total_returned, entries_count, partial_missing }) => {
            const hasMissing = partial_missing > 0;
            return (
              <View
                key={shop.id}
                style={[
                  styles.shopCard,
                  { backgroundColor: colors.card, borderColor: hasMissing ? colors.error : colors.border },
                ]}
              >
                <View style={styles.shopCardHeader}>
                  <View style={styles.shopNameRow}>
                    <View style={[styles.shopDot, { backgroundColor: shop.is_active ? colors.success : colors.subtext }]} />
                    <Text style={[styles.shopName, { color: colors.text }]}>{shop.name}</Text>
                  </View>
                  {hasMissing ? (
                    <View style={[styles.badge, { backgroundColor: colors.errorBg, borderColor: colors.error }]}>
                      <TriangleAlert size={11} color={colors.error} />
                      <Text style={[styles.badgeText, { color: colors.error }]}>{partial_missing} Missing</Text>
                    </View>
                  ) : entries_count > 0 ? (
                    <View style={[styles.badge, { backgroundColor: colors.successBg, borderColor: colors.success }]}>
                      <CheckCircle size={11} color={colors.success} />
                      <Text style={[styles.badgeText, { color: colors.success }]}>OK</Text>
                    </View>
                  ) : null}
                </View>

                {record ? (
                  <View style={styles.shopStats}>
                    <ShopStat label="Full Bags" value={record.full_bags_received} color={colors.accent} subtext={colors.subtext} />
                    <ShopStat label="Remaining" value={record.full_bags_received - total_dispatched} color={colors.warning} subtext={colors.subtext} />
                    <ShopStat label="Empty Bags" value={total_returned} color={colors.success} subtext={colors.subtext} />
                    <ShopStat label="Missing" value={partial_missing} color={partial_missing > 0 ? colors.error : colors.success} subtext={colors.subtext} />
                  </View>
                ) : (
                  <Text style={[styles.noRecord, { color: colors.subtext }]}>No activity today</Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ShopStat({ label, value, color, subtext }: { label: string; value: number; color: string; subtext: string }) {
  return (
    <View style={styles.shopStatItem}>
      <Text style={[styles.shopStatLabel, { color: subtext }]}>{label}</Text>
      <Text style={[styles.shopStatValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 40 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  dateText: { fontSize: 13 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  adminBadgeText: { fontSize: 12, fontWeight: '700' },

  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: 10 },

  sectionLabel: { fontSize: 15, fontWeight: '700', marginTop: 2 },

  shopCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 10 },
  shopCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shopDot: { width: 8, height: 8, borderRadius: 4 },
  shopName: { fontSize: 15, fontWeight: '700' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  shopStats: { flexDirection: 'row' },
  shopStatItem: { flex: 1, alignItems: 'center', gap: 2 },
  shopStatLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  shopStatValue: { fontSize: 20, fontWeight: '800' },
  noRecord: { fontSize: 13, fontStyle: 'italic' },

  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
