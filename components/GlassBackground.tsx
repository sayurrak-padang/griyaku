import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';

/** Latar gradasi lembut dengan "gumpalan" warna, agar efek kaca terlihat. */
export function GlassBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#CFF3EC', '#E4EEFF', '#F1E8FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.blob, { top: -80, left: -60, width: 260, height: 260, backgroundColor: '#5FD4C0' }]} />
      <View style={[styles.blob, { top: 260, right: -90, width: 280, height: 280, backgroundColor: '#8FB4FF' }]} />
      <View style={[styles.blob, { bottom: -60, left: -40, width: 240, height: 240, backgroundColor: '#FFC98A' }]} />
      {/* iOS: buramkan gumpalan agar tepinya lembut; platform lain cukup diredupkan */}
      {Platform.OS === 'ios' ? <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} /> : null}
      <LinearGradient
        colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.05)']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', borderRadius: 999, opacity: Platform.OS === 'ios' ? 0.55 : 0.28 },
});
