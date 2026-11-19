import { Linking, Platform } from 'react-native';

type Pt = { lat?: number; lng?: number };

export function regionFor(list: Pt[]) {
  const pts = list.filter((p) => p.lat !== undefined && p.lng !== undefined) as { lat: number; lng: number }[];
  if (!pts.length) return { latitude: -2.5, longitude: 117, latitudeDelta: 30, longitudeDelta: 30 }; // seluruh Indonesia
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.4),
    longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.4),
  };
}

export function openInMaps(lat: number, lng: number, label: string) {
  const q = encodeURIComponent(label);
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?ll=${lat},${lng}&q=${q}`
      : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Linking.openURL(url);
}
