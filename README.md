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

Data masih **data contoh** dan tersimpan di HP (AsyncStorage). Langkah berikutnya: database & login sungguhan (Supabase), unggah foto, peta lokasi.

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
