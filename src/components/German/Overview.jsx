import React from 'react';
import {
  GrammarIcon, VocabularyIcon, TestIcon, ActivityIcon, RefreshIcon, StarIcon, TargetIcon, InfoIcon,
} from '../icons';
import Button from '../Common/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { useGerman } from '../../hooks/useGerman';
import { GERMAN_LEVELS, nextLevelOf, LEVEL_CONFIG } from '../../data/german/model.js';
import { GRAMMAR_TOPICS, VOCABULARY_ITEMS } from '../../data/german/model.js';
import { isDue, bestForLevel, lastForLevel, confirmedLevelFrom, canTakeTestToday, daysUntilDue } from '../../utils/germanUtils';
import { fmtDate, localizeDigits } from '../../utils/dateUtils';

export default function Overview({ german, onTab }) {
  const { t, lang } = useTranslation();
  const confirmed = confirmedLevelFrom(german.testAttempts);
  const current = confirmed || german.goal.current || 'A1.1';
  const next = nextLevelOf(current);
  const due = Object.entries(german.reviews).filter(([, r]) => isDue(r));
  const best = bestForLevel(german.testAttempts, current);
  const last = lastForLevel(german.testAttempts, current);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayActs = (german.activities || []).filter((a) => a.date === todayKey);
  const recent = (german.activities || []).slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label={t('german.currentLevel')} value={current} sub={confirmed ? t('german.confirmed') : t('german.notConfirmed')} />
        <Stat label={t('german.targetLevel')} value={german.goal.target || '—'} sub={german.goal.targetDate || ''} />
        <Stat label={t('german.reviewsDue')} value={String(due.length)} tone={due.length ? 'amber' : 'slate'} sub={t('german.items')} />
        <Stat label={t('german.bestScore')} value={best ? `${best.percent}%` : '—'} sub={last ? fmtDate(last.date, lang, 'd MMM') : ''} />
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-bold text-sm">{t('german.quickActions')}</h3>
          <span className="text-[11px] text-slate-400">{t('german.levelHint', { n: LEVEL_CONFIG.passingThreshold })}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <Action icon={RefreshIcon} label={t('german.startReview')} onClick={() => onTab('grammar')} tone="primary" />
          <Action icon={TestIcon} label={t('german.startTest')} onClick={() => onTab('test')} tone="violet" />
          <Action icon={ActivityIcon} label={t('german.logActivity')} onClick={() => onTab('activities')} />
          <Action icon={VocabularyIcon} label={t('german.viewVocab')} onClick={() => onTab('vocab')} />
          <Action icon={GrammarIcon} label={t('german.viewGrammar')} onClick={() => onTab('grammar')} />
          <Action icon={TargetIcon} label={t('german.setGoal')} onClick={() => onTab('goals')} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-3">{t('german.todayActivities')}</h3>
          {todayActs.length === 0 ? (
            <p className="text-sm text-slate-400 py-3">{t('german.noTodayActivities')}</p>
          ) : (
            <div className="space-y-2">
              {todayActs.map((a) => <ActivityRow key={a.id} a={a} />)}
            </div>
          )}
        </div>
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-3">{t('german.recentActivities')}</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400 py-3">{t('german.noRecentActivities')}</p>
          ) : (
            <div className="space-y-2">
              {recent.map((a) => <ActivityRow key={a.id} a={a} />)}
            </div>
          )}
        </div>
      </div>

      {next && (
        <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
          <InfoIcon size={12} />
          <span>{t('german.nextLevelHint', { current, next })}</span>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone = 'slate' }) {
  const tones = { slate: '', amber: 'text-amber-500' };
  return (
    <div className="card p-3.5">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`text-2xl font-black mt-1 ${tones[tone]}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

function Action({ icon: Icon, label, onClick, tone = 'slate' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary hover:bg-primary/20',
    violet: 'bg-violet-500/10 text-violet-500 hover:bg-violet-500/20',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
  };
  return (
    <button onClick={onClick} className={`flex items-center gap-2.5 p-3 rounded-xl text-sm font-semibold transition-all ${tones[tone]}`}>
      <Icon size={16} /> <span className="truncate">{label}</span>
    </button>
  );
}

function ActivityRow({ a }) {
  const { t, lang } = useTranslation();
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm truncate">{t(`german.act_${a.type}`)}</div>
        <div className="text-xs text-slate-400 truncate">{a.topic || a.notes || '—'}</div>
      </div>
      <span className="text-xs text-slate-400 shrink-0 tabular-nums">{localizeDigits(String(a.duration), lang)} {t('german.minutes')}</span>
      <span className="text-[10px] text-slate-400 shrink-0">{a.level || ''}</span>
    </div>
  );
}
