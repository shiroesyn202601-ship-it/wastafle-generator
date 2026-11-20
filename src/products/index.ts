import { MEJA } from './meja';
import { RAK } from './rak';
import { TROLI } from './troli';
import { KURSI } from './kursi';
import { RAK_TANAMAN } from './rakTanaman';
import { MEJA_PIKNIK } from './mejaPiknik';
import { MEJA_DINDING } from './mejaDinding';
import { MEJA_BAR } from './mejaBar';
import { BOOTH } from './booth';
import { RAK_DINDING } from './rakDinding';
import { PAPAN_MENU } from './papanMenu';
import { PEMBATAS } from './pembatas';
import { RAK_BAJU } from './rakBaju';
import { DIPAN } from './dipan';
import { FurnitureDesign, Params, ProductDef, ProductId } from './types';
import { DEFAULT_KITCHEN_CONFIG } from '../types/kitchen';

export const PRODUCTS: Record<ProductId, ProductDef> = {
  meja: MEJA,
  kursi: KURSI,
  rak: RAK,
  'rak-tanaman': RAK_TANAMAN,
  troli: TROLI,
  'meja-piknik': MEJA_PIKNIK,
  'meja-dinding': MEJA_DINDING,
  'meja-bar': MEJA_BAR,
  booth: BOOTH,
  'rak-dinding': RAK_DINDING,
  'papan-menu': PAPAN_MENU,
  pembatas: PEMBATAS,
  'rak-baju': RAK_BAJU,
  dipan: DIPAN,
};
export const PRODUCT_LIST: ProductDef[] = [MEJA, KURSI, RAK, RAK_TANAMAN, TROLI, MEJA_PIKNIK, MEJA_DINDING, MEJA_BAR, BOOTH, RAK_DINDING, PAPAN_MENU, PEMBATAS, RAK_BAJU, DIPAN];

/** Kategori di Beranda: produk atau jalan pintas ke contoh jadi tertentu */
export interface CategoryItem {
  product: ProductId;
  preset?: string;
  group?: string; // buka langsung sub-kategori ini (mis. 'akuarium')
  title: string;
  subtitle: string;
  icon?: string; // path SVG 60×40; kosong = ikon produk
}
export const CATEGORIES: { title: string; items: CategoryItem[] }[] = [
  {
    title: 'Cafe & usaha',
    items: [
      { product: 'meja', preset: 'pedestal-silang', title: 'Meja cafe kaki tunggal', subtitle: 'alas silang · bintang · plat', icon: 'M8 10h44M30 10v24M14 36h32' },
      { product: 'kursi', preset: 'bar-sandar', title: 'Stool bar', subtitle: 'tinggi 65 / 75 · bersandaran' },
      { product: 'meja-bar', title: 'Meja bar / kasir', subtitle: 'counter barista dua tingkat' },
      { product: 'booth', title: 'Booth / sofa cafe', subtitle: 'tunggal · ganda · sudut L' },
      { product: 'rak-dinding', title: 'Rak dinding / backbar', subtitle: 'botol · cangkir · gantung plafon' },
      { product: 'papan-menu', title: 'Papan menu berdiri', subtitle: 'A-frame · easel · tiang · poster' },
      { product: 'pembatas', title: 'Pembatas tanaman', subtitle: 'kotak pot · partisi · pagar' },
      { product: 'meja', preset: 'sled', title: 'Meja komunal kaki U', subtitle: 'panjang 240 · bar tinggi' },
      { product: 'booth', group: 'meja', title: 'Booth + meja menyatu', subtitle: 'meja lengan L · tiang · berhadapan' },
      { product: 'kursi', preset: 'bangku-meja', title: 'Bangku cafe + meja kecil', subtitle: 'depan toko · trotoar' },
      { product: 'meja-piknik', preset: 'trapesium', title: 'Meja taman rangka miring', subtitle: 'rooftop · teras · satu sisi' },
      { product: 'meja-bar', group: 'meja-kasir', title: 'Meja kasir', subtitle: 'toko · warung · minimarket' },
    ],
  },
  {
    title: 'Meja & kursi',
    items: [
      { product: 'meja', title: 'Meja', subtitle: 'makan · kerja · kopi · bar' },
      { product: 'meja', group: 'makan', title: 'Meja makan', subtitle: '2 – 8 orang' },
      { product: 'meja', group: 'kerja', title: 'Meja kerja / belajar', subtitle: 'rak atas · kaki Z · trapesium' },
      { product: 'meja', group: 'akuarium', title: 'Meja akuarium', subtitle: 'rangka kotak · bersilang' },
      { product: 'meja', group: 'kopi', title: 'Meja kopi, samping & konsol', subtitle: 'kaki X · hairpin · rangka C' },
      { product: 'meja', preset: 'bundar', title: 'Meja bundar', subtitle: 'makan · cafe', icon: 'M10 12a20 5 0 1 0 40 0a20 5 0 1 0 -40 0M30 17v17M20 36h20' },
      { product: 'kursi', title: 'Kursi & stool', subtitle: 'sled · silang X · kantilever' },
      { product: 'kursi', preset: 'bangku', title: 'Bangku', subtitle: 'panjang · taman · bilah', icon: 'M4 18h52M8 18v18M52 18v18M8 30h44' },
    ],
  },
  {
    title: 'Lipat, dinding & multifungsi',
    items: [
      { product: 'meja', preset: 'lipat', title: 'Meja lipat', subtitle: 'kaki dilipat ke bawah daun', icon: 'M6 10h48M12 10v26M48 10l-16 8' },
      { product: 'meja-dinding', title: 'Meja dinding', subtitle: 'dilipat menempel tembok' },
      { product: 'meja-piknik', title: 'Meja + bangku menyatu', subtitle: 'piknik · taman · cafe' },
      { product: 'meja-piknik', preset: 'satu-sisi', title: 'Meja sekolah', subtitle: 'meja + bangku bersandaran' },
      { product: 'kursi', preset: 'bangku-bilah', title: 'Bangku + meja samping', subtitle: 'tempat duduk & taruh minum', icon: 'M4 24h32M8 24v12M32 24v12M40 12a9 3 0 1 0 18 0a9 3 0 1 0 -18 0M49 15v21' },
    ],
  },
  {
    title: 'Kamar & rumah',
    items: [
      { product: 'dipan', title: 'Dipan / ranjang', subtitle: 'kanopi · susun · daybed' },
      { product: 'rak-baju', title: 'Rak gantungan baju', subtitle: 'gawang · rangka A · tiang T' },
      { product: 'kursi', preset: 'bangku-rak', title: 'Bangku sepatu', subtitle: 'bangku + rak bawah' },
      { product: 'rak', preset: 'tangga', title: 'Rak tangga', subtitle: 'bersandar tembok' },
      { product: 'meja', preset: 'rak-atas', title: 'Meja belajar + rak', subtitle: 'rak di atas meja' },
      { product: 'kursi', preset: 'kursi-tangan', title: 'Kursi bersandaran tangan', subtitle: 'kerja · santai' },
    ],
  },
  {
    title: 'Rak & penyimpanan',
    items: [
      { product: 'rak', title: 'Rak', subtitle: 'buku · gudang · sepatu' },
      { product: 'rak', group: 'rak-gudang', title: 'Rak gudang', subtitle: 'zig-zag · kantilever · siku L' },
      { product: 'rak', group: 'rak-sepatu', title: 'Rak sepatu', subtitle: 'miring · bangku + gantungan' },
      { product: 'rak-tanaman', title: 'Rak tanaman', subtitle: 'tangga · piramida · menara' },
      { product: 'troli', title: 'Troli', subtitle: 'saji · pegboard · angkong' },
    ],
  },
];

/** Desain baru dari sebuah produk + (opsional) contoh jadi */
export function newDesign(id: ProductId, presetId?: string): FurnitureDesign {
  const def = PRODUCTS[id];
  const preset = def.presets.find((p) => p.id === presetId);
  return {
    product: id,
    presetId: preset?.id,
    params: { ...def.defaults, ...(preset?.params || {}), ...(preset?.sizes?.[0]?.params || {}) },
    frame: { ...DEFAULT_KITCHEN_CONFIG.frame, customLayout: false, members: undefined, hinges: undefined, supports: [] },
  };
}

/** Lengkapi desain hasil simpan/impor */
export function normalizeDesign(raw: any): FurnitureDesign | null {
  if (!raw || typeof raw !== 'object' || !(raw.product in PRODUCTS)) return null;
  const def = PRODUCTS[raw.product as ProductId];
  return {
    product: raw.product,
    presetId: raw.presetId,
    params: { ...def.defaults, ...((raw.params as Params) || {}) },
    frame: { ...DEFAULT_KITCHEN_CONFIG.frame, hinges: undefined, supports: [], ...(raw.frame || {}) },
  };
}

export * from './types';
