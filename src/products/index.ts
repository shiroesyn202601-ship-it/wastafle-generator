import { MEJA } from './meja';
import { RAK } from './rak';
import { TROLI } from './troli';
import { FurnitureDesign, Params, ProductDef, ProductId } from './types';
import { DEFAULT_KITCHEN_CONFIG } from '../types/kitchen';

export const PRODUCTS: Record<ProductId, ProductDef> = { meja: MEJA, rak: RAK, troli: TROLI };
export const PRODUCT_LIST: ProductDef[] = [MEJA, RAK, TROLI];

/** Desain baru dari sebuah produk + (opsional) contoh jadi */
export function newDesign(id: ProductId, presetId?: string): FurnitureDesign {
  const def = PRODUCTS[id];
  const preset = def.presets.find((p) => p.id === presetId);
  return {
    product: id,
    presetId: preset?.id,
    params: { ...def.defaults, ...(preset?.params || {}) },
    frame: { ...DEFAULT_KITCHEN_CONFIG.frame, customLayout: false, members: undefined, hinges: [], supports: [] },
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
    frame: { ...DEFAULT_KITCHEN_CONFIG.frame, hinges: [], supports: [], ...(raw.frame || {}) },
  };
}

export * from './types';
