import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';

interface EmptyStateProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Icon size={40} color={colors.subtext} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.desc, { color: colors.subtext }]}>{description}</Text>
      ) : null}
      {action ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center', gap: 12 },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  desc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
