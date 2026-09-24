import React, { useMemo, useState } from 'react';
import { GrammarIcon, RefreshIcon, CheckIcon, XIcon, ChevronDownIcon } from '../icons';
import Button from '../Common/Button';
import EmptyState from '../Common/EmptyState';
import { useTranslation } from '../../hooks/useTranslation';
import { GRAMMAR_TOPICS, GERMAN_LEVELS } from '../../data/german/model.js';
import { isDue, daysUntilDue } from '../../utils/germanUtils';
import { localizeDigits } from '../../utils/dateUtils';

const GRADES = [
  { id: 'again', label: 'دوباره', cls: 'bg-red-500/10 text-red-500' },
  { id: 'hard', label: 'سخت', cls: 'bg-orange-500/10 text-orange-500' },
  { id: 'good', label: 'خوب', cls: 'bg-sky-500/10 text-sky-500' },
  { id: 'easy', label: 'آسان', cls: 'bg-emerald-500/10 text-emerald-500' },
];

export default function GrammarReview({ german }) {
  const { t, lang } = useTranslation();
  const [session, setSession] = useState(null);
  const [openLevel, setOpenLevel] = useState(GERMAN_LEVELS[0]);

  const byLevel = useMemo(() => {
    const map = {};
    for (const l of GERMAN_LEVELS) map[l] = GRAMMAR_TOPICS.filter((g) => g.level === l);
    return map;
  }, []);

  const startSession = () => {
    const due = GRAMMAR_TOPICS.filter((g) => isDue(german.reviews[`grammar:${g.id}`]));
    const pool = due.length ? due : GRAMMAR_TOPICS.filter((g) => (german.reviews[`grammar:${g.id}`] || {}).status !== 'mastered');
    const queue = (pool.length ? pool : GRAMMAR_TOPICS).slice(0, 10);
    setSession({ queue, idx: 0, answers: {}, correct: 0 });
  };

  if (session) {
    const q = session.queue[session.idx];
    const answered = session.answers[session.idx];
    if (!q) {
      const total = session.queue.length;
      return (
        <div className="max-w-md mx-auto card p-8 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckIcon size={26} />
          </div>
          <h3 className="text-lg font-black">{t('german.reviewDone')}</h3>
          <div className="text-4xl font-black text-primary tabular-nums">
            {localizeDigits(String(session.correct), lang)} / {localizeDigits(String(total), lang)}
          </div>
          <Button onClick={() => setSession(null)}>{t('german.backToGrammar')}</Button>
        </div>
      );
    }
    const isCorrect = answered === q.answer;
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <button onClick={() => setSession(null)} className="hover:text-primary">{t('german.exit')}</button>
          <span className="tabular-nums">{localizeDigits(String(session.idx + 1), lang)} / {localizeDigits(String(session.queue.length), lang)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(session.idx / session.queue.length) * 100}%` }} />
        </div>
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="chip bg-primary/10 text-primary">{q.level}</span>
            <span className="text-xs text-slate-400">{q.title} · {q.term}</span>
          </div>
          <p className="text-sm text-slate-500 leading-7">{q.explanation}</p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60" dir="ltr">
            <div className="text-[11px] text-slate-400 mb-1.5">{t('german.example')}</div>
            <div className="font-semibold text-lg" dir="ltr">{q.example}</div>
          </div>
          <div>
            <div className="text-sm font-bold mb-2">{t('german.completeSentence')}</div>
            <div className="text-lg font-semibold p-3 rounded-xl border border-slate-200 dark:border-slate-800" dir="ltr">{q.question}</div>
            <div className="grid sm:grid-cols-3 gap-2 mt-3">
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
                    onClick={() => {
                      const ok = o === q.answer;
                      setSession((s) => ({
                        ...s,
                        answers: { ...s.answers, [s.idx]: o },
                        correct: s.correct + (ok ? 1 : 0),
                      }));
                      german.recordReview('grammar', q.id, ok ? 'good' : 'again');
                    }}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold text-center transition-all ${cls}`}
                    dir="ltr"
                  >{o}</button>
                );
              })}
            </div>
          </div>
          {answered !== undefined && (
            <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${isCorrect ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
              {isCorrect ? <CheckIcon size={15} /> : <XIcon size={15} />}
              <span>{isCorrect ? t('german.correct') : `${t('german.wrong')} · ${q.answer}`}</span>
              <button
                onClick={() => setSession((s) => ({ ...s, idx: s.idx + 1 }))}
                className="ms-auto px-3 py-1.5 rounded-lg bg-white/70 dark:bg-slate-900/70 text-xs font-bold hover:bg-white dark:hover:bg-slate-900"
              >{t('german.next')}</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const dueCount = GRAMMAR_TOPICS.filter((g) => isDue(german.reviews[`grammar:${g.id}`])).length;

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm">{t('german.grammarReview')}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {dueCount > 0 ? t('german.reviewsReady', { n: String(dueCount) }) : t('german.allCaughtUp')}
          </p>
        </div>
        <Button onClick={startSession} disabled={!GRAMMAR_TOPICS.length}>
          <RefreshIcon size={15} /> {t('german.startReview')}
        </Button>
      </div>

      {GERMAN_LEVELS.map((lvl) => {
        const topics = byLevel[lvl];
        if (!topics.length) return null;
        const open = openLevel === lvl;
        const dueLvl = topics.filter((g) => isDue(german.reviews[`grammar:${g.id}`])).length;
        return (
          <div key={lvl} className="card overflow-hidden">
            <button onClick={() => setOpenLevel(open ? null : lvl)} className="w-full p-4 flex items-center gap-3 text-start">
              <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">{lvl}</span>
              <div className="flex-1">
                <div className="font-bold text-sm">{t('german.level')} {lvl}</div>
                <div className="text-xs text-slate-400">{localizeDigits(String(topics.length), lang)} {t('german.topics')} · {localizeDigits(String(dueLvl), lang)} {t('german.dueNow')}</div>
              </div>
              {dueLvl > 0 && <span className="chip bg-amber-500/10 text-amber-500">{localizeDigits(String(dueLvl), lang)}</span>}
              <ChevronDownIcon size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="px-4 pb-4 space-y-2">
                {topics.map((g) => {
                  const st = german.reviews[`grammar:${g.id}`] || { status: 'new', due: null };
                  return (
                    <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{g.title}</div>
                        <div className="text-xs text-slate-400 truncate">{g.term} · {g.example}</div>
                      </div>
                      <StatusChip status={st.status} due={st.due} t={t} lang={lang} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusChip({ status, due, t, lang }) {
  const map = {
    new: 'bg-slate-100 dark:bg-slate-800 text-slate-400',
    learning: 'bg-amber-500/10 text-amber-500',
    review: 'bg-sky-500/10 text-sky-500',
    mastered: 'bg-emerald-500/10 text-emerald-500',
  };
  const d = due ? daysUntilDue({ due }) : null;
  const sub = d === null ? '' : d <= 0 ? t('german.dueTodayLabel') : t('german.dueInDays', { n: String(d) });
  return (
    <div className="shrink-0 text-end">
      <span className={`chip ${map[status] || map.new}`}>{t(`german.st_${status}`)}</span>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
