import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Clock, Bell, FileText, Eye, RotateCcw, User } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { getAllSettings, setSetting, AppSettings } from '@/lib/settings';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<AppSettings>({
    returnWindowMinutes: 20,
    defaultNotes: '',
    showCountdownTimer: true,
    use24HourTime: true,
    userName: '',
  });

  // Local text state for inputs that need blur-to-save behaviour
  const [returnWindowText, setReturnWindowText] = useState('20');

  useFocusEffect(
    useCallback(() => {
      const s = getAllSettings();
      setSettings(s);
      setReturnWindowText(String(s.returnWindowMinutes));
    }, [])
  );

  function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  function commitReturnWindow() {
    const val = parseInt(returnWindowText, 10);
    if (!isNaN(val) && val > 0 && val <= 240) {
      updateSetting('returnWindowMinutes', val);
    } else {
      // revert to current saved value
      setReturnWindowText(String(settings.returnWindowMinutes));
    }
  }

  function resetToDefaults() {
    Alert.alert(
      'Reset Settings',
      'Reset all settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive', onPress: () => {
            updateSetting('returnWindowMinutes', 20);
            updateSetting('defaultNotes', '');
            updateSetting('showCountdownTimer', true);
            updateSetting('use24HourTime', true);
            updateSetting('userName', '');
            setReturnWindowText('20');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>Configure how the app behaves</Text>
          </View>

          {/* ── Profile ─────────────────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <User size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile</Text>
            </View>
            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Your Name</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={settings.userName}
              onChangeText={(val) => updateSetting('userName', val)}
              placeholder="e.g. John"
              placeholderTextColor={colors.subtext}
            />
            <Text style={[styles.fieldHint, { color: colors.subtext }]}>
              Shown as a greeting on the Dashboard
            </Text>
          </View>

          {/* ── Return Timing ────────────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Clock size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Return Timing</Text>
            </View>
            <Text style={[styles.sectionDesc, { color: colors.subtext }]}>
              How many minutes after a collection before the return reminder and overdue alert appear.
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.settingLabelRow}>
                  <Bell size={14} color={colors.warning} />
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Return Window</Text>
                </View>
                <Text style={[styles.settingDesc, { color: colors.subtext }]}>
                  Reminder + overdue trigger after this time
                </Text>
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

          {/* ── Display ─────────────────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Eye size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Display</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.settingLabelRow}>
                  <Clock size={14} color={colors.subtext} />
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Countdown Timer</Text>
                </View>
                <Text style={[styles.settingDesc, { color: colors.subtext }]}>
                  Show live countdown badge on collections
                </Text>
              </View>
              <Switch
                value={settings.showCountdownTimer}
                onValueChange={(val) => updateSetting('showCountdownTimer', val)}
                trackColor={{ false: colors.border, true: colors.primary + '99' }}
                thumbColor={settings.showCountdownTimer ? colors.primary : colors.subtext}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={styles.settingLabelRow}>
                  <Clock size={14} color={colors.subtext} />
                  <Text style={[styles.settingLabel, { color: colors.text }]}>24-Hour Time</Text>
                </View>
                <Text style={[styles.settingDesc, { color: colors.subtext }]}>
                  Use 24h format in time pickers
                </Text>
              </View>
              <Switch
                value={settings.use24HourTime}
                onValueChange={(val) => updateSetting('use24HourTime', val)}
                trackColor={{ false: colors.border, true: colors.primary + '99' }}
                thumbColor={settings.use24HourTime ? colors.primary : colors.subtext}
              />
            </View>
          </View>

          {/* ── Entry Defaults ───────────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <FileText size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Entry Defaults</Text>
            </View>
            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Default Notes</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={settings.defaultNotes}
              onChangeText={(val) => updateSetting('defaultNotes', val)}
              placeholder="e.g. Driver: John, Route A"
              placeholderTextColor={colors.subtext}
              multiline
              numberOfLines={2}
            />
            <Text style={[styles.fieldHint, { color: colors.subtext }]}>
              Pre-filled in the Notes field when adding a new collection
            </Text>
          </View>

          {/* ── About ────────────────────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Settings size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.subtext }]}>App</Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>Bag Tracker</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.subtext }]}>Version</Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>1.1.0</Text>
            </View>
          </View>

          {/* Reset */}
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: colors.errorBg, borderColor: colors.error }]}
            onPress={resetToDefaults}
          >
            <RotateCcw size={16} color={colors.error} />
            <Text style={[styles.resetBtnText, { color: colors.error }]}>Reset to Defaults</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 100 },
  header: { gap: 4, marginBottom: 4 },
  screenTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14 },

  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionDesc: { fontSize: 13, lineHeight: 18, marginTop: -6 },

  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  settingInfo: { flex: 1, gap: 3 },
  settingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  settingDesc: { fontSize: 12, lineHeight: 16 },

  minuteInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, gap: 4, minWidth: 72, justifyContent: 'center' },
  minuteText: { fontSize: 20, fontWeight: '700', textAlign: 'center', minWidth: 32 },
  minuteUnit: { fontSize: 12, fontWeight: '600' },

  divider: { height: 1 },

  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: -8 },
  fieldHint: { fontSize: 12, marginTop: -8 },
  textInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '500' },
  notesInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, textAlignVertical: 'top', minHeight: 64 },

  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  aboutLabel: { fontSize: 14 },
  aboutValue: { fontSize: 14, fontWeight: '600' },

  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 14, marginTop: 4 },
  resetBtnText: { fontSize: 15, fontWeight: '700' },
});
