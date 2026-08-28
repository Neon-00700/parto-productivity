import { format as formatG, parseISO, differenceInCalendarDays } from 'date-fns';
import { format as formatJ } from 'date-fns-jalali';

// ---- basic keys ----
export const dateKey = (d = new Date()) => formatG(d, 'yyyy-MM-dd');
export const todayKey = () => dateKey(new Date());
// local calendar day of an ISO timestamp (avoids UTC off-by-one)
export const isoDay = (iso) => (iso ? dateKey(new Date(iso)) : '');

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfWeekFor(lang, d = new Date()) {
  // fa week starts Saturday (6), en week starts Monday (1)
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const target = lang === 'fa' ? 6 : 1;
  while (x.getDay() !== target) x.setDate(x.getDate() - 1);
  return x;
}

export const toPersianDigits = (s) =>
  String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

export function localizeDigits(s, lang) {
  return lang === 'fa' ? toPersianDigits(s) : String(s);
}

export function pct(n, lang) {
  return lang === 'fa' ? `${toPersianDigits(n)}٪` : `${n}%`;
}

// ---- formatting (Jalali when Persian) ----
export function fmtDate(date, lang, pattern = 'd MMMM yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (Number.isNaN(d?.getTime?.())) return '';
  try {
    const out = lang === 'fa' ? formatJ(d, pattern, {}) : formatG(d, pattern);
    return lang === 'fa' ? toPersianDigits(out) : out;
  } catch {
    return '';
  }
}

export function fmtDateTime(date, lang) {
  return fmtDate(date, lang, 'd MMMM yyyy · HH:mm');
}

export function fmtShort(date, lang) {
  return fmtDate(date, lang, 'd MMM');
}

export function fmtWeekday(date, lang) {
  return fmtDate(date, lang, 'EEEE');
}

export function fmtTime(hhmm, lang) {
  return lang === 'fa' ? toPersianDigits(hhmm) : hhmm;
}

export function isOverdue(dueDate) {
  if (!dueDate) return false;
  return differenceInCalendarDays(parseISO(dueDate), new Date()) < 0;
}

export function isDueToday(dueDate) {
  if (!dueDate) return false;
  return dueDate === todayKey();
}

export function minutesToHuman(mins, lang, t) {
  const m = Math.round(mins);
  const h = Math.floor(m / 60);
  const rem = m % 60;
  let s = '';
  if (h > 0) s += `${h}${lang === 'fa' ? ' ساعت' : 'h'} `;
  s += `${rem}${lang === 'fa' ? ' دقیقه' : 'm'}`;
  return localizeDigits(s, lang);
}

// last N days as Date[] ending today
export function lastNDays(n) {
  const arr = [];
  for (let i = n - 1; i >= 0; i--) arr.push(addDays(new Date(), -i));
  return arr;
}

// day-of-week ids used for gym program (fixed keys)
export const DAY_IDS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

export function dayIdOf(date = new Date()) {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
}
