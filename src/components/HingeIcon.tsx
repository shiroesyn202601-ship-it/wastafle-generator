import React from 'react';
import { HingeType } from '../types/kitchen';

/** Ilustrasi jenis engsel (SVG, tanpa file gambar luar) */
export const HingeIcon: React.FC<{ type: HingeType; className?: string }> = ({ type, className }) => {
  const metal = '#cbd5e1';
  const dark = '#475569';
  const pin = '#94a3b8';
  const hole = (cx: number, cy: number) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.2} fill="#0f172a" stroke={dark} strokeWidth={0.8} />;

  return (
    <svg viewBox="0 0 80 60" className={className} aria-hidden="true">
      {type === 'butt' && (
        <g>
          {/* Dua daun plat terbuka + knuckle di tengah */}
          <rect x={10} y={12} width={26} height={36} rx={2} fill={metal} stroke={dark} strokeWidth={1.2} />
          <rect x={44} y={12} width={26} height={36} rx={2} fill={metal} stroke={dark} strokeWidth={1.2} />
          {[hole(23, 20), hole(23, 30), hole(23, 40), hole(57, 20), hole(57, 30), hole(57, 40)]}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={35} y={10 + i * 8} width={10} height={7.4} rx={3} fill={i % 2 ? '#e2e8f0' : pin} stroke={dark} strokeWidth={1} />
          ))}
        </g>
      )}
      {type === 'barrel-weld' && (
        <g>
          {/* Dua pipa hollow + tabung engsel las di sudut */}
          <rect x={6} y={30} width={34} height={14} fill="#334155" stroke="#0f172a" strokeWidth={1} />
          <rect x={40} y={30} width={34} height={14} fill="#334155" stroke="#0f172a" strokeWidth={1} />
          <rect x={27} y={14} width={26} height={11} rx={5.5} fill={metal} stroke={dark} strokeWidth={1.2} />
          <line x1={40} y1={14} x2={40} y2={25} stroke={dark} strokeWidth={1.2} />
          <rect x={22} y={17.5} width={5} height={4} fill={pin} stroke={dark} strokeWidth={0.8} />
          <rect x={53} y={17.5} width={5} height={4} fill={pin} stroke={dark} strokeWidth={0.8} />
          {/* jalur las */}
          <path d="M29 26 q3 2 6 0 q3 2 6 0" fill="none" stroke="#f97316" strokeWidth={1.6} />
          <path d="M41 26 q3 2 6 0 q3 2 6 0" fill="none" stroke="#f97316" strokeWidth={1.6} />
        </g>
      )}
      {type === 'piano' && (
        <g>
          {/* Engsel panjang menerus */}
          <rect x={4} y={14} width={72} height={14} fill={metal} stroke={dark} strokeWidth={1.2} />
          <rect x={4} y={32} width={72} height={14} fill={metal} stroke={dark} strokeWidth={1.2} />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={4 + i * 8} y={27} width={8} height={6} rx={2.5} fill={i % 2 ? '#e2e8f0' : pin} stroke={dark} strokeWidth={0.8} />
          ))}
          {[12, 28, 44, 60].map((x) => hole(x, 21))}
          {[20, 36, 52, 68].map((x) => hole(x, 39))}
        </g>
      )}
      {type === 'folding-lock' && (
        <g>
          {/* Bracket siku 90° + lengan pengunci */}
          <rect x={10} y={8} width={12} height={44} rx={2} fill={metal} stroke={dark} strokeWidth={1.2} />
          <rect x={10} y={40} width={58} height={12} rx={2} fill={metal} stroke={dark} strokeWidth={1.2} />
          <line x1={20} y1={14} x2={58} y2={44} stroke={pin} strokeWidth={4} strokeLinecap="round" />
          <line x1={20} y1={14} x2={58} y2={44} stroke={dark} strokeWidth={1} strokeLinecap="round" />
          <circle cx={39} cy={29} r={3.5} fill="#34d399" stroke={dark} strokeWidth={1} />
          <circle cx={16} cy={46} r={4} fill={pin} stroke={dark} strokeWidth={1.2} />
          {[hole(16, 16), hole(16, 28), hole(32, 46), hole(52, 46)]}
          <text x={64} y={22} fontSize={10} fill="#34d399" textAnchor="middle" fontFamily="ui-monospace, monospace">
            90°
          </text>
        </g>
      )}
    </svg>
  );
};
