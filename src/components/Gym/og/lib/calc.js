// Pure logic ported from openGym's history.js / onerm.js / progression.js — reduced to
// the parts the Parto gym module uses, with no i18n / API / media coupling.
import { isCardio, isBodyweightEq } from './exercises.js';

export const todayISO = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
export const isoOf = (d) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

export const DAYN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function modeOf(cfg) {
  const m = cfg && cfg.mode;
  if (m === 'reps' || m === 'time' || m === 'cardio') return m;
  return isCardio(cfg && cfg.id) ? 'cardio' : 'reps';
}
export const isTimed = (cfg) => modeOf(cfg) === 'time';
export const isBw = (cfg) => (cfg && cfg.bodyweight != null ? !!cfg.bodyweight : isBodyweightEq(cfg && cfg.id));
export const isPerSide = (cfg) => !!(cfg && cfg.side);
export const repStep = (cfg) => (isPerSide(cfg) ? 2 : 1);

export function fmtSec(sec) {
  const n = Math.max(0, Math.round(Number(sec) || 0));
  return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
}

export function defaultConfig(id, mode) {
  const m = mode || modeOf({ id });
  if (m === 'cardio') return { sets: 1, min: 20, speed: 8 };
  const bw = isBodyweightEq(id) ? { bodyweight: true } : {};
  if (m === 'time') return { sets: 3, sec: 45, weight: 0, mode: 'time', ...bw };
  return { sets: 3, reps: 10, weight: 0, mode: 'reps', ...bw };
}

export function lastEntryFor(S, exId) {
  for (let i = S.workouts.length - 1; i >= 0; i--) {
    const en = S.workouts[i].entries.find((e) => e.id === exId);
    if (en && en.sets.some((s) => s.done)) {
      return { d: S.workouts[i].d, sets: en.sets.filter((s) => s.done), target: en.target || null };
    }
  }
  return null;
}

export function bestWeightFor(S, exId) {
  let best = 0;
  S.workouts.forEach((w) => w.entries.forEach((e) => {
    if (e.id === exId) {
      e.sets.forEach((s) => { if (s.done && s.w > best) best = s.w; });
      if (e.topW && e.topW > best) best = e.topW;
    }
  }));
  return best;
}

export function effectiveRoutineId(S, iso) {
  const ov = S.dayPlan?.[iso];
  if (ov === 'rest') return null;
  if (ov && S.routines.some((r) => r.id === ov)) return ov;
  const wd = new Date(iso + 'T12:00:00').getDay();
  return S.week?.[wd] || null;
}
export function effectiveRoutine(S, iso) {
  const id = effectiveRoutineId(S, iso);
  return id ? S.routines.find((r) => r.id === id) || null : null;
}

export function buildSets(S, cfg) {
  const last = lastEntryFor(S, cfg.id);
  const n = Math.max(1, cfg.sets || 1);
  const mode = modeOf(cfg);
  const sets = [];
  const prevAt = (i) => (last ? (last.sets[i] || last.sets[last.sets.length - 1]) : null);
  if (mode === 'cardio') {
    for (let i = 0; i < n; i++) {
      const prev = prevAt(i);
      sets.push({ min: prev ? prev.min : (cfg.min || 20), speed: prev ? prev.speed : (cfg.speed || 8), done: false });
    }
    return sets;
  }
  if (mode === 'time') {
    for (let i = 0; i < n; i++) {
      const prev = prevAt(i);
      const carried = prev && prev.sec > 0 ? prev : null;
      sets.push({ sec: carried ? carried.sec : (cfg.sec || 45), w: carried ? (carried.w || 0) : (cfg.weight || 0), done: false });
    }
    return sets;
  }
  const conf = S.exWeights?.[cfg.id];
  for (let i = 0; i < n; i++) {
    const prev = prevAt(i);
    const usable = prev && prev.r > 0 ? prev : null;
    const w = conf && conf.w > 0 ? conf.w : (usable ? usable.w : cfg.weight);
    sets.push({ w, r: usable ? usable.r : cfg.reps, done: false });
  }
  return sets;
}

export function workoutVolume(w) {
  let v = 0;
  w.entries.forEach((e) => e.sets.forEach((s) => { if (s.done) v += (s.w || 0) * (s.r || 0); }));
  return Math.round(v * 10) / 10;
}
export function setsDone(w) {
  let n = 0;
  w.entries.forEach((e) => e.sets.forEach((s) => { if (s.done) n++; }));
  return n;
}
export function setsDoneActive(A) {
  let n = 0;
  if (A) A.entries.forEach((e) => e.sets.forEach((s) => { if (s.done) n++; }));
  return n;
}
export const lastBW = (S) => (S.bodyweight.length ? S.bodyweight[S.bodyweight.length - 1] : null);

export function supersetUnits(items) {
  const units = [];
  items.forEach((e, i) => {
    const prev = items[i - 1];
    if (i > 0 && e.sg && prev && prev.sg && e.sg === prev.sg) units[units.length - 1].push(i);
    else units.push([i]);
  });
  return units;
}
export function unitOf(units, idx) { return units.find((u) => u.includes(idx)) || [idx]; }

export function streakWeeks(S) {
  if (!S.workouts.length) return 0;
  const weeks = new Set(S.workouts.map((w) => weekKey(w.d)));
  let streak = 0;
  const cur = new Date();
  for (let i = 0; i < 520; i++) {
    const wk = weekKey(isoOf(cur));
    if (weeks.has(wk)) streak++;
    else if (i > 0) break;
    cur.setDate(cur.getDate() - 7);
  }
  return streak;
}
export function weekKey(d) {
  const dt = new Date(d + 'T12:00:00');
  const day = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - day + 3);
  const jan4 = new Date(dt.getFullYear(), 0, 4);
  const week = 1 + Math.round(((dt - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  return dt.getFullYear() + '-' + week;
}

/* ---- estimated 1RM ---- */
export const REP_CAP = 12;
export const FORMULAS = {
  epley: (w, r) => w * (1 + r / 30),
  brzycki: (w, r) => w * 36 / (37 - r),
  lombardi: (w, r) => w * Math.pow(r, 0.1),
};
export const DEFAULT_FORMULA = 'epley';
export function estimate1RM(w, r, formula = DEFAULT_FORMULA) {
  const weight = Number(w); const reps = Number(r);
  if (!isFinite(weight) || !isFinite(reps)) return null;
  if (weight <= 0 || reps < 1) return null;
  if (reps > REP_CAP) return null;
  const fn = FORMULAS[formula] || FORMULAS[DEFAULT_FORMULA];
  const est = reps === 1 ? weight : fn(weight, Math.round(reps));
  if (!isFinite(est) || est <= 0) return null;
  return Math.round(est * 10) / 10;
}
export function bestSetOf(entry, formula = DEFAULT_FORMULA) {
  let best = null;
  (entry?.sets || []).forEach((s) => {
    if (!s.done) return;
    const est = estimate1RM(s.w, s.r, formula);
    if (est !== null && (!best || est > best.est)) best = { est, w: Number(s.w), r: Math.round(Number(s.r)) };
  });
  return best;
}
export function e1rmSeries(S, exId, formula = DEFAULT_FORMULA) {
  const pts = [];
  (S.workouts || []).forEach((w) => {
    const entry = w.entries.find((e) => e.id === exId);
    if (!entry) return;
    const best = bestSetOf(entry, formula);
    if (best) pts.push({ t: w.start, d: w.d, y: best.est, w: best.w, r: best.r });
  });
  return pts;
}
export function best1RM(S, exId, formula = DEFAULT_FORMULA) {
  let best = null;
  e1rmSeries(S, exId, formula).forEach((p) => { if (!best || p.y > best.est) best = { est: p.y, w: p.w, r: p.r, d: p.d, t: p.t }; });
  return best;
}

/* ---- exercise catégorisation label (english body parts go to fa via map) ---- */
export const BP_FA = {
  waist: 'میانه', 'upper legs': 'پایین‌تنه', back: 'پشت', 'lower legs': 'ساق',
  chest: 'سینه', 'upper arms': 'بازو', cardio: 'هوازی', shoulders: 'شانه',
  'lower arms': 'ساعد', neck: 'گردن',
};
export const EQ_FA = {
  'body weight': 'وزن بدن', cable: 'کابل', 'leverage machine': 'دستگاه', assisted: 'کمکی',
  'medicine ball': 'توپ پزشکی', 'stability ball': 'توپ تعادل', band: 'کش', barbell: 'هالتر',
  rope: 'طناب', dumbbell: 'دمبل', 'ez barbell': 'هالتر EZ', 'sled machine': 'دستگاه سورتمه',
  'upper body ergometer': 'ارگومتر', kettlebell: 'کتل‌بل', 'olympic barbell': 'هالتر المپیک',
  weighted: 'وزنه‌دار', 'bosu ball': 'توپ بوسو', 'resistance band': 'کش مقاومتی', roller: 'غلتک',
  'skierg machine': 'دستگاه اسکی', hammer: 'پتک', 'smith machine': 'دستگاه اسمیت',
  'wheel roller': 'چرخ', 'stationary bike': 'دوچرخه ثابت', tire: 'لاستیک', 'trap bar': 'هالتر ذوزنقه',
  'elliptical machine': 'الپتیکال', 'stepmill machine': 'دستگاه پله',
};
