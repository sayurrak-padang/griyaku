import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { PROPERTIES, Property } from '@/data/properties';

export type User = { name: string; phone: string };

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
  status: 'Menunggu konfirmasi' | 'Dijadwalkan' | 'Selesai';
  createdAt: string;
};

type State = {
  user: User | null;
  favorites: string[];
  myListings: Property[];
  bookings: Booking[];
};

type Ctx = State & {
  ready: boolean;
  allProperties: Property[];
  login: (u: User) => void;
  logout: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  addListing: (p: Omit<Property, 'id' | 'postedAt' | 'mine'>) => Property;
  removeListing: (id: string) => void;
  addBooking: (b: Omit<Booking, 'id' | 'createdAt' | 'status'>) => Booking;
};

const KEY = 'griyaku:state:v1';
const initial: State = { user: null, favorites: [], myListings: [], bookings: [] };

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...initial, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const login = useCallback((user: User) => setState((s) => ({ ...s, user })), []);
  const logout = useCallback(() => setState((s) => ({ ...s, user: null })), []);

  const toggleFavorite = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [id, ...s.favorites],
      })),
    []
  );

  const addListing: Ctx['addListing'] = useCallback((p) => {
    const listing: Property = {
      ...p,
      id: 'm' + Date.now(),
      postedAt: new Date().toISOString().slice(0, 10),
      mine: true,
    };
    setState((s) => ({ ...s, myListings: [listing, ...s.myListings] }));
    return listing;
  }, []);

  const removeListing = useCallback(
    (id: string) => setState((s) => ({ ...s, myListings: s.myListings.filter((l) => l.id !== id) })),
    []
  );

  const addBooking: Ctx['addBooking'] = useCallback((b) => {
    const booking: Booking = {
      ...b,
      id: 'b' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'Menunggu konfirmasi',
    };
    setState((s) => ({ ...s, bookings: [booking, ...s.bookings] }));
    return booking;
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      ready,
      allProperties: [...state.myListings, ...PROPERTIES],
      login,
      logout,
      toggleFavorite,
      isFavorite: (id) => state.favorites.includes(id),
      addListing,
      removeListing,
      addBooking,
    }),
    [state, ready, login, logout, toggleFavorite, addListing, removeListing, addBooking]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
