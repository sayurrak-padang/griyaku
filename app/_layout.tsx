import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { C } from '@/constants/theme';
import { AppProvider } from '@/context/AppContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { anchor: '(tabs)' };

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: C.primary, background: C.bg, card: C.card, text: C.text, border: C.border },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({ ...Ionicons.font });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <AppProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerTintColor: C.text,
            headerTitleStyle: { fontWeight: '700' },
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="property/[id]" options={{ title: 'Detail Properti' }} />
          <Stack.Screen name="service/[id]" options={{ title: 'Pesan Jasa' }} />
          <Stack.Screen name="pasang-iklan" options={{ title: 'Pasang Iklan' }} />
          <Stack.Screen name="favorit" options={{ title: 'Favorit Saya' }} />
          <Stack.Screen name="iklan-saya" options={{ title: 'Iklan Saya' }} />
          <Stack.Screen name="pesanan" options={{ title: 'Pesanan Jasa' }} />
          <Stack.Screen name="login" options={{ title: 'Masuk', presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </AppProvider>
  );
}
