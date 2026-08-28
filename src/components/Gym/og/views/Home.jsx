import React, { useMemo } from 'react';
import { FiPlay, FiChevronRight, FiTarget } from 'react-icons/fi';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceDot } from 'recharts';
import Button from '../../../Common/Button';
import Card from '../../../Common/Card';
import EmptyState from '../../../Common/EmptyState';
import { gymT } from '../lib/i18n';
import { effectiveRoutine, lastBW, streakWeeks, todayISO } from '../lib/calc';
import { exOr } from '../lib/exercises';
import { localizeDigits, fmtShort } from '../../../../utils/dateUtils';
import { startFlow } from '../lib/session';

export default function Home({ api }) {
  const { S, update, set, lang, go } = api;
  const routine = effectiveRoutine(S, todayISO());
  const bw = lastBW(S);
  const prevBW = S.bodyweight.length > 1 ? S.bodyweight[S.bodyweight.length - 2] : null;
  const delta = bw && prevBW ? bw.w - prevBW.w : null;

  const chartData = useMemo(
    () => S.bodyweight.slice(-40).map((b) => ({ d: fmtShort(b.d, lang), w: Number(b.w) || null })),
    [S.bodyweight, lang]
  );
  const hasChart = chartData.length >= 2;

  return (
    <div className="space-y-3">
      {/* Today's action */}
      <Card className="!p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <p className="text-xs text-slate-400">{gymT(lang, 'today')}</p>
            <p className="font-bold text-lg leading-tight">{S.active ? S.active.name : routine ? routine.name : gymT(lang, 'restDay')}</p>
          </div>
          {routine ? (
            <button
              onClick={() => { startFlow(api, routine.id); go('workout'); }}
              className="btn-primary !px-4 flex items-center gap-1.5"
            >
              <FiPlay size={14} /> {gymT(lang, 'start')}
            </button>
          ) : S.active ? (
            <Button onClick={() => go('workout')}>{gymT(lang, 'resume')}</Button>
          ) : null}
        </div>
        {routine && routine.ex.length > 0 && (
          <p className="text-xs text-slate-400">
            {gymT(lang, 'xExercises', localizeDigits(routine.ex.length, lang))}
          </p>
        )}
        {(!S.routines.length && !S.active) && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <Button variant="soft" onClick={() => go('plan')}>{gymT(lang, 'buildPlanFirst')}</Button>
            <Button variant="ghost" onClick={() => go('workout')}>{gymT(lang, 'freestyle')}</Button>
          </div>
        )}
      </Card>

      {/* Body weight */}
      <Card className="!p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm">⚖️ {gymT(lang, 'bodyWeight')}</h3>
          <Button variant="ghost" onClick={() => go('body')} className="!py-1.5 !text-xs">
            {gymT(lang, 'logWeightNow')} <FiChevronRight size={14} />
          </Button>
        </div>
        {bw ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold" dir="ltr">{localizeDigits(bw.w, lang)}</span>
              <span className="text-slate-400 text-sm">{S.unit}</span>
              {!!delta && (
                <span className={`text-xs font-semibold ${delta > 0 ? 'text-red-500' : 'text-emerald-500'}`} dir="ltr">
                  {delta > 0 ? '+' : ''}{localizeDigits(Math.abs(delta), lang)}
                </span>
              )}
            </div>
            {S.targetW && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'rgb(var(--c-primary))' }}>
                <FiTarget size={12} /> {gymT(lang, 'targetWeight')}: {localizeDigits(S.targetW, lang)} {S.unit}
              </p>
            )}
            {hasChart ? (
              <div className="h-40 mt-2" dir="ltr">
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={10} />
                    <YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} fontSize={10} width={40} />
                    <Tooltip contentStyle={{ background: 'rgb(30 41 59)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                    {S.targetW && <ReferenceLine y={S.targetW} stroke="rgb(var(--c-accent))" strokeDasharray="4 4" />}
                    <Line type="monotone" dataKey="w" stroke="rgb(var(--c-primary))" strokeWidth={2.5} dot={{ r: 2.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message={gymT(lang, 'noBW')} icon={<span className="text-3xl">⚖️</span>} />
            )}
          </>
        ) : (
          <EmptyState message={gymT(lang, 'noBW')} icon={<span className="text-3xl">⚖️</span>} action={<Button variant="soft" onClick={() => go('body')}>{gymT(lang, 'logWeightNow')}</Button>} />
        )}
      </Card>

      {/* Streak */}
      <button onClick={() => go('stats')} className="w-full text-start">
        <Card className="!p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold">
              <span>🔥</span>
              {gymT(lang, 'streak', localizeDigits(streakWeeks(S), lang))}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {gymT(lang, 'workoutTotal', localizeDigits(S.workouts.length, lang))}
            </p>
          </div>
          <FiChevronRight className="text-slate-300" size={20} />
        </Card>
      </button>
    </div>
  );
}
