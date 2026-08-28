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

// Same five shade steps as the openGym heatmap, but tinted by the Parto theme accent.
function shade(level) {
  const alpha = [0, 0.18, 0.35, 0.6, 0.95][level] || 0;
  return `rgb(var(--c-primary) / ${alpha})`;
}

function View({ view, levels, onMuscle, selected, lang }) {
  return (
    <svg className="bm-v" viewBox={view.vb} role="img" style={{ width: '100%', maxWidth: 360, height: 'auto' }}>
      {INERT.map((slug) => (view.p[slug] || []).map((d, i) => (
        <path key={slug + i} d={d} fill="currentColor" opacity={0.08} />
      )))}
      {MUSCLES.map((slug) => (view.p[slug] || []).map((d, i) => (
        <path
          key={slug + i}
          d={d}
          fill={shade(levels[slug] || 0)}
          stroke={selected === slug ? 'rgb(var(--c-accent))' : 'transparent'}
          strokeWidth={selected === slug ? 1.5 : 0}
          onClick={onMuscle ? () => onMuscle(slug) : undefined}
          style={{ cursor: onMuscle ? 'pointer' : 'default', transition: 'fill .2s' }}
        >
          <title>{lang === 'fa' ? (MUSCLE_FA[slug] || slug) : (MUSCLE_NAME[slug] || slug)}</title>
        </path>
      )))}
    </svg>
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
