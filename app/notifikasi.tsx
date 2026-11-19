import { Ionicons } from '@expo/vector-icons';
import { Href, router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Empty, IconName } from '@/components/ui';
import { C, R } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { shortTime } from '@/lib/time';

const ICON: Record<string, [IconName, string]> = {
  chat: ['chatbubble-ellipses', C.primary],
  pesanan: ['receipt', C.info],
  iklan: ['megaphone', '#D9831B'],
  info: ['information-circle', C.muted],
};

export default function Notifikasi() {
  const { notifications, markAllNotificationsRead, refreshNotifications } = useApp();

  useFocusEffect(
    useCallback(() => {
      refreshNotifications();
      // tandai dibaca setelah sempat terlihat
      const t = setTimeout(markAllNotificationsRead, 1500);
      return () => clearTimeout(t);
    }, [markAllNotificationsRead, refreshNotifications])
  );

  return (
    <FlatList
      data={notifications}
      keyExtractor={(n) => n.id}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      renderItem={({ item: n }) => {
        const [icon, color] = ICON[n.kind] ?? ICON.info;
        return (
          <Pressable
            style={[styles.row, !n.read && styles.unread]}
            onPress={() => n.link && router.push(n.link as Href)}>
            <View style={[styles.icon, { backgroundColor: color }]}>
              <Ionicons name={icon} size={18} color="#fff" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text style={styles.title} numberOfLines={2}>
                  {n.title}
                </Text>
                <Text style={styles.time}>{shortTime(n.createdAt)}</Text>
              </View>
              <Text style={styles.body} numberOfLines={3}>
                {n.body}
              </Text>
            </View>
            {!n.read ? <View style={styles.dot} /> : null}
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <Empty icon="notifications-outline" title="Belum ada notifikasi" text="Pesan chat dan kabar pesanan jasa akan muncul di sini." />
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: R.xl,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'flex-start',
  },
  unread: { backgroundColor: C.glassStrong },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '800', color: C.text, flex: 1 },
  time: { fontSize: 11, color: C.muted },
  body: { fontSize: 13, color: C.muted, lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.danger, marginTop: 6 },
});
