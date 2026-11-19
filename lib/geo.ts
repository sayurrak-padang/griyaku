import * as Location from 'expo-location';
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

export type LatLng = { lat: number; lng: number };

/** Jarak garis lurus (km) dengan rumus haversine. */
export function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number) {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
  return `${Math.round(km)} km`;
}

/** Lokasi pengguna saat ini + nama area (bila tersedia). Melempar Error berbahasa Indonesia. */
export async function getCurrentLocation(): Promise<LatLng & { label?: string }> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) {
    throw new Error(
      Platform.OS === 'web'
        ? 'Izin lokasi ditolak. Izinkan akses lokasi untuk situs ini di pengaturan browser.'
        : 'Izin lokasi ditolak. Aktifkan di Pengaturan → Griyaku/Expo Go → Lokasi.',
    );
  }
  let pos: Location.LocationObject | null = null;
  try {
    pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  } catch {
    pos = await Location.getLastKnownPositionAsync();
  }
  if (!pos) throw new Error('Lokasi belum didapat. Pastikan GPS aktif lalu coba lagi.');
  const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
  let label: string | undefined;
  if (Platform.OS !== 'web') {
    try {
      const [a] = await Location.reverseGeocodeAsync({ latitude: here.lat, longitude: here.lng });
      label = [a?.district || a?.subregion, a?.city].filter(Boolean).join(', ') || undefined;
    } catch {}
  }
  return { ...here, label };
}
