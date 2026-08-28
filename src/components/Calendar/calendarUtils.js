// Shared calendar helpers: Jalali month math for fa, Gregorian for en.
import * as dfG from 'date-fns';
import * as dfJ from 'date-fns-jalali';
import { dateKey } from '../../utils/dateUtils';

export function calLib(lang) {
  return lang === 'fa' ? dfJ : dfG;
}

export function weekStart(lang) {
  return lang === 'fa' ? 6 : 1; // Saturday for fa, Monday for en
}

// does event `ev` occur on gregorian date `d` (Date), considering repeat rules?
export function occursOn(ev, d) {
  const key = dateKey(d);
  const start = ev.date;
  if (!start) return false;
  if (key === start) return true;
  if (key < start) return false;
  if (ev.repeat === 'daily') return true;
  if (ev.repeat === 'weekly') return new Date(start + 'T00:00').getDay() === d.getDay();
  if (ev.repeat === 'monthly') return Number(start.slice(8, 10)) === d.getDate();
  return false;
}

export function eventsOn(events, d) {
  return events
    .filter((e) => occursOn(e, d))
    .sort((a, b) => (a.allDay ? '' : a.startTime || '').localeCompare(b.allDay ? '' : b.startTime || ''));
}
