import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Alert, ActivityIndicator,
} from 'react-native';
import BottomSheet from '@/components/ui/BottomSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Store, Plus, Eye, EyeOff, Power, Trash2, Hash } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { getAllShops, createShop, toggleShopActive, deleteShop } from '@/lib/database';
import type { Shop } from '@/types';

export default function ShopsScreen() {
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  const [createVisible, setCreateVisible] = useState(false);
  const [shopName, setShopName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newShop, setNewShop] = useState<Shop | null>(null);

  const loadShops = useCallback(async () => {
    try {
      setShops(await getAllShops());
    } catch (err) {
      console.error('Error loading shops:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadShops();
    }, [loadShops])
  );

  function togglePin(id: string) {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleCreate() {
    if (!shopName.trim()) return;
    setCreating(true);
    try {
      const shop = await createShop(shopName.trim());
      setNewShop(shop);
      setShopName('');
      await loadShops();
    } catch (err) {
      Alert.alert('Error', 'Failed to create shop. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  function openCreate() {
    setShopName('');
    setNewShop(null);
    setCreateVisible(true);
  }

  function closeCreate() {
    setCreateVisible(false);
    setNewShop(null);
  }

  async function handleToggle(shop: Shop) {
    try {
      await toggleShopActive(shop.id, !shop.is_active);
      loadShops();
    } catch {
      Alert.alert('Error', 'Failed to update shop status.');
    }
  }

  function handleDelete(shop: Shop) {
    Alert.alert(
      'Delete Shop',
      `Delete "${shop.name}" and all its data permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await deleteShop(shop.id);
              loadShops();
            } catch {
              Alert.alert('Error', 'Failed to delete shop.');
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 16 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Store size={22} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Shops</Text>
            </View>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={openCreate}
            >
              <Plus size={16} color="#FFF" />
              <Text style={styles.addBtnText}>New Shop</Text>
            </TouchableOpacity>
          </View>

          {shops.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Store size={40} color={colors.subtext} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No shops yet</Text>
              <Text style={[styles.emptyText, { color: colors.subtext }]}>
                Create a shop to generate a PIN for their login.
              </Text>
            </View>
          ) : (
            shops.map((shop) => (
              <View
                key={shop.id}
                style={[
                  styles.shopCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  !shop.is_active && { opacity: 0.6 },
                ]}
              >
                <View style={styles.shopHeader}>
                  <View style={styles.shopNameRow}>
                    <View style={[styles.dot, { backgroundColor: shop.is_active ? colors.success : colors.subtext }]} />
                    <Text style={[styles.shopName, { color: colors.text }]}>{shop.name}</Text>
                    {!shop.is_active && (
                      <View style={[styles.inactiveBadge, { backgroundColor: colors.border }]}>
                        <Text style={[styles.inactiveBadgeText, { color: colors.subtext }]}>Inactive</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: shop.is_active ? colors.warningBg : colors.successBg }]}
                      onPress={() => handleToggle(shop)}
                    >
                      <Power size={14} color={shop.is_active ? colors.warning : colors.success} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.errorBg }]}
                      onPress={() => handleDelete(shop)}
                    >
                      <Trash2 size={14} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.pinRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Hash size={14} color={colors.subtext} />
                  <Text style={[styles.pinLabel, { color: colors.subtext }]}>PIN</Text>
                  <Text style={[styles.pinValue, { color: colors.text }]}>
                    {visiblePins[shop.id] ? shop.pin : '••••'}
                  </Text>
                  <TouchableOpacity onPress={() => togglePin(shop.id)} style={styles.eyeBtn}>
                    {visiblePins[shop.id]
                      ? <EyeOff size={16} color={colors.subtext} />
                      : <Eye size={16} color={colors.subtext} />}
                  </TouchableOpacity>
                </View>

                <Text style={[styles.createdAt, { color: colors.subtext }]}>
                  Created {new Date(shop.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <BottomSheet visible={createVisible} onClose={newShop ? closeCreate : undefined} disableBackdropClose={!newShop}>

            {newShop ? (
              <>
                <View style={styles.sheetTitleRow}>
                  <Store size={20} color={colors.success} />
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>Shop Created!</Text>
                </View>
                <Text style={[styles.sheetDesc, { color: colors.subtext }]}>
                  Share this PIN with the shop. They use it to log in.
                </Text>
                <View style={[styles.pinDisplay, { backgroundColor: colors.cardAlt, borderColor: colors.primary }]}>
                  <Text style={[styles.shopNameBig, { color: colors.text }]}>{newShop.name}</Text>
                  <Text style={[styles.pinBig, { color: colors.primary }]}>{newShop.pin}</Text>
                  <Text style={[styles.pinHint, { color: colors.subtext }]}>4-digit login PIN</Text>
                </View>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.primary }]}
                  onPress={closeCreate}
                >
                  <Text style={[styles.btnText, { color: '#FFF' }]}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.sheetTitleRow}>
                  <Plus size={20} color={colors.accent} />
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>Create New Shop</Text>
                </View>
                <Text style={[styles.sheetDesc, { color: colors.subtext }]}>
                  A unique 4-digit PIN will be automatically assigned.
                </Text>
                <Text style={[styles.inputLabel, { color: colors.subtext }]}>Shop Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  value={shopName}
                  onChangeText={setShopName}
                  placeholder="e.g. Downtown Branch"
                  placeholderTextColor={colors.subtext}
                  autoFocus
                  maxLength={50}
                />
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnHalf, { backgroundColor: colors.border }]}
                    onPress={closeCreate}
                  >
                    <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnHalf, { backgroundColor: colors.primary }, (!shopName.trim() || creating) && { opacity: 0.5 }]}
                    onPress={handleCreate}
                    disabled={!shopName.trim() || creating}
                  >
                    {creating
                      ? <ActivityIndicator size="small" color="#FFF" />
                      : <Text style={[styles.btnText, { color: '#FFF' }]}>Create</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  addBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  shopCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  shopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  shopName: { fontSize: 16, fontWeight: '700', flex: 1 },
  inactiveBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  inactiveBadgeText: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  pinLabel: { fontSize: 13, fontWeight: '600' },
  pinValue: { fontSize: 18, fontWeight: '800', letterSpacing: 3, flex: 1 },
  eyeBtn: { padding: 2 },

  createdAt: { fontSize: 11 },

  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  sheetDesc: { fontSize: 14, lineHeight: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600' },
  textInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, fontWeight: '600' },
  pinDisplay: { borderRadius: 14, borderWidth: 2, padding: 24, alignItems: 'center', gap: 6 },
  shopNameBig: { fontSize: 16, fontWeight: '700' },
  pinBig: { fontSize: 52, fontWeight: '900', letterSpacing: 8 },
  pinHint: { fontSize: 13 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnHalf: { flex: 1 },
  btnText: { fontSize: 15, fontWeight: '700' },
});
