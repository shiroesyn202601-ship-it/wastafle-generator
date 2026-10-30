import React from 'react';
import { KitchenConfig, FrameMember } from '../types/kitchen';
import { calculateFabricationCutList, HollowCutPiece } from '../utils/exportDoc';
import { getFrameMembers, getFrameDims, memberBox, memberTubeCm, describeEndCut, EndCut } from '../utils/frameLayout';
import { Scissors } from 'lucide-react';

interface Props {
  config: KitchenConfig;
  onChange?: (updates: Partial<KitchenConfig>) => void;
}

const ROLE_COLORS: Record<HollowCutPiece['category'], string> = {
  'tiang-vertikal': '#60a5fa',
  'gelagar-panjang': '#a78bfa',
  'palang-kedalaman': '#34d399',
  'penyangga-wastafel': '#38bdf8',
  'penyangga-kompor': '#fb923c',
  kustom: '#f472b6',
};

/** Proyeksi miring (cabinet oblique): kedalaman ke belakang digeser ke kanan-atas */
const OBLIQUE = 0.45;
const project = (x: number, y: number, z: number, D: number): [number, number] => [x + (D - z) * OBLIQUE, -y - (D - z) * OBLIQUE];

/** Gambar posisi: seluruh rangka abu-abu, batang kelompok ini disorot */
const PositionThumb: React.FC<{ config: KitchenConfig; members: FrameMember[]; highlight: Set<string>; color: string }> = ({
  config,
  members,
  highlight,
  color,
}) => {
  const { W, H, carcaseD } = getFrameDims(config);
  const boxW = 150;
  const boxH = 100;
  const pad = 6;
  const minX = 0;
  const maxX = W + carcaseD * OBLIQUE;
  const minY = -H - carcaseD * OBLIQUE;
  const maxY = 0;
  const s = Math.min((boxW - pad * 2) / (maxX - minX), (boxH - pad * 2) / (maxY - minY));
  const toPx = ([px, py]: [number, number]): [number, number] => [pad + (px - minX) * s, pad + (py - minY) * s];

  const seg = (m: FrameMember) => {
    const b = memberBox(m, memberTubeCm(m, config));
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
    <svg width={boxW} height={boxH} viewBox={`0 0 ${boxW} ${boxH}`} className="block">
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
            stroke={on ? color : '#3f3f46'}
            strokeWidth={on ? 3 : 1.2}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

/** Sketsa batang hollow tampak samping + bentuk potongan kedua ujung (tidak berskala) */
const CutShape: React.FC<{ piece: HollowCutPiece; axis: FrameMember['axis']; color: string }> = ({ piece, axis, color }) => {
  const cuts: [EndCut, EndCut] = piece.endCuts || [{ angle: 90 }, { angle: 90 }];
  const w = 230;
  const x0 = 18;
  const x1 = 172;
  const y0 = 18;
  const h = 20;
  const y1 = y0 + h;
  // Sisi dalam (pendek) digambar di atas bila badan batang pasangan mengarah + di sumbunya
  const topInner = (c: EndCut) => c.angle === 45 && c.innerSign === 1;
  const botInner = (c: EndCut) => c.angle === 45 && c.innerSign === -1;
  const tl = topInner(cuts[0]) ? x0 + h : x0;
  const bl = botInner(cuts[0]) ? x0 + h : x0;
  const tr = topInner(cuts[1]) ? x1 - h : x1;
  const br = botInner(cuts[1]) ? x1 - h : x1;
  const tube = piece.tubeSizeMm;
  const angleLabel = (c: EndCut) => (c.angle === 45 ? '45°' : '90°');

  return (
    <svg width={w} height={74} viewBox={`0 0 ${w} 74`} className="block font-mono">
      <polygon points={`${tl},${y0} ${tr},${y0} ${br},${y1} ${bl},${y1}`} fill={`${color}22`} stroke={color} strokeWidth="1.5" />
      {/* Garis tepi dalam pipa hollow (tebal dinding) */}
      <line x1={Math.max(tl, bl) + 2} y1={y0 + 3} x2={Math.min(tr, br) - 2} y2={y0 + 3} stroke={color} strokeWidth="0.5" strokeDasharray="3,2" opacity="0.6" />
      <line x1={Math.max(tl, bl) + 2} y1={y1 - 3} x2={Math.min(tr, br) - 2} y2={y1 - 3} stroke={color} strokeWidth="0.5" strokeDasharray="3,2" opacity="0.6" />
      <text x={(x0 + x1) / 2} y={y0 + h / 2 + 3} fill="#e5e7eb" fontSize="8.5" textAnchor="middle">
        □ {tube}×{tube}
      </text>
      {/* Label sudut ujung */}
      <text x={x0 + 2} y={y0 - 5} fill={cuts[0].angle === 45 ? '#fbbf24' : '#a1a1aa'} fontSize="8.5" fontWeight="bold">
        {angleLabel(cuts[0])}
      </text>
      <text x={x1 - 2} y={y0 - 5} fill={cuts[1].angle === 45 ? '#fbbf24' : '#a1a1aa'} fontSize="8.5" fontWeight="bold" textAnchor="end">
        {angleLabel(cuts[1])}
      </text>
      {/* Garis ukur panjang (sisi terpanjang) */}
      <line x1={Math.min(tl, bl)} y1={y1 + 6} x2={Math.min(tl, bl)} y2={y1 + 14} stroke="#3b82f6" strokeWidth="0.7" />
      <line x1={Math.max(tr, br)} y1={y1 + 6} x2={Math.max(tr, br)} y2={y1 + 14} stroke="#3b82f6" strokeWidth="0.7" />
      <line
        x1={Math.min(tl, bl)}
        y1={y1 + 10}
        x2={Math.max(tr, br)}
        y2={y1 + 10}
        stroke="#3b82f6"
        strokeWidth="1"
        markerStart="url(#cut-arrow)"
        markerEnd="url(#cut-arrow)"
      />
      <text x={(x0 + x1) / 2} y={y1 + 26} fill="#93c5fd" fontSize="9.5" fontWeight="bold" textAnchor="middle">
        L = {piece.lengthCm} cm
      </text>
      {/* Penampang pipa */}
      <rect x={192} y={y0} width={h} height={h} fill="none" stroke={color} strokeWidth="1.5" />
      <rect x={195} y={y0 + 3} width={h - 6} height={h - 6} fill="none" stroke={color} strokeWidth="0.7" />
      <text x={192 + h / 2} y={y1 + 12} fill="#71717a" fontSize="7" textAnchor="middle">
        penampang
      </text>
      <title>{`${describeEndCut(cuts[0], axis)} / ${describeEndCut(cuts[1], axis)}`}</title>
    </svg>
  );
};

export const FrameCutListTable: React.FC<Props> = ({ config, onChange }) => {
  const cutList = calculateFabricationCutList(config);
  const members = getFrameMembers(config);
  const byId = new Map(members.map((m) => [m.id, m]));
  const pieces = cutList.hollowPieces;
  const totalPcs = pieces.reduce((s, p) => s + p.qty, 0);
  const frame = config.frame;
  const joint = frame?.cornerJoint ?? 'butt';
  const canToggle = !!onChange && !!frame && !frame.customLayout;

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
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-400">Sambungan sudut atas:</span>
          {(['butt', 'miter'] as const).map((j) => (
            <button
              key={j}
              disabled={!canToggle}
              onClick={() => frame && onChange?.({ frame: { ...frame, cornerJoint: j } })}
              className={`px-2.5 py-1 rounded-lg border transition disabled:opacity-50 ${
                joint === j ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {j === 'butt' ? 'Lurus 90°' : 'Miter 45°'}
            </button>
          ))}
        </div>
      </div>
      {frame?.customLayout && (
        <p className="text-[11px] text-neutral-500 mb-3">
          Rangka diedit manual di Editor Rangka 2D: bentuk potongan dibaca dari posisi batang (ujung yang bertemu di sudut = miter 45°).
        </p>
      )}

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
              const ids = p.memberIds || [];
              const first = byId.get(ids[0]);
              const color = ROLE_COLORS[p.category];
              const names = [...new Set(ids.map((id) => byId.get(id)?.label).filter(Boolean))];
              const cuts = p.endCuts || [{ angle: 90 }, { angle: 90 }];
              return (
                <tr key={p.id} className="align-middle hover:bg-neutral-800/30">
                  <td className="py-2 px-3 text-center font-mono font-bold text-neutral-300">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <div className="rounded-lg bg-neutral-950/70 border border-neutral-800 inline-block">
                      <PositionThumb config={config} members={members} highlight={new Set(ids)} color={color} />
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <CutShape piece={p} axis={first?.axis || 'x'} color={color} />
                  </td>
                  <td className="py-2 px-3 max-w-[220px]">
                    <p className="font-semibold text-neutral-200" style={{ color }}>
                      {p.label}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {names.slice(0, 4).join(', ')}
                      {names.length > 4 ? ', …' : ''}
                    </p>
                    <p className="text-[10px] text-amber-300/80 mt-0.5">
                      Ujung: {describeEndCut(cuts[0], first?.axis || 'x')} / {describeEndCut(cuts[1], first?.axis || 'x')}
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
                Kebutuhan bahan: <span className="text-emerald-400 font-semibold">{cutList.standard6mBarsNeeded} batang hollow 6 m</span> (sudah termasuk sisa
                potong {cutList.wastePercentage}%)
                {cutList.levelingFeetCount > 0 && <> • Kaki stel: {cutList.levelingFeetCount} buah</>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-[10px] text-neutral-500 mt-3">
        Panjang L diukur pada sisi terpanjang (ujung ke ujung). Sketsa bentuk potongan tidak berskala; sisi pendek miter menghadap ke dalam sudut rangka.
      </p>
    </div>
  );
};
