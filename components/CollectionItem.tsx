import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  TextInput, ActivityIndicator,
} from 'react-native';
import { Package, PackageOpen, Clock, Pencil, Trash2, RotateCcw, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import type { CollectionEntry } from '@/types';
import { formatDateTime, logEmptyBagReturn } from '@/lib/database';
import { getSetting } from '@/lib/settings';
import { logger } from '@/lib/logger';
import BottomSheet from '@/components/ui/BottomSheet';

interface CollectionItemProps {
  entry: CollectionEntry;
  index: number;
  onEdit: (entry: CollectionEntry) => void;
  onDelete: (id: string) => void;
  onReturnLogged: () => void;
}

function useCountdown(timestamp: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const windowMs = getSetting('returnWindowMinutes') * 60 * 1000;
  const expiresAt = new Date(timestamp).getTime() + windowMs;
  const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
  return { secondsLeft, isPending: now < expiresAt, isOverdue: now >= expiresAt };
}

function formatCountdown(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function CollectionItem({ entry, index, onEdit, onDelete, onReturnLogged }: CollectionItemProps) {
  const { colors } = useTheme();
  const hasReturn = entry.return_logged_at !== null;
  const { secondsLeft, isPending, isOverdue } = useCountdown(entry.timestamp);
  const showCountdown = getSetting('showCountdownTimer');

  const [modalVisible, setModalVisible] = useState(false);
  const [returnValue, setReturnValue] = useState('');
  const [saving, setSaving] = useState(false);

  const needsReturn = !hasReturn;
  const showReminder = needsReturn && isPending;
  const showOverdue = needsReturn && isOverdue;
  const isMissing = hasReturn && entry.empty_bags_returned < entry.full_bags_taken;

  const borderColor = showOverdue ? colors.error : isMissing ? colors.error : showReminder ? colors.warning : hasReturn ? colors.success : colors.border;

  function handleDelete() {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this collection entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry.id) },
    ]);
  }

  function openReturn() {
    setReturnValue(String(entry.full_bags_taken));
    setModalVisible(true);
  }

  async function saveReturn() {
    const val = parseInt(returnValue, 10);
    if (isNaN(val) || val < 0) { Alert.alert('Invalid', 'Please enter a valid number.'); return; }
    setSaving(true);
    try {
      await logEmptyBagReturn(entry.id, val);
      setModalVisible(false);
      onReturnLogged();
    } catch (err) {
      logger.error('logEmptyBagReturn:', err);
      Alert.alert('Error', 'Failed to log return. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.card, borderColor }, showOverdue && { backgroundColor: colors.errorBg }]}>
        <View style={[styles.indexBadge, { backgroundColor: showOverdue ? colors.error + '22' : colors.cardAlt }]}>
          <Text style={[styles.indexText, { color: showOverdue ? colors.error : colors.accent }]}>#{index + 1}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.timeRow}>
            <Clock size={13} color={colors.subtext} />
            <Text style={[styles.timeText, { color: colors.subtext }]}>{formatDateTime(entry.timestamp)}</Text>
            {showCountdown && showReminder && (
              <View style={[styles.badge, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
                <Text style={[styles.badgeText, { color: colors.warning }]}>⏱ {formatCountdown(secondsLeft)}</Text>
              </View>
            )}
            {showOverdue && (
              <View style={[styles.badge, { backgroundColor: colors.errorBg, borderColor: colors.error }]}>
                <AlertTriangle size={11} color={colors.error} />
                <Text style={[styles.badgeText, { color: colors.error }]}>Overdue</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Package size={14} color={colors.accent} />
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Collected</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{entry.full_bags_taken}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <PackageOpen size={14} color={hasReturn ? colors.success : colors.subtext} />
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Empty Bags</Text>
              <Text style={[styles.statValue, { color: hasReturn ? colors.success : colors.subtext }]}>
                {hasReturn ? entry.empty_bags_returned : '—'}
              </Text>
            </View>
          </View>

          {entry.notes ? (
            <Text style={[styles.notes, { color: colors.subtext }]} numberOfLines={1}>{entry.notes}</Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          {needsReturn && (
            <TouchableOpacity style={[styles.returnBtn, { backgroundColor: showOverdue ? colors.error : colors.warning }]} onPress={openReturn}>
              <RotateCcw size={13} color="#FFF" />
              <Text style={styles.returnBtnText}>Return</Text>
            </TouchableOpacity>
          )}
          <View style={styles.iconActions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.cardAlt }]} onPress={() => onEdit(entry)}>
              <Pencil size={14} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.errorBg }]} onPress={handleDelete}>
              <Trash2 size={14} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <BottomSheet visible={modalVisible} onClose={() => setModalVisible(false)}>
        <View style={styles.sheetTitleRow}>
          <RotateCcw size={20} color={colors.success} />
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Log Empty Bag Return</Text>
        </View>
        <Text style={[styles.sheetSubtitle, { color: colors.subtext }]}>
          Collection #{index + 1} · {formatDateTime(entry.timestamp)} · {entry.full_bags_taken} taken
        </Text>
        <Text style={[styles.inputLabel, { color: colors.subtext }]}>Empty Bags Returned</Text>
        <TextInput
          style={[styles.bigInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
          keyboardType="numeric"
          value={returnValue}
          onChangeText={setReturnValue}
          autoFocus
          maxLength={4}
          selectTextOnFocus
        />
        <Text style={[styles.hint, { color: colors.subtext }]}>
          Pre-filled with bags taken ({entry.full_bags_taken}) — adjust if needed
        </Text>
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border }]} onPress={() => setModalVisible(false)}>
            <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.success }, saving && { opacity: 0.5 }]}
            onPress={saveReturn}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#FFF" />
              : <><RotateCcw size={15} color="#FFF" /><Text style={[styles.btnText, { color: '#FFF' }]}>Confirm Return</Text></>}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </>
  );
}

export default React.memo(CollectionItem);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 12, borderWidth: 1.5, padding: 12, gap: 10, marginBottom: 8 },
  indexBadge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  indexText: { fontSize: 12, fontWeight: '700' },
  body: { flex: 1, gap: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  timeText: { fontSize: 12, fontWeight: '500' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 15, fontWeight: '700' },
  divider: { width: 1, height: 16 },
  notes: { fontSize: 11, fontStyle: 'italic' },
  actions: { flexShrink: 0, alignItems: 'flex-end', gap: 6 },
  returnBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7 },
  returnBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  iconActions: { flexDirection: 'row', gap: 5 },
  actionBtn: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetTitle: { fontSize: 17, fontWeight: '700' },
  sheetSubtitle: { fontSize: 13, marginTop: -4 },
  inputLabel: { fontSize: 13, fontWeight: '600' },
  bigInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 42, fontWeight: '800', textAlign: 'center' },
  hint: { fontSize: 12, textAlign: 'center', marginTop: -6 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  btnText: { fontSize: 15, fontWeight: '700' },
});
