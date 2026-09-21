import React, { useState, useMemo } from 'react';
import {
  TargetIcon, PlusIcon, XIcon, ArrowUpIcon, ArrowDownIcon, CheckIcon, PlayIcon, LockIcon, ChevronDownIcon, MoreIcon,
} from '../../icons';
import EmptyState from '../../Common/EmptyState';
import Modal from '../../Common/Modal';
import Button from '../../Common/Button';
import { useProgramming } from '../../../hooks/useProgramming';
import { useTranslation } from '../../../hooks/useTranslation';
import { SKILL_BY_ID, BRANCH_BY_ID, SKILL_BRANCHES, SKILL_NODES } from '../../../data/programming/skillTree';
import { deriveSkillState, SKILL_STATE, prereqsMet, labelOf } from '../../../data/programming/model';
import { localizeDigits } from '../../../utils/dateUtils';
import toast from 'react-hot-toast';

export default function GoalTree() {
  const { t, lang } = useTranslation();
  const { goalEntries, goalOrder, technologies, addToGoal, removeGoalEntry, setGoalEntry, reorderGoal } = useProgramming();
  const [picker, setPicker] = useState(false);
  const [openId, setOpenId] = useState(null);
  const ctx = { technologies, goalEntries };

  const ordered = useMemo(() => goalOrder.filter((id) => goalEntries[id]), [goalOrder, goalEntries]);
  const doneCount = ordered.filter((id) => goalEntries[id].status === 'done').length;

  return (
    <div className="space-y-4">
      <div className="card p-4 sm:p-5 flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold flex items-center gap-2">
            <TargetIcon size={15} className="text-violet-500" /> {t('prog.goalTitle')}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${ordered.length ? (doneCount / ordered.length) * 100 : 0}%` }} />
            </div>
            <span className="text-xs text-slate-400 tabular-nums shrink-0">{localizeDigits(doneCount, lang)}/{localizeDigits(ordered.length, lang)}</span>
          </div>
        </div>
        <Button variant="soft" onClick={() => setPicker(true)} className="shrink-0"><PlusIcon size={14} /> {t('prog.addToGoal')}</Button>
      </div>

      {ordered.length === 0 ? (
        <EmptyState message={t('prog.goalEmpty')}
          icon={<span className="h-16 w-16 rounded-3xl bg-violet-500/10 text-violet-500 flex items-center justify-center"><TargetIcon size={30} /></span>}
          action={<Button onClick={() => setPicker(true)}><PlusIcon size={14} /> {t('prog.addToGoal')}</Button>} />
      ) : (
        <div className="space-y-0">
          {ordered.map((id, i) => {
            const node = SKILL_BY_ID[id];
            if (!node) return null;
            const branch = BRANCH_BY_ID[node.branch];
            const st = deriveSkillState(id, ctx);
            const entry = goalEntries[id];
            const open = openId === id;
            const tech = node.tech ? technologies.find((x) => x.name.trim().toLowerCase() === node.tech.toLowerCase()) : null;
            return (
              <div key={id} className="relative">
                {/* connector */}
                {i > 0 && (
                  <div className="absolute -top-3 start-7 sm:start-9 h-3 w-0.5 bg-slate-200 dark:bg-slate-700" />
                )}
                <div className={`card p-3.5 mb-3 ${st === SKILL_STATE.DONE ? 'border-emerald-500/30' : ''}`}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGoalEntry(id, { status: entry.status === 'done' ? 'todo' : 'done' })}
                      className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 transition-all`}
                      style={{ backgroundColor: `${branch.color}1f`, color: branch.color }}
                    >
                      {st === SKILL_STATE.DONE ? <CheckIcon size={16} strokeWidth={3} /> : st === SKILL_STATE.LEARNING ? <PlayIcon size={14} /> : <LockIcon size={14} />}
                    </button>
                    <button onClick={() => setOpenId(open ? null : id)} className="min-w-0 flex-1 text-start">
                      <div className="font-bold text-sm truncate">{node.name[lang]}</div>
                      <div className="text-xs text-slate-400 truncate">
                        {branch.name[lang]}{tech ? ` · ${tech.name}` : ''}
                      </div>
                    </button>
                    <div className="flex gap-0.5 shrink-0">
                      <button disabled={i === 0} onClick={() => reorderGoal(id, 'up')} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"><ArrowUpIcon size={13} /></button>
                      <button disabled={i === ordered.length - 1} onClick={() => reorderGoal(id, 'down')} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"><ArrowDownIcon size={13} /></button>
                      <button onClick={() => { removeGoalEntry(id); toast.success(t('prog.removeFromGoal')); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><XIcon size={13} /></button>
                    </div>
                  </div>

                  {open && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-fade-in space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {['todo', 'learning', 'done', 'stopped'].map((s) => (
                          <button key={s} onClick={() => setGoalEntry(id, { status: s })}
                            className={`chip transition-all ${entry.status === s ? chipTone(s) : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            {entry.status === s && <CheckIcon size={10} strokeWidth={3} />} {goalStatusLabel(s, lang)}
                          </button>
                        ))}
                      </div>
                      {(node.prereqs || []).length > 0 && (
                        <div className="text-xs text-slate-400">
                          {t('prog.prerequisites')}: {node.prereqs.map((p) => SKILL_BY_ID[p]?.name[lang]).join('، ')}
                        </div>
                      )}
                      <input
                        className="input text-xs"
                        placeholder={t('prog.skillNotes')}
                        value={entry.notes || ''}
                        onChange={(e) => setGoalEntry(id, { notes: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={picker} onClose={() => setPicker(false)} title={t('prog.addToGoal')} wide>
        <SkillPicker onPick={(id) => { addToGoal(id, { status: 'todo' }); toast.success(t('prog.addToGoal')); }} />
      </Modal>
    </div>
  );
}

function goalStatusLabel(s, lang) {
  const m = { todo: { fa: 'بعداً می‌خوام', en: 'Later' }, learning: { fa: 'در حال یادگیری', en: 'Learning' }, done: { fa: 'تمام کردم', en: 'Done' }, stopped: { fa: 'متوقف', en: 'Paused' } };
  return m[s][lang];
}
function chipTone(s) {
  switch (s) {
    case 'learning': return 'bg-sky-500/15 text-sky-600 dark:text-sky-400';
    case 'done': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
    case 'stopped': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
    default: return 'bg-violet-500/15 text-violet-600 dark:text-violet-400';
  }
}

function SkillPicker({ onPick }) {
  const { t, lang } = useTranslation();
  const { goalEntries, technologies } = useProgramming();
  const [q, setQ] = useState('');
  const [branch, setBranch] = useState('all');
  const ctx = { technologies, goalEntries };
  const list = useMemo(() => {
    const lq = q.trim().toLowerCase();
    return SKILL_NODES.filter((n) => {
      if (branch !== 'all' && n.branch !== branch) return false;
      if (lq && !(n.name.fa.includes(q) || n.name.en.toLowerCase().includes(lq))) return false;
      return true;
    });
  }, [q, branch]);

  return (
    <div className="space-y-3">
      <input autoFocus className="input" placeholder={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        <button onClick={() => setBranch('all')} className={`chip shrink-0 ${branch === 'all' ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{t('common.all')}</button>
        {SKILL_BRANCHES.map((b) => (
          <button key={b.id} onClick={() => setBranch(b.id)} className={`chip shrink-0 ${branch === b.id ? 'text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`} style={branch === b.id ? { backgroundColor: b.color } : {}}>{b.name[lang]}</button>
        ))}
      </div>
      <div className="max-h-72 overflow-y-auto space-y-1.5">
        {list.map((n) => {
          const st = deriveSkillState(n.id, ctx);
          const inGoal = !!goalEntries[n.id];
          return (
            <button key={n.id} disabled={inGoal} onClick={() => onPick(n.id)}
              className="w-full flex items-center gap-3 rounded-xl p-2.5 text-start transition-all disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: BRANCH_BY_ID[n.branch].color }} />
              <span className="text-sm font-medium flex-1 truncate">{n.name[lang]}</span>
              {inGoal ? <span className="chip bg-violet-500/15 text-violet-600 dark:text-violet-400">{t('prog.goalSet')}</span>
                : <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-400">{t(`prog.${st === SKILL_STATE.AVAILABLE ? 'available' : st}`)}</span>}
            </button>
          );
        })}
        {list.length === 0 && <p className="text-sm text-slate-400 text-center py-6">{t('common.noResults')}</p>}
      </div>
    </div>
  );
}
