import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let configured = false;

/** Siapkan tampilan notifikasi (juga saat aplikasi sedang dibuka). */
export function setupNotifications() {
  if (configured || Platform.OS === 'web') return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Umum',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#0E8F7E',
    }).catch(() => {});
  }
}

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Tampilkan notifikasi lokal sekarang. `link` dibuka saat notifikasi diketuk. */
export async function notifyNow(title: string, body: string, link?: string) {
  if (Platform.OS === 'web' || !(await ensurePermission())) return;
  await Notifications.scheduleNotificationAsync({ content: { title, body, data: { link } }, trigger: null });
}

/**
 * Pengingat jadwal jasa: malam sebelumnya pukul 19.00 dan 1 jam sebelum jadwal.
 * `date` = "YYYY-MM-DD", `time` = "HH.MM"
 */
export async function scheduleBookingReminders(serviceName: string, date: string, time: string) {
  if (Platform.OS === 'web' || !(await ensurePermission())) return;
  const [h, m] = time.split(/[.:]/).map(Number);
  const start = new Date(`${date}T00:00:00`);
  start.setHours(h, m || 0, 0, 0);
  const eve = new Date(start);
  eve.setDate(eve.getDate() - 1);
  eve.setHours(19, 0, 0, 0);
  const hourBefore = new Date(start.getTime() - 60 * 60 * 1000);
  const now = Date.now();
  const items: [Date, string][] = [
    [eve, `Besok pukul ${time} petugas ${serviceName} akan datang.`],
    [hourBefore, `1 jam lagi petugas ${serviceName} tiba. Pastikan ada orang di rumah.`],
  ];
  for (const [when, body] of items) {
    if (when.getTime() > now + 60_000) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Pengingat jadwal jasa', body, data: { link: '/pesanan' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      });
    }
  }
}

/** Panggil callback dengan `link` saat pengguna mengetuk notifikasi. */
export function onNotificationTap(cb: (link: string) => void): () => void {
  if (Platform.OS === 'web') return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((res) => {
    const link = res.notification.request.content.data?.link;
    if (typeof link === 'string') cb(link);
  });
  return () => sub.remove();
}
