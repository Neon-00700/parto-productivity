import React, { useState, useEffect, useMemo } from 'react';
import {
  ActivityIcon, PlusIcon, TrashIcon, PlayIcon, StopIcon, XIcon, ClockIcon, EditIcon,
} from '../icons';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import EmptyState from '../Common/EmptyState';
import ConfirmDialog from '../Common/ConfirmDialog';
import { useProgramming } from '../../hooks/useProgramming';
import { useTranslation } from '../../hooks/useTranslation';
import { todayKey, fmtShort, localizeDigits, minutesToHuman } from '../../utils/dateUtils';
import { ACTIVITY_TYPES, labelOf, parseDuration, formatDuration, newActivity } from '../../data/programming/model';
import toast from 'react-hot-toast';

export default function Activities() {
  const { t, lang } = useTranslation();
  const {
    technologies, projects, activities, timer,
    addActivity, updateActivity, deleteActivity, startTimer, stopTimer, cancelTimer, tickTimer,
  } = useProgramming();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [now, setNow] = useState(Date.now());

  // live ticking for the running timer (UI-only; storage holds startedAt)
  useEffect(() => {
    if (!timer) return undefined;
    const iv = setInterval(() => { setNow(Date.now()); tickTimer(); }, 1000);
    return () => clearInterval(iv);
  }, [timer, tickTimer]);

  const elapsedSec = timer ? Math.max(0, Math.floor((now - new Date(timer.startedAt).getTime()) / 1000)) + (timer.accumulated || 0) * 60 : 0;

  const openNew = (preset = {}) => {
    setForm(newActivity({ date: todayKey(), technologyId: preset.technologyId || '', projectId: preset.projectId || '', ...preset }));
    setModal('new');
  };
  const openEdit = (a) => { setForm({ ...a, durationText: formatDuration(a.minutes, 'en') }); setModal(a); };

  const submit = (e) => {
    e.preventDefault();
    const mins = parseDuration(form.durationText);
    if (!mins) { toast.error(t('prog.durationRequired')); return; }
    const payload = {
      ...form, minutes: mins,
      technologyId: form.technologyId || '', projectId: form.projectId || '',
      durationText: undefined,
    };
    if (modal === 'new') { addActivity(payload); toast.success(t('prog.activityAdded')); }
    else { updateActivity(modal.id, payload); toast.success(t('prog.activityUpdated')); }
    setModal(null);
  };

  const onStop = () => {
    const minutes = stopTimer();
    if (minutes <= 0) { toast.error(t('prog.durationRequired')); return; }
    addActivity({
      date: todayKey(), minutes,
      type: timer.type || 'coding',
      technologyId: timer.technologyId || '',
      projectId: timer.projectId || '',
      notes: '',
    });
    toast.success(t('prog.activityAdded'));
  };

  const startQuickTimer = () => startTimer({ type: 'coding', technologyId: '', projectId: '' });

  // group by date buckets
  const groups = useMemo(() => {
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yesterday = y.toISOString().slice(0, 10);
    const week = new Set();
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); week.add(d.toISOString().slice(0, 10)); }
    const buckets = { [todayKey()]: [], [yesterday]: [] };
    [...activities].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).forEach((a) => {
      const key = a.date === todayKey() ? todayKey() : a.date === yesterday ? yesterday : a.date;
      (buckets[key] = buckets[key] || []).push(a);
    });
    return Object.entries(buckets).filter(([, v]) => v.length);
  }, [activities]);

  const dayLabel = (d) => d === todayKey() ? t('prog.today') : fmtShort(d, lang);

  return (
    <div className="space-y-4">
      {/* timer card */}
      {timer ? (
        <div className="card p-5 border-sky-500/30 bg-gradient-to-br from-sky-500/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="h-16 w-16 rounded-full border-4 border-sky-500/20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-500 animate-spin" style={{ animationDuration: '2s' }} />
                <ClockIcon size={22} className="text-sky-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-sky-500 font-bold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" /> {t('prog.timerRunning')}
              </div>
              <div className="text-2xl font-black tabular-nums mt-0.5">
                {localizeDigits(String(Math.floor(elapsedSec / 3600)).padStart(2, '0'), lang)}:
                {localizeDigits(String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0'), lang)}:
                {localizeDigits(String(elapsedSec % 60).padStart(2, '0'), lang)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {labelOf(ACTIVITY_TYPES, timer.type, lang)}
                {timer.technologyId && ` · ${technologies.find((x) => x.id === timer.technologyId)?.name || ''}`}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button variant="primary" onClick={onStop} className="!bg-emerald-500 hover:!bg-emerald-600"><StopIcon size={14} /> {t('prog.stopTimer')}</Button>
              <Button variant="ghost" onClick={cancelTimer} className="!py-1.5"><XIcon size={14} /> {t('prog.cancelTimer')}</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold">{t('prog.timerHint')}</div>
          </div>
          <div className="flex gap-2">
            <Button onClick={startQuickTimer} className="!bg-emerald-500 hover:!bg-emerald-600 shrink-0"><PlayIcon size={14} /> {t('prog.startTimer')}</Button>
            <Button variant="soft" onClick={() => openNew()} className="shrink-0"><PlusIcon size={14} /> {t('prog.logActivity')}</Button>
          </div>
        </div>
      )}

      {/* activity list grouped by day */}
      {activities.length === 0 ? (
        <EmptyState message={t('prog.noActivities')} icon={<span className="h-16 w-16 rounded-3xl bg-sky-500/10 text-sky-500 flex items-center justify-center"><ActivityIcon size={30} /></span>}
          action={<Button onClick={() => openNew()}><PlusIcon size={15} /> {t('prog.logActivity')}</Button>} />
      ) : (
        <div className="space-y-4">
          {groups.map(([day, items]) => (
            <div key={day}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-sm">{dayLabel(day)}</h3>
                <span className="text-xs text-slate-400 tabular-nums">
                  {minutesToHuman(items.reduce((s, a) => s + (Number(a.minutes) || 0), 0), lang, t)}
                </span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="card divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3.5 group">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">
                        {a.technologyId
                          ? `${(technologies.find((x) => x.id === a.technologyId) || {}).name || ""} · ${labelOf(ACTIVITY_TYPES, a.type, lang)}`
                          : labelOf(ACTIVITY_TYPES, a.type, lang)}
                      </div>
                      {a.projectId && (
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {projects.find((p) => p.id === a.projectId)?.name}
                        </div>
                      )}
                      {a.notes && <div className="text-xs text-slate-400 truncate mt-0.5">{a.notes}</div>}
                    </div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0 tabular-nums">{formatDuration(a.minutes, lang)}</span>
                    <button className="p-1.5 rounded-lg text-slate-300 group-hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0" onClick={() => openEdit(a)}><EditIcon size={13} /></button>
                    <button className="p-1.5 rounded-lg text-slate-300 group-hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0" onClick={() => setConfirmDel(a.id)}><TrashIcon size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('prog.logActivity') : t('common.edit')}>
        {form && (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('prog.duration')} *</label>
                <input autoFocus className="input tabular-nums" value={form.durationText || ''} onChange={(e) => setForm({ ...form, durationText: e.target.value })} placeholder="2h 30m" />
                <p className="text-[10px] text-slate-400 mt-1">{t('prog.durationHint')}</p>
              </div>
              <div>
                <label className="label">{t('common.date')}</label>
                <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">{t('prog.activityType')}</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {ACTIVITY_TYPES.map((x) => <option key={x.id} value={x.id}>{x[lang]}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('prog.technology')} <span className="text-slate-300">({t('prog.optional')})</span></label>
                <select className="input" value={form.technologyId} onChange={(e) => setForm({ ...form, technologyId: e.target.value })}>
                  <option value="">{t('prog.selectTechnology')}</option>
                  {technologies.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('prog.project')} <span className="text-slate-300">({t('prog.optional')})</span></label>
                <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  <option value="">{t('prog.selectProject')}</option>
                  {projects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">{t('prog.activityNotes')}</label>
              <textarea rows={2} className="input resize-none" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
              <Button type="submit">{t('common.save')}</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={() => { deleteActivity(confirmDel); setConfirmDel(null); toast.success(t('prog.activityDeleted')); }} />
    </div>
  );
}
