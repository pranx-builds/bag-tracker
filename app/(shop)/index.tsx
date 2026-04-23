import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PackagePlus, TriangleAlert, CircleCheck as CheckCircle,
  Calendar, Pencil, Bell, Sunrise, LogOut,
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useShopDashboard } from '@/hooks/useShopDashboard';
import StatCard from '@/components/StatCard';
import CollectionItem from '@/components/CollectionItem';
import LoadingScreen from '@/components/ui/LoadingScreen';
import EmptyState from '@/components/ui/EmptyState';
import StartDaySheet from '@/components/shop/StartDaySheet';
import AddCollectionSheet from '@/components/shop/AddCollectionSheet';
import EditReceivedSheet from '@/components/shop/EditReceivedSheet';
import EditEntrySheet from '@/components/shop/EditEntrySheet';
import { deleteCollectionEntry } from '@/lib/database';
import { formatDate } from '@/utils/date';
import type { CollectionEntry } from '@/types';

export default function ShopDashboard() {
  const { colors } = useTheme();
  const { session, logout } = useAuth();
  const shopId = session?.type === 'shop' ? session.shopId : '';
  const shopName = session?.type === 'shop' ? session.shopName : '';

  const { summary, loading, refreshing, pendingCount, overdueCount, today, loadData, onRefresh } =
    useShopDashboard(shopId);

  const [startDayVisible, setStartDayVisible] = useState(false);
  const [addEntryVisible, setAddEntryVisible] = useState(false);
  const [editReceivedVisible, setEditReceivedVisible] = useState(false);
  const [editEntryVisible, setEditEntryVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CollectionEntry | null>(null);

  function confirmLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  }

  function openEditEntry(entry: CollectionEntry) {
    setEditingEntry(entry);
    setEditEntryVisible(true);
  }

  async function handleDeleteEntry(id: string) {
    try {
      await deleteCollectionEntry(id);
      loadData();
    } catch {
      Alert.alert('Error', 'Failed to delete entry.');
    }
  }

  // "Missing" only applies when a return is logged but fewer bags came back than were taken.
  // Pending/overdue (no return logged yet) are handled by their own banners.
  const partialMissing = summary
    ? summary.entries
        .filter(e => e.return_logged_at !== null && e.empty_bags_returned < e.full_bags_taken)
        .reduce((s, e) => s + (e.full_bags_taken - e.empty_bags_returned), 0)
    : 0;
  const hasMissing = partialMissing > 0;
  const allGood = summary
    ? !hasMissing && overdueCount === 0 && pendingCount === 0 && summary.entries.length > 0
    : false;

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.fixedTop, { backgroundColor: colors.background }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.shopName, { color: colors.text }]}>{shopName}</Text>
            <View style={styles.dateRow}>
              <Calendar size={14} color={colors.subtext} />
              <Text style={[styles.dateText, { color: colors.subtext }]}>{formatDate(today)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: colors.cardAlt }]}
            onPress={confirmLogout}
          >
            <LogOut size={16} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        {summary && (
          <>
            {(pendingCount > 0 || overdueCount > 0) && (() => {
              const awaitingEntries = summary.entries
                .map((e, i) => ({ e, i }))
                .filter(({ e }) => e.return_logged_at === null);
              const nums = awaitingEntries.map(({ i }) => `#${i + 1}`).join(', ');
              return (
                <View style={[styles.banner, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
                  <Bell size={15} color={colors.warning} />
                  <Text style={[styles.bannerText, { color: colors.warning }]}>
                    Collection {nums} awaiting return
                  </Text>
                </View>
              );
            })()}
            {hasMissing && (
              <View style={[styles.banner, { backgroundColor: colors.errorBg, borderColor: colors.error }]}>
                <TriangleAlert size={15} color={colors.error} />
                <Text style={[styles.bannerText, { color: colors.error }]}>
                  {partialMissing} bag{partialMissing !== 1 ? 's' : ''} missing — fewer returned than taken
                </Text>
              </View>
            )}
            {allGood && (
              <View style={[styles.banner, { backgroundColor: colors.successBg, borderColor: colors.success }]}>
                <CheckCircle size={15} color={colors.success} />
                <Text style={[styles.bannerText, { color: colors.success }]}>All bags accounted for</Text>
              </View>
            )}

            <View style={styles.statsSection}>
              <View style={styles.statsHeaderRow}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Today's Summary</Text>
                <TouchableOpacity
                  style={[styles.editChip, { backgroundColor: colors.cardAlt }]}
                  onPress={() => setEditReceivedVisible(true)}
                >
                  <Pencil size={13} color={colors.accent} />
                  <Text style={[styles.editChipText, { color: colors.accent }]}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.statsGrid}>
                <StatCard label="Full Bags" value={summary.record.full_bags_received} variant="accent" />
                <StatCard label="Remaining" value={summary.remaining} variant={summary.remaining > 0 ? 'warning' : 'success'} />
              </View>
              <View style={styles.statsGrid}>
                <StatCard label="Empty Bags" value={summary.total_returned} variant="success" />
                <StatCard label="Missing" value={partialMissing} variant={partialMissing === 0 ? 'success' : 'error'} />
              </View>
            </View>

            <View style={styles.collectionsHeader}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                Collections ({summary.entries.length})
              </Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={() => setAddEntryVisible(true)}
              >
                <PackagePlus size={15} color="#FFF" />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {!summary ? (
        <View style={styles.emptyWrapper}>
          <EmptyState
            icon={PackagePlus}
            title="No Data for Today"
            description="Start the day by entering how many full bags were received."
            action={
              <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: colors.primary }]}
                onPress={() => setStartDayVisible(true)}
              >
                <Sunrise size={18} color="#FFF" />
                <Text style={styles.startBtnText}>Start Today</Text>
              </TouchableOpacity>
            }
          />
        </View>
      ) : (
        <FlatList
          data={summary.entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item, index }) => (
            <CollectionItem
              entry={item}
              index={index}
              onEdit={openEditEntry}
              onDelete={handleDeleteEntry}
              onReturnLogged={loadData}
            />
          )}
          ListEmptyComponent={
            <View style={[styles.noEntries, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.noEntriesText, { color: colors.subtext }]}>
                No collections yet. Tap "Add" to log a collection.
              </Text>
            </View>
          }
        />
      )}

      <StartDaySheet
        visible={startDayVisible}
        onClose={() => setStartDayVisible(false)}
        shopId={shopId}
        today={today}
        onSuccess={loadData}
      />
      <AddCollectionSheet
        visible={addEntryVisible}
        onClose={() => setAddEntryVisible(false)}
        shopId={shopId}
        recordId={summary?.record.id ?? ''}
        remaining={summary?.remaining ?? 0}
        today={today}
        onSuccess={loadData}
      />
      <EditReceivedSheet
        visible={editReceivedVisible}
        onClose={() => setEditReceivedVisible(false)}
        recordId={summary?.record.id ?? ''}
        currentValue={summary?.record.full_bags_received ?? 0}
        onSuccess={loadData}
      />
      <EditEntrySheet
        visible={editEntryVisible}
        onClose={() => { setEditEntryVisible(false); setEditingEntry(null); }}
        entry={editingEntry}
        onSuccess={loadData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  fixedTop: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 10 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  dateText: { fontSize: 13, fontWeight: '500' },
  logoutBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1.5 },
  bannerText: { fontSize: 13, fontWeight: '600', flex: 1 },
  statsSection: { gap: 8 },
  statsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 15, fontWeight: '700' },
  editChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  editChipText: { fontSize: 12, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  collectionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8 },
  addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  emptyWrapper: { flex: 1, padding: 16, justifyContent: 'center' },
  startBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8, flexDirection: 'row', gap: 8, alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  noEntries: { borderRadius: 12, borderWidth: 1, padding: 20, alignItems: 'center' },
  noEntriesText: { fontSize: 14, textAlign: 'center' },
});
