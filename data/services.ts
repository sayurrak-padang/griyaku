export type ServiceCategory = 'Kebersihan' | 'AC & Elektronik' | 'Perbaikan' | 'Renovasi' | 'Lainnya';

export type ServicePackage = { name: string; price: number; detail: string };

export type Service = {
  id: string;
  name: string;
  category: ServiceCategory;
  icon: string;
  color: string;
  tagline: string;
  description: string;
  duration: string;
  rating: number;
  orders: number;
  packages: ServicePackage[];
  includes: string[];
};

export const SERVICE_CATEGORIES: ('Semua' | ServiceCategory)[] = [
  'Semua',
  'Kebersihan',
  'AC & Elektronik',
  'Perbaikan',
  'Renovasi',
  'Lainnya',
];

export const SERVICES: Service[] = [
  {
    id: 's1', name: 'Bersih Rumah Harian', category: 'Kebersihan', icon: 'sparkles', color: '#0E8F7E',
    tagline: 'Rumah kinclong, Anda tinggal santai',
    description: 'Petugas terlatih membersihkan lantai, kamar mandi, dapur, dan merapikan ruangan. Alat dan cairan pembersih dibawa sendiri.',
    duration: '2 - 4 jam', rating: 4.8, orders: 12840,
    packages: [
      { name: '2 jam (1 petugas)', price: 120_000, detail: 'Cocok untuk apartemen/kost' },
      { name: '3 jam (1 petugas)', price: 165_000, detail: 'Rumah 1 lantai' },
      { name: '4 jam (2 petugas)', price: 310_000, detail: 'Rumah 2 lantai' },
    ],
    includes: ['Sapu & pel lantai', 'Bersihkan kamar mandi', 'Lap debu perabot', 'Cuci piring'],
  },
  {
    id: 's2', name: 'Deep Cleaning', category: 'Kebersihan', icon: 'water', color: '#3B6FD9',
    tagline: 'Pembersihan menyeluruh sampai ke sudut',
    description: 'Pembersihan mendalam termasuk kerak kamar mandi, noda dapur, kaca, dan area yang jarang dijangkau.',
    duration: '4 - 6 jam', rating: 4.9, orders: 4210,
    packages: [
      { name: 'Kamar mandi', price: 180_000, detail: 'Per kamar mandi' },
      { name: 'Dapur', price: 250_000, detail: 'Termasuk degreasing' },
      { name: 'Satu rumah (≤ 70 m²)', price: 650_000, detail: 'Tim 2 orang' },
    ],
    includes: ['Hapus kerak', 'Degreasing dapur', 'Bersihkan kaca', 'Alat profesional'],
  },
  {
    id: 's3', name: 'Cuci Kasur & Sofa', category: 'Kebersihan', icon: 'bed', color: '#7C5CD6',
    tagline: 'Bebas debu, tungau, dan noda',
    description: 'Pencucian dengan mesin ekstraksi dan vakum tungau. Kering dalam 4 - 6 jam.',
    duration: '1 - 3 jam', rating: 4.8, orders: 3390,
    packages: [
      { name: 'Kasur single', price: 150_000, detail: '90 - 120 cm' },
      { name: 'Kasur queen/king', price: 220_000, detail: '160 - 200 cm' },
      { name: 'Sofa per dudukan', price: 70_000, detail: 'Kain/fabric' },
    ],
    includes: ['Vakum tungau', 'Shampoo ekstraksi', 'Penghilang noda'],
  },
  {
    id: 's4', name: 'Cuci & Servis AC', category: 'AC & Elektronik', icon: 'snow', color: '#1E9BD7',
    tagline: 'AC dingin lagi, tagihan listrik lebih hemat',
    description: 'Teknisi bersertifikat mencuci unit indoor dan outdoor, mengecek tekanan freon, dan memberi garansi 30 hari.',
    duration: '1 - 2 jam', rating: 4.9, orders: 18500,
    packages: [
      { name: 'Cuci AC 0,5 - 1 PK', price: 85_000, detail: 'Per unit' },
      { name: 'Cuci AC 1,5 - 2 PK', price: 110_000, detail: 'Per unit' },
      { name: 'Tambah freon', price: 175_000, detail: 'R32 / R410' },
      { name: 'Bongkar pasang AC', price: 350_000, detail: 'Termasuk pipa 3 m' },
    ],
    includes: ['Cuci indoor & outdoor', 'Cek freon', 'Garansi 30 hari'],
  },
  {
    id: 's5', name: 'Servis Elektronik', category: 'AC & Elektronik', icon: 'tv', color: '#E07B2A',
    tagline: 'Kulkas, mesin cuci, TV, pemanas air',
    description: 'Diagnosa dan perbaikan peralatan rumah tangga di lokasi Anda. Biaya suku cadang dikonfirmasi sebelum dikerjakan.',
    duration: '1 - 3 jam', rating: 4.7, orders: 5120,
    packages: [
      { name: 'Cek & diagnosa', price: 75_000, detail: 'Dipotong jika lanjut perbaikan' },
      { name: 'Servis mesin cuci', price: 180_000, detail: 'Belum termasuk part' },
      { name: 'Servis kulkas', price: 200_000, detail: 'Belum termasuk part' },
    ],
    includes: ['Teknisi datang ke rumah', 'Estimasi transparan', 'Garansi servis 14 hari'],
  },
  {
    id: 's6', name: 'Tukang Ledeng', category: 'Perbaikan', icon: 'construct', color: '#2F8F4E',
    tagline: 'Pipa bocor, keran, pompa air, saluran mampet',
    description: 'Perbaikan instalasi air bersih dan saluran pembuangan oleh tukang berpengalaman.',
    duration: '1 - 3 jam', rating: 4.7, orders: 2870,
    packages: [
      { name: 'Perbaikan ringan', price: 125_000, detail: 'Keran, shower, flush' },
      { name: 'Saluran mampet', price: 200_000, detail: 'Wastafel, floor drain' },
      { name: 'Servis pompa air', price: 225_000, detail: 'Belum termasuk part' },
    ],
    includes: ['Pengecekan sumber masalah', 'Alat lengkap', 'Garansi 7 hari'],
  },
  {
    id: 's7', name: 'Tukang Listrik', category: 'Perbaikan', icon: 'flash', color: '#D9A21B',
    tagline: 'Korsleting, stop kontak, lampu, MCB',
    description: 'Instalasi dan perbaikan listrik rumah dengan standar keamanan.',
    duration: '1 - 2 jam', rating: 4.8, orders: 3040,
    packages: [
      { name: 'Pasang lampu/stop kontak', price: 90_000, detail: 'Per titik' },
      { name: 'Cek korsleting', price: 175_000, detail: 'Satu rumah' },
    ],
    includes: ['Alat ukur', 'Standar keamanan', 'Garansi 7 hari'],
  },
  {
    id: 's8', name: 'Renovasi & Interior', category: 'Renovasi', icon: 'color-palette', color: '#C2477A',
    tagline: 'Dari konsultasi desain sampai pemasangan',
    description: 'Konsultasi gratis dengan desainer, survei lokasi, lalu penawaran harga sebelum pekerjaan dimulai. Cocok untuk dapur, kamar, atau renovasi rumah.',
    duration: 'Sesuai proyek', rating: 4.8, orders: 960,
    packages: [
      { name: 'Survei & konsultasi', price: 0, detail: 'Gratis' },
      { name: 'Kitchen set (per meter)', price: 2_750_000, detail: 'HPL, plywood' },
      { name: 'Pengecatan (per m²)', price: 35_000, detail: 'Termasuk cat standar' },
    ],
    includes: ['Desain 3D', 'Survei lokasi', 'Garansi pekerjaan'],
  },
  {
    id: 's9', name: 'Jasa Pindahan', category: 'Lainnya', icon: 'car', color: '#5A6B7A',
    tagline: 'Angkut barang aman dalam kota',
    description: 'Truk dan tim angkut untuk pindahan rumah, kost, atau kantor. Termasuk bungkus barang pecah belah.',
    duration: 'Setengah hari', rating: 4.6, orders: 1430,
    packages: [
      { name: 'Pick-up + 2 kru', price: 450_000, detail: 'Pindahan kost' },
      { name: 'Engkel box + 3 kru', price: 1_100_000, detail: 'Rumah kecil' },
    ],
    includes: ['Bungkus bubble wrap', 'Bongkar pasang lemari'],
  },
  {
    id: 's10', name: 'Basmi Hama', category: 'Lainnya', icon: 'bug', color: '#8B5E3C',
    tagline: 'Rayap, kecoak, tikus, nyamuk',
    description: 'Pengendalian hama dengan bahan aman untuk keluarga dan hewan peliharaan.',
    duration: '1 - 3 jam', rating: 4.7, orders: 820,
    packages: [
      { name: 'Semprot kecoak & semut', price: 300_000, detail: 'Rumah ≤ 100 m²' },
      { name: 'Anti rayap', price: 1_500_000, detail: 'Injeksi + garansi 1 tahun' },
    ],
    includes: ['Bahan aman', 'Survei gratis'],
  },
  {
    id: 's11', name: 'Perawatan Taman', category: 'Lainnya', icon: 'flower', color: '#3E9B3A',
    tagline: 'Pangkas rumput, tanaman, dan taman baru',
    description: 'Perawatan rutin atau pembuatan taman indoor maupun outdoor.',
    duration: '2 - 4 jam', rating: 4.7, orders: 640,
    packages: [
      { name: 'Pangkas rumput (≤ 50 m²)', price: 150_000, detail: 'Termasuk buang sampah' },
      { name: 'Perawatan bulanan', price: 500_000, detail: '4 kunjungan' },
    ],
    includes: ['Alat potong', 'Pupuk dasar'],
  },
  {
    id: 's12', name: 'Sedot WC', category: 'Lainnya', icon: 'water-outline', color: '#4A7C8C',
    tagline: 'Cepat, bersih, tidak bau',
    description: 'Penyedotan septic tank dengan armada truk tangki.',
    duration: '1 - 2 jam', rating: 4.6, orders: 1180,
    packages: [{ name: 'Sedot septic tank', price: 450_000, detail: 'Per 2 m³' }],
    includes: ['Truk tangki', 'Garansi lancar 1 bulan'],
  },
];
