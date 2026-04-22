import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Delete } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';

const PAD_KEYS = ['1','2','3','4','5','6','7','8','9','','0','del'];

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDigit(digit: string) {
    if (pin.length >= 4 || loading) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');
    if (newPin.length === 4) {
      setLoading(true);
      const result = await login(newPin);
      if (!result.success) {
        setError(result.error ?? 'Invalid PIN');
        setPin('');
      }
      setLoading(false);
    }
  }

  function handleDelete() {
    if (loading) return;
    setPin((p) => p.slice(0, -1));
    setError('');
  }

  const dotColor = error ? colors.error : colors.primary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={styles.logoArea}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.text }]}>Bag Tracker</Text>
          <Text style={[styles.tagline, { color: colors.subtext }]}>Enter your 4-digit PIN to continue</Text>
        </View>

        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { borderColor: dotColor },
                pin.length > i && { backgroundColor: dotColor },
              ]}
            />
          ))}
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        ) : (
          <Text style={[styles.errorText, { color: 'transparent' }]}> </Text>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.subtext }]}>Verifying…</Text>
          </View>
        ) : (
          <View style={styles.pad}>
            {PAD_KEYS.map((key, i) => {
              if (key === '') return <View key={i} style={styles.padCell} />;
              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.padCell, styles.padKey, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                  >
                    <Delete size={22} color={colors.subtext} />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.padCell, styles.padKey, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleDigit(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.padDigit, { color: colors.text }]}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 28 },
  logoArea: { alignItems: 'center', gap: 10 },
  logoImage: { width: 100, height: 100, borderRadius: 22 },
  appName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { fontSize: 14, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 18 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2.5 },
  errorText: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: -16 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', width: 264, gap: 12 },
  padCell: { width: 80, height: 80 },
  padKey: { borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  padDigit: { fontSize: 28, fontWeight: '600' },
  loadingBox: { height: 264, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 15 },
});
