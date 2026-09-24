import React, { useState } from 'react';
import { AssignmentIcon, PlusIcon, EditIcon, TrashIcon, CheckIcon } from '../icons';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import EmptyState from '../Common/EmptyState';
import ConfirmDialog from '../Common/ConfirmDialog';
import Select from '../Common/Select';
import DatePicker from '../Common/DatePicker';
import { useUniversity } from '../../hooks/useUniversity';
import { useTranslation } from '../../hooks/useTranslation';
import { courseName, daysUntil, dueLabel } from './uniUtils';
import { ASSIGNMENT_STATUS, ASSIGNMENT_STATUS_LIST } from '../../data/university/model';
import { fmtDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

export default function Assignments() {
  const { t, lang } = useTranslation();
  const { courses, assignments, addAssignment, updateAssignment, deleteAssignment } = useUniversity();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [showDone, setShowDone] = useState(false);

  const openNew = () => { setForm({ courseId: courses[0]?.id || '', title: '', dueDate: '', status: ASSIGNMENT_STATUS.PENDING, notes: '' }); setModal('new'); };
  const openEdit = (a) => { setForm({ ...a }); setModal(a); };

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error(t('common.requiredField')); return; }
    if (!form.dueDate) { toast.error(t('common.requiredField')); return; }
    const payload = { ...form, title: form.title.trim() };
    if (modal === 'new') { addAssignment(payload); toast.success(t('uni.assignmentAdded')); }
    else { updateAssignment(modal.id, payload); toast.success(t('common.updated')); }
    setModal(null);
  };

  const courseOptions = courses.map((c) => ({ value: c.id, label: c.name }));
  const statusOptions = ASSIGNMENT_STATUS_LIST.map((s) => ({ value: s.id, label: t(`uni.${s.id}`) }));

  const active = assignments
    .filter((a) => a.status !== ASSIGNMENT_STATUS.COMPLETED)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  const done = assignments.filter((a) => a.status === ASSIGNMENT_STATUS.COMPLETED);
  const list = showDone ? done : active;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('uni.assignments')} · {active.length}</p>
          {done.length > 0 && (
            <button
              onClick={() => setShowDone((s) => !s)}
              className="chip bg-slate-100 dark:bg-slate-800 text-slate-500"
            >
              {showDone ? t('uni.pending') : `${t('uni.completed')} ${done.length}`}
            </button>
          )}
        </div>
        <Button onClick={openNew} className="shrink-0" disabled={!courses.length}><PlusIcon size={15} /> {t('uni.addAssignment')}</Button>
      </div>

      {!courses.length && (
        <div className="card p-4 text-sm text-amber-500 bg-amber-500/10 border-amber-500/20">{t('uni.noCourseSelected')}</div>
      )}

      {list.length === 0 ? (
        <EmptyState
          message={showDone ? t('uni.noAssignments') : t('uni.noUpcomingAssignments')}
          icon={<span className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center"><AssignmentIcon size={30} /></span>}
          action={!showDone && courses.length ? <Button onClick={openNew}><PlusIcon size={15} /> {t('uni.addAssignment')}</Button> : null}
        />
      ) : (
        <div className="space-y-2.5">
          {list.map((a) => {
            const isDone = a.status === ASSIGNMENT_STATUS.COMPLETED;
            const urgent = !isDone && daysUntil(a.dueDate) <= 1;
            return (
              <div key={a.id} className={`card p-3.5 flex items-center gap-3 group ${urgent ? 'border-amber-500/30' : ''}`}>
                <button
                  onClick={() => updateAssignment(a.id, { status: isDone ? ASSIGNMENT_STATUS.PENDING : ASSIGNMENT_STATUS.COMPLETED })}
                  className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 transition-all
                    ${isDone ? 'bg-emerald-500 text-white' : 'border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400'}`}
                  aria-label={t('common.done')}
                >
                  {isDone && <CheckIcon size={14} strokeWidth={3} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold text-sm truncate ${isDone ? 'line-through text-slate-400' : ''}`}>{a.title}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="truncate">{courseName(courses, a.courseId)}</span>
                    <span className="shrink-0">·</span>
                    <span className="shrink-0 tabular-nums">{fmtDate(a.dueDate, lang, 'd MMM')}</span>
                    {!isDone && (
                      <span className={`shrink-0 font-medium ${urgent ? 'text-amber-500' : ''}`}>{dueLabel(a.dueDate, lang, t)}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800"><EditIcon size={13} /></button>
                  <button onClick={() => setConfirm(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><TrashIcon size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('uni.addAssignment') : t('uni.editAssignment')}>
        {form && (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">{t('uni.assignmentTitle')}</label>
              <input autoFocus className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('uni.course')} *</label>
              <Select value={form.courseId} onChange={(v) => setForm({ ...form, courseId: v })} options={courseOptions} placeholder={t('uni.noCourseSelected')} />
            </div>
            <div>
              <label className="label">{t('uni.dueDate')}</label>
              <DatePicker value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} />
            </div>
            <div>
              <label className="label">{t('common.status')}</label>
              <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={statusOptions} />
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
        onConfirm={() => { deleteAssignment(confirm.id); toast.success(t('common.deleted')); }}
      />
    </div>
  );
}
