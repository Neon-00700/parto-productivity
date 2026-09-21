import React, { useState } from 'react';
import {
  ProjectIcon, PlusIcon, EditIcon, TrashIcon, GitHubIcon, LinkIcon, ExternalLinkIcon, CheckIcon,
} from '../icons';
import Badge from '../Common/Badge';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import EmptyState from '../Common/EmptyState';
import ConfirmDialog from '../Common/ConfirmDialog';
import { useProgramming } from '../../hooks/useProgramming';
import { useTranslation } from '../../hooks/useTranslation';
import { PROJECT_STATUS, labelOf, STATUS_BADGE_TONE } from '../../data/programming/model';
import toast from 'react-hot-toast';

const EMPTY = { name: '', status: 'not_started', techIds: [], description: '', githubUrl: '', demoUrl: '', docUrl: '', otherUrls: [], notes: '' };

export default function Projects() {
  const { t, lang } = useTranslation();
  const { technologies, projects, addProject, updateProject, deleteProject } = useProgramming();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmDel, setConfirmDel] = useState(null);
  const [openId, setOpenId] = useState(null);

  const openNew = () => { setForm({ ...EMPTY }); setModal('new'); };
  const openEdit = (p) => { setForm({ ...p, techIds: [...(p.techIds || [])], otherUrls: [...(p.otherUrls || [])] }); setModal(p); };
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error(t('common.requiredField')); return; }
    const payload = { ...form, name: form.name.trim() };
    if (modal === 'new') { addProject(payload); toast.success(t('prog.projectAdded')); }
    else { updateProject(modal.id, payload); toast.success(t('prog.projectUpdated')); }
    setModal(null);
  };
  const toggleTech = (id) => setForm((f) => ({ ...f, techIds: f.techIds.includes(id) ? f.techIds.filter((x) => x !== id) : [...f.techIds, id] }));
  const techName = (id) => technologies.find((x) => x.id === id)?.name;

  const linksOf = (p) => [
    p.githubUrl && { url: p.githubUrl, icon: GitHubIcon },
    p.demoUrl && { url: p.demoUrl, icon: ExternalLinkIcon },
    p.docUrl && { url: p.docUrl, icon: LinkIcon },
    ...(p.otherUrls || []).map((u) => ({ url: u, icon: LinkIcon })),
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('prog.subtitle')}</p>
        <Button onClick={openNew} className="shrink-0"><PlusIcon size={15} /> {t('prog.addProject')}</Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState message={t('prog.noProjects')} icon={<span className="h-16 w-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><ProjectIcon size={30} /></span>}
          action={<Button onClick={openNew}><PlusIcon size={15} /> {t('prog.addProject')}</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {projects.map((p) => {
            const links = linksOf(p);
            const isOpen = openId === p.id;
            return (
              <div key={p.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => setOpenId(isOpen ? null : p.id)} className="min-w-0 flex-1 text-start">
                    <h3 className="font-black truncate">{p.name}</h3>
                    <div className="mt-1.5"><Badge tone={STATUS_BADGE_TONE[p.status]}>{labelOf(PROJECT_STATUS, p.status, lang)}</Badge></div>
                  </button>
                  <div className="flex gap-0.5 shrink-0">
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => openEdit(p)}><EditIcon size={14} /></button>
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setConfirmDel(p.id)}><TrashIcon size={14} /></button>
                  </div>
                </div>

                {(p.techIds || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.techIds.map((id) => (
                      <span key={id} className="chip bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{techName(id)}</span>
                    ))}
                  </div>
                )}

                {isOpen && p.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 animate-fade-in">{p.description}</p>}

                <div className="flex items-center gap-1.5 mt-3">
                  {links.slice(0, isOpen ? links.length : 3).map((l, i) => (
                    <a key={i} href={l.url} target="_blank" rel="noreferrer"
                      className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-sky-500 transition-colors">
                      <l.icon size={14} />
                    </a>
                  ))}
                  {!isOpen && links.length > 3 && (
                    <button onClick={() => setOpenId(p.id)} className="h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500">
                      +{links.length - 3}
                    </button>
                  )}
                  {isOpen && p.notes && <span className="text-[11px] text-slate-400 truncate ms-auto">{p.notes}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('prog.addProject') : t('prog.editProject')} wide={modal !== 'new'}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">{t('prog.projectName')} *</label>
            <input autoFocus className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('common.status')}</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {PROJECT_STATUS.map((s) => <option key={s.id} value={s.id}>{s[lang]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('prog.githubUrl')}</label>
              <input className="input" value={form.githubUrl || ''} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} placeholder="https://github.com/..." />
            </div>
          </div>

          <div>
            <label className="label">{t('prog.selectTechs')}</label>
            {technologies.length === 0 ? (
              <p className="text-xs text-slate-400">{t('prog.noTechYet')}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {technologies.map((tech) => {
                  const on = form.techIds.includes(tech.id);
                  return (
                    <button key={tech.id} type="button" onClick={() => toggleTech(tech.id)}
                      className={`chip transition-all ${on ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {on && <CheckIcon size={11} strokeWidth={3} />} {tech.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="label">{t('prog.projectDesc')}</label>
            <textarea rows={2} className="input resize-none" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('prog.demoUrl')}</label>
              <input className="input" value={form.demoUrl || ''} onChange={(e) => setForm({ ...form, demoUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="label">{t('prog.docUrl')}</label>
              <input className="input" value={form.docUrl || ''} onChange={(e) => setForm({ ...form, docUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className="label">{t('prog.otherUrls')}</label>
            <div className="space-y-2">
              {(form.otherUrls || []).map((u, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input" value={u} onChange={(e) => setForm({ ...form, otherUrls: form.otherUrls.map((x, j) => (j === i ? e.target.value : x)) })} placeholder="https://..." />
                  <button type="button" className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0" onClick={() => setForm({ ...form, otherUrls: form.otherUrls.filter((_, j) => j !== i) })}><TrashIcon size={14} /></button>
                </div>
              ))}
              <button type="button" className="btn-ghost btn !py-1.5 text-xs" onClick={() => setForm({ ...form, otherUrls: [...(form.otherUrls || []), ''] })}>
                <PlusIcon size={13} /> {t('prog.addLink')}
              </button>
            </div>
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
      </Modal>

      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={() => { deleteProject(confirmDel); setConfirmDel(null); toast.success(t('prog.projectDeleted')); }} />
    </div>
  );
}
