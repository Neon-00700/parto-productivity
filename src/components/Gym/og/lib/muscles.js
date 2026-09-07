// Which muscles an exercise trains, and how hard — the data behind the muscle map.
// Ported from openGym's muscles.js, with Persian display names for fa.
import { EXIDX } from './exercises.js';

// Muscles the map can shade, in head-to-toe order.
export const MUSCLES = [
  'trapezius', 'deltoids', 'chest', 'upper-back', 'serratus',
  'biceps', 'triceps', 'forearm',
  'abs', 'obliques', 'lower-back',
  'gluteal', 'quadriceps', 'hamstring', 'adductors', 'hip-flexors',
  'calves', 'tibialis',
];

// Drawn as the silhouette, never shaded.
export const INERT = ['head', 'hair', 'neck', 'hands', 'feet', 'knees', 'ankles'];

export const MUSCLE_NAME = {
  trapezius: 'Traps', deltoids: 'Shoulders', chest: 'Chest', 'upper-back': 'Upper back',
  serratus: 'Serratus', biceps: 'Biceps', triceps: 'Triceps', forearm: 'Forearms',
  abs: 'Abs', obliques: 'Obliques', 'lower-back': 'Lower back', gluteal: 'Glutes',
  quadriceps: 'Quads', hamstring: 'Hamstrings', adductors: 'Adductors',
  'hip-flexors': 'Hip flexors', calves: 'Calves', tibialis: 'Shins',
};

export const MUSCLE_FA = {
  trapezius: 'ذوزنقه', deltoids: 'سرشانه', chest: 'سینه', 'upper-back': 'پشت بالا',
  serratus: 'دندانه‌ای', biceps: 'جلو بازو', triceps: 'پشت بازو', forearm: 'ساعد',
  abs: 'شکم', obliques: 'مایل', 'lower-back': 'پشت کمر', gluteal: 'باسن',
  quadriceps: 'چهارسر ران', hamstring: 'همسترینگ', adductors: 'داخل ران',
  'hip-flexors': 'فلکسور ران', calves: 'ساق', tibialis: 'نازک‌نی',
};

const ALIAS = {
  abs: 'abs', pectorals: 'chest', biceps: 'biceps', glutes: 'gluteal', delts: 'deltoids',
  triceps: 'triceps', 'upper back': 'upper-back', lats: 'upper-back', calves: 'calves',
  quads: 'quadriceps', forearms: 'forearm', hamstrings: 'hamstring', spine: 'lower-back',
  traps: 'trapezius', adductors: 'adductors', 'serratus anterior': 'serratus',
  abductors: 'gluteal', 'levator scapulae': 'trapezius',
  shoulders: 'deltoids', deltoids: 'deltoids', 'rear deltoids': 'deltoids',
  'rotator cuff': 'deltoids', quadriceps: 'quadriceps', core: 'abs', abdominals: 'abs',
  'lower abs': 'abs', chest: 'chest', 'upper chest': 'chest', 'hip flexors': 'hip-flexors',
  obliques: 'obliques', 'lower back': 'lower-back', rhomboids: 'upper-back',
  trapezius: 'trapezius', back: 'upper-back', 'latissimus dorsi': 'upper-back',
  brachialis: 'biceps', soleus: 'calves', shins: 'tibialis', wrists: 'forearm',
  'wrist flexors': 'forearm', 'wrist extensors': 'forearm', 'grip muscles': 'forearm',
  groin: 'adductors', 'inner thighs': 'adductors',
};

const BY_BODYPART = {
  chest: { chest: 1 },
  back: { 'upper-back': 0.75, 'lower-back': 0.25 },
  shoulders: { deltoids: 1 },
  'upper arms': { biceps: 0.5, triceps: 0.5 },
  'lower arms': { forearm: 1 },
  waist: { abs: 0.7, obliques: 0.3 },
  'upper legs': { quadriceps: 0.4, hamstring: 0.35, gluteal: 0.25 },
  'lower legs': { calves: 0.8, tibialis: 0.2 },
  neck: { trapezius: 1 },
  cardio: {},
};

const SECONDARY = 0.4;

export function musclesOf(ex) {
  if (!ex) return {};
  const out = {};
  const add = (name, w) => {
    const slug = ALIAS[String(name || '').toLowerCase().trim()];
    if (slug) out[slug] = Math.max(out[slug] || 0, w);
  };
  add(ex.tg, 1);
  (ex.sm || []).forEach((m) => add(m, SECONDARY));
  if (!Object.keys(out).length) Object.assign(out, BY_BODYPART[ex.bp] || {});
  return out;
}

export function loadOf(items) {
  const load = {};
  items.forEach(({ id, sets }) => {
    if (!sets) return;
    const m = musclesOf(EXIDX[id]);
    for (const slug in m) load[slug] = (load[slug] || 0) + m[slug] * sets;
  });
  return load;
}

export const loadOfWorkouts = (workouts, pick) =>
  loadOf((workouts || []).flatMap((w) =>
    (w.entries || []).map((e) => ({ id: e.id, sets: (e.sets || []).filter((s) => s.done && (!pick || pick(s))).length }))));

export const loadOfRoutine = (routine) =>
  loadOf((routine?.ex || []).map((c) => ({ id: c.id, sets: c.sets || 1 })));

export const loadOfActive = (active) =>
  loadOf((active?.entries || []).map((e) => ({ id: e.id, sets: (e.sets || []).filter((s) => s.done).length })));

export function levelsOf(load) {
  const max = Math.max(0, ...MUSCLES.map((m) => load[m] || 0));
  const lv = {};
  MUSCLES.forEach((m) => {
    const v = load[m] || 0;
    lv[m] = !v ? 0 : max <= 0 ? 0 : Math.max(1, Math.min(4, Math.ceil((v / max) * 4)));
  });
  return lv;
}

export function rankOf(load) {
  const worked = MUSCLES.filter((m) => (load[m] || 0) > 0).sort((a, b) => load[b] - load[a]);
  const missed = MUSCLES.filter((m) => !(load[m] > 0));
  return { worked, missed };
}
