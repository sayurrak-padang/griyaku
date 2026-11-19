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
- **Database & login (Supabase)**: iklan, favorit, pesanan jasa, dan foto tersimpan online. Login memakai kode 6 digit lewat email.

Tanpa Supabase, aplikasi tetap jalan dalam **mode uji coba**: data contoh, dan semua data hanya tersimpan di HP.

## Menyambungkan Supabase (sekali saja)

1. Buat proyek gratis di https://supabase.com/dashboard (region Singapore).
2. Buka **SQL Editor → New query**, tempel isi `supabase/schema.sql`, lalu **Run**.
3. Buka **Authentication → Emails → Templates → Magic Link**, ganti isinya agar memuat kode, misalnya:
   `<h2>Kode masuk Griyaku</h2><p>Kode Anda: <b>{{ .Token }}</b></p><p>Berlaku 1 jam.</p>`
   (Lakukan juga untuk template **Confirm signup**.)
4. Salin `.env.example` menjadi `.env`, isi `EXPO_PUBLIC_SUPABASE_URL` dan `EXPO_PUBLIC_SUPABASE_ANON_KEY` dari **Project Settings → API**. Kunci *anon* memang aman berada di aplikasi karena data dilindungi aturan RLS di `schema.sql`. Jangan pernah memakai kunci *service_role* di aplikasi.
5. Jalankan ulang `npx expo start`.

Catatan:
- Email bawaan Supabase dibatasi beberapa email per jam. Untuk rilis, sambungkan SMTP sendiri di **Authentication → Emails → SMTP Settings**.
- Lencana **Terverifikasi** hanya bisa diubah admin lewat **Table Editor → properties → verified**.
- Data contoh tetap tampil bersama iklan asli. Matikan dengan `SHOW_SAMPLE_DATA = false` di `context/AppContext.tsx`.
- Peta di Android memakai Google Maps. Di Expo Go langsung jalan; untuk build rilis Play Store perlu Google Maps API key di `app.json` (`android.config.googleMaps.apiKey`).

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
