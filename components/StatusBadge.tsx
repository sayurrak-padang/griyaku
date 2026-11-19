import { StyleSheet, Text, View } from 'react-native';

import type { Property } from '@/data/properties';

const MAP: Record<NonNullable<Property['status']>, { label: string; bg: string; fg: string }> = {
  menunggu: { label: 'Menunggu persetujuan', bg: '#FFF4D6', fg: '#8A6100' },
  aktif: { label: 'Tayang', bg: '#DDF5EF', fg: '#0B6E61' },
  ditolak: { label: 'Ditolak', bg: '#FDE2E2', fg: '#B42318' },
  terjual: { label: 'Terjual', bg: '#E5E7EB', fg: '#374151' },
  nonaktif: { label: 'Nonaktif', bg: '#E5E7EB', fg: '#374151' },
};

export function statusLabel(s?: Property['status']) {
  return MAP[s ?? 'aktif'].label;
}

export function StatusBadge({ status, reason }: { status?: Property['status']; reason?: string }) {
  const m = MAP[status ?? 'aktif'];
  return (
    <View style={{ gap: 4 }}>
      <View style={[styles.badge, { backgroundColor: m.bg }]}>
        <Text style={[styles.text, { color: m.fg }]}>{m.label}</Text>
      </View>
      {status === 'ditolak' && reason ? <Text style={styles.reason}>Alasan: {reason}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: 12, fontWeight: '700' },
  reason: { fontSize: 12, color: '#B42318' },
});
