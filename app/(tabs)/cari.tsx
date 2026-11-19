import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PropertyCard } from '@/components/PropertyCard';
import { PropertyMap } from '@/components/PropertyMap';
import { Button, Chip, Empty, Field } from '@/components/ui';
import { C, R, TAB_BAR_SPACE } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CITIES, ListingKind, PROPERTY_TYPES, PropertyType } from '@/data/properties';
import { formatThousands, parseNumber } from '@/lib/format';
import { distanceKm, getCurrentLocation, LatLng } from '@/lib/geo';

type Sort = 'terdekat' | 'terbaru' | 'termurah' | 'termahal' | 'terluas';
const SORTS: { key: Sort; label: string }[] = [
  { key: 'terdekat', label: 'Terdekat dari saya' },
  { key: 'terbaru', label: 'Terbaru' },
  { key: 'termurah', label: 'Harga terendah' },
  { key: 'termahal', label: 'Harga tertinggi' },
  { key: 'terluas', label: 'Luas terbesar' },
];

type Filters = {
  city: string | null;
  minPrice: string;
  maxPrice: string;
  minBed: number;
  verified: boolean;
  furnished: boolean;
};
const NO_FILTERS: Filters = { city: null, minPrice: '', maxPrice: '', minBed: 0, verified: false, furnished: false };

const RADII = [2, 5, 10, 25, 50, 0]; // 0 = tanpa batas

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function Search() {
  const params = useLocalSearchParams<{ type?: string; mode?: string; city?: string; verified?: string; q?: string; max?: string; near?: string }>();
  const { allProperties, online, loading, refresh } = useApp();

  const [mode, setMode] = useState<ListingKind | 'semua'>('semua');
  const [type, setType] = useState<PropertyType | null>(null);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('terbaru');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [draft, setDraft] = useState<Filters>(NO_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [near, setNear] = useState<(LatLng & { label?: string }) | null>(null);
  const [radius, setRadius] = useState(10);
  const [locating, setLocating] = useState(false);

  const locate = async () => {
    setLocating(true);
    try {
      const here = await getCurrentLocation();
      setNear(here);
      setSort('terdekat');
    } catch (e) {
      Alert.alert('Lokasi tidak tersedia', e instanceof Error ? e.message : String(e));
    } finally {
      setLocating(false);
    }
  };
  const clearNear = () => {
    setNear(null);
    if (sort === 'terdekat') setSort('terbaru');
  };

  useEffect(() => {
    if (one(params.near) === '1') locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.near]);

  // Terapkan parameter dari Beranda (jenis, kota, mode)
  useEffect(() => {
    const t = one(params.type) as PropertyType | undefined;
    const m = one(params.mode);
    const city = one(params.city);
    const max = one(params.max);
    if (t || m || city || params.verified || max) {
      setType(t ?? null);
      setMode(m === 'jual' || m === 'sewa' ? m : t === 'kost' || t === 'kontrakan' ? 'sewa' : 'semua');
      setFilters({
        ...NO_FILTERS,
        city: city ?? null,
        verified: one(params.verified) === '1',
        maxPrice: max ? formatThousands(max) : '',
      });
    }
    if (params.q) setQ(one(params.q) ?? '');
  }, [params.type, params.mode, params.city, params.verified, params.q, params.max]);

  const { results, dist } = useMemo(() => {
    const dist = new Map<string, number>();
    if (near) {
      for (const p of allProperties) {
        if (p.lat !== undefined && p.lng !== undefined) dist.set(p.id, distanceKm(near, { lat: p.lat, lng: p.lng }));
      }
    }
    const term = q.trim().toLowerCase();
    const min = parseNumber(filters.minPrice);
    const max = parseNumber(filters.maxPrice);
    const list = allProperties.filter((p) => {
      if (near) {
        const d = dist.get(p.id);
        if (d === undefined || (radius && d > radius)) return false;
      }
      if (mode !== 'semua' && p.listing !== mode) return false;
      if (type && p.type !== type) return false;
      if (filters.city && p.city !== filters.city) return false;
      if (min && p.price < min) return false;
      if (max && p.price > max) return false;
      if (filters.minBed && (p.bedrooms ?? 0) < filters.minBed) return false;
      if (filters.verified && !p.verified) return false;
      if (filters.furnished && p.furnished !== 'Penuh') return false;
      if (term) {
        const hay = `${p.title} ${p.city} ${p.district} ${p.type}`.toLowerCase();
        if (!term.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    const area = (x: (typeof list)[number]) => x.buildingArea ?? x.landArea ?? 0;
    const sorted = [...list].sort((a, b) => {
      if (sort === 'terdekat' && near) return (dist.get(a.id) ?? 1e9) - (dist.get(b.id) ?? 1e9);
      if (sort === 'termurah') return a.price - b.price;
      if (sort === 'termahal') return b.price - a.price;
      if (sort === 'terluas') return area(b) - area(a);
      return b.postedAt.localeCompare(a.postedAt);
    });
    return { results: sorted, dist };
  }, [allProperties, q, mode, type, filters, sort, near, radius]);

  const activeCount =
    (filters.city ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.minBed ? 1 : 0) +
    (filters.verified ? 1 : 0) +
    (filters.furnished ? 1 : 0);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.top}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={C.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder='Cari "Serpong", "kost putri", ...'
            placeholderTextColor="#9AA5A3"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {q ? (
            <Pressable onPress={() => setQ('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={C.muted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.row}>
          <View style={styles.segment}>
            {(['semua', 'jual', 'sewa'] as const).map((m) => (
              <Pressable key={m} onPress={() => setMode(m)} style={[styles.seg, mode === m && styles.segOn]}>
                <Text style={[styles.segText, mode === m && styles.segTextOn]}>
                  {m === 'semua' ? 'Semua' : m === 'jual' ? 'Beli' : 'Sewa'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={styles.tool}
            onPress={() => {
              setDraft(filters);
              setShowFilter(true);
            }}>
            <Ionicons name="options-outline" size={16} color={C.primary} />
            <Text style={styles.toolText}>Filter</Text>
            {activeCount ? (
              <View style={styles.dot}>
                <Text style={styles.dotText}>{activeCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable style={styles.tool} onPress={() => setShowSort(true)}>
            <Ionicons name="swap-vertical" size={16} color={C.primary} />
            <Text style={styles.toolText}>Urutkan</Text>
          </Pressable>
          <Pressable style={styles.tool} onPress={() => setView(view === 'list' ? 'map' : 'list')} hitSlop={6}>
            <Ionicons name={view === 'list' ? 'map-outline' : 'list-outline'} size={18} color={C.primary} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          <Chip label="Semua jenis" active={!type} onPress={() => setType(null)} />
          {PROPERTY_TYPES.map((t) => (
            <Chip key={t.key} label={t.label} active={type === t.key} onPress={() => setType(type === t.key ? null : t.key)} />
          ))}
        </ScrollView>

        {near ? (
          <View style={styles.nearBox}>
            <View style={styles.nearHead}>
              <Ionicons name="navigate" size={15} color={C.primary} />
              <Text style={styles.nearText} numberOfLines={1}>
                Sekitar {near.label ?? 'lokasi Anda'}
              </Text>
              <Pressable onPress={locate} hitSlop={8}>
                <Ionicons name="refresh" size={16} color={C.primary} />
              </Pressable>
              <Pressable onPress={clearNear} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={C.muted} />
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {RADII.map((r) => (
                <Chip key={r} label={r ? `≤ ${r} km` : 'Semua jarak'} active={radius === r} onPress={() => setRadius(r)} />
              ))}
            </ScrollView>
          </View>
        ) : (
          <Pressable style={styles.nearBtn} onPress={locate} disabled={locating}>
            {locating ? <ActivityIndicator size="small" color={C.primary} /> : <Ionicons name="navigate-outline" size={16} color={C.primary} />}
            <Text style={styles.nearBtnText}>{locating ? 'Mencari lokasi Anda...' : 'Gunakan lokasi terkini'}</Text>
            <Text style={styles.nearHint}>properti terdekat</Text>
          </Pressable>
        )}
      </View>

      {view === 'map' ? (
        <View style={{ flex: 1 }}>
          {/* key: posisikan ulang peta setiap kali hasil berubah */}
          <PropertyMap key={results.map((r) => r.id).join(',')} properties={results} style={{ flex: 1 }} />
          <View style={styles.mapCount}>
            <Text style={styles.mapCountText}>{results.length} properti · ketuk penanda lalu label untuk detail</Text>
          </View>
        </View>
      ) : (
      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        refreshing={online ? loading : undefined}
        onRefresh={online ? refresh : undefined}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: TAB_BAR_SPACE }}
        ListHeaderComponent={
          <Text style={styles.count}>
            {results.length} properti ditemukan{filters.city ? ` di ${filters.city}` : ''}
            {near ? (radius ? ` dalam ${radius} km dari Anda` : ', diurutkan dari yang terdekat') : ''}
          </Text>
        }
        renderItem={({ item }) => <PropertyCard p={item} distanceKm={dist.get(item.id)} />}
        ListEmptyComponent={
          <Empty
            icon="search"
            title="Belum ada yang cocok"
            text={near && radius ? `Belum ada properti dalam ${radius} km. Coba perbesar jarak.` : 'Coba ubah kata kunci atau kurangi filter.'}>
            {near && radius && radius < 50 ? (
              <Button title="Perbesar jarak" onPress={() => setRadius(RADII[RADII.indexOf(radius) + 1])} style={{ marginBottom: 8 }} />
            ) : null}
            <Button
              title="Reset pencarian"
              variant="outline"
              onPress={() => {
                setQ('');
                setType(null);
                setMode('semua');
                setFilters(NO_FILTERS);
                clearNear();
              }}
            />
          </Empty>
        }
      />
      )}

      {/* Urutkan */}
      <Modal visible={showSort} transparent animationType="fade" onRequestClose={() => setShowSort(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowSort(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Urutkan</Text>
            {SORTS.map((s) => (
              <Pressable
                key={s.key}
                style={styles.option}
                onPress={() => {
                  setShowSort(false);
                  if (s.key === 'terdekat' && !near) {
                    locate();
                    return;
                  }
                  setSort(s.key);
                }}>
                <Text style={styles.optionText}>{s.label}</Text>
                <Ionicons name={sort === s.key ? 'radio-button-on' : 'radio-button-off'} size={20} color={C.primary} />
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Filter */}
      <Modal visible={showFilter} animationType="slide" onRequestClose={() => setShowFilter(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }}>
          <View style={styles.filterHead}>
            <Pressable onPress={() => setShowFilter(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={C.text} />
            </Pressable>
            <Text style={styles.sheetTitle}>Filter</Text>
            <Pressable onPress={() => setDraft(NO_FILTERS)} hitSlop={8}>
              <Text style={{ color: C.primary, fontWeight: '700' }}>Reset</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.fLabel}>Kota</Text>
            <View style={styles.wrap}>
              <Chip label="Semua kota" active={!draft.city} onPress={() => setDraft({ ...draft, city: null })} />
              {CITIES.map((c) => (
                <Chip key={c} label={c} active={draft.city === c} onPress={() => setDraft({ ...draft, city: c })} />
              ))}
            </View>

            <Text style={styles.fLabel}>Rentang harga</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Minimum (Rp)"
                  keyboardType="number-pad"
                  value={draft.minPrice}
                  onChangeText={(v) => setDraft({ ...draft, minPrice: formatThousands(v) })}
                  placeholder="0"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Maksimum (Rp)"
                  keyboardType="number-pad"
                  value={draft.maxPrice}
                  onChangeText={(v) => setDraft({ ...draft, maxPrice: formatThousands(v) })}
                  placeholder="Tanpa batas"
                />
              </View>
            </View>

            <Text style={styles.fLabel}>Kamar tidur minimal</Text>
            <View style={styles.wrap}>
              {[0, 1, 2, 3, 4].map((n) => (
                <Chip key={n} label={n ? `${n}+` : 'Bebas'} active={draft.minBed === n} onPress={() => setDraft({ ...draft, minBed: n })} />
              ))}
            </View>

            <Text style={styles.fLabel}>Lainnya</Text>
            <View style={styles.wrap}>
              <Chip
                icon="shield-checkmark"
                label="Terverifikasi"
                active={draft.verified}
                onPress={() => setDraft({ ...draft, verified: !draft.verified })}
              />
              <Chip
                icon="cube"
                label="Full furnished"
                active={draft.furnished}
                onPress={() => setDraft({ ...draft, furnished: !draft.furnished })}
              />
            </View>
          </ScrollView>
          <View style={{ padding: 16, borderTopWidth: 1, borderColor: C.border }}>
            <Button
              title="Terapkan filter"
              onPress={() => {
                setFilters(draft);
                setShowFilter(false);
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  nearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: C.primarySoft,
    alignSelf: 'flex-start',
  },
  nearBtnText: { fontSize: 13.5, fontWeight: '700', color: C.primary },
  nearHint: { fontSize: 12, color: C.muted },
  nearBox: { marginHorizontal: 16, marginTop: 10, gap: 8 },
  nearHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nearText: { flex: 1, fontSize: 13.5, fontWeight: '700', color: C.text },
  top: { backgroundColor: 'rgba(255,255,255,0.45)', paddingTop: 8, paddingBottom: 12, gap: 10, borderBottomWidth: 1, borderColor: C.border },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: R.md,
    backgroundColor: C.glassStrong,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: C.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  segment: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 999, padding: 3, flex: 1 },
  seg: { flex: 1, paddingVertical: 7, borderRadius: 999, alignItems: 'center' },
  segOn: { backgroundColor: C.primary },
  segText: { fontSize: 13, fontWeight: '600', color: C.muted },
  segTextOn: { color: '#fff' },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 6 },
  toolText: { color: C.primary, fontWeight: '700', fontSize: 13 },
  dot: { backgroundColor: C.primary, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  dotText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  count: { fontSize: 13, color: C.muted, marginBottom: 2 },
  mapCount: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: C.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  mapCountText: { fontSize: 12, fontWeight: '600', color: C.text },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 6 },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  optionText: { fontSize: 15, color: C.text },
  filterHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  fLabel: { fontSize: 15, fontWeight: '800', color: C.text, marginTop: 8, marginBottom: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
});
