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
