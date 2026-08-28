import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';

export default function FrogCard() {
  const { data, activeTasks, setFrog, toggleTask, today } = useApp();
  const { t } = useTranslation();
  const [picking, setPicking] = useState(false);

  const frog = data.frog?.date === today ? data.frog : null;
  const frogTask = frog ? activeTasks.find((x) => x.id === frog.taskId) : null;
  const openTasks = activeTasks.filter((x) => !x.done).slice(0, 60);

  const eat = () => {
    toast.success(t('frog.done'), { duration: 4000 });
    import('canvas-confetti').then(({ default: confetti }) =>
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, scalar: 0.8 })
    ).catch(() => {});
    toggleTask(frogTask.section, frogTask.id);
  };

  return (
    <div className="card p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm">🐸 {t('frog.title')}</h3>
        {frogTask && !frogTask.done && (
          <button className="text-xs text-primary font-semibold underline" onClick={() => setPicking(true)}>{t('frog.change')}</button>
        )}
      </div>

      {frogTask && !frogTask.done ? (
        <div className="flex items-center gap-3">
          <button
            onClick={eat}
            className="h-6 w-6 shrink-0 rounded-full border-2 border-green-500 hover:bg-green-500 hover:text-white flex items-center justify-center transition-all text-transparent"
          >
            <svg width="12" height="12" viewBox="0 0 10 10"><path d="M1 5l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
          </button>
          <span className="text-sm font-semibold flex-1">{frogTask.title}</span>
        </div>
      ) : frogTask?.done ? (
        <p className="text-sm font-semibold text-green-500">{t('frog.done')}</p>
      ) : (
        <>
          <p className="text-xs text-slate-400 mb-2.5">{t('frog.hint')}</p>
          {picking || !frog ? null : null}
          {openTasks.length === 0 ? (
            <p className="text-xs text-slate-400">{t('frog.noTasks')}</p>
          ) : (
            <select
              className="input text-sm"
              value=""
              onChange={(e) => {
                const task = openTasks.find((x) => x.id === e.target.value);
                if (task) { setFrog(task.id, task.section); setPicking(false); }
              }}
            >
              <option value="">🐸 {t('frog.pick')}…</option>
              {openTasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
            </select>
          )}
        </>
      )}

      {picking && frogTask && (
        <select
          className="input text-sm mt-2"
          value={frogTask.id}
          onChange={(e) => {
            const task = openTasks.find((x) => x.id === e.target.value);
            if (task) { setFrog(task.id, task.section); setPicking(false); }
          }}
        >
          {openTasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
        </select>
      )}
    </div>
  );
}
