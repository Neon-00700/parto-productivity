import React, { useState } from 'react';
import { ActivityIcon, PlusIcon, EditIcon, TrashIcon } from '../icons';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import EmptyState from '../Common/EmptyState';
import ConfirmDialog from '../Common/ConfirmDialog';
import Select from '../Common/Select';
import { useTranslation } from '../../hooks/useTranslation';
import { ACTIVITY_TYPES, GERMAN_LEVELS } from '../../data/german/model.js';
import { fmtDate, localizeDigits } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const emptyForm = () => ({ type: 'selfStudy', date: new Date().toISOString().slice(0, 10), duration: 30, topic: '', level: 'A1.1', notes: '' });

export default function Activities({ german }) {
  const { t, lang } = useTranslation();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirm, setConfirm] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form, duration: Number(form.duration) || 0 };
    if (modal === 'new') { german.addActivity(payload); toast.success(t('german.activityAdded')); }
    else { german.updateActivity(modal.id, payload); toast.success(t('common.updated')); }
    setModal(null);
  };

  const acts = german.activities || [];
  const totalMinutes = acts.reduce((a, x) => a + Number(x.duration || 0), 0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayCount = acts.filter((a) => a.date === todayKey).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3.5"><div className="text-[11px] text-slate-400">{t('german.totalActivities')}</div><div className="text-2xl font-black mt-1 tabular-nums">{localizeDigits(String(acts.length), lang)}</div></div>
        <div className="card p-3.5"><div className="text-[11px] text-slate-400">{t('german.todayCount')}</div><div className="text-2xl font-black mt-1 tabular-nums">{localizeDigits(String(todayCount), lang)}</div></div>
        <div className="card p-3.5"><div className="text-[11px] text-slate-400">{t('german.totalMinutes')}</div><div className="text-2xl font-black mt-1 tabular-nums">{localizeDigits(String(totalMinutes), lang)}</div></div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { setForm(emptyForm()); setModal('new'); }}><PlusIcon size={15} /> {t('german.logActivity')}</Button>
      </div>

      {acts.length === 0 ? (
        <EmptyState
          message={t('german.noActivities')}
          icon={<span className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center"><ActivityIcon size={30} /></span>}
          action={<Button onClick={() => { setForm(emptyForm()); setModal('new'); }}><PlusIcon size={15} /> {t('german.logActivity')}</Button>}
        />
      ) : (
        <div className="space-y-2.5">
          {acts.map((a) => (
            <div key={a.id} className="card p-3.5 flex items-center gap-3 group">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ActivityIcon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm">
                  {t(`german.act_${a.type}`)}
                  {a.level && <span className="text-[11px] text-slate-400 font-normal"> · {a.level}</span>}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {a.topic || a.notes || '—'}
                  {a.externalSource && ` · ${a.externalSource}`}
                </div>
              </div>
              <div className="text-end shrink-0">
                <div className="text-sm font-bold tabular-nums">{localizeDigits(String(a.duration), lang)} {t('german.minutes')}</div>
                <div className="text-[10px] text-slate-400 tabular-nums">{fmtDate(a.date, lang, 'd MMM')}</div>
              </div>
              <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setForm({ ...a }); setModal(a); }} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800"><EditIcon size={13} /></button>
                <button onClick={() => setConfirm(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><TrashIcon size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('german.logActivity') : t('german.editActivity')}>
        {form && (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">{t('german.activityType')}</label>
              <Select
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v })}
                options={ACTIVITY_TYPES.map((a) => ({ value: a, label: t(`german.act_${a}`) }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('common.date')}</label>
                <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="label">{t('german.durationMin')}</label>
                <input type="number" min="0" step="5" className="input" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">{t('german.topic')}</label>
              <input className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder={t('german.topicPlaceholder')} />
            </div>
            <div>
              <label className="label">{t('german.level')}</label>
              <Select
                value={form.level}
                onChange={(v) => setForm({ ...form, level: v })}
                options={GERMAN_LEVELS.map((l) => ({ value: l, label: l }))}
              />
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
        onConfirm={() => { german.deleteActivity(confirm.id); toast.success(t('common.deleted')); }}
      />
    </div>
  );
}
