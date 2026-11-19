import { Tabs, useIsFocused } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';

import { GlassTabBar } from '@/components/GlassTabBar';

/**
 * Latar layar transparan (agar latar kaca terlihat) membuat tab yang tidak aktif ikut terlihat
 * di web, karena web hanya menaruhnya di belakang. Sembunyikan tab yang tidak aktif.
 */
function HideWhenBlurred({ children }: { children: ReactNode }) {
  const focused = useIsFocused();
  if (Platform.OS !== 'web') return <>{children}</>;
  return <View style={{ flex: 1, display: focused ? 'flex' : 'none' }}>{children}</View>;
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...(props as unknown as Parameters<typeof GlassTabBar>[0])} />}
      screenLayout={({ children }) => <HideWhenBlurred>{children}</HideWhenBlurred>}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}>
      <Tabs.Screen name="index" options={{ title: 'Beranda' }} />
      <Tabs.Screen name="cari" options={{ title: 'Cari' }} />
      <Tabs.Screen name="kpr" options={{ title: 'KPR' }} />
      <Tabs.Screen name="jasa" options={{ title: 'Jasa' }} />
      <Tabs.Screen name="akun" options={{ title: 'Akun' }} />
    </Tabs>
  );
}
