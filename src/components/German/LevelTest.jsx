import React, { useState } from 'react';
import { TestIcon, CheckIcon, XIcon, LockIcon, StarIcon } from '../icons';
import Button from '../Common/Button';
import Select from '../Common/Select';
import { useTranslation } from '../../hooks/useTranslation';
import { GERMAN_LEVELS, LEVEL_CONFIG, grammarByLevel, vocabByLevel } from '../../data/german/model.js';
import {
  buildTest, scoreAttempt, isPassed, bestForLevel, lastForLevel, canTakeTestToday, shuffle,
} from '../../utils/germanUtils';
import { fmtDate, localizeDigits } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

export default function LevelTest({ german }) {
  const { t, lang } = useTranslation();
  const [level, setLevel] = useState(GERMAN_LEVELS[0]);
  const [run, setRun] = useState(null);

  const canTest = canTakeTestToday(german.lastTestDate);
  const best = bestForLevel(german.testAttempts, level);
  const last = lastForLevel(german.testAttempts, level);

  const start = () => {
    if (!canTest) { toast.error(t('german.testLimit')); return; }
    const questions = buildTest(level, {
      grammar: grammarByLevel(level),
      vocabulary: vocabByLevel(level),
    });
    if (!questions.length) { toast.error(t('german.noQuestions')); return; }
    setRun({ questions, idx: 0, answers: {} });
  };

  // ---- in-progress test ----
  if (run) {
    const q = run.questions[run.idx];
    const answered = run.answers[run.idx];
    if (!q) {
      const { correct, total, percent } = scoreAttempt(run.questions, run.answers);
      const passed = isPassed(percent);
      return (
        <div className="max-w-md mx-auto card p-8 text-center space-y-5">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mx-auto ${passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
            {passed ? <CheckIcon size={30} /> : <StarIcon size={30} />}
          </div>
          <h3 className="text-xl font-black">{passed ? t('german.levelConfirmed', { level }) : t('german.levelNotConfirmed', { level })}</h3>
          <div className="text-5xl font-black text-primary tabular-nums">
            {localizeDigits(String(correct), lang)} / {localizeDigits(String(total), lang)}
          </div>
          <div className="text-lg font-bold tabular-nums">{localizeDigits(String(percent), lang)}%</div>
          <p className="text-sm text-slate-400">
            {passed
              ? t('german.passedHint', { level })
              : t('german.failedHint', { n: String(LEVEL_CONFIG.passingThreshold) })}
          </p>
          <Button onClick={() => setRun(null)}>{t('german.backToTest')}</Button>
        </div>
      );
    }
    const isCorrect = answered === q.answer;
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <button onClick={() => setRun(null)} className="hover:text-primary">{t('german.exit')}</button>
          <span className="tabular-nums">{localizeDigits(String(run.idx + 1), lang)} / {localizeDigits(String(run.questions.length), lang)} · {level}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(run.idx / run.questions.length) * 100}%` }} />
        </div>
        <div className="card p-6 space-y-4">
          <span className="chip bg-primary/10 text-primary">{q.kind === 'grammar' ? t('german.grammarQ') : t('german.vocabQ')}</span>
          <div className="text-2xl font-black text-center py-4" dir="ltr">{q.prompt}</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {q.options.map((o) => {
              const picked = answered !== undefined;
              const correct = o === q.answer;
              const chosen = answered === o;
              const cls = !picked
                ? 'border-slate-200 dark:border-slate-700 hover:border-primary'
                : correct ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                : chosen ? 'border-red-500 bg-red-500/10 text-red-600'
                : 'border-slate-200 dark:border-slate-800 opacity-50';
              return (
                <button
                  key={o}
                  disabled={picked}
                  onClick={() => setRun((r) => ({ ...r, answers: { ...r.answers, [r.idx]: o } }))}
                  className={`p-3.5 rounded-xl border-2 text-sm font-semibold text-center transition-all ${cls}`}
                  dir={q.kind === 'vocab' ? 'rtl' : 'ltr'}
                >{o}</button>
              );
            })}
          </div>
          {answered !== undefined && (
            <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${isCorrect ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
              {isCorrect ? <CheckIcon size={15} /> : <XIcon size={15} />}
              <span>{isCorrect ? t('german.correct') : `${t('german.wrong')} · ${q.answer}`}</span>
              <button
                onClick={() => {
                  const lastIdx = run.idx;
                  const isLast = lastIdx + 1 >= run.questions.length;
                  if (isLast) {
                    const { correct, total, percent } = scoreAttempt(run.questions, run.answers);
                    german.addTestAttempt({ level, correct, total, percent, passed: isPassed(percent) });
                    german.mutateLastTestDate?.(new Date().toISOString().slice(0, 10));
                    setRun((r) => ({ ...r, idx: r.questions.length }));
                  } else {
                    setRun((r) => ({ ...r, idx: r.idx + 1 }));
                  }
                }}
                className="ms-auto px-3 py-1.5 rounded-lg bg-white/70 dark:bg-slate-900/70 text-xs font-bold hover:bg-white dark:hover:bg-slate-900"
              >{t('german.next')}</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- level picker ----
  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TestIcon size={16} className="text-primary" />
          <h3 className="font-bold text-sm">{t('german.levelTest')}</h3>
        </div>
        <p className="text-xs text-slate-400">{t('german.testHint', { n: String(LEVEL_CONFIG.testSize), pass: String(LEVEL_CONFIG.passingThreshold) })}</p>
        {!canTest && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 text-amber-600 text-sm">
            <LockIcon size={15} />
            <span>{t('german.testLimitToday', { date: german.lastTestDate })}</span>
          </div>
        )}
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label className="label">{t('german.chooseLevel')}</label>
            <Select value={level} onChange={setLevel} options={GERMAN_LEVELS.map((l) => ({ value: l, label: l }))} />
          </div>
          <Button onClick={start} disabled={!canTest}>
            {t('german.startTest')}
          </Button>
        </div>
        {(best || last) && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="text-[11px] text-slate-400">{t('german.bestResult')}</div>
              <div className="text-lg font-black mt-0.5 tabular-nums">{best ? `${localizeDigits(String(best.percent), lang)}%` : '—'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="text-[11px] text-slate-400">{t('german.lastResult')}</div>
              <div className="text-lg font-black mt-0.5 tabular-nums">{last ? `${localizeDigits(String(last.percent), lang)}%` : '—'}</div>
            </div>
          </div>
        )}
      </div>

      <div className="card p-4">
        <h3 className="font-bold text-sm mb-3">{t('german.attemptHistory')}</h3>
        {(german.testAttempts || []).length === 0 ? (
          <p className="text-sm text-slate-400 py-3">{t('german.noAttempts')}</p>
        ) : (
          <div className="space-y-2">
            {(german.testAttempts || []).slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="font-bold text-sm shrink-0 w-12">{a.level}</span>
                <span className="font-black text-sm tabular-nums">{localizeDigits(String(a.correct), lang)}/{localizeDigits(String(a.total), lang)}</span>
                <span className={`text-sm font-bold tabular-nums ${a.passed ? 'text-emerald-500' : 'text-amber-500'}`}>{localizeDigits(String(a.percent), lang)}%</span>
                <span className="text-[11px] text-slate-400 ms-auto tabular-nums">{fmtDate(a.date, lang, 'd MMM')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
