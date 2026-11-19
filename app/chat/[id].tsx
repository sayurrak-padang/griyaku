import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/Glass';
import { Empty } from '@/components/ui';
import { C, R } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Conversation, getConversation, listMessages, markConversationRead, Message, sendMessage, subscribeMessages } from '@/lib/chat';
import { clock } from '@/lib/time';

const QUICK = ['Apakah masih tersedia?', 'Bisa survei kapan?', 'Harga masih bisa nego?', 'Boleh minta foto tambahan?'];

export default function ChatRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, online, setActiveChat } = useApp();
  const insets = useSafeAreaInsets();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (!online || !user?.id || !id) return;
    let alive = true;
    setActiveChat(id);
    (async () => {
      try {
        const [c, m] = await Promise.all([getConversation(id), listMessages(id)]);
        if (!alive) return;
        setConv(c);
        setMsgs(m);
        markConversationRead(id, user.id!).catch(() => {});
      } catch (e) {
        Alert.alert('Gagal memuat chat', e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    const unsub = subscribeMessages(id, (m) => {
      setMsgs((list) => (list.some((x) => x.id === m.id) ? list : [...list, m]));
      if (m.senderId !== user.id) markConversationRead(id, user.id!).catch(() => {});
    });
    return () => {
      alive = false;
      unsub();
      setActiveChat(null);
    };
  }, [id, online, user?.id, setActiveChat]);

  useEffect(() => {
    if (msgs.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [msgs.length]);

  if (!online || !user?.id) {
    return <Empty icon="chatbubbles-outline" title="Chat belum tersedia" text="Masuk dan sambungkan database untuk memakai chat." />;
  }

  const send = async (body: string) => {
    const t = body.trim();
    if (!t || sending) return;
    setSending(true);
    setText('');
    try {
      const m = await sendMessage(id!, t);
      setMsgs((list) => (list.some((x) => x.id === m.id) ? list : [...list, m]));
    } catch (e) {
      setText(t);
      Alert.alert('Pesan gagal terkirim', e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  const iAmOwner = conv?.ownerId === user.id;
  const other = conv ? (iAmOwner ? conv.seekerName || 'Pencari' : conv.ownerName || 'Pemilik') : 'Chat';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: other }} />
      {conv ? (
        <Pressable style={styles.propBar} onPress={() => router.push(`/property/${conv.propertyId}`)}>
          <Ionicons name="home-outline" size={16} color={C.primary} />
          <Text style={styles.propText} numberOfLines={1}>
            {conv.propertyTitle}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={C.muted} />
        </Pressable>
      ) : null}

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 6, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item: m, index }) => {
            const mine = m.senderId === user.id;
            const last = index === msgs.length - 1 || msgs[index + 1].senderId !== m.senderId;
            return (
              <View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs, last && (mine ? styles.mineTail : styles.theirsTail)]}>
                  <Text style={[styles.msg, mine && { color: '#fff' }]}>{m.body}</Text>
                  <View style={styles.meta}>
                    <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.8)' }]}>{clock(m.createdAt)}</Text>
                    {mine ? (
                      <Ionicons name={m.readAt ? 'checkmark-done' : 'checkmark'} size={13} color="rgba(255,255,255,0.9)" />
                    ) : null}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'flex-end', gap: 8 }}>
              <Text style={styles.hint}>Mulai percakapan dengan pertanyaan cepat:</Text>
              <View style={styles.quickWrap}>
                {QUICK.map((q) => (
                  <Pressable key={q} style={styles.quick} onPress={() => send(q)}>
                    <Text style={styles.quickText}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
        />
      )}

      <Glass radius={0} style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Tulis pesan..."
            placeholderTextColor="#8A9A9C"
            style={styles.input}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={() => send(text)}
            disabled={!text.trim() || sending}
            style={[styles.send, (!text.trim() || sending) && { opacity: 0.5 }]}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </Glass>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  propBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: R.lg,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  propText: { flex: 1, fontSize: 13, fontWeight: '600', color: C.text },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  mine: { backgroundColor: C.primary },
  theirs: { backgroundColor: C.glassStrong, borderWidth: 1, borderColor: C.border },
  mineTail: { borderBottomRightRadius: 6 },
  theirsTail: { borderBottomLeftRadius: 6 },
  msg: { fontSize: 15, color: C.text, lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 2 },
  time: { fontSize: 10, color: C.muted },
  hint: { fontSize: 13, color: C.muted, textAlign: 'center' },
  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  quick: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: C.card, borderWidth: 1, borderColor: C.primary },
  quickText: { fontSize: 13, color: C.primary, fontWeight: '600' },
  inputBar: { paddingHorizontal: 12, paddingTop: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 22,
    backgroundColor: C.glassStrong,
    borderWidth: 1,
    borderColor: C.border,
    fontSize: 15,
    color: C.text,
  },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
});
