// University module — normalized, database-ready data model.
// IDs are stable (uuid). All references go by id (no duplicated names).
// Designed to later sync to Calendar / Dashboard / Tasks / Supabase.

export const RECURRENCE = {
  EVERY: 'every',
  WEEK_A: 'weekA',
  WEEK_B: 'weekB',
};

export const RECURRENCE_LIST = [
  { id: RECURRENCE.EVERY },
  { id: RECURRENCE.WEEK_A },
  { id: RECURRENCE.WEEK_B },
];

export const ASSIGNMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
};

export const ASSIGNMENT_STATUS_LIST = [
  { id: ASSIGNMENT_STATUS.PENDING },
  { id: ASSIGNMENT_STATUS.COMPLETED },
];

// Reference week: the week tagged as A. Alternates from there each week.
export const REFERENCE_WEEK = { A: 'A', B: 'B' };

// ---- factories ----
export function newCourse(p = {}) {
  return {
    id: p.id || crypto.randomUUID(),
    name: p.name || '',
    teacher: p.teacher || '',
    code: p.code || '',
    notes: p.notes || '',
    createdAt: new Date().toISOString(),
  };
}

export function newClass(p = {}) {
  return {
    id: p.id || crypto.randomUUID(),
    courseId: p.courseId || '',
    dayOfWeek: p.dayOfWeek ?? 6, // 0=Sun..6=Sat
    startTime: p.startTime || '09:00',
    endTime: p.endTime || '11:00',
    recurrence: p.recurrence || RECURRENCE.EVERY,
    location: p.location || '',
    teacher: p.teacher || '',
    notes: p.notes || '',
    createdAt: new Date().toISOString(),
  };
}

export function newExam(p = {}) {
  return {
    id: p.id || crypto.randomUUID(),
    courseId: p.courseId || '',
    date: p.date || '',
    time: p.time || '',
    location: p.location || '',
    notes: p.notes || '',
    createdAt: new Date().toISOString(),
  };
}

export function newAssignment(p = {}) {
  return {
    id: p.id || crypto.randomUUID(),
    courseId: p.courseId || '',
    title: p.title || '',
    dueDate: p.dueDate || '',
    status: p.status || ASSIGNMENT_STATUS.PENDING,
    notes: p.notes || '',
    createdAt: new Date().toISOString(),
  };
}

// ---- Week A/B computation ----
// ISO week number (Mon-based, UTC-safe for local dates).
function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const fd = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fd + 3);
  const week1 = Math.round((d - firstThursday) / (7 * 86400000));
  return week1 + 1;
}

// Absolute week index from a fixed epoch (Mon-based) — stable, monotonic.
function absoluteWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return Math.floor(d.getTime() / (7 * 86400000));
}

// Returns 'A' | 'B' for the given date based on the reference week.
export function weekLabelFor(date, reference) {
  const ref = reference || {};
  const refDate = ref.date ? new Date(ref.date + 'T00:00:00') : null;
  const refWeek = ref.week || REFERENCE_WEEK.A;
  if (!refDate || Number.isNaN(refDate.getTime())) return REFERENCE_WEEK.A;
  const diff = absoluteWeek(new Date(date)) - absoluteWeek(refDate);
  const isEven = Math.abs(diff) % 2 === 0;
  return isEven ? refWeek : (refWeek === REFERENCE_WEEK.A ? REFERENCE_WEEK.B : REFERENCE_WEEK.A);
}

export function currentWeekLabel(reference) {
  return weekLabelFor(new Date(), reference);
}

export { isoWeekNumber };
