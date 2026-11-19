import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Photo } from '@/components/Photo';
import { ReviewsSection } from '@/components/Reviews';
import { StatusBadge } from '@/components/StatusBadge';
import { PropertyMap } from '@/components/PropertyMap';
import { priceText } from '@/components/PropertyCard';
import { Button, Empty, IconName } from '@/components/ui';
import { C, R } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { typeLabel } from '@/data/properties';
import { formatDate, monthlyInstallment, rupiah, rupiahShort } from '@/lib/format';
import { isChatable, openConversation } from '@/lib/chat';
import { openInMaps } from '@/lib/geo';

export default function PropertyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProperty, isFavorite, toggleFavorite, user, online } = useApp();
  const [opening, setOpening] = useState(false);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const p = getProperty(id);

  if (!p) {
    return <Empty icon="alert-circle-outline" title="Properti tidak ditemukan" text="Iklan ini mungkin sudah dihapus." />;
  }

  const fav = isFavorite(p.id);
  const chatable = online && isChatable(p);
  const startChat = async () => {
    if (!user?.id) {
      Alert.alert('Masuk dulu', 'Silakan masuk untuk mengirim pesan ke pemilik.', [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Masuk', onPress: () => router.push('/login') },
      ]);
      return;
    }
    setOpening(true);
    try {
      const c = await openConversation(p, { id: user.id, name: user.name });
      router.push(`/chat/${c.id}`);
    } catch (e) {
      Alert.alert('Gagal membuka chat', e instanceof Error ? e.message : String(e));
    } finally {
      setOpening(false);
    }
  };
  const canKpr = p.listing === 'jual' && p.type !== 'gudang';
  const monthly = monthlyInstallment(p.price * 0.9, 7.5, 20);
  const waText = encodeURIComponent(`Halo ${p.owner.name}, saya tertarik dengan "${p.title}" di Griyaku. Apakah masih tersedia?`);

  const specs: [IconName, string, string | number | undefined][] = [
    ['bed-outline', 'Kamar tidur', p.bedrooms],
    ['water-outline', 'Kamar mandi', p.bathrooms],
    ['resize-outline', 'Luas tanah', p.landArea ? `${p.landArea} m²` : undefined],
    ['home-outline', 'Luas bangunan', p.buildingArea ? `${p.buildingArea} m²` : undefined],
    ['document-text-outline', 'Sertifikat', p.certificate],
    ['cube-outline', 'Perabot', p.furnished ? (p.furnished === 'Tidak' ? 'Kosong' : p.furnished === 'Semi' ? 'Semi furnished' : 'Full furnished') : undefined],
    ['people-outline', 'Khusus', p.kostFor],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack.Screen
        options={{
          title: typeLabel(p.type),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Pressable
                hitSlop={8}
                onPress={() => Share.share({ message: `${p.title} - ${priceText(p)} di ${p.district}, ${p.city}. Lihat di Griyaku.` })}>
                <Ionicons name="share-social-outline" size={22} color={C.text} />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => toggleFavorite(p.id)}>
                <Ionicons name={fav ? 'heart' : 'heart-outline'} size={22} color={fav ? C.danger : C.text} />
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {p.images.length ? (
              p.images.map((uri) => <Photo key={uri} uri={uri} style={{ width, height: 260 }} />)
            ) : (
              <Photo style={{ width, height: 260 }} />
            )}
          </ScrollView>
          {p.images.length > 1 ? (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {page + 1}/{p.images.length}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <Tag text={p.listing === 'jual' ? 'Dijual' : 'Disewakan'} color={C.primary} />
            {p.verified ? <Tag text="Terverifikasi" color={C.info} icon="shield-checkmark" /> : null}
            {p.isNew ? <Tag text="Unit baru" color={C.accent} /> : null}
          </View>
          <Text style={styles.price}>{priceText(p)}</Text>
          {p.period ? null : <Text style={styles.exact}>{rupiah(p.price)}</Text>}
          {p.status && p.status !== 'aktif' ? <StatusBadge status={p.status} reason={p.rejectReason} /> : null}
          <Text style={styles.title}>{p.title}</Text>
          <View style={styles.loc}>
            <Ionicons name="location" size={15} color={C.primary} />
            <Text style={styles.locText}>
              {p.district}, {p.city}
            </Text>
          </View>
          <Text style={styles.posted}>Diiklankan {formatDate(p.postedAt)}</Text>
        </View>

        {canKpr ? (
          <Pressable style={styles.kpr} onPress={() => router.push({ pathname: '/kpr', params: { price: String(p.price) } })}>
            <Ionicons name="calculator" size={22} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.kprTitle}>Cicilan mulai {rupiahShort(monthly)}/bulan</Text>
              <Text style={styles.kprText}>DP 10%, 20 tahun, bunga 7,5%. Ketuk untuk ubah simulasi.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.primary} />
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.h2}>Spesifikasi</Text>
          <View style={styles.specGrid}>
            {specs
              .filter(([, , v]) => v !== undefined && v !== '')
              .map(([icon, label, v]) => (
                <View key={label} style={styles.spec}>
                  <Ionicons name={icon} size={20} color={C.primary} />
                  <View>
                    <Text style={styles.specLabel}>{label}</Text>
                    <Text style={styles.specValue}>{v}</Text>
                  </View>
                </View>
              ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Deskripsi</Text>
          <Text style={styles.desc}>{p.description}</Text>
        </View>

        {p.facilities.length ? (
          <View style={styles.section}>
            <Text style={styles.h2}>Fasilitas</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {p.facilities.map((f) => (
                <View key={f} style={styles.facility}>
                  <Ionicons name="checkmark-circle" size={15} color={C.primary} />
                  <Text style={styles.facilityText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {p.lat !== undefined && p.lng !== undefined ? (
          <View style={styles.section}>
            <Text style={styles.h2}>Lokasi</Text>
            <View style={{ borderRadius: R.md, overflow: 'hidden' }}>
              <PropertyMap properties={[p]} single style={{ height: 180 }} />
            </View>
            <Text style={styles.locText}>
              {p.district}, {p.city} {p.mine ? '' : '(lokasi perkiraan)'}
            </Text>
            <Button
              title="Buka di aplikasi peta"
              variant="outline"
              icon="navigate-outline"
              onPress={() => openInMaps(p.lat!, p.lng!, p.title)}
            />
          </View>
        ) : null}

        {!p.status || p.status === 'aktif' ? (
          <ReviewsSection targetType="property" targetId={p.id} canReview={!p.mine} style={styles.section} />
        ) : null}

        <View style={styles.section}>
          <Text style={styles.h2}>Diiklankan oleh</Text>
          <View style={styles.owner}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{p.owner.name.slice(0, 1)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ownerName}>{p.owner.name}</Text>
              <Text style={styles.ownerRole}>{p.owner.role}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, styles.safety]}>
          <Ionicons name="warning-outline" size={18} color="#B7791F" />
          <Text style={styles.safetyText}>
            Jangan transfer uang tanda jadi sebelum melihat properti dan memastikan legalitasnya.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={styles.iconBtn} onPress={() => Linking.openURL(`tel:+${p.owner.phone}`)} accessibilityLabel="Telepon">
          <Ionicons name="call-outline" size={20} color={C.primary} />
        </Pressable>
        <Button
          title="WhatsApp"
          variant={chatable ? 'outline' : 'primary'}
          icon="logo-whatsapp"
          style={{ flex: 1 }}
          onPress={() => Linking.openURL(`https://wa.me/${p.owner.phone}?text=${waText}`)}
        />
        {chatable ? (
          <Button title={opening ? 'Membuka...' : 'Chat'} icon="chatbubbles" style={{ flex: 1 }} onPress={startChat} disabled={opening} />
        ) : null}
      </View>
    </View>
  );
}

function Tag({ text, color, icon }: { text: string; color: string; icon?: IconName }) {
  return (
    <View style={[styles.tag, { backgroundColor: color }]}>
      {icon ? <Ionicons name={icon} size={11} color="#fff" /> : null}
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 50,
    borderRadius: R.md,
    borderWidth: 1.5,
    borderColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  counter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  section: { backgroundColor: C.card, padding: 16, marginTop: 10, marginHorizontal: 12, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, gap: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  price: { fontSize: 26, fontWeight: '800', color: C.text, marginTop: 6 },
  exact: { fontSize: 13, color: C.muted },
  title: { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 4 },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { fontSize: 14, color: C.muted },
  posted: { fontSize: 12, color: C.muted, marginTop: 2 },
  kpr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: R.md,
    backgroundColor: C.primarySoft,
  },
  kprTitle: { fontSize: 15, fontWeight: '800', color: C.primaryDark },
  kprText: { fontSize: 12, color: C.text, marginTop: 2 },
  h2: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 6 },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 },
  spec: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  specLabel: { fontSize: 12, color: C.muted },
  specValue: { fontSize: 14, fontWeight: '700', color: C.text },
  desc: { fontSize: 14, color: C.text, lineHeight: 21 },
  facility: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.glassStrong,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  facilityText: { fontSize: 13, color: C.text },
  owner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: C.primary },
  ownerName: { fontSize: 15, fontWeight: '700', color: C.text },
  ownerRole: { fontSize: 13, color: C.muted },
  safety: { flexDirection: 'row', backgroundColor: C.accentSoft, gap: 10, alignItems: 'flex-start' },
  safetyText: { flex: 1, fontSize: 12, color: C.text, lineHeight: 18 },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderTopWidth: 1,
    borderColor: C.border,
  },
});
