import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Photo } from '@/components/Photo';
import { Button, Empty } from '@/components/ui';
import { C, R } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Conversation, listConversations } from '@/lib/chat';
import { shortTime } from '@/lib/time';

export default function ChatList() {
  const { online, user, notifications } = useApp();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!online || !user?.id) return;
    setLoading(true);
    try {
      setItems(await listConversations());
    } catch {
    } finally {
      setLoading(false);
    }
  }, [online, user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!online) {
    return <Empty icon="chatbubbles-outline" title="Chat belum aktif" text="Chat membutuhkan database Supabase yang tersambung." />;
  }
  if (!user) {
    return (
      <Empty icon="chatbubbles-outline" title="Masuk untuk chat" text="Masuk agar bisa mengobrol dengan pemilik atau pencari properti.">
        <Button title="Masuk / Daftar" onPress={() => router.push('/login')} />
      </Empty>
    );
  }

  const unreadFor = (id: string) => notifications.filter((n) => !n.read && n.link === `/chat/${id}`).length;

  return (
    <FlatList
      data={items}
      keyExtractor={(c) => c.id}
      refreshing={loading}
      onRefresh={load}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      renderItem={({ item: c }) => {
        const iAmOwner = c.ownerId === user.id;
        const other = iAmOwner ? c.seekerName || 'Pencari' : c.ownerName || 'Pemilik';
        const unread = unreadFor(c.id);
        return (
          <Pressable style={styles.row} onPress={() => router.push(`/chat/${c.id}`)}>
            <Photo uri={c.propertyImage} style={styles.thumb} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.top}>
                <Text style={styles.name} numberOfLines={1}>
                  {other}
                </Text>
                <Text style={styles.time}>{shortTime(c.lastAt)}</Text>
              </View>
              <Text style={styles.prop} numberOfLines={1}>
                {iAmOwner ? 'Iklan Anda · ' : ''}
                {c.propertyTitle}
              </Text>
              <View style={styles.top}>
                <Text style={[styles.last, unread ? { color: C.text, fontWeight: '700' } : null]} numberOfLines={1}>
                  {c.lastMessage ?? 'Belum ada pesan'}
                </Text>
                {unread ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unread}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        loading ? undefined : (
          <Empty
            icon="chatbubbles-outline"
            title="Belum ada percakapan"
            text='Buka iklan properti lalu ketuk "Chat" untuk bertanya langsung ke pemiliknya.'>
            <Button title="Cari properti" icon="search" onPress={() => router.push('/cari')} />
          </Empty>
        )
      }
      ListFooterComponent={
        items.length ? (
          <View style={styles.tip}>
            <Ionicons name="shield-checkmark-outline" size={16} color={C.primary} />
            <Text style={styles.tipText}>Jangan bagikan kode OTP atau transfer uang sebelum melihat properti.</Text>
          </View>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: R.xl,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  thumb: { width: 56, height: 56, borderRadius: 16 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 15, fontWeight: '800', color: C.text, flex: 1 },
  time: { fontSize: 11, color: C.muted },
  prop: { fontSize: 12, color: C.primary, fontWeight: '600' },
  last: { fontSize: 13, color: C.muted, flex: 1 },
  badge: { backgroundColor: C.primary, borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  tip: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 8, paddingHorizontal: 4 },
  tipText: { fontSize: 12, color: C.muted, flex: 1 },
});
