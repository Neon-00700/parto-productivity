import React, { useState, useMemo } from 'react';
import {
  TechnologyIcon, PlusIcon, EditIcon, TrashIcon, CheckIcon, XIcon, ChevronDownIcon,
} from '../icons';
import Badge from '../Common/Badge';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import EmptyState from '../Common/EmptyState';
import ConfirmDialog from '../Common/ConfirmDialog';
import { useProgramming } from '../../hooks/useProgramming';
import { useTranslation } from '../../hooks/useTranslation';
import { fmtShort, localizeDigits, toPersianDigits } from '../../utils/dateUtils';
import {
  TECH_STATUS, labelOf, STATUS_BADGE_TONE,
} from '../../data/programming/model';
import toast from 'react-hot-toast';

export default function Technologies() {
  const { t, lang } = useTranslation();
  const {
    technologies, projects, addTechnology, updateTechnology, deleteTechnology,
    addMilestone, toggleMilestone, deleteMilestone,
  } = useProgramming();
  const [modal, setModal] = useState(null); // null | 'new' | techObj
  const [form, setForm] = useState(null);
  const [newMs, setNewMs] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [openId, setOpenId] = useState(null);

  const projectCount = useMemo(() => {
    const m = {};
    projects.forEach((p) => (p.techIds || []).forEach((id) => { m[id] = (m[id] || 0) + 1; }));
    return m;
  }, [projects]);

  const openNew = () => {
    setForm({ name: '', status: 'todo', startDate: new Date().toISOString().slice(0, 10), goal: '', notes: '', milestones: [] });
    setNewMs('');
    setModal('new');
  };
  const openEdit = (tech) => {
    setForm({ ...tech, milestones: [...(tech.milestones || [])] });
    setNewMs('');
    setModal(tech);
  };
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error(t('common.requiredField')); return; }
    const payload = { ...form, name: form.name.trim() };
    if (modal === 'new') { addTechnology(payload); toast.success(t('prog.techAdded')); }
    else { updateTechnology(modal.id, payload); toast.success(t('prog.techUpdated')); }
    setModal(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('prog.milestoneHint')}</p>
        <Button onClick={openNew} className="shrink-0"><PlusIcon size={15} /> {t('prog.addTech')}</Button>
      </div>

      {technologies.length === 0 ? (
        <EmptyState message={t('prog.noTech')} icon={<span className="h-16 w-16 rounded-3xl bg-sky-500/10 text-sky-500 flex items-center justify-center"><TechnologyIcon size={30} /></span>}
          action={<Button onClick={openNew}><PlusIcon size={15} /> {t('prog.addTech')}</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {technologies.map((tech) => {
            const ms = tech.milestones || [];
            const done = ms.filter((m) => m.done).length;
            const isOpen = openId === tech.id;
            return (
              <div key={tech.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => setOpenId(isOpen ? null : tech.id)} className="min-w-0 flex-1 text-start">
                    <h3 className="font-black truncate">{tech.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge tone={STATUS_BADGE_TONE[tech.status]}>{labelOf(TECH_STATUS, tech.status, lang)}</Badge>
                      <span className="text-xs text-slate-400">{fmtShort(tech.startDate, lang)}</span>
                    </div>
                  </button>
                  <div className="flex gap-0.5 shrink-0">
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => openEdit(tech)}><EditIcon size={14} /></button>
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setConfirmDel(tech.id)}><TrashIcon size={14} /></button>
                  </div>
                </div>

                {tech.goal && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2">{tech.goal}</p>}

                {ms.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${(done / ms.length) * 100}%` }} />
                      </div>
                      <span className="text-[11px] text-slate-400 tabular-nums shrink-0">{localizeDigits(done, lang)}/{localizeDigits(ms.length, lang)}</span>
                    </div>
                    <button onClick={() => setOpenId(isOpen ? null : tech.id)} className="mt-2 text-[11px] text-slate-400 hover:text-sky-500 flex items-center gap-1">
                      {t('prog.milestones')} <ChevronDownIcon size={11} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}

                {isOpen && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 animate-fade-in">
                    {ms.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 group">
                        <button
                          onClick={() => toggleMilestone(tech.id, m.id)}
                          className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-all ${m.done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-200 dark:border-slate-700'}`}
                        >
                          {m.done && <CheckIcon size={12} strokeWidth={3} />}
                        </button>
                        <span className={`text-xs flex-1 ${m.done ? 'line-through text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>{m.title}</span>
                        <button onClick={() => deleteMilestone(tech.id, m.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-300 hover:text-red-500"><XIcon size={12} /></button>
                      </div>
                    ))}
                    {ms.length === 0 && <p className="text-xs text-slate-400">{t('prog.noMilestones')}</p>}
                    <form onSubmit={(e) => { e.preventDefault(); if (!newMs.trim()) return; addMilestone(tech.id, newMs); setNewMs(''); }} className="flex gap-1.5 pt-1">
                      <input value={isOpen ? newMs : ''} onChange={(e) => setNewMs(e.target.value)} placeholder={t('prog.addMilestone')} className="input !py-1.5 text-xs" />
                      <Button type="submit" variant="soft" className="!px-3 shrink-0"><PlusIcon size={13} /></Button>
                    </form>
                    <div className="flex items-center justify-between pt-1.5 text-[11px] text-slate-400">
                      <span>{t('prog.relatedProjects')}: {localizeDigits(projectCount[tech.id] || 0, lang)}</span>
                      {tech.notes && <span className="truncate max-w-[50%]">{tech.notes}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('prog.addTech') : t('prog.editTech')}>
        {form && (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">{t('prog.techName')} *</label>
              <input autoFocus className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('common.status')}</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {TECH_STATUS.map((s) => <option key={s.id} value={s.id}>{s[lang]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('prog.startDate')}</label>
                <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">{t('prog.learningGoal')}</label>
              <input className="input" value={form.goal || ''} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder={lang === 'fa' ? 'مثلاً: ساخت یک اپ کامل با ری‌اکت' : 'e.g. build a full app with React'} />
            </div>
            <div>
              <label className="label">{t('common.notes')}</label>
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
        onConfirm={() => { deleteTechnology(confirmDel); setConfirmDel(null); toast.success(t('prog.techDeleted')); }} />
    </div>
  );
}
