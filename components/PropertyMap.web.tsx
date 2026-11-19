import { Ionicons } from '@expo/vector-icons';
import { createElement } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

import { C } from '@/constants/theme';
import { Property } from '@/data/properties';

/**
 * Versi web: react-native-maps tidak mendukung web.
 * Satu properti → peta OpenStreetMap tersemat; banyak properti → peta area semua titik.
 */
export function PropertyMap({ properties, style }: { properties: Property[]; style?: StyleProp<ViewStyle>; single?: boolean }) {
  const pts = properties.filter((p) => p.lat !== undefined && p.lng !== undefined) as (Property & { lat: number; lng: number })[];
  if (!pts.length) {
    return (
      <View style={[{ backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16 }, style]}>
        <Ionicons name="map" size={36} color={C.primary} />
        <Text style={{ color: C.text, fontWeight: '700' }}>Lokasi belum tersedia</Text>
      </View>
    );
  }
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const pad = pts.length === 1 ? 0.01 : 0.05;
  const bbox = [Math.min(...lngs) - pad, Math.min(...lats) - pad, Math.max(...lngs) + pad, Math.max(...lats) + pad].join(',');
  const marker = pts.length === 1 ? `&marker=${pts[0].lat},${pts[0].lng}` : '';
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`;
  return (
    <View style={[{ backgroundColor: C.primarySoft, overflow: 'hidden' }, style]}>
      {createElement('iframe', {
        src,
        title: 'Peta lokasi',
        loading: 'lazy',
        style: { border: 0, width: '100%', height: '100%', flex: 1 },
      })}
      {pts.length > 1 ? (
        <View style={{ position: 'absolute', left: 8, bottom: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 12, color: C.text, fontWeight: '600' }}>{pts.length} properti di area ini</Text>
        </View>
      ) : null}
    </View>
  );
}
