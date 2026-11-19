import { Property } from '@/data/properties';
import { supabase } from '@/lib/supabase';

import type { Booking } from '@/context/AppContext';

const BUCKET = 'property-photos';

type PropertyRow = {
  id: string;
  owner_id: string | null;
  title: string;
  type: Property['type'];
  listing: Property['listing'];
  price: number;
  period: Property['period'] | null;
  city: string;
  district: string;
  bedrooms: number | null;
  bathrooms: number | null;
  land_area: number | null;
  building_area: number | null;
  certificate: string | null;
  furnished: Property['furnished'] | null;
  kost_for: Property['kostFor'] | null;
  images: string[];
  description: string;
  facilities: string[];
  contact_name: string;
  contact_phone: string;
  contact_role: Property['owner']['role'];
  lat: number | null;
  lng: number | null;
  verified: boolean;
  is_new: boolean;
  created_at: string;
};

const u = <T,>(v: T | null): T | undefined => (v === null ? undefined : v);

export function rowToProperty(r: PropertyRow, myId?: string): Property {
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    listing: r.listing,
    price: Number(r.price),
    period: u(r.period),
    city: r.city,
    district: r.district,
    bedrooms: u(r.bedrooms),
    bathrooms: u(r.bathrooms),
    landArea: u(r.land_area),
    buildingArea: u(r.building_area),
    certificate: u(r.certificate),
    furnished: u(r.furnished),
    kostFor: u(r.kost_for),
    images: r.images ?? [],
    description: r.description,
    facilities: r.facilities ?? [],
    owner: { name: r.contact_name, phone: r.contact_phone, role: r.contact_role },
    lat: u(r.lat),
    lng: u(r.lng),
    verified: r.verified,
    isNew: r.is_new,
    postedAt: r.created_at.slice(0, 10),
    mine: !!myId && r.owner_id === myId,
  };
}

function need() {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi');
  return supabase;
}

export async function fetchProperties(myId?: string): Promise<Property[]> {
  const { data, error } = await need()
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as PropertyRow[]).map((r) => rowToProperty(r, myId));
}

/** Unggah foto lokal (file://) ke Storage, kembalikan URL publik. */
async function uploadPhoto(userId: string, uri: string, index: number): Promise<string> {
  if (/^https?:\/\//.test(uri)) return uri;
  const sb = need();
  const res = await fetch(uri);
  const body = await res.arrayBuffer();
  const ext = (uri.split('?')[0].split('.').pop() || 'jpg').toLowerCase().replace('jpeg', 'jpg');
  const path = `${userId}/${Date.now()}-${index}.${ext}`;
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, body, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg', upsert: false });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function createProperty(
  userId: string,
  p: Omit<Property, 'id' | 'postedAt' | 'mine'>
): Promise<Property> {
  const images = await Promise.all(p.images.map((uri, i) => uploadPhoto(userId, uri, i)));
  const { data, error } = await need()
    .from('properties')
    .insert({
      owner_id: userId,
      title: p.title,
      type: p.type,
      listing: p.listing,
      price: p.price,
      period: p.period ?? null,
      city: p.city,
      district: p.district,
      bedrooms: p.bedrooms ?? null,
      bathrooms: p.bathrooms ?? null,
      land_area: p.landArea ?? null,
      building_area: p.buildingArea ?? null,
      certificate: p.certificate ?? null,
      furnished: p.furnished ?? null,
      kost_for: p.kostFor ?? null,
      images,
      description: p.description,
      facilities: p.facilities,
      contact_name: p.owner.name,
      contact_phone: p.owner.phone,
      contact_role: p.owner.role,
      lat: p.lat ?? null,
      lng: p.lng ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToProperty(data as PropertyRow, userId);
}

export async function deleteProperty(id: string) {
  const { error } = await need().from('properties').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchFavorites(): Promise<string[]> {
  const { data, error } = await need().from('favorites').select('property_id').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((d) => d.property_id as string);
}

export async function setFavorite(userId: string, propertyId: string, on: boolean) {
  const sb = need();
  const { error } = on
    ? await sb.from('favorites').upsert({ user_id: userId, property_id: propertyId })
    : await sb.from('favorites').delete().eq('user_id', userId).eq('property_id', propertyId);
  if (error) throw error;
}

export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await need().from('bookings').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map((b) => ({
    id: b.id,
    serviceId: b.service_id,
    serviceName: b.service_name,
    packageName: b.package_name,
    price: Number(b.price),
    date: b.date,
    time: b.time,
    address: b.address,
    note: b.note ?? undefined,
    status: b.status,
    createdAt: b.created_at,
  }));
}

export async function createBooking(userId: string, b: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> {
  const { data, error } = await need()
    .from('bookings')
    .insert({
      user_id: userId,
      service_id: b.serviceId,
      service_name: b.serviceName,
      package_name: b.packageName,
      price: b.price,
      date: b.date,
      time: b.time,
      address: b.address,
      note: b.note ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return {
    ...b,
    id: data.id,
    createdAt: data.created_at,
    status: data.status,
  };
}

export async function fetchProfile(userId: string) {
  const { data } = await need().from('profiles').select('name, phone').eq('id', userId).maybeSingle();
  return data as { name: string; phone: string } | null;
}

export async function saveProfile(userId: string, name: string, phone: string) {
  const { error } = await need().from('profiles').upsert({ id: userId, name, phone });
  if (error) throw error;
}

// ===== Login dengan kode OTP lewat email =====
export async function sendEmailCode(email: string) {
  const { error } = await need().auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
}

export async function verifyEmailCode(email: string, token: string) {
  const { data, error } = await need().auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  return data.user;
}
