// Automatic progression (ported from openGym's progression.js, reduced to a fa/en i18n
// contract). Everything is a pure function of workout history — nothing writes back into a
// finished workout. The next prescription is *derived* each time it is needed.
import { modeOf, repStep } from './calc.js';
import { EXIDX } from './exercises.js';

export const POLICIES = ['off', 'linear', 'greyskull', 'double', 'time'];
export const POLICIES_FOR = {
  reps: ['off', 'linear', 'greyskull', 'double'],
  time: ['off', 'time'],
  cardio: ['off'],
};

const DELOAD_FACTOR = 0.9;
export const DELOAD_AFTER = { linear: 3, greyskull: 1, double: 3, time: 3 };
const HEAVY_BP = ['upper legs', 'lower legs', 'back'];
export const MAX_BW_SETS = 6;

export function policyFor(cfg, routine, mode) {
  const m = mode || modeOf(cfg || {});
  const allowed = POLICIES_FOR[m] || ['off'];
  const pick = (cfg && cfg.prog) || (routine && routine.prog) || (m === 'reps' ? 'linear' : 'off');
  return allowed.includes(pick) ? pick : 'off';
}

const round1 = (v) => Math.round(v * 10) / 10;
function snap(v, step) { return (step > 0 && isFinite(step)) ? round1(Math.round(v / step) * step) : round1(v); }
function deloadTo(cur, step) {
  let next = snap(cur * DELOAD_FACTOR, step);
  if (next >= cur) next = snap(cur - step, step);
  return Math.max(step, next);
}
export function defaultIncrement(exId, unit) {
  const ex = EXIDX[exId];
  const heavy = ex && HEAVY_BP.includes(ex.bp);
  if (unit === 'lb') return heavy ? 10 : 5;
  return heavy ? 5 : 2.5;
}
export const DEFAULT_SEC_INCREMENT = 5;

export function readSession(entry, fallback) {
  const target = (entry && entry.target) || fallback || {};
  const mode = modeOf({ ...target, id: entry && entry.id });
  const sets = (entry && entry.sets) || [];
  const planned = target.sets || sets.length;
  const enough = sets.length >= planned;
  if (mode === 'time') {
    const goal = target.sec || 0;
    const held = sets.map((s) => (s.done ? (s.sec || 0) : 0));
    return {
      mode, goal, held,
      weight: Math.max(0, ...sets.filter((s) => s.done).map((s) => s.w || 0)),
      best: Math.max(0, ...held),
      ok: goal > 0 && enough && held.length > 0 && held.every((h) => h >= goal),
    };
  }
  const goal = target.reps || 0;
  const reps = sets.map((s) => (s.done ? (s.r || 0) : 0));
  return {
    mode, goal, reps,
    weight: Math.max(0, ...sets.filter((s) => s.done).map((s) => s.w || 0)),
    count: reps.length,
    low: reps.length ? Math.min(...reps) : 0,
    amrap: reps.length ? reps[reps.length - 1] : 0,
    ok: goal > 0 && enough && reps.length > 0 && reps.every((r) => r >= goal),
  };
}

export function sessionsFor(S, exId, fallback) {
  const out = [];
  (S.workouts || []).forEach((w) => {
    const entry = w.entries.find((e) => e.id === exId);
    if (entry && entry.sets.some((s) => s.done)) out.push({ d: w.d, ...readSession(entry, fallback) });
  });
  return out;
}

export function stallCount(sessions) {
  let n = 0;
  for (let i = sessions.length - 1; i >= 0; i--) { if (sessions[i].ok) break; n++; }
  return n;
}

// Returns { policy, kind, weight, reps, sec, sets, why:[key,...args] }.
export function nextPrescription(S, cfg, routine) {
  const mode = modeOf(cfg);
  const policy = policyFor(cfg, routine, mode);
  const unit = S.unit || 'kg';
  const inc = cfg.inc > 0 ? cfg.inc : (mode === 'time' ? DEFAULT_SEC_INCREMENT : defaultIncrement(cfg.id, unit));
  if (policy === 'off') return { policy, kind: 'off' };

  const sessions = sessionsFor(S, cfg.id, cfg).filter((s) => s.mode === mode);
  const last = sessions[sessions.length - 1];
  if (!last) return { policy, kind: 'first', why: ['prog.first'] };

  const stalls = stallCount(sessions);
  const deloadAt = DELOAD_AFTER[policy] || 3;

  if (mode === 'time') {
    if (last.ok) {
      const sec = (last.goal || cfg.sec || 0) + inc;
      return { policy, kind: 'up', sec, why: ['prog.timeUp', inc] };
    }
    if (stalls >= deloadAt) {
      const sec = deloadTo(last.goal || cfg.sec || 0, 5);
      return { policy, kind: 'deload', sec, why: ['prog.deload', stalls, sec] };
    }
    return { policy, kind: 'hold', sec: last.goal || cfg.sec, why: ['prog.hold'] };
  }

  const w = last.weight;
  if (w <= 0) {
    const goal = last.goal || cfg.reps || 0;
    if (!last.ok || goal <= 0) return { policy, kind: 'hold', weight: 0, reps: goal || undefined, why: ['prog.bwHold'] };
    const top = cfg.repsMax > 0 ? cfg.repsMax : 0;
    if (top > 0 && goal >= top) {
      const sets = Math.max(1, cfg.sets || last.count || 1) + 1;
      const bottom = Math.max(1, Math.min(cfg.reps || top, top));
      if (sets <= MAX_BW_SETS) return { policy, kind: 'up', weight: 0, reps: bottom, sets, why: ['prog.bwAddSet', goal, bottom] };
      return { policy, kind: 'hold', weight: 0, reps: goal, why: ['prog.bwHarder', sets - 1, goal] };
    }
    const next = goal + repStep(cfg);
    return { policy, kind: 'up', weight: 0, reps: next, why: ['prog.bwUp', next] };
  }
  if (policy === 'double') {
    const top = cfg.reps || last.goal || 10;
    const bottom = Math.min(cfg.repsMin || Math.max(1, top - 2), top);
    if (last.ok) return { policy, kind: 'up', weight: snap(w + inc, inc), reps: bottom, why: ['prog.doubleUp', inc, unit, bottom] };
    if (stalls >= deloadAt) {
      const dw = deloadTo(w, inc);
      return { policy, kind: 'deload', weight: dw, reps: bottom, why: ['prog.deload', stalls, dw, unit] };
    }
    const aim = Math.min(top, Math.max(bottom, last.low + repStep(cfg)));
    return { policy, kind: 'hold', weight: w, reps: aim, why: ['prog.doubleHold', aim] };
  }

  // linear + greyskull
  if (last.ok) {
    const dbl = policy === 'greyskull' && last.goal > 0 && last.amrap >= last.goal * 2;
    const step = dbl ? inc * 2 : inc;
    return {
      policy, kind: 'up', weight: snap(w + step, inc),
      why: dbl ? ['prog.gyDouble', last.amrap, step, unit] : ['prog.up', step, unit],
    };
  }
  if (stalls >= deloadAt) {
    const dw = deloadTo(w, inc);
    return {
      policy, kind: 'deload', weight: dw,
      why: stalls > 1 ? ['prog.deload', stalls, dw, unit] : ['prog.deloadOnce', dw, unit],
    };
  }
  return { policy, kind: 'hold', weight: w, why: ['prog.holdMiss', deloadAt - stalls, deloadAt] };
}

export function applyPrescription(sets, p) {
  if (!p || p.kind === 'off' || p.kind === 'first') return sets;
  const out = sets.map((s) => {
    if (s.done) return s;
    const o = { ...s };
    if (p.weight != null) o.w = p.weight;
    if (p.reps != null) o.r = p.reps;
    if (p.sec != null) o.sec = p.sec;
    return o;
  });
  if (p.sets > out.length) {
    const seed = out[out.length - 1];
    while (out.length < p.sets) out.push({ ...seed, done: false });
  }
  return out;
}
