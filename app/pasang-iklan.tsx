import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chip, Field } from '@/components/ui';
import { C } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CITIES, ListingKind, PROPERTY_TYPES, PropertyType } from '@/data/properties';
import { formatThousands, parseNumber } from '@/lib/format';

const num = (s: string) => (parseNumber(s) || undefined);

export default function PasangIklan() {
  const { user, addListing } = useApp();
  const [listing, setListing] = useState<ListingKind>('jual');
  const [type, setType] = useState<PropertyType>('rumah');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [period, setPeriod] = useState<'bulan' | 'tahun'>('bulan');
  const [city, setCity] = useState<string | null>(null);
  const [district, setDistrict] = useState('');
  const [bed, setBed] = useState('');
  const [bath, setBath] = useState('');
  const [land, setLand] = useState('');
  const [building, setBuilding] = useState('');
  const [certificate, setCertificate] = useState('SHM');
  const [description, setDescription] = useState('');
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user ? '0' + user.phone.slice(2) : '');

  const isLand = type === 'tanah';
  const errors: string[] = [];
  if (title.trim().length < 10) errors.push('Judul minimal 10 huruf');
  if (!parseNumber(price)) errors.push('Harga belum diisi');
  if (!city) errors.push('Kota belum dipilih');
  if (!district.trim()) errors.push('Kecamatan/area belum diisi');
  if (name.trim().length < 2) errors.push('Nama kontak belum diisi');
  if (phone.replace(/\D/g, '').length < 9) errors.push('Nomor WhatsApp belum benar');

  const submit = () => {
    if (errors.length) {
      Alert.alert('Lengkapi data dulu', errors.join('\n'));
      return;
    }
    const digits = phone.replace(/\D/g, '');
    const p = addListing({
      title: title.trim(),
      type,
      listing,
      price: parseNumber(price),
      period: listing === 'sewa' ? period : undefined,
      city: city!,
      district: district.trim(),
      bedrooms: isLand ? undefined : num(bed),
      bathrooms: isLand ? undefined : num(bath),
      landArea: num(land),
      buildingArea: isLand ? undefined : num(building),
      certificate: listing === 'jual' ? certificate : undefined,
      images: [],
      description: description.trim() || 'Belum ada deskripsi.',
      facilities: [],
      owner: { name: name.trim(), phone: digits.startsWith('0') ? '62' + digits.slice(1) : digits, role: 'Pemilik' },
    });
    Alert.alert('Iklan tayang!', 'Iklan Anda sudah muncul di hasil pencarian.', [
      { text: 'Lihat iklan', onPress: () => router.replace(`/property/${p.id}`) },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.h2}>Jenis iklan</Text>
          <View style={styles.wrap}>
            <Chip label="Dijual" active={listing === 'jual'} onPress={() => setListing('jual')} />
            <Chip label="Disewakan" active={listing === 'sewa'} onPress={() => setListing('sewa')} />
          </View>
          <Text style={[styles.h2, { marginTop: 14 }]}>Tipe properti</Text>
          <View style={styles.wrap}>
            {PROPERTY_TYPES.map((t) => (
              <Chip
                key={t.key}
                label={t.label}
                active={type === t.key}
                onPress={() => {
                  setType(t.key);
                  if (t.key === 'kost' || t.key === 'kontrakan') setListing('sewa');
                }}
              />
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.h2}>Informasi utama</Text>
          <Field label="Judul iklan" value={title} onChangeText={setTitle} placeholder="Misal: Rumah 2 lantai dekat stasiun" />
          <Field
            label={listing === 'sewa' ? 'Harga sewa (Rp)' : 'Harga jual (Rp)'}
            value={price}
            onChangeText={(v) => setPrice(formatThousands(v))}
            keyboardType="number-pad"
            placeholder="0"
          />
          {listing === 'sewa' ? (
            <View style={[styles.wrap, { marginTop: -4, marginBottom: 14 }]}>
              <Chip label="per bulan" active={period === 'bulan'} onPress={() => setPeriod('bulan')} />
              <Chip label="per tahun" active={period === 'tahun'} onPress={() => setPeriod('tahun')} />
            </View>
          ) : null}
          <Text style={styles.label}>Kota</Text>
          <View style={[styles.wrap, { marginBottom: 14 }]}>
            {CITIES.map((c) => (
              <Chip key={c} label={c} active={city === c} onPress={() => setCity(c)} />
            ))}
          </View>
          <Field label="Kecamatan / area" value={district} onChangeText={setDistrict} placeholder="Misal: Serpong" />
        </Card>

        <Card>
          <Text style={styles.h2}>Detail properti</Text>
          {!isLand ? (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Kamar tidur" value={bed} onChangeText={setBed} keyboardType="number-pad" placeholder="0" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Kamar mandi" value={bath} onChangeText={setBath} keyboardType="number-pad" placeholder="0" />
              </View>
            </View>
          ) : null}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Luas tanah" value={land} onChangeText={setLand} keyboardType="number-pad" placeholder="0" suffix="m²" />
            </View>
            {!isLand ? (
              <View style={{ flex: 1 }}>
                <Field label="Luas bangunan" value={building} onChangeText={setBuilding} keyboardType="number-pad" placeholder="0" suffix="m²" />
              </View>
            ) : null}
          </View>
          {listing === 'jual' ? (
            <>
              <Text style={styles.label}>Sertifikat</Text>
              <View style={[styles.wrap, { marginBottom: 14 }]}>
                {['SHM', 'SHGB', 'Strata Title', 'Girik/Lainnya'].map((c) => (
                  <Chip key={c} label={c} active={certificate === c} onPress={() => setCertificate(c)} />
                ))}
              </View>
            </>
          ) : null}
          <Field
            label="Deskripsi"
            value={description}
            onChangeText={setDescription}
            placeholder="Ceritakan kelebihan properti, akses, fasilitas sekitar..."
            multiline
            style={{ minHeight: 100, textAlignVertical: 'top', paddingVertical: 12, fontSize: 15, color: C.text, flex: 1 }}
          />
          <Text style={styles.note}>Unggah foto akan tersedia di versi berikutnya.</Text>
        </Card>

        <Card>
          <Text style={styles.h2}>Kontak</Text>
          <Field label="Nama" value={name} onChangeText={setName} placeholder="Nama Anda" />
          <Field label="Nomor WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="08xxxxxxxxxx" />
        </Card>

        <Button title="Tayangkan iklan" icon="megaphone" onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  h2: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 10 },
  note: { fontSize: 12, color: C.muted, fontStyle: 'italic' },
});
