import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

import { C } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Tidak ditemukan' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: C.text }}>Halaman tidak ditemukan.</Text>
        <Link href="/" style={{ color: C.primary, fontWeight: '700' }}>
          Kembali ke Beranda
        </Link>
      </View>
    </>
  );
}
