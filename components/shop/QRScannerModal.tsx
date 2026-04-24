import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  StyleSheet, Vibration, Linking, Animated, Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { QrCode, X, Check } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (driverId: string) => void;
}

const FRAME_SIZE = 260;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function QRScannerModal({ visible, onClose, onScanned }: Props) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualId, setManualId] = useState('');
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setManualId('');
      setScannedId(null);
      setLocked(false);
    }
  }, [visible]);

  // Pulse animation for corners
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  function handleBarcodeScanned({ data }: { data: string }) {
    if (locked) return;
    setLocked(true);
    setScannedId(data);
    Vibration.vibrate(100);
    setTimeout(() => {
      onScanned(data);
    }, 800);
  }

  function handleConfirmManual() {
    const id = manualId.trim();
    if (!id) return;
    onScanned(id);
  }

  if (!visible) return null;

  // Permission not yet determined
  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.permContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.permText, { color: colors.text }]}>Requesting camera access...</Text>
        </View>
      </Modal>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.permContainer, { backgroundColor: colors.background }]}>
          <QrCode size={56} color={colors.subtext} />
          <Text style={[styles.permTitle, { color: colors.text }]}>Camera Access Required</Text>
          <Text style={[styles.permDesc, { color: colors.subtext }]}>
            Camera permission is needed to scan QR codes. Please allow access in Settings.
          </Text>
          <TouchableOpacity
            style={[styles.permBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (permission.canAskAgain) {
                requestPermission();
              } else {
                Linking.openSettings();
              }
            }}
          >
            <Text style={styles.permBtnText}>
              {permission.canAskAgain ? 'Allow Camera' : 'Open Settings'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cancelLink]} onPress={onClose}>
            <Text style={[styles.cancelLinkText, { color: colors.subtext }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.root}>
        {/* Camera fills the screen */}
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={locked ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {/* Dark overlay with cutout */}
        <View style={styles.overlay} pointerEvents="none">
          {/* Top dark strip */}
          <View style={[styles.overlayStrip, { flex: 1 }]} />
          {/* Middle row: dark | frame | dark */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.frame}>
              {/* Corner markers */}
              <Animated.View style={[styles.corner, styles.cornerTL, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.corner, styles.cornerTR, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.corner, styles.cornerBL, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.corner, styles.cornerBR, { opacity: pulseAnim }]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          {/* Label below frame */}
          <View style={styles.labelArea}>
            {scannedId ? (
              <View style={[styles.scannedBadge, { backgroundColor: colors.successBg, borderColor: colors.success }]}>
                <Check size={14} color={colors.success} />
                <Text style={[styles.scannedBadgeText, { color: colors.success }]}>Detected: {scannedId}</Text>
              </View>
            ) : (
              <Text style={styles.scanLabel}>Scanning for driver ID...</Text>
            )}
          </View>
          {/* Bottom filler */}
          <View style={{ flex: 1 }} />
        </View>

        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <X size={22} color="#FFF" />
        </TouchableOpacity>

        {/* Bottom card */}
        <View style={[styles.bottomCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Scan Driver QR Code</Text>
          <Text style={[styles.cardDesc, { color: colors.subtext }]}>
            Point camera at the QR code on the driver's badge
          </Text>

          <Text style={[styles.orLabel, { color: colors.subtext }]}>or enter manually</Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder="e.g. RE6PARIS01"
            placeholderTextColor={colors.subtext}
            value={manualId}
            onChangeText={setManualId}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleConfirmManual}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.cardAlt }]}
              onPress={onClose}
            >
              <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                { backgroundColor: manualId.trim() ? colors.accent : colors.border },
              ]}
              onPress={handleConfirmManual}
              disabled={!manualId.trim()}
            >
              <Check size={16} color="#FFF" />
              <Text style={[styles.btnText, { color: '#FFF' }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  overlayStrip: { backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayMiddle: { flexDirection: 'row', height: FRAME_SIZE },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#FFF',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },
  labelArea: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    paddingVertical: 14,
  },
  scanLabel: { color: '#FFF', fontSize: 14, fontWeight: '600', opacity: 0.9 },
  scannedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  scannedBadgeText: { fontSize: 14, fontWeight: '700' },
  closeBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    gap: 10,
  },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  orLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  btnText: { fontSize: 15, fontWeight: '700' },
  // Permission screen
  permContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  permTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  permDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  permBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  permBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  permText: { fontSize: 16 },
  cancelLink: { marginTop: 4 },
  cancelLinkText: { fontSize: 14 },
});
