import React, { useState } from 'react';
import {
  UniversityIcon, ClassIcon, CourseIcon, ExamIcon, AssignmentIcon, DayIcon,
} from '../icons';
import { useTranslation } from '../../hooks/useTranslation';
import { currentWeekLabel } from '../../data/university/model';
import { useUniversity } from '../../hooks/useUniversity';
import Overview from './Overview';
import Courses from './Courses';
import Classes from './Classes';
import Exams from './Exams';
import Assignments from './Assignments';

const TABS = [
  { id: 'overview', icon: DayIcon },
  { id: 'courses', icon: CourseIcon },
  { id: 'classes', icon: ClassIcon },
  { id: 'exams', icon: ExamIcon },
  { id: 'assignments', icon: AssignmentIcon },
];

export default function UniversityPage() {
  const { t } = useTranslation();
  const { reference } = useUniversity();
  const [tab, setTab] = useState('overview');
  const weekLabel = currentWeekLabel(reference);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
              <UniversityIcon size={19} />
            </span>
            {t('nav.university')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">{t('uni.subtitle')}</p>
        </div>
        <span className="chip bg-primary/10 text-primary shrink-0 mt-1">{t(`uni.week${weekLabel}`)}</span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200
              ${tab === id
                ? 'bg-primary/15 text-primary'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Icon size={15} />
            {t(`uni.tabs.${id}`)}
          </button>
        ))}
      </div>

      <div key={tab} className="page-enter">
        {tab === 'overview' && <Overview onTab={setTab} />}
        {tab === 'courses' && <Courses />}
        {tab === 'classes' && <Classes />}
        {tab === 'exams' && <Exams />}
        {tab === 'assignments' && <Assignments />}
      </div>
    </div>
  );
}
