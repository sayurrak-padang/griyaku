// Ulasan & rating. Mode Supabase memakai tabel public.reviews (supabase/reviews.sql);
// mode uji coba menyimpan ulasan di HP (AsyncStorage).
import AsyncStorage from '@react-native-async-storage/async-storage';

import { need } from '@/lib/api';
import { isOnline } from '@/lib/supabase';

export type TargetType = 'property' | 'service';

export type Review = {
  id: string;
  targetType: TargetType;
  targetId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  hidden: boolean;
  createdAt: string;
};

export type ReviewSummary = { average: number; count: number };

const LOCAL_KEY = 'griyaku-reviews-v1';
const LOCAL_USER = 'lokal';

type Row = {
  id: string;
  target_type: TargetType;
  target_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  hidden: boolean;
  created_at: string;
};

const toReview = (r: Row): Review => ({
  id: r.id,
  targetType: r.target_type,
  targetId: r.target_id,
  userId: r.user_id,
  userName: r.user_name || 'Pengguna',
  rating: r.rating,
  comment: r.comment ?? '',
  hidden: !!r.hidden,
  createdAt: r.created_at,
});

async function readLocal(): Promise<Review[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Review[]) : [];
  } catch {
    return [];
  }
}

async function writeLocal(list: Review[]) {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

export function summarize(list: Review[]): ReviewSummary {
  const shown = list.filter((r) => !r.hidden);
  if (!shown.length) return { average: 0, count: 0 };
  return { average: shown.reduce((s, r) => s + r.rating, 0) / shown.length, count: shown.length };
}

export async function listReviews(targetType: TargetType, targetId: string): Promise<Review[]> {
  if (!isOnline) {
    return (await readLocal()).filter((r) => r.targetType === targetType && r.targetId === targetId);
  }
  const { data, error } = await need()
    .from('reviews')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data as Row[]).map(toReview);
}

/** Simpan ulasan; satu pengguna satu ulasan per properti/jasa (ulasan lama diperbarui). */
export async function saveReview(
  targetType: TargetType,
  targetId: string,
  rating: number,
  comment: string,
  user: { id?: string; name: string },
): Promise<Review> {
  const text = comment.trim();
  if (!isOnline) {
    const list = await readLocal();
    const old = list.find((r) => r.targetType === targetType && r.targetId === targetId && r.userId === LOCAL_USER);
    const review: Review = {
      id: old?.id ?? `lokal-${Date.now()}`,
      targetType,
      targetId,
      userId: LOCAL_USER,
      userName: user.name || 'Anda',
      rating,
      comment: text,
      hidden: false,
      createdAt: new Date().toISOString(),
    };
    await writeLocal([review, ...list.filter((r) => r.id !== review.id)]);
    return review;
  }
  if (!user.id) throw new Error('Silakan masuk dulu.');
  const { data, error } = await need()
    .from('reviews')
    .upsert(
      { target_type: targetType, target_id: targetId, user_id: user.id, rating, comment: text },
      { onConflict: 'target_type,target_id,user_id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return toReview(data as Row);
}

export async function deleteReview(id: string) {
  if (!isOnline) {
    await writeLocal((await readLocal()).filter((r) => r.id !== id));
    return;
  }
  const { error } = await need().from('reviews').delete().eq('id', id);
  if (error) throw error;
}

export function isMine(r: Review, userId?: string) {
  return isOnline ? !!userId && r.userId === userId : r.userId === LOCAL_USER;
}

// ============ ADMIN ============
export async function listAllReviews(): Promise<Review[]> {
  const { data, error } = await need().from('reviews').select('*').order('created_at', { ascending: false }).limit(300);
  if (error) throw error;
  return (data as Row[]).map(toReview);
}

export async function setReviewHidden(id: string, hidden: boolean) {
  const { error } = await need().from('reviews').update({ hidden }).eq('id', id);
  if (error) throw error;
}
