import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import BottomSheet from '@/components/ui/BottomSheet';
import { updateDailyRecord } from '@/lib/database';

interface Props {
  visible: boolean;
  onClose: () => void;
  recordId: string;
  currentValue: number;
  onSuccess: () => void;
}

export default function EditReceivedSheet({ visible, onClose, recordId, currentValue, onSuccess }: Props) {
  const { colors } = useTheme();
  const [value, setValue] = useState(String(currentValue));

  useEffect(() => {
    if (visible) setValue(String(currentValue));
  }, [visible, currentValue]);

  async function handleSave() {
    const val = parseInt(value, 10);
    if (isNaN(val) || val < 0) {
      Alert.alert('Invalid Value', 'Please enter a valid number.');
      return;
    }
    try {
      await updateDailyRecord(recordId, val);
      onClose();
      onSuccess();
    } catch {
      Alert.alert('Error', 'Failed to update.');
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.titleRow}>
        <Pencil size={20} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>Edit Full Bags</Text>
      </View>
      <Text style={[styles.label, { color: colors.subtext }]}>Full Bags Received</Text>
      <TextInput
        style={[styles.bigInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
        keyboardType="numeric"
        value={value}
        onChangeText={setValue}
        placeholder="0"
        placeholderTextColor={colors.subtext}
        autoFocus
        selectTextOnFocus
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
  bigInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 42, fontWeight: '800', textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 15, fontWeight: '700' },
});
