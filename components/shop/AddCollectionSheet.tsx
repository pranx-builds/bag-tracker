import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { Truck, Clock, FileText, QrCode } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/lib/theme';
import BottomSheet from '@/components/ui/BottomSheet';
import { addCollectionEntry } from '@/lib/database';
import { getSetting } from '@/lib/settings';

interface Props {
  visible: boolean;
  onClose: () => void;
  shopId: string;
  recordId: string;
  remaining: number;
  today: string;
  onSuccess: () => void;
  driverId?: string;
}

export default function AddCollectionSheet({ visible, onClose, shopId, recordId, remaining, today, onSuccess, driverId }: Props) {
  const { colors } = useTheme();
  const [taken, setTaken] = useState('');
  const [notes, setNotes] = useState(() => getSetting('defaultNotes'));
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setTime(new Date());
      setTaken('');
      setNotes(getSetting('defaultNotes'));
      setShowTimePicker(false);
    }
  }, [visible]);

  const takenVal = parseInt(taken, 10);
  const exceedsRemaining = !isNaN(takenVal) && takenVal > remaining;

  function formatTime(d: Date): string {
    const use24 = getSetting('use24HourTime');
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !use24 });
  }

  async function handleSave() {
    const val = parseInt(taken, 10);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Input', 'Please enter how many full bags were taken.');
      return;
    }
    if (val > remaining) {
      Alert.alert('Exceeds Remaining', `Only ${remaining} bag${remaining !== 1 ? 's' : ''} remaining. You cannot collect more than what's available.`);
      return;
    }
    setSaving(true);
    try {
      const ts = new Date(today + 'T00:00:00');
      ts.setHours(time.getHours(), time.getMinutes(), 0, 0);
      const finalNotes = driverId
        ? driverId + (notes.trim() ? '\n' + notes.trim() : '')
        : notes.trim();
      await addCollectionEntry(shopId, recordId, val, finalNotes, ts.toISOString());
      setTaken('');
      setNotes(getSetting('defaultNotes'));
      setTime(new Date());
      onClose();
      onSuccess();
    } catch {
      Alert.alert('Error', 'Failed to add entry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Truck size={20} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>Add Collection</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.cardAlt }]}>
          <Text style={[styles.chipText, { color: remaining >= 0 ? colors.success : colors.error }]}>
            {remaining} remaining
          </Text>
        </View>
      </View>

      {driverId ? (
        <View style={[styles.driverRow, { backgroundColor: colors.successBg, borderColor: colors.success }]}>
          <QrCode size={16} color={colors.success} />
          <Text style={[styles.driverText, { color: colors.success }]}>Driver ID: {driverId}</Text>
        </View>
      ) : null}

      <Text style={[styles.label, { color: colors.subtext }]}>Full Bags Collected</Text>
      <TextInput
        style={[styles.bigInput, { backgroundColor: colors.inputBg, borderColor: exceedsRemaining ? colors.error : colors.border, color: exceedsRemaining ? colors.error : colors.text }]}
        keyboardType="numeric"
        value={taken}
        onChangeText={setTaken}
        placeholder="0"
        placeholderTextColor={colors.subtext}
        autoFocus
        maxLength={5}
        selectTextOnFocus
      />
      {exceedsRemaining && (
        <Text style={[styles.errorHint, { color: colors.error }]}>
          Cannot exceed {remaining} remaining bag{remaining !== 1 ? 's' : ''}
        </Text>
      )}

      <View style={styles.fieldRow}>
        <Clock size={14} color={colors.subtext} />
        <Text style={[styles.label, { color: colors.subtext }]}>Collection Time</Text>
      </View>
      <TouchableOpacity
        style={[styles.timeBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
        onPress={() => setShowTimePicker(true)}
      >
        <Clock size={16} color={colors.accent} />
        <Text style={[styles.timeValue, { color: colors.text }]}>{formatTime(time)}</Text>
        <Text style={[styles.tapHint, { color: colors.subtext }]}>tap to change</Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={getSetting('use24HourTime')}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            setShowTimePicker(Platform.OS === 'ios');
            if (selected) setTime(selected);
          }}
        />
      )}

      <View style={styles.fieldRow}>
        <FileText size={14} color={colors.subtext} />
        <Text style={[styles.label, { color: colors.subtext }]}>Notes (optional)</Text>
      </View>
      <TextInput
        style={[styles.notesInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Driver name, route, remarks..."
        placeholderTextColor={colors.subtext}
        multiline
        numberOfLines={2}
      />

      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border }]} onPress={onClose}>
          <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }, (saving || exceedsRemaining) && styles.disabled]}
          onPress={handleSave}
          disabled={saving || exceedsRemaining}
        >
          {saving
            ? <ActivityIndicator size="small" color="#FFF" />
            : <><Truck size={16} color="#FFF" /><Text style={[styles.btnText, { color: '#FFF' }]}>Save</Text></>}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  chipText: { fontSize: 13, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600' },
  bigInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 42, fontWeight: '800', textAlign: 'center' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  timeValue: { fontSize: 20, fontWeight: '700', flex: 1 },
  tapHint: { fontSize: 12 },
  notesInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, textAlignVertical: 'top', minHeight: 64 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  btnText: { fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  errorHint: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: -4 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  driverText: { fontSize: 14, fontWeight: '700', flex: 1 },
});
