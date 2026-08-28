import React, { useMemo } from 'react';
import Card from '../../../Common/Card';
import EmptyState from '../../../Common/EmptyState';
import { gymT } from '../lib/i18n';
import { workoutVolume, setsDone, streakWeeks, weekKey, bestSetOf, estimate1RM } from '../lib/calc';
import { exOr } from '../lib/exercises';
import { localizeDigits, fmtShort } from '../../../../utils/dateUtils';

export default function Stats({ api }) {
  const { S, lang } = api;
  const totalVolume = useMemo(() => S.workouts.reduce((n, w) => n + workoutVolume(w), 0), [S.workouts]);
  const thisWeek = S.workouts.filter((w) => weekKey(w.d) === weekKey(new Date().toISOString().slice(0, 10))).length;
  const streak = streakWeeks(S);
  const history = useMemo(() => S.workouts.slice().reverse(), [S.workouts]);

  // All-time best estimated 1RM per exercise.
  const records = useMemo(() => {
    const map = {};
    S.workouts.forEach((w) => w.entries.forEach((e) => {
      const best = bestSetOf(e);
      if (best) {
        const cur = map[e.id];
        if (!cur || best.est > cur.est) map[e.id] = { ...best, d: w.d };
      }
    }));
    return Object.entries(map).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.est - a.est);
  }, [S.workouts]);

  const CardStat = ({ label, value, icon }) => (
    <Card className="!p-3.5">
      <p className="text-xs text-slate-400">{icon} {label}</p>
      <p className="text-xl font-extrabold mt-1" style={{ color: 'rgb(var(--c-primary))' }}>{value}</p>
    </Card>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <CardStat label={gymT(lang, 'totalWorkouts')} value={localizeDigits(S.workouts.length, lang)} icon="🏋️" />
        <CardStat label={gymT(lang, 'thisWeek')} value={localizeDigits(thisWeek, lang)} icon="📅" />
        <CardStat label={gymT(lang, 'streakLabel')} value={localizeDigits(streak, lang)} icon="🔥" />
        <CardStat label={gymT(lang, 'totalVolume')} value={localizeDigits(totalVolume, lang)} icon="📊" />
      </div>

      <Card className="!p-4">
        <h3 className="font-bold text-sm mb-2">🏆 {gymT(lang, 'prs')}</h3>
        {records.length === 0 ? (
          <EmptyState message={gymT(lang, 'empty')} icon={<span className="text-3xl">🏆</span>} />
        ) : (
          <div className="space-y-1.5">
            {records.map((r) => {
              const ex = exOr(r.id);
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm">
                  <span className="font-medium flex-1 capitalize truncate">{ex.n}</span>
                  <span className="text-xs text-slate-400">{fmtShort(r.d, lang)}</span>
                  <span className="font-bold tabular-nums" dir="ltr">{localizeDigits(r.est, lang)} {S.unit}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="!p-4">
        <h3 className="font-bold text-sm mb-2">🗂️ {gymT(lang, 'history')}</h3>
        {history.length === 0 ? (
          <EmptyState message={gymT(lang, 'empty')} icon={<span className="text-3xl">🗂️</span>} />
        ) : (
          <div className="space-y-1.5">
            {history.map((w) => (
              <div key={w.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{w.name}</span>
                  <span className="text-xs text-slate-400">{fmtShort(w.d, lang)}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {localizeDigits(w.entries.filter((e) => e.sets.some((s) => s.done)).length, lang)} {gymT(lang, 'exercise')} · {localizeDigits(setsDone(w), lang)} {gymT(lang, 'sets')} · {gymT(lang, 'volume')} {localizeDigits(workoutVolume(w), lang)} {S.unit}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
