import React, { useState } from 'react';
import { CourseIcon, PlusIcon, EditIcon, TrashIcon, InfoIcon } from '../icons';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import EmptyState from '../Common/EmptyState';
import ConfirmDialog from '../Common/ConfirmDialog';
import Select from '../Common/Select';
import { useUniversity } from '../../hooks/useUniversity';
import { useTranslation } from '../../hooks/useTranslation';
import toast from 'react-hot-toast';

export default function Courses() {
  const { t } = useTranslation();
  const { courses, classes, exams, assignments, addCourse, updateCourse, deleteCourse } = useUniversity();
  const [modal, setModal] = useState(null); // {new:true} | course
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const openNew = () => { setForm({ name: '', code: '', teacher: '', notes: '' }); setModal('new'); };
  const openEdit = (c) => { setForm({ ...c }); setModal(c); };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error(t('common.requiredField')); return; }
    const payload = { ...form, name: form.name.trim() };
    if (modal === 'new') { addCourse(payload); toast.success(t('uni.courseAdded')); }
    else { updateCourse(modal.id, payload); toast.success(t('common.updated')); }
    setModal(null);
  };

  const usage = (id) => classes.filter((c) => c.courseId === id).length
    + exams.filter((x) => x.courseId === id).length
    + assignments.filter((a) => a.courseId === id).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('uni.course')} · {courses.length}</p>
        <Button onClick={openNew} className="shrink-0"><PlusIcon size={15} /> {t('uni.addCourse')}</Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          message={t('uni.noCourses')}
          icon={<span className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center"><CourseIcon size={30} /></span>}
          action={<Button onClick={openNew}><PlusIcon size={15} /> {t('uni.addCourse')}</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {courses.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-black truncate">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                    {c.code && <span className="chip bg-slate-100 dark:bg-slate-800">{c.code}</span>}
                    {c.teacher && <span className="truncate">{c.teacher}</span>}
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800"><EditIcon size={14} /></button>
                  <button onClick={() => setConfirm(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><TrashIcon size={14} /></button>
                </div>
              </div>
              {c.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2">{c.notes}</p>}
              {usage(c.id) === 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2.5">
                  <InfoIcon size={11} /> {t('uni.noClassesShort')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('uni.addCourse') : t('uni.editCourse')}>
        {form && (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">{t('uni.courseName')}</label>
              <input autoFocus className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('uni.courseCode')} <span className="text-slate-400">({t('common.optional')})</span></label>
                <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('uni.courseTeacher')} <span className="text-slate-400">({t('common.optional')})</span></label>
                <input className="input" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} />
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
        onConfirm={() => { deleteCourse(confirm.id); toast.success(t('uni.courseDeleted')); }}
      />
    </div>
  );
}
