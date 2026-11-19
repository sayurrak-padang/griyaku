import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, Empty, IconName } from '@/components/ui';
import { C, R } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { SERVICE_CATEGORIES, SERVICES } from '@/data/services';
import { rupiahShort } from '@/lib/format';

export default function Jasa() {
  const { bookings } = useApp();
  const [cat, setCat] = useState<(typeof SERVICE_CATEGORIES)[number]>('Semua');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return SERVICES.filter(
      (s) =>
        (cat === 'Semua' || s.category === cat) &&
        (!term || `${s.name} ${s.tagline} ${s.category}`.toLowerCase().includes(term))
    );
  }, [cat, q]);

  const active = bookings.filter((b) => b.status !== 'Selesai').length;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.h1}>Jasa Rumah Tangga</Text>
          <Text style={styles.sub}>Tenaga terlatih, harga jelas di depan.</Text>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={C.muted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Cari layanan, misal: cuci AC"
              placeholderTextColor="#9AA5A3"
              style={{ flex: 1, paddingVertical: 11, fontSize: 15, color: C.text }}
            />
          </View>
        </View>

        {active ? (
          <Pressable style={styles.orders} onPress={() => router.push('/pesanan')}>
            <Ionicons name="receipt-outline" size={20} color={C.primary} />
            <Text style={styles.ordersText}>{active} pesanan jasa sedang berjalan</Text>
            <Ionicons name="chevron-forward" size={18} color={C.primary} />
          </Pressable>
        ) : null}

        <View style={styles.promise}>
          {[
            ['shield-checkmark', 'Bergaransi'],
            ['person', 'Petugas terverifikasi'],
            ['pricetag', 'Harga transparan'],
          ].map(([icon, label]) => (
            <View key={label} style={styles.promiseItem}>
              <Ionicons name={icon as IconName} size={18} color={C.primary} />
              <Text style={styles.promiseText}>{label}</Text>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 4 }}>
          {SERVICE_CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />
          ))}
        </ScrollView>

        <View style={styles.grid}>
          {list.map((s) => (
            <Pressable key={s.id} style={styles.item} onPress={() => router.push(`/service/${s.id}`)}>
              <View style={[styles.icon, { backgroundColor: s.color }]}>
                <Ionicons name={s.icon as IconName} size={28} color="#fff" />
              </View>
              <Text style={styles.name} numberOfLines={2}>
                {s.name}
              </Text>
              <Text style={styles.tagline} numberOfLines={2}>
                {s.tagline}
              </Text>
              <View style={styles.footer}>
                <Text style={styles.price}>
                  {s.packages[0].price ? `mulai ${rupiahShort(s.packages[0].price)}` : 'Konsultasi gratis'}
                </Text>
                <View style={styles.rating}>
                  <Ionicons name="star" size={12} color={C.accent} />
                  <Text style={styles.ratingText}>{s.rating}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
        {list.length === 0 ? <Empty icon="construct" title="Layanan tidak ditemukan" text="Coba kata kunci lain." /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 8 },
  h1: { fontSize: 24, fontWeight: '800', color: C.text, marginTop: 8 },
  sub: { fontSize: 14, color: C.muted, marginTop: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 12,
    borderRadius: R.md,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  orders: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: R.md,
    backgroundColor: C.primarySoft,
  },
  ordersText: { flex: 1, color: C.primaryDark, fontWeight: '700' },
  promise: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 12 },
  promiseItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  promiseText: { fontSize: 12, color: C.text, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 },
  item: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '800', color: C.text },
  tagline: { fontSize: 12, color: C.muted, minHeight: 32 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontSize: 12, color: C.primary, fontWeight: '700' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 12, color: C.text, fontWeight: '600' },
});
