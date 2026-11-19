import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { C, R } from '@/constants/theme';

const MAX = 8;

export function PhotoPicker({ value, onChange }: { value: string[]; onChange: (uris: string[]) => void }) {
  const left = MAX - value.length;

  const fromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Izin dibutuhkan', 'Izinkan akses galeri di pengaturan HP untuk menambahkan foto.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: left,
      quality: 0.7,
    });
    if (!res.canceled) onChange([...value, ...res.assets.map((a) => a.uri)].slice(0, MAX));
  };

  const fromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Izin dibutuhkan', 'Izinkan akses kamera di pengaturan HP untuk memotret properti.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled) onChange([...value, res.assets[0].uri].slice(0, MAX));
  };

  return (
    <View>
      <Text style={styles.label}>
        Foto properti ({value.length}/{MAX})
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {value.map((uri, i) => (
          <View key={uri + i} style={styles.thumb}>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            {i === 0 ? (
              <View style={styles.cover}>
                <Text style={styles.coverText}>Sampul</Text>
              </View>
            ) : null}
            <Pressable style={styles.remove} hitSlop={6} onPress={() => onChange(value.filter((_, j) => j !== i))}>
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
        {left > 0 ? (
          <>
            <Pressable style={[styles.thumb, styles.add]} onPress={fromGallery}>
              <Ionicons name="images-outline" size={24} color={C.primary} />
              <Text style={styles.addText}>Galeri</Text>
            </Pressable>
            {Platform.OS !== 'web' ? (
              <Pressable style={[styles.thumb, styles.add]} onPress={fromCamera}>
                <Ionicons name="camera-outline" size={24} color={C.primary} />
                <Text style={styles.addText}>Kamera</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </ScrollView>
      <Text style={styles.hint}>Foto pertama menjadi sampul. Foto terang dan rapi lebih banyak dilihat.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },
  thumb: { width: 96, height: 96, borderRadius: R.md, overflow: 'hidden', backgroundColor: C.bg },
  add: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: C.primarySoft,
  },
  addText: { fontSize: 12, color: C.primary, fontWeight: '700' },
  cover: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 2 },
  coverText: { color: '#fff', fontSize: 11, textAlign: 'center', fontWeight: '600' },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontSize: 12, color: C.muted, marginTop: 8 },
});
