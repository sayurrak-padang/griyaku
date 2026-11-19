import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, IconName } from '@/components/ui';
import { C, R } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function Akun() {
  const { user, logout, favorites, myListings, bookings } = useApp();

  const menu: { icon: IconName; label: string; badge?: number; href: Href }[] = [
    { icon: 'heart-outline', label: 'Favorit saya', badge: favorites.length, href: '/favorit' },
    { icon: 'megaphone-outline', label: 'Iklan saya', badge: myListings.length, href: '/iklan-saya' },
    { icon: 'receipt-outline', label: 'Pesanan jasa', badge: bookings.length, href: '/pesanan' },
    { icon: 'add-circle-outline', label: 'Pasang iklan baru', href: '/pasang-iklan' },
    { icon: 'calculator-outline', label: 'Simulasi KPR', href: '/kpr' },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.h1}>Akun</Text>

        <View style={styles.profile}>
          <View style={styles.avatar}>
            {user ? (
              <Text style={styles.avatarText}>{user.name.slice(0, 1).toUpperCase()}</Text>
            ) : (
              <Ionicons name="person" size={28} color={C.primary} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user ? user.name : 'Belum masuk'}</Text>
            <Text style={styles.phone}>{user ? `+${user.phone}` : 'Masuk untuk menyimpan iklan dan pesanan'}</Text>
          </View>
        </View>
        {!user ? <Button title="Masuk / Daftar" onPress={() => router.push('/login')} style={{ marginTop: 12 }} /> : null}

        <View style={styles.menu}>
          {menu.map((m, i) => (
            <Pressable
              key={m.label}
              style={[styles.menuItem, i < menu.length - 1 && styles.menuBorder]}
              onPress={() => router.push(m.href)}>
              <Ionicons name={m.icon} size={22} color={C.primary} />
              <Text style={styles.menuLabel}>{m.label}</Text>
              {m.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{m.badge}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </Pressable>
          ))}
        </View>

        <View style={styles.menu}>
          <Pressable
            style={[styles.menuItem, styles.menuBorder]}
            onPress={() => Alert.alert('Bantuan', 'Hubungi kami di WhatsApp atau email. (Kontak resmi akan diisi nanti.)')}>
            <Ionicons name="help-circle-outline" size={22} color={C.primary} />
            <Text style={styles.menuLabel}>Pusat bantuan</Text>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => Alert.alert('Tentang Griyaku', 'Versi 1.0.0 (prototipe dengan data contoh).')}>
            <Ionicons name="information-circle-outline" size={22} color={C.primary} />
            <Text style={styles.menuLabel}>Tentang aplikasi</Text>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </Pressable>
        </View>

        {user ? <Button title="Keluar" variant="outline" icon="log-out-outline" onPress={logout} style={{ marginTop: 20 }} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '800', color: C.text, marginTop: 8, marginBottom: 16 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.card,
    padding: 16,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '800', color: C.primary },
  name: { fontSize: 17, fontWeight: '800', color: C.text },
  phone: { fontSize: 13, color: C.muted, marginTop: 2 },
  menu: { backgroundColor: C.card, borderRadius: R.lg, marginTop: 16, borderWidth: 1, borderColor: C.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  menuBorder: { borderBottomWidth: 1, borderColor: C.border },
  menuLabel: { flex: 1, fontSize: 15, color: C.text },
  badge: { backgroundColor: C.primary, borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
