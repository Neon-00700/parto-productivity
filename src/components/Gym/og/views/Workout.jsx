import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlay, FiPlus, FiMinus, FiX, FiCheck, FiChevronLeft, FiChevronRight, FiShuffle, FiInfo } from 'react-icons/fi';
import Card from '../../../Common/Card';
import Button from '../../../Common/Button';
import EmptyState from '../../../Common/EmptyState';
import Stepper from '../components/Stepper';
import RestTimer from '../components/RestTimer';
import ExercisePicker from '../components/ExercisePicker';
import { gymT } from '../lib/i18n';
import { effectiveRoutine, todayISO, modeOf, isBw, isPerSide, supersetUnits, setsDoneActive, bestWeightFor, lastEntryFor } from '../lib/calc';
import { exOr } from '../lib/exercises';
import { startFlow, finishWorkout, discardWorkout, setField, addSet, removeSet, setActiveCur, confirmWorkingWeight } from '../lib/session';
import { localizeDigits } from '../../../../utils/dateUtils';

// Effort scale meta (RIR / RPE). Optional third column.
const EFFORT = {
  rir: { f: 'rir', hd: 'RIR', step: 0.5, min: 0, max: 10 },
  rpe: { f: 'rpe', hd: 'RPE', step: 0.5, min: 6, max: 10 },
};
const effortOf = (S) => { const e = S.effort; return e === 'none' || !EFFORT[e] ? null : e; };

function Elapsed({ start }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(iv);
  }, []);
  const s = Math.max(0, Math.floor((Date.now() - start) / 1000));
  return <span dir="ltr">{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</span>;
}

function StartChooser({ api }) {
  const { S, go, lang } = api;
  const todayR = effectiveRoutine(S, todayISO());
  const others = S.routines.filter((r) => r !== todayR);
  return (
    <div className="space-y-3">
      {todayR && (
        <Card className="!p-4" style={{ borderColor: 'rgb(var(--c-primary))' }}>
          <p className="text-xs" style={{ color: 'rgb(var(--c-primary))' }}>{gymT(lang, 'planToday')}</p>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="font-bold text-lg">{todayR.name}</p>
              <p className="text-xs text-slate-400">{gymT(lang, 'xExercises', localizeDigits(todayR.ex.length, lang))}</p>
            </div>
            <Button onClick={() => startFlow(api, todayR.id)}><FiPlay size={15} /> {gymT(lang, 'start')}</Button>
          </div>
        </Card>
      )}

      {others.length > 0 && (
        <>
          <h4 className="font-bold text-sm">{gymT(lang, 'otherRoutines')}</h4>
          <div className="space-y-2">
            {others.map((r) => (
              <Card key={r.id} className="!p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{r.emoji} {r.name}</p>
                  <p className="text-xs text-slate-400">{gymT(lang, 'xExercises', localizeDigits(r.ex.length, lang))}</p>
                </div>
                <Button variant="soft" onClick={() => startFlow(api, r.id)}><FiPlay size={14} /> {gymT(lang, 'start')}</Button>
              </Card>
            ))}
          </div>
        </>
      )}

      <Button variant="ghost" className="w-full !justify-center" onClick={() => startFlow(api, null)}><FiShuffle size={15} /> {gymT(lang, 'freestyle')}</Button>

      {!S.routines.length && (
        <div className="pt-2">
          <EmptyState message={gymT(lang, 'noRoutinesHint')} action={<Button variant="soft" onClick={() => go('home')}>{gymT(lang, 'buildPlanFirst')}</Button>} />
        </div>
      )}
    </div>
  );
}

// Counts down a timed set and checks it off once the target is reached.
function WorkTimer({ sec, onDone }) {
  const [left, setLeft] = useState(sec);
  useEffect(() => {
    if (left <= 0) { onDone(); return; }
    const iv = setInterval(() => setLeft((v) => v - 1), 1000);
    return () => clearInterval(iv);
  }, [left]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return <span className="text-[11px] font-bold tabular-nums" dir="ltr" style={{ color: 'rgb(var(--c-primary))' }}>{mm}:{ss}</span>;
}

function ExerciseBlock({ api, entryIdx, compact = false, onRest }) {
  const { S, update, lang } = api;
  const entry = S.active.entries[entryIdx];
  const [running, setRunning] = useState(-1);
  const startTimed = (i) => {
    const t = entry.sets[i].sec || 30;
    setRunning(i);
    setField(api, entryIdx, i, 'sec', t);
  };
  const ex = exOr(entry.id);
  const mode = modeOf(entry.target);
  const cardio = mode === 'cardio';
  const timed = mode === 'time';
  const cfg = { ...(entry.target || {}), id: entry.id };
  const bw = !cardio && isBw(cfg);
  const added = bw && entry.sets.some((s) => s.w > 0);
  const best = cardio ? 0 : Math.max(bestWeightFor(S, entry.id), (S.exWeights?.[entry.id] || {}).w || 0);
  const last = lastEntryFor(S, entry.id);
  const kind = effortOf(S);
  const eff = EFFORT[kind] || null;

  const col1 = cardio ? 'min' : timed ? 'sec' : 'w';
  const col1Label = cardio ? gymT(lang, 'durationMin') : timed ? gymT(lang, 'seconds') : gymT(lang, 'weight');
  const col2 = cardio ? 'speed' : timed ? (bw && !added ? null : 'w') : 'r';
  const col2Label = cardio ? gymT(lang, 'speed') : timed ? (bw && !added ? null : gymT(lang, 'weight')) : gymT(lang, 'reps');
  const effF = eff && mode === 'reps' ? eff.f : null;

  // Progression reason ("why this number?").
  const plan = entry.plan;
  const why = plan?.why ? gymT(lang, plan.why[0], ...plan.why.slice(1)) : null;

  const bump = (i, col, dir, meta) => {
    const cur = entry.sets[i][col];
    if (meta) {
      // effort: step on its own scale; empty is not 0
      if (cur == null) return setField(api, entryIdx, i, col, dir < 0 ? null : meta.min);
      let n = Math.round((cur + dir * meta.step) * 100) / 100;
      if (dir < 0 && n < meta.min) return setField(api, entryIdx, i, col, null);
      n = dir > 0 ? Math.min(meta.max, n) : Math.max(meta.min, n);
      return setField(api, entryIdx, i, col, n);
    }
    const step = cardio ? (col === 'speed' ? 0.5 : 1) : timed ? 5 : (col === 'r' ? (isPerSide(cfg) ? 2 : 1) : 2.5);
    const dec = col === 'speed';
    const n = Math.max(0, Math.round(((cur || 0) + dir * step) * (dec ? 100 : 1)) / (dec ? 100 : 1));
    setField(api, entryIdx, i, col, n);
  };
  const typeEff = (i, col, v) => { const n = Number(v); if (!isFinite(n)) return setField(api, entryIdx, i, col, null); setField(api, entryIdx, i, col, Math.min(EFFORT[kind].max, Math.max(0, n))); };

  const cell = (i, col, meta) => (
    <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/70 p-0.5">
      <button type="button" onClick={() => bump(i, col, -1, meta)} className="h-7 w-7 grid place-items-center rounded-md text-slate-400 hover:text-primary"><FiMinus size={12} /></button>
      <input
        className="bg-transparent text-center font-bold tabular-nums outline-none text-slate-800 dark:text-slate-100 w-11 text-sm"
        inputMode="decimal"
        value={entry.sets[i][col] == null ? '' : localizeDigits(entry.sets[i][col], lang)}
        onChange={(e) => {
          if (meta) return typeEff(i, col, e.target.value);
          if (e.target.value === '') return setField(api, entryIdx, i, col, 0);
          const n = Number(e.target.value); if (isFinite(n)) setField(api, entryIdx, i, col, Math.max(0, n));
        }}
      />
      <button type="button" onClick={() => bump(i, col, 1, meta)} className="h-7 w-7 grid place-items-center rounded-md text-slate-400 hover:text-primary"><FiPlus size={12} /></button>
    </div>
  );

  const toggle = (i) => {
    update((st) => {
      st.active.entries[entryIdx].sets[i].done = !st.active.entries[entryIdx].sets[i].done;
    });
    const now = !entry.sets[i].done;
    const allDone = entry.sets.map((x, xi) => (xi === i ? now : x.done)).every(Boolean);
    if (allDone) {
      confirmWorkingWeight(api, entryIdx);
      onRest?.();
    }
  };

  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between mb-2">
        <p className={`font-bold ${compact ? 'text-base' : 'text-lg'} capitalize`}>{ex.n}</p>
        <FiInfo className="text-slate-300" size={15} />
      </div>
      <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-400 mb-2">
        {ex.tg && <span className="chip">{ex.tg}</span>}
        {ex.eq && <span className="chip">{ex.eq}</span>}
        {best > 0 && <span className="chip">{gymT(lang, 'best')} {localizeDigits(best, lang)} {S.unit}</span>}
        {isPerSide(cfg) && <span className="chip">{gymT(lang, 'perSide', localizeDigits((entry.sets[0]?.r || 0) / 2, lang))}</span>}
        {cardio && <span className="chip">🏃 {gymT(lang, 'cardio')}</span>}
      </div>
      {last && (
        <p className="text-[11px] text-slate-400 mb-2">
          {gymT(lang, 'lastTime')}: {last.sets.map((s) => `${localizeDigits(s.w || 0, lang)}×${localizeDigits(s.r || 0, lang)}`).join(', ')}
        </p>
      )}
      {why && (
        <p className="text-[11px] rounded-lg px-2.5 py-1.5 mb-2" style={{ background: plan.kind === 'deload' ? 'rgb(239 68 68 / 0.12)' : 'rgb(var(--c-primary) / 0.10)', color: plan.kind === 'deload' ? '#ef4444' : 'rgb(var(--c-primary))' }}>
          {plan.kind === 'up' ? '▲ ' : plan.kind === 'deload' ? '▼ ' : '• '}{why}
        </p>
      )}

      <div className="space-y-1.5">
        {entry.sets.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 flex-wrap">
            <span className="w-5 text-center text-xs font-bold text-slate-400">{localizeDigits(i + 1, lang)}</span>
            {cell(i, col1)}
            {col2 && cell(i, col2)}
            {effF && cell(i, effF, EFFORT[kind])}
            <span className="text-[10px] text-slate-400 w-14 text-end">{col1Label}</span>
            {timed && running === i && !entry.sets[i].done && (
              <WorkTimer sec={entry.sets[i].sec || 30} onDone={() => { setRunning(-1); toggle(i); }} />
            )}
            {timed && running !== i && !entry.sets[i].done && (
              <button
                type="button"
                onClick={() => startTimed(i)}
                className="h-7 w-7 rounded-lg grid place-items-center border border-primary/40 text-primary hover:bg-primary/10"
                style={{ color: 'rgb(var(--c-primary))' }}
                aria-label="Start set"
              >
                <FiPlay size={12} />
              </button>
            )}
            <button
              onClick={() => { setRunning(-1); toggle(i); }}
              className={`ml-auto h-7 w-7 shrink-0 rounded-lg grid place-items-center border-2 ${
                s.done ? 'border-transparent text-white' : 'border-slate-300 dark:border-slate-600 text-transparent'
              }`}
              style={s.done ? { background: 'rgb(var(--c-primary))' } : undefined}
            >
              <FiCheck size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        <Button variant="ghost" className="!py-1.5 !text-xs" disabled={entry.sets.length <= 1} onClick={() => removeSet(api, entryIdx)}>
          <FiMinus size={13} /> {gymT(lang, 'removeSet')}
        </Button>
        <Button variant="soft" className="!py-1.5 !text-xs" onClick={() => addSet(api, entryIdx)}>
          <FiPlus size={13} /> {gymT(lang, 'addSet')}
        </Button>
        {eff && !cardio && !timed && <Button variant="ghost" className="!py-1.5 !text-xs" disabled onClick={() => {}}>{EFFORT[kind].hd}</Button>}
      </div>
    </Card>
  );
}

function ActiveWorkout({ api }) {
  const { S, update, lang, go } = api;
  const A = S.active;
  const [restTrigger, setRestTrigger] = useState(0);
  const units = supersetUnits(A.entries);
  const cur = Math.min(A.cur, Math.max(0, A.entries.length - 1));
  const unitIdx = Math.max(0, units.findIndex((u) => u.includes(cur)));
  const total = A.entries.reduce((n, e) => n + e.sets.length, 0);
  const done = setsDoneActive(A);
  const isSuperset = units[unitIdx]?.length > 1;

  const onFinish = () => {
    finishWorkout(api);
    toast.success(gymT(lang, 'workoutSaved'));
    go('stats');
  };
  const onDiscard = () => {
    discardWorkout(api);
    toast(gymT(lang, 'workoutDiscarded'), { icon: '🗑️' });
  };

  return (
    <div className="space-y-3">
      <RestTimer lang={lang} trigger={Math.max(restTrigger, 0) || 0} restSec={S.restSec} />

      <div className="flex items-center justify-between">
        <button onClick={onDiscard} className="p-2 rounded-xl text-slate-400 hover:text-red-500"><FiX size={18} /></button>
        <div className="text-center">
          <p className="font-bold">{A.name}</p>
          <p className="text-xs text-slate-400"><Elapsed start={A.start} /> · {done}/{total} {gymT(lang, 'sets')}</p>
        </div>
        <button onClick={onFinish} className="p-2 rounded-xl text-slate-400 hover:text-primary" style={{ color: 'rgb(var(--c-primary))' }}><FiCheck size={20} /></button>
      </div>

      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%`, background: 'rgb(var(--c-primary))' }} />
      </div>

      {A.entries.length === 0 ? (
        <EmptyState message={gymT(lang, 'freestyle')} icon={<span className="text-3xl">🏋️</span>} />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            {isSuperset ? gymT(lang, 'superset#', localizeDigits(unitIdx + 1, lang), localizeDigits(units.length, lang))
              : gymT(lang, 'exercise#', localizeDigits(unitIdx + 1, lang), localizeDigits(units.length, lang))}
          </p>
          {units[unitIdx].map((idx) => (
            <ExerciseBlock key={idx} api={api} entryIdx={idx} compact={isSuperset} onRest={() => { setRestTrigger(Date.now()); }} />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="ghost" disabled={unitIdx <= 0} onClick={() => setActiveCur(api, units[unitIdx - 1][0])}>
          <FiChevronLeft size={15} /> {gymT(lang, 'back')}
        </Button>
        <Button variant="ghost" disabled={unitIdx >= units.length - 1} onClick={() => setActiveCur(api, units[unitIdx + 1][0])}>
          {gymT(lang, 'next')} <FiChevronRight size={15} />
        </Button>
      </div>

      <AddExerciseInWorkout api={api} />
    </div>
  );
}

function AddExerciseInWorkout({ api }) {
  const { S, update, lang } = api;
  const [open, setOpen] = useState(false);
  const add = (exId) => {
    update((s) => {
      const cfg = { id: exId, sets: 3, reps: 10, weight: 0, mode: 'reps' };
      const plan = { kind: 'first', why: ['prog.first'], policy: 'linear' };
      s.active.entries.push({ id: exId, target: cfg, sets: Array.from({ length: cfg.sets }, () => ({ w: 0, r: cfg.reps, done: false })), plan });
      s.active.cur = s.active.entries.length - 1;
    });
  };
  return (
    <>
      <Button variant="soft" className="w-full !justify-center" onClick={() => setOpen(true)}>
        <FiPlus size={15} /> {gymT(lang, 'addExercise')}
      </Button>
      <ExercisePicker open={open} onClose={() => setOpen(false)} onSelect={add} state={S} lang={lang} />
    </>
  );
}

export default function Workout({ api }) {
  const { S } = api;
  return S.active ? <ActiveWorkout api={api} /> : <StartChooser api={api} />;
}
