import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Empty } from '@/components/ui';
import { C } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatDate, rupiah } from '@/lib/format';
import { canPay, METHOD_LABEL, PAYMENT_LABEL, payBooking } from '@/lib/payments';

export default function Pesanan() {
  const { bookings, refreshBookings, online } = useApp();
  const [paying, setPaying] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const pay = async (id: string) => {
    setPaying(id);
    try {
      const status = await payBooking(id);
      await refreshBookings();
      if (status === 'lunas') Alert.alert('Pembayaran berhasil', 'Terima kasih! Pesanan Anda sudah lunas.');
      else if (status === 'menunggu')
        Alert.alert('Menunggu pembayaran', 'Selesaikan pembayaran (mis. transfer VA atau scan QRIS). Status akan berubah otomatis.');
    } catch (e) {
      Alert.alert('Gagal membuka pembayaran', e instanceof Error ? e.message : String(e));
    } finally {
      setPaying(null);
    }
  };

  return (
    <FlatList
      refreshControl={
        online ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refreshBookings();
              setRefreshing(false);
            }}
            tintColor={C.primary}
          />
        ) : undefined
      }
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
          <View style={styles.row}>
            <Text style={styles.price}>{b.price ? rupiah(b.price) : 'Gratis'}</Text>
            {b.price && b.paymentStatus ? (
              <View style={[styles.pay, { backgroundColor: PAYMENT_LABEL[b.paymentStatus].bg }]}>
                <Text style={[styles.payText, { color: PAYMENT_LABEL[b.paymentStatus].fg }]}>
                  {PAYMENT_LABEL[b.paymentStatus].label}
                  {b.paymentStatus === 'lunas' && b.paymentMethod ? ` · ${METHOD_LABEL[b.paymentMethod] ?? b.paymentMethod}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
          {canPay(b) ? (
            <Button
              title={paying === b.id ? 'Membuka pembayaran...' : b.paymentStatus === 'menunggu' ? 'Lanjutkan pembayaran' : 'Bayar sekarang'}
              icon="card-outline"
              disabled={!!paying}
              onPress={() => pay(b.id)}
              style={{ marginTop: 6 }}
            />
          ) : null}
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
  pay: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 4 },
  payText: { fontSize: 11.5, fontWeight: '700' },
});
