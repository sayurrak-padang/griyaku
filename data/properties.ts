export type PropertyType =
  | 'rumah'
  | 'apartemen'
  | 'kost'
  | 'kontrakan'
  | 'tanah'
  | 'ruko'
  | 'gudang';

export type ListingKind = 'jual' | 'sewa';

export type Property = {
  id: string;
  title: string;
  type: PropertyType;
  listing: ListingKind;
  price: number;
  period?: 'bulan' | 'tahun';
  city: string;
  district: string;
  bedrooms?: number;
  bathrooms?: number;
  landArea?: number;
  buildingArea?: number;
  certificate?: string;
  furnished?: 'Tidak' | 'Semi' | 'Penuh';
  verified?: boolean;
  isNew?: boolean;
  kostFor?: 'Putra' | 'Putri' | 'Campur';
  images: string[];
  description: string;
  facilities: string[];
  owner: { name: string; phone: string; role: 'Pemilik' | 'Agen' | 'Developer' };
  postedAt: string; // ISO date
  mine?: boolean;
};

export const PROPERTY_TYPES: { key: PropertyType; label: string; icon: string }[] = [
  { key: 'rumah', label: 'Rumah', icon: 'home' },
  { key: 'apartemen', label: 'Apartemen', icon: 'business' },
  { key: 'kost', label: 'Kost', icon: 'bed' },
  { key: 'kontrakan', label: 'Kontrakan', icon: 'key' },
  { key: 'tanah', label: 'Tanah', icon: 'leaf' },
  { key: 'ruko', label: 'Ruko', icon: 'storefront' },
  { key: 'gudang', label: 'Gudang', icon: 'cube' },
];

export const typeLabel = (t: PropertyType) =>
  PROPERTY_TYPES.find((p) => p.key === t)?.label ?? t;

export const CITIES = [
  'Jakarta Selatan',
  'Jakarta Timur',
  'Tangerang Selatan',
  'Bekasi',
  'Depok',
  'Bogor',
  'Bandung',
  'Yogyakarta',
  'Semarang',
  'Surabaya',
  'Malang',
  'Padang',
  'Medan',
  'Makassar',
];

const U = (id: string) => `https://images.unsplash.com/${id}?w=900&q=70&auto=format&fit=crop`;

const IMG = {
  house1: U('photo-1568605114967-8130f3a36994'),
  house2: U('photo-1570129477492-45c003edd2be'),
  house3: U('photo-1512917774080-9991f1c4c750'),
  house4: U('photo-1600596542815-ffad4c1539a9'),
  house5: U('photo-1600585154340-be6161a56a0c'),
  apt1: U('photo-1502672260266-1c1ef2d93688'),
  apt2: U('photo-1522708323590-d24dbb6b0267'),
  room1: U('photo-1493809842364-78817add7ffb'),
  room2: U('photo-1484154218962-a197022b5858'),
  land1: U('photo-1500382017468-9049fed747ef'),
  kitchen: U('photo-1556911220-bff31c812dba'),
};

const owners = [
  { name: 'Budi Santoso', phone: '6281200000001', role: 'Pemilik' as const },
  { name: 'Rina Marlina', phone: '6281200000002', role: 'Agen' as const },
  { name: 'Griya Asri Developer', phone: '6281200000003', role: 'Developer' as const },
  { name: 'Hendra Wijaya', phone: '6281200000004', role: 'Agen' as const },
  { name: 'Ibu Yuliani', phone: '6281200000005', role: 'Pemilik' as const },
];

const commonHouse = ['Carport', 'Listrik 2200 VA', 'Air PDAM', 'Dekat sekolah', 'Keamanan 24 jam'];

export const PROPERTIES: Property[] = [
  {
    id: 'p1',
    title: 'Rumah Minimalis 2 Lantai Dekat Stasiun',
    type: 'rumah', listing: 'jual', price: 1_350_000_000,
    city: 'Tangerang Selatan', district: 'Serpong',
    bedrooms: 3, bathrooms: 2, landArea: 90, buildingArea: 120,
    certificate: 'SHM', furnished: 'Semi', verified: true,
    images: [IMG.house1, IMG.kitchen, IMG.room2],
    description:
      'Rumah siap huni di cluster yang tenang, 7 menit ke stasiun dan dekat akses tol. Dapur sudah dilengkapi kitchen set, ada taman belakang kecil dan carport untuk 1 mobil.',
    facilities: [...commonHouse, 'Taman belakang'],
    owner: owners[1], postedAt: '2026-11-15',
  },
  {
    id: 'p2',
    title: 'Rumah Baru Cluster Hijau, Cicilan Ringan',
    type: 'rumah', listing: 'jual', price: 785_000_000,
    city: 'Bogor', district: 'Cibinong',
    bedrooms: 2, bathrooms: 1, landArea: 72, buildingArea: 45,
    certificate: 'SHGB', furnished: 'Tidak', verified: true, isNew: true,
    images: [IMG.house2, IMG.house5],
    description:
      'Unit baru dari developer, tersisa 8 unit. Bisa KPR dengan DP mulai 5%. Lingkungan asri dengan jogging track dan masjid di dalam kawasan.',
    facilities: ['One gate system', 'Jogging track', 'Masjid', 'Taman bermain'],
    owner: owners[2], postedAt: '2026-11-17',
  },
  {
    id: 'p3',
    title: 'Rumah Mewah dengan Kolam Renang',
    type: 'rumah', listing: 'jual', price: 6_800_000_000,
    city: 'Jakarta Selatan', district: 'Cilandak',
    bedrooms: 5, bathrooms: 4, landArea: 400, buildingArea: 520,
    certificate: 'SHM', furnished: 'Penuh', verified: true,
    images: [IMG.house4, IMG.room1, IMG.kitchen],
    description:
      'Hunian premium dengan kolam renang pribadi, ruang keluarga luas, dan kamar pembantu. Lokasi strategis dekat sekolah internasional dan pusat perbelanjaan.',
    facilities: ['Kolam renang', 'Garasi 2 mobil', 'Kamar ART', 'Listrik 11000 VA', 'CCTV'],
    owner: owners[3], postedAt: '2026-11-10',
  },
  {
    id: 'p4',
    title: 'Rumah Hook Siap Huni Dekat Kampus',
    type: 'rumah', listing: 'jual', price: 925_000_000,
    city: 'Yogyakarta', district: 'Depok, Sleman',
    bedrooms: 3, bathrooms: 2, landArea: 120, buildingArea: 90,
    certificate: 'SHM', furnished: 'Tidak',
    images: [IMG.house3, IMG.room2],
    description:
      'Posisi hook dengan halaman samping, 10 menit ke kampus. Cocok untuk keluarga atau investasi kost.',
    facilities: commonHouse,
    owner: owners[0], postedAt: '2026-11-08',
  },
  {
    id: 'p5',
    title: 'Rumah Keluarga Lingkungan Tenang',
    type: 'rumah', listing: 'jual', price: 1_150_000_000,
    city: 'Padang', district: 'Kuranji',
    bedrooms: 4, bathrooms: 2, landArea: 160, buildingArea: 130,
    certificate: 'SHM', furnished: 'Semi', verified: true,
    images: [IMG.house5, IMG.kitchen],
    description:
      'Rumah luas di kawasan perumahan yang tenang, dekat pasar dan masjid. Bebas banjir, akses jalan lebar.',
    facilities: [...commonHouse, 'Bebas banjir'],
    owner: owners[4], postedAt: '2026-11-12',
  },
  {
    id: 'p6',
    title: 'Rumah Subsidi Siap Akad',
    type: 'rumah', listing: 'jual', price: 185_000_000,
    city: 'Bekasi', district: 'Cikarang',
    bedrooms: 2, bathrooms: 1, landArea: 60, buildingArea: 30,
    certificate: 'SHGB', furnished: 'Tidak', isNew: true,
    images: [IMG.house2],
    description: 'Rumah subsidi dengan cicilan mulai Rp1 jutaan per bulan. Dekat kawasan industri.',
    facilities: ['Air sumur bor', 'Listrik 1300 VA', 'Dekat kawasan industri'],
    owner: owners[2], postedAt: '2026-11-18',
  },
  {
    id: 'p7',
    title: 'Apartemen 2BR View Kota',
    type: 'apartemen', listing: 'jual', price: 1_050_000_000,
    city: 'Jakarta Timur', district: 'Cawang',
    bedrooms: 2, bathrooms: 1, buildingArea: 48,
    certificate: 'Strata Title', furnished: 'Penuh', verified: true,
    images: [IMG.apt1, IMG.apt2],
    description: 'Unit di lantai tinggi dengan pemandangan kota, terhubung langsung ke halte transportasi umum.',
    facilities: ['Kolam renang', 'Gym', 'Akses kartu', 'Minimarket', 'Parkir basement'],
    owner: owners[1], postedAt: '2026-11-14',
  },
  {
    id: 'p8',
    title: 'Apartemen Studio Dekat Kampus',
    type: 'apartemen', listing: 'sewa', price: 3_200_000, period: 'bulan',
    city: 'Depok', district: 'Margonda',
    bedrooms: 1, bathrooms: 1, buildingArea: 24, furnished: 'Penuh',
    images: [IMG.apt2, IMG.room1],
    description: 'Studio full furnished, tinggal bawa koper. Sudah termasuk IPL, belum termasuk listrik.',
    facilities: ['AC', 'Water heater', 'Kolam renang', 'Wi-Fi', 'Laundry'],
    owner: owners[0], postedAt: '2026-11-16',
  },
  {
    id: 'p9',
    title: 'Kontrakan 2 Kamar Dekat Pasar',
    type: 'kontrakan', listing: 'sewa', price: 18_000_000, period: 'tahun',
    city: 'Bekasi', district: 'Bekasi Timur',
    bedrooms: 2, bathrooms: 1, landArea: 60, buildingArea: 45, furnished: 'Tidak',
    images: [IMG.house3],
    description: 'Kontrakan bersih di gang lebar (mobil masuk). Bayar per tahun, bisa dicicil 2x.',
    facilities: ['Listrik token', 'Air PDAM', 'Gang mobil'],
    owner: owners[4], postedAt: '2026-11-13',
  },
  {
    id: 'p10',
    title: 'Rumah Sewa Furnished Cocok Keluarga',
    type: 'kontrakan', listing: 'sewa', price: 4_500_000, period: 'bulan',
    city: 'Bandung', district: 'Antapani',
    bedrooms: 3, bathrooms: 2, landArea: 110, buildingArea: 100, furnished: 'Penuh', verified: true,
    images: [IMG.house1, IMG.room2],
    description: 'Rumah sewa lengkap dengan perabot, udara sejuk, minimal sewa 6 bulan.',
    facilities: ['Carport', 'Water heater', 'Kulkas', 'Mesin cuci'],
    owner: owners[1], postedAt: '2026-11-11',
  },
  {
    id: 'p11',
    title: 'Kontrakan Petakan Murah',
    type: 'kontrakan', listing: 'sewa', price: 900_000, period: 'bulan',
    city: 'Jakarta Timur', district: 'Duren Sawit',
    bedrooms: 1, bathrooms: 1, buildingArea: 24, furnished: 'Tidak',
    images: [IMG.room2],
    description: 'Kontrakan petakan 1 kamar, cocok untuk pekerja atau pasangan muda.',
    facilities: ['Listrik token', 'Air jetpump'],
    owner: owners[0], postedAt: '2026-11-09',
  },
  {
    id: 'p12',
    title: 'Kost Putri Eksklusif AC + Kamar Mandi Dalam',
    type: 'kost', listing: 'sewa', price: 1_850_000, period: 'bulan',
    city: 'Yogyakarta', district: 'Caturtunggal', kostFor: 'Putri',
    bedrooms: 1, bathrooms: 1, buildingArea: 12, furnished: 'Penuh', verified: true,
    images: [IMG.room1, IMG.room2],
    description: 'Kost putri dekat kampus, kamar bersih dengan AC dan kamar mandi dalam. Ada ibu kost tinggal di lokasi.',
    facilities: ['AC', 'K. mandi dalam', 'Wi-Fi', 'Dapur bersama', 'Parkir motor', 'CCTV'],
    owner: owners[4], postedAt: '2026-11-17',
  },
  {
    id: 'p13',
    title: 'Kost Putra Murah Dekat Kawasan Kantor',
    type: 'kost', listing: 'sewa', price: 950_000, period: 'bulan',
    city: 'Jakarta Selatan', district: 'Tebet', kostFor: 'Putra',
    bedrooms: 1, bathrooms: 1, buildingArea: 9, furnished: 'Semi',
    images: [IMG.room2],
    description: 'Kamar kipas angin, kamar mandi luar. 5 menit jalan kaki ke stasiun.',
    facilities: ['Wi-Fi', 'Kasur', 'Lemari', 'Parkir motor'],
    owner: owners[0], postedAt: '2026-11-15',
  },
  {
    id: 'p14',
    title: 'Kost Campur Modern (Coliving)',
    type: 'kost', listing: 'sewa', price: 2_400_000, period: 'bulan',
    city: 'Surabaya', district: 'Gubeng', kostFor: 'Campur',
    bedrooms: 1, bathrooms: 1, buildingArea: 14, furnished: 'Penuh', verified: true,
    images: [IMG.apt1, IMG.room1],
    description: 'Coliving dengan ruang kerja bersama, dibersihkan 2x seminggu, termasuk listrik.',
    facilities: ['AC', 'Termasuk listrik', 'Coworking', 'Laundry', 'Wi-Fi'],
    owner: owners[1], postedAt: '2026-11-18',
  },
  {
    id: 'p15',
    title: 'Kost Putri Dekat Kampus',
    type: 'kost', listing: 'sewa', price: 1_100_000, period: 'bulan',
    city: 'Padang', district: 'Limau Manis', kostFor: 'Putri',
    bedrooms: 1, bathrooms: 1, buildingArea: 10, furnished: 'Semi',
    images: [IMG.room2, IMG.room1],
    description: 'Kost putri 3 menit ke kampus, lingkungan aman dan nyaman.',
    facilities: ['Wi-Fi', 'K. mandi dalam', 'Dapur bersama'],
    owner: owners[4], postedAt: '2026-11-14',
  },
  {
    id: 'p16',
    title: 'Tanah Kavling Siap Bangun',
    type: 'tanah', listing: 'jual', price: 450_000_000,
    city: 'Malang', district: 'Batu', landArea: 200, certificate: 'SHM', verified: true,
    images: [IMG.land1],
    description: 'Tanah kavling di kawasan wisata, udara sejuk, cocok untuk villa atau rumah tinggal.',
    facilities: ['Akses jalan 6 m', 'Listrik tersedia', 'Pemandangan gunung'],
    owner: owners[3], postedAt: '2026-11-12',
  },
  {
    id: 'p17',
    title: 'Tanah Pinggir Jalan Raya',
    type: 'tanah', listing: 'jual', price: 2_400_000_000,
    city: 'Medan', district: 'Medan Johor', landArea: 800, certificate: 'SHM',
    images: [IMG.land1],
    description: 'Tanah komersial di pinggir jalan raya, cocok untuk gudang, ruko, atau SPBU.',
    facilities: ['Pinggir jalan raya', 'Lebar muka 20 m'],
    owner: owners[0], postedAt: '2026-11-06',
  },
  {
    id: 'p18',
    title: 'Tanah Murah Dekat Bandara',
    type: 'tanah', listing: 'jual', price: 275_000_000,
    city: 'Padang', district: 'Ketaping', landArea: 300, certificate: 'SHM',
    images: [IMG.land1],
    description: 'Tanah datar siap bangun, 10 menit ke bandara.',
    facilities: ['Akses mobil', 'Bebas banjir'],
    owner: owners[4], postedAt: '2026-11-04',
  },
  {
    id: 'p19',
    title: 'Ruko 3 Lantai Kawasan Ramai',
    type: 'ruko', listing: 'jual', price: 3_200_000_000,
    city: 'Semarang', district: 'Tembalang',
    bathrooms: 3, landArea: 75, buildingArea: 210, certificate: 'SHGB', verified: true,
    images: [IMG.house5],
    description: 'Ruko di jalan utama dekat kampus, lalu lintas ramai, cocok untuk kafe atau kantor.',
    facilities: ['Parkir luas', 'Listrik 5500 VA', 'Rolling door'],
    owner: owners[3], postedAt: '2026-11-10',
  },
  {
    id: 'p20',
    title: 'Ruko Disewakan Cocok Usaha Kuliner',
    type: 'ruko', listing: 'sewa', price: 85_000_000, period: 'tahun',
    city: 'Makassar', district: 'Panakkukang',
    bathrooms: 2, landArea: 70, buildingArea: 140,
    images: [IMG.house3],
    description: 'Ruko 2 lantai di area kuliner, minimal sewa 2 tahun.',
    facilities: ['Parkir', 'Listrik 3500 VA'],
    owner: owners[1], postedAt: '2026-11-13',
  },
  {
    id: 'p21',
    title: 'Gudang Akses Kontainer Dekat Tol',
    type: 'gudang', listing: 'sewa', price: 240_000_000, period: 'tahun',
    city: 'Bekasi', district: 'Cikarang Barat',
    landArea: 1500, buildingArea: 1000, verified: true,
    images: [IMG.land1],
    description: 'Gudang dengan akses kontainer 40 ft, 5 menit ke gerbang tol.',
    facilities: ['Akses kontainer', 'Loading dock', 'Kantor', 'Listrik 33000 VA'],
    owner: owners[3], postedAt: '2026-11-07',
  },
  {
    id: 'p22',
    title: 'Apartemen 3BR Keluarga',
    type: 'apartemen', listing: 'sewa', price: 12_500_000, period: 'bulan',
    city: 'Jakarta Selatan', district: 'Kuningan',
    bedrooms: 3, bathrooms: 2, buildingArea: 110, furnished: 'Penuh',
    images: [IMG.apt1, IMG.kitchen],
    description: 'Unit keluarga dengan fasilitas lengkap di kawasan perkantoran.',
    facilities: ['Kolam renang', 'Gym', 'Taman bermain', 'Keamanan 24 jam'],
    owner: owners[1], postedAt: '2026-11-16',
  },
];
