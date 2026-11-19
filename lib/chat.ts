import type { RealtimeChannel } from '@supabase/supabase-js';

import { Property } from '@/data/properties';
import { supabase } from '@/lib/supabase';

export type Conversation = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage?: string;
  seekerId: string;
  seekerName: string;
  ownerId: string;
  ownerName: string;
  lastMessage?: string;
  lastAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt?: string;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  kind: 'chat' | 'pesanan' | 'iklan' | 'info';
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const toConv = (r: any): Conversation => ({
  id: r.id,
  propertyId: r.property_id,
  propertyTitle: r.property_title,
  propertyImage: r.property_image ?? undefined,
  seekerId: r.seeker_id,
  seekerName: r.seeker_name,
  ownerId: r.owner_id,
  ownerName: r.owner_name,
  lastMessage: r.last_message ?? undefined,
  lastAt: r.last_at,
});
const toMsg = (r: any): Message => ({
  id: r.id,
  conversationId: r.conversation_id,
  senderId: r.sender_id,
  body: r.body,
  readAt: r.read_at ?? undefined,
  createdAt: r.created_at,
});
export const toNotif = (r: any): AppNotification => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  body: r.body,
  link: r.link ?? undefined,
  read: r.read,
  createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

function need() {
  if (!supabase) throw new Error('Fitur ini butuh database (Supabase) yang tersambung.');
  return supabase;
}

/** Iklan bisa di-chat jika berasal dari database (bukan data contoh). */
export const isChatable = (p: Property) => /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(p.id) && !p.mine;

export async function listConversations(): Promise<Conversation[]> {
  const { data, error } = await need().from('conversations').select('*').order('last_at', { ascending: false });
  if (error) throw error;
  return data.map(toConv);
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await need().from('conversations').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toConv(data) : null;
}

/** Buka percakapan untuk iklan ini (buat baru jika belum ada). */
export async function openConversation(p: Property, me: { id: string; name: string }): Promise<Conversation> {
  const sb = need();
  const existing = await sb.from('conversations').select('*').eq('property_id', p.id).eq('seeker_id', me.id).maybeSingle();
  if (existing.data) return toConv(existing.data);
  const { data: prop, error: pe } = await sb.from('properties').select('owner_id').eq('id', p.id).single();
  if (pe) throw pe;
  const { data, error } = await sb
    .from('conversations')
    .insert({
      property_id: p.id,
      property_title: p.title,
      property_image: p.images[0] ?? null,
      seeker_id: me.id,
      seeker_name: me.name,
      owner_id: prop.owner_id,
      owner_name: p.owner.name,
    })
    .select('*')
    .single();
  if (error) throw error;
  return toConv(data);
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await need()
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) throw error;
  return data.map(toMsg);
}

export async function sendMessage(conversationId: string, body: string): Promise<Message> {
  const { data, error } = await need()
    .from('messages')
    .insert({ conversation_id: conversationId, body: body.trim() })
    .select('*')
    .single();
  if (error) throw error;
  return toMsg(data);
}

export async function markConversationRead(conversationId: string, myId: string) {
  await need()
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', myId)
    .is('read_at', null);
  await need()
    .from('notifications')
    .update({ read: true })
    .eq('user_id', myId)
    .eq('link', `/chat/${conversationId}`)
    .eq('read', false);
}

export function subscribeMessages(conversationId: string, onInsert: (m: Message) => void): () => void {
  const sb = need();
  const ch: RealtimeChannel = sb
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => onInsert(toMsg(payload.new))
    )
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

// ===== Notifikasi =====
export async function listNotifications(): Promise<AppNotification[]> {
  const { data, error } = await need().from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return data.map(toNotif);
}

export async function markNotificationsRead(ids: string[]) {
  if (!ids.length) return;
  await need().from('notifications').update({ read: true }).in('id', ids);
}

export function subscribeNotifications(userId: string, onInsert: (n: AppNotification) => void): () => void {
  const sb = need();
  const ch = sb
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(toNotif(payload.new))
    )
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}
