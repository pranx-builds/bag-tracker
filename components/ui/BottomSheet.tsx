import React from 'react';
import {
  Modal, TouchableOpacity, View, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '@/lib/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose?: () => void;
  disableBackdropClose?: boolean;
  children: React.ReactNode;
}

export default function BottomSheet({ visible, onClose, disableBackdropClose, children }: BottomSheetProps) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={disableBackdropClose ? undefined : onClose}
        />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
});
