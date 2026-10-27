import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { HplSelection, HplSurface, HplGroup } from '../types/kitchen';
import { HPL_CATALOG, HPL_GROUPS, HPL_SURFACE_LABELS, getHplSwatch } from '../utils/finishes';
import { getHplPreviewUrl } from '../utils/proceduralTextures';

interface Props {
  value?: HplSelection;
  onChange: (next: HplSelection) => void;
  title: string;
}

export const HplPicker: React.FC<Props> = ({ value, onChange, title }) => {
  const selected = getHplSwatch(value);
  const surface: HplSurface = value?.surface || 'doff';
  const [group, setGroup] = useState<HplGroup>(selected.group);

  return (
    <div className="p-2.5 bg-black/40 rounded-lg border border-white/10 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-neutral-200">{title}</span>
        <span className="text-[10px] font-mono text-neutral-400">{selected.name}</span>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {HPL_GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`py-1 rounded text-[10px] font-medium transition cursor-pointer ${
              group === g ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-white/5 text-neutral-400 hover:text-white'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {HPL_CATALOG.filter((s) => s.group === group).map((sw) => {
          const isSel = sw.id === selected.id;
          return (
            <button
              key={sw.id}
              onClick={() => onChange({ swatchId: sw.id, surface })}
              title={sw.name}
              className={`relative aspect-square rounded-md border bg-cover bg-center transition cursor-pointer ${
                isSel ? 'border-white ring-2 ring-amber-400/70' : 'border-white/15 hover:border-white/50'
              }`}
              style={{ backgroundImage: `url(${getHplPreviewUrl(sw)})`, backgroundColor: sw.base }}
            >
              {isSel && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
        <span className="text-[10px] text-neutral-400">Permukaan:</span>
        <div className="flex gap-1">
          {(Object.keys(HPL_SURFACE_LABELS) as HplSurface[]).map((sf) => (
            <button
              key={sf}
              onClick={() => onChange({ swatchId: selected.id, surface: sf })}
              className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                surface === sf ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              {HPL_SURFACE_LABELS[sf].name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
