// Shared helpers for the University module (no React state — pure functions).
import { RECURRENCE, currentWeekLabel } from '../../data/university/model';
import { dateKey, todayKey, fmtShort, fmtWeekday } from '../../utils/dateUtils';

export const DAY_KEYS_FA = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri']; // index = JS getDay mapped

export function dayKey(jsDay) {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][jsDay];
}

export function classDayKey(cls) {
  return dayKey(cls.dayOfWeek ?? new Date().getDay());
}

// Does a class happen on the given JS-weekday + week label?
export function classHappensOn(cls, jsDay, weekLabel) {
  if ((cls.dayOfWeek ?? 6) !== jsDay) return false;
  if (cls.recurrence === RECURRENCE.EVERY) return true;
  return cls.recurrence === (weekLabel === 'A' ? RECURRENCE.WEEK_A : RECURRENCE.WEEK_B);
}

// Classes for a given Date, honoring Week A/B.
export function classesOnDate(classes, d, reference) {
  const label = currentWeekLabel(reference);
  return classes
    .filter((c) => classHappensOn(c, d.getDay(), label))
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
}

export function todayClasses(classes, reference) {
  return classesOnDate(classes, new Date(), reference);
}

// Full week schedule (7 days) for a week label.
export function weekSchedule(classes, weekLabel) {
  const order = [6, 0, 1, 2, 3, 4, 5]; // Sat..Fri
  return order.map((jsDay) => ({
    jsDay,
    items: classes
      .filter((c) => classHappensOn(c, jsDay, weekLabel))
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
  }));
}

export function courseName(courses, courseId) {
  return courses.find((c) => c.id === courseId)?.name || '';
}

export function upcomingAssignments(assignments, limit = 3) {
  const t = todayKey();
  return assignments
    .filter((a) => a.status !== 'completed' && a.dueDate && a.dueDate >= t)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit);
}

export function nextExam(exams) {
  const t = todayKey();
  const list = exams
    .filter((e) => e.date && e.date >= t)
    .sort((a, b) => (a.date + (a.time || ')).localeCompare(b.date + (b.time || ')));
  return list.length ? list[0] : null;
}

export function pastExams(exams) {
  const t = todayKey();
  return exams.filter((e) => e.date && e.date < t).sort((a, b) => b.date.localeCompare(a.date));
}

export function upcomingExams(exams) {
  const t = todayKey();
  return exams.filter((e) => e.date && e.date >= t).sort((a, b) => a.date.localeCompare(b.date));
}

export function daysUntil(dateStr) {
  const t = new Date(todayKey() + 'T00:00:00');
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d - t) / 86400000);
}

export function dueLabel(dateStr, lang, t) {
  const n = daysUntil(dateStr);
  if (n < 0) return t('uni.overdue');
  if (n === 0) return t('uni.dueToday');
  return t('uni.daysLeft', { n: String(n) });
}

export { fmtShort, fmtWeekday, dateKey };
