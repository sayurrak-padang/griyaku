/** 1250000 -> "1.250.000" (tanpa bergantung locale perangkat) */
export function groupThousands(n: number): string {
  return String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function rupiah(n: number): string {
  return 'Rp ' + groupThousands(n);
}

/** Harga ringkas: Rp 1,25 M / Rp 850 Jt / Rp 1,5 Jt */
export function rupiahShort(n: number): string {
  const fmt = (v: number) => (Math.round(v * 100) / 100).toString().replace('.', ',');
  if (n >= 1_000_000_000) return `Rp ${fmt(n / 1_000_000_000)} M`;
  if (n >= 1_000_000) return `Rp ${fmt(n / 1_000_000)} Jt`;
  if (n >= 1_000) return `Rp ${fmt(n / 1_000)} rb`;
  return rupiah(n);
}

/** Cicilan bulanan metode anuitas */
export function monthlyInstallment(loan: number, annualRatePct: number, years: number): number {
  const n = years * 12;
  const r = annualRatePct / 100 / 12;
  if (n <= 0) return 0;
  if (r === 0) return loan / n;
  return (loan * r) / (1 - Math.pow(1 + r, -n));
}

export function parseNumber(s: string): number {
  const v = Number(s.replace(/[^0-9]/g, ''));
  return Number.isFinite(v) ? v : 0;
}

export function formatThousands(s: string): string {
  const n = parseNumber(s);
  return n ? groupThousands(n) : '';
}

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** "Kamis, 20 Nov 2026" dari "2026-11-20" (tanpa bergantung locale perangkat) */
export function formatDate(iso: string): string {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00');
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export { DAYS, MONTHS };
