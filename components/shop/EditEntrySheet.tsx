import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { Pencil, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/lib/theme';
import BottomSheet from '@/components/ui/BottomSheet';
import { updateCollectionEntry } from '@/lib/database';
import { getSetting } from '@/lib/settings';
import type { CollectionEntry } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  entry: CollectionEntry | null;
  onSuccess: () => void;
}

export default function EditEntrySheet({ visible, onClose, entry, onSuccess }: Props) {
  const { colors } = useTheme();
  const [taken, setTaken] = useState('');
  const [returned, setReturned] = useState('');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setTaken(String(entry.full_bags_taken));
      setReturned(String(entry.empty_bags_returned));
      setNotes(entry.notes ?? '');
      setTime(new Date(entry.timestamp));
      setShowTimePicker(false);
    }
  }, [entry]);

  function formatTime(d: Date): string {
    const use24 = getSetting('use24HourTime');
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !use24 });
  }

  async function handleSave() {
    if (!entry) return;
    const takenVal = parseInt(taken, 10);
    const returnedVal = parseInt(returned, 10);
    if (isNaN(takenVal) || takenVal < 0 || isNaN(returnedVal) || returnedVal < 0) {
      Alert.alert('Invalid Values', 'Please enter valid numbers.');
      return;
    }
    setSaving(true);
    try {
      // Preserve the original date, only change the time
      const original = new Date(entry.timestamp);
      const updated = new Date(original);
      updated.setHours(time.getHours(), time.getMinutes(), 0, 0);

      await updateCollectionEntry(entry.id, takenVal, returnedVal, notes, updated.toISOString());
      onClose();
      onSuccess();
    } catch {
      Alert.alert('Error', 'Failed to update entry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.titleRow}>
        <Pencil size={20} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>Edit Collection</Text>
      </View>

      <Text style={[styles.label, { color: colors.subtext }]}>Full Bags Collected</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
        keyboardType="numeric" value={taken} onChangeText={setTaken}
        placeholder="0" placeholderTextColor={colors.subtext}
      />

      <Text style={[styles.label, { color: colors.subtext }]}>Empty Bags Returned</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
        keyboardType="numeric" value={returned} onChangeText={setReturned}
        placeholder="0" placeholderTextColor={colors.subtext}
      />

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

      <Text style={[styles.label, { color: colors.subtext }]}>Notes</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
        value={notes} onChangeText={setNotes}
        placeholder="Driver name, route..." placeholderTextColor={colors.subtext}
      />

      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border }]} onPress={onClose}>
          <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#FFF" />
            : <Text style={[styles.btnText, { color: '#FFF' }]}>Save</Text>}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '600' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  timeValue: { fontSize: 20, fontWeight: '700', flex: 1 },
  tapHint: { fontSize: 12 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 15, fontWeight: '700' },
});
