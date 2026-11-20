import { FrameConfig, FrameMember } from '../types/kitchen';
import { Box3 } from '../utils/frameLayout';

export type ProductId = 'meja' | 'rak' | 'troli';
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

export interface Preset {
  id: string;
  name: string;
  desc: string;
  params: Params;
}

/** Papan / daun meja / alas rak (kotak dalam cm, koordinat sama dengan rangka) */
export interface Board {
  id: string;
  label: string;
  box: Box3;
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
  frame: FrameConfig; // members/hinges/customLayout dari Mode Ahli
}
