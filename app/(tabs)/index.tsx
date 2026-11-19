import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PropertyMiniCard } from '@/components/PropertyCard';
import { IconName, SectionHeader } from '@/components/ui';
import { LinearGradient } from 'expo-linear-gradient';

import { C, glassShadow, R, TAB_BAR_SPACE } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CITIES, PROPERTY_TYPES } from '@/data/properties';
import { SERVICES } from '@/data/services';
import { rupiahShort } from '@/lib/format';

const QUICK: { label: string; sub: string; icon: IconName; color: string; bg: string; go: () => void }[] = [
  { label: 'Cari Properti', sub: 'Beli & sewa', icon: 'search', color: C.primary, bg: C.primarySoft, go: () => router.push('/cari') },
  { label: 'Pasang Iklan', sub: 'Gratis', icon: 'megaphone', color: '#D9831B', bg: C.accentSoft, go: () => router.push('/pasang-iklan') },
  { label: 'Hitung KPR', sub: 'Simulasi cicilan', icon: 'calculator', color: C.info, bg: C.infoSoft, go: () => router.push('/kpr') },
  { label: 'Jasa Rumah', sub: 'Bersih, AC, renovasi', icon: 'construct', color: C.danger, bg: C.dangerSoft, go: () => router.push('/jasa') },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const { user, allProperties } = useApp();
  const featured = allProperties.filter((p) => p.listing === 'jual' && p.verified).slice(0, 6);
  const kost = allProperties.filter((p) => p.type === 'kost' || p.type === 'kontrakan').slice(0, 6);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}>
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Ionicons name="home" size={18} color="#fff" />
          </View>
          <Text style={styles.brand}>Griyaku</Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => router.push('/favorit')} hitSlop={8}>
            <Ionicons name="heart-outline" size={24} color={C.text} />
          </Pressable>
        </View>
        <Text style={styles.greet}>Halo{user ? `, ${user.name.split(' ')[0]}` : ''} 👋</Text>
        <Text style={styles.heroTitle}>Temukan tempat tinggal yang pas untukmu</Text>
        <Pressable style={styles.search} onPress={() => router.push('/cari')}>
          <Ionicons name="search" size={20} color={C.muted} />
          <Text style={styles.searchText}>Cari lokasi, nama perumahan, kost...</Text>
        </Pressable>
      </View>

      <View style={styles.quickGrid}>
        {QUICK.map((q) => (
          <Pressable key={q.label} style={[styles.quick, { backgroundColor: q.bg }]} onPress={q.go}>
            <View style={[styles.quickIcon, { backgroundColor: q.color }]}>
              <Ionicons name={q.icon} size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickLabel}>{q.label}</Text>
              <Text style={styles.quickSub}>{q.sub}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.bannerWrap} onPress={() => router.push('/kpr')}>
        <LinearGradient colors={['rgba(14,143,126,0.92)', 'rgba(59,111,217,0.85)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.bannerTitle}>Berapa cicilan rumah impianmu?</Text>
          <Text style={styles.bannerText}>Hitung simulasi KPR dalam 1 menit, gratis.</Text>
          <View style={styles.bannerBtn}>
            <Text style={styles.bannerBtnText}>Coba hitung</Text>
            <Ionicons name="arrow-forward" size={14} color={C.primaryDark} />
          </View>
        </View>
        <Ionicons name="calculator" size={64} color="rgba(255,255,255,0.35)" />
        </LinearGradient>
      </Pressable>

      <SectionHeader title="Jenis Properti" />
      <View style={styles.typeGrid}>
        {PROPERTY_TYPES.map((t) => (
          <Pressable
            key={t.key}
            style={styles.typeItem}
            onPress={() => router.push({ pathname: '/cari', params: { type: t.key } })}>
            <View style={styles.typeIcon}>
              <Ionicons name={t.icon as IconName} size={24} color={C.primary} />
            </View>
            <Text style={styles.typeLabel}>{t.label}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.typeItem} onPress={() => router.push({ pathname: '/cari', params: { verified: '1' } })}>
          <View style={styles.typeIcon}>
            <Ionicons name="shield-checkmark" size={24} color={C.primary} />
          </View>
          <Text style={styles.typeLabel}>Terverifikasi</Text>
        </Pressable>
      </View>

      <SectionHeader title="Pilihan Terverifikasi" action="Lihat semua" onAction={() => router.push({ pathname: '/cari', params: { verified: '1' } })} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
        {featured.map((p) => (
          <PropertyMiniCard key={p.id} p={p} />
        ))}
      </ScrollView>

      <SectionHeader title="Kost & Kontrakan" action="Lihat semua" onAction={() => router.push({ pathname: '/cari', params: { mode: 'sewa' } })} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
        {kost.map((p) => (
          <PropertyMiniCard key={p.id} p={p} />
        ))}
      </ScrollView>

      <SectionHeader title="Jasa Rumah Tangga" action="Semua jasa" onAction={() => router.push('/jasa')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
        {SERVICES.slice(0, 8).map((s) => (
          <Pressable key={s.id} style={styles.svc} onPress={() => router.push(`/service/${s.id}`)}>
            <View style={[styles.svcIcon, { backgroundColor: s.color }]}>
              <Ionicons name={s.icon as IconName} size={26} color="#fff" />
            </View>
            <Text style={styles.svcName} numberOfLines={2}>
              {s.name}
            </Text>
            <Text style={styles.svcPrice}>
              {s.packages[0].price ? `mulai ${rupiahShort(s.packages[0].price)}` : 'Konsultasi gratis'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <SectionHeader title="Cari di Kota Populer" />
      <View style={styles.cities}>
        {CITIES.slice(0, 10).map((c) => (
          <Pressable key={c} style={styles.city} onPress={() => router.push({ pathname: '/cari', params: { city: c } })}>
            <Ionicons name="location" size={14} color={C.primary} />
            <Text style={styles.cityText}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.adCta} onPress={() => router.push('/pasang-iklan')}>
        <Ionicons name="megaphone" size={28} color={C.accent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.adTitle}>Punya properti untuk dijual atau disewakan?</Text>
          <Text style={styles.adText}>Pasang iklan gratis dan jangkau ribuan pencari.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={C.muted} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 16, paddingBottom: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 30, height: 30, borderRadius: 9, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  brand: { color: C.text, fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
  greet: { color: C.muted, marginTop: 18, fontSize: 14 },
  heroTitle: { color: C.text, fontSize: 22, fontWeight: '800', marginTop: 4, lineHeight: 28 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.glassStrong,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
    ...glassShadow,
  },
  searchText: { color: C.muted, fontSize: 14 },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.xl,
    padding: 12,
    ...glassShadow,
  },
  quick: { flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: R.md },
  quickIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  quickSub: { fontSize: 11, color: C.muted },
  bannerWrap: { margin: 16, marginBottom: 0, borderRadius: R.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', ...glassShadow },
  banner: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  bannerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  bannerText: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 4,
  },
  bannerBtnText: { color: C.primaryDark, fontWeight: '700', fontSize: 13 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  typeItem: { width: '25%', alignItems: 'center', gap: 6, marginBottom: 14 },
  typeIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: { fontSize: 12, color: C.text, fontWeight: '600' },
  hList: { paddingHorizontal: 16, gap: 12 },
  svc: { width: 120, backgroundColor: C.card, borderRadius: R.xl, padding: 12, gap: 6, borderWidth: 1, borderColor: C.border },
  svcIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  svcName: { fontSize: 13, fontWeight: '700', color: C.text, minHeight: 34 },
  svcPrice: { fontSize: 11, color: C.primary, fontWeight: '600' },
  cities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  city: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  cityText: { fontSize: 13, color: C.text },
  adCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: R.xl,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  adTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  adText: { fontSize: 12, color: C.muted, marginTop: 2 },
});
