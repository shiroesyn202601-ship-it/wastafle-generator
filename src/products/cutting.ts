/**
 * Pola potong batang hollow: potongan dikelompokkan per profil lalu disusun ke batang utuh
 * dengan First-Fit Decreasing. Tiap potongan memakan lebar mata potong (kerf).
 */
export interface CutPiece {
  no: number; // nomor bagian (sama dengan nomor di daftar potongan)
  profile: string;
  lengthCm: number;
  qty: number;
  label: string;
}

export interface Bar {
  cuts: { no: number; len: number }[];
  used: number; // cm termasuk kerf
  waste: number; // sisa cm
}

export interface ProfilePlan {
  profile: string;
  bars: Bar[];
  tooLong: { no: number; len: number }[]; // lebih panjang dari batang: perlu disambung
}

export function planCuts(pieces: CutPiece[], stockCm: number, kerfCm: number): ProfilePlan[] {
  const byProfile = new Map<string, { no: number; len: number }[]>();
  pieces.forEach((p) => {
    const arr = byProfile.get(p.profile) || [];
    for (let i = 0; i < p.qty; i++) arr.push({ no: p.no, len: p.lengthCm });
    byProfile.set(p.profile, arr);
  });

  return [...byProfile.entries()].map(([profile, list]) => {
    const tooLong = list.filter((c) => c.len > stockCm);
    const sorted = list.filter((c) => c.len <= stockCm).sort((a, b) => b.len - a.len);
    const bars: Bar[] = [];
    sorted.forEach((c) => {
      const need = c.len + kerfCm;
      // muat bila sisa batang cukup untuk potongan ini (kerf potongan sebelumnya sudah ada di `used`)
      const bar = bars.find((b) => b.used + c.len <= stockCm + 1e-6);
      if (bar) {
        bar.cuts.push(c);
        bar.used = Math.min(stockCm, bar.used + need);
      } else bars.push({ cuts: [c], used: Math.min(stockCm, need), waste: 0 });
    });
    bars.forEach((b) => (b.waste = Math.max(0, Math.round((stockCm - b.used) * 10) / 10)));
    return { profile, bars, tooLong };
  });
}

/** Jumlah batang per profil (potongan terlalu panjang dihitung ceil(panjang / batang)) */
export const barsNeeded = (plan: ProfilePlan, stockCm: number) =>
  plan.bars.length + plan.tooLong.reduce((s, c) => s + Math.ceil(c.len / stockCm), 0);
