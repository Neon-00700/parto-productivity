import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiZap } from 'react-icons/fi';
import Modal from './Modal';
import Button from './Button';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { DEFAULT_TEMPLATES } from '../../utils/gamification';
import { localizeDigits } from '../../utils/dateUtils';

export default function TemplatesModal({ open, onClose, section }) {
  const { data, applyTemplate, addTemplate, deleteTemplate } = useApp();
  const { t, lang } = useTranslation();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [lines, setLines] = useState('');

  const builtins = DEFAULT_TEMPLATES.filter((x) => x.section === section || x.section === 'custom');
  const customs = (data.templates || []).filter((x) => x.section === section);

  const use = (titles) => {
    applyTemplate(section, titles);
    toast.success(`${localizeDigits(titles.length, lang)} ${t('tpl.added')}`);
    onClose();
  };

  const create = (e) => {
    e.preventDefault();
    const titles = lines.split('\n').map((x) => x.trim()).filter(Boolean);
    if (!name.trim() || !titles.length) return;
    addTemplate({ name: name.trim(), section, tasks: titles });
    setName(''); setLines(''); setCreating(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={`📋 ${t('tpl.title')}`}>
      <div className="space-y-3">
        {builtins.map((tpl) => (
          <div key={tpl.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{tpl.name[lang]}</div>
              <div className="text-[11px] text-slate-400 truncate">{tpl.tasks.map((x) => x[lang]).join(' · ')}</div>
            </div>
            <Button variant="soft" className="!py-1.5 !px-3 !text-xs" onClick={() => use(tpl.tasks.map((x) => x[lang]))}>
              <FiZap size={12} /> {t('tpl.use')}
            </Button>
          </div>
        ))}

        {customs.length > 0 && <div className="label pt-1">{t('tpl.manage')}</div>}
        {customs.map((tpl) => (
          <div key={tpl.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{tpl.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{tpl.tasks.join(' · ')}</div>
            </div>
            <Button variant="soft" className="!py-1.5 !px-3 !text-xs" onClick={() => use(tpl.tasks)}>
              <FiZap size={12} /> {t('tpl.use')}
            </Button>
            <button onClick={() => { deleteTemplate(tpl.id); toast.success(t('tpl.deleted')); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500">
              <FiTrash2 size={14} />
            </button>
          </div>
        ))}

        {creating ? (
          <form onSubmit={create} className="space-y-2.5 rounded-xl border border-primary/40 bg-primary/5 p-3">
            <input autoFocus className="input" placeholder={t('tpl.name')} value={name} onChange={(e) => setName(e.target.value)} />
            <textarea rows={4} className="input resize-none" placeholder={t('tpl.linesHint')} value={lines} onChange={(e) => setLines(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" className="!py-1.5 !text-xs" onClick={() => setCreating(false)}>{t('common.cancel')}</Button>
              <Button type="submit" className="!py-1.5 !text-xs">{t('common.save')}</Button>
            </div>
          </form>
        ) : (
          <Button variant="ghost" className="w-full border border-dashed border-slate-300 dark:border-slate-700" onClick={() => setCreating(true)}>
            <FiPlus /> {t('tpl.create')}
          </Button>
        )}
      </div>
    </Modal>
  );
}
