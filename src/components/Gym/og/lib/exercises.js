// Helpers over the exercise database (EXDB). No media, no i18n, no API.
// Cards are keyed by `id`; the catalogue is read only — user-created exercises
// are held in state.customEx and merged here so every id lookup keeps working.
import { EXDB } from './exercises-data.js';

export { EXDB };

export const EXIDX = {};
EXDB.forEach((e) => { EXIDX[e.id] = e; });

export const BODYPARTS = [...new Set(EXDB.map((e) => e.bp))].sort();

// Equipment options present in a given (already filtered) list, most common first.
export function equipmentOf(list) {
  const c = {};
  list.forEach((e) => { if (e.eq) c[e.eq] = (c[e.eq] || 0) + 1; });
  return Object.keys(c).sort((a, b) => c[b] - c[a] || (a < b ? -1 : 1));
}

// Custom exercises are stored in synced state S.customEx and merged into the index.
let customIds = [];
export function registerCustom(list) {
  customIds.forEach((id) => delete EXIDX[id]);
  customIds = (list || []).map((e) => e.id);
  (list || []).forEach((e) => { EXIDX[e.id] = e; });
}

// Full catalogue — user exercises first so they're easy to find.
export function allExercises(state) {
  return [...(state?.customEx || []), ...EXDB];
}

export function isCardio(idOrEx) {
  return (typeof idOrEx === 'string' ? EXIDX[idOrEx] : idOrEx)?.bp === 'cardio';
}

export function isBodyweightEq(idOrEx) {
  return (typeof idOrEx === 'string' ? EXIDX[idOrEx] : idOrEx)?.eq === 'body weight';
}

// An id that no longer resolves must still render (a plan built against an older
// dataset, or a custom exercise removed on another device before sync arrived).
export function exOr(id) {
  return EXIDX[id] || { id, n: 'Unknown exercise', bp: '', tg: '', eq: '', sm: [], st: [], missing: true };
}
