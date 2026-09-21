import React, { useState } from 'react';
import {
  ProgrammingIcon, TechnologyIcon, ProjectIcon, ActivityIcon, SkillTreeIcon,
} from '../icons';
import { useTranslation } from '../../hooks/useTranslation';
import Overview from './Overview';
import Technologies from './Technologies';
import Projects from './Projects';
import Activities from './Activities';
import SkillTree from './SkillTree/SkillTree';

const TABS = [
  { id: 'overview', icon: ProgrammingIcon },
  { id: 'technologies', icon: TechnologyIcon },
  { id: 'projects', icon: ProjectIcon },
  { id: 'activities', icon: ActivityIcon },
  { id: 'skills', icon: SkillTreeIcon },
];

export default function ProgrammingPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('overview');

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-2xl bg-sky-500/15 text-sky-500 flex items-center justify-center">
              <ProgrammingIcon size={19} />
            </span>
            {t('nav.programming')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">{t('prog.subtitle')}</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200
              ${tab === id
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Icon size={15} />
            {t(`prog.tabs.${id}`)}
          </button>
        ))}
      </div>

      <div key={tab} className="page-enter">
        {tab === 'overview' && <Overview onTab={setTab} />}
        {tab === 'technologies' && <Technologies />}
        {tab === 'projects' && <Projects />}
        {tab === 'activities' && <Activities />}
        {tab === 'skills' && <SkillTree />}
      </div>
    </div>
  );
}
