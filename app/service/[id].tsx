import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, Empty, Field, IconName } from '@/components/ui';
import { C, R } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { SERVICES } from '@/data/services';
import { DAYS, groupThousands, MONTHS, rupiah, toISODate } from '@/lib/format';

const TIMES = ['08.00', '10.00', '13.00', '15.00', '18.00'];
const ADMIN_FEE = 5_000;

export default function ServiceBooking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, addBooking } = useApp();
  const insets = useSafeAreaInsets();
  const s = SERVICES.find((x) => x.id === id);

  const days = useMemo(() => {
    const out: Date[] = [];
    const now = new Date();
    for (let i = 1; i <= 10; i++) out.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
    return out;
  }, []);

  const [pkg, setPkg] = useState(0);
  const [date, setDate] = useState(toISODate(days[0]));
  const [time, setTime] = useState(TIMES[0]);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!s) return <Empty icon="alert-circle-outline" title="Layanan tidak ditemukan" text="Silakan pilih layanan lain." />;

  const chosen = s.packages[pkg];
  const total = chosen.price ? chosen.price + ADMIN_FEE : 0;
  const valid = address.trim().length >= 8;

  const submit = async () => {
    if (!user) {
      Alert.alert('Masuk dulu', 'Silakan masuk agar petugas bisa menghubungi Anda.', [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Masuk', onPress: () => router.push('/login') },
      ]);
      return;
    }
    setSaving(true);
    try {
      await addBooking({
      serviceId: s.id,
      serviceName: s.name,
      packageName: chosen.name,
      price: total,
      date,
      time,
      address: address.trim(),
      note: note.trim() || undefined,
      });
    } catch (e) {
      Alert.alert('Gagal memesan', e instanceof Error ? e.message : 'Coba lagi.');
      return;
    } finally {
      setSaving(false);
    }
    Alert.alert('Pesanan terkirim', 'Kami akan mengonfirmasi jadwal lewat WhatsApp.', [
      { text: 'Lihat pesanan', onPress: () => router.replace('/pesanan') },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: s.name }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { backgroundColor: s.color }]}>
          <View style={styles.heroIcon}>
            <Ionicons name={s.icon as IconName} size={34} color={s.color} />
          </View>
          <Text style={styles.heroTitle}>{s.name}</Text>
          <Text style={styles.heroSub}>{s.tagline}</Text>
          <View style={styles.heroMeta}>
            <Meta icon="star" text={`${s.rating} (${groupThousands(s.orders)}+ pesanan)`} />
            <Meta icon="time-outline" text={s.duration} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.desc}>{s.description}</Text>
          <View style={{ gap: 6, marginTop: 10 }}>
            {s.includes.map((i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={16} color={C.primary} />
                <Text style={{ fontSize: 14, color: C.text }}>{i}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>1. Pilih paket</Text>
          {s.packages.map((p, i) => (
            <Pressable key={p.name} style={[styles.pkg, pkg === i && styles.pkgOn]} onPress={() => setPkg(i)}>
              <Ionicons name={pkg === i ? 'radio-button-on' : 'radio-button-off'} size={20} color={C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pkgName}>{p.name}</Text>
                <Text style={styles.pkgDetail}>{p.detail}</Text>
              </View>
              <Text style={styles.pkgPrice}>{p.price ? rupiah(p.price) : 'Gratis'}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>2. Pilih jadwal</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {days.map((d) => {
              const iso = toISODate(d);
              const on = iso === date;
              return (
                <Pressable key={iso} style={[styles.day, on && styles.dayOn]} onPress={() => setDate(iso)}>
                  <Text style={[styles.dayName, on && { color: '#fff' }]}>{DAYS[d.getDay()].slice(0, 3)}</Text>
                  <Text style={[styles.dayNum, on && { color: '#fff' }]}>{d.getDate()}</Text>
                  <Text style={[styles.dayName, on && { color: '#fff' }]}>{MONTHS[d.getMonth()]}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {TIMES.map((t) => (
              <Chip key={t} label={t} active={time === t} onPress={() => setTime(t)} icon="time-outline" />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>3. Alamat</Text>
          <Field
            label="Alamat lengkap"
            value={address}
            onChangeText={setAddress}
            placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kota"
            multiline
          />
          <Field label="Catatan untuk petugas (opsional)" value={note} onChangeText={setNote} placeholder="Misal: ada 2 unit AC di lantai 2" />
        </View>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: C.muted }}>Total{chosen.price ? ' (termasuk biaya layanan)' : ''}</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: C.text }}>{total ? rupiah(total) : 'Gratis'}</Text>
        </View>
        <Button title={saving ? 'Mengirim...' : 'Pesan sekarang'} onPress={submit} disabled={!valid || saving} style={{ paddingHorizontal: 24 }} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Meta({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={14} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 20, alignItems: 'flex-start', gap: 4 },
  heroIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  heroMeta: { flexDirection: 'row', gap: 16, marginTop: 8 },
  section: { backgroundColor: C.card, padding: 16, marginTop: 8 },
  desc: { fontSize: 14, color: C.text, lineHeight: 21 },
  h2: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 12 },
  pkg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  pkgOn: { borderColor: C.primary, backgroundColor: C.primarySoft },
  pkgName: { fontSize: 14, fontWeight: '700', color: C.text },
  pkgDetail: { fontSize: 12, color: C.muted },
  pkgPrice: { fontSize: 14, fontWeight: '800', color: C.primary },
  day: { width: 62, paddingVertical: 10, alignItems: 'center', borderRadius: R.md, borderWidth: 1, borderColor: C.border, gap: 2 },
  dayOn: { backgroundColor: C.primary, borderColor: C.primary },
  dayName: { fontSize: 11, color: C.muted },
  dayNum: { fontSize: 20, fontWeight: '800', color: C.text },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderColor: C.border,
  },
});
