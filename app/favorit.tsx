import { router } from 'expo-router';
import { FlatList } from 'react-native';

import { PropertyCard } from '@/components/PropertyCard';
import { Button, Empty } from '@/components/ui';
import { C } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function Favorit() {
  const { favorites, getProperty } = useApp();
  const list = favorites.map((id) => getProperty(id)).filter((p) => !!p);
  return (
    <FlatList
      style={{ backgroundColor: C.bg }}
      data={list}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      renderItem={({ item }) => <PropertyCard p={item} />}
      ListEmptyComponent={
        <Empty icon="heart-outline" title="Belum ada favorit" text="Ketuk ikon hati pada properti untuk menyimpannya di sini.">
          <Button title="Mulai cari properti" onPress={() => router.push('/cari')} />
        </Empty>
      }
    />
  );
}
