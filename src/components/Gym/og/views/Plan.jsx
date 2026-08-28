import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Card from '../../../Common/Card';
import Button from '../../../Common/Button';
import Modal from '../../../Common/Modal';
import EmptyState from '../../../Common/EmptyState';
import ExercisePicker from '../components/ExercisePicker';
import Stepper from '../components/Stepper';
import { gymT } from '../lib/i18n';
import { DAYN, modeOf, defaultConfig } from '../lib/calc';
import { exOr } from '../lib/exercises';
import { loadOfRoutine } from '../lib/muscles';
import BodyMap, { BodyMapLegend } from '../components/BodyMap';
import { uid } from '../lib/util';
import { localizeDigits } from '../../../../utils/dateUtils';

function DayAssignSheet({ lang, day, routines, week, onPick, onClose }) {
  return (
    <Modal open={!!day} onClose={onClose} title={DAYN[day]}>
      <div className="space-y-2">
        <button
          onClick={() => onPick(null)}
          className={`w-full text-start px-4 py-3 rounded-2xl border ${!week[day] ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800'}`}
        >
          🛌 {gymT(lang, 'rest')}
        </button>
        {routines.map((r) => (
          <button
            key={r.id}
            onClick={() => onPick(r.id)}
            className={`w-full text-start px-4 py-3 rounded-2xl border ${week[day] === r.id ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800'}`}
          >
            {r.emoji} {r.name}
          </button>
        ))}
        {routines.length === 0 && <p className="text-xs text-slate-400 text-center py-4">{gymT(lang, 'noRoutines')}</p>}
      </div>
    </Modal>
  );
}

const PROG_OPTS = ['off', 'linear', 'greyskull', 'double', 'time'];

function RoutineEditor({ api, routine }) {
  const { update, lang, setRoutineId } = api;
  const [picker, setPicker] = useState(false);
  const edit = (j, field, value) => update((s) => {
    const r = s.routines.find((x) => x.id === routine.id);
    if (r) r.ex[j][field] = value;
  });
  const setRoutineProg = (v) => update((s) => {
    const r = s.routines.find((x) => x.id === routine.id);
    if (r) r.prog = v;
  });
  const setExProg = (j, v) => edit(j, 'prog', v);
  const removeEx = (j) => update((s) => {
    const r = s.routines.find((x) => x.id === routine.id);
    if (r) r.ex.splice(j, 1);
  });
  const addEx = (exId) => update((s) => {
    const r = s.routines.find((x) => x.id === routine.id);
    if (r) r.ex.push(defaultConfig(exId));
  });
  const rename = (v) => update((s) => {
    const r = s.routines.find((x) => x.id === routine.id);
    if (r) r.name = v;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => setRoutineId(null)}><FiChevronLeft size={16} /></Button>
        <input className="input font-bold !text-sm flex-1" value={routine.name} onChange={(e) => rename(e.target.value)} placeholder={gymT(lang, 'routineName')} />
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-400">
        {gymT(lang, 'prog')}
        <select className="input !w-auto !py-1 !text-xs" value={routine.prog || 'linear'} onChange={(e) => setRoutineProg(e.target.value)}>
          {PROG_OPTS.map((p) => <option key={p} value={p}>{gymT(lang, `prog.${p}`)}</option>)}
        </select>
        <span className="text-[10px] text-slate-400">{gymT(lang, 'prog.hint')}</span>
      </label>

      <div className="space-y-2">
        {routine.ex.map((e2, j) => {
          const ex = exOr(e2.id);
          const mode = modeOf(e2);
          return (
            <Card key={j} className="!p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm capitalize">{ex.n}</span>
                <button onClick={() => removeEx(j)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500"><FiTrash2 size={14} /></button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[['reps', gymT(lang, 'mode.reps')], ['time', gymT(lang, 'mode.time')], ['cardio', gymT(lang, 'mode.cardio')]].map(([m, label]) => (
                  <button key={m} onClick={() => edit(j, 'mode', m)} className={`chip !px-2.5 !py-1 text-[11px] ${mode === m ? 'text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`} style={mode === m ? { background: 'rgb(var(--c-primary))' } : undefined}>
                    {label}
                  </button>
                ))}
                <select className="chip !px-2 !py-1 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500" value={e2.prog || routine.prog || 'linear'} onChange={(e) => setExProg(j, e.target.value)}>
                  {PROG_OPTS.map((p) => <option key={p} value={p}>{gymT(lang, `prog.${p}`)}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Stepper small lang={lang} value={e2.sets} onChange={(v) => edit(j, 'sets', v)} min={1} />
                {mode === 'cardio' ? (
                  <>
                    <Stepper small lang={lang} value={e2.min} onChange={(v) => edit(j, 'min', v)} min={1} />
                    <Stepper small lang={lang} value={e2.speed} onChange={(v) => edit(j, 'speed', v)} min={0} decimal step={0.5} />
                  </>
                ) : mode === 'time' ? (
                  <>
                    <Stepper small lang={lang} value={e2.sec} onChange={(v) => edit(j, 'sec', v)} min={5} step={5} />
                    <Stepper small lang={lang} value={e2.weight || 0} onChange={(v) => edit(j, 'weight', v)} min={0} step={2.5} />
                  </>
                ) : (
                  <>
                    <Stepper small lang={lang} value={e2.reps} onChange={(v) => edit(j, 'reps', v)} min={1} />
                    {e2.bodyweight ? null : <Stepper small lang={lang} value={e2.weight || 0} onChange={(v) => edit(j, 'weight', v)} min={0} step={2.5} />}
                    {e2.prog === 'double' && (
                      <Stepper small lang={lang} value={e2.repsMin || Math.max(1, (e2.reps || 10) - 2)} onChange={(v) => edit(j, 'repsMin', v)} min={1} />
                    )}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Button variant="soft" className="w-full !justify-center" onClick={() => setPicker(true)}><FiPlus size={15} /> {gymT(lang, 'addExercise')}</Button>
      {routine.ex.length === 0 && <EmptyState message={gymT(lang, 'empty')} icon={<span className="text-3xl">🏋️</span>} />}

      {routine.ex.length > 0 && (
        <Card className="!p-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">💪 {gymT(lang, 'muscleMap')} — {gymT(lang, 'prog.hint')}</p>
          <BodyMap load={loadOfRoutine(routine)} lang={lang} />
          <div className="mt-2 flex justify-center"><BodyMapLegend lang={lang} /></div>
        </Card>
      )}
      <ExercisePicker open={picker} onClose={() => setPicker(false)} onSelect={addEx} state={api.S} lang={lang} />

      <Button variant="danger" className="w-full !justify-center" onClick={() => {
        confirm(gymT(lang, 'deleteRoutine'));
        update((s) => {
          s.routines = s.routines.filter((x) => x.id !== routine.id);
          Object.keys(s.week).forEach((d) => { if (s.week[d] === routine.id) delete s.week[d]; });
          Object.keys(s.dayPlan).forEach((d) => { if (s.dayPlan[d] === routine.id) delete s.dayPlan[d]; });
        });
        setRoutineId(null);
        toast.success(gymT(lang, 'workoutDiscarded'));
      }}>
        <FiTrash2 size={14} /> {gymT(lang, 'delete')}
      </Button>
    </div>
  );
}

export default function Plan({ api }) {
  const { S, update, lang, routineId, setRoutineId } = api;
  const [assignDay, setAssignDay] = useState(null);
  const routine = S.routines.find((r) => r.id === routineId);

  if (routine) return <RoutineEditor api={api} routine={routine} />;

  const newRoutine = () => {
    const r = { id: uid(), name: gymT(lang, 'newRoutine'), emoji: '🏋️', ex: [] };
    update((s) => { s.routines.push(r); });
    setRoutineId(r.id);
  };

  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="space-y-3">
        <h4 className="font-bold text-sm">{gymT(lang, 'weekSchedule')}</h4>
        {/* Display week starting Saturday to match Parto? openGym uses Sunday start. Keep Monday-first is fine. */}
        {[1, 2, 3, 4, 5, 6, 0].map((d) => {
          const r = S.routines.find((x) => x.id === S.week[d]);
          return (
            <button key={d} onClick={() => setAssignDay(d)} className="w-full text-start">
              <Card className="!p-3 flex items-center justify-between">
                <span className="font-semibold text-sm">{DAYN[d]}</span>
                {r ? <span className="chip text-primary">{r.emoji} {r.name}</span> : <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-400">{gymT(lang, 'rest')}</span>}
                <FiChevronRight className="text-slate-300" size={16} />
              </Card>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm">{gymT(lang, 'routines')}</h4>
          <Button variant="soft" className="!py-1.5 !text-xs" onClick={newRoutine}><FiPlus size={13} /> {gymT(lang, 'new')}</Button>
        </div>
        {S.routines.length ? (
          <div className="space-y-2">
            {S.routines.map((r) => (
              <Card key={r.id} className="!p-3.5 flex items-center justify-between cursor-pointer" onClick={() => setRoutineId(r.id)}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{r.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm">{r.name}</p>
                    <p className="text-xs text-slate-400">{gymT(lang, 'xExercises', localizeDigits(r.ex.length, lang))}</p>
                  </div>
                </div>
                <FiChevronRight className="text-slate-300" size={16} />
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState message={gymT(lang, 'noRoutinesHint')} action={<Button variant="soft" onClick={newRoutine}><FiPlus size={13} /> {gymT(lang, 'newRoutine')}</Button>} />
        )}
      </div>

      <DayAssignSheet
        lang={lang}
        day={assignDay}
        routines={S.routines}
        week={S.week}
        onClose={() => setAssignDay(null)}
        onPick={(rid) => {
          update((s) => { if (rid) s.week[assignDay] = rid; else delete s.week[assignDay]; });
          setAssignDay(null);
        }}
      />
    </div>
  );
}
