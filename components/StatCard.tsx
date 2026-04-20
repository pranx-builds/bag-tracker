import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';

interface StatCardProps {
  label: string;
  value: number | string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent';
  small?: boolean;
}

export default function StatCard({ label, value, variant = 'default', small = false }: StatCardProps) {
  const { colors } = useTheme();

  const bgMap = {
    default: colors.card,
    success: colors.successBg,
    warning: colors.warningBg,
    error: colors.errorBg,
    accent: colors.cardAlt,
  };

  const colorMap = {
    default: colors.primary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    accent: colors.accent,
  };

  const bg = bgMap[variant];
  const valueColor = colorMap[variant];

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: colors.border }, small && styles.small]}>
      <Text style={[styles.label, { color: colors.subtext }, small && styles.labelSmall]}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }, small && styles.valueSmall]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 6,
    minWidth: 0,
  },
  small: {
    padding: 12,
    borderRadius: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  valueSmall: {
    fontSize: 24,
    fontWeight: '700',
  },
});
