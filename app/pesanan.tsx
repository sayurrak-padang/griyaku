import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Empty } from '@/components/ui';
import { C } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatDate, rupiah } from '@/lib/format';

export default function Pesanan() {
  const { bookings } = useApp();
  return (
    <FlatList
      style={{ backgroundColor: C.bg }}
      data={bookings}
      keyExtractor={(b) => b.id}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      renderItem={({ item: b }) => (
        <Card style={{ gap: 6 }}>
          <View style={styles.row}>
            <Text style={styles.title}>{b.serviceName}</Text>
            <View style={styles.status}>
              <Text style={styles.statusText}>{b.status}</Text>
            </View>
          </View>
          <Text style={styles.pkg}>{b.packageName}</Text>
          <View style={styles.meta}>
            <Ionicons name="calendar-outline" size={14} color={C.muted} />
            <Text style={styles.metaText}>
              {formatDate(b.date)}, {b.time}
            </Text>
          </View>
          <View style={styles.meta}>
            <Ionicons name="location-outline" size={14} color={C.muted} />
            <Text style={styles.metaText} numberOfLines={2}>
              {b.address}
            </Text>
          </View>
          <Text style={styles.price}>{b.price ? rupiah(b.price) : 'Gratis'}</Text>
        </Card>
      )}
      ListEmptyComponent={
        <Empty icon="receipt-outline" title="Belum ada pesanan" text="Pesan jasa bersih rumah, servis AC, dan lainnya.">
          <Button title="Lihat jasa" onPress={() => router.push('/jasa')} />
        </Empty>
      }
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '800', color: C.text, flex: 1 },
  status: { backgroundColor: C.accentSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#B7791F' },
  pkg: { fontSize: 13, color: C.muted },
  meta: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  metaText: { fontSize: 13, color: C.text, flex: 1 },
  price: { fontSize: 15, fontWeight: '800', color: C.primary, marginTop: 4 },
});
