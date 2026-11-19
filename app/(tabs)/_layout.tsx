import { Tabs } from 'expo-router';

import { GlassTabBar } from '@/components/GlassTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...(props as unknown as Parameters<typeof GlassTabBar>[0])} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}>
      <Tabs.Screen name="index" options={{ title: 'Beranda' }} />
      <Tabs.Screen name="cari" options={{ title: 'Cari' }} />
      <Tabs.Screen name="kpr" options={{ title: 'KPR' }} />
      <Tabs.Screen name="jasa" options={{ title: 'Jasa' }} />
      <Tabs.Screen name="akun" options={{ title: 'Akun' }} />
    </Tabs>
  );
}
