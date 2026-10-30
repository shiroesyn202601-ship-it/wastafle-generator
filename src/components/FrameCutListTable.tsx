import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { KitchenConfig, FrameMember, FrameAxis, FrameMemberRole } from '../types/kitchen';
import { calculateFabricationCutList, describeBars, HollowCutPiece, CutListReport, printHtml } from '../utils/exportDoc';
import {
  getFrameMembers,
  getFrameDims,
  memberBox,
  memberSectionCm,
  AXIS_INDEX,
  VIEW_DEFS,
  VIEW_LABELS,
  FrameView,
} from '../utils/frameLayout';
import { Scissors, FileDown, ImageDown } from 'lucide-react';

interface Props {
  config: KitchenConfig;
}

type Category = HollowCutPiece['category'];

const ROLE_COLORS: Record<Category, string> = {
  'tiang-vertikal': '#60a5fa',
  'gelagar-panjang': '#a78bfa',
  'palang-kedalaman': '#34d399',
  'penyangga-wastafel': '#38bdf8',
  'penyangga-kompor': '#fb923c',
  kustom: '#f472b6',
};

/** Warna lebih gelap untuk lembar cetak berlatar putih */
const PAPER_COLORS: Record<Category, string> = {
  'tiang-vertikal': '#1d4ed8',
  'gelagar-panjang': '#6d28d9',
  'palang-kedalaman': '#047857',
  'penyangga-wastafel': '#0369a1',
  'penyangga-kompor': '#c2410c',
  kustom: '#be185d',
};

interface Theme {
  frameLine: string;
  text: string;
  muted: string;
  dim: string;
  marker: string;
}

const DARK: Theme = { frameLine: '#3f3f46', text: '#e5e7eb', muted: '#a1a1aa', dim: '#3b82f6', marker: 'cut-arrow' };
const PAPER: Theme = { frameLine: '#d4d4d8', text: '#111827', muted: '#4b5563', dim: '#1d4ed8', marker: 'cut-arrow-paper' };

/** Proyeksi miring (cabinet oblique): kedalaman ke belakang digeser ke kanan-atas */
const OBLIQUE = 0.45;
const project = (x: number, y: number, z: number, D: number): [number, number] => [x + (D - z) * OBLIQUE, -y - (D - z) * OBLIQUE];

const THUMB_W = 150;
const THUMB_H = 100;
const CUT_W = 230;
const CUT_H = 74;

/** Gambar posisi: seluruh rangka abu-abu, batang kelompok ini disorot */
const PositionThumb: React.FC<{
  config: KitchenConfig;
  members: FrameMember[];
  highlight: Set<string>;
  color: string;
  theme?: Theme;
  x?: number;
  y?: number;
}> = ({ config, members, highlight, color, theme = DARK, x, y }) => {
  const { W, H, carcaseD } = getFrameDims(config);
  const pad = 6;
  const minX = 0;
  const maxX = W + carcaseD * OBLIQUE;
  const minY = -H - carcaseD * OBLIQUE;
  const maxY = 0;
  const s = Math.min((THUMB_W - pad * 2) / (maxX - minX), (THUMB_H - pad * 2) / (maxY - minY));
  const toPx = ([px, py]: [number, number]): [number, number] => [pad + (px - minX) * s, pad + (py - minY) * s];

  const seg = (m: FrameMember) => {
    const b = memberBox(m, memberSectionCm(m, config));
    const c = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
    const a0 = [...c];
    const a1 = [...c];
    const i = m.axis === 'x' ? 0 : m.axis === 'y' ? 1 : 2;
    a0[i] = b.min[i];
    a1[i] = b.max[i];
    return [toPx(project(a0[0], a0[1], a0[2], carcaseD)), toPx(project(a1[0], a1[1], a1[2], carcaseD))];
  };

  const ordered = [...members.filter((m) => !highlight.has(m.id)), ...members.filter((m) => highlight.has(m.id))];
  return (
    <svg x={x} y={y} width={THUMB_W} height={THUMB_H} viewBox={`0 0 ${THUMB_W} ${THUMB_H}`} className="block">
      {ordered.map((m) => {
        const [p0, p1] = seg(m);
        const on = highlight.has(m.id);
        return (
          <line
            key={m.id}
            x1={p0[0]}
            y1={p0[1]}
            x2={p1[0]}
            y2={p1[1]}
            stroke={on ? color : theme.frameLine}
            strokeWidth={on ? 3 : 1.2}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

/** Sketsa batang hollow tampak samping, kedua ujung potong lurus 90° (tidak berskala) */
const CutShape: React.FC<{ piece: HollowCutPiece; color: string; theme?: Theme; x?: number; y?: number }> = ({
  piece,
  color,
  theme = DARK,
  x,
  y,
}) => {
  const x0 = 18;
  const x1 = 172;
  const y0 = 18;
  const h = 20;
  const y1 = y0 + h;
  const profile = piece.profile;
  // Penampang digambar sebanding (sisi terpanjang = tinggi batang di sketsa)
  const [pw, ph] = profile.split('×').map(Number);
  const secW = (h * pw) / Math.max(pw, ph);
  const secH = (h * ph) / Math.max(pw, ph);

  return (
    <svg x={x} y={y} width={CUT_W} height={CUT_H} viewBox={`0 0 ${CUT_W} ${CUT_H}`} className="block font-mono" fontFamily="Consolas, monospace">
      <rect x={x0} y={y0} width={x1 - x0} height={h} fill={`${color}22`} stroke={color} strokeWidth="1.5" />
      {/* Garis tepi dalam pipa hollow (tebal dinding) */}
      <line x1={x0 + 2} y1={y0 + 3} x2={x1 - 2} y2={y0 + 3} stroke={color} strokeWidth="0.5" strokeDasharray="3,2" opacity="0.6" />
      <line x1={x0 + 2} y1={y1 - 3} x2={x1 - 2} y2={y1 - 3} stroke={color} strokeWidth="0.5" strokeDasharray="3,2" opacity="0.6" />
      <text x={(x0 + x1) / 2} y={y0 + h / 2 + 3} fill={theme.text} fontSize="8.5" textAnchor="middle">
        □ {profile}
      </text>
      <text x={x0 + 2} y={y0 - 5} fill={theme.muted} fontSize="8.5" fontWeight="bold">
        90°
      </text>
      <text x={x1 - 2} y={y0 - 5} fill={theme.muted} fontSize="8.5" fontWeight="bold" textAnchor="end">
        90°
      </text>
      {/* Garis ukur panjang */}
      <line x1={x0} y1={y1 + 6} x2={x0} y2={y1 + 14} stroke={theme.dim} strokeWidth="0.7" />
      <line x1={x1} y1={y1 + 6} x2={x1} y2={y1 + 14} stroke={theme.dim} strokeWidth="0.7" />
      <line
        x1={x0}
        y1={y1 + 10}
        x2={x1}
        y2={y1 + 10}
        stroke={theme.dim}
        strokeWidth="1"
        markerStart={`url(#${theme.marker})`}
        markerEnd={`url(#${theme.marker})`}
      />
      <text x={(x0 + x1) / 2} y={y1 + 26} fill={theme.dim} fontSize="9.5" fontWeight="bold" textAnchor="middle">
        L = {piece.lengthCm} cm
      </text>
      {/* Penampang pipa */}
      <rect x={202 - secW / 2} y={y0 + (h - secH) / 2} width={secW} height={secH} fill="none" stroke={color} strokeWidth="1.5" />
      <rect x={205 - secW / 2} y={y0 + (h - secH) / 2 + 3} width={secW - 6} height={secH - 6} fill="none" stroke={color} strokeWidth="0.7" />
      <text x={202} y={y1 + 12} fill={theme.muted} fontSize="7" textAnchor="middle">
        penampang
      </text>
    </svg>
  );
};

const memberNames = (p: HollowCutPiece, byId: Map<string, FrameMember>) =>
  [...new Set((p.memberIds || []).map((id) => byId.get(id)?.label).filter(Boolean))] as string[];

// ---------- Lembar cetak (SVG murni, latar putih) untuk export PDF & gambar ----------

const SHEET_W = 1123; // A4 lanskap @96dpi
const SHEET_H = 794;
const M = 36;
const HEAD_H = 64;
const TH_H = 28;
const ROW_H = 112;
const TOTAL_H = 64;
const ROWS_PER_PAGE = 5;
// Batas kiri tiap kolom, relatif terhadap margin kiri
const COLS = { no: 0, pos: 36, cut: 206, part: 456, len: 806, qty: 896, sub: 976, end: SHEET_W - 2 * M };

const VIEWS_H = 340; // tinggi blok gambar 5 tampak di lembar export

const ROLE_CATEGORY: Record<FrameMemberRole, Category> = {
  post: 'tiang-vertikal',
  'rail-x': 'gelagar-panjang',
  'rail-z': 'palang-kedalaman',
  'sink-cradle': 'penyangga-wastafel',
  'stove-cradle': 'penyangga-kompor',
  custom: 'kustom',
};

/**
 * Gambar tampak Depan, Belakang (baris 1) dan Atas, Kiri, Kanan (baris 2) dengan skala sama,
 * dimuat sepadat mungkin dalam kotak (x, y, width, height).
 */
const FrameViewsBlock: React.FC<{ config: KitchenConfig; members: FrameMember[]; x: number; y: number; width: number; height: number }> = ({
  config,
  members,
  x,
  y,
  width,
  height,
}) => {
  const { W, H, D } = getFrameDims(config);
  const span = (a: FrameAxis) => (a === 'x' ? W : a === 'y' ? H : D);
  const pad = { t: 18, b: 34, l: 26, r: 8 };
  const gap = 18;
  const s = Math.min(
    (width - 2 * (pad.l + pad.r) - gap) / (2 * W),
    (width - 3 * (pad.l + pad.r) - 2 * gap) / (W + 2 * D),
    (height - 2 * (pad.t + pad.b) - gap) / (H + Math.max(D, H))
  );
  const cellW = (v: FrameView) => span(VIEW_DEFS[v].h) * s + pad.l + pad.r;
  const rows: FrameView[][] = [
    ['front', 'back'],
    ['top', 'left', 'right'],
  ];
  const rowH = (r: FrameView[]) => Math.max(...r.map((v) => span(VIEW_DEFS[v].v))) * s + pad.t + pad.b;
  const boxes = members.map((m) => ({ m, b: memberBox(m, memberSectionCm(m, config)) }));

  const renderView = (v: FrameView, ox: number, oy: number) => {
    const d = VIEW_DEFS[v];
    const hs = span(d.h);
    const vs = span(d.v);
    const map = (a: FrameAxis, flip: boolean, val: number) => (flip ? span(a) - val : val);
    const items = boxes
      .map(({ m, b }) => {
        const hi = AXIS_INDEX[d.h];
        const vi = AXIS_INDEX[d.v];
        const di = AXIS_INDEX[d.d];
        const ha = map(d.h, d.hFlip, b.min[hi]);
        const hb = map(d.h, d.hFlip, b.max[hi]);
        const va = map(d.v, d.vFlip, b.min[vi]);
        const vb = map(d.v, d.vFlip, b.max[vi]);
        const dc = (b.min[di] + b.max[di]) / 2;
        const depth = d.dFlip ? span(d.d) - dc : dc; // kecil = dekat ke penonton
        return { m, h0: Math.min(ha, hb), h1: Math.max(ha, hb), v0: Math.min(va, vb), v1: Math.max(va, vb), depth };
      })
      .sort((a, b) => b.depth - a.depth);
    const px = (h: number) => ox + pad.l + h * s;
    const py = (val: number) => oy + pad.t + (vs - val) * s;
    const dimY = py(0) + 12;
    const dimX = px(0) - 12;
    return (
      <g key={v}>
        <text x={px(0)} y={oy + 11} fontSize="10.5" fontWeight="bold" fill="#000">
          TAMPAK {VIEW_LABELS[v].toUpperCase()}
        </text>
        {items.map(({ m, h0, h1, v0, v1, depth }) => {
          const color = PAPER_COLORS[ROLE_CATEGORY[m.role]];
          const near = 1 - (0.6 * depth) / Math.max(1, span(d.d));
          return (
            <rect
              key={m.id}
              x={px(h0)}
              y={py(v1)}
              width={Math.max(0.6, (h1 - h0) * s)}
              height={Math.max(0.6, (v1 - v0) * s)}
              fill={color}
              fillOpacity={0.15 + 0.55 * near}
              stroke={color}
              strokeOpacity={0.35 + 0.65 * near}
              strokeWidth="0.6"
            />
          );
        })}
        {/* Ukuran keseluruhan */}
        <g stroke="#374151" strokeWidth="0.6">
          <line x1={px(0)} y1={dimY} x2={px(hs)} y2={dimY} />
          <line x1={px(0)} y1={dimY - 3} x2={px(0)} y2={dimY + 3} />
          <line x1={px(hs)} y1={dimY - 3} x2={px(hs)} y2={dimY + 3} />
          <line x1={dimX} y1={py(0)} x2={dimX} y2={py(vs)} />
          <line x1={dimX - 3} y1={py(0)} x2={dimX + 3} y2={py(0)} />
          <line x1={dimX - 3} y1={py(vs)} x2={dimX + 3} y2={py(vs)} />
        </g>
        <text x={(px(0) + px(hs)) / 2} y={dimY + 11} fontSize="9" textAnchor="middle" fill="#111827">
          {hs} cm
        </text>
        <text x={dimX - 4} y={(py(0) + py(vs)) / 2} fontSize="9" textAnchor="middle" fill="#111827" transform={`rotate(-90 ${dimX - 4} ${(py(0) + py(vs)) / 2})`}>
          {vs} cm
        </text>
        <text x={px(0)} y={dimY + 21} fontSize="7" fill="#6b7280">
          {(d.sideB ?? d.sideL).replace(' (dinding)', '')}
        </text>
        <text x={px(hs)} y={dimY + 21} fontSize="7" fill="#6b7280" textAnchor="end">
          {d.sideB ? '' : d.sideR.replace(' (dinding)', '')}
        </text>
      </g>
    );
  };

  const totalH = rowH(rows[0]) + gap + rowH(rows[1]);
  let oy = y + (height - totalH) / 2;
  return (
    <g>
      {rows.map((r) => {
        const rw = r.reduce((sum, v) => sum + cellW(v), 0) + gap * (r.length - 1);
        let ox = x + (width - rw) / 2;
        const out = r.map((v) => {
          const el = renderView(v, ox, oy);
          ox += cellW(v) + gap;
          return el;
        });
        oy += rowH(r) + gap;
        return out;
      })}
    </g>
  );
};

const wrapText = (s: string, max: number) => {
  const lines: string[] = [];
  let cur = '';
  s.split(' ').forEach((w) => {
    if (cur && (cur + ' ' + w).length > max) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  });
  if (cur) lines.push(cur);
  return lines;
};

export const CutListSheet: React.FC<{
  config: KitchenConfig;
  cutList: CutListReport;
  members: FrameMember[];
  rows: { piece: HollowCutPiece; no: number }[];
  page: number;
  pages: number;
  height: number;
  showTotals: boolean;
  showViews?: boolean; // sisipkan gambar 5 tampak di bawah kepala lembar
}> = ({ config, cutList, members, rows, page, pages, height, showTotals, showViews }) => {
  const byId = new Map(members.map((m) => [m.id, m]));
  const tube = config.frame?.tubeSize || 40;
  const totalPcs = cutList.hollowPieces.reduce((s, p) => s + p.qty, 0);
  const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const tableTop = M + HEAD_H + (showViews ? VIEWS_H : 0);
  const rowTop = (i: number) => tableTop + TH_H + i * ROW_H;
  const tableBottom = rowTop(rows.length);
  const R = SHEET_W - M;
  const cx = (c: keyof typeof COLS) => M + COLS[c];
  const font = 'Arial, Helvetica, sans-serif';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={SHEET_W} height={height} viewBox={`0 0 ${SHEET_W} ${height}`} fontFamily={font}>
      <defs>
        <marker id="cut-arrow-paper" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={PAPER.dim} />
        </marker>
      </defs>
      <rect width={SHEET_W} height={height} fill="#ffffff" />

      {/* Kepala lembar */}
      <text x={M} y={M + 18} fontSize="18" fontWeight="bold" fill="#000">
        DAFTAR POTONGAN BESI RANGKA
      </text>
      <text x={M} y={M + 38} fontSize="11.5" fill="#374151">
        Meja {config.totalWidth} × {config.totalDepth} × {config.totalHeight} cm · Besi hollow {tube}×{tube} mm · Semua ujung potong lurus 90°
      </text>
      <text x={R} y={M + 18} fontSize="11" fill="#374151" textAnchor="end">
        {date}
      </text>
      {pages > 1 && (
        <text x={R} y={M + 38} fontSize="11" fill="#374151" textAnchor="end">
          Hal. {page} / {pages}
        </text>
      )}
      <line x1={M} y1={M + 50} x2={R} y2={M + 50} stroke="#000" strokeWidth="1.5" />

      {showViews && <FrameViewsBlock config={config} members={members} x={M} y={M + HEAD_H - 6} width={R - M} height={VIEWS_H - 6} />}

      {/* Kepala tabel */}
      <rect x={M} y={tableTop} width={R - M} height={TH_H} fill="#f3f4f6" stroke="#000" strokeWidth="0.75" />
      {(
        [
          ['no', 'No', 'middle'],
          ['pos', 'Posisi di Rangka', 'start'],
          ['cut', 'Bentuk Potongan', 'start'],
          ['part', 'Bagian', 'start'],
          ['len', 'Panjang', 'end'],
          ['qty', 'Jumlah', 'middle'],
          ['sub', 'Subtotal', 'end'],
        ] as [keyof typeof COLS, string, 'start' | 'middle' | 'end'][]
      ).map(([c, label, anchor], i, arr) => {
        const next = i + 1 < arr.length ? arr[i + 1][0] : 'end';
        const x = anchor === 'start' ? cx(c) + 8 : anchor === 'end' ? cx(next) - 8 : (cx(c) + cx(next)) / 2;
        return (
          <text key={c} x={x} y={tableTop + 18} fontSize="11" fontWeight="bold" textAnchor={anchor}>
            {label}
          </text>
        );
      })}

      {/* Baris */}
      {rows.map(({ piece: p, no }, i) => {
        const top = rowTop(i);
        const color = PAPER_COLORS[p.category];
        const names = wrapText(memberNames(p, byId).join(', '), 62).slice(0, 4);
        return (
          <g key={p.id}>
            <rect x={M} y={top} width={R - M} height={ROW_H} fill="none" stroke="#000" strokeWidth="0.5" />
            <text x={(cx('no') + cx('pos')) / 2} y={top + ROW_H / 2 + 4} fontSize="12" fontWeight="bold" textAnchor="middle">
              {no}
            </text>
            <rect x={cx('pos') + 10} y={top + 6} width={THUMB_W} height={THUMB_H} fill="#fafafa" stroke="#e5e7eb" />
            <PositionThumb config={config} members={members} highlight={new Set(p.memberIds || [])} color={color} theme={PAPER} x={cx('pos') + 10} y={top + 6} />
            <CutShape piece={p} color={color} theme={PAPER} x={cx('cut') + 10} y={top + (ROW_H - CUT_H) / 2} />
            <text x={cx('part') + 8} y={top + 26} fontSize="12" fontWeight="bold" fill={color}>
              {p.label}
            </text>
            {names.map((line, li) => (
              <text key={li} x={cx('part') + 8} y={top + 44 + li * 14} fontSize="10.5" fill="#374151">
                {line}
                {li === 3 ? ' …' : ''}
              </text>
            ))}
            <text x={cx('qty') - 8} y={top + ROW_H / 2 + 4} fontSize="12" fontWeight="bold" textAnchor="end">
              {p.lengthCm} cm
            </text>
            <text x={(cx('qty') + cx('sub')) / 2} y={top + ROW_H / 2 + 4} fontSize="12" fontWeight="bold" textAnchor="middle">
              {p.qty} pcs
            </text>
            <text x={R - 8} y={top + ROW_H / 2 + 4} fontSize="12" textAnchor="end">
              {((p.qty * p.lengthCm) / 100).toFixed(2)} m
            </text>
          </g>
        );
      })}
      {/* Garis kolom */}
      {(['pos', 'cut', 'part', 'len', 'qty', 'sub'] as (keyof typeof COLS)[]).map((c) => (
        <line key={c} x1={cx(c)} y1={tableTop} x2={cx(c)} y2={tableBottom} stroke="#000" strokeWidth="0.5" />
      ))}

      {showTotals && (
        <g>
          <rect x={M} y={tableBottom} width={R - M} height={TH_H} fill="#f3f4f6" stroke="#000" strokeWidth="0.75" />
          <text x={cx('qty') - 8} y={tableBottom + 18} fontSize="12" fontWeight="bold" textAnchor="end">
            Total potongan
          </text>
          <text x={(cx('qty') + cx('sub')) / 2} y={tableBottom + 18} fontSize="12" fontWeight="bold" textAnchor="middle">
            {totalPcs} pcs
          </text>
          <text x={R - 8} y={tableBottom + 18} fontSize="12" fontWeight="bold" textAnchor="end">
            {cutList.totalSteelLengthM} m
          </text>
          <text x={M} y={tableBottom + TH_H + 20} fontSize="11" fill="#111827">
            Kebutuhan bahan: {describeBars(cutList)} @ 6 m (sudah termasuk sisa potong {cutList.wastePercentage}%)
            {cutList.levelingFeetCount > 0 ? ` · Kaki stel: ${cutList.levelingFeetCount} buah` : ''}. Panjang L diukur ujung ke ujung; sketsa tidak
            berskala.
          </text>
        </g>
      )}
    </svg>
  );
};

const renderSvgMarkup = (el: React.ReactElement) => {
  const div = document.createElement('div');
  const root = createRoot(div);
  flushSync(() => root.render(el));
  const html = div.innerHTML;
  root.unmount();
  return html;
};

const sheetProps = (config: KitchenConfig) => {
  const cutList = calculateFabricationCutList(config);
  const members = getFrameMembers(config);
  const rows = cutList.hollowPieces.map((piece, i) => ({ piece, no: i + 1 }));
  return { cutList, members, rows };
};

/** Cetak lewat dialog browser (Simpan sebagai PDF), A4 lanskap: hal. 1 = 5 tampak + baris awal, berikutnya 5 baris/halaman */
export function printCutListPdf(config: KitchenConfig) {
  const { cutList, members, rows } = sheetProps(config);
  const firstRows = Math.floor((SHEET_H - 2 * M - HEAD_H - VIEWS_H - TH_H - TOTAL_H) / ROW_H);
  const chunks = [rows.slice(0, firstRows)];
  for (let i = firstRows; i < rows.length; i += ROWS_PER_PAGE) chunks.push(rows.slice(i, i + ROWS_PER_PAGE));
  const svgs = chunks.map((chunk, i) =>
    renderSvgMarkup(
      <CutListSheet
        config={config}
        cutList={cutList}
        members={members}
        rows={chunk}
        page={i + 1}
        pages={chunks.length}
        height={SHEET_H}
        showTotals={i === chunks.length - 1}
        showViews={i === 0}
      />
    )
  );
  printHtml(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Daftar Potongan Besi Rangka ${config.totalWidth}cm</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  svg { display: block; width: 297mm; height: 209mm; page-break-after: always; break-after: page; }
  svg:last-child { page-break-after: auto; break-after: auto; }
</style></head><body>${svgs.join('')}</body></html>`);
}

/** Unduh satu gambar PNG berisi 5 tampak rangka + seluruh tabel potongan */
export function downloadCutListPng(config: KitchenConfig) {
  const { cutList, members, rows } = sheetProps(config);
  const height = M + HEAD_H + VIEWS_H + TH_H + rows.length * ROW_H + TOTAL_H + M;
  const markup = renderSvgMarkup(
    <CutListSheet config={config} cutList={cutList} members={members} rows={rows} page={1} pages={1} height={height} showTotals showViews />
  );
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
  const img = new Image();
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = SHEET_W * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `potongan-besi-rangka-${config.totalWidth}cm.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  };
  img.src = url;
}

export const FrameCutListTable: React.FC<Props> = ({ config }) => {
  const cutList = calculateFabricationCutList(config);
  const members = getFrameMembers(config);
  const byId = new Map(members.map((m) => [m.id, m]));
  const pieces = cutList.hollowPieces;
  const totalPcs = pieces.reduce((s, p) => s + p.qty, 0);
  const btn =
    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition';

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 sm:p-6 shadow-xl">
      <svg width="0" height="0" className="absolute">
        <defs>
          <marker id="cut-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
          </marker>
        </defs>
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-sm text-neutral-200 uppercase tracking-wider">4. Daftar Potongan Besi Rangka</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => printCutListPdf(config)} className={btn} title="Cetak / simpan sebagai PDF (A4 lanskap)">
            <FileDown className="w-3.5 h-3.5 text-rose-400" /> PDF
          </button>
          <button onClick={() => downloadCutListPng(config)} className={btn} title="Unduh tabel sebagai gambar PNG">
            <ImageDown className="w-3.5 h-3.5 text-emerald-400" /> Gambar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[760px]">
          <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
            <tr>
              <th className="py-2.5 px-3 text-center">No</th>
              <th className="py-2.5 px-3">Posisi di Rangka</th>
              <th className="py-2.5 px-3">Bentuk Potongan</th>
              <th className="py-2.5 px-3">Bagian</th>
              <th className="py-2.5 px-3 text-right">Panjang</th>
              <th className="py-2.5 px-3 text-center">Jumlah</th>
              <th className="py-2.5 px-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {pieces.map((p, idx) => {
              const color = ROLE_COLORS[p.category];
              const names = memberNames(p, byId);
              return (
                <tr key={p.id} className="align-middle hover:bg-neutral-800/30">
                  <td className="py-2 px-3 text-center font-mono font-bold text-neutral-300">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <div className="rounded-lg bg-neutral-950/70 border border-neutral-800 inline-block">
                      <PositionThumb config={config} members={members} highlight={new Set(p.memberIds || [])} color={color} />
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <CutShape piece={p} color={color} />
                  </td>
                  <td className="py-2 px-3 max-w-[220px]">
                    <p className="font-semibold text-neutral-200" style={{ color }}>
                      {p.label}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {names.slice(0, 4).join(', ')}
                      {names.length > 4 ? ', …' : ''}
                    </p>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-neutral-100 whitespace-nowrap">{p.lengthCm} cm</td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-amber-300 whitespace-nowrap">{p.qty} pcs</td>
                  <td className="py-2 px-3 text-right font-mono text-neutral-300 whitespace-nowrap">{((p.qty * p.lengthCm) / 100).toFixed(2)} m</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-neutral-950 border-t-2 border-neutral-800 font-mono">
            <tr>
              <td colSpan={5} className="py-3 px-3 text-right font-sans font-semibold text-neutral-300">
                Total potongan
              </td>
              <td className="py-3 px-3 text-center font-bold text-amber-300">{totalPcs} pcs</td>
              <td className="py-3 px-3 text-right font-bold text-neutral-100">{cutList.totalSteelLengthM} m</td>
            </tr>
            <tr>
              <td colSpan={7} className="py-2.5 px-3 font-sans text-[11px] text-neutral-400">
                Kebutuhan bahan: <span className="text-emerald-400 font-semibold">{describeBars(cutList)} @ 6 m</span> (sudah termasuk sisa
                potong {cutList.wastePercentage}%)
                {cutList.levelingFeetCount > 0 && <> • Kaki stel: {cutList.levelingFeetCount} buah</>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-[10px] text-neutral-500 mt-3">
        Semua ujung batang dipotong lurus 90°. Panjang L diukur ujung ke ujung; sketsa bentuk potongan tidak berskala.
      </p>
    </div>
  );
};
