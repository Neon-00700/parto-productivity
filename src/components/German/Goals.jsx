import React, { useState } from 'react';
import { TargetIcon } from '../icons';
import Button from '../Common/Button';
import Select from '../Common/Select';
import { useTranslation } from '../../hooks/useTranslation';
import { GERMAN_LEVELS, nextLevelOf } from '../../data/german/model.js';
import { confirmedLevelFrom, bestForLevel } from '../../utils/germanUtils';
import { fmtDate, localizeDigits } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const FOCUS_OPTIONS = [
  { value: 'grammar', labelKey: 'german.focusGrammar' },
  { value: 'vocabulary', labelKey: 'german.focusVocabulary' },
  { value: 'speaking', labelKey: 'german.focusSpeaking' },
  { value: 'listening', labelKey: 'german.focusListening' },
];

export default function Goals({ german }) {
  const { t, lang } = useTranslation();
  const goal = german.goal || {};
  const confirmed = confirmedLevelFrom(german.testAttempts);
  const current = confirmed || goal.current || 'A1.1';
  const next = nextLevelOf(current);
  const bestNext = next ? bestForLevel(german.testAttempts, next) : null;

  const [target, setTarget] = useState(goal.target || 'B1.1');
  const [targetDate, setTargetDate] = useState(goal.targetDate || '');
  const [focus, setFocus] = useState(goal.focus || []);

  const save = () => {
    german.setGoal({ target, targetDate, focus });
    toast.success(t('common.saved'));
  };

  const toggleFocus = (v) => {
    setFocus((f) => (f.includes(v) ? f.filter((x) => x !== v) : [...f, v]));
  };

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TargetIcon size={17} className="text-primary" />
          <h3 className="font-bold text-sm">{t('german.levelGoal')}</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <div className="text-[11px] text-slate-400">{t('german.currentLevel')}</div>
            <div className="text-xl font-black mt-1">{current}</div>
            <div className={`text-[11px] mt-1 ${confirmed ? 'text-emerald-500' : 'text-slate-400'}`}>
              {confirmed ? t('german.confirmed') : t('german.notConfirmed')}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <div className="text-[11px] text-slate-400">{t('german.nextLevel')}</div>
            <div className="text-xl font-black mt-1">{next || '—'}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {bestNext ? `${localizeDigits(String(bestNext.percent), lang)}% · ${t('german.bestResult')}` : t('german.notTestedYet')}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <div className="text-[11px] text-slate-400">{t('german.targetLevel')}</div>
            <div className="text-xl font-black mt-1">{goal.target || '—'}</div>
            <div className="text-[11px] text-slate-400 mt-1 tabular-nums">{goal.targetDate ? fmtDate(goal.targetDate, lang, 'd MMM yyyy') : '—'}</div>
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-bold text-sm">{t('german.editGoal')}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">{t('german.targetLevel')}</label>
            <Select value={target} onChange={setTarget} options={GERMAN_LEVELS.map((l) => ({ value: l, label: l }))} />
          </div>
          <div>
            <label className="label">{t('german.targetDate')} <span className="text-slate-400">({t('common.optional')})</span></label>
            <input type="date" className="input" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">{t('german.currentFocus')}</label>
          <div className="flex flex-wrap gap-2">
            {FOCUS_OPTIONS.map((f) => (
              <button
                key={f.value}
                onClick={() => toggleFocus(f.value)}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all
                  ${focus.includes(f.value) ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
              >{t(f.labelKey)}</button>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={save}>{t('common.save')}</Button>
        </div>
      </div>
    </div>
  );
}
