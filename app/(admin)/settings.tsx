import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Settings, Lock, LogOut, ShieldCheck, Eye, EyeOff, Clock, Bell } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { getAdminPin, setAdminPin } from '@/lib/database';
import { getSetting, setSetting } from '@/lib/settings';

export default function AdminSettingsScreen() {
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { logout } = useAuth();

  const [adminPin, setAdminPinState] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);

  const [returnWindowText, setReturnWindowText] = useState('20');
  const [returnWindowMinutes, setReturnWindowMinutes] = useState(20);

  useFocusEffect(
    useCallback(() => {
      getAdminPin().then(setAdminPinState).catch(console.error);
      const val = getSetting('returnWindowMinutes');
      setReturnWindowMinutes(val);
      setReturnWindowText(String(val));
    }, [])
  );

  function commitReturnWindow() {
    const val = parseInt(returnWindowText, 10);
    if (!isNaN(val) && val > 0 && val <= 240) {
      setSetting('returnWindowMinutes', val);
      setReturnWindowMinutes(val);
    } else {
      setReturnWindowText(String(returnWindowMinutes));
    }
  }

  async function handleChangePin() {
    if (currentPin !== adminPin) {
      Alert.alert('Wrong PIN', 'The current PIN you entered is incorrect.');
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      Alert.alert('Invalid PIN', 'New PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Mismatch', 'New PIN and confirmation do not match.');
      return;
    }
    setSaving(true);
    try {
      await setAdminPin(newPin);
      setAdminPinState(newPin);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      Alert.alert('Success', 'Admin PIN updated.');
    } catch {
      Alert.alert('Error', 'Failed to update PIN. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 16 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={styles.headerRow}>
            <Settings size={22} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          </View>

          {/* Return Timing */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Clock size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Return Timing</Text>
            </View>
            <Text style={[styles.sectionDesc, { color: colors.subtext }]}>
              Minutes after a collection before the return reminder and overdue alert trigger.
            </Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.settingLabelRow}>
                  <Bell size={14} color={colors.warning} />
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Return Window</Text>
                </View>
              </View>
              <View style={[styles.minuteInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.minuteText, { color: colors.text }]}
                  keyboardType="number-pad"
                  value={returnWindowText}
                  onChangeText={setReturnWindowText}
                  onBlur={commitReturnWindow}
                  maxLength={3}
                  selectTextOnFocus
                />
                <Text style={[styles.minuteUnit, { color: colors.subtext }]}>min</Text>
              </View>
            </View>
          </View>

          {/* Admin Account */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <ShieldCheck size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Admin Account</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.subtext }]}>Current PIN</Text>
              <View style={styles.pinPreviewRow}>
                <Text style={[styles.pinPreview, { color: colors.text }]}>
                  {showCurrent ? adminPin : '••••'}
                </Text>
                <TouchableOpacity onPress={() => setShowCurrent((v) => !v)}>
                  {showCurrent ? <EyeOff size={16} color={colors.subtext} /> : <Eye size={16} color={colors.subtext} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Change PIN */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Lock size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Change Admin PIN</Text>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Current PIN</Text>
            <TextInput
              style={[styles.pinInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={currentPin}
              onChangeText={(v) => setCurrentPin(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              placeholder="• • • •"
              placeholderTextColor={colors.subtext}
              secureTextEntry
              maxLength={4}
            />
            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>New PIN</Text>
            <TextInput
              style={[styles.pinInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={newPin}
              onChangeText={(v) => setNewPin(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              placeholder="• • • •"
              placeholderTextColor={colors.subtext}
              secureTextEntry
              maxLength={4}
            />
            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Confirm New PIN</Text>
            <TextInput
              style={[styles.pinInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={confirmPin}
              onChangeText={(v) => setConfirmPin(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              placeholder="• • • •"
              placeholderTextColor={colors.subtext}
              secureTextEntry
              maxLength={4}
            />
            <TouchableOpacity
              style={[
                styles.saveBtn, { backgroundColor: colors.primary },
                (saving || currentPin.length < 4 || newPin.length < 4 || confirmPin.length < 4) && { opacity: 0.5 },
              ]}
              onPress={handleChangePin}
              disabled={saving || currentPin.length < 4 || newPin.length < 4 || confirmPin.length < 4}
            >
              {saving
                ? <ActivityIndicator size="small" color="#FFF" />
                : <><Lock size={16} color="#FFF" /><Text style={styles.saveBtnText}>Update PIN</Text></>}
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Settings size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.subtext }]}>App</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>Bag Tracker</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.subtext }]}>Version</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>0.2</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.subtext }]}>Developed by</Text>
              <Text style={[styles.infoValue, { color: colors.primary }]}>pranx builds</Text>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: colors.errorBg, borderColor: colors.error }]}
            onPress={handleLogout}
          >
            <LogOut size={16} color={colors.error} />
            <Text style={[styles.logoutBtnText, { color: colors.error }]}>Log Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionDesc: { fontSize: 13, lineHeight: 18, marginTop: -4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  settingInfo: { flex: 1 },
  settingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  minuteInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, gap: 4, minWidth: 72, justifyContent: 'center' },
  minuteText: { fontSize: 20, fontWeight: '700', textAlign: 'center', minWidth: 32 },
  minuteUnit: { fontSize: 12, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  pinPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pinPreview: { fontSize: 16, fontWeight: '700', letterSpacing: 4 },
  divider: { height: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: -6 },
  pinInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: 8 },
  saveBtn: { borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 14 },
  logoutBtnText: { fontSize: 15, fontWeight: '700' },
});
