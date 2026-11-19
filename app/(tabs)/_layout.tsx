import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';

import { C } from '@/constants/theme';

type Icon = keyof typeof Ionicons.glyphMap;

const tab = (title: string, icon: Icon, iconActive: Icon) => ({
  title,
  tabBarIcon: ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ionicons name={focused ? iconActive : icon} size={24} color={color as string} />
  ),
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={tab('Beranda', 'home-outline', 'home')} />
      <Tabs.Screen name="cari" options={tab('Cari', 'search-outline', 'search')} />
      <Tabs.Screen name="kpr" options={tab('KPR', 'calculator-outline', 'calculator')} />
      <Tabs.Screen name="jasa" options={tab('Jasa', 'construct-outline', 'construct')} />
      <Tabs.Screen name="akun" options={tab('Akun', 'person-circle-outline', 'person-circle')} />
    </Tabs>
  );
}
