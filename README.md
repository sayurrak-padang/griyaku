# Griyaku

Aplikasi pencarian properti (rumah, apartemen, kost, kontrakan, tanah, ruko, gudang) dan pemesanan jasa rumah tangga untuk iPhone dan Android, dibuat dengan Expo (React Native).

## Fitur versi pertama

- **Beranda**: pencarian cepat, jenis properti, pilihan terverifikasi, kost & kontrakan, jasa populer, kota populer.
- **Cari**: Beli / Sewa, filter jenis, kota, rentang harga, jumlah kamar, terverifikasi, full furnished, serta urutan harga/terbaru/luas.
- **Detail properti**: galeri foto, spesifikasi, fasilitas, estimasi cicilan KPR, tombol WhatsApp & telepon, bagikan, favorit.
- **Simulasi KPR**: harga, DP, tenor, bunga, rincian total bunga dan saran penghasilan.
- **Jasa rumah tangga**: 12 layanan (bersih rumah, servis AC, renovasi, dll.), pilih paket, jadwal, alamat, lalu pesan.
- **Pasang iklan**: form iklan jual/sewa yang langsung muncul di pencarian.
- **Akun**: masuk (sementara tanpa OTP), favorit, iklan saya, pesanan jasa.

Tambahan versi 1.1:

- **Foto iklan**: hingga 8 foto dari galeri atau kamera.
- **Peta**: lokasi di halaman detail, mode peta di pencarian, dan tombol "Tandai lokasi saya" saat pasang iklan.
- **Database & login (Supabase)**: iklan, favorit, pesanan jasa, dan foto tersimpan online. Login memakai email + kata sandi.

Tambahan versi 1.2:

- **Chat** antara pencari dan pemilik iklan (realtime), tombol "Chat" di detail properti untuk iklan asli, daftar percakapan, dan pertanyaan cepat.
- **Notifikasi**: kotak notifikasi (pesan baru, pesanan diterima, status pesanan berubah), banner di HP saat ada pesan baru, dan pengingat jadwal jasa (malam sebelumnya & 1 jam sebelum).
- Catatan: notifikasi muncul saat aplikasi terbuka atau berjalan di latar. Push notification saat aplikasi tertutup penuh butuh build EAS (bukan Expo Go).

Tanpa Supabase, aplikasi tetap jalan dalam **mode uji coba**: data contoh, dan semua data hanya tersimpan di HP.

## Menyambungkan Supabase (sekali saja)

1. Buat proyek gratis di https://supabase.com/dashboard (region Singapore).
2. Buka **SQL Editor → New query**, tempel isi `supabase/schema.sql`, lalu **Run**.
3. Buka **Authentication → Sign In / Providers → Email**, matikan **Confirm email**, lalu **Save**. (Tanpa SMTP sendiri, email Supabase sangat dibatasi; dengan opsi ini pendaftaran tidak butuh email.)
4. Jika muncul error `permission denied for table` (kode 42501), jalankan juga `supabase/grants.sql`.
4b. Untuk **chat & notifikasi**: buka lagi **SQL Editor → New query**, tempel isi `supabase/chat.sql`, lalu **Run**.
4c. Untuk **panel admin**: jalankan `supabase/admin.sql` dengan cara yang sama. Lalu daftar/masuk di aplikasi, dan di SQL Editor jalankan
    `update public.profiles set role = 'admin' where id = (select id from auth.users where lower(email) = lower('email-anda@contoh.com'));`
    Tutup lalu buka lagi aplikasi: menu **Akun → Panel admin** muncul.
4d. Untuk **ulasan & rating**: jalankan `supabase/reviews.sql` dengan cara yang sama. Pengguna bisa memberi 1-5 bintang + komentar di detail properti dan jasa (satu ulasan per orang, bisa diubah/dihapus). Pemilik iklan tidak bisa mengulas iklannya sendiri dan mendapat notifikasi saat ada ulasan baru. Admin menyembunyikan/menghapus ulasan di **Panel admin → Ulasan**.
4e. Untuk **pembayaran jasa (Midtrans, mode sandbox)**: lihat bagian *Pembayaran* di bawah.
5. Salin `.env.example` menjadi `.env`, isi `EXPO_PUBLIC_SUPABASE_URL` dan `EXPO_PUBLIC_SUPABASE_ANON_KEY` dari **Project Settings → API**. Kunci *anon* memang aman berada di aplikasi karena data dilindungi aturan RLS di `schema.sql`. Jangan pernah memakai kunci *service_role* di aplikasi.
6. Jalankan ulang `npx expo start`.

Catatan:
- Untuk rilis, sebaiknya pasang SMTP sendiri (mis. Resend) di **Authentication → Emails → SMTP Settings**, lalu aktifkan lagi **Confirm email** dan fitur lupa kata sandi. Fungsi login kode email (OTP) juga sudah ada di `lib/api.ts`.
- Setelah `admin.sql` dijalankan, iklan baru berstatus **Menunggu persetujuan** dan baru tampil setelah admin menyetujuinya di **Panel admin** (pemilik mendapat notifikasi disetujui/ditolak). Iklan lama tetap tayang.
- Panel admin: setujui/tolak iklan (dengan alasan), beri lencana **Terverifikasi**, hapus iklan, ubah status pesanan jasa (pemesan diberi notifikasi), blokir pengguna (tidak bisa memasang iklan & chat), dan jadikan pengguna lain admin.
- Data contoh tetap tampil bersama iklan asli. Matikan dengan `SHOW_SAMPLE_DATA = false` di `context/AppContext.tsx`.
- Peta di Android memakai Google Maps. Di Expo Go langsung jalan; untuk build rilis Play Store perlu Google Maps API key di `app.json` (`android.config.googleMaps.apiKey`).

## Pembayaran (Midtrans)

Pesanan jasa dibayar lewat halaman pembayaran Midtrans (QRIS, GoPay, ShopeePay, transfer VA, dll). Kunci rahasia Midtrans hanya disimpan di Supabase, tidak pernah di aplikasi.

1. Daftar di https://dashboard.midtrans.com (gratis). Pilih lingkungan **Sandbox** (pojok kiri atas).
2. Di Midtrans: **Settings → Access Keys**, salin **Server Key** (diawali `SB-Mid-server-`).
3. Di Supabase: **Edge Functions → Secrets**, tambah `MIDTRANS_SERVER_KEY` = Server Key tadi.
4. Jalankan `supabase/payments.sql` di **SQL Editor** (harga resmi + kolom pembayaran).
5. Di Supabase: **Edge Functions → Deploy a new function → Via Editor**:
   - nama `payment`, tempel isi `supabase/functions/payment/index.ts`, **Deploy**.
   - nama `midtrans-webhook`, tempel isi `supabase/functions/midtrans-webhook/index.ts`, **Deploy**, lalu di **Details/Settings** fungsi ini matikan **Verify JWT** (Enforce JWT verification) dan simpan.
6. Di Midtrans: **Settings → Payment → Notification URL**, isi
   `https://<id-proyek>.supabase.co/functions/v1/midtrans-webhook`, lalu simpan.
7. Uji bayar dengan simulator sandbox: https://simulator.sandbox.midtrans.com (QRIS/VA), tidak ada uang sungguhan.

Untuk live: aktifkan akun Midtrans produksi, ganti `MIDTRANS_SERVER_KEY` dengan Server Key produksi, tambah secret `MIDTRANS_IS_PRODUCTION` = `true`, dan ubah Notification URL di lingkungan Production.
Harga paket ada di tabel `service_prices`; bila mengubah harga di `data/services.ts`, ubah juga di tabel itu.

## Versi web & link untuk dibagikan (EAS Hosting)

Versi web bisa dibuka di iPhone, Android, dan laptop lewat satu link, dan bisa dipasang ke layar utama (PWA).

Pertama kali:
```bash
npm install
npx eas-cli@latest login        # masuk dengan akun Expo
npm run deploy:web              # ekspor web lalu unggah ke EAS Hosting
```
Saat pertama, EAS menanyakan apakah membuat/menautkan proyek (jawab **Y**) dan nama subdomain (mis. `griyaku`). Hasilnya link seperti `https://griyaku.expo.app`.
Untuk memperbarui link setelah ada perubahan: unduh kode terbaru, `npm install`, lalu `npm run deploy:web` lagi.

Yang berbeda di web:
- Notifikasi pop-up dan pengingat jadwal tidak muncul (daftar **Notifikasi** di aplikasi tetap terisi).
- Peta memakai OpenStreetMap tersemat (tanpa penanda per properti di tampilan peta pencarian).
- Pembayaran membuka halaman Midtrans di tab baru; status pesanan berubah otomatis setelah bayar.
- Efek kaca "liquid glass" iOS diganti efek blur biasa.
- Kamera: di HP membuka kamera/galeri bawaan browser; di laptop membuka pemilih file.

## Menjalankan

```bash
npm install
npx expo start
```

Lalu pindai QR code dengan aplikasi **Expo Go** (iPhone: kamera, Android: aplikasi Expo Go).

## Struktur

- `app/` — layar (Expo Router). `app/(tabs)` berisi 5 tab utama.
- `components/` — komponen UI bersama.
- `data/` — data contoh properti dan jasa.
- `context/AppContext.tsx` — state aplikasi (login, favorit, iklan, pesanan).
- `lib/format.ts` — format rupiah, tanggal, dan rumus cicilan KPR.
- `lib/supabase.ts`, `lib/api.ts` — sambungan dan query database.
- `supabase/schema.sql` — tabel, aturan keamanan (RLS), dan bucket foto.
