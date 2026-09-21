import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  LockIcon, CheckIcon, PlayIcon, PlusIcon, ZoomInIcon, ZoomOutIcon, XIcon, TargetIcon,
} from '../../icons';
import { useProgramming } from '../../../hooks/useProgramming';
import { useTranslation } from '../../../hooks/useTranslation';
import { useApp } from '../../../contexts/AppContext';
import { localizeDigits } from '../../../utils/dateUtils';
import { SKILL_BRANCHES, SKILL_NODES, SKILL_BY_ID } from '../../../data/programming/skillTree';
import { deriveSkillState, SKILL_STATE, prereqsMet } from '../../../data/programming/model';
import SkillDetail from './SkillDetail';

const NODE_W = 132;
const NODE_H = 62;
const COL_GAP = 26;
const ROW_GAP = 20;
const BRANCH_HEADER = 38;

// simple layered layout per branch: nodes with no met-prereq inside the branch
// go to layer 0, then layer by longest path from a layer-0 node.
function layoutBranch(nodes) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const layer = {};
  const resolve = (id, stack = []) => {
    if (layer[id] !== undefined) return layer[id];
    if (stack.includes(id)) return 0; // cycle guard
    const n = byId[id];
    const internal = (n.prereqs || []).filter((p) => byId[p]);
    if (!internal.length) { layer[id] = 0; return 0; }
    layer[id] = Math.max(...internal.map((p) => resolve(p, [...stack, id]))) + 1;
    return layer[id];
  };
  nodes.forEach((n) => resolve(n.id));
  const layers = Math.max(1, ...nodes.map((n) => layer[n.id])) + 1;
  return { layer, layers };
}

export default function StandardTree() {
  const { t, lang } = useTranslation();
  const { technologies, goalEntries, addToGoal, setGoalEntry } = useProgramming();
  const { data } = useApp();
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeBranch, setActiveBranch] = useState(null);
  const dragRef = useRef(null);
  const containerRef = useRef(null);

  const ctx = useMemo(() => ({ technologies, goalEntries }), [technologies, goalEntries]);

  // positions: branch -> { width, height, pos: { nodeId: {x,y} } }
  const layout = useMemo(() => {
    const out = {};
    SKILL_BRANCHES.forEach((b) => {
      const nodes = SKILL_NODES.filter((n) => n.branch === b.id);
      if (!nodes.length) return;
      const { layer, layers } = layoutBranch(nodes);
      const pos = {};
      // center nodes in each layer column
      const perLayer = {};
      nodes.forEach((n) => { (perLayer[layer[n.id]] = perLayer[layer[n.id]] || []).push(n); });
      const rows = Math.max(...Object.values(perLayer).map((x) => x.length));
      const height = BRANCH_HEADER + rows * (NODE_H + ROW_GAP);
      Object.entries(perLayer).forEach(([l, arr]) => {
        const col = Number(l);
        const startY = BRANCH_HEADER + ((rows - arr.length) * (NODE_H + ROW_GAP)) / 2;
        arr.forEach((n, i) => {
          pos[n.id] = { x: col * (NODE_W + COL_GAP), y: startY + i * (NODE_H + ROW_GAP) };
        });
      });
      out[b.id] = { pos, width: layers * (NODE_W + COL_GAP), height, nodes };
    });
    return out;
  }, []);

  const edges = useMemo(() => {
    const list = [];
    SKILL_NODES.forEach((n) => {
      (n.prereqs || []).forEach((p) => {
        const pn = SKILL_BY_ID[p];
        if (!pn || pn.branch !== n.branch) return;
        const from = layout[n.branch]?.pos?.[p];
        const to = layout[n.branch]?.pos?.[n.id];
        if (from && to) list.push({ branch: n.branch, from, to });
      });
    });
    return list;
  }, [layout]);

  const totalSize = useMemo(() => {
    let h = 0; const w = Math.max(...Object.values(layout).map((b) => b.width || 0), 0);
    SKILL_BRANCHES.forEach((b) => { if (layout[b.id]) h += layout[b.id].height + 16; });
    return { w: w + 24, h: h + 16 };
  }, [layout]);

  const stateOf = useCallback((id) => deriveSkillState(id, ctx), [ctx]);

  // wheel zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((z) => Math.min(2.2, Math.max(0.4, z - (e.deltaY > 0 ? 0.08 : -0.08))));
  }, []);

  const onPointerDown = (e) => {
    // don't hijack clicks on node buttons
    if (e.target.closest('button')) return;
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, captured: false };
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.captured && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) {
      d.captured = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    }
    if (d.captured) setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) });
  };
  const onPointerUp = () => { dragRef.current = null; };

  const zoomBy = (f) => setZoom((z) => Math.min(2.2, Math.max(0.4, z + f)));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const visibleBranches = activeBranch ? SKILL_BRANCHES.filter((b) => b.id === activeBranch) : SKILL_BRANCHES;

  return (
    <div className="card overflow-hidden">
      {/* toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveBranch(null)} className={`chip shrink-0 ${!activeBranch ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {t('common.all')}
          </button>
          {SKILL_BRANCHES.map((b) => (
            <button key={b.id} onClick={() => setActiveBranch((cur) => (cur === b.id ? null : b.id))}
              className={`chip shrink-0 ${activeBranch === b.id ? 'text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
              style={activeBranch === b.id ? { backgroundColor: b.color } : {}}>
              {b.name[lang]}
            </button>
          ))}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => zoomBy(0.15)} className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-sky-500"><ZoomOutIcon size={15} /></button>
          <button onClick={() => zoomBy(-0.15)} className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-sky-500"><ZoomInIcon size={15} /></button>
          <button onClick={resetView} className="h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">{localizeDigits(Math.round(zoom * 100), lang)}٪</button>
        </div>
      </div>

      {/* canvas */}
      <div
        ref={containerRef}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="relative h-[58vh] min-h-[360px] sm:h-[62vh] overflow-hidden touch-none cursor-grab active:cursor-grabbing bg-[radial-gradient(circle,_rgb(148_163_184/0.15)_1px,_transparent_1px)] [background-size:22px_22px]"
      >
        <div className="absolute origin-top-left select-none" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          {visibleBranches.map((b) => {
            const L = layout[b.id];
            if (!L) return null;
            return (
              <section key={b.id} className="relative mb-4" style={{ width: L.width, height: L.height }}>
                <div className="absolute inset-x-0 top-0 flex items-center gap-2" style={{ height: BRANCH_HEADER }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                  <h3 className="font-bold text-sm" style={{ color: b.color }}>{b.name[lang]}</h3>
                  <span className="text-[11px] text-slate-400">
                    {localizeDigits(L.nodes.filter((n) => stateOf(n.id) === SKILL_STATE.DONE).length, lang)}/{localizeDigits(L.nodes.length, lang)}
                  </span>
                </div>

                {/* edges */}
                <svg className="absolute inset-0 pointer-events-none" width={L.width} height={L.height} style={{ top: 0 }}>
                  {edges.filter((e) => e.branch === b.id).map((e, i) => {
                    const x1 = e.from.x + NODE_W, y1 = e.from.y + NODE_H / 2 + BRANCH_HEADER;
                    const x2 = e.to.x, y2 = e.to.y + NODE_H / 2 + BRANCH_HEADER;
                    const mx = (x1 + x2) / 2;
                    return <path key={i} d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth={2} />;
                  })}
                </svg>

                {/* nodes */}
                {L.nodes.map((n) => {
                  const p = L.pos[n.id];
                  const st = stateOf(n.id);
                  const inGoal = !!goalEntries[n.id];
                  const branchColor = b.color;
                  const styles = nodeStyles(st, branchColor);
                  return (
                    <button
                      key={n.id}
                      onClick={() => setSelected(n.id)}
                      style={{ left: p.x, top: p.y + BRANCH_HEADER, width: NODE_W, height: NODE_H }}
                      className={`absolute rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 px-2 transition-all duration-200 hover:z-10 hover:shadow-lg ${styles.bg} ${styles.border} ${styles.text} ${st === SKILL_STATE.DONE ? 'shadow-sm' : ''}`}
                    >
                      <span className="text-xs font-bold leading-tight text-center line-clamp-2">{n.name[lang]}</span>
                      <span className="flex items-center gap-1 text-[10px] opacity-80">
                        {st === SKILL_STATE.LOCKED ? <LockIcon size={10} /> : st === SKILL_STATE.DONE ? <CheckIcon size={10} strokeWidth={3} /> : st === SKILL_STATE.LEARNING ? <PlayIcon size={9} /> : null}
                        {t(`prog.${st === SKILL_STATE.AVAILABLE ? 'available' : st}`)}
                      </span>
                      {inGoal && <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-violet-500 text-white flex items-center justify-center"><TargetIcon size={9} /></span>}
                    </button>
                  );
                })}
              </section>
            );
          })}
        </div>

        {/* hint */}
        <div className="absolute bottom-3 start-3 text-[10px] text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg pointer-events-none">
          {lang === 'fa' ? 'برای جابجایی بکشید · برای بزرگ‌نمایی اسکرول کنید' : 'Drag to pan · Scroll to zoom'}
        </div>
      </div>

      <SkillDetail skillId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function nodeStyles(st, color) {
  switch (st) {
    case SKILL_STATE.DONE:
      return { bg: 'bg-emerald-500/12', border: 'border-emerald-500/40', text: 'text-emerald-600 dark:text-emerald-400' };
    case SKILL_STATE.LEARNING:
      return { bg: 'bg-sky-500/12', border: 'border-sky-500/50', text: 'text-sky-600 dark:text-sky-400' };
    case SKILL_STATE.AVAILABLE:
      return { bg: 'bg-white dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-200' };
    case SKILL_STATE.STOPPED:
      return { bg: 'bg-amber-500/10', border: 'border-amber-500/35', text: 'text-amber-600 dark:text-amber-400' };
    default:
      return { bg: 'bg-slate-50 dark:bg-slate-900/50', border: 'border-slate-200/70 dark:border-slate-800 border-dashed', text: 'text-slate-400' };
  }
}
