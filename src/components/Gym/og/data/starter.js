import { EXDB } from '../lib/exercises-data.js';
import { uid } from '../lib/util.js';

// Resolve a canonical exercise by a name keyword. Falls back to null if the
// dataset lacks it, so a starter plan never crashes on a renamed entry.
function id(kw) {
  const e = EXDB.find((x) => x.n.toLowerCase().includes(kw));
  return e ? e.id : null;
}
function cfg(kw, patch) {
  const e = EXDB.find((x) => x.n.toLowerCase().includes(kw));
  const base = e ? { id: e.id } : { id: kw };
  return { ...base, sets: 3, reps: 10, weight: 0, mode: 'reps', ...patch };
}

export const STARTER_ROUTINES = [
  {
    name: 'Push',
    emoji: '💪',
    ex: [
      cfg('barbell bench press', { sets: 3, reps: 8, weight: 60 }),
      cfg('overhead press', { sets: 3, reps: 8, weight: 35 }),
      cfg('chest dip', { sets: 3, reps: 8, bodyweight: true }),
      cfg('triceps pushdown', { sets: 3, reps: 12, weight: 25 }),
    ],
  },
  {
    name: 'Pull',
    emoji: '🏋️',
    ex: [
      cfg('barbell deadlift', { sets: 3, reps: 5, weight: 80 }),
      cfg('barbell row', { sets: 3, reps: 8, weight: 50 }),
      cfg('pull-up', { sets: 3, reps: 6, bodyweight: true }),
      cfg('barbell curl', { sets: 3, reps: 10, weight: 15 }),
    ],
  },
  {
    name: 'Legs',
    emoji: '🦵',
    ex: [
      cfg('barbell squat', { sets: 3, reps: 6, weight: 70 }),
      cfg('leg press', { sets: 3, reps: 10, weight: 120 }),
      cfg('barbell lunge', { sets: 3, reps: 8, weight: 30 }),
      cfg('standing calf raise', { sets: 3, reps: 15, weight: 40 }),
    ],
  },
];

// Build a routines array + week mapping (0=Sun..6=Sat). Monday=1, Wednesday=3, Friday=5.
export function buildStarterPlan() {
  const routines = STARTER_ROUTINES.map((r) => ({ id: uid(), name: r.name, emoji: r.emoji, ex: r.ex }));
  const week = { 1: routines[0].id, 3: routines[1].id, 5: routines[2].id };
  return { routines, week, dayPlan: {}, exWeights: {} };
}
