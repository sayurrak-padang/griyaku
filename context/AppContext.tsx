import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { PROPERTIES, Property } from '@/data/properties';
import * as api from '@/lib/api';
import { isOnline, supabase } from '@/lib/supabase';

/**
 * Tampilkan data contoh bersama iklan sungguhan.
 * Ubah ke false setelah iklan asli di database sudah cukup banyak.
 */
export const SHOW_SAMPLE_DATA = true;

export type User = { id?: string; name: string; phone: string; email?: string };

export type Booking = {
  id: string;
  serviceId: string;
  serviceName: string;
  packageName: string;
  price: number;
  date: string; // ISO date
  time: string;
  address: string;
  note?: string;
  status: 'Menunggu konfirmasi' | 'Dijadwalkan' | 'Selesai' | 'Dibatalkan';
  createdAt: string;
};

type NewListing = Omit<Property, 'id' | 'postedAt' | 'mine'>;
type NewBooking = Omit<Booking, 'id' | 'createdAt' | 'status'>;

type LocalState = {
  user: User | null;
  favorites: string[];
  myListings: Property[];
  bookings: Booking[];
};

type Ctx = {
  ready: boolean;
  online: boolean;
  loading: boolean;
  user: User | null;
  favorites: string[];
  myListings: Property[];
  bookings: Booking[];
  allProperties: Property[];
  refresh: () => Promise<void>;
  /** Mode lokal saja (tanpa Supabase) */
  login: (u: User) => void;
  /** Mode Supabase: simpan nama & HP setelah verifikasi email */
  saveProfile: (name: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  addListing: (p: NewListing) => Promise<Property>;
  removeListing: (id: string) => Promise<void>;
  addBooking: (b: NewBooking) => Promise<Booking>;
};

const KEY = 'griyaku:state:v1';
const initial: LocalState = { user: null, favorites: [], myListings: [], bookings: [] };

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [local, setLocal] = useState<LocalState>(initial);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data dari Supabase
  const [authId, setAuthId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | undefined>();
  const [profile, setProfile] = useState<{ name: string; phone: string } | null>(null);
  const [remote, setRemote] = useState<Property[]>([]);
  const [remoteFavs, setRemoteFavs] = useState<string[]>([]);
  const [remoteBookings, setRemoteBookings] = useState<Booking[]>([]);
  const authIdRef = useRef<string | null>(null);

  // ---- muat penyimpanan lokal ----
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setLocal({ ...initial, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(local)).catch(() => {});
  }, [local, ready]);

  // ---- Supabase: sesi login ----
  const refresh = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      setRemote(await api.fetchProperties(authIdRef.current ?? undefined));
    } catch (e) {
      console.warn('Gagal memuat iklan', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserData = useCallback(async (uid: string | null) => {
    if (!supabase) return;
    if (!uid) {
      setProfile(null);
      setRemoteFavs([]);
      setRemoteBookings([]);
      return;
    }
    const [p, f, b] = await Promise.allSettled([api.fetchProfile(uid), api.fetchFavorites(), api.fetchBookings()]);
    setProfile(p.status === 'fulfilled' ? p.value : null);
    if (f.status === 'fulfilled') setRemoteFavs(f.value);
    if (b.status === 'fulfilled') setRemoteBookings(b.value);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      authIdRef.current = uid;
      setAuthId(uid);
      setAuthEmail(data.session?.user.email);
      loadUserData(uid);
      refresh();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user.id ?? null;
      if (uid === authIdRef.current) return;
      authIdRef.current = uid;
      setAuthId(uid);
      setAuthEmail(session?.user.email);
      loadUserData(uid);
      refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [loadUserData, refresh]);

  // ---- aksi ----
  const login = useCallback((user: User) => setLocal((s) => ({ ...s, user })), []);

  const saveProfile = useCallback(async (name: string, phone: string) => {
    const uid = authIdRef.current;
    if (!uid) throw new Error('Belum masuk');
    await api.saveProfile(uid, name, phone);
    setProfile({ name, phone });
  }, []);

  const logout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setLocal((s) => ({ ...s, user: null }));
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      const uid = authIdRef.current;
      if (supabase && uid) {
        const on = !remoteFavs.includes(id);
        setRemoteFavs((f) => (on ? [id, ...f] : f.filter((x) => x !== id)));
        api.setFavorite(uid, id, on).catch(() =>
          setRemoteFavs((f) => (on ? f.filter((x) => x !== id) : [id, ...f]))
        );
        return;
      }
      setLocal((s) => ({
        ...s,
        favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [id, ...s.favorites],
      }));
    },
    [remoteFavs]
  );

  const addListing = useCallback(async (p: NewListing) => {
    const uid = authIdRef.current;
    if (supabase) {
      if (!uid) throw new Error('Silakan masuk terlebih dahulu.');
      const created = await api.createProperty(uid, p);
      setRemote((r) => [created, ...r]);
      return created;
    }
    const listing: Property = { ...p, id: 'm' + Date.now(), postedAt: new Date().toISOString().slice(0, 10), mine: true };
    setLocal((s) => ({ ...s, myListings: [listing, ...s.myListings] }));
    return listing;
  }, []);

  const removeListing = useCallback(async (id: string) => {
    if (supabase) {
      await api.deleteProperty(id);
      setRemote((r) => r.filter((x) => x.id !== id));
      return;
    }
    setLocal((s) => ({ ...s, myListings: s.myListings.filter((l) => l.id !== id) }));
  }, []);

  const addBooking = useCallback(async (b: NewBooking) => {
    const uid = authIdRef.current;
    if (supabase) {
      if (!uid) throw new Error('Silakan masuk terlebih dahulu.');
      const created = await api.createBooking(uid, b);
      setRemoteBookings((x) => [created, ...x]);
      return created;
    }
    const booking: Booking = { ...b, id: 'b' + Date.now(), createdAt: new Date().toISOString(), status: 'Menunggu konfirmasi' };
    setLocal((s) => ({ ...s, bookings: [booking, ...s.bookings] }));
    return booking;
  }, []);

  const value = useMemo<Ctx>(() => {
    const user: User | null = isOnline
      ? authId
        ? { id: authId, email: authEmail, name: profile?.name || authEmail?.split('@')[0] || 'Pengguna', phone: profile?.phone ?? '' }
        : null
      : local.user;
    const favorites = isOnline && authId ? remoteFavs : local.favorites;
    const myListings = isOnline ? remote.filter((p) => p.mine) : local.myListings;
    const bookings = isOnline ? remoteBookings : local.bookings;
    const base = isOnline ? remote : local.myListings;
    return {
      ready,
      online: isOnline,
      loading,
      user,
      favorites,
      myListings,
      bookings,
      allProperties: [...base, ...(SHOW_SAMPLE_DATA ? PROPERTIES : [])],
      refresh,
      login,
      saveProfile,
      logout,
      toggleFavorite,
      isFavorite: (id) => favorites.includes(id),
      addListing,
      removeListing,
      addBooking,
    };
  }, [local, ready, loading, authId, authEmail, profile, remote, remoteFavs, remoteBookings, refresh, login, saveProfile, logout, toggleFavorite, addListing, removeListing, addBooking]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
