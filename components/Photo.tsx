import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { C } from '@/constants/theme';

/** Foto dengan latar cadangan (ikon) kalau gambar belum/gagal dimuat. */
export function Photo({
  uri,
  style,
  icon = 'home',
}: {
  uri?: string;
  style?: StyleProp<ViewStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[styles.box, style]}>
      <Ionicons name={icon} size={36} color={C.primary} style={{ opacity: 0.35 }} />
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
