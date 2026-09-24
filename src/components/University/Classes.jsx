import React, { useState } from 'react';
import {
  ClassIcon, PlusIcon, EditIcon, TrashIcon, LocationIcon, UserIcon, ChevronDownIcon,
} from '../icons';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import EmptyState from '../Common/EmptyState';
import ConfirmDialog from '../Common/ConfirmDialog';
import Select from '../Common/Select';
import { useUniversity } from '../../hooks/useUniversity';
import { useTranslation } from '../../hooks/useTranslation';
import { weekSchedule, courseName } from './uniUtils';
import { RECURRENCE, RECURRENCE_LIST, REFERENCE_WEEK, currentWeekLabel, weekLabelFor } from '../../data/university/model';
import { fmtTime, localizeDigits, addDays, fmtWeekday } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const DAY_KEYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
const WEEKDAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']; // index = JS getDay()

export default function Classes() {
  const { t, lang } = useTranslation();
  const { courses, classes, reference, addClass, updateClass, deleteClass, setReferenceWeek } = useUniversity();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [refOpen, setRefOpen] = useState(false);

  const currentLabel = currentWeekLabel(reference);
  const [viewLabel, setViewLabel] = useState(currentLabel);
  const schedule = weekSchedule(classes, viewLabel);

  const openNew = () => {
    setForm({ courseId: courses[0]?.id || '', dayOfWeek: 6, startTime: '09:00', endTime: '11:00', recurrence: RECURRENCE.EVERY, location: '', teacher: '', notes: '' });
    setModal('new');
  };
  const openEdit = (c) => { setForm({ ...c }); setModal(c); };

  const submit = (e) => {
    e.preventDefault();
    if (!form.courseId) { toast.error(t('uni.noCourseSelected')); return; }
    const payload = { ...form, teacher: form.teacher || '', location: form.location || '' };
    if (modal === 'new') { addClass(payload); toast.success(t('uni.classAdded')); }
    else { updateClass(modal.id, payload); toast.success(t('common.updated')); }
    setModal(null);
  };

  const courseOptions = courses.map((c) => ({ value: c.id, label: c.name }));
  const dayOptions = DAY_KEYS.map((k, i) => ({ value: (i + 6) % 7, label: t('uni.' + WEEKDAY_KEYS[(i + 6) % 7]) }));
  const recurrenceOptions = RECURRENCE_LIST.map((r) => ({ value: r.id, label: t(`uni.${r.id === RECURRENCE.EVERY ? 'everyWeek' : r.id === RECURRENCE.WEEK_A ? 'weekAOnly' : 'weekBOnly'}`) }));
  const weekOptions = [{ value: REFERENCE_WEEK.A, label: t('uni.weekA') }, { value: REFERENCE_WEEK.B, label: t('uni.weekB') }];

  // saturday of the current week for the reference date picker
  const saturday = (() => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    return addDays(d, (6 - d.getDay() + 7) % 7);
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {[REFERENCE_WEEK.A, REFERENCE_WEEK.B].map((w) => (
            <button
              key={w}
              onClick={() => setViewLabel(w)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all
                ${viewLabel === w ? 'bg-primary/15 text-primary' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              {t(`uni.week${w}`)}
            </button>
          ))}
          {viewLabel !== currentLabel && (
            <span className="text-[11px] text-slate-400">({t('uni.today')}: {t(`uni.week${currentLabel}`)})</span>
          )}
        </div>
        <Button onClick={openNew} className="shrink-0" disabled={!courses.length}>
          <PlusIcon size={15} /> {t('uni.addClass')}
        </Button>
      </div>

      {!courses.length && (
        <div className="card p-4 flex items-center gap-2.5 text-sm text-amber-500 bg-amber-500/10 border-amber-500/20">
          <span>{t('uni.noCourseSelected')}</span>
        </div>
      )}

      {classes.length === 0 ? (
        <EmptyState
          message={t('uni.noClasses')}
          icon={<span className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center"><ClassIcon size={30} /></span>}
          action={courses.length ? <Button onClick={openNew}><PlusIcon size={15} /> {t('uni.addClass')}</Button> : null}
        />
      ) : (
        <div className="space-y-3">
          {schedule.map(({ jsDay, items }) => (
            <div key={jsDay} className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-sm">{t('uni.' + WEEKDAY_KEYS[jsDay])}</h3>
                <span className="text-[11px] text-slate-400">{localizeDigits(String(items.length), lang)} {t('uni.hasClasses', { n: '' }).trim() || ''}</span>
              </div>
              {items.length === 0 ? (
                <p className="text-xs text-slate-400 py-1.5">{t('uni.noClassesShort')}</p>
              ) : (
                <div className="space-y-1.5">
                  {items.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 group rounded-xl p-2 -mx-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="w-16 shrink-0 text-center">
                        <div className="text-sm font-bold tabular-nums">{fmtTime(c.startTime, lang)}</div>
                        <div className="text-[11px] text-slate-400 tabular-nums">{fmtTime(c.endTime, lang)}</div>
                      </div>
                      <div className="w-0.5 self-stretch rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{courseName(courses, c.courseId)}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 truncate">
                          {c.location && <span className="flex items-center gap-1"><LocationIcon size={11} /> {c.location}</span>}
                          {c.teacher && <span className="flex items-center gap-1"><UserIcon size={11} /> {c.teacher}</span>}
                        </div>
                      </div>
                      {c.recurrence !== RECURRENCE.EVERY && (
                        <span className="chip bg-primary/10 text-primary shrink-0">{t(`uni.week${c.recurrence === RECURRENCE.WEEK_A ? 'A' : 'B'}`)}</span>
                      )}
                      <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800"><EditIcon size={13} /></button>
                        <button onClick={() => setConfirm(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><TrashIcon size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* reference week fixer */}
      <div className="card p-4">
        <button onClick={() => setRefOpen((o) => !o)} className="w-full flex items-center justify-between gap-2">
          <span className="text-sm font-bold">{t('uni.refWeekLabel')}: {t(`uni.week${currentLabel}`)}</span>
          <ChevronDownIcon size={15} className={`text-slate-400 transition-transform ${refOpen ? 'rotate-180' : ''}`} />
        </button>
        {refOpen && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-fade-in">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('uni.refWeekHint')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('uni.refWeekLabel')}</label>
                <Select
                  value={reference.week || REFERENCE_WEEK.A}
                  onChange={(v) => setReferenceWeek({ week: v })}
                  options={weekOptions}
                  placeholder={t('uni.refWeekLabel')}
                />
              </div>
              <div>
                <label className="label">{t('common.date')}</label>
                <input
                  type="date"
                  className="input"
                  value={reference.date || ''}
                  onChange={(e) => setReferenceWeek({ date: e.target.value })}
                />
              </div>
            </div>
            <Button variant="soft" className="w-full" onClick={() => setReferenceWeek({ date: saturday.toISOString().slice(0, 10) })}>
              {t('uni.refWeekLabel')}: {fmtWeekday(saturday, lang)}
            </Button>
          </div>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('uni.addClass') : t('uni.editClass')}>
        {form && (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">{t('uni.course')} *</label>
              <Select value={form.courseId} onChange={(v) => setForm({ ...form, courseId: v })} options={courseOptions} placeholder={t('uni.noCourseSelected')} />
            </div>
            <div>
              <label className="label">{t('uni.dayOfWeek')}</label>
              <Select value={form.dayOfWeek} onChange={(v) => setForm({ ...form, dayOfWeek: Number(v) })} options={dayOptions} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('uni.startTime')}</label>
                <input type="time" className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('uni.endTime')}</label>
                <input type="time" className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">{t('uni.recurrence')}</label>
              <Select value={form.recurrence} onChange={(v) => setForm({ ...form, recurrence: v })} options={recurrenceOptions} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('uni.location')} <span className="text-slate-400">({t('common.optional')})</span></label>
                <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('uni.teacher')} <span className="text-slate-400">({t('common.optional')})</span></label>
                <input className="input" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
              <Button type="submit">{t('common.save')}</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { deleteClass(confirm.id); toast.success(t('common.deleted')); }}
      />
    </div>
  );
}
