import React, { useState } from 'react';
import { ArrowLeft, Trash2, Wrench, ChevronDown, RotateCcw, AlertTriangle, Link2 } from 'lucide-react';
import { FrameMember, KitchenConfig, MemberTweak } from '../../types/kitchen';
import { FRAME_ROLE_LABELS, FRAME_ROLE_TRADE, memberBox, memberSectionCm, memberProfileLabel } from '../../utils/frameLayout';
import { ParamDef, ParamValue, Params } from '../../products/types';
import { ParamControl } from './ParamControl';

interface Props {
  member: FrameMember;
  host: KitchenConfig;
  /** pilihan yang paling berkaitan dengan batang ini (dicari otomatis) */
  related: ParamDef[];
  params: Params;
  base: Params;
  onParam: (key: string, v: ParamValue) => void;
  onHover?: (key: string, v: ParamValue | undefined | null) => void;
  /** penyesuaian batang ini saja (null = rangka sudah diedit manual di Mode bengkel, tidak bisa) */
  tweak: MemberTweak | null;
  partners: number; // jumlah batang kembaran di sisi lain
  connected: boolean;
  onTweak: (patch: Partial<MemberTweak>, mirror: boolean) => void;
  onResetTweak: (mirror: boolean) => void;
  onClose: () => void;
  onDelete: (mirror: boolean) => void;
  onOpenExpert: () => void;
}

/** Ukuran pipa yang umum untuk satu batang (sisi × sisi, mm) */
const PIPES: { label: string; size: number; h?: number }[] = [
  { label: '20×20', size: 20 },
  { label: '20×40', size: 20, h: 40 },
  { label: '30×30', size: 30 },
  { label: '40×40', size: 40 },
  { label: '40×60', size: 40, h: 60 },
];

/** Arah geser yang masuk akal untuk batang menurut arah batangnya */
const MOVES: Record<FrameMember['axis'], { key: 'dx' | 'dy' | 'dz'; label: string; minus: string; plus: string }[]> = {
  x: [
    { key: 'dy', label: 'Naik / turun', minus: 'turun', plus: 'naik' },
    { key: 'dz', label: 'Maju / mundur', minus: 'mundur', plus: 'maju' },
  ],
  z: [
    { key: 'dy', label: 'Naik / turun', minus: 'turun', plus: 'naik' },
    { key: 'dx', label: 'Kiri / kanan', minus: 'ke kiri', plus: 'ke kanan' },
  ],
  y: [
    { key: 'dx', label: 'Kiri / kanan', minus: 'ke kiri', plus: 'ke kanan' },
    { key: 'dz', label: 'Maju / mundur', minus: 'mundur', plus: 'maju' },
  ],
};

/**
 * Panel "bagian ini": muncul saat batang diketuk di 3D. Isinya pilihan yang mengubah bagian itu,
 * penyesuaian batang ini saja (geser, ganti pipa, hapus) tanpa pindah ke Mode bengkel, lalu info bengkel.
 */
export const MemberSheet: React.FC<Props> = (p) => {
  const { member, host, tweak } = p;
  const [mirror, setMirror] = useState(true);
  const [info, setInfo] = useState(false);
  const box = memberBox(member, memberSectionCm(member, host));
  const plain = FRAME_ROLE_LABELS[member.role];
  const rows = [
    { k: 'Panjang potong', v: `${member.length} cm` },
    { k: 'Ukuran pipa', v: `${memberProfileLabel(member, host)} mm` },
    { k: 'Tinggi dari lantai', v: `${Math.round(box.min[1] * 10) / 10} cm` },
  ];
  const useMirror = mirror && p.partners > 0;
  const curPipe = `${member.tubeSize || host.frame.tubeSize}×${member.tubeH || member.tubeSize || host.frame.tubeSize}`;
  const tweaked = !!tweak && Object.keys(tweak).length > 0;

  return (
    <div className="space-y-4" role="region" aria-label={`Bagian ${member.label || plain}`}>
      <div className="flex items-start gap-2">
        <button onClick={p.onClose} className="p-2 -ml-2 rounded-lg text-stone-600 hover:bg-stone-100 cursor-pointer" aria-label="Kembali ke langkah" title="Kembali ke langkah">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Bagian yang dipilih</div>
          <div className="text-base font-bold text-stone-900 truncate">{member.label || plain}</div>
          <div className="text-[11px] text-stone-400">istilah bengkel: {FRAME_ROLE_TRADE[member.role]}</div>
        </div>
      </div>

      {p.related.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">Pilihan yang mengubah bagian ini</h3>
          {p.related.map((d) => (
            <ParamControl
              key={d.key}
              def={d}
              value={p.params[d.key] as ParamValue}
              base={p.base[d.key]}
              onChange={(v) => p.onParam(d.key, v)}
              onHover={p.onHover ? (v) => p.onHover!(d.key, v) : undefined}
            />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">Ubah batang ini saja</h3>
          {tweaked && (
            <button onClick={() => p.onResetTweak(useMirror)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:underline cursor-pointer">
              <RotateCcw className="w-3 h-3" /> kembalikan
            </button>
          )}
        </div>
        {tweak === null ? (
          <p className="text-xs text-stone-500">
            Rangka sudah diubah manual di Mode bengkel, jadi batang hanya bisa diubah di sana. Tekan <b>Kembalikan rangka otomatis</b> di langkah mana pun untuk memakai fitur ini lagi.
          </p>
        ) : (
          <>
            {p.partners > 0 && (
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} className="w-4 h-4 accent-sky-600" />
                <Link2 className="w-3.5 h-3.5 text-stone-400" />
                Ikut ubah {p.partners} batang kembarannya di sisi lain
              </label>
            )}
            {MOVES[member.axis].map((mv) => {
              const v = tweak[mv.key] || 0;
              const set = (d: number) => p.onTweak({ [mv.key]: Math.round((v + d) * 10) / 10 }, useMirror);
              return (
                <div key={mv.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-stone-800">{mv.label}</span>
                    <span className="text-xs text-stone-500 tabular-nums">{v === 0 ? 'posisi asli' : `${Math.abs(v)} cm ${v > 0 ? mv.plus : mv.minus}`}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[-5, -1, 1, 5].map((d) => (
                      <button
                        key={d}
                        onClick={() => set(d)}
                        className="h-9 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-700 hover:border-stone-500 cursor-pointer"
                        aria-label={`${Math.abs(d)} cm ${d > 0 ? mv.plus : mv.minus}`}
                      >
                        {d > 0 ? `+${d}` : d} cm
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="space-y-1">
              <div className="text-sm font-semibold text-stone-800">Ukuran pipa batang ini</div>
              <div className="flex flex-wrap gap-1.5">
                {PIPES.map((pp) => {
                  const on = curPipe === `${pp.size}×${pp.h || pp.size}`;
                  return (
                    <button
                      key={pp.label}
                      onClick={() => p.onTweak({ tubeSize: pp.size, tubeH: pp.h }, useMirror)}
                      aria-pressed={on}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold tabular-nums cursor-pointer ${
                        on ? 'border-sky-600 bg-sky-600 text-white' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
                      }`}
                    >
                      {pp.label}
                    </button>
                  );
                })}
                {(tweak.tubeSize || tweak.tubeH) && (
                  <button onClick={() => p.onTweak({ tubeSize: undefined, tubeH: undefined }, useMirror)} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sky-700 hover:bg-sky-50 cursor-pointer">
                    ikut pengaturan
                  </button>
                )}
              </div>
            </div>
            {!p.connected && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <div className="space-y-1.5">
                  <p>Batang ini tidak lagi menempel ke batang lain, jadi tidak bisa dilas.</p>
                  <button onClick={() => p.onTweak({ dx: undefined, dy: undefined, dz: undefined }, useMirror)} className="px-2.5 py-1 rounded-lg bg-white border border-current font-semibold cursor-pointer">
                    Kembalikan posisinya
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="rounded-xl border border-stone-200">
        <button onClick={() => setInfo(!info)} aria-expanded={info} className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-stone-600 cursor-pointer">
          Info untuk bengkel
          <ChevronDown className={`w-4 h-4 transition ${info ? 'rotate-180' : ''}`} />
        </button>
        {info && (
          <dl className="grid grid-cols-3 gap-1.5 px-3 pb-3">
            {rows.map((r) => (
              <div key={r.k} className="p-2 rounded-lg bg-stone-100">
                <dt className="text-[10px] text-stone-500 leading-tight">{r.k}</dt>
                <dd className="text-sm font-bold text-stone-900 tabular-nums">{r.v}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={() => p.onDelete(useMirror)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-rose-300 text-rose-700 text-xs font-semibold hover:bg-rose-50 cursor-pointer">
          <Trash2 className="w-3.5 h-3.5" /> Hapus batang{useMirror ? ` (+${p.partners})` : ''}
        </button>
        <button onClick={p.onOpenExpert} className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-stone-800 text-white text-xs font-semibold hover:bg-stone-700 cursor-pointer">
          <Wrench className="w-3.5 h-3.5" /> Mode bengkel 2D
        </button>
      </div>
    </div>
  );
};
