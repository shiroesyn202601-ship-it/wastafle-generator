import { FrameConfig, FrameHinge, FrameMember } from '../types/kitchen';
import { Box3 } from '../utils/frameLayout';

export type ProductId =
  | 'meja'
  | 'kursi'
  | 'rak'
  | 'rak-tanaman'
  | 'troli'
  | 'meja-piknik'
  | 'meja-dinding'
  | 'meja-bar'
  | 'booth'
  | 'rak-dinding'
  | 'papan-menu'
  | 'pembatas'
  | 'rak-baju'
  | 'dipan';
export type ParamValue = number | boolean | string;
export type Params = Record<string, ParamValue>;

/** Satu pilihan yang bisa diatur pengguna awam */
export interface ParamDef {
  key: string;
  label: string;
  help?: string; // satu kalimat penjelasan, bahasa sehari-hari
  type: 'number' | 'toggle' | 'choice';
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  marks?: { value: number; label: string }[]; // ukuran standar yang ditandai di slider
  options?: { value: string; label: string; desc?: string }[];
  showIf?: (p: Params) => boolean;
}

export type StepId = 'ukuran' | 'bentuk' | 'bahan' | 'tambahan';

export interface StepDef {
  id: StepId;
  title: string;
  keys: string[];
}

/**
 * Contoh jadi = satu STRUKTUR rangka. Variasi yang hanya beda ukuran / warna / bahan tidak dibuat template
 * baru, tetapi menjadi pilihan `sizes` di dalam template yang sama.
 */
export interface Preset {
  id: string;
  name: string;
  desc: string; // ciri struktur, mis. "kaki tegak, palang H"
  params: Params; // struktur + ukuran bawaan
  sizes?: { label: string; desc: string; params: Params }[]; // ukuran / pemakaian umum dengan rangka yang sama
}

/** Papan / daun meja / alas rak (kotak dalam cm, koordinat sama dengan rangka) */
export interface Board {
  id: string;
  label: string;
  box: Box3; // kotak papan sebelum diputar
  shape?: 'round'; // bundar: diameter = sisi terpendek kotak (dilihat dari atas)
  rotX?: number; // derajat, putar di sekitar sumbu kiri–kanan lewat titik tengah kotak (sandaran miring)
  attachTo?: string; // id batang: papan ikut bergerak bila batang itu terlipat engsel (mis. daun meja dinding)
  steelMm?: number; // plat besi (mis. alas meja pedestal 8 mm): warna cat rangka, dihitung per kg
  color?: string; // warna khusus (mis. busa jok booth); tidak dihitung sebagai papan kayu
}

/** Roda di bawah tiang: (x, z) titik tengah, topY = tinggi pelat roda dari lantai */
export interface Caster {
  id: string;
  x: number;
  z: number;
  topY: number;
  sizeInch: number;
  brake: boolean;
}

export interface ProductBuild {
  members: FrameMember[];
  boards: Board[];
  casters: Caster[];
  W: number;
  D: number;
  H: number; // tinggi keseluruhan termasuk papan/pegangan
  boardThick: number; // cm, 0 bila tanpa daun meja
  hinges?: FrameHinge[]; // engsel bawaan produk (meja lipat, meja dinding); dipakai bila pengguna belum mengubahnya
  wall?: boolean; // produk menempel tembok: tampilkan tembok di belakang (z = 0) pada 3D
}

/** Peringatan dalam bahasa awam, dengan perbaikan satu ketuk */
export interface ProductCheck {
  level: 'warn' | 'info';
  message: string;
  fix?: { label: string; params: Params };
}

export interface ProductDef {
  id: ProductId;
  name: string;
  tagline: string; // satu baris pemakaian, mis. "makan · kerja · kopi"
  icon: string; // path SVG 60×40 (stroke)
  steps: StepDef[];
  params: ParamDef[];
  defaults: Params;
  presets: Preset[];
  build: (p: Params) => ProductBuild;
  checks: (p: Params, b: ProductBuild) => ProductCheck[];
  summary: (p: Params) => string; // mis. "120 × 75 × 75 cm · 4 tingkat"
}

/** Desain produk yang disimpan (selain meja dapur) */
export interface FurnitureDesign {
  product: ProductId;
  presetId?: string;
  params: Params;
  frame: FrameConfig; // members/hinges/customLayout dari tampilan 2D
}
