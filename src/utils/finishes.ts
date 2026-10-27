import {
  KitchenConfig,
  HplSwatch,
  HplSelection,
  HplSurface,
  HplGroup,
  FjlSpecies,
  FjlSelection,
  MATERIAL_LABELS,
  CABINET_FINISH_LABELS,
  FRAME_MATERIAL_LABELS,
} from '../types/kitchen';

export const HPL_GROUPS: HplGroup[] = ['Polos', 'Motif Kayu', 'Batu & Marmer', 'Beton & Tekstur'];

export const HPL_CATALOG: HplSwatch[] = [
  // Polos (solid colors)
  { id: 'solid-snow', name: 'Putih Salju', group: 'Polos', pattern: 'solid', base: '#f4f4f1', accent: '#e6e6e2' },
  { id: 'solid-ivory', name: 'Putih Gading', group: 'Polos', pattern: 'solid', base: '#ece4d4', accent: '#ddd3c0' },
  { id: 'solid-cream', name: 'Krem Susu', group: 'Polos', pattern: 'solid', base: '#e3d6bf', accent: '#d2c3a9' },
  { id: 'solid-taupe', name: 'Taupe Hangat', group: 'Polos', pattern: 'solid', base: '#8c7f73', accent: '#7a6e63' },
  { id: 'solid-lightgrey', name: 'Abu Muda', group: 'Polos', pattern: 'solid', base: '#c9cbcc', accent: '#b8babb' },
  { id: 'solid-charcoal', name: 'Abu Arang', group: 'Polos', pattern: 'solid', base: '#3a3d42', accent: '#2f3236' },
  { id: 'solid-black', name: 'Hitam Pekat', group: 'Polos', pattern: 'solid', base: '#17181a', accent: '#101112' },
  { id: 'solid-navy', name: 'Navy Tua', group: 'Polos', pattern: 'solid', base: '#1f2b40', accent: '#182234' },
  { id: 'solid-petrol', name: 'Biru Petrol', group: 'Polos', pattern: 'solid', base: '#24485a', accent: '#1c3a49' },
  { id: 'solid-sage', name: 'Hijau Sage', group: 'Polos', pattern: 'solid', base: '#8a9a86', accent: '#7a8a76' },
  { id: 'solid-olive', name: 'Hijau Zaitun', group: 'Polos', pattern: 'solid', base: '#5d6b48', accent: '#4f5c3c' },
  { id: 'solid-bottle', name: 'Hijau Botol', group: 'Polos', pattern: 'solid', base: '#23453a', accent: '#1b382f' },
  { id: 'solid-terracotta', name: 'Terracotta', group: 'Polos', pattern: 'solid', base: '#b4603f', accent: '#9e5236' },
  { id: 'solid-mustard', name: 'Kuning Mustard', group: 'Polos', pattern: 'solid', base: '#c99a2e', accent: '#b38726' },
  { id: 'solid-brick', name: 'Merah Bata', group: 'Polos', pattern: 'solid', base: '#8e3b2f', accent: '#7a3127' },
  { id: 'solid-dustypink', name: 'Pink Dusty', group: 'Polos', pattern: 'solid', base: '#c9a3a0', accent: '#b8918e' },

  // Motif kayu
  { id: 'wood-oak', name: 'Oak Natural', group: 'Motif Kayu', pattern: 'wood', base: '#c9a072', accent: '#8a6238' },
  { id: 'wood-whiteoak', name: 'Oak Putih', group: 'Motif Kayu', pattern: 'wood', base: '#ddc9ad', accent: '#a88d6c' },
  { id: 'wood-walnut', name: 'Walnut Amerika', group: 'Motif Kayu', pattern: 'wood', base: '#5b3f2c', accent: '#2f2016' },
  { id: 'wood-teak', name: 'Jati Emas', group: 'Motif Kayu', pattern: 'wood', base: '#9a6b3c', accent: '#5e3d1f' },
  { id: 'wood-mahogany', name: 'Mahoni Merah', group: 'Motif Kayu', pattern: 'wood', base: '#7a3f2a', accent: '#4a2015' },
  { id: 'wood-rosewood', name: 'Sonokeling Gelap', group: 'Motif Kayu', pattern: 'wood', base: '#4a2e22', accent: '#1d120c' },
  { id: 'wood-ash', name: 'Ash Abu-Abu', group: 'Motif Kayu', pattern: 'wood', base: '#a39b90', accent: '#6d655b' },
  { id: 'wood-pine', name: 'Pinus Cerah', group: 'Motif Kayu', pattern: 'wood', base: '#e0c08f', accent: '#b08850' },
  { id: 'wood-ebony', name: 'Eboni Hitam', group: 'Motif Kayu', pattern: 'wood', base: '#2a2420', accent: '#0e0b09' },
  { id: 'wood-elm', name: 'Elm Rustic', group: 'Motif Kayu', pattern: 'wood', base: '#8b6b4f', accent: '#4f3a2a' },

  // Batu & marmer
  { id: 'stone-carrara', name: 'Marmer Carrara', group: 'Batu & Marmer', pattern: 'marble', base: '#eeeff1', accent: '#9ea4ab' },
  { id: 'stone-calacatta', name: 'Calacatta Gold', group: 'Batu & Marmer', pattern: 'marble', base: '#f3eee4', accent: '#b8975a' },
  { id: 'stone-nero', name: 'Nero Hitam', group: 'Batu & Marmer', pattern: 'marble', base: '#1d1e21', accent: '#d8dbe0' },
  { id: 'stone-greymarble', name: 'Marmer Abu', group: 'Batu & Marmer', pattern: 'marble', base: '#8d9095', accent: '#e6e7ea' },
  { id: 'stone-travertine', name: 'Travertine Krem', group: 'Batu & Marmer', pattern: 'marble', base: '#d9c9ae', accent: '#b39a77' },

  // Beton & tekstur
  { id: 'tex-concrete', name: 'Beton Ekspos', group: 'Beton & Tekstur', pattern: 'concrete', base: '#8f9296', accent: '#5f6266' },
  { id: 'tex-darkcement', name: 'Semen Gelap', group: 'Beton & Tekstur', pattern: 'concrete', base: '#4e5156', accent: '#33363a' },
  { id: 'tex-terrazzo', name: 'Terrazzo Putih', group: 'Beton & Tekstur', pattern: 'terrazzo', base: '#e7e5e0', accent: '#8a8f96' },
  { id: 'tex-terrazzo-pink', name: 'Terrazzo Salem', group: 'Beton & Tekstur', pattern: 'terrazzo', base: '#e8d3c8', accent: '#b0705a' },
  { id: 'tex-linen-cream', name: 'Linen Krem', group: 'Beton & Tekstur', pattern: 'linen', base: '#d8cfc0', accent: '#b9ae9c' },
  { id: 'tex-linen-grey', name: 'Linen Abu', group: 'Beton & Tekstur', pattern: 'linen', base: '#9fa2a4', accent: '#7d8083' },
];

export const HPL_SURFACE_LABELS: Record<HplSurface, { name: string; roughness: number }> = {
  doff: { name: 'Doff (Matte)', roughness: 0.55 },
  glossy: { name: 'Glossy (Mengkilap)', roughness: 0.12 },
  texture: { name: 'Tekstur (Emboss)', roughness: 0.75 },
};

export function getHplSwatch(sel?: HplSelection | null): HplSwatch {
  return HPL_CATALOG.find((s) => s.id === sel?.swatchId) || HPL_CATALOG[0];
}

export const FJL_SPECIES: Record<FjlSpecies, { name: string; desc: string; base: string; light: string; dark: string }> = {
  jati: { name: 'Jati', desc: 'Serat emas, tahan air & rayap', base: '#a8763f', light: '#c4925a', dark: '#7d5328' },
  mahoni: { name: 'Mahoni', desc: 'Merah kecoklatan, serat halus', base: '#8a4a2e', light: '#a8603f', dark: '#62301b' },
  pinus: { name: 'Pinus', desc: 'Cerah krem, mata kayu khas', base: '#dcb37a', light: '#ecc994', dark: '#b88a52' },
  karet: { name: 'Karet (Rubberwood)', desc: 'Krem rata, ekonomis & stabil', base: '#d9b98e', light: '#e8cda6', dark: '#b8966a' },
  meranti: { name: 'Meranti Merah', desc: 'Kemerahan, umum untuk FJL', base: '#a8603f', light: '#c27a57', dark: '#7d432a' },
  sungkai: { name: 'Sungkai', desc: 'Krem kekuningan, serat lurus', base: '#cdb48a', light: '#ddc8a2', dark: '#a68e64' },
  akasia: { name: 'Akasia', desc: 'Kontras terang-gelap dramatis', base: '#9a6a3a', light: '#c69860', dark: '#5e3a1c' },
};

export function getFjlSpecies(sel?: FjlSelection | null) {
  return FJL_SPECIES[sel?.species || 'jati'] || FJL_SPECIES.jati;
}

// Pilihan warna cat / powder coating rangka
export const FRAME_PAINT_COLORS: { name: string; hex: string }[] = [
  { name: 'Hitam Doff', hex: '#1b1c1f' },
  { name: 'Putih Susu', hex: '#ecebe6' },
  { name: 'Abu Tekstur', hex: '#6b6f75' },
  { name: 'Abu Muda', hex: '#a8adb3' },
  { name: 'Gold', hex: '#c9a227' },
  { name: 'Champagne', hex: '#c8b38a' },
  { name: 'Bronze', hex: '#8a5a3b' },
  { name: 'Coklat Kopi', hex: '#4a3426' },
  { name: 'Navy', hex: '#1f2c45' },
  { name: 'Hijau Army', hex: '#4b5a3e' },
  { name: 'Hijau Botol', hex: '#22443a' },
  { name: 'Merah Marun', hex: '#6d1f24' },
];

export function describeCountertop(config: KitchenConfig): string {
  if (config.countertopMaterial === 'hpl') {
    const sw = getHplSwatch(config.countertopHpl);
    const surf = HPL_SURFACE_LABELS[config.countertopHpl?.surface || 'doff'].name;
    return `HPL ${sw.name}, ${surf}`;
  }
  if (config.countertopMaterial === 'wood-fjl') {
    const sp = getFjlSpecies(config.countertopFjl);
    return `Kayu FJL ${sp.name} (finishing ${config.countertopFjl?.coat === 'glossy' ? 'glossy' : 'doff'})`;
  }
  if (config.countertopMaterial === 'custom') {
    return `Warna kustom ${config.customCountertopColor || ''}`.trim();
  }
  return MATERIAL_LABELS[config.countertopMaterial]?.name || config.countertopMaterial;
}

export function describeCabinetFinish(config: KitchenConfig): string {
  if (config.cabinetFinish === 'hpl') {
    const sw = getHplSwatch(config.cabinetHpl);
    const surf = HPL_SURFACE_LABELS[config.cabinetHpl?.surface || 'doff'].name;
    return `HPL ${sw.name}, ${surf}`;
  }
  if (config.cabinetFinish === 'custom') {
    return `Warna kustom ${config.customCabinetColor || ''}`.trim();
  }
  return CABINET_FINISH_LABELS[config.cabinetFinish]?.name || config.cabinetFinish;
}

export function describeFrame(config: KitchenConfig): string {
  const mat = FRAME_MATERIAL_LABELS[config.frame?.material || 'hollow-steel-black']?.name || 'Besi Hollow';
  const paint = config.frame?.paintColor;
  if (!paint) return mat;
  const named = FRAME_PAINT_COLORS.find((c) => c.hex.toLowerCase() === paint.toLowerCase());
  return `${mat}, cat ${named ? named.name : paint}`;
}
