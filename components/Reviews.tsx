import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui';
import { C, R } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/lib/format';
import * as rv from '@/lib/reviews';

const LABELS = ['', 'Buruk', 'Kurang', 'Cukup', 'Bagus', 'Sangat bagus'];

export function Stars({ value, size = 14, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: onChange ? 8 : 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const name = value >= i ? 'star' : value >= i - 0.5 ? 'star-half' : 'star-outline';
        const icon = <Ionicons name={name} size={size} color="#E0A100" />;
        return onChange ? (
          <Pressable key={i} onPress={() => onChange(i)} hitSlop={6} accessibilityLabel={`${i} bintang`}>
            {icon}
          </Pressable>
        ) : (
          <View key={i}>{icon}</View>
        );
      })}
    </View>
  );
}

/**
 * Bagian ulasan untuk detail properti / jasa.
 * `canReview=false` untuk pemilik iklan (tidak boleh mengulas iklannya sendiri).
 */
export function ReviewsSection({
  targetType,
  targetId,
  canReview = true,
  style,
}: {
  targetType: rv.TargetType;
  targetId: string;
  canReview?: boolean;
  style?: object;
}) {
  const { user, online, banned } = useApp();
  const [list, setList] = useState<rv.Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [writing, setWriting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    try {
      setList(await rv.listReviews(targetType, targetId));
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    load();
  }, [load]);

  const mine = list.find((r) => rv.isMine(r, user?.id));
  const others = list.filter((r) => r !== mine && !r.hidden);
  const { average, count } = rv.summarize(list);
  const shown = showAll ? others : others.slice(0, 3);

  const startWriting = () => {
    if (online && !user?.id) {
      Alert.alert('Masuk dulu', 'Silakan masuk untuk menulis ulasan.', [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Masuk', onPress: () => router.push('/login') },
      ]);
      return;
    }
    if (banned) {
      Alert.alert('Akun diblokir', 'Akun Anda tidak bisa menulis ulasan.');
      return;
    }
    setRating(mine?.rating ?? 0);
    setComment(mine?.comment ?? '');
    setWriting(true);
  };

  const submit = async () => {
    if (!rating) {
      Alert.alert('Pilih bintang', 'Beri nilai 1 sampai 5 bintang.');
      return;
    }
    setSaving(true);
    try {
      const saved = await rv.saveReview(targetType, targetId, rating, comment, { id: user?.id, name: user?.name ?? '' });
      setList((l) => [saved, ...l.filter((r) => r.id !== saved.id)]);
      setWriting(false);
    } catch (e) {
      Alert.alert('Gagal menyimpan ulasan', e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    mine &&
    Alert.alert('Hapus ulasan Anda?', '', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await rv.deleteReview(mine.id);
            setList((l) => l.filter((r) => r.id !== mine.id));
          } catch (e) {
            Alert.alert('Gagal menghapus', e instanceof Error ? e.message : String(e));
          }
        },
      },
    ]);

  return (
    <View style={style}>
      <View style={styles.head}>
        <Text style={styles.h2}>Ulasan</Text>
        {count ? (
          <View style={styles.avg}>
            <Text style={styles.avgNum}>{average.toFixed(1)}</Text>
            <Stars value={average} />
            <Text style={styles.muted}>({count})</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginVertical: 8 }} />
      ) : failed ? (
        <Text style={styles.muted}>Ulasan belum bisa dimuat. Pastikan supabase/reviews.sql sudah dijalankan.</Text>
      ) : !count && !mine ? (
        <Text style={styles.muted}>Belum ada ulasan. {canReview ? 'Jadilah yang pertama!' : ''}</Text>
      ) : null}

      {mine && !writing ? (
        <View style={[styles.review, styles.mine]}>
          <View style={styles.row}>
            <Text style={styles.name}>Ulasan Anda</Text>
            <Stars value={mine.rating} />
          </View>
          {mine.hidden ? <Text style={styles.hiddenNote}>Disembunyikan oleh admin</Text> : null}
          {mine.comment ? <Text style={styles.comment}>{mine.comment}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
            <Pressable onPress={startWriting} hitSlop={6}>
              <Text style={styles.link}>Ubah</Text>
            </Pressable>
            <Pressable onPress={remove} hitSlop={6}>
              <Text style={[styles.link, { color: C.danger }]}>Hapus</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {writing ? (
        <View style={styles.form}>
          <Stars value={rating} size={30} onChange={setRating} />
          <Text style={styles.muted}>{rating ? LABELS[rating] : 'Ketuk bintang untuk memberi nilai'}</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Ceritakan pengalaman Anda (opsional)"
            placeholderTextColor="#9AA5A3"
            multiline
            maxLength={1000}
            style={styles.input}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Batal" variant="outline" style={{ flex: 1 }} onPress={() => setWriting(false)} />
            <Button title={saving ? 'Menyimpan...' : 'Kirim'} style={{ flex: 1 }} disabled={saving} onPress={submit} />
          </View>
        </View>
      ) : null}

      {shown.map((r) => (
        <View key={r.id} style={styles.review}>
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{r.userName.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{r.userName}</Text>
              <Text style={styles.date}>{formatDate(r.createdAt)}</Text>
            </View>
            <Stars value={r.rating} />
          </View>
          {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
        </View>
      ))}

      {others.length > 3 ? (
        <Pressable onPress={() => setShowAll((v) => !v)} hitSlop={6}>
          <Text style={styles.link}>{showAll ? 'Tampilkan lebih sedikit' : `Lihat semua ${others.length} ulasan`}</Text>
        </Pressable>
      ) : null}

      {canReview && !mine && !writing && !loading && !failed ? (
        <Button title="Tulis ulasan" variant="outline" icon="star-outline" onPress={startWriting} style={{ marginTop: 6 }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  h2: { fontSize: 17, fontWeight: '800', color: C.text },
  avg: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avgNum: { fontSize: 16, fontWeight: '800', color: C.text },
  muted: { fontSize: 13, color: C.muted },
  review: { paddingVertical: 10, borderTopWidth: 1, borderColor: C.hairline, gap: 6 },
  mine: { backgroundColor: C.primarySoft, borderRadius: R.md, paddingHorizontal: 12, borderTopWidth: 0, marginVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.primary, fontWeight: '800' },
  name: { fontSize: 14, fontWeight: '700', color: C.text },
  date: { fontSize: 11.5, color: C.muted },
  comment: { fontSize: 14, color: C.text, lineHeight: 20 },
  link: { fontSize: 13.5, fontWeight: '700', color: C.primary },
  hiddenNote: { fontSize: 12, color: C.danger, fontWeight: '600' },
  form: { gap: 10, alignItems: 'stretch', marginVertical: 6 },
  input: { minHeight: 80, borderRadius: R.sm, backgroundColor: C.glassStrong, padding: 12, fontSize: 14, color: C.text, textAlignVertical: 'top', borderWidth: 1, borderColor: C.border },
});
