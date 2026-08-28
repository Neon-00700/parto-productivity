import React, { useMemo, useState, useEffect } from 'react';
import { FiPlus, FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';
import MonthView from './MonthView';
import WeekView from './WeekView';
import EventModal from './EventModal';
import Button from '../Common/Button';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { calLib, eventsOn } from './calendarUtils';
import { dateKey, todayKey, fmtDate, fmtTime, addDays, localizeDigits } from '../../utils/dateUtils';
import { safeGet, safeSet } from '../../utils/storageUtils';

function DayList({ dateStr, events, onEdit, t, lang }) {
  const d = new Date(dateStr + 'T00:00');
  const evs = eventsOn(events, d);
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-sm">{t('calendar.eventsOn')} {fmtDate(d, lang, 'EEEE، d MMMM')}</h3>
      {evs.length === 0 ? (
        <p className="text-xs text-slate-400 py-4">{t('calendar.noEventsDay')}</p>
      ) : (
        evs.map((e) => (
          <button key={e.id} onClick={() => onEdit(e)} className="w-full flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-start hover:border-primary/50 transition-all">
            <span className="mt-1 h-3 w-3 rounded-full shrink-0" style={{ background: e.color }} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{e.title}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <FiClock size={10} />
                {e.allDay ? t('calendar.allDay') : `${fmtTime(e.startTime || '', lang)} – ${fmtTime(e.endTime || '', lang)}`}
                {e.repeat !== 'none' && ` · 🔁 ${t(`calendar.${e.repeat}`)}`}
              </div>
              {e.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.description}</p>}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

export default function CalendarPage() {
  const { data } = useApp();
  const { t, lang } = useTranslation();
  const df = calLib(lang);
  const events = data.calendar;

  const [view, setView] = useState('month');
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(todayKey());
  const [modal, setModal] = useState(null); // {event} | {new:true}

  // reminders: check every 30s for events needing notification
  useEffect(() => {
    const OFFSETS = { '15min': 15 * 60000, '1hour': 3600000, '1day': 86400000 };
    const check = () => {
      try {
        if (!('Notification' in window) || Notification.permission !== 'granted' || !data.settings.notifications) return;
        const now = Date.now();
        events.forEach((e) => {
          if (!e.reminder || e.reminder === 'none') return;
          const timeStr = e.allDay ? '09:00' : e.startTime || '09:00';
          const evTime = new Date(`${e.date}T${timeStr}`).getTime();
          const remindAt = evTime - OFFSETS[e.reminder];
          const flag = `parto_reminded_${e.id}`;
          if (now >= remindAt && now < evTime && !safeGet(flag)) {
            safeSet(flag, true);
            new Notification(t('calendar.title'), { body: `⏰ ${e.title}`, icon: '/icon.svg' });
          }
        });
      } catch (err) { console.warn(err); }
    };
    check();
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  }, [events, data.settings.notifications, t]);

  const upcoming = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(new Date(), i);
      eventsOn(events, d).forEach((e) => list.push({ ...e, occDate: dateKey(d) }));
    }
    return list.slice(0, 10);
  }, [events]);

  const move = (dir) => {
    if (view === 'month') setCursor((c) => df.addMonths(c, dir));
    else if (view === 'week') setCursor((c) => df.addWeeks(c, dir));
    else {
      const d = addDays(new Date(selected + 'T00:00'), dir);
      setSelected(dateKey(d));
      setCursor(d);
    }
  };

  const headerLabel = view === 'day'
    ? fmtDate(selected, lang, 'd MMMM yyyy')
    : localizeDigits(df.format(cursor, 'MMMM yyyy'), lang);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-2xl bg-slate-200/70 dark:bg-slate-900 p-1">
            {['month', 'week', 'day'].map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`btn !py-1.5 !text-xs ${view === v ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500'}`}>
                {t(`calendar.${v}View`)}
              </button>
            ))}
          </div>
          <Button onClick={() => setModal({ new: true })}><FiPlus /> {t('calendar.addEvent')}</Button>
          <button className="btn-ghost !py-1.5 !text-xs" onClick={() => { setCursor(new Date()); setSelected(todayKey()); }}>{t('common.today')}</button>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => move(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rtl:rotate-180"><FiChevronLeft /></button>
            <h2 className="font-extrabold">{headerLabel}</h2>
            <button onClick={() => move(1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rtl:rotate-180"><FiChevronRight /></button>
          </div>

          {view === 'month' && <MonthView cursor={cursor} events={events} selected={selected} onSelect={setSelected} />}
          {view === 'week' && <WeekView cursor={cursor} events={events} selected={selected} onSelect={setSelected} />}
          {view === 'day' && <DayList dateStr={selected} events={events} onEdit={(e) => setModal({ event: e })} t={t} lang={lang} />}
        </div>

        {view !== 'day' && (
          <div className="card p-4">
            <DayList dateStr={selected} events={events} onEdit={(e) => setModal({ event: e })} t={t} lang={lang} />
            <Button variant="soft" className="mt-3 !text-xs" onClick={() => setModal({ new: true })}><FiPlus /> {t('calendar.addEvent')}</Button>
          </div>
        )}
      </div>

      {/* upcoming sidebar */}
      <div className="card p-4 h-fit">
        <h3 className="font-bold text-sm mb-3">🗓️ {t('calendar.upcoming')}</h3>
        {upcoming.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">{t('dashboard.noEvents')}</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((e, i) => (
              <button key={`${e.id}-${e.occDate}-${i}`} onClick={() => setModal({ event: events.find((x) => x.id === e.id) })}
                className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-start transition-colors">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{e.title}</div>
                  <div className="text-[10px] text-slate-400">
                    {fmtDate(e.occDate, lang, 'EEEE d MMMM')}{!e.allDay && e.startTime ? ` · ${fmtTime(e.startTime, lang)}` : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <EventModal open={!!modal} onClose={() => setModal(null)} event={modal?.event || null} defaultDate={selected} />
    </div>
  );
}
