import React from 'react';
import { X, Trash2, Wrench } from 'lucide-react';
import { FrameMember, KitchenConfig } from '../../types/kitchen';
import { FRAME_ROLE_LABELS, FRAME_ROLE_TRADE, memberBox, memberSectionCm, memberProfileLabel } from '../../utils/frameLayout';

export type Role = 'pemesan' | 'tukang';

interface Props {
  member: FrameMember;
  host: KitchenConfig;
  role: Role;
  onClose: () => void;
  onDelete: () => void;
  onOpenExpert: () => void;
}

/** Kartu info batang yang diketuk di 3D: nama awam dulu, istilah bengkel kecil (dibalik untuk tukang las) */
export const MemberSheet: React.FC<Props> = ({ member, host, role, onClose, onDelete, onOpenExpert }) => {
  const box = memberBox(member, memberSectionCm(member, host));
  const plain = FRAME_ROLE_LABELS[member.role];
  const trade = FRAME_ROLE_TRADE[member.role];
  const [main, sub] = role === 'tukang' ? [trade, plain] : [plain, `istilah bengkel: ${trade}`];
  const rows = [
    { k: 'Panjang potong', v: role === 'tukang' ? `${Math.round(member.length * 10)} mm` : `${member.length} cm` },
    { k: 'Ukuran pipa', v: `${memberProfileLabel(member, host)} mm` },
    { k: 'Tinggi dari lantai', v: `${Math.round(box.min[1] * 10) / 10} cm` },
  ];

  return (
    <div
      role="dialog"
      aria-label={`Batang ${member.label || plain}`}
      className="absolute z-10 left-2 right-2 bottom-2 sm:left-auto sm:right-3 sm:top-14 sm:bottom-auto sm:w-72 p-3 rounded-2xl bg-white border border-stone-300 shadow-xl space-y-2.5"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-stone-900 truncate">{member.label || plain}</div>
          <div className="text-xs text-stone-700">{main}</div>
          <div className="text-[11px] text-stone-400">{sub}</div>
        </div>
        <button onClick={onClose} className="p-1.5 -m-1 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer" aria-label="Tutup">
          <X className="w-4 h-4" />
        </button>
      </div>
      <dl className="grid grid-cols-3 gap-1.5">
        {rows.map((r) => (
          <div key={r.k} className="p-2 rounded-lg bg-stone-100">
            <dt className="text-[10px] text-stone-500 leading-tight">{r.k}</dt>
            <dd className="text-sm font-bold text-stone-900 tabular-nums">{r.v}</dd>
          </div>
        ))}
      </dl>
      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={onDelete} className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-rose-300 text-rose-700 text-xs font-semibold hover:bg-rose-50 cursor-pointer">
          <Trash2 className="w-3.5 h-3.5" /> Hapus batang
        </button>
        <button onClick={onOpenExpert} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-stone-800 text-white text-xs font-semibold hover:bg-stone-700 cursor-pointer">
          <Wrench className="w-3.5 h-3.5" /> Ubah di Mode Ahli
        </button>
      </div>
    </div>
  );
};
