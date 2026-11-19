import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDistance } from '@/lib/geo';

import { Photo } from '@/components/Photo';
import { C, R } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Property, typeLabel } from '@/data/properties';
import { monthlyInstallment, rupiahShort } from '@/lib/format';

export function priceText(p: Property) {
  return rupiahShort(p.price) + (p.period ? ` /${p.period}` : '');
}

function Specs({ p }: { p: Property }) {
  const items: [keyof typeof Ionicons.glyphMap, string][] = [];
  if (p.bedrooms) items.push(['bed-outline', `${p.bedrooms} KT`]);
  if (p.bathrooms) items.push(['water-outline', `${p.bathrooms} KM`]);
  if (p.landArea) items.push(['resize-outline', `LT ${p.landArea} m²`]);
  if (p.buildingArea) items.push(['home-outline', `LB ${p.buildingArea} m²`]);
  return (
    <View style={s.specs}>
      {items.map(([icon, label]) => (
        <View key={label} style={s.spec}>
          <Ionicons name={icon} size={13} color={C.muted} />
          <Text style={s.specText}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function FavButton({ id }: { id: string }) {
  const { isFavorite, toggleFavorite } = useApp();
  const fav = isFavorite(id);
  return (
    <Pressable onPress={() => toggleFavorite(id)} hitSlop={10} style={s.fav}>
      <Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={fav ? C.danger : C.text} />
    </Pressable>
  );
}

export function PropertyCard({ p, distanceKm }: { p: Property; distanceKm?: number }) {
  const kpr = p.listing === 'jual' && p.type !== 'tanah' && p.type !== 'gudang';
  return (
    <Pressable style={s.card} onPress={() => router.push(`/property/${p.id}`)}>
      <View>
        <Photo uri={p.images[0]} style={s.img} />
        <View style={s.badges}>
          {p.verified ? (
            <View style={[s.badge, { backgroundColor: C.primary }]}>
              <Ionicons name="shield-checkmark" size={11} color="#fff" />
              <Text style={s.badgeText}>Terverifikasi</Text>
            </View>
          ) : null}
          {p.isNew ? (
            <View style={[s.badge, { backgroundColor: C.accent }]}>
              <Text style={s.badgeText}>Baru</Text>
            </View>
          ) : null}
          {p.mine ? (
            <View style={[s.badge, { backgroundColor: C.info }]}>
              <Text style={s.badgeText}>Iklan saya</Text>
            </View>
          ) : null}
        </View>
        <FavButton id={p.id} />
      </View>
      <View style={{ padding: 12, gap: 4 }}>
        <Text style={s.meta}>
          {typeLabel(p.type)}
          {p.kostFor ? ` ${p.kostFor}` : ''} · {p.listing === 'jual' ? 'Dijual' : 'Disewa'}
        </Text>
        <Text style={s.price}>{priceText(p)}</Text>
        {kpr ? (
          <Text style={s.kpr}>
            Cicilan mulai {rupiahShort(monthlyInstallment(p.price * 0.9, 7.5, 20))}/bln
          </Text>
        ) : null}
        <Text style={s.title} numberOfLines={2}>
          {p.title}
        </Text>
        <View style={s.loc}>
          <Ionicons name="location-outline" size={13} color={C.muted} />
          <Text style={s.locText} numberOfLines={1}>
            {p.district}, {p.city}
          </Text>
          {distanceKm !== undefined ? <Text style={s.dist}>{formatDistance(distanceKm)}</Text> : null}
        </View>
        <Specs p={p} />
      </View>
    </Pressable>
  );
}

export function PropertyMiniCard({ p }: { p: Property }) {
  return (
    <Pressable style={[s.card, { width: 230 }]} onPress={() => router.push(`/property/${p.id}`)}>
      <View>
        <Photo uri={p.images[0]} style={{ height: 130 }} />
        <FavButton id={p.id} />
      </View>
      <View style={{ padding: 10, gap: 3 }}>
        <Text style={s.meta}>{typeLabel(p.type)}</Text>
        <Text style={[s.price, { fontSize: 16 }]}>{priceText(p)}</Text>
        <Text style={s.title} numberOfLines={1}>
          {p.title}
        </Text>
        <View style={s.loc}>
          <Ionicons name="location-outline" size={12} color={C.muted} />
          <Text style={s.locText} numberOfLines={1}>
            {p.city}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  dist: { fontSize: 12, fontWeight: '700', color: C.primary, marginLeft: 'auto' },
  card: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  img: { height: 190 },
  badges: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  fav: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { fontSize: 12, color: C.muted },
  price: { fontSize: 18, fontWeight: '800', color: C.text },
  kpr: { fontSize: 12, color: C.primary, fontWeight: '600' },
  title: { fontSize: 14, color: C.text, fontWeight: '600' },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { fontSize: 12, color: C.muted, flex: 1 },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  specText: { fontSize: 12, color: C.muted },
});
