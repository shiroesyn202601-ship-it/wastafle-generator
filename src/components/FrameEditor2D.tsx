import React, { useMemo, useRef, useState } from 'react';
import { KitchenConfig, FrameMember, FrameAxis, FrameMemberRole } from '../types/kitchen';
import {
  getFrameDims,
  getFrameMembers,
  memberBox,
  memberSectionCm,
  getApplianceBoxes,
  getFrameWarnings,
  getSnapTargets,
  findSnap,
  boxesTouch,
  newMemberId,
  FRAME_ROLE_LABELS,
  AXIS_LABELS,
  AXIS_INDEX,
  Box3,
  FrameView,
  VIEW_LABELS,
  VIEW_DEFS,
} from '../utils/frameLayout';
import {
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Undo2,
  AlertTriangle,
  FlipHorizontal,
  Maximize2,
  MousePointer2,
  Ruler,
  Magnet,
  Link2,
} from 'lucide-react';

type View = FrameView;

const ROLE_COLORS: Record<FrameMemberRole, string> = {
  post: '#cbd5e1',
  'rail-x': '#60a5fa',
  'rail-z': '#a78bfa',
  'sink-cradle': '#38bdf8',
  'stove-cradle': '#fb923c',
  custom: '#34d399',
};

interface Props {
  config: KitchenConfig;
  onChange: (updated: Partial<KitchenConfig>) => void;
}

interface DragState {
  mode: 'move' | 'start' | 'end';
  id: string;
  start: { h: number; v: number };
  orig: FrameMember;
  moved: boolean;
  wasSelected: boolean;
  candidates: string[];
}

interface Guide {
  axis: FrameAxis;
  value: number;
}

const r1 = (v: number) => Math.round(v * 10) / 10;

export const FrameEditor2D: React.FC<Props> = ({ config, onChange }) => {
  const { W, D, H, topT, plinthH, carcaseD, frameH, postBottom, tube } = getFrameDims(config);
  const baseMembers = useMemo(() => getFrameMembers(config), [config]);
  const [draft, setDraft] = useState<FrameMember[] | null>(null);
  const members = draft ?? baseMembers;

  const [view, setView] = useState<View>('front');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snap, setSnap] = useState(1);
  const [magnet, setMagnet] = useState(true);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [history, setHistory] = useState<FrameMember[][]>([]);
  // Tinggi as palang baru yang disambung dari tiang terpilih (ikut titik klik di tiang)
  const [connectY, setConnectY] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const isCustom = !!config.frame?.customLayout;
  const selected = members.find((m) => m.id === selectedId) || null;
  const warnings = useMemo(() => getFrameWarnings(config, members), [config, members]);
  const warnIds = new Set(warnings.map((w) => w.memberId));
  const appliances = getApplianceBoxes(config);
  const def = VIEW_DEFS[view];

  // ---------- Simpan perubahan ----------
  const commit = (next: FrameMember[]) => {
    setHistory((h) => [...h.slice(-49), baseMembers]);
    onChange({ frame: { ...config.frame, members: next, customLayout: true } });
  };

  const updateMember = (id: string, updates: Partial<FrameMember>) => {
    commit(baseMembers.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const deleteMember = (id: string) => {
    commit(baseMembers.filter((m) => m.id !== id));
    setSelectedId(null);
  };

  const addMember = (m: Omit<FrameMember, 'id'>) => {
    const id = newMemberId();
    commit([...baseMembers, { ...m, id }]);
    setSelectedId(id);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    onChange({ frame: { ...config.frame, members: prev, customLayout: true } });
  };

  const handleResetAuto = () => {
    if (!window.confirm('Buang semua perubahan manual dan buat ulang rangka otomatis dari ukuran meja & modul?')) return;
    setHistory((h) => [...h.slice(-49), baseMembers]);
    onChange({ frame: { ...config.frame, customLayout: false, members: undefined } });
    setSelectedId(null);
  };

  // ---------- Proyeksi 3D -> 2D ----------
  const axisSpan = (a: FrameAxis) => (a === 'x' ? W : a === 'y' ? H : D);
  const mapAxis = (a: FrameAxis, flip: boolean, val: number) => (flip ? axisSpan(a) - val : val);

  const projBox = (v: View, b: Box3) => {
    const d = VIEW_DEFS[v];
    const hi = AXIS_INDEX[d.h];
    const vi = AXIS_INDEX[d.v];
    const di = AXIS_INDEX[d.d];
    const ha = mapAxis(d.h, d.hFlip, b.min[hi]);
    const hb = mapAxis(d.h, d.hFlip, b.max[hi]);
    const va = mapAxis(d.v, d.vFlip, b.min[vi]);
    const vb = mapAxis(d.v, d.vFlip, b.max[vi]);
    const dc = (b.min[di] + b.max[di]) / 2;
    return {
      h0: Math.min(ha, hb),
      h1: Math.max(ha, hb),
      v0: Math.min(va, vb),
      v1: Math.max(va, vb),
      depth: d.dFlip ? axisSpan(d.d) - dc : dc,
    };
  };

  const projected = (v: View) => members.map((m) => ({ m, p: projBox(v, memberBox(m, memberSectionCm(m, config))) }));

  const spans = (v: View) => ({ hs: axisSpan(VIEW_DEFS[v].h), vs: axisSpan(VIEW_DEFS[v].v) });
  const { hs: mainH, vs: mainV } = spans(view);

  // Ukuran huruf & padding dalam satuan cm agar proporsional di semua ukuran meja
  const fsFor = (v: View) => {
    const s = spans(v);
    return Math.max(2.6, Math.max(s.hs + 50, s.vs + 50) / 80);
  };
  const fs = fsFor(view);
  const pad = { l: fs * 7, r: fs * 7, t: fs * 5.5, b: fs * 7 };
  const magnetThreshold = fs * 0.7;

  // ---------- Interaksi pointer ----------
  const toCm = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const r = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { h: r.x, v: mainV - r.y };
  };

  const snapV = (v: number) => r1(Math.round(v / snap) * snap);

  /** Geser batang di bidang tampak; dengan magnet, sisi/as batang menempel ke batang lain terdekat */
  const applyMove = (orig: FrameMember, dh: number, dv: number, useMagnet: boolean): { m: FrameMember; g: Guide[] } => {
    const n = { ...orig };
    const g: Guide[] = [];
    const box = memberBox(orig, memberSectionCm(orig, config));
    const targets = useMagnet ? getSnapTargets(config, baseMembers, orig.id) : null;
    (
      [
        [def.h, def.hFlip ? -dh : dh],
        [def.v, def.vFlip ? -dv : dv],
      ] as [FrameAxis, number][]
    ).forEach(([axis, delta]) => {
      const ai = AXIS_INDEX[axis];
      const s = targets
        ? findSnap([box.min[ai] + delta, (box.min[ai] + box.max[ai]) / 2 + delta, box.max[ai] + delta], targets[ai], magnetThreshold)
        : null;
      if (s) {
        n[axis] = r1(orig[axis] + delta + s.delta);
        g.push({ axis, value: s.target });
      } else {
        n[axis] = snapV(orig[axis] + delta);
      }
    });
    return { m: n, g };
  };

  const axisCoord = (axis: FrameAxis, h: number, v: number) =>
    axis === def.h ? mapAxis(axis, def.hFlip, h) : mapAxis(axis, def.vFlip, v);

  /** Tarik ujung batang; dengan magnet, ujung menempel ke sisi/as batang lain (mis. muka tiang) */
  const applyResize = (orig: FrameMember, end: 'start' | 'end', h: number, v: number): { m: FrameMember; g: Guide[] } => {
    const raw = axisCoord(orig.axis, h, v);
    const ai = AXIS_INDEX[orig.axis];
    const s = magnet ? findSnap([raw], getSnapTargets(config, baseMembers, orig.id)[ai], magnetThreshold) : null;
    const c = s ? r1(s.target) : snapV(raw);
    const g: Guide[] = s ? [{ axis: orig.axis, value: s.target }] : [];
    const s0 = orig[orig.axis];
    const e0 = s0 + orig.length;
    if (end === 'start') {
      const ns = Math.min(c, e0 - 2);
      return { m: { ...orig, [orig.axis]: ns, length: r1(e0 - ns) }, g };
    }
    const ne = Math.max(c, s0 + 2);
    return { m: { ...orig, length: r1(ne - s0) }, g };
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const pt = toCm(e);
    const tol = e.pointerType === 'touch' ? fs * 1.2 : fs * 0.5;
    const candidates = projected(view)
      .filter(({ p }) => pt.h >= p.h0 - tol && pt.h <= p.h1 + tol && pt.v >= p.v0 - tol && pt.v <= p.v1 + tol)
      .sort((a, b) => a.p.depth - b.p.depth)
      .map(({ m }) => m.id);

    if (candidates.length === 0) {
      setSelectedId(null);
      return;
    }
    const wasSelected = !!selectedId && candidates.includes(selectedId);
    const id = wasSelected ? selectedId! : candidates[0];
    setSelectedId(id);
    const orig = baseMembers.find((m) => m.id === id)!;
    if (orig.axis === 'y' && def.v === 'y') setConnectY(snapV(Math.min(Math.max(pt.v, orig.y), orig.y + orig.length)));
    dragRef.current = { mode: 'move', id, start: pt, orig, moved: false, wasSelected, candidates };
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onHandleDown = (e: React.PointerEvent, end: 'start' | 'end') => {
    if (!selected) return;
    e.stopPropagation();
    const orig = baseMembers.find((m) => m.id === selected.id)!;
    dragRef.current = { mode: end, id: selected.id, start: toCm(e), orig, moved: false, wasSelected: true, candidates: [] };
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const pt = toCm(e);
    const dh = pt.h - drag.start.h;
    const dv = pt.v - drag.start.v;
    if (!drag.moved && Math.abs(dh) < 0.4 && Math.abs(dv) < 0.4) return;
    drag.moved = true;
    const res = drag.mode === 'move' ? applyMove(drag.orig, dh, dv, magnet) : applyResize(drag.orig, drag.mode, pt.h, pt.v);
    setGuides(res.g);
    setDraft(baseMembers.map((m) => (m.id === drag.id ? res.m : m)));
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    setGuides([]);
    if (!drag) return;
    if (drag.moved && draft) {
      commit(draft);
    } else if (drag.mode === 'move' && drag.wasSelected && drag.candidates.length > 1) {
      // Klik ulang pada batang yang bertumpuk: pilih batang berikutnya di belakangnya
      const idx = drag.candidates.indexOf(drag.id);
      setSelectedId(drag.candidates[(idx + 1) % drag.candidates.length]);
    }
    setDraft(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      handleUndo();
      return;
    }
    if (!selected) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteMember(selected.id);
    } else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      const dh = e.key === 'ArrowLeft' ? -snap : e.key === 'ArrowRight' ? snap : 0;
      const dv = e.key === 'ArrowUp' ? snap : e.key === 'ArrowDown' ? -snap : 0;
      updateMember(selected.id, applyMove(selected, dh, dv, false).m);
    }
  };

  // ---------- Tambah batang (posisi awal mengikuti tampak aktif) ----------
  const zF = r1(carcaseD - tube / 2);
  const zB = r1(tube / 2);
  const topY = r1(frameH - tube / 2);
  const midY = r1((plinthH + frameH) / 2);
  const xSide = view === 'left' ? r1(tube / 2) : view === 'right' ? r1(W - tube / 2) : r1(W / 2);
  const zSide = view === 'front' ? zF : view === 'back' ? zB : r1(carcaseD / 2);

  const addPost = () =>
    addMember({ axis: 'y', role: 'post', label: 'Tiang Tambahan', x: xSide, y: r1(postBottom), z: zSide, length: r1(frameH - postBottom) });
  const addRailX = () =>
    addMember({ axis: 'x', role: 'custom', label: 'Palang Memanjang Tambahan', x: r1(W / 2 - 30), y: view === 'top' ? topY : midY, z: zSide, length: 60 });
  const addRailZ = () =>
    addMember({ axis: 'z', role: 'custom', label: 'Palang Kedalaman Tambahan', x: xSide, y: view === 'top' ? topY : midY, z: r1(tube), length: r1(carcaseD - 2 * tube) });

  /**
   * Tarik garis dari as tiang terpilih pada tinggi `y` ke arah `axis`/`dir`,
   * kembalikan batang pertama yang ditabrak (bukan batang sejajar) beserta muka & celahnya.
   */
  const connectTarget = (axis: 'x' | 'z', dir: -1 | 1, y: number) => {
    if (!selected || selected.axis !== 'y') return null;
    const i = AXIS_INDEX[axis];
    const other = axis === 'x' ? 2 : 0;
    const sb = memberBox(selected, memberSectionCm(selected, config));
    const ray = selected[axis === 'x' ? 'z' : 'x'];
    let best: { m: FrameMember; start: number; length: number } | null = null;
    members.forEach((m) => {
      if (m.id === selected.id || m.axis === axis) return;
      const b = memberBox(m, memberSectionCm(m, config));
      if (ray < b.min[other] - 0.05 || ray > b.max[other] + 0.05) return;
      if (y < b.min[1] - 0.05 || y > b.max[1] + 0.05) return;
      const gap = dir < 0 ? sb.min[i] - b.max[i] : b.min[i] - sb.max[i];
      if (gap < 1) return;
      if (!best || gap < best.length) best = { m, start: dir < 0 ? b.max[i] : sb.max[i], length: gap };
    });
    return best as { m: FrameMember; start: number; length: number } | null;
  };

  const connectFromSelected = (axis: 'x' | 'z', dir: -1 | 1, y: number) => {
    const t = connectTarget(axis, dir, y);
    if (!selected || !t) return;
    addMember({
      axis,
      role: 'custom',
      label: axis === 'z' ? 'Palang Kedalaman Tambahan' : 'Palang Memanjang Tambahan',
      x: axis === 'x' ? r1(t.start) : selected.x,
      y: r1(y),
      z: axis === 'z' ? r1(t.start) : selected.z,
      length: r1(t.length),
    });
  };

  const duplicateSelected = (mirror?: 'x' | 'z') => {
    if (!selected) return;
    const copy: Omit<FrameMember, 'id'> = { ...selected, label: `${selected.label || FRAME_ROLE_LABELS[selected.role]} (salinan)` };
    if (mirror === 'x') copy.x = r1(selected.axis === 'x' ? W - selected.x - selected.length : W - selected.x);
    else if (mirror === 'z') copy.z = r1(selected.axis === 'z' ? carcaseD - selected.z - selected.length : carcaseD - selected.z);
    else copy[def.h] = r1(selected[def.h] + (def.h === 'x' ? 10 : 5));
    addMember(copy);
  };

  const fitSelected = () => {
    if (!selected) return;
    if (selected.axis === 'y') updateMember(selected.id, { y: r1(postBottom), length: r1(frameH - postBottom) });
    else if (selected.axis === 'x') updateMember(selected.id, { x: r1(tube), length: r1(W - 2 * tube) });
    else updateMember(selected.id, { z: r1(tube), length: r1(carcaseD - 2 * tube) });
  };

  // ---------- Garis ukur ----------
  const dimH = (h0: number, h1: number, v: number, label: string, color: string, key: string, textAbove = true) => {
    const sy = mainV - v;
    const tick = fs * 0.6;
    return (
      <g key={key} stroke={color} fill={color}>
        <line x1={h0} y1={sy} x2={h1} y2={sy} strokeWidth={fs * 0.08} />
        <line x1={h0} y1={sy - tick} x2={h0} y2={sy + tick} strokeWidth={fs * 0.08} />
        <line x1={h1} y1={sy - tick} x2={h1} y2={sy + tick} strokeWidth={fs * 0.08} />
        {Math.abs(h1 - h0) > fs * 1.6 && (
          <text x={(h0 + h1) / 2} y={textAbove ? sy - fs * 0.4 : sy + fs * 1.1} fontSize={fs * 0.85} textAnchor="middle" stroke="none">
            {label}
          </text>
        )}
      </g>
    );
  };

  const dimV = (h: number, v0: number, v1: number, label: string, color: string, key: string, textLeft = true) => {
    const tick = fs * 0.6;
    const s0 = mainV - v0;
    const s1 = mainV - v1;
    const tx = textLeft ? h - fs * 0.45 : h + fs * 1.1;
    const ty = (s0 + s1) / 2;
    return (
      <g key={key} stroke={color} fill={color}>
        <line x1={h} y1={s0} x2={h} y2={s1} strokeWidth={fs * 0.08} />
        <line x1={h - tick} y1={s0} x2={h + tick} y2={s0} strokeWidth={fs * 0.08} />
        <line x1={h - tick} y1={s1} x2={h + tick} y2={s1} strokeWidth={fs * 0.08} />
        {Math.abs(v1 - v0) > fs * 1.6 && (
          <text x={tx} y={ty} fontSize={fs * 0.85} textAnchor="middle" stroke="none" transform={`rotate(-90 ${tx} ${ty})`}>
            {label}
          </text>
        )}
      </g>
    );
  };

  const uniqueSorted = (vals: number[]) => {
    const out: number[] = [];
    [...vals].sort((a, b) => a - b).forEach((v) => {
      if (out.length === 0 || Math.abs(v - out[out.length - 1]) > 0.6) out.push(v);
    });
    return out;
  };

  // ---------- Gambar satu tampak ----------
  const renderScene = (v: View, interactive: boolean, fsz: number) => {
    const d = VIEW_DEFS[v];
    const { hs, vs } = spans(v);
    const items = projected(v).sort((a, b) => b.p.depth - a.p.depth);
    const sw = fsz * 0.12;
    const depthSpan = axisSpan(d.d);
    const rectOf = (b: Box3) => {
      const p = projBox(v, b);
      return { x: p.h0, y: vs - p.v1, w: p.h1 - p.h0, h: p.v1 - p.v0 };
    };
    const top = rectOf({ min: [0, H - topT, 0], max: [W, H, D] });
    const carc = rectOf({ min: [0, plinthH, 0], max: [W, H - topT, carcaseD] });
    const isElevation = d.v === 'y';

    return (
      <g>
        {isElevation && <line x1={-fsz * 6} y1={vs} x2={hs + fsz * 6} y2={vs} stroke="#475569" strokeWidth={sw * 1.5} />}
        <rect x={top.x} y={top.y} width={top.w} height={top.h} fill="#475569" fillOpacity={isElevation ? 0.35 : 0.12} stroke="#64748b" strokeWidth={sw} />
        <rect
          x={carc.x}
          y={carc.y}
          width={carc.w}
          height={Math.max(0, carc.h)}
          fill="none"
          stroke="#334155"
          strokeWidth={sw}
          strokeDasharray={`${fsz * 0.6} ${fsz * 0.4}`}
        />
        {isElevation && plinthH > 0 && (
          <line x1={0} y1={vs - plinthH} x2={hs} y2={vs - plinthH} stroke="#334155" strokeWidth={sw} strokeDasharray={`${fsz * 0.3} ${fsz * 0.3}`} />
        )}
        {/* Wastafel & kompor (acuan) */}
        {appliances.map((a) => {
          const r = rectOf(a.box);
          const col = a.kind === 'sink' ? '#38bdf8' : '#fb923c';
          return (
            <g key={a.kind}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={col} fillOpacity={0.08} stroke={col} strokeWidth={sw} strokeDasharray={`${fsz * 0.5} ${fsz * 0.3}`} />
              {interactive && (
                <text x={r.x + r.w / 2} y={isElevation ? r.y + r.h + fsz * 1.1 : r.y + r.h / 2} fontSize={fsz * 0.75} fill={col} textAnchor="middle">
                  {a.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Batang rangka */}
        {items.map(({ m, p }) => {
          const isSel = m.id === selectedId;
          const isWarn = warnIds.has(m.id);
          const color = ROLE_COLORS[m.role];
          const opacity = isSel ? 1 : 1 - 0.55 * Math.min(1, Math.max(0, p.depth / depthSpan));
          const x = p.h0;
          const y = vs - p.v1;
          const w = p.h1 - p.h0;
          const h = p.v1 - p.v0;
          return (
            <g key={m.id} opacity={opacity} style={interactive ? { cursor: 'move' } : undefined}>
              <title>{`${m.label || FRAME_ROLE_LABELS[m.role]} · ${AXIS_LABELS[m.axis]} · ${m.length} cm`}</title>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={color}
                fillOpacity={isSel ? 0.9 : 0.55}
                stroke={isSel ? '#fbbf24' : isWarn ? '#f43f5e' : '#0f172a'}
                strokeWidth={isSel ? sw * 2.2 : isWarn ? sw * 1.8 : sw}
                strokeDasharray={isWarn && !isSel ? `${fsz * 0.4} ${fsz * 0.25}` : undefined}
              />
              {m.axis === d.d && (
                <g stroke="#0f172a" strokeWidth={sw}>
                  <line x1={x} y1={y} x2={x + w} y2={y + h} />
                  <line x1={x + w} y1={y} x2={x} y2={y + h} />
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // ---------- Ukuran, label sisi, garis bantu & handle untuk tampak utama ----------
  const renderOverlay = () => {
    const items = projected(view);
    const els: React.ReactNode[] = [];
    const axisName = (a: FrameAxis) => (a === 'x' ? 'Panjang' : a === 'y' ? 'Tinggi' : 'Kedalaman');

    els.push(dimH(0, mainH, mainV + fs * 2.6, `${axisName(def.h)} ${mainH} cm`, '#60a5fa', 'tot-h'));
    els.push(dimV(mainH + fs * 3.4, 0, mainV, `${axisName(def.v)} ${mainV} cm`, '#60a5fa', 'tot-v', false));

    // Rantai ukur as batang yang memotong arah horizontal (bawah) & vertikal (kiri)
    const hPos = uniqueSorted([0, mainH, ...items.filter(({ m }) => m.axis !== def.h).map(({ p }) => (p.h0 + p.h1) / 2)]);
    for (let i = 0; i < hPos.length - 1; i++) {
      els.push(dimH(hPos[i], hPos[i + 1], -fs * 2.4, `${r1(hPos[i + 1] - hPos[i])}`, '#94a3b8', `ch-${i}`, false));
    }
    const vPos = uniqueSorted([0, mainV, ...items.filter(({ m }) => m.axis !== def.v).map(({ p }) => (p.v0 + p.v1) / 2)]);
    for (let i = 0; i < vPos.length - 1; i++) {
      els.push(dimV(-fs * 3, vPos[i], vPos[i + 1], `${r1(vPos[i + 1] - vPos[i])}`, '#94a3b8', `cv-${i}`));
    }

    // Ukuran batang terpilih
    if (selected) {
      const p = projBox(view, memberBox(selected, memberSectionCm(selected, config)));
      const amber = '#fbbf24';
      const ch = r1((p.h0 + p.h1) / 2);
      const cv = r1((p.v0 + p.v1) / 2);
      if (selected.axis === def.v) {
        els.push(dimV(p.h1 + fs * 1.2, p.v0, p.v1, `${selected.length} cm`, amber, 'sel-len', false));
        if (p.v0 > 0.5) els.push(dimV(p.h1 + fs * 1.2, 0, p.v0, `${r1(p.v0)}`, amber, 'sel-off', false));
        els.push(dimH(0, ch, cv, `as ${ch}`, amber, 'sel-u'));
      } else if (selected.axis === def.h) {
        els.push(dimH(p.h0, p.h1, p.v1 + fs * 1.2, `${selected.length} cm`, amber, 'sel-len'));
        if (p.h0 > 0.5) els.push(dimH(0, p.h0, p.v1 + fs * 1.2, `${r1(p.h0)}`, amber, 'sel-off'));
        els.push(dimV(p.h0 + fs * 0.6, 0, cv, `as ${cv}`, amber, 'sel-y', false));
      } else {
        els.push(dimH(0, ch, cv, `as ${ch}`, amber, 'sel-u'));
        els.push(dimV(ch, 0, cv, `as ${cv}`, amber, 'sel-y', false));
      }
    }

    // Label sisi
    els.push(
      <text key="sl" x={0} y={-fs * 3.9} fontSize={fs * 0.8} fill="#64748b">
        ◂ {def.sideL}
      </text>,
      <text key="sr" x={mainH} y={-fs * 3.9} fontSize={fs * 0.8} fill="#64748b" textAnchor="end">
        {def.sideR} ▸
      </text>
    );
    if (def.sideT) {
      els.push(
        <text key="st" x={mainH / 2} y={-fs * 3.9} fontSize={fs * 0.8} fill="#64748b" textAnchor="middle">
          ▴ {def.sideT}
        </text>
      );
    }
    if (def.sideB) {
      els.push(
        <text key="sb" x={mainH / 2} y={mainV + fs * 5.6} fontSize={fs * 0.8} fill="#64748b" textAnchor="middle">
          ▾ {def.sideB}
        </text>
      );
    }

    // Garis bantu magnet
    guides.forEach((g, i) => {
      if (g.axis === def.h) {
        const x = mapAxis(def.h, def.hFlip, g.value);
        els.push(
          <line key={`g-${i}`} x1={x} y1={-fs * 2} x2={x} y2={mainV + fs * 2} stroke="#34d399" strokeWidth={fs * 0.1} strokeDasharray={`${fs * 0.5} ${fs * 0.3}`} />
        );
      } else if (g.axis === def.v) {
        const y = mainV - mapAxis(def.v, def.vFlip, g.value);
        els.push(
          <line key={`g-${i}`} x1={-fs * 2} y1={y} x2={mainH + fs * 2} y2={y} stroke="#34d399" strokeWidth={fs * 0.1} strokeDasharray={`${fs * 0.5} ${fs * 0.3}`} />
        );
      }
    });

    // Handle ubah panjang (batang yang sejajar bidang gambar)
    if (selected && selected.axis !== def.d) {
      const s3 = { x: selected.x, y: selected.y, z: selected.z };
      const e3 = { ...s3, [selected.axis]: s3[selected.axis] + selected.length };
      const hsz = fs * 1.3;
      [
        { pt: s3, end: 'start' as const },
        { pt: e3, end: 'end' as const },
      ].forEach(({ pt, end }) => {
        const hx = mapAxis(def.h, def.hFlip, pt[def.h]);
        const vy = mainV - mapAxis(def.v, def.vFlip, pt[def.v]);
        els.push(
          <rect
            key={`h-${end}`}
            x={hx - hsz / 2}
            y={vy - hsz / 2}
            width={hsz}
            height={hsz}
            rx={hsz * 0.2}
            fill="#fbbf24"
            stroke="#0f172a"
            strokeWidth={fs * 0.1}
            style={{ cursor: selected.axis === def.v ? 'ns-resize' : 'ew-resize' }}
            onPointerDown={(e) => onHandleDown(e, end)}
          />
        );
      });
    }
    return els;
  };

  const viewBox = `${-pad.l} ${-pad.t} ${mainH + pad.l + pad.r} ${mainV + pad.t + pad.b}`;

  const NumField = ({ label, value, onCommit, hint }: { label: string; value: number; onCommit: (v: number) => void; hint?: string }) => (
    <label className="block space-y-0.5">
      <span className="flex justify-between text-[10px] text-neutral-400">
        <span>{label}</span>
        {hint && <span className="text-neutral-500">{hint}</span>}
      </span>
      <input
        key={`${label}-${value}`}
        type="number"
        inputMode="decimal"
        step={0.5}
        defaultValue={value}
        onBlur={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v) && v !== value) onCommit(r1(v));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-md text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500"
      />
    </label>
  );

  // ---------- Posisi batang terpilih: jarak sisi pipa ke batas rangka & ke batang tetangga ----------
  const AXIS_POS: Record<FrameAxis, { title: string; span: number; minL: string; maxL: string; below: string; above: string }> = {
    y: { title: 'Vertikal (tinggi)', span: frameH, minL: 'Sisi bawah ke lantai', maxL: 'Sisi atas ke bawah top', below: 'di bawah', above: 'di atas' },
    z: { title: 'Kedalaman', span: carcaseD, minL: 'Ke belakang (dinding)', maxL: 'Ke depan', below: 'di belakang', above: 'di depan' },
    x: { title: 'Memanjang', span: W, minL: 'Ke sisi kiri', maxL: 'Ke sisi kanan', below: 'di kiri', above: 'di kanan' },
  };

  /** Geser batang terpilih di satu sumbu sejauh `shift` cm */
  const shiftSelected = (axis: FrameAxis, shift: number) => {
    if (!selected || Math.abs(shift) < 0.05) return;
    updateMember(selected.id, { [axis]: r1(selected[axis] + shift) });
  };

  /** Batang terdekat searah sumbu (dir -1 = sisi min, +1 = sisi max) yang bertumpang-tindih di dua sumbu lainnya */
  const neighborAlong = (axis: FrameAxis, dir: -1 | 1) => {
    if (!selected) return null;
    const i = AXIS_INDEX[axis];
    const sb = memberBox(selected, memberSectionCm(selected, config));
    let best: { m: FrameMember; gap: number; face: number } | null = null;
    members.forEach((m) => {
      if (m.id === selected.id) return;
      const b = memberBox(m, memberSectionCm(m, config));
      const overlaps = [0, 1, 2].every((k) => k === i || (b.max[k] > sb.min[k] + 0.05 && b.min[k] < sb.max[k] - 0.05));
      if (!overlaps) return;
      const gap = dir < 0 ? sb.min[i] - b.max[i] : b.min[i] - sb.max[i];
      if (gap < -0.05) return;
      if (!best || gap < best.gap) best = { m, gap: r1(gap), face: dir < 0 ? b.max[i] : b.min[i] };
    });
    return best as { m: FrameMember; gap: number; face: number } | null;
  };

  const totalLength = members.reduce((s, m) => s + m.length, 0);
  const connectedCount = selected
    ? (() => {
        const sb = memberBox(selected, memberSectionCm(selected, config));
        return members.filter((m) => m.id !== selected.id && boxesTouch(sb, memberBox(m, memberSectionCm(m, config)))).length;
      })()
    : 0;

  const btn = 'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer shrink-0';

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 text-neutral-100 outline-none" tabIndex={0} onKeyDown={onKeyDown}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-white/[0.08] bg-[#0f1218]">
        <div className="flex items-center p-1 bg-black/40 rounded-lg border border-white/5 overflow-x-auto max-w-full">
          {(Object.keys(VIEW_LABELS) as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer shrink-0 ${
                view === v ? 'bg-white/15 text-white ring-1 ring-white/10' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Tampak </span>
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
          <button onClick={addPost} className={`${btn} bg-emerald-600 hover:bg-emerald-500 text-white`}>
            <Plus className="w-3.5 h-3.5" /> Tiang
          </button>
          <button onClick={addRailX} className={`${btn} bg-emerald-600/80 hover:bg-emerald-500 text-white`}>
            <Plus className="w-3.5 h-3.5" /> Palang X
          </button>
          <button onClick={addRailZ} className={`${btn} bg-emerald-600/60 hover:bg-emerald-500 text-white`}>
            <Plus className="w-3.5 h-3.5" /> Palang Z
          </button>
          <button
            onClick={() => setMagnet(!magnet)}
            className={`${btn} border ${magnet ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-neutral-400'}`}
            title="Magnet: batang otomatis menempel ke sisi / as batang lain saat digeser atau ditarik"
          >
            <Magnet className="w-3.5 h-3.5" /> Magnet {magnet ? 'ON' : 'OFF'}
          </button>
          <label className="flex items-center gap-1 text-[11px] text-neutral-400 shrink-0">
            Grid
            <select value={snap} onChange={(e) => setSnap(parseFloat(e.target.value))} className="px-1.5 py-1 bg-black/40 border border-white/10 rounded text-xs text-neutral-200 cursor-pointer">
              {[0.5, 1, 2, 5, 10].map((s) => (
                <option key={s} value={s}>
                  {s} cm
                </option>
              ))}
            </select>
          </label>
          <button onClick={handleUndo} disabled={history.length === 0} className={`${btn} text-neutral-300 hover:text-white hover:bg-white/5 disabled:opacity-30`} title="Undo (Ctrl+Z)">
            <Undo2 className="w-3.5 h-3.5" /> Undo
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
              isCustom ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {isCustom ? 'MANUAL' : 'OTOMATIS'}
          </span>
          {isCustom && (
            <button onClick={handleResetAuto} className={`${btn} text-rose-300 hover:bg-rose-500/10`}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Kanvas */}
        <div className="lg:flex-1 flex flex-col lg:overflow-hidden p-2 sm:p-3 gap-2 sm:gap-3">
          <div className="relative h-[52vh] lg:h-auto lg:flex-1 min-h-0 bg-[#0b0e14] rounded-xl border border-white/[0.08] overflow-hidden">
            <svg
              ref={svgRef}
              viewBox={viewBox}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full select-none touch-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              fontFamily="ui-monospace, monospace"
            >
              {renderScene(view, true, fs)}
              {renderOverlay()}
            </svg>
            <div className="absolute top-2 left-3 right-3 text-[10px] sm:text-[11px] text-neutral-500 pointer-events-none flex items-center gap-1.5">
              <MousePointer2 className="w-3 h-3 shrink-0" />
              <span className="truncate">
                Ketuk pilih · ketuk lagi untuk batang di belakangnya · seret untuk geser · kotak kuning untuk ubah panjang
              </span>
            </div>
            {!isCustom && (
              <div className="absolute bottom-2 left-3 right-3 text-[10px] sm:text-[11px] text-emerald-300/80 pointer-events-none">
                Rangka masih otomatis. Edit pertama mengubahnya ke mode manual (tidak lagi ikut perubahan modul/ukuran).
              </div>
            )}
          </div>

          {/* Tampak lain (ikut berubah) */}
          <div className="grid grid-cols-4 gap-2 h-20 sm:h-28 shrink-0">
            {(Object.keys(VIEW_LABELS) as View[])
              .filter((v) => v !== view)
              .map((v) => {
                const s = spans(v);
                const f = fsFor(v);
                return (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className="relative bg-[#0b0e14] rounded-xl border border-white/[0.08] hover:border-amber-500/50 overflow-hidden cursor-pointer"
                  >
                    <span className="absolute top-1 left-1.5 text-[9px] sm:text-[10px] font-semibold text-neutral-400">{VIEW_LABELS[v]}</span>
                    <svg viewBox={`${-f * 2} ${-f * 3} ${s.hs + f * 4} ${s.vs + f * 5}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full pointer-events-none">
                      {renderScene(v, false, f)}
                    </svg>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Panel properti */}
        <aside className="w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.08] bg-[#0e1117] lg:overflow-y-auto p-3 space-y-3">
          {selected ? (
            <div className="p-3 bg-[#12151c] border border-amber-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">Batang Terpilih</span>
                <span className="text-[10px] font-mono text-neutral-400">{AXIS_LABELS[selected.axis]}</span>
              </div>
              <div
                className={`flex items-center gap-1.5 text-[11px] ${connectedCount > 0 ? 'text-emerald-300' : 'text-rose-300'}`}
              >
                <Link2 className="w-3.5 h-3.5" />
                {connectedCount > 0 ? `Tersambung ke ${connectedCount} batang` : 'Belum tersambung ke rangka'}
              </div>
              <input
                key={`label-${selected.id}`}
                defaultValue={selected.label || ''}
                placeholder={FRAME_ROLE_LABELS[selected.role]}
                onBlur={(e) => e.target.value !== (selected.label || '') && updateMember(selected.id, { label: e.target.value })}
                className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-md text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
              <select
                value={selected.role}
                onChange={(e) => updateMember(selected.id, { role: e.target.value as FrameMemberRole })}
                className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded-md text-xs text-neutral-200 cursor-pointer"
              >
                {(Object.keys(FRAME_ROLE_LABELS) as FrameMemberRole[]).map((r) => (
                  <option key={r} value={r}>
                    {FRAME_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>

              {selected.axis === 'y' &&
                (() => {
                  const cy = r1(Math.min(Math.max(connectY ?? midY, selected.y), selected.y + selected.length));
                  const dirs: { axis: 'x' | 'z'; dir: -1 | 1; label: string }[] = [
                    { axis: 'z', dir: -1, label: 'Ke Belakang' },
                    { axis: 'z', dir: 1, label: 'Ke Depan' },
                    { axis: 'x', dir: -1, label: 'Ke Kiri' },
                    { axis: 'x', dir: 1, label: 'Ke Kanan' },
                  ];
                  return (
                    <div className="p-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/25 space-y-1.5">
                      <div className="text-[10px] font-semibold text-emerald-300">Sambung Palang dari Tiang Ini</div>
                      <NumField label="Tinggi as palang dari lantai (cm)" value={cy} onCommit={(v) => setConnectY(v)} />
                      <div className="grid grid-cols-2 gap-1.5">
                        {dirs.map(({ axis, dir, label }) => {
                          const t = connectTarget(axis, dir, cy);
                          return (
                            <button
                              key={label}
                              disabled={!t}
                              onClick={() => connectFromSelected(axis, dir, cy)}
                              title={t ? `Palang ${r1(t.length)} cm ke ${t.m.label || FRAME_ROLE_LABELS[t.m.role]}` : 'Tidak ada batang di arah ini'}
                              className="flex flex-col items-center py-1.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-[11px] font-semibold text-emerald-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <span className="flex items-center gap-1">
                                <Plus className="w-3 h-3" /> {label}
                              </span>
                              <span className="text-[9px] font-mono font-normal text-emerald-300/70">{t ? `${r1(t.length)} cm` : '—'}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-neutral-500 leading-snug">
                        Klik tiang di ketinggian yang diinginkan (tampak depan/belakang/samping), lalu pilih arah. Palang otomatis
                        menempel ke batang terdekat di arah itu.
                      </p>
                    </div>
                  );
                })()}

              {(['y', 'z', 'x'] as FrameAxis[]).map((axis) => {
                const info = AXIS_POS[axis];
                const i = AXIS_INDEX[axis];
                const sb = memberBox(selected, memberSectionCm(selected, config));
                const toMin = r1(sb.min[i]);
                const toMax = r1(info.span - sb.max[i]);
                const nbs = axis === selected.axis ? [] : ([-1, 1] as const).map((dir) => ({ dir, nb: neighborAlong(axis, dir) }));
                return (
                  <div key={axis} className="p-2 rounded-lg bg-black/25 border border-white/[0.06] space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-300">
                      <span>{info.title}</span>
                      <span className="font-mono text-neutral-500">as {selected[axis]}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {axis === selected.axis ? (
                        <>
                          <NumField label="Panjang (cm)" value={selected.length} onCommit={(v) => updateMember(selected.id, { length: Math.max(1, v) })} />
                          <NumField label={`Awal: ${info.minL.toLowerCase()}`} value={toMin} onCommit={(v) => shiftSelected(axis, v - toMin)} />
                        </>
                      ) : (
                        <>
                          <NumField label={info.minL} value={toMin} onCommit={(v) => shiftSelected(axis, v - toMin)} />
                          <NumField label={info.maxL} value={toMax} onCommit={(v) => shiftSelected(axis, toMax - v)} />
                        </>
                      )}
                    </div>
                    {nbs.some((n) => n.nb) && (
                      <div className="grid grid-cols-2 gap-2">
                        {nbs.map(({ dir, nb }) =>
                          nb ? (
                            <NumField
                              key={dir}
                              label={`Jarak ke batang ${dir < 0 ? info.below : info.above}`}
                              hint={nb.m.label?.slice(0, 14)}
                              value={nb.gap}
                              onCommit={(v) => shiftSelected(axis, dir < 0 ? v - nb.gap : nb.gap - v)}
                            />
                          ) : (
                            <div key={dir} />
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <p className="text-[10px] text-neutral-500 leading-snug">
                Jarak diukur dari sisi luar pipa (bukan as). Kedalaman juga bisa diseret di Tampak Kiri/Kanan/Atas.
              </p>

              <label className="flex items-center justify-between gap-2 text-[11px] text-neutral-400">
                Ukuran pipa
                <select
                  value={`${selected.tubeSize || 0}x${selected.tubeH || 0}`}
                  onChange={(e) => {
                    const [w, h] = e.target.value.split('x').map((v) => parseInt(v) || undefined);
                    updateMember(selected.id, { tubeSize: w, tubeH: h });
                  }}
                  className="min-w-0 px-1.5 py-1 bg-black/40 border border-white/10 rounded text-xs text-neutral-200 cursor-pointer"
                >
                  <option value="0x0">Ikut rangka ({config.frame?.tubeSize || 40}×{config.frame?.tubeSize || 40} mm)</option>
                  <optgroup label="Kotak">
                    {[20, 30, 40, 50, 60].map((s) => (
                      <option key={s} value={`${s}x0`}>
                        {s}×{s} mm
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Persegi panjang">
                    {[
                      [20, 40],
                      [40, 20],
                      [30, 60],
                      [60, 30],
                      [40, 60],
                      [60, 40],
                    ].map(([w, h]) => (
                      <option key={`${w}x${h}`} value={`${w}x${h}`}>
                        {w}×{h} mm ·{' '}
                        {selected.axis === 'y'
                          ? h > w
                            ? `sisi ${h / 10} cm ke depan`
                            : `sisi ${w / 10} cm ke samping`
                          : h > w
                          ? `berdiri (tinggi ${h / 10} cm)`
                          : `tidur (tinggi ${h / 10} cm)`}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button onClick={() => duplicateSelected()} className="flex items-center justify-center gap-1 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-neutral-200 cursor-pointer">
                  <Copy className="w-3 h-3" /> Duplikat
                </button>
                <button onClick={fitSelected} className="flex items-center justify-center gap-1 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-neutral-200 cursor-pointer" title="Rentangkan penuh sesuai ukuran rangka">
                  <Maximize2 className="w-3 h-3" /> Rentang Penuh
                </button>
                <button onClick={() => duplicateSelected('x')} className="flex items-center justify-center gap-1 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-neutral-200 cursor-pointer" title="Salin ke posisi cermin kiri ⇄ kanan">
                  <FlipHorizontal className="w-3 h-3" /> Cermin Kiri/Kanan
                </button>
                <button onClick={() => duplicateSelected('z')} className="flex items-center justify-center gap-1 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-neutral-200 cursor-pointer" title="Salin ke posisi cermin depan ⇄ belakang">
                  <FlipHorizontal className="w-3 h-3 rotate-90" /> Cermin Dpn/Blkg
                </button>
              </div>
              <button onClick={() => deleteMember(selected.id)} className="w-full flex items-center justify-center gap-1 py-2 rounded-md bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-xs font-semibold text-rose-300 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Hapus Batang
              </button>
            </div>
          ) : (
            <div className="p-3 bg-[#12151c] border border-white/[0.08] rounded-xl text-[11px] text-neutral-400 leading-relaxed">
              Pilih batang di gambar atau di daftar bawah untuk mengatur posisi & panjangnya. Semua tampak memakai data 3D yang sama, jadi
              perubahan di satu sisi otomatis terlihat di sisi lain dan di 3D. Dengan <strong className="text-emerald-300">Magnet ON</strong>,
              batang yang digeser mendekati batang lain akan otomatis menempel (garis hijau).
            </div>
          )}

          {/* Ringkasan */}
          <div className="p-3 bg-[#12151c] border border-white/[0.08] rounded-xl space-y-1 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-neutral-300 font-sans font-semibold text-xs pb-1">
              <Ruler className="w-3.5 h-3.5 text-blue-400" /> Ringkasan Rangka
            </div>
            <div className="flex justify-between text-neutral-400"><span>Jumlah batang</span><span className="text-white">{members.length}</span></div>
            <div className="flex justify-between text-neutral-400"><span>Total panjang</span><span className="text-white">{r1(totalLength / 100)} m</span></div>
            <div className="flex justify-between text-neutral-400">
              <span>Kaki / plinth</span>
              <span className="text-white">
                {plinthH > 0 ? `${plinthH} cm (${config.legType === 'frame' ? 'rangka' : config.legType === 'feet' ? 'kaki stel' : 'plinth'})` : 'tanpa kaki'}
              </span>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5" /> {warnings.length} Peringatan
              </div>
              {warnings.map((w, i) => (
                <button key={i} onClick={() => setSelectedId(w.memberId)} className="block w-full text-left text-[10px] text-rose-200/80 hover:text-white cursor-pointer">
                  • {w.message}
                </button>
              ))}
            </div>
          )}

          {/* Daftar batang */}
          <div className="p-3 bg-[#12151c] border border-white/[0.08] rounded-xl space-y-1">
            <div className="text-xs font-semibold text-neutral-300 pb-1">Daftar Batang ({members.length})</div>
            <div className="max-h-80 overflow-y-auto space-y-0.5">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`w-full flex items-center gap-2 px-1.5 py-1.5 rounded text-left text-[10px] cursor-pointer ${
                    m.id === selectedId ? 'bg-amber-500/15 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: ROLE_COLORS[m.role] }} />
                  <span className="flex-1 truncate">{m.label || FRAME_ROLE_LABELS[m.role]}</span>
                  {warnIds.has(m.id) && <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />}
                  <span className="font-mono text-neutral-500 shrink-0">
                    {m.axis.toUpperCase()} {m.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
