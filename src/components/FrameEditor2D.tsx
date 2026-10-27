import React, { useMemo, useRef, useState } from 'react';
import { KitchenConfig, FrameMember, FrameAxis, FrameMemberRole } from '../types/kitchen';
import {
  getFrameDims,
  getFrameMembers,
  memberBox,
  memberTubeCm,
  getApplianceBoxes,
  getFrameWarnings,
  newMemberId,
  FRAME_ROLE_LABELS,
  AXIS_LABELS,
  Box3,
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
} from 'lucide-react';

type View = 'front' | 'back' | 'left' | 'right';

const VIEW_LABELS: Record<View, string> = {
  front: 'Tampak Depan',
  back: 'Tampak Belakang',
  left: 'Tampak Kiri',
  right: 'Tampak Kanan',
};

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
  start: { u: number; y: number };
  orig: FrameMember;
  moved: boolean;
  wasSelected: boolean;
  candidates: string[];
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
  const [history, setHistory] = useState<FrameMember[][]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const isCustom = !!config.frame?.customLayout;
  const selected = members.find((m) => m.id === selectedId) || null;
  const warnings = useMemo(() => getFrameWarnings(config, members), [config, members]);
  const warnIds = new Set(warnings.map((w) => w.memberId));
  const appliances = getApplianceBoxes(config);

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
  const isFBv = (v: View) => v === 'front' || v === 'back';
  const spanOf = (v: View) => (isFBv(v) ? W : D);
  const mapU = (v: View, x: number, z: number) => (v === 'front' ? x : v === 'back' ? W - x : v === 'left' ? z : D - z);
  const projBox = (v: View, b: Box3) => {
    const a = mapU(v, b.min[0], b.min[2]);
    const c = mapU(v, b.max[0], b.max[2]);
    const cx = (b.min[0] + b.max[0]) / 2;
    const cz = (b.min[2] + b.max[2]) / 2;
    return {
      u0: Math.min(a, c),
      u1: Math.max(a, c),
      y0: b.min[1],
      y1: b.max[1],
      depth: v === 'front' ? D - cz : v === 'back' ? cz : v === 'left' ? cx : W - cx,
    };
  };
  const depthAxisOf = (v: View): FrameAxis => (isFBv(v) ? 'z' : 'x');
  const planeAxisOf = (v: View): FrameAxis => (isFBv(v) ? 'x' : 'z');

  const projected = (v: View) =>
    members.map((m) => ({ m, p: projBox(v, memberBox(m, memberTubeCm(m, config))) }));

  // Ukuran huruf & padding dalam satuan cm agar proporsional di semua ukuran meja
  const fs = Math.max(2.6, Math.max(spanOf(view) + 50, H + 50) / 80);
  const pad = { l: fs * 7, r: fs * 7, t: fs * 5, b: fs * 7 };

  // ---------- Interaksi pointer ----------
  const toCm = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const r = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { u: r.x, y: H - r.y };
  };

  const snapV = (v: number) => r1(Math.round(v / snap) * snap);

  const applyMove = (orig: FrameMember, du: number, dy: number): FrameMember => {
    const n = { ...orig };
    if (isFBv(view)) n.x = snapV(orig.x + (view === 'front' ? du : -du));
    else n.z = snapV(orig.z + (view === 'left' ? du : -du));
    n.y = snapV(orig.y + dy);
    return n;
  };

  const axisCoord = (axis: FrameAxis, u: number, y: number) =>
    axis === 'y' ? y : axis === 'x' ? (view === 'front' ? u : W - u) : view === 'left' ? u : D - u;

  const applyResize = (orig: FrameMember, end: 'start' | 'end', u: number, y: number): FrameMember => {
    const c = snapV(axisCoord(orig.axis, u, y));
    const s0 = orig[orig.axis];
    const e0 = s0 + orig.length;
    if (end === 'start') {
      const ns = Math.min(c, e0 - 2);
      return { ...orig, [orig.axis]: ns, length: r1(e0 - ns) };
    }
    const ne = Math.max(c, s0 + 2);
    return { ...orig, length: r1(ne - s0) };
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const pt = toCm(e);
    const tol = fs * 0.5;
    const candidates = projected(view)
      .filter(({ p }) => pt.u >= p.u0 - tol && pt.u <= p.u1 + tol && pt.y >= p.y0 - tol && pt.y <= p.y1 + tol)
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
    const du = pt.u - drag.start.u;
    const dy = pt.y - drag.start.y;
    if (!drag.moved && Math.abs(du) < 0.4 && Math.abs(dy) < 0.4) return;
    drag.moved = true;
    const next =
      drag.mode === 'move' ? applyMove(drag.orig, du, dy) : applyResize(drag.orig, drag.mode, pt.u, pt.y);
    setDraft(baseMembers.map((m) => (m.id === drag.id ? next : m)));
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
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
      const step = snap;
      const du = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
      const dy = e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0;
      updateMember(selected.id, applyMove(selected, du, dy));
    }
  };

  // ---------- Tambah batang ----------
  const viewDepthPos = () =>
    view === 'front' ? { z: r1(carcaseD - tube / 2) } : view === 'back' ? { z: r1(tube / 2) } : view === 'left' ? { x: r1(tube / 2) } : { x: r1(W - tube / 2) };

  const addPost = () =>
    addMember({
      axis: 'y',
      role: 'post',
      label: 'Tiang Tambahan',
      x: isFBv(view) ? r1(W / 2) : view === 'left' ? r1(tube / 2) : r1(W - tube / 2),
      z: isFBv(view) ? (viewDepthPos().z as number) : r1(carcaseD / 2),
      ...viewDepthPos(),
      y: r1(postBottom),
      length: r1(frameH - postBottom),
    });

  const addPlaneRail = () => {
    const y = r1((plinthH + frameH) / 2);
    if (isFBv(view)) {
      addMember({ axis: 'x', role: 'custom', label: 'Palang Memanjang Tambahan', x: r1(W / 2 - 30), y, z: viewDepthPos().z as number, length: 60 });
    } else {
      addMember({ axis: 'z', role: 'custom', label: 'Palang Kedalaman Tambahan', x: viewDepthPos().x as number, y, z: r1(tube), length: r1(carcaseD - 2 * tube) });
    }
  };

  const addDepthRail = () => {
    const y = r1((plinthH + frameH) / 2);
    if (isFBv(view)) {
      addMember({ axis: 'z', role: 'custom', label: 'Palang Kedalaman Tambahan', x: r1(W / 2), y, z: r1(tube), length: r1(carcaseD - 2 * tube) });
    } else {
      addMember({ axis: 'x', role: 'custom', label: 'Palang Memanjang Tambahan', x: r1(W / 2 - 30), y, z: r1(carcaseD / 2), length: 60 });
    }
  };

  const duplicateSelected = (mirror?: 'x' | 'z') => {
    if (!selected) return;
    const copy: Omit<FrameMember, 'id'> = { ...selected, label: `${selected.label || FRAME_ROLE_LABELS[selected.role]} (salinan)` };
    if (mirror === 'x') copy.x = r1(selected.axis === 'x' ? W - selected.x - selected.length : W - selected.x);
    else if (mirror === 'z') copy.z = r1(selected.axis === 'z' ? carcaseD - selected.z - selected.length : carcaseD - selected.z);
    else if (isFBv(view)) copy.x = r1(selected.x + 10);
    else copy.z = r1(selected.z + 5);
    addMember(copy);
  };

  const fitSelected = () => {
    if (!selected) return;
    if (selected.axis === 'y') updateMember(selected.id, { y: r1(postBottom), length: r1(frameH - postBottom) });
    else if (selected.axis === 'x') updateMember(selected.id, { x: r1(tube), length: r1(W - 2 * tube) });
    else updateMember(selected.id, { z: r1(tube), length: r1(carcaseD - 2 * tube) });
  };

  // ---------- Garis ukur ----------
  const dimH = (u0: number, u1: number, y: number, label: string, color: string, key: string, textAbove = true) => {
    const sy = H - y;
    const tick = fs * 0.6;
    return (
      <g key={key} stroke={color} fill={color}>
        <line x1={u0} y1={sy} x2={u1} y2={sy} strokeWidth={fs * 0.08} />
        <line x1={u0} y1={sy - tick} x2={u0} y2={sy + tick} strokeWidth={fs * 0.08} />
        <line x1={u1} y1={sy - tick} x2={u1} y2={sy + tick} strokeWidth={fs * 0.08} />
        {Math.abs(u1 - u0) > fs * 1.6 && (
          <text x={(u0 + u1) / 2} y={textAbove ? sy - fs * 0.4 : sy + fs * 1.1} fontSize={fs * 0.85} textAnchor="middle" stroke="none">
            {label}
          </text>
        )}
      </g>
    );
  };

  const dimV = (u: number, y0: number, y1: number, label: string, color: string, key: string, textLeft = true) => {
    const tick = fs * 0.6;
    const s0 = H - y0;
    const s1 = H - y1;
    const tx = textLeft ? u - fs * 0.45 : u + fs * 1.1;
    const ty = (s0 + s1) / 2;
    return (
      <g key={key} stroke={color} fill={color}>
        <line x1={u} y1={s0} x2={u} y2={s1} strokeWidth={fs * 0.08} />
        <line x1={u - tick} y1={s0} x2={u + tick} y2={s0} strokeWidth={fs * 0.08} />
        <line x1={u - tick} y1={s1} x2={u + tick} y2={s1} strokeWidth={fs * 0.08} />
        {Math.abs(y1 - y0) > fs * 1.6 && (
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
    const span = spanOf(v);
    const depthAxis = depthAxisOf(v);
    const depthSpan = isFBv(v) ? D : W;
    const items = projected(v).sort((a, b) => b.p.depth - a.p.depth);
    const sw = fsz * 0.12;
    const carcU0 = isFBv(v) ? 0 : v === 'left' ? 0 : D - carcaseD;
    const carcU1 = isFBv(v) ? W : v === 'left' ? carcaseD : D;

    return (
      <g>
        {/* Lantai */}
        <line x1={-fsz * 6} y1={H} x2={span + fsz * 6} y2={H} stroke="#475569" strokeWidth={sw * 1.5} />
        {/* Top table */}
        <rect x={0} y={0} width={span} height={topT} fill="#475569" fillOpacity={0.35} stroke="#64748b" strokeWidth={sw} />
        {/* Area kabinet */}
        <rect
          x={carcU0}
          y={topT}
          width={carcU1 - carcU0}
          height={Math.max(0, H - topT - plinthH)}
          fill="none"
          stroke="#334155"
          strokeWidth={sw}
          strokeDasharray={`${fsz * 0.6} ${fsz * 0.4}`}
        />
        {plinthH > 0 && (
          <line x1={0} y1={H - plinthH} x2={span} y2={H - plinthH} stroke="#334155" strokeWidth={sw} strokeDasharray={`${fsz * 0.3} ${fsz * 0.3}`} />
        )}
        {/* Wastafel & kompor (acuan) */}
        {appliances.map((a) => {
          const p = projBox(v, a.box);
          const col = a.kind === 'sink' ? '#38bdf8' : '#fb923c';
          return (
            <g key={a.kind}>
              <rect x={p.u0} y={H - p.y1} width={p.u1 - p.u0} height={p.y1 - p.y0} fill={col} fillOpacity={0.08} stroke={col} strokeWidth={sw} strokeDasharray={`${fsz * 0.5} ${fsz * 0.3}`} />
              {interactive && (
                <text x={(p.u0 + p.u1) / 2} y={H - p.y0 + fsz * 1.1} fontSize={fsz * 0.75} fill={col} textAnchor="middle">
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
          const w = p.u1 - p.u0;
          const h = p.y1 - p.y0;
          const sx = p.u0;
          const syTop = H - p.y1;
          return (
            <g key={m.id} opacity={opacity} style={interactive ? { cursor: 'move' } : undefined}>
              <title>{`${m.label || FRAME_ROLE_LABELS[m.role]} · ${AXIS_LABELS[m.axis]} · ${m.length} cm`}</title>
              <rect
                x={sx}
                y={syTop}
                width={w}
                height={h}
                fill={color}
                fillOpacity={isSel ? 0.9 : 0.55}
                stroke={isSel ? '#fbbf24' : isWarn ? '#f43f5e' : '#0f172a'}
                strokeWidth={isSel ? sw * 2.2 : isWarn ? sw * 1.8 : sw}
                strokeDasharray={isWarn && !isSel ? `${fsz * 0.4} ${fsz * 0.25}` : undefined}
              />
              {m.axis === depthAxis && (
                <g stroke="#0f172a" strokeWidth={sw}>
                  <line x1={sx} y1={syTop} x2={sx + w} y2={syTop + h} />
                  <line x1={sx + w} y1={syTop} x2={sx} y2={syTop + h} />
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // ---------- Ukuran untuk tampak utama ----------
  const renderDims = () => {
    const span = spanOf(view);
    const items = projected(view);
    const els: React.ReactNode[] = [];
    // Total
    els.push(dimH(0, span, H + fs * 2.6, `${isFBv(view) ? 'Panjang' : 'Kedalaman'} ${span} cm`, '#60a5fa', 'tot-h'));
    els.push(dimV(span + fs * 3.4, 0, H, `Tinggi ${H} cm`, '#60a5fa', 'tot-v', false));

    // Rantai ukur as tiang (bawah)
    const postU = uniqueSorted([0, span, ...items.filter(({ m }) => m.axis === 'y').map(({ p }) => (p.u0 + p.u1) / 2)]);
    for (let i = 0; i < postU.length - 1; i++) {
      els.push(dimH(postU[i], postU[i + 1], -fs * 2.4, `${r1(postU[i + 1] - postU[i])}`, '#94a3b8', `ch-${i}`, false));
    }
    // Rantai ukur ketinggian palang (kiri)
    const railY = uniqueSorted([0, H, ...items.filter(({ m }) => m.axis !== 'y').map(({ p }) => (p.y0 + p.y1) / 2)]);
    for (let i = 0; i < railY.length - 1; i++) {
      els.push(dimV(-fs * 3, railY[i], railY[i + 1], `${r1(railY[i + 1] - railY[i])}`, '#94a3b8', `cv-${i}`));
    }

    // Ukuran batang terpilih
    if (selected) {
      const p = projBox(view, memberBox(selected, memberTubeCm(selected, config)));
      const amber = '#fbbf24';
      if (selected.axis === 'y') {
        els.push(dimV(p.u1 + fs * 1.2, p.y0, p.y1, `${selected.length} cm`, amber, 'sel-len', false));
        if (p.y0 > 0.5) els.push(dimV(p.u1 + fs * 1.2, 0, p.y0, `${r1(p.y0)}`, amber, 'sel-off', false));
        els.push(dimH(0, (p.u0 + p.u1) / 2, (p.y0 + p.y1) / 2, `as ${r1((p.u0 + p.u1) / 2)}`, amber, 'sel-u'));
      } else if (selected.axis === planeAxisOf(view)) {
        els.push(dimH(p.u0, p.u1, p.y1 + fs * 1.2, `${selected.length} cm`, amber, 'sel-len'));
        if (p.u0 > 0.5) els.push(dimH(0, p.u0, p.y1 + fs * 1.2, `${r1(p.u0)}`, amber, 'sel-off'));
        els.push(dimV(p.u0 + fs * 0.6, 0, (p.y0 + p.y1) / 2, `as ${r1((p.y0 + p.y1) / 2)}`, amber, 'sel-y', false));
      } else {
        els.push(dimH(0, (p.u0 + p.u1) / 2, (p.y0 + p.y1) / 2, `as ${r1((p.u0 + p.u1) / 2)}`, amber, 'sel-u'));
        els.push(dimV((p.u0 + p.u1) / 2, 0, (p.y0 + p.y1) / 2, `as ${r1((p.y0 + p.y1) / 2)}`, amber, 'sel-y', false));
      }
    }

    // Label sisi
    const sideL = view === 'front' ? 'KIRI' : view === 'back' ? 'KANAN' : view === 'left' ? 'BELAKANG (dinding)' : 'DEPAN';
    const sideR = view === 'front' ? 'KANAN' : view === 'back' ? 'KIRI' : view === 'left' ? 'DEPAN' : 'BELAKANG (dinding)';
    els.push(
      <text key="sl" x={0} y={-fs * 3.6} fontSize={fs * 0.8} fill="#64748b">
        ◂ {sideL}
      </text>,
      <text key="sr" x={span} y={-fs * 3.6} fontSize={fs * 0.8} fill="#64748b" textAnchor="end">
        {sideR} ▸
      </text>
    );

    // Handle ubah panjang
    if (selected && (selected.axis === 'y' || selected.axis === planeAxisOf(view))) {
      const s3 = { x: selected.x, y: selected.y, z: selected.z };
      const e3 = { ...s3, [selected.axis]: s3[selected.axis] + selected.length };
      const hs = fs * 0.9;
      [
        { pt: s3, end: 'start' as const },
        { pt: e3, end: 'end' as const },
      ].forEach(({ pt, end }) => {
        const u = mapU(view, pt.x, pt.z);
        els.push(
          <rect
            key={`h-${end}`}
            x={u - hs / 2}
            y={H - pt.y - hs / 2}
            width={hs}
            height={hs}
            fill="#fbbf24"
            stroke="#0f172a"
            strokeWidth={fs * 0.1}
            style={{ cursor: selected.axis === 'y' ? 'ns-resize' : 'ew-resize' }}
            onPointerDown={(e) => onHandleDown(e, end)}
          />
        );
      });
    }
    return els;
  };

  const mainSpan = spanOf(view);
  const viewBox = `${-pad.l} ${-pad.t} ${mainSpan + pad.l + pad.r} ${H + pad.t + pad.b}`;

  const NumField = ({ label, value, onCommit, hint }: { label: string; value: number; onCommit: (v: number) => void; hint?: string }) => (
    <label className="block space-y-0.5">
      <span className="flex justify-between text-[10px] text-neutral-400">
        <span>{label}</span>
        {hint && <span className="text-neutral-500">{hint}</span>}
      </span>
      <input
        key={`${label}-${value}`}
        type="number"
        step={0.5}
        defaultValue={value}
        onBlur={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v) && v !== value) onCommit(r1(v));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className="w-full px-2 py-1 bg-black/40 border border-white/10 rounded-md text-xs font-mono text-neutral-100 focus:outline-none focus:border-amber-500"
      />
    </label>
  );

  const totalLength = members.reduce((s, m) => s + m.length, 0);

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 text-neutral-100 outline-none" tabIndex={0} onKeyDown={onKeyDown}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-white/[0.08] bg-[#0f1218]">
        <div className="flex items-center p-1 bg-black/40 rounded-lg border border-white/5">
          {(Object.keys(VIEW_LABELS) as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                view === v ? 'bg-white/15 text-white ring-1 ring-white/10' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-white/10" />

        <button onClick={addPost} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Tiang
        </button>
        <button onClick={addPlaneRail} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Palang {isFBv(view) ? 'Memanjang' : 'Kedalaman'}
        </button>
        <button
          onClick={addDepthRail}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-300 text-xs font-semibold cursor-pointer"
          title="Palang tegak lurus bidang gambar (terlihat sebagai kotak bersilang)"
        >
          <Plus className="w-3.5 h-3.5" /> Palang {isFBv(view) ? 'Kedalaman' : 'Memanjang'}
        </button>

        <div className="h-5 w-px bg-white/10" />

        <label className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          Snap
          <select value={snap} onChange={(e) => setSnap(parseFloat(e.target.value))} className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-xs text-neutral-200 cursor-pointer">
            {[0.5, 1, 2, 5, 10].map((s) => (
              <option key={s} value={s}>
                {s} cm
              </option>
            ))}
          </select>
        </label>
        <button onClick={handleUndo} disabled={history.length === 0} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-neutral-300 hover:text-white hover:bg-white/5 disabled:opacity-30 cursor-pointer" title="Undo (Ctrl+Z)">
          <Undo2 className="w-3.5 h-3.5" /> Undo
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
              isCustom ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {isCustom ? 'MODE MANUAL' : 'OTOMATIS (ikut modul)'}
          </span>
          {isCustom && (
            <button onClick={handleResetAuto} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-rose-300 hover:bg-rose-500/10 cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> Reset ke Otomatis
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Kanvas */}
        <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
          <div className="relative flex-1 min-h-0 bg-[#0b0e14] rounded-xl border border-white/[0.08] overflow-hidden">
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
              {renderDims()}
            </svg>
            <div className="absolute top-2 left-3 text-[11px] text-neutral-500 pointer-events-none flex items-center gap-1.5">
              <MousePointer2 className="w-3 h-3" />
              Klik pilih · klik lagi untuk batang di belakangnya · seret untuk geser · kotak kuning untuk ubah panjang · panah/Delete
            </div>
            {!isCustom && (
              <div className="absolute bottom-2 left-3 text-[11px] text-emerald-300/80 pointer-events-none">
                Rangka masih otomatis. Edit pertama akan mengubahnya ke mode manual (tidak lagi ikut perubahan modul/ukuran).
              </div>
            )}
          </div>

          {/* Tiga tampak lain (ikut berubah) */}
          <div className="grid grid-cols-3 gap-3 h-36 shrink-0">
            {(Object.keys(VIEW_LABELS) as View[])
              .filter((v) => v !== view)
              .map((v) => {
                const sp = spanOf(v);
                const f = Math.max(2.6, Math.max(sp + 50, H + 50) / 80);
                return (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className="relative bg-[#0b0e14] rounded-xl border border-white/[0.08] hover:border-amber-500/50 overflow-hidden cursor-pointer"
                  >
                    <span className="absolute top-1.5 left-2 text-[10px] font-semibold text-neutral-400">{VIEW_LABELS[v]}</span>
                    <svg viewBox={`${-f * 2} ${-f * 3} ${sp + f * 4} ${H + f * 5}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full pointer-events-none">
                      {renderScene(v, false, f)}
                    </svg>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Panel properti */}
        <aside className="w-72 shrink-0 border-l border-white/[0.08] bg-[#0e1117] overflow-y-auto p-3 space-y-3">
          {selected ? (
            <div className="p-3 bg-[#12151c] border border-amber-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">Batang Terpilih</span>
                <span className="text-[10px] font-mono text-neutral-400">{AXIS_LABELS[selected.axis]}</span>
              </div>
              <input
                key={`label-${selected.id}`}
                defaultValue={selected.label || ''}
                placeholder={FRAME_ROLE_LABELS[selected.role]}
                onBlur={(e) => e.target.value !== (selected.label || '') && updateMember(selected.id, { label: e.target.value })}
                className="w-full px-2 py-1 bg-black/40 border border-white/10 rounded-md text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
              <select
                value={selected.role}
                onChange={(e) => updateMember(selected.id, { role: e.target.value as FrameMemberRole })}
                className="w-full px-2 py-1 bg-black/40 border border-white/10 rounded-md text-xs text-neutral-200 cursor-pointer"
              >
                {(Object.keys(FRAME_ROLE_LABELS) as FrameMemberRole[]).map((r) => (
                  <option key={r} value={r}>
                    {FRAME_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <NumField label="X (dari kiri)" value={selected.x} onCommit={(v) => updateMember(selected.id, { x: v })} />
                <NumField label="Y (dari lantai)" value={selected.y} onCommit={(v) => updateMember(selected.id, { y: v })} />
                <NumField
                  label="Z (dari belakang)"
                  value={selected.z}
                  hint={`depan ${r1(carcaseD - selected.z)}`}
                  onCommit={(v) => updateMember(selected.id, { z: v })}
                />
                <NumField label="Panjang (cm)" value={selected.length} onCommit={(v) => updateMember(selected.id, { length: Math.max(1, v) })} />
              </div>

              <label className="flex items-center justify-between text-[11px] text-neutral-400">
                Ukuran pipa
                <select
                  value={selected.tubeSize || 0}
                  onChange={(e) => updateMember(selected.id, { tubeSize: parseInt(e.target.value) || undefined })}
                  className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-xs text-neutral-200 cursor-pointer"
                >
                  <option value={0}>Ikut rangka ({config.frame?.tubeSize || 40} mm)</option>
                  {[20, 30, 40, 50, 60].map((s) => (
                    <option key={s} value={s}>
                      {s}×{s} mm
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button onClick={() => duplicateSelected()} className="flex items-center justify-center gap-1 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-neutral-200 cursor-pointer">
                  <Copy className="w-3 h-3" /> Duplikat
                </button>
                <button onClick={fitSelected} className="flex items-center justify-center gap-1 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-neutral-200 cursor-pointer" title="Rentangkan penuh sesuai ukuran rangka">
                  <Maximize2 className="w-3 h-3" /> Rentang Penuh
                </button>
                <button onClick={() => duplicateSelected('x')} className="flex items-center justify-center gap-1 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-neutral-200 cursor-pointer" title="Salin ke posisi cermin kiri ⇄ kanan">
                  <FlipHorizontal className="w-3 h-3" /> Cermin Kiri/Kanan
                </button>
                <button onClick={() => duplicateSelected('z')} className="flex items-center justify-center gap-1 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-neutral-200 cursor-pointer" title="Salin ke posisi cermin depan ⇄ belakang">
                  <FlipHorizontal className="w-3 h-3 rotate-90" /> Cermin Dpn/Blkg
                </button>
              </div>
              <button onClick={() => deleteMember(selected.id)} className="w-full flex items-center justify-center gap-1 py-1.5 rounded-md bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-xs font-semibold text-rose-300 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Hapus Batang
              </button>
            </div>
          ) : (
            <div className="p-3 bg-[#12151c] border border-white/[0.08] rounded-xl text-[11px] text-neutral-400 leading-relaxed">
              Pilih batang di gambar atau di daftar bawah untuk mengatur posisi & panjangnya. Semua tampak memakai data 3D yang sama, jadi perubahan di satu sisi otomatis terlihat di sisi lain dan di 3D.
            </div>
          )}

          {/* Ringkasan */}
          <div className="p-3 bg-[#12151c] border border-white/[0.08] rounded-xl space-y-1 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-neutral-300 font-sans font-semibold text-xs pb-1">
              <Ruler className="w-3.5 h-3.5 text-blue-400" /> Ringkasan Rangka
            </div>
            <div className="flex justify-between text-neutral-400"><span>Jumlah batang</span><span className="text-white">{members.length}</span></div>
            <div className="flex justify-between text-neutral-400"><span>Total panjang</span><span className="text-white">{r1(totalLength / 100)} m</span></div>
            <div className="flex justify-between text-neutral-400"><span>Kaki / plinth</span><span className="text-white">{plinthH > 0 ? `${plinthH} cm (${config.legType === 'frame' ? 'rangka' : config.legType === 'feet' ? 'kaki stel' : 'plinth'})` : 'tanpa kaki'}</span></div>
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
                  className={`w-full flex items-center gap-2 px-1.5 py-1 rounded text-left text-[10px] cursor-pointer ${
                    m.id === selectedId ? 'bg-amber-500/15 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: ROLE_COLORS[m.role] }} />
                  <span className="flex-1 truncate">{m.label || FRAME_ROLE_LABELS[m.role]}</span>
                  {warnIds.has(m.id) && <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />}
                  <span className="font-mono text-neutral-500 shrink-0">{m.axis.toUpperCase()} {m.length}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
