import React, { useEffect, useState } from 'react';
import { MUSCLES, INERT, MUSCLE_NAME, MUSCLE_FA, levelsOf } from '../lib/muscles.js';

let CACHE = null;
let PENDING = null;
function useBodyPaths() {
  const [paths, setPaths] = useState(CACHE);
  useEffect(() => {
    if (CACHE) return;
    let alive = true;
    PENDING = PENDING || import('../lib/body-paths.js').then((m) => (CACHE = m.default));
    PENDING.then((p) => { if (alive) setPaths(p); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return paths;
}

// Base silhouette: a faint body so the outline is always visible even for
// untrained muscles (level 0). Tinted by the Parto theme primary so it matches
// light & dark mode. ac = "accent" (the active muscle fill).
const ac = 'rgb(var(--c-primary))';
const BASE = 'rgba(var(--c-primary) / 0.14)';       // untrained muscle (level 0)
const SIL = 'rgba(var(--c-primary) / 0.07)';        // inert body parts (head/hands...)
// Five shade steps, same ramp as the heatmap.
const SHADE = [
  BASE,
  'rgba(var(--c-primary) / 0.30)',
  'rgba(var(--c-primary) / 0.55)',
  'rgba(var(--c-primary) / 0.80)',
  ac,
];

function View({ view, levels, onMuscle, selected, lang }) {
  return (
    <svg className="bm-v" viewBox={view.vb} role="img" style={{ width: '100%', maxWidth: 340, height: 'auto' }}>
      {/* Inert parts (head, hair, neck, hands, feet, knees, ankles) — always a faint fill. */}
      {INERT.map((slug) => (view.p[slug] || []).map((d, i) => (
        <path key={slug + i} d={d} fill={SIL} stroke="rgba(var(--c-primary) / 0.12)" strokeWidth={1} strokeLinejoin="round" />
      )))}
      {/* Muscles — always drawn, colored by how hard they were trained. */}
      {MUSCLES.map((slug) => (view.p[slug] || []).map((d, i) => {
        const lv = levels[slug] || 0;
        const isSel = selected === slug;
        return (
          <path
            key={slug + i}
            d={d}
            fill={SHADE[lv]}
            stroke={isSel ? 'rgb(var(--c-accent))' : 'rgba(var(--c-primary) / 0.12)'}
            strokeWidth={isSel ? 2 : 1}
            strokeLinejoin="round"
            onClick={onMuscle ? () => onMuscle(slug) : undefined}
            style={{ cursor: onMuscle ? 'pointer' : 'default', transition: 'fill .2s, stroke .2s' }}
          >
            <title>{lang === 'fa' ? (MUSCLE_FA[slug] || slug) : (MUSCLE_NAME[slug] || slug)}</title>
          </path>
        );
      }))}
    </svg>
  );
}

export function BodyMapLegend({ lang }) {
  const low = lang === 'fa' ? 'کم' : 'Less';
  const high = lang === 'fa' ? 'زیاد' : 'More';
  return (
    <div className="hm-legend flex items-center gap-1.5 text-[10px] text-slate-400">
      <span>{low}</span>
      {SHADE.slice(1).map((c, i) => (
        <span key={i} className="inline-block h-2 w-4 rounded-sm" style={{ background: c }} />
      ))}
      <span className="inline-block h-2 w-4 rounded-sm" style={{ background: ac }} />
      <span>{high}</span>
    </div>
  );
}

export default function BodyMap({ load = {}, body = 'male', onMuscle, selected, lang, className = '' }) {
  const paths = useBodyPaths();
  const levels = levelsOf(load);
  const g = paths && (paths[body] || paths.male);
  return (
    <div className={`flex gap-2 justify-center ${className}`}>
      {g ? (
        <>
          <View view={g.front} levels={levels} onMuscle={onMuscle} selected={selected} lang={lang} />
          <View view={g.back} levels={levels} onMuscle={onMuscle} selected={selected} lang={lang} />
        </>
      ) : (
        <div className="h-32 w-56" aria-hidden="true" />
      )}
    </div>
  );
}
