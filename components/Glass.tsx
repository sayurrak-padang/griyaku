import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const liquid = (() => {
  try {
    return Platform.OS === 'ios' && isLiquidGlassAvailable();
  } catch {
    return false;
  }
})();

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** 'liquid' = Liquid Glass asli iOS 26 jika ada; 'frost' = kaca blur biasa */
  variant?: 'liquid' | 'frost';
  intensity?: number;
  radius?: number;
  tint?: string;
};

/**
 * Panel kaca.
 * - iOS 26+: Liquid Glass asli (expo-glass-effect) untuk variant 'liquid'
 * - iOS lama: BlurView
 * - Android / web: lapisan putih transparan (blur asli Android butuh setup khusus)
 * Ditambah tepi terang dan kilau atas agar terlihat seperti kaca.
 */
export function Glass({ children, style, variant = 'frost', intensity = 40, radius = 20, tint }: Props) {
  const flat = StyleSheet.flatten(style) || {};
  const r = (flat.borderRadius as number | undefined) ?? radius;

  if (variant === 'liquid' && liquid) {
    return (
      <GlassView glassEffectStyle="regular" isInteractive tintColor={tint} style={[{ borderRadius: r, overflow: 'hidden' }, style]}>
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[{ borderRadius: r, overflow: 'hidden' }, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.84)' }]} />
      )}
      {/* lapisan warna + kilau atas */}
      <LinearGradient
        colors={[tint ?? 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.12)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: r, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' }]}
      />
      {children}
    </View>
  );
}

export const hasLiquidGlass = liquid;
