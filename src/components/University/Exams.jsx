import React, { useState } from 'react';
import { ExamIcon, PlusIcon, EditIcon, TrashIcon, LocationIcon } from '../icons';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import EmptyState from '../Common/EmptyState';
import ConfirmDialog from '../Common/ConfirmDialog';
import Select from '../Common/Select';
import DatePicker from '../Common/DatePicker';
import { useUniversity } from '../../hooks/useUniversity';
import { useTranslation } from '../../hooks/useTranslation';
import { upcomingExams, pastExams, courseName, daysUntil } from './uniUtils';
import { fmtDate, fmtTime, localizeDigits } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

export default function Exams() {
  const { t, lang } = useTranslation();
  const { courses, exams, addExam, updateExam, deleteExam } = useUniversity();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const openNew = () => { setForm({ courseId: courses[0]?.id || '', date: '', time: '', location: '', notes: '' }); setModal('new'); };
  const openEdit = (e) => { setForm({ ...e }); setModal(e); };

  const submit = (e) => {
    e.preventDefault();
    if (!form.courseId) { toast.error(t('uni.noCourseSelected')); return; }
    if (!form.date) { toast.error(t('common.requiredField')); return; }
    const payload = { ...form };
    if (modal === 'new') { addExam(payload); toast.success(t('uni.examAdded')); }
    else { updateExam(modal.id, payload); toast.success(t('common.updated')); }
    setModal(null);
  };

  const upcoming = upcomingExams(exams);
  const past = pastExams(exams);
  const courseOptions = courses.map((c) => ({ value: c.id, label: c.name }));

  const ExamRow = ({ e: x, past: isPast }) => (
    <div className="card p-3.5 flex items-center gap-3 group">
      <div className="text-center shrink-0 w-14">
        <div className="text-[11px] text-slate-400">{fmtDate(x.date, lang, 'MMM')}</div>
        <div className="text-xl font-black tabular-nums leading-none">{localizeDigits(fmtDate(x.date, lang, 'd'), lang)}</div>
      </div>
      <div className="w-0.5 self-stretch rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-bold text-sm truncate">{courseName(courses, x.courseId)}</div>
        <div className="text-xs text-slate-400 flex items-center gap-2 mt-1 flex-wrap">
          {x.time && <span className="tabular-nums">{fmtTime(x.time, lang)}</span>}
          {x.location && <span className="flex items-center gap-1"><LocationIcon size={11} /> {x.location}</span>}
          {isPast ? (
            <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-400">{t('uni.past')}</span>
          ) : (
            <span className="chip bg-amber-500/15 text-amber-600 dark:text-amber-400">{t('uni.daysLeft', { n: String(daysUntil(x.date)) })}</span>
          )}
        </div>
      </div>
      <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => openEdit(x)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800"><EditIcon size={13} /></button>
        <button onClick={() => setConfirm(x)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><TrashIcon size={13} /></button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('uni.exams')} · {upcoming.length}</p>
        <Button onClick={openNew} className="shrink-0" disabled={!courses.length}><PlusIcon size={15} /> {t('uni.addExam')}</Button>
      </div>

      {!courses.length && (
        <div className="card p-4 text-sm text-amber-500 bg-amber-500/10 border-amber-500/20">{t('uni.noCourseSelected')}</div>
      )}

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          message={t('uni.noExamsScheduled')}
          icon={<span className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center"><ExamIcon size={30} /></span>}
          action={courses.length ? <Button onClick={openNew}><PlusIcon size={15} /> {t('uni.addExam')}</Button> : null}
        />
      ) : (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">{t('uni.upcoming')}</h3>
              {upcoming.map((x) => <ExamRow key={x.id} e={x} past={false} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">{t('uni.past')}</h3>
              {past.map((x) => <ExamRow key={x.id} e={x} past />)}
            </div>
          )}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('uni.addExam') : t('uni.editExam')}>
        {form && (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">{t('uni.course')} *</label>
              <Select value={form.courseId} onChange={(v) => setForm({ ...form, courseId: v })} options={courseOptions} placeholder={t('uni.noCourseSelected')} />
            </div>
            <div>
              <label className="label">{t('uni.examDate')}</label>
              <DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('uni.examTime')} <span className="text-slate-400">({t('common.optional')})</span></label>
                <input type="time" className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('uni.location')} <span className="text-slate-400">({t('common.optional')})</span></label>
                <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">{t('common.notes')} <span className="text-slate-400">({t('common.optional')})</span></label>
              <textarea className="input min-h-20" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
        onConfirm={() => { deleteExam(confirm.id); toast.success(t('common.deleted')); }}
      />
    </div>
  );
}
