import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Photo } from '@/components/Photo';
import { priceText } from '@/components/PropertyCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Button, Card, Chip, Empty } from '@/components/ui';
import { C, R } from '@/constants/theme';
import { Booking, useApp } from '@/context/AppContext';
import { Property } from '@/data/properties';
import { Stars } from '@/components/Reviews';
import { SERVICES } from '@/data/services';
import * as admin from '@/lib/admin';
import { METHOD_LABEL, PAYMENT_LABEL } from '@/lib/payments';
import * as rv from '@/lib/reviews';
import { formatDate, rupiah } from '@/lib/format';

type Tab = 'iklan' | 'ulasan' | 'pesanan' | 'pengguna';

const PROP_FILTERS: { key: admin.PropertyStatus | 'semua'; label: string }[] = [
  { key: 'menunggu', label: 'Menunggu' },
  { key: 'aktif', label: 'Tayang' },
  { key: 'ditolak', label: 'Ditolak' },
  { key: 'semua', label: 'Semua' },
];

const BOOKING_STATUS: Booking['status'][] = ['Menunggu konfirmasi', 'Dijadwalkan', 'Selesai', 'Dibatalkan'];

const errText = (e: unknown) => (e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e));

export default function AdminPanel() {
  const { isAdmin, online, user, refresh } = useApp();
  const [tab, setTab] = useState<Tab>('iklan');

  if (!online || !user?.id || !isAdmin) {
    return (
      <Empty
        icon="shield-outline"
        title="Khusus admin"
        text="Halaman ini hanya untuk akun admin Griyaku. Jadikan akun Anda admin lewat Supabase SQL Editor (lihat README).">
        <Button title="Kembali" variant="outline" onPress={() => router.back()} />
      </Empty>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Stack.Screen options={{ title: 'Panel Admin' }} />
      <View style={styles.tabs}>
        {(
          [
            ['iklan', 'Iklan', 'home-outline'],
            ['ulasan', 'Ulasan', 'star-outline'],
            ['pesanan', 'Pesanan', 'receipt-outline'],
            ['pengguna', 'Pengguna', 'people-outline'],
          ] as const
        ).map(([k, label, icon]) => (
          <Pressable key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && styles.tabActive]}>
            <Ionicons name={icon} size={16} color={tab === k ? '#fff' : C.muted} />
            <Text style={[styles.tabText, tab === k && { color: '#fff' }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'iklan' ? <ListingsTab onChanged={refresh} /> : tab === 'ulasan' ? <ReviewsTab /> : tab === 'pesanan' ? <BookingsTab /> : <UsersTab myId={user.id} />}
    </View>
  );
}

function useLoader<T>(load: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await load());
    } catch (e) {
      Alert.alert('Gagal memuat', errText(e));
    } finally {
      setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { items, setItems, loading, reload };
}

// ============ IKLAN ============
function ListingsTab({ onChanged }: { onChanged: () => Promise<void> }) {
  const [filter, setFilter] = useState<admin.PropertyStatus | 'semua'>('menunggu');
  const load = useCallback(() => admin.listPropertiesByStatus(filter), [filter]);
  const { items, loading, reload } = useLoader<Property>(load);
  const [rejecting, setRejecting] = useState<Property | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    try {
      await fn();
      await reload();
      onChanged();
    } catch (e) {
      Alert.alert('Gagal', errText(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={C.primary} />}
        ListHeaderComponent={
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {PROP_FILTERS.map((f) => (
              <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
            ))}
          </ScrollView>
        }
        renderItem={({ item: p }) => (
          <Card style={{ gap: 10 }}>
            <Pressable onPress={() => router.push(`/property/${p.id}`)} style={{ flexDirection: 'row', gap: 12 }}>
              <Photo uri={p.images[0]} style={styles.thumb} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.title} numberOfLines={2}>
                  {p.title}
                </Text>
                <Text style={styles.price}>{priceText(p)}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {p.district}, {p.city} · {p.owner.name} ({p.owner.phone})
                </Text>
                <Text style={styles.meta}>Dipasang {formatDate(p.postedAt)}</Text>
              </View>
            </Pressable>
            <View style={styles.rowWrap}>
              <StatusBadge status={p.status} reason={p.rejectReason} />
              {p.verified ? (
                <View style={styles.verified}>
                  <Ionicons name="shield-checkmark" size={12} color={C.primary} />
                  <Text style={styles.verifiedText}>Terverifikasi</Text>
                </View>
              ) : null}
            </View>
            {busy === p.id ? (
              <ActivityIndicator color={C.primary} />
            ) : (
              <View style={styles.rowWrap}>
                {p.status !== 'aktif' ? (
                  <SmallBtn icon="checkmark" label="Setujui" color={C.primary} onPress={() => act(p.id, () => admin.setPropertyStatus(p.id, 'aktif'))} />
                ) : null}
                {p.status !== 'ditolak' ? (
                  <SmallBtn
                    icon="close"
                    label="Tolak"
                    color={C.danger}
                    onPress={() => {
                      setReason('');
                      setRejecting(p);
                    }}
                  />
                ) : null}
                <SmallBtn
                  icon={p.verified ? 'shield-outline' : 'shield-checkmark-outline'}
                  label={p.verified ? 'Cabut verifikasi' : 'Verifikasi'}
                  color={C.info}
                  onPress={() => act(p.id, () => admin.setPropertyVerified(p.id, !p.verified))}
                />
                <SmallBtn
                  icon="trash-outline"
                  label="Hapus"
                  color={C.muted}
                  onPress={() =>
                    Alert.alert('Hapus iklan ini?', p.title, [
                      { text: 'Batal', style: 'cancel' },
                      { text: 'Hapus', style: 'destructive', onPress: () => act(p.id, () => admin.deleteProperty(p.id)) },
                    ])
                  }
                />
              </View>
            )}
          </Card>
        )}
        ListEmptyComponent={
          loading ? undefined : (
            <Empty icon="checkmark-done-outline" title="Tidak ada iklan" text="Belum ada iklan dengan status ini." />
          )
        }
      />

      <Modal visible={!!rejecting} transparent animationType="fade" onRequestClose={() => setRejecting(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Tolak iklan</Text>
            <Text style={styles.meta} numberOfLines={2}>
              {rejecting?.title}
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Alasan (dikirim ke pemilik), mis. foto tidak jelas"
              placeholderTextColor="#9AA5A3"
              multiline
              style={styles.input}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Batal" variant="outline" style={{ flex: 1 }} onPress={() => setRejecting(null)} />
              <Button
                title="Tolak"
                style={{ flex: 1, backgroundColor: C.danger }}
                onPress={() => {
                  const p = rejecting;
                  setRejecting(null);
                  if (p) act(p.id, () => admin.setPropertyStatus(p.id, 'ditolak', reason));
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ============ ULASAN ============
function ReviewsTab() {
  const { getProperty } = useApp();
  const { items, setItems, loading, reload } = useLoader<rv.Review>(rv.listAllReviews);
  const [filter, setFilter] = useState<'semua' | 'tampil' | 'disembunyikan' | 'rendah'>('semua');
  const list = items.filter((r) =>
    filter === 'tampil' ? !r.hidden : filter === 'disembunyikan' ? r.hidden : filter === 'rendah' ? r.rating <= 2 : true,
  );
  const targetName = (r: rv.Review) =>
    r.targetType === 'service'
      ? `Jasa: ${SERVICES.find((s) => s.id === r.targetId)?.name ?? r.targetId}`
      : `Properti: ${getProperty(r.targetId)?.title ?? 'iklan tidak tersedia'}`;

  const toggle = async (r: rv.Review) => {
    setItems((xs) => xs.map((x) => (x.id === r.id ? { ...x, hidden: !r.hidden } : x)));
    try {
      await rv.setReviewHidden(r.id, !r.hidden);
    } catch (e) {
      setItems((xs) => xs.map((x) => (x.id === r.id ? r : x)));
      Alert.alert('Gagal', errText(e));
    }
  };
  const remove = (r: rv.Review) =>
    Alert.alert('Hapus ulasan ini?', r.comment || `${r.rating} bintang`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await rv.deleteReview(r.id);
            setItems((xs) => xs.filter((x) => x.id !== r.id));
          } catch (e) {
            Alert.alert('Gagal', errText(e));
          }
        },
      },
    ]);

  return (
    <FlatList
      data={list}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={C.primary} />}
      ListHeaderComponent={
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {(
            [
              ['semua', 'Semua'],
              ['rendah', 'Bintang 1-2'],
              ['tampil', 'Tampil'],
              ['disembunyikan', 'Disembunyikan'],
            ] as const
          ).map(([k, label]) => (
            <Chip key={k} label={label} active={filter === k} onPress={() => setFilter(k)} />
          ))}
        </ScrollView>
      }
      renderItem={({ item: r }) => (
        <Card style={{ gap: 6, opacity: r.hidden ? 0.75 : 1 }}>
          <Pressable onPress={() => router.push(r.targetType === 'service' ? `/service/${r.targetId}` : `/property/${r.targetId}`)}>
            <Text style={[styles.meta, { color: C.primary, fontWeight: '700' }]} numberOfLines={1}>
              {targetName(r)}
            </Text>
          </Pressable>
          <View style={styles.rowWrap}>
            <Text style={styles.title}>{r.userName}</Text>
            <Stars value={r.rating} />
            {r.hidden ? <Tag text="Disembunyikan" color={C.danger} /> : null}
          </View>
          <Text style={styles.meta}>{formatDate(r.createdAt)}</Text>
          {r.comment ? <Text style={{ fontSize: 14, color: C.text, lineHeight: 20 }}>{r.comment}</Text> : null}
          <View style={[styles.rowWrap, { marginTop: 4 }]}>
            <SmallBtn
              icon={r.hidden ? 'eye-outline' : 'eye-off-outline'}
              label={r.hidden ? 'Tampilkan' : 'Sembunyikan'}
              color={C.info}
              onPress={() => toggle(r)}
            />
            <SmallBtn icon="trash-outline" label="Hapus" color={C.danger} onPress={() => remove(r)} />
          </View>
        </Card>
      )}
      ListEmptyComponent={loading ? undefined : <Empty icon="star-outline" title="Belum ada ulasan" text="Ulasan dari pengguna akan muncul di sini." />}
    />
  );
}

// ============ PESANAN ============
function BookingsTab() {
  const { items, setItems, loading, reload } = useLoader<admin.AdminBooking>(admin.listAllBookings);
  const [filter, setFilter] = useState<Booking['status'] | 'semua'>('semua');
  const list = filter === 'semua' ? items : items.filter((b) => b.status === filter);

  const change = async (b: admin.AdminBooking, status: Booking['status']) => {
    if (b.status === status) return;
    const prev = b.status;
    setItems((xs) => xs.map((x) => (x.id === b.id ? { ...x, status } : x)));
    try {
      await admin.setBookingStatus(b.id, status);
    } catch (e) {
      setItems((xs) => xs.map((x) => (x.id === b.id ? { ...x, status: prev } : x)));
      Alert.alert('Gagal mengubah status', errText(e));
    }
  };

  return (
    <FlatList
      data={list}
      keyExtractor={(b) => b.id}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={C.primary} />}
      ListHeaderComponent={
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {(['semua', ...BOOKING_STATUS] as const).map((s) => (
            <Chip key={s} label={s === 'semua' ? 'Semua' : s} active={filter === s} onPress={() => setFilter(s)} />
          ))}
        </ScrollView>
      }
      renderItem={({ item: b }) => (
        <Card style={{ gap: 6 }}>
          <Text style={styles.title}>
            {b.serviceName} · {b.packageName}
          </Text>
          <Text style={styles.meta}>
            {b.userName || 'Tanpa nama'}
            {b.userEmail ? ` · ${b.userEmail}` : ''}
          </Text>
          <Text style={styles.meta}>
            {formatDate(b.date)}, {b.time} · {b.price ? rupiah(b.price) : 'Gratis'}
          </Text>
          {b.price && b.paymentStatus ? (
            <Text style={[styles.meta, { color: PAYMENT_LABEL[b.paymentStatus].fg, fontWeight: '700' }]}>
              Pembayaran: {PAYMENT_LABEL[b.paymentStatus].label}
              {b.paymentMethod ? ` (${METHOD_LABEL[b.paymentMethod] ?? b.paymentMethod})` : ''}
            </Text>
          ) : null}
          <Text style={styles.meta} numberOfLines={2}>
            {b.address}
          </Text>
          {b.note ? <Text style={styles.meta}>Catatan: {b.note}</Text> : null}
          <View style={[styles.rowWrap, { marginTop: 4 }]}>
            {BOOKING_STATUS.map((s) => (
              <Chip key={s} label={s} active={b.status === s} onPress={() => change(b, s)} />
            ))}
          </View>
        </Card>
      )}
      ListEmptyComponent={loading ? undefined : <Empty icon="receipt-outline" title="Belum ada pesanan" text="Pesanan jasa dari pengguna akan muncul di sini." />}
    />
  );
}

// ============ PENGGUNA ============
function UsersTab({ myId }: { myId: string }) {
  const { items, setItems, loading, reload } = useLoader<admin.AdminUser>(admin.listUsers);
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const list = term
    ? items.filter((u) => [u.name, u.email, u.phone].some((v) => v.toLowerCase().includes(term)))
    : items;

  const update = async (u: admin.AdminUser, patch: Partial<admin.AdminUser>, fn: () => Promise<void>) => {
    setItems((xs) => xs.map((x) => (x.id === u.id ? { ...x, ...patch } : x)));
    try {
      await fn();
    } catch (e) {
      setItems((xs) => xs.map((x) => (x.id === u.id ? u : x)));
      Alert.alert('Gagal', errText(e));
    }
  };

  return (
    <FlatList
      data={list}
      keyExtractor={(u) => u.id}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={C.primary} />}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={C.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Cari nama, email, atau nomor HP"
            placeholderTextColor="#9AA5A3"
            style={{ flex: 1, fontSize: 14, color: C.text }}
            autoCapitalize="none"
          />
        </View>
      }
      renderItem={({ item: u }) => {
        const me = u.id === myId;
        return (
          <Card style={{ gap: 6 }}>
            <View style={styles.rowWrap}>
              <Text style={[styles.title, { flexShrink: 1 }]}>{u.name || 'Tanpa nama'}</Text>
              {u.role === 'admin' ? <Tag text="Admin" color={C.info} /> : null}
              {u.banned ? <Tag text="Diblokir" color={C.danger} /> : null}
              {me ? <Tag text="Anda" color={C.primary} /> : null}
            </View>
            <Text style={styles.meta}>{u.email || '-'}</Text>
            <Text style={styles.meta}>
              {u.phone || 'Belum isi HP'} · Daftar {formatDate(u.createdAt)}
            </Text>
            {me ? null : (
              <View style={[styles.rowWrap, { marginTop: 4 }]}>
                <SmallBtn
                  icon={u.banned ? 'lock-open-outline' : 'ban-outline'}
                  label={u.banned ? 'Buka blokir' : 'Blokir'}
                  color={C.danger}
                  onPress={() =>
                    Alert.alert(u.banned ? 'Buka blokir pengguna?' : 'Blokir pengguna?', u.banned ? u.name : `${u.name || u.email} tidak bisa memasang iklan atau mengirim chat.`, [
                      { text: 'Batal', style: 'cancel' },
                      { text: 'Ya', style: 'destructive', onPress: () => update(u, { banned: !u.banned }, () => admin.setUserBanned(u.id, !u.banned)) },
                    ])
                  }
                />
                <SmallBtn
                  icon="shield-half-outline"
                  label={u.role === 'admin' ? 'Cabut admin' : 'Jadikan admin'}
                  color={C.info}
                  onPress={() =>
                    Alert.alert(u.role === 'admin' ? 'Cabut akses admin?' : 'Jadikan admin?', u.name || u.email, [
                      { text: 'Batal', style: 'cancel' },
                      {
                        text: 'Ya',
                        onPress: () => {
                          const role = u.role === 'admin' ? 'user' : 'admin';
                          update(u, { role }, () => admin.setUserRole(u.id, role));
                        },
                      },
                    ])
                  }
                />
              </View>
            )}
          </Card>
        );
      }}
      ListEmptyComponent={loading ? undefined : <Empty icon="people-outline" title="Belum ada pengguna" text="Pengguna yang mendaftar akan muncul di sini." />}
    />
  );
}

function SmallBtn({ icon, label, color, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.smallBtn, { borderColor: color, opacity: pressed ? 0.7 : 1 }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.smallBtnText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.tag, { borderColor: color }]}>
      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 12 },
  tab: {
    flex: 1,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabActive: { backgroundColor: C.primary, borderColor: C.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: C.muted },
  thumb: { width: 84, height: 84, borderRadius: R.sm },
  title: { fontSize: 15, fontWeight: '800', color: C.text },
  price: { fontSize: 14, fontWeight: '800', color: C.primary },
  meta: { fontSize: 12.5, color: C.muted },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  verified: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: C.primarySoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  verifiedText: { fontSize: 12, fontWeight: '700', color: C.primary },
  smallBtn: { flexDirection: 'row', gap: 4, alignItems: 'center', borderWidth: 1.2, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: C.glassStrong },
  smallBtnText: { fontSize: 12.5, fontWeight: '700' },
  tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: C.surface, borderRadius: R.lg, padding: 18, gap: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  input: { minHeight: 80, borderRadius: R.sm, backgroundColor: '#fff', padding: 12, fontSize: 14, color: C.text, textAlignVertical: 'top' },
  search: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: C.glassStrong, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
});
