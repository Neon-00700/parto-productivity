import { uid } from '../lib/util.js';

// The user asked for NO pre-filled default plan. The training section starts
// empty; the user builds their own routines and progresses with them. This
// keeps the "starter" API available for future use but returns an empty plan.
export const STARTER_ROUTINES = [];

export function buildStarterPlan() {
  return { routines: [], week: {}, dayPlan: {}, exWeights: {} };
}
