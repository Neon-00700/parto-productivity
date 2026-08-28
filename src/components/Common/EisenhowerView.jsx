import React, { useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from '../../hooks/useTranslation';
import { useApp } from '../../contexts/AppContext';
import { todayKey, addDays, dateKey } from '../../utils/dateUtils';

// Eisenhower matrix: urgency = due within 2 days or overdue; importance = high priority
export default function EisenhowerView({ section, tasks, onEdit }) {
  const { t } = useTranslation();
  const { toggleTask } = useApp();

  const quads = useMemo(() => {
    const soon = dateKey(addDays(new Date(), 2));
    const tk = todayKey();
    const open = tasks.filter((x) => !x.done && !x.archived);
    const isUrgent = (x) => x.dueDate && x.dueDate <= soon;
    const isImportant = (x) => x.priority === 'high';
    return {
      q1: open.filter((x) => isUrgent(x) && isImportant(x)),
      q2: open.filter((x) => !isUrgent(x) && isImportant(x)),
      q3: open.filter((x) => isUrgent(x) && !isImportant(x)),
      q4: open.filter((x) => !isUrgent(x) && !isImportant(x)),
      overdueKey: tk,
    };
  }, [tasks]);

  const QUAD_STYLES = {
    q1: 'border-red-400/60 bg-red-500/5', q2: 'border-sky-400/60 bg-sky-500/5',
    q3: 'border-amber-400/60 bg-amber-500/5', q4: 'border-slate-300 dark:border-slate-700 bg-slate-500/5',
  };
  const DOT = { q1: 'bg-red-500', q2: 'bg-sky-500', q3: 'bg-amber-500', q4: 'bg-slate-400' };

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {['q1', 'q2', 'q3', 'q4'].map((q) => (
        <div key={q} className={`rounded-2xl border-2 border-dashed p-3.5 min-h-[140px] ${QUAD_STYLES[q]}`}>
          <div className="flex items-center gap-2 mb-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${DOT[q]}`} />
            <span className="text-sm font-bold">{t(`matrix.${q}`)}</span>
            <span className="text-[10px] text-slate-400">{t(`matrix.${q}d`)}</span>
          </div>
          <div className="space-y-1.5">
            {quads[q].length === 0 && <p className="text-[11px] text-slate-400">—</p>}
            {quads[q].map((task) => (
              <div key={task.id} className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5">
                <button
                  onClick={() => { toast.success(t('toast.taskCompleted')); toggleTask(section, task.id); }}
                  className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-primary"
                />
                <button className="text-xs font-medium truncate flex-1 text-start" onClick={() => onEdit(task)}>
                  {task.title}
                </button>
                {task.dueDate && <span className={`text-[10px] shrink-0 ${task.dueDate < quads.overdueKey ? 'text-red-500 font-bold' : 'text-slate-400'}`}>{task.dueDate.slice(5)}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
