import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import BottomSheet from '@/components/ui/BottomSheet';
import { updateCollectionEntry } from '@/lib/database';
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

  useEffect(() => {
    if (entry) {
      setTaken(String(entry.full_bags_taken));
      setReturned(String(entry.empty_bags_returned));
      setNotes(entry.notes ?? '');
    }
  }, [entry]);

  async function handleSave() {
    if (!entry) return;
    const takenVal = parseInt(taken, 10);
    const returnedVal = parseInt(returned, 10);
    if (isNaN(takenVal) || takenVal < 0 || isNaN(returnedVal) || returnedVal < 0) {
      Alert.alert('Invalid Values', 'Please enter valid numbers.');
      return;
    }
    try {
      await updateCollectionEntry(entry.id, takenVal, returnedVal, notes);
      onClose();
      onSuccess();
    } catch {
      Alert.alert('Error', 'Failed to update entry.');
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
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleSave}>
          <Text style={[styles.btnText, { color: '#FFF' }]}>Save</Text>
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
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 15, fontWeight: '700' },
});
