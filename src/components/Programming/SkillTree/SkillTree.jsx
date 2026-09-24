import React, { useState } from 'react';
import { SkillTreeIcon, MapIcon, TargetIcon } from '../../icons';
import { useTranslation } from '../../../hooks/useTranslation';
import StandardTree from './StandardTree';
import GoalTree from './GoalTree';

export default function SkillTree() {
  const { t } = useTranslation();
  const [mode, setMode] = useState('standard');

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-2xl w-full sm:w-fit">
        <button
          onClick={() => setMode('standard')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200
            ${mode === 'standard' ? 'bg-white dark:bg-slate-900 shadow-sm text-sky-600 dark:text-sky-400' : 'text-slate-500'}`}
        >
          <MapIcon size={15} /> {t('prog.standardTree')}
        </button>
        <button
          onClick={() => setMode('goal')}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200
            ${mode === 'goal' ? 'bg-white dark:bg-slate-900 shadow-sm text-violet-600 dark:text-violet-400' : 'text-slate-500'}`}
        >
          <TargetIcon size={15} /> {t('prog.myGoalTree')}
        </button>
      </div>

      <p className="text-xs text-slate-400">{mode === 'standard' ? t('prog.treeHint') : t('prog.goalHint')}</p>

      <div key={mode} className="page-enter">
        {mode === 'standard' ? <StandardTree /> : <GoalTree />}
      </div>
    </div>
  );
}
