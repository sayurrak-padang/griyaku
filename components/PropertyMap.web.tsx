import { Ionicons } from '@expo/vector-icons';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

import { C } from '@/constants/theme';
import { Property } from '@/data/properties';

/** Versi web: react-native-maps tidak mendukung web, tampilkan pengganti. */
export function PropertyMap({ properties, style }: { properties: Property[]; style?: StyleProp<ViewStyle>; single?: boolean }) {
  return (
    <View style={[{ backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16 }, style]}>
      <Ionicons name="map" size={36} color={C.primary} />
      <Text style={{ color: C.text, fontWeight: '700' }}>Peta tersedia di aplikasi HP</Text>
      <Text style={{ color: C.muted, fontSize: 12 }}>{properties.length} lokasi properti</Text>
    </View>
  );
}
