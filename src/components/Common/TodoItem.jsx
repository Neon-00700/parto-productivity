import React from 'react';
import { FiTrash2, FiEdit2, FiArchive, FiAlertTriangle, FiRotateCcw, FiMenu } from 'react-icons/fi';
import Badge from './Badge';
import { useTranslation } from '../../hooks/useTranslation';
import { fmtShort, isOverdue, isDueToday } from '../../utils/dateUtils';

export default function TodoItem({
  task, onToggle, onEdit, onDelete, onArchive, onUnarchive,
  selectable = false, selected = false, onSelect,
  draggable = false, onDragStart, onDragOver, onDrop,
}) {
  const { t, lang } = useTranslation();
  const overdue = !task.done && isOverdue(task.dueDate);
  const dueToday = !task.done && isDueToday(task.dueDate);

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`group flex items-start gap-3 rounded-xl border p-3 transition-all duration-200 bg-white dark:bg-slate-900
        ${overdue ? 'border-red-400/70 bg-red-50 dark:bg-red-950/30' : 'border-slate-200 dark:border-slate-800'}
        ${task.done ? 'opacity-60' : 'hover:border-primary/50 hover:shadow-sm'}`}
    >
      {draggable && (
        <span className="mt-1 cursor-grab text-slate-300 dark:text-slate-600 hover:text-slate-500 touch-none">
          <FiMenu size={14} />
        </span>
      )}
      {selectable && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="mt-1 h-4 w-4 rounded accent-primary"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <button
        onClick={onToggle}
        className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all
          ${task.done ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600 hover:border-primary'}`}
        aria-label={t('task.markDone')}
      >
        {task.done && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 5l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-sm font-medium break-words ${task.done ? 'line-through text-slate-400' : ''}`}>{task.title}</span>
          {overdue && (
            <Badge tone="high"><FiAlertTriangle size={11} /> {t('common.overdue')}</Badge>
          )}
          {dueToday && !overdue && <Badge tone="primary">{t('task.dueToday')}</Badge>}
        </div>
        {task.description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{task.description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {task.priority && <Badge tone={task.priority}>{t(`common.${task.priority}`)}</Badge>}
          {task.dueDate && (
            <span className={`text-[11px] ${overdue ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
              📅 {fmtShort(task.dueDate, lang)}
            </span>
          )}
          {(task.tags || []).map((tag) => (
            <span key={tag} className="chip bg-primary/10 text-primary">#{tag}</span>
          ))}
          {task.estimatedTime && <span className="text-[11px] text-slate-400">⏱ {task.estimatedTime}{t('common.min')}</span>}
          {task.recurring && task.recurring !== 'none' && <span className="chip bg-accent/10 text-accent">🔁 {t(`recur.${task.recurring}`)}</span>}
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
        {task.archived ? (
          <button onClick={onUnarchive} title={t('common.unarchive')} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary">
            <FiRotateCcw size={15} />
          </button>
        ) : (
          <>
            <button onClick={onEdit} title={t('common.edit')} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary">
              <FiEdit2 size={15} />
            </button>
            {onArchive && task.done && (
              <button onClick={onArchive} title={t('common.archive')} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500">
                <FiArchive size={15} />
              </button>
            )}
          </>
        )}
        <button onClick={onDelete} title={t('common.delete')} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500">
          <FiTrash2 size={15} />
        </button>
      </div>
    </div>
  );
}
