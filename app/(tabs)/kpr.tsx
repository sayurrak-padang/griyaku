import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Chip, Field } from '@/components/ui';
import { C, R, TAB_BAR_SPACE } from '@/constants/theme';
import { formatThousands, monthlyInstallment, parseNumber, rupiah } from '@/lib/format';

const TENORS = [5, 10, 15, 20, 25, 30];
const DPS = [5, 10, 15, 20, 30];

export default function Kpr() {
  const params = useLocalSearchParams<{ price?: string }>();
  const [price, setPrice] = useState('1.000.000.000');
  const [dpPct, setDpPct] = useState(10);
  const [tenor, setTenor] = useState(20);
  const [rate, setRate] = useState('7,5');

  useEffect(() => {
    if (params.price) setPrice(formatThousands(String(params.price)));
  }, [params.price]);

  const r = useMemo(() => {
    const p = parseNumber(price);
    const dp = (p * dpPct) / 100;
    const loan = p - dp;
    const rateNum = Number(rate.replace(',', '.')) || 0;
    const monthly = monthlyInstallment(loan, rateNum, tenor);
    const total = monthly * tenor * 12;
    return { p, dp, loan, monthly, total, interest: total - loan, income: monthly / 0.3 };
  }, [price, dpPct, tenor, rate]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE }} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>Simulasi KPR</Text>
          <Text style={styles.sub}>Perkirakan cicilan bulanan rumah impianmu.</Text>

          <View style={styles.result}>
            <Text style={styles.resultLabel}>Estimasi cicilan per bulan</Text>
            <Text style={styles.resultValue}>{rupiah(r.monthly)}</Text>
            <Text style={styles.resultNote}>
              {tenor} tahun · bunga {rate}% per tahun (anuitas)
            </Text>
          </View>

          <Card style={{ marginTop: 16 }}>
            <Field
              label="Harga properti"
              keyboardType="number-pad"
              value={price}
              onChangeText={(v) => setPrice(formatThousands(v))}
              placeholder="0"
              suffix="Rp"
            />
            <Text style={styles.label}>Uang muka (DP)</Text>
            <View style={styles.chips}>
              {DPS.map((d) => (
                <Chip key={d} label={`${d}%`} active={dpPct === d} onPress={() => setDpPct(d)} />
              ))}
            </View>
            <Text style={styles.hint}>DP: {rupiah(r.dp)}</Text>

            <Text style={[styles.label, { marginTop: 14 }]}>Jangka waktu</Text>
            <View style={styles.chips}>
              {TENORS.map((t) => (
                <Chip key={t} label={`${t} th`} active={tenor === t} onPress={() => setTenor(t)} />
              ))}
            </View>

            <View style={{ marginTop: 14 }}>
              <Field
                label="Suku bunga per tahun"
                keyboardType="decimal-pad"
                value={rate}
                onChangeText={(v) => setRate(v.replace(/[^0-9,.]/g, ''))}
                suffix="%"
                hint="Contoh: bunga fixed promo bank sekitar 3 - 8%."
              />
            </View>
          </Card>

          <Card style={{ marginTop: 16, gap: 10 }}>
            <Text style={styles.cardTitle}>Rincian</Text>
            <Row label="Harga properti" value={rupiah(r.p)} />
            <Row label={`Uang muka (${dpPct}%)`} value={rupiah(r.dp)} />
            <Row label="Jumlah pinjaman" value={rupiah(r.loan)} bold />
            <Row label="Total bunga" value={rupiah(r.interest)} />
            <Row label="Total pembayaran" value={rupiah(r.total)} />
          </Card>

          <View style={styles.tip}>
            <Ionicons name="bulb-outline" size={20} color="#B7791F" />
            <Text style={styles.tipText}>
              Agar mudah disetujui bank, cicilan sebaiknya maksimal 30% dari penghasilan. Penghasilan yang disarankan:{' '}
              <Text style={{ fontWeight: '800' }}>{rupiah(r.income)}/bulan</Text>.
            </Text>
          </View>

          <Button
            title="Cari properti di bawah harga ini"
            icon="search"
            style={{ marginTop: 16 }}
            onPress={() => router.push({ pathname: '/cari', params: { mode: 'jual', max: String(r.p) } })}
          />
          <Text style={styles.disclaimer}>
            Hasil simulasi hanya perkiraan. Angka sebenarnya mengikuti ketentuan bank, termasuk biaya provisi, asuransi, dan
            notaris.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: C.muted, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: C.text, fontSize: 14, fontWeight: bold ? '800' : '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '800', color: C.text, marginTop: 8 },
  sub: { fontSize: 14, color: C.muted, marginTop: 4 },
  result: { marginTop: 16, backgroundColor: 'rgba(14,143,126,0.88)', borderRadius: R.xl, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  resultLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  resultValue: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 4 },
  resultNote: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { fontSize: 12, color: C.muted, marginTop: 6 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  tip: { flexDirection: 'row', gap: 10, backgroundColor: C.accentSoft, padding: 14, borderRadius: R.md, marginTop: 16 },
  tipText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 19 },
  disclaimer: { fontSize: 11, color: C.muted, marginTop: 12, lineHeight: 16 },
});
