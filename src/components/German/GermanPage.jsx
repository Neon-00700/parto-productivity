import React, { useState } from 'react';
import {
  GermanIcon, OverviewIcon, GrammarIcon, VocabularyIcon, TestIcon, ActivityIcon, TargetIcon,
} from '../icons';
import { useTranslation } from '../../hooks/useTranslation';
import { useGerman } from '../../hooks/useGerman';
import { GERMAN_LEVELS, nextLevelOf, LEVEL_CONFIG } from '../../data/german/model.js';
import { isDue, bestForLevel, confirmedLevelFrom, canTakeTestToday, lastForLevel } from '../../utils/germanUtils';
import { GRAMMAR_TOPICS, VOCABULARY_ITEMS } from '../../data/german/model.js';
import Overview from './Overview';
import GrammarReview from './GrammarReview';
import Vocabulary from './Vocabulary';
import LevelTest from './LevelTest';
import Activities from './Activities';
import Goals from './Goals';

const TABS = [
  { id: 'overview', label: 'نمای کلی', icon: OverviewIcon },
  { id: 'grammar', label: 'گرامر', icon: GrammarIcon },
  { id: 'vocab', label: 'واژگان', icon: VocabularyIcon },
  { id: 'test', label: 'آزمون سطح', icon: TestIcon },
  { id: 'activities', label: 'فعالیت‌ها', icon: ActivityIcon },
  { id: 'goals', label: 'اهداف', icon: TargetIcon },
];

export default function GermanPage() {
  const { t } = useTranslation();
  const german = useGerman();
  const [tab, setTab] = useState('overview');

  const confirmed = confirmedLevelFrom(german.testAttempts);
  const current = german.goal.current || 'A1.1';
  const dueCount = dueReviewCount(german.reviews);
  const canTest = canTakeTestToday(german.lastTestDate);

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <GermanIcon size={20} />
            </span>
            <div>
              <h1 className="text-xl font-black">{t('german.title')}</h1>
              <p className="text-xs text-slate-400">{t('german.subtitle')}</p>
            </div>
          </div>
          <LevelBadge current={confirmed || current} confirmed={!!confirmed} canTest={canTest} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all
                ${tab === id ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <Icon size={15} /> {label}
              {id === 'grammar' && dueCount > 0 && (
                <span className="text-[10px] font-bold bg-white/25 px-1.5 rounded-full">{dueCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && <Overview german={german} onTab={setTab} />}
      {tab === 'grammar' && <GrammarReview german={german} />}
      {tab === 'vocab' && <Vocabulary german={german} />}
      {tab === 'test' && <LevelTest german={german} />}
      {tab === 'activities' && <Activities german={german} />}
      {tab === 'goals' && <Goals german={german} />}
    </div>
  );
}

function LevelBadge({ current, confirmed, canTest }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <div className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold">
        {current}
      </div>
      <div className={`px-3 py-2 rounded-xl text-sm font-bold ${
        confirmed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
        {confirmed ? t('german.confirmed') : t('german.notConfirmed')}
      </div>
    </div>
  );
}

export function dueReviewCount(reviews) {
  return Object.entries(reviews || {}).filter(([, r]) => isDue(r)).length;
}
