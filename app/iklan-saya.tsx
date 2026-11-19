import { router } from 'expo-router';
import { Alert, FlatList, View } from 'react-native';

import { PropertyCard } from '@/components/PropertyCard';
import { Button, Empty } from '@/components/ui';
import { C } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function IklanSaya() {
  const { myListings, removeListing } = useApp();
  return (
    <FlatList
      style={{ backgroundColor: C.bg }}
      data={myListings}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      ListHeaderComponent={
        myListings.length ? <Button title="Pasang iklan baru" icon="add" onPress={() => router.push('/pasang-iklan')} /> : undefined
      }
      renderItem={({ item }) => (
        <View style={{ gap: 8 }}>
          <PropertyCard p={item} />
          <Button
            title="Hapus iklan"
            variant="outline"
            icon="trash-outline"
            onPress={() =>
              Alert.alert('Hapus iklan?', item.title, [
                { text: 'Batal', style: 'cancel' },
                { text: 'Hapus', style: 'destructive', onPress: () => removeListing(item.id) },
              ])
            }
          />
        </View>
      )}
      ListEmptyComponent={
        <Empty icon="megaphone-outline" title="Belum ada iklan" text="Jual atau sewakan properti Anda secara gratis.">
          <Button title="Pasang iklan" onPress={() => router.push('/pasang-iklan')} />
        </Empty>
      }
    />
  );
}
