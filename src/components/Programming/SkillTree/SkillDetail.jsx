import React from 'react';
import Modal from '../../Common/Modal';
import Button from '../../Common/Button';
import {
  LockIcon, UnlockIcon, CheckIcon, PlayIcon, XIcon, TargetIcon, PlusIcon, CpuIcon,
} from '../../icons';
import { useProgramming } from '../../../hooks/useProgramming';
import { useTranslation } from '../../../hooks/useTranslation';
import { SKILL_BY_ID, BRANCH_BY_ID } from '../../../data/programming/skillTree';
import { deriveSkillState, SKILL_STATE, prereqsMet, labelOf, TECH_STATUS } from '../../../data/programming/model';
import toast from 'react-hot-toast';

export default function SkillDetail({ skillId, onClose }) {
  const { t, lang } = useTranslation();
  const { technologies, goalEntries, addToGoal, removeGoalEntry, setGoalEntry } = useProgramming();
  if (!skillId) return null;
  const node = SKILL_BY_ID[skillId];
  if (!node) return null;
  const branch = BRANCH_BY_ID[node.branch];
  const ctx = { technologies, goalEntries };
  const st = deriveSkillState(skillId, ctx);
  const entry = goalEntries[skillId];
  const tech = node.tech ? technologies.find((x) => x.name.trim().toLowerCase() === node.tech.toLowerCase()) : null;
  const prereqs = (node.prereqs || []).map((p) => ({ id: p, node: SKILL_BY_ID[p], st: deriveSkillState(p, ctx) }));
  const met = prereqsMet(skillId, ctx);

  const setStatus = (status) => {
    if (!entry) addToGoal(skillId, { status });
    else setGoalEntry(skillId, { status });
    toast.success(t('common.updated'));
  };

  return (
    <Modal open={!!skillId} onClose={onClose} title={node.name[lang]}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: branch.color }} />
          <span className="text-xs text-slate-400">{branch.name[lang]}</span>
          <span className={`chip ${stateChip(st)}`}>{t(`prog.${st === SKILL_STATE.AVAILABLE ? 'available' : st}`)}</span>
        </div>

        {node.tech && (
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
            <span className="h-8 w-8 rounded-lg bg-sky-500/12 text-sky-500 flex items-center justify-center shrink-0"><CpuIcon size={15} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-400">{t('prog.relatedTech')}</div>
              <div className="text-sm font-semibold truncate">{node.tech}</div>
            </div>
            {tech && <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">{labelOf(TECH_STATUS, tech.status, lang)}</span>}
          </div>
        )}

        {/* prerequisites */}
        <div>
          <div className="label">{t('prog.prerequisites')}</div>
          {prereqs.length === 0 ? (
            <p className="text-xs text-slate-400">{t('prog.noPrereqs')}</p>
          ) : (
            <div className="space-y-1.5">
              {prereqs.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  {p.st === SKILL_STATE.DONE
                    ? <span className="h-5 w-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shrink-0"><CheckIcon size={11} strokeWidth={3} /></span>
                    : <span className="h-5 w-5 rounded-md border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0"><LockIcon size={10} /></span>}
                  <span className="text-sm flex-1 truncate">{p.node.name[lang]}</span>
                  <span className="text-[10px] text-slate-400">{t(`prog.${p.st === SKILL_STATE.AVAILABLE ? 'available' : p.st}`)}</span>
                </div>
              ))}
            </div>
          )}
          {!met && st === SKILL_STATE.LOCKED && (
            <div className="mt-2.5 rounded-xl bg-amber-500/8 border border-amber-500/25 p-2.5">
              <p className="text-[11px] text-amber-600 dark:text-amber-400">{t('prog.stillLocked')}</p>
              <button onClick={() => setStatus('learning')} className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <UnlockIcon size={12} /> {t('prog.forceUnlock')}
              </button>
            </div>
          )}
        </div>

        {/* status actions */}
        <div>
          <div className="label">{t('common.status')}</div>
          <div className="grid grid-cols-2 gap-2">
            <ActionBtn active={entry?.status === 'learning'} onClick={() => setStatus('learning')} icon={<PlayIcon size={13} />} label={t('prog.markLearning')} tone="sky" />
            <ActionBtn active={entry?.status === 'done'} onClick={() => setStatus('done')} icon={<CheckIcon size={13} strokeWidth={3} />} label={t('prog.markDone')} tone="emerald" />
            <ActionBtn active={entry?.status === 'todo'} onClick={() => setStatus('todo')} icon={<TargetIcon size={13} />} label={t('prog.markTodo')} tone="slate" />
            <ActionBtn active={entry?.status === 'stopped'} onClick={() => setStatus('stopped')} icon={<XIcon size={13} />} label={t('prog.markStopped')} tone="amber" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          {entry ? (
            <Button variant="danger" onClick={() => { removeGoalEntry(skillId); toast.success(t('prog.removeFromGoal')); onClose(); }}>
              <XIcon size={14} /> {t('prog.removeFromGoal')}
            </Button>
          ) : (
            <Button onClick={() => { addToGoal(skillId, { status: 'todo' }); toast.success(t('prog.addToGoal')); onClose(); }}>
              <PlusIcon size={14} /> {t('prog.addToGoal')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

const TONES = {
  sky: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
  emerald: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
};
function ActionBtn({ active, onClick, icon, label, tone }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${TONES[tone]} ${active ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ring-current' : 'opacity-75 hover:opacity-100'}`}>
      {icon} {label}
    </button>
  );
}
function stateChip(st) {
  switch (st) {
    case SKILL_STATE.DONE: return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
    case SKILL_STATE.LEARNING: return 'bg-sky-500/15 text-sky-600 dark:text-sky-400';
    case SKILL_STATE.STOPPED: return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
    case SKILL_STATE.AVAILABLE: return 'bg-slate-500/15 text-slate-500';
    default: return 'bg-slate-500/10 text-slate-400';
  }
}
