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
import { RAK_TV } from './rakTv';
import { RAK_PARTISI } from './rakPartisi';
import { GANTUNGAN_BERDIRI } from './gantunganBerdiri';
import { RAK_GONDOLA } from './rakGondola';
import { GEROBAK_LAPAK } from './gerobakLapak';
import { RAK_SEPEDA } from './rakSepeda';
import { JEMURAN } from './jemuran';
import { RAK_KAMAR_MANDI } from './rakKamarMandi';
import { RAK_DAPUR } from './rakDapur';
import { ALAT_GYM } from './alatGym';
import { KANDANG } from './kandang';
import { ALAT_BERMAIN } from './alatBermain';
import { DUDUKAN_TOREN } from './dudukanToren';
import { KURSI_TUNGGU } from './kursiTunggu';
import { PODIUM } from './podium';
import { STAND_MOTOR } from './standMotor';
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
  'rak-tv': RAK_TV,
  'rak-partisi': RAK_PARTISI,
  'gantungan-berdiri': GANTUNGAN_BERDIRI,
  'rak-gondola': RAK_GONDOLA,
  'gerobak-lapak': GEROBAK_LAPAK,
  'rak-sepeda': RAK_SEPEDA,
  'jemuran': JEMURAN,
  'rak-kamar-mandi': RAK_KAMAR_MANDI,
  'rak-dapur': RAK_DAPUR,
  'alat-gym': ALAT_GYM,
  kandang: KANDANG,
  'alat-bermain': ALAT_BERMAIN,
  'dudukan-toren': DUDUKAN_TOREN,
  'kursi-tunggu': KURSI_TUNGGU,
  podium: PODIUM,
  'stand-motor': STAND_MOTOR,
};
export const PRODUCT_LIST: ProductDef[] = [MEJA, KURSI, RAK, RAK_TANAMAN, TROLI, MEJA_PIKNIK, MEJA_DINDING, MEJA_BAR, BOOTH, RAK_DINDING, PAPAN_MENU, PEMBATAS, RAK_BAJU, DIPAN, RAK_TV, RAK_PARTISI, GANTUNGAN_BERDIRI, RAK_GONDOLA, GEROBAK_LAPAK, RAK_SEPEDA, JEMURAN, RAK_KAMAR_MANDI, RAK_DAPUR, ALAT_GYM, KANDANG, ALAT_BERMAIN, DUDUKAN_TOREN, KURSI_TUNGGU, PODIUM, STAND_MOTOR];

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
      { product: 'troli', group: 'gerobak-saji', title: 'Gerobak saji roda sepeda', subtitle: 'bar cart · kopi keliling · kabinet / laci' },
    ],
  },
  {
    title: 'Meja & kursi',
    items: [
      { product: 'meja', title: 'Meja', subtitle: 'makan · kerja · kopi · bar' },
      { product: 'meja', group: 'makan', title: 'Meja makan', subtitle: '2 – 8 orang' },
      { product: 'meja', group: 'kerja', title: 'Meja kerja / belajar', subtitle: 'rak atas · kaki Z · trapesium' },
      { product: 'meja', group: 'akuarium', title: 'Meja akuarium', subtitle: 'rangka kotak · bersilang' },
      { product: 'meja', group: 'kopi', title: 'Meja kopi, samping & konsol', subtitle: 'kaki X · hairpin · rangka C · melayang' },
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
  {
    title: 'Ruang tamu & sekat',
    items: [
      { product: 'rak-tv', title: 'Rak TV / bufet', subtitle: 'kubus · menara · bingkai · standing' },
      { product: 'rak-tv', preset: 'standing', title: 'Standing TV beroda', subtitle: 'ruang rapat · kelas · lobi' },
      { product: 'rak-partisi', title: 'Rak partisi / sekat ruangan', subtitle: 'dua muka · bilah · sampai plafon' },
      { product: 'rak-partisi', group: 'partisi-plafon', title: 'Partisi sampai plafon', subtitle: 'tiang jepit lantai–plafon' },
      { product: 'gantungan-berdiri', title: 'Gantungan mantel berdiri', subtitle: 'tiang · tripod · pohon · hall tree' },
      { product: 'gantungan-berdiri', preset: 'tiang-helm', title: 'Rak helm berdiri', subtitle: 'kos · kantor · parkiran' },
    ],
  },
  {
    title: 'Dapur, kamar mandi & cuci',
    items: [
      { product: 'rak-dapur', title: 'Rak dapur', subtitle: 'piring · microwave · bumbu · galon' },
      { product: 'rak-dapur', group: 'rak-galon', title: 'Rak galon & dispenser', subtitle: 'galon tidur · kaki X' },
      { product: 'rak-kamar-mandi', title: 'Rak kamar mandi & laundry', subtitle: 'atas kloset · mesin cuci · sudut' },
      { product: 'rak-kamar-mandi', preset: 'bingkai-samping', title: 'Rak atas mesin cuci', subtitle: 'kolong lega · rak deterjen' },
      { product: 'jemuran', title: 'Jemuran', subtitle: 'berdiri · lipat · dinding · plafon' },
      { product: 'jemuran', group: 'rak-handuk', title: 'Rak handuk berdiri', subtitle: 'kamar mandi · kamar' },
    ],
  },
  {
    title: 'Toko, lapak & garasi',
    items: [
      { product: 'rak-gondola', title: 'Rak gondola / display toko', subtitle: 'minimarket · warung · apotek' },
      { product: 'rak-gondola', group: 'rak-kasir', title: 'Rak kasir', subtitle: 'rak rokok · rak putar permen' },
      { product: 'gerobak-lapak', title: 'Gerobak & lapak', subtitle: 'angkringan · bazar · pasar · tenda' },
      { product: 'gerobak-lapak', preset: 'angkringan', title: 'Gerobak angkringan', subtitle: '2 roda besar · atap · rak bawah' },
      { product: 'gerobak-lapak', group: 'warung-tenda', title: 'Tenda / kanopi warung', subtitle: 'pelana · miring · kantilever' },
      { product: 'rak-sepeda', title: 'Rak sepeda & parkir', subtitle: 'lantai · dinding · plafon garasi' },
      { product: 'stand-motor', title: 'Paddock & stand motor', subtitle: 'paddock · lift servis · ramp cuci' },
    ],
  },
  {
    title: 'Olahraga & bermain',
    items: [
      { product: 'alat-gym', title: 'Alat & rak gym', subtitle: 'half rack · pull-up · bench · dip' },
      { product: 'alat-gym', group: 'bangku-latihan', title: 'Bench latihan', subtitle: 'datar · incline · sit-up · press' },
      { product: 'alat-bermain', title: 'Alat bermain anak', subtitle: 'panjat · perosotan · jungkat-jungkit' },
      { product: 'alat-bermain', preset: 'perosotan', title: 'Perosotan anak', subtitle: 'rumah · PAUD · taman' },
    ],
  },
  {
    title: 'Kantor, sekolah & ibadah',
    items: [
      { product: 'kursi-tunggu', title: 'Kursi tunggu deret', subtitle: 'klinik · bank · sekolah · bengkel' },
      { product: 'kursi-tunggu', group: 'deret-tembok', title: 'Kursi tunggu menempel tembok', subtitle: 'kantilever · lipat' },
      { product: 'podium', title: 'Podium pidato', subtitle: 'panel kotak · tiang miring · beroda' },
      { product: 'podium', group: 'mimbar', title: 'Mimbar masjid', subtitle: 'bertangga · beratap · kotak' },
    ],
  },
  {
    title: 'Hewan, kebun & utilitas',
    items: [
      { product: 'kandang', title: 'Kandang hewan', subtitle: 'kelinci · ayam · burung · kambing · anjing' },
      { product: 'kandang', group: 'unggas', title: 'Kandang ayam & burung', subtitle: 'baterai · ark · sangkar gantung' },
      { product: 'dudukan-toren', title: 'Dudukan toren', subtitle: 'tower 3 kaki · atap miring · tiang tunggal' },
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
