import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Modal, TextInput, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Package, PackagePlus, TriangleAlert, CircleCheck as CheckCircle,
  Calendar, Pencil, Bell, Truck, FileText, Clock, Sunrise,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/lib/theme';
import StatCard from '@/components/StatCard';
import CollectionItem from '@/components/CollectionItem';
import {
  getDaySummary, getTodayDate, formatDate,
  updateDailyRecord, deleteCollectionEntry, updateCollectionEntry,
  getPendingReturns, getOverdueReturns, createDailyRecord, addCollectionEntry,
} from '@/lib/database';
import { getSetting } from '@/lib/settings';
import type { DaySummary, CollectionEntry } from '@/types';

export default function DashboardScreen() {
  const { colors } = useTheme();

  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [userName, setUserName] = useState('');

  // Edit Received modal
  const [editReceivedVisible, setEditReceivedVisible] = useState(false);
  const [editReceivedValue, setEditReceivedValue] = useState('');

  // Edit Entry modal
  const [editEntryVisible, setEditEntryVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CollectionEntry | null>(null);
  const [editTaken, setEditTaken] = useState('');
  const [editReturned, setEditReturned] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Add Entry modal
  const [addEntryVisible, setAddEntryVisible] = useState(false);
  const [addTaken, setAddTaken] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addTime, setAddTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  // Start Day modal
  const [startDayVisible, setStartDayVisible] = useState(false);
  const [startDayValue, setStartDayValue] = useState('');
  const [startLoading, setStartLoading] = useState(false);

  const today = getTodayDate();

  const loadData = useCallback(() => {
    try {
      const s = getDaySummary(today);
      setSummary(s);
      if (s) {
        setPendingCount(getPendingReturns(s.record.id).length);
        setOverdueCount(getOverdueReturns(s.record.id).length);
      } else {
        setPendingCount(0);
        setOverdueCount(0);
      }
      setUserName(getSetting('userName'));
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  // Refresh pending/overdue counts every 30s
  useEffect(() => {
    const id = setInterval(() => {
      if (summary) {
        setPendingCount(getPendingReturns(summary.record.id).length);
        setOverdueCount(getOverdueReturns(summary.record.id).length);
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [summary]);

  function onRefresh() {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }

  // ── Edit Received ──────────────────────────────────────────────────────────
  function openEditReceived() {
    if (!summary) return;
    setEditReceivedValue(String(summary.record.full_bags_received));
    setEditReceivedVisible(true);
  }
  function saveEditReceived() {
    const val = parseInt(editReceivedValue, 10);
    if (isNaN(val) || val < 0) { Alert.alert('Invalid Value', 'Please enter a valid number.'); return; }
    try {
      updateDailyRecord(summary!.record.id, val);
      setEditReceivedVisible(false);
      loadData();
    } catch { Alert.alert('Error', 'Failed to update bag count.'); }
  }

  // ── Edit Entry ─────────────────────────────────────────────────────────────
  function openEditEntry(entry: CollectionEntry) {
    setEditingEntry(entry);
    setEditTaken(String(entry.full_bags_taken));
    setEditReturned(String(entry.empty_bags_returned));
    setEditNotes(entry.notes ?? '');
    setEditEntryVisible(true);
  }
  function saveEditEntry() {
    if (!editingEntry) return;
    const taken = parseInt(editTaken, 10);
    const returned = parseInt(editReturned, 10);
    if (isNaN(taken) || taken < 0 || isNaN(returned) || returned < 0) {
      Alert.alert('Invalid Values', 'Please enter valid numbers.'); return;
    }
    try {
      updateCollectionEntry(editingEntry.id, taken, returned, editNotes);
      setEditEntryVisible(false);
      setEditingEntry(null);
      loadData();
    } catch { Alert.alert('Error', 'Failed to update entry.'); }
  }

  function handleDeleteEntry(id: string) {
    try { deleteCollectionEntry(id); loadData(); }
    catch { Alert.alert('Error', 'Failed to delete entry.'); }
  }

  // ── Add Entry ──────────────────────────────────────────────────────────────
  function openAddEntry() {
    setAddTaken('');
    setAddNotes(getSetting('defaultNotes'));
    setAddTime(new Date());
    setShowTimePicker(false);
    setAddEntryVisible(true);
  }
  function handleAddEntry() {
    const taken = parseInt(addTaken, 10);
    if (isNaN(taken) || taken <= 0) { Alert.alert('Invalid Input', 'Please enter how many full bags were taken.'); return; }
    setAddLoading(true);
    try {
      const ts = new Date(today + 'T00:00:00');
      ts.setHours(addTime.getHours(), addTime.getMinutes(), 0, 0);
      addCollectionEntry(summary!.record.id, taken, addNotes.trim(), ts.toISOString());
      setAddEntryVisible(false);
      loadData();
    } catch { Alert.alert('Error', 'Failed to add collection entry.'); }
    finally { setAddLoading(false); }
  }

  // ── Start Day ──────────────────────────────────────────────────────────────
  function openStartDay() {
    setStartDayValue('');
    setStartDayVisible(true);
  }
  function handleStartDay() {
    const val = parseInt(startDayValue, 10);
    if (isNaN(val) || val < 0) { Alert.alert('Invalid Input', 'Please enter a valid number of bags received.'); return; }
    setStartLoading(true);
    try {
      createDailyRecord(today, val);
      setStartDayVisible(false);
      loadData();
    } catch { Alert.alert('Error', 'Failed to start the day.'); }
    finally { setStartLoading(false); }
  }

  function formatTime(d: Date): string {
    const use24 = getSetting('use24HourTime');
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !use24 });
  }

  const hasMismatch = summary ? summary.has_mismatch && summary.entries.length > 0 : false;
  const allGood = summary ? !summary.has_mismatch && summary.entries.length > 0 : false;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>

      {/* ── Fixed top section ──────────────────────────────────────────────── */}
      <View style={[styles.fixedTop, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.appName, { color: colors.text }]}>
              {userName ? `Hi, ${userName} 👋` : 'Bag Tracker'}
            </Text>
            <View style={styles.dateRow}>
              <Calendar size={14} color={colors.subtext} />
              <Text style={[styles.dateText, { color: colors.subtext }]}>{formatDate(today)}</Text>
            </View>
          </View>
          <Package size={28} color={colors.primary} />
        </View>

        {summary && (
          <>
            {/* Status banners */}
            {overdueCount > 0 && (
              <View style={[styles.banner, { backgroundColor: colors.errorBg, borderColor: colors.error }]}>
                <TriangleAlert size={15} color={colors.error} />
                <Text style={[styles.bannerText, { color: colors.error }]}>
                  {overdueCount} return{overdueCount > 1 ? 's' : ''} overdue
                </Text>
              </View>
            )}
            {pendingCount > 0 && overdueCount === 0 && (
              <View style={[styles.banner, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
                <Bell size={15} color={colors.warning} />
                <Text style={[styles.bannerText, { color: colors.warning }]}>
                  {pendingCount} collection{pendingCount > 1 ? 's' : ''} awaiting return
                </Text>
              </View>
            )}
            {hasMismatch && (
              <View style={[styles.banner, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
                <TriangleAlert size={15} color={colors.warning} />
                <Text style={[styles.bannerText, { color: colors.warning }]}>
                  Mismatch — {Math.abs(summary.difference)} bag{Math.abs(summary.difference) !== 1 ? 's' : ''} unaccounted
                </Text>
              </View>
            )}
            {allGood && overdueCount === 0 && pendingCount === 0 && (
              <View style={[styles.banner, { backgroundColor: colors.successBg, borderColor: colors.success }]}>
                <CheckCircle size={15} color={colors.success} />
                <Text style={[styles.bannerText, { color: colors.success }]}>All bags accounted for</Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsSection}>
              <View style={styles.statsHeaderRow}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>Today's Summary</Text>
                <TouchableOpacity style={[styles.editChip, { backgroundColor: colors.cardAlt }]} onPress={openEditReceived}>
                  <Pencil size={13} color={colors.accent} />
                  <Text style={[styles.editChipText, { color: colors.accent }]}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.statsGrid}>
                <StatCard label="Received" value={summary.record.full_bags_received} variant="accent" />
                <StatCard label="Dispatched" value={summary.total_dispatched} variant="default" />
              </View>
              <View style={styles.statsGrid}>
                <StatCard label="Returned" value={summary.total_returned} variant="success" />
                <StatCard
                  label="Difference"
                  value={summary.difference}
                  variant={summary.difference === 0 ? 'success' : summary.difference > 0 ? 'warning' : 'error'}
                />
              </View>
            </View>

            {/* Collections header */}
            <View style={styles.collectionsHeader}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                Collections ({summary.entries.length})
              </Text>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAddEntry}>
                <PackagePlus size={15} color="#FFF" />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* ── Scrollable list ────────────────────────────────────────────────── */}
      {!summary ? (
        <View style={styles.emptyWrapper}>
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <PackagePlus size={48} color={colors.subtext} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Data for Today</Text>
            <Text style={[styles.emptyDesc, { color: colors.subtext }]}>
              Start the day by entering how many full bags were received.
            </Text>
            <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.primary }]} onPress={openStartDay}>
              <Sunrise size={18} color="#FFF" />
              <Text style={styles.startBtnText}>Start Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={summary.entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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

      {/* ── Add Entry Sheet ────────────────────────────────────────────────── */}
      <Modal visible={addEntryVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setAddEntryVisible(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeaderRow}>
              <View style={styles.sheetTitleRow}>
                <Truck size={20} color={colors.accent} />
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Collection</Text>
              </View>
              {summary && (
                <View style={[styles.chip, { backgroundColor: colors.cardAlt }]}>
                  <Text style={[styles.chipText, { color: summary.difference >= 0 ? colors.success : colors.error }]}>
                    {summary.difference} remaining
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Full Bags Taken</Text>
            <TextInput
              style={[styles.bigInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              keyboardType="numeric"
              value={addTaken}
              onChangeText={setAddTaken}
              placeholder="0"
              placeholderTextColor={colors.subtext}
              autoFocus
              maxLength={5}
              selectTextOnFocus
            />

            <View style={styles.fieldLabelRow}>
              <Clock size={14} color={colors.subtext} />
              <Text style={[styles.inputLabel, { color: colors.subtext }]}>Collection Time</Text>
            </View>
            <TouchableOpacity
              style={[styles.timeBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Clock size={16} color={colors.accent} />
              <Text style={[styles.timeValue, { color: colors.text }]}>{formatTime(addTime)}</Text>
              <Text style={[styles.timeTapHint, { color: colors.subtext }]}>tap to change</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={addTime}
                mode="time"
                is24Hour={getSetting('use24HourTime')}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selected) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selected) setAddTime(selected);
                }}
              />
            )}

            <View style={styles.fieldLabelRow}>
              <FileText size={14} color={colors.subtext} />
              <Text style={[styles.inputLabel, { color: colors.subtext }]}>Notes (optional)</Text>
            </View>
            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={addNotes}
              onChangeText={setAddNotes}
              placeholder="Driver name, route, remarks..."
              placeholderTextColor={colors.subtext}
              multiline
              numberOfLines={2}
            />

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border }]} onPress={() => setAddEntryVisible(false)}>
                <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }, addLoading && styles.btnDisabled]}
                onPress={handleAddEntry}
                disabled={addLoading}
              >
                {addLoading
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <><Truck size={16} color="#FFF" /><Text style={[styles.btnText, { color: '#FFF' }]}>Save Collection</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Start Day Sheet ────────────────────────────────────────────────── */}
      <Modal visible={startDayVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setStartDayVisible(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetTitleRow}>
              <Sunrise size={20} color={colors.accent} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Start Today's Record</Text>
            </View>
            <Text style={[styles.sheetDesc, { color: colors.subtext }]}>
              Enter the total number of full bags received at the start of the day.
            </Text>
            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Full Bags Received</Text>
            <TextInput
              style={[styles.bigInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              keyboardType="numeric"
              value={startDayValue}
              onChangeText={setStartDayValue}
              placeholder="0"
              placeholderTextColor={colors.subtext}
              autoFocus
              maxLength={6}
            />
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border }]} onPress={() => setStartDayVisible(false)}>
                <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }, startLoading && styles.btnDisabled]}
                onPress={handleStartDay}
                disabled={startLoading}
              >
                {startLoading
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <><Sunrise size={16} color="#FFF" /><Text style={[styles.btnText, { color: '#FFF' }]}>Start Day</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Received Sheet ────────────────────────────────────────────── */}
      <Modal visible={editReceivedVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setEditReceivedVisible(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetTitleRow}>
              <Pencil size={20} color={colors.accent} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Edit Bags Received</Text>
            </View>
            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Full Bags Received</Text>
            <TextInput
              style={[styles.bigInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              keyboardType="numeric"
              value={editReceivedValue}
              onChangeText={setEditReceivedValue}
              placeholder="0"
              placeholderTextColor={colors.subtext}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border }]} onPress={() => setEditReceivedVisible(false)}>
                <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={saveEditReceived}>
                <Text style={[styles.btnText, { color: '#FFF' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Entry Sheet ───────────────────────────────────────────────── */}
      <Modal visible={editEntryVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setEditEntryVisible(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetTitleRow}>
              <Pencil size={20} color={colors.accent} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Edit Collection</Text>
            </View>
            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Full Bags Taken</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              keyboardType="numeric" value={editTaken} onChangeText={setEditTaken}
              placeholder="0" placeholderTextColor={colors.subtext}
            />
            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Empty Bags Returned</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              keyboardType="numeric" value={editReturned} onChangeText={setEditReturned}
              placeholder="0" placeholderTextColor={colors.subtext}
            />
            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Notes</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={editNotes} onChangeText={setEditNotes}
              placeholder="Driver name, route..." placeholderTextColor={colors.subtext}
            />
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border }]} onPress={() => { setEditEntryVisible(false); setEditingEntry(null); }}>
                <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={saveEditEntry}>
                <Text style={[styles.btnText, { color: '#FFF' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Fixed top
  fixedTop: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 10 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  dateText: { fontSize: 13, fontWeight: '500' },
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

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  emptyWrapper: { flex: 1, padding: 16 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center', gap: 12, marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  startBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8, flexDirection: 'row', gap: 8, alignItems: 'center' },
  startBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  noEntries: { borderRadius: 12, borderWidth: 1, padding: 20, alignItems: 'center' },
  noEntriesText: { fontSize: 14, textAlign: 'center' },

  // Shared bottom sheet
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderBottomWidth: 0, padding: 24, paddingBottom: 40, gap: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  sheetDesc: { fontSize: 14, lineHeight: 20 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  chipText: { fontSize: 13, fontWeight: '700' },
  inputLabel: { fontSize: 13, fontWeight: '600' },
  bigInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 42, fontWeight: '800', textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '600' },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  timeValue: { fontSize: 20, fontWeight: '700', flex: 1 },
  timeTapHint: { fontSize: 12 },
  notesInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, textAlignVertical: 'top', minHeight: 64 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  btnText: { fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
