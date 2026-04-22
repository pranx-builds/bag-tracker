import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Sunrise } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import BottomSheet from '@/components/ui/BottomSheet';
import { createDailyRecord } from '@/lib/database';

interface Props {
  visible: boolean;
  onClose: () => void;
  shopId: string;
  today: string;
  onSuccess: () => void;
}

export default function StartDaySheet({ visible, onClose, shopId, today, onSuccess }: Props) {
  const { colors } = useTheme();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleStart() {
    const val = parseInt(value, 10);
    if (isNaN(val) || val < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of full bags received.');
      return;
    }
    setSaving(true);
    try {
      await createDailyRecord(shopId, today, val);
      setValue('');
      onClose();
      onSuccess();
    } catch {
      Alert.alert('Error', 'Failed to start the day.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.titleRow}>
        <Sunrise size={20} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>Start Today's Record</Text>
      </View>
      <Text style={[styles.desc, { color: colors.subtext }]}>
        Enter how many full bags were received today.
      </Text>
      <Text style={[styles.label, { color: colors.subtext }]}>Full Bags Received</Text>
      <TextInput
        style={[styles.bigInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
        keyboardType="numeric"
        value={value}
        onChangeText={setValue}
        placeholder="0"
        placeholderTextColor={colors.subtext}
        autoFocus
        maxLength={6}
      />
      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.border }]} onPress={onClose}>
          <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }, saving && styles.disabled]}
          onPress={handleStart}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#FFF" />
            : <><Sunrise size={16} color="#FFF" /><Text style={[styles.btnText, { color: '#FFF' }]}>Start Day</Text></>}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  desc: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600' },
  bigInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 42, fontWeight: '800', textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  btnText: { fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
