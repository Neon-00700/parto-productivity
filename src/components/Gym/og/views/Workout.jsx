import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlay, FiPlus, FiMinus, FiX, FiCheck, FiChevronLeft, FiChevronRight, FiShuffle } from 'react-icons/fi';
import Card from '../../../Common/Card';
import Button from '../../../Common/Button';
import EmptyState from '../../../Common/EmptyState';
import Stepper from '../components/Stepper';
import RestTimer from '../components/RestTimer';
import ExercisePicker from '../components/ExercisePicker';
import { gymT } from '../lib/i18n';
import { effectiveRoutine, todayISO, modeOf, isBw, isPerSide, supersetUnits, unitOf, setsDoneActive, bestWeightFor, lastEntryFor, estimate1RM } from '../lib/calc';
import { exOr } from '../lib/exercises';
import { startFlow, finishWorkout, discardWorkout, setField, addSet, removeSet, setActiveCur } from '../lib/session';
import { localizeDigits } from '../../../../utils/dateUtils';

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

function ExerciseBlock({ api, entryIdx, compact = false, onRest }) {
  const { S, update, lang } = api;
  const A = S.active;
  const entry = A.entries[entryIdx];
  const ex = exOr(entry.id);
  const mode = modeOf(entry.target);
  const cardio = mode === 'cardio';
  const timed = mode === 'time';
  const cfg = { ...(entry.target || {}), id: entry.id };
  const bw = !cardio && isBw(cfg);
  const added = bw && entry.sets.some((s) => s.w > 0);
  const best = cardio ? 0 : Math.max(bestWeightFor(S, entry.id), (S.exWeights?.[entry.id] || {}).w || 0);
  const last = lastEntryFor(S, entry.id);

  const col1 = cardio ? 'min' : timed ? 'sec' : 'w';
  const col1Label = cardio ? gymT(lang, 'durationMin') : timed ? gymT(lang, 'seconds') : gymT(lang, 'weight');
  const col2 = cardio ? 'speed' : timed ? (bw && !added ? null : 'w') : 'r';
  const col2Label = cardio ? gymT(lang, 'speed') : timed ? (bw && !added ? null : gymT(lang, 'weight')) : gymT(lang, 'reps');

  const setLeft = (s) => (added ? Math.max(0, s.w) : s.w);
  const setRight = (s) => (cardio ? s.speed : timed ? (bw && !added ? null : s.w) : s.r);

  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between mb-2">
        <p className={`font-bold ${compact ? 'text-base' : 'text-lg'} capitalize`}>{ex.n}</p>
      </div>
      <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-400 mb-2">
        {ex.tg && <span className="chip">{lang === 'fa' ? ex.tg : ex.tg}</span>}
        {ex.eq && <span className="chip">{ex.eq}</span>}
        {best > 0 && <span className="chip">{gymT(lang, 'best')} {localizeDigits(best, lang)} {S.unit}</span>}
        {isPerSide(cfg) && <span className="chip">{gymT(lang, 'perSide', localizeDigits((entry.sets[0]?.r || 0) / 2, lang))}</span>}
      </div>
      {last && (
        <p className="text-[11px] text-slate-400 mb-2">
          {gymT(lang, 'lastTime')}: {last.sets.map((s) => `${localizeDigits(s.w || 0, lang)}×${localizeDigits(s.r || 0, lang)}`).join(', ')}
        </p>
      )}

      <div className="space-y-1.5">
        {entry.sets.map((s, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5">
            <span className="w-5 text-center text-xs font-bold text-slate-400">{localizeDigits(i + 1, lang)}</span>
            <Stepper small lang={lang} value={s[col1]} onChange={(v) => setField(api, entryIdx, i, col1, v)} step={cardio ? 1 : 2.5} decimal min={0} />
            {col2 && !cardio && <Stepper small lang={lang} value={s[col2]} onChange={(v) => setField(api, entryIdx, i, col2, v)} step={isPerSide(cfg) ? 2 : 1} min={0} />}
            {cardio && <Stepper small lang={lang} value={s.speed} onChange={(v) => setField(api, entryIdx, i, 'speed', v)} step={0.5} decimal min={0} />}
            <span className="text-[11px] text-slate-400 w-10 text-end">{col1Label}</span>
            <button
              onClick={() => {
                update((st) => { st.active.entries[entryIdx].sets[i].done = !st.active.entries[entryIdx].sets[i].done; });
                const allDone = entry.sets.every((x, xi) => (xi === i ? !entry.sets[i].done : x.done));
                if (allDone) onRest?.();
              }}
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
            <ExerciseBlock key={idx} api={api} entryIdx={idx} compact={isSuperset} onRest={() => setRestTrigger(Date.now())} />
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
      s.active.entries.push({ id: exId, target: cfg, sets: cfg.sets ? Array.from({ length: cfg.sets }, () => ({ w: 0, r: cfg.reps, done: false })) : [], plan: null });
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
