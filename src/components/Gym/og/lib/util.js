// Small helpers for the gym module.
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
