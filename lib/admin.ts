// Panel admin: semua aksi di sini dibatasi oleh RLS (supabase/admin.sql) — hanya akun ber-role admin yang berhasil.
import type { Booking } from '@/context/AppContext';
import type { Property } from '@/data/properties';
import { need, PropertyRow, rowToProperty } from '@/lib/api';

export type PropertyStatus = NonNullable<Property['status']>;

export type AdminUser = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'user' | 'admin';
  banned: boolean;
  createdAt: string;
};

export type AdminBooking = Booking & { userId: string; userName?: string; userEmail?: string };

export async function listPropertiesByStatus(status: PropertyStatus | 'semua'): Promise<Property[]> {
  let q = need().from('properties').select('*').order('created_at', { ascending: false }).limit(300);
  if (status !== 'semua') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data as PropertyRow[]).map((r) => rowToProperty(r));
}

export async function setPropertyStatus(id: string, status: PropertyStatus, reason?: string) {
  const { error } = await need()
    .from('properties')
    .update({ status, reject_reason: status === 'ditolak' ? reason?.trim() || null : null })
    .eq('id', id);
  if (error) throw error;
}

export async function setPropertyVerified(id: string, verified: boolean) {
  const { error } = await need().from('properties').update({ verified }).eq('id', id);
  if (error) throw error;
}

export async function deleteProperty(id: string) {
  const { error } = await need().from('properties').delete().eq('id', id);
  if (error) throw error;
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await need()
    .from('profiles')
    .select('id, name, phone, email, role, banned, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data.map((u) => ({
    id: u.id,
    name: u.name ?? '',
    phone: u.phone ?? '',
    email: u.email ?? '',
    role: u.role === 'admin' ? 'admin' : 'user',
    banned: !!u.banned,
    createdAt: u.created_at,
  }));
}

export async function setUserBanned(id: string, banned: boolean) {
  const { error } = await need().from('profiles').update({ banned }).eq('id', id);
  if (error) throw error;
}

export async function setUserRole(id: string, role: 'user' | 'admin') {
  const { error } = await need().from('profiles').update({ role }).eq('id', id);
  if (error) throw error;
}

export async function listAllBookings(): Promise<AdminBooking[]> {
  const sb = need();
  const { data, error } = await sb.from('bookings').select('*').order('created_at', { ascending: false }).limit(300);
  if (error) throw error;
  const ids = [...new Set(data.map((b) => b.user_id as string))];
  const people = new Map<string, { name: string; email: string }>();
  if (ids.length) {
    const { data: ps } = await sb.from('profiles').select('id, name, email').in('id', ids);
    ps?.forEach((p) => people.set(p.id, { name: p.name ?? '', email: p.email ?? '' }));
  }
  return data.map((b) => ({
    id: b.id,
    userId: b.user_id,
    userName: people.get(b.user_id)?.name || undefined,
    userEmail: people.get(b.user_id)?.email || undefined,
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

export async function setBookingStatus(id: string, status: Booking['status']) {
  const { error } = await need().from('bookings').update({ status }).eq('id', id);
  if (error) throw error;
}
