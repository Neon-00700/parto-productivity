import React, { useState } from 'react';
import { FiList, FiUpload, FiTrendingUp } from 'react-icons/fi';
import WorkoutTasks from './WorkoutTasks';
import ExcelUploader from './ExcelUploader';
import BodyTracker from './BodyTracker';
import { useTranslation } from '../../hooks/useTranslation';

export default function GymPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('tasks');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-2xl bg-slate-200/70 dark:bg-slate-900 p-1 w-fit">
        <button
          onClick={() => setTab('tasks')}
          className={`btn !py-1.5 !text-xs ${tab === 'tasks' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500'}`}
        >
          <FiList size={13} /> {t('gym.tasks')}
        </button>
        <button
          onClick={() => setTab('program')}
          className={`btn !py-1.5 !text-xs ${tab === 'program' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500'}`}
        >
          <FiUpload size={13} /> {t('gym.program')}
        </button>
        <button
          onClick={() => setTab('body')}
          className={`btn !py-1.5 !text-xs ${tab === 'body' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500'}`}
        >
          <FiTrendingUp size={13} /> {t('body.tab')}
        </button>
      </div>
      {tab === 'tasks' ? <WorkoutTasks /> : tab === 'program' ? <ExcelUploader /> : <BodyTracker />}
    </div>
  );
}
