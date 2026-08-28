import React, { useMemo } from 'react';
import Card from '../../../Common/Card';
import EmptyState from '../../../Common/EmptyState';
import { gymT } from '../lib/i18n';
import { workoutVolume, setsDone, streakWeeks, weekKey, bestSetOf, estimate1RM, isoOf } from '../lib/calc';
import { exOr, EXIDX } from '../lib/exercises';
import { localizeDigits, fmtShort } from '../../../../utils/dateUtils';

// GitHub-style year heatmap of training days (workouts per day → intensity).
export function Heatmap({ workouts, lang }) {
  const grid = useMemo(() => {
    const col = new Map();
    workouts.forEach((w) => col.set(w.d, (col.get(w.d) || 0) + 1));
    const today = new Date();
    const start = new Date(today); start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - (25 * 7));
    const weeks = [];
    const cur = new Date(start);
    for (let w = 0; w < 26; w++) {
      const colCells = [];
      for (let d = 0; d < 7; d++) {
        const iso = isoOf(cur);
        const n = col.get(iso) || 0;
        colCells.push({ iso, n, week: w, day: d });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(colCells);
    }
    return weeks;
  }, [workouts]);

  const cellColor = (n) => {
    if (n === 0) return 'transparent';
    const levels = ['rgb(var(--c-primary) / 0.18)', 'rgb(var(--c-primary) / 0.35)', 'rgb(var(--c-primary) / 0.55)', 'rgb(var(--c-primary) / 0.8)', 'rgb(var(--c-primary))'];
    return levels[Math.min(n - 1, levels.length - 1)];
  };

  return (
    <div className="flex gap-1 overflow-x-auto pb-1" style={{ direction: 'ltr' }}>
      {grid.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((c) => (
            <div
              key={c.iso}
              title={`${c.iso} · ${localizeDigits(c.n, lang)}`}
              className="h-2.5 w-2.5 rounded-[3px] border border-slate-200 dark:border-slate-800"
              style={{ background: cellColor(c.n) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Muscle balance — how much each target muscle got trained over all workouts.
export function MuscleBalance({ workouts, lang }) {
  const rows = useMemo(() => {
    const acc = {};
    let total = 0;
    workouts.forEach((w) => w.entries.forEach((e) => {
      const ex = e.id ? EXIDX[e.id] : null;
      const tg = ex?.tg || 'misc';
      const sets = e.sets.filter((s) => s.done).length;
      if (!sets) return;
      acc[tg] = (acc[tg] || 0) + sets;
      total += sets;
    }));
    return Object.entries(acc).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v).map((r) => ({ ...r, pct: total ? Math.round((r.v / total) * 100) : 0 }));
  }, [workouts]);

  if (!rows.length) return <EmptyState message={gymT(lang, 'empty')} icon={<span className="text-3xl">💪</span>} />;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.k} className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-24 shrink-0 truncate">{r.k}</span>
          <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: 'rgb(var(--c-primary))' }} />
          </div>
          <span className="text-xs text-slate-400 w-10 text-end tabular-nums">{localizeDigits(r.pct, lang)}٪</span>
        </div>
      ))}
    </div>
  );
}

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
        <h3 className="font-bold text-sm mb-2">🟩 {gymT(lang, 'heatmap')}</h3>
        <Heatmap workouts={S.workouts} lang={lang} />
      </Card>

      <Card className="!p-4">
        <h3 className="font-bold text-sm mb-2">💪 {gymT(lang, 'muscleMap')}</h3>
        <MuscleBalance workouts={S.workouts} lang={lang} />
      </Card>

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
