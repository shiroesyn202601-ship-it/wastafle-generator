import { KitchenConfig, ColumnType, SectionKind, FrameMember } from '../types/kitchen';

const mirrorColumnType = (t: ColumnType): ColumnType =>
  t === 'door-single-left' ? 'door-single-right' : t === 'door-single-right' ? 'door-single-left' : t;

const mirrorSectionKind = (k?: SectionKind): SectionKind | undefined =>
  k === 'door-left' ? 'door-right' : k === 'door-right' ? 'door-left' : k;

/**
 * Tukar posisi wastafel & kompor dengan mencerminkan seluruh layout kiri-kanan:
 * posisi alat, urutan modul kabinet, arah bukaan pintu, dan rangka.
 */
export function mirrorKitchenLayout(config: KitchenConfig): Partial<KitchenConfig> {
  const W = config.totalWidth;

  const columns = [...config.columns].reverse().map((col) => ({
    ...col,
    type: mirrorColumnType(col.type),
    drawers: (col.drawers || []).map((d) => ({ ...d, kind: mirrorSectionKind(d.kind) })),
  }));

  const frame = config.frame
    ? {
        ...config.frame,
        supports: config.frame.supports?.map((s) => ({ ...s, posX: Math.round((W - s.posX) * 10) / 10 })),
        members: config.frame.members?.map(
          (m): FrameMember => ({
            ...m,
            x: Math.round((m.axis === 'x' ? W - m.x - m.length : W - m.x) * 10) / 10,
          })
        ),
      }
    : config.frame;

  return {
    columns,
    sink: { ...config.sink, posX: W - config.sink.posX },
    stove: { ...config.stove, posX: W - config.stove.posX },
    frame,
  };
}

/** Rentang X tiap kolom (cm dari kiri), mengikuti proporsi lebar kolom terhadap panjang meja */
export function getColumnSpans(config: KitchenConfig): { start: number; end: number }[] {
  const total = config.columns.reduce((s, c) => s + c.width, 0) || 1;
  let acc = 0;
  return config.columns.map((c) => {
    const w = (c.width / total) * config.totalWidth;
    const span = { start: acc, end: acc + w };
    acc += w;
    return span;
  });
}

const spanIndexAt = (spans: { start: number; end: number }[], x: number) => {
  const i = spans.findIndex((s) => x >= s.start && x < s.end);
  return i >= 0 ? i : x < 0 ? 0 : spans.length - 1;
};

/**
 * Pindahkan kolom dari posisi `from` ke `to`. Wastafel & kompor ikut berpindah bersama kolom
 * tempat mereka berada (posisi relatif di dalam kolom dipertahankan), sehingga penyangganya ikut menyesuaikan.
 */
export function reorderColumns(config: KitchenConfig, from: number, to: number): Partial<KitchenConfig> {
  if (from === to || from < 0 || to < 0 || from >= config.columns.length || to >= config.columns.length) return {};
  const oldSpans = getColumnSpans(config);
  const order = config.columns.map((_, i) => i);
  const [moved] = order.splice(from, 1);
  order.splice(to, 0, moved);
  const columns = order.map((i) => config.columns[i]);
  const newSpans = getColumnSpans({ ...config, columns });
  const newStartOf = (oldIdx: number) => newSpans[order.indexOf(oldIdx)].start;

  // Alat dijaga minimal (tebal pipa + 1.5 cm) dari tepi luar meja agar tidak menabrak rangka sisi
  const edge = (config.frame?.tubeSize || 40) / 10 + 1.5;
  const W = config.totalWidth;
  const follow = (posX: number, width: number) => {
    const idx = spanIndexAt(oldSpans, posX);
    const x = newStartOf(idx) + (posX - oldSpans[idx].start);
    const clamped = Math.min(Math.max(x, width / 2 + edge), W - width / 2 - edge);
    return Math.round(clamped * 10) / 10;
  };
  const sinkX = follow(config.sink.posX, config.sink.width);
  const stoveX = follow(config.stove.posX, config.stove.width);
  const dxSink = sinkX - config.sink.posX;
  const dxStove = stoveX - config.stove.posX;

  const frame = config.frame
    ? {
        ...config.frame,
        supports: config.frame.supports?.map((s) =>
          s.type === 'sink-cradle' ? { ...s, posX: s.posX + dxSink } : s.type === 'stove-cradle' ? { ...s, posX: s.posX + dxStove } : s
        ),
        // Rangka manual: batang penyangga ikut bergeser bersama alatnya
        members: config.frame.members?.map((m): FrameMember =>
          m.role === 'sink-cradle' ? { ...m, x: m.x + dxSink } : m.role === 'stove-cradle' ? { ...m, x: m.x + dxStove } : m
        ),
      }
    : config.frame;

  return {
    columns,
    sink: { ...config.sink, posX: sinkX },
    stove: { ...config.stove, posX: stoveX },
    frame,
  };
}

/** Jarak bersih antara wastafel & kompor (cm), -1 jika bertabrakan; tidak bergantung urutan kiri/kanan */
export function getSinkStoveGap(config: KitchenConfig): number {
  const { sink, stove } = config;
  const sinkL = sink.posX - sink.width / 2;
  const sinkR = sink.posX + sink.width / 2;
  const stoveL = stove.posX - stove.width / 2;
  const stoveR = stove.posX + stove.width / 2;
  if (sinkR <= stoveL) return stoveL - sinkR;
  if (stoveR <= sinkL) return sinkL - stoveR;
  return -1;
}
