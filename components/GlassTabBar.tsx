import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/Glass';
import { C } from '@/constants/theme';

type Icon = keyof typeof Ionicons.glyphMap;

export const TAB_ICONS: Record<string, [Icon, Icon]> = {
  index: ['home-outline', 'home'],
  cari: ['search-outline', 'search'],
  kpr: ['calculator-outline', 'calculator'],
  jasa: ['construct-outline', 'construct'],
  akun: ['person-circle-outline', 'person-circle'],
};

type Props = {
  state: { index: number; routes: { key: string; name: string; params?: object }[] };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    emit: (e: { type: 'tabPress' | 'tabLongPress'; target: string; canPreventDefault?: boolean }) => { defaultPrevented?: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

/** Tab bar melayang bergaya liquid glass. */
export function GlassTabBar({ state, descriptors, navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}>
      <Glass variant="liquid" intensity={60} radius={34} style={styles.bar}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const label = descriptors[route.key]?.options.title ?? route.name;
          const [off, on] = TAB_ICONS[route.name] ?? ['ellipse-outline', 'ellipse'];
          const color = focused ? C.primary : '#3C4D50';
          const onPress = () => {
            const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !e.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={[styles.item, focused && styles.itemOn]}>
              <Ionicons name={focused ? on : off} size={21} color={color} />
              <Text style={[styles.label, { color }, focused && { fontWeight: '800' }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    paddingHorizontal: 6,
    borderRadius: 34,
    ...Platform.select({
      ios: { shadowColor: '#0B3B5A', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
      default: {},
    }),
  },
  item: {
    flex: 1,
    height: 56,
    marginHorizontal: 2,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  itemOn: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  label: { fontSize: 10, fontWeight: '600' },
});
