// Session lifecycle for a workout. `api` = { S, update, set, lang }.
import { buildSets, todayISO, setsDoneActive } from './calc.js';
import { nextPrescription, applyPrescription, policyFor } from './progression.js';
import { uid } from './util.js';
import { gymT } from './i18n.js';

export function startFlow(api, routineId) {
  const { update, lang } = api;
  update((s) => {
    const routine = s.routines.find((r) => r.id === routineId) || null;
    const entries = routine
      ? routine.ex.map((cfg) => {
          const plan = nextPrescription(s, { ...cfg }, routine);
          return {
            id: cfg.id,
            target: { ...cfg },
            sets: applyPrescription(buildSets(s, { ...cfg, id: cfg.id }), plan),
            plan,
          };
        })
      : [];
    s.active = {
      id: uid(),
      name: routine ? routine.name : gymT(lang, 'freestyle'),
      start: Date.now(),
      routineId,
      cur: 0,
      entries,
    };
  });
}

// Confirm the working weight an exercise "earned" this session and store it for the next
// session's pre-fill. Called when an exercise's sets are all complete.
export function confirmWorkingWeight(api, entryIdx) {
  const { update } = api;
  let w = 0;
  update((s) => {
    const e = s.active?.entries?.[entryIdx];
    if (!e) return;
    const done = e.sets.filter((x) => x.done);
    const best = Math.max(0, ...done.map((x) => Number(x.w) || 0));
    w = best;
    if (e.id) s.exWeights = s.exWeights || {};
    s.exWeights[e.id] = { w: best };
    e.topW = best;
  });
  return w;
}

// Save the active session into history and clear it. Returns the saved record.
export function finishWorkout(api) {
  const { S, update } = api;
  const A = S.active;
  if (!A) return null;
  const record = {
    id: uid(),
    d: todayISO(),
    start: A.start,
    name: A.name,
    entries: A.entries.map((e) => ({
      id: e.id,
      target: e.target,
      topW: e.topW,
      sets: e.sets,
    })),
  };
  update((s) => {
    s.workouts.push(record);
    s.active = null;
  });
  return record;
}

export function discardWorkout(api) {
  const { update } = api;
  update((s) => { s.active = null; });
}

// Mark a set done, start/stop rest as the unit completes, and detect finish.
export function toggleSet(api, entryIdx, setIdx, restTrigger, setRestTrigger) {
  const { update } = api;
  update((s) => {
    const e = s.active?.entries && s.active.entries[entryIdx];
    if (!e) return;
    e.sets[setIdx].done = !e.sets[setIdx].done;
  });
  setRestTrigger((t) => (t || 0) + 1); // restart countdown after any toggle
}

export function addSet(api, entryIdx) {
  const { update } = api;
  update((s) => {
    const e = s.active?.entries?.[entryIdx];
    if (!e) return;
    const l = e.sets[e.sets.length - 1];
    const t = e.target || {};
    e.sets.push({ w: l ? l.w : (t.weight || 0), r: l ? l.r : (t.reps || 10), done: false });
  });
}

export function removeSet(api, entryIdx) {
  const { update } = api;
  update((s) => {
    const e = s.active?.entries?.[entryIdx];
    if (e && e.sets.length > 1) e.sets.pop();
  });
}

export function setField(api, entryIdx, setIdx, field, value) {
  const { update } = api;
  update((s) => {
    const e = s.active?.entries?.[entryIdx];
    if (!e) return;
    if (value == null) delete e.sets[setIdx][field];
    else e.sets[setIdx][field] = value;
  });
}

export function setActiveCur(api, idx) {
  const { update } = api;
  update((s) => { if (s.active) s.active.cur = idx; });
}
