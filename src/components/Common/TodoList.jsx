import React, { useMemo, useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiArchive, FiCheck, FiTrash2, FiGrid, FiList, FiCopy } from 'react-icons/fi';
import Modal from './Modal';
import Button from './Button';
import TodoItem from './TodoItem';
import EmptyState from './EmptyState';
import ConfirmDialog from './ConfirmDialog';
import TemplatesModal from './TemplatesModal';
import EisenhowerView from './EisenhowerView';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { isOverdue } from '../../utils/dateUtils';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function TaskForm({ initial, tags, onSubmit, onCancel, onNewTag }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = t('common.requiredField');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit(form);
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    onNewTag?.(tag);
    if (!form.tags.includes(tag)) set('tags', [...form.tags, tag]);
    setNewTag('');
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">{t('common.title')} *</label>
        <input autoFocus className={`input ${errors.title ? 'input-error' : ''}`} value={form.title} onChange={(e) => set('title', e.target.value)} />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
      </div>
      <div>
        <label className="label">{t('common.description')}</label>
        <textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('common.priority')}</label>
          <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
            <option value="high">{t('common.high')}</option>
            <option value="medium">{t('common.medium')}</option>
            <option value="low">{t('common.low')}</option>
          </select>
        </div>
        <div>
          <label className="label">{t('common.dueDate')}</label>
          <input type="date" className="input" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
        </div>
        <div>
          <label className="label">{t('task.estimatedTime')}</label>
          <input type="number" min="0" className="input" value={form.estimatedTime} onChange={(e) => set('estimatedTime', e.target.value)} />
        </div>
        <div>
          <label className="label">{t('task.actualTime')}</label>
          <input type="number" min="0" className="input" value={form.actualTime} onChange={(e) => set('actualTime', e.target.value)} />
        </div>
        <div>
          <label className="label">{t('common.status')}</label>
          <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="todo">{t('task.statusTodo')}</option>
            <option value="inprogress">{t('task.statusInProgress')}</option>
            <option value="done">{t('task.statusDone')}</option>
          </select>
        </div>
        <div>
          <label className="label">🔁 {t('recur.label')}</label>
          <select className="input" value={form.recurring || 'none'} onChange={(e) => set('recurring', e.target.value)}>
            <option value="none">{t('recur.none')}</option>
            <option value="daily">{t('recur.daily')}</option>
            <option value="weekly">{t('recur.weekly')}</option>
          </select>
        </div>
      </div>
      {tags && (
        <div>
          <label className="label">{t('common.tags')}</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => set('tags', form.tags.includes(tag) ? form.tags.filter((x) => x !== tag) : [...form.tags, tag])}
                className={`chip transition-all ${form.tags.includes(tag) ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-primary/20'}`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder={t('task.addTag')}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            />
            <Button type="button" variant="soft" onClick={addTag}><FiPlus /></Button>
          </div>
        </div>
      )}
      <div>
        <label className="label">{t('common.notes')}</label>
        <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit">{t('common.save')}</Button>
      </div>
    </form>
  );
}

export default function TodoList({ section, tagOptions = null, accent = 'bg-primary' }) {
  const { data, addTask, updateTask, toggleTask, deleteTask, bulkTasks, reorderTasks, addCustomTag } = useApp();
  const { t } = useTranslation();
  const tasks = data.tasks[section] || [];

  const [showArchive, setShowArchive] = useState(false);
  const [modal, setModal] = useState(null); // 'new' | task object
  const [filters, setFilters] = useState({ priority: 'all', tag: 'all', status: 'all', completion: 'all' });
  const [sortBy, setSortBy] = useState('priority');
  const [selected, setSelected] = useState([]);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // list | matrix
  const dragId = useRef(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const id = setTimeout(() => setLoading(false), 250); return () => clearTimeout(id); }, []);

  const allTags = useMemo(() => {
    const set = new Set(tagOptions || []);
    tasks.forEach((task) => (task.tags || []).forEach((x) => set.add(x)));
    return [...set];
  }, [tasks, tagOptions]);

  const visible = useMemo(() => {
    let list = tasks.filter((task) => !!task.archived === showArchive);
    if (filters.priority !== 'all') list = list.filter((task) => task.priority === filters.priority);
    if (filters.tag !== 'all') list = list.filter((task) => (task.tags || []).includes(filters.tag));
    if (filters.status !== 'all') list = list.filter((task) => task.status === filters.status);
    if (filters.completion === 'done') list = list.filter((task) => task.done);
    if (filters.completion === 'active') list = list.filter((task) => !task.done);
    if (filters.completion === 'overdue') list = list.filter((task) => !task.done && isOverdue(task.dueDate));
    const sorted = [...list];
    if (sortBy === 'due') sorted.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
    else if (sortBy === 'created') sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else if (sortBy === 'priority') sorted.sort((a, b) => (a.done - b.done) || (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]));
    return sorted;
  }, [tasks, showArchive, filters, sortBy]);

  const emptyForm = { title: '', description: '', priority: 'medium', dueDate: '', tags: [], estimatedTime: '', actualTime: '', notes: '', status: 'todo', recurring: 'none' };

  const handleDelete = (task) => {
    const { restore } = deleteTask(section, task.id);
    toast(
      (tst) => (
        <div className="flex items-center gap-3">
          <span>{t('toast.taskDeleted')}</span>
          <button
            className="font-bold text-sky-400 underline"
            onClick={() => { restore(); toast.dismiss(tst.id); toast.success(t('task.restoreTask')); }}
          >
            {t('common.undo')}
          </button>
        </div>
      ),
      { duration: 5000, icon: '🗑️' }
    );
  };

  const bulkAction = (action) => {
    if (action === 'delete') { setConfirmBulk(true); return; }
    bulkTasks(section, selected, action);
    toast.success(action === 'complete' ? t('toast.taskCompleted') : t('toast.taskArchived'));
    setSelected([]);
  };

  const selectCls = 'input !w-auto !py-1.5 text-xs';

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-16" />)}</div>;
  }

  return (
    <div className="space-y-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setModal('new')}><FiPlus /> {t('common.add')}</Button>
        <Button variant="soft" onClick={() => setTplOpen(true)}><FiCopy size={13} /> {t('tpl.title')}</Button>
        <div className="flex gap-0.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 p-0.5">
          <button onClick={() => setViewMode('list')} title={t('matrix.list')}
            className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}>
            <FiList size={13} />
          </button>
          <button onClick={() => setViewMode('matrix')} title={t('matrix.view')}
            className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 ${viewMode === 'matrix' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}>
            <FiGrid size={13} />
          </button>
        </div>
        <select className={selectCls} value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="all">{t('common.priority')}: {t('common.all')}</option>
          <option value="high">{t('common.high')}</option>
          <option value="medium">{t('common.medium')}</option>
          <option value="low">{t('common.low')}</option>
        </select>
        <select className={selectCls} value={filters.tag} onChange={(e) => setFilters({ ...filters, tag: e.target.value })}>
          <option value="all">{t('common.tags')}: {t('common.all')}</option>
          {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
        </select>
        <select className={selectCls} value={filters.completion} onChange={(e) => setFilters({ ...filters, completion: e.target.value })}>
          <option value="all">{t('common.status')}: {t('common.all')}</option>
          <option value="active">{t('common.active')}</option>
          <option value="done">{t('common.done')}</option>
          <option value="overdue">{t('common.overdue')}</option>
        </select>
        <select className={selectCls} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="priority">{t('task.sortPriority')}</option>
          <option value="due">{t('task.sortDue')}</option>
          <option value="created">{t('task.sortCreated')}</option>
        </select>
        <button
          className={`btn-ghost !px-3 !py-1.5 text-xs ${showArchive ? '!bg-primary/15 !text-primary' : ''}`}
          onClick={() => { setShowArchive(!showArchive); setSelected([]); }}
        >
          <FiArchive size={13} /> {showArchive ? t('common.hideArchive') : t('common.showArchive')}
        </button>
      </div>

      {/* bulk bar */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-primary/10 border border-primary/30 px-3 py-2 animate-fade-in">
          <span className="text-xs font-semibold text-primary">{selected.length} {t('common.selected')}</span>
          <Button variant="soft" className="!py-1 !px-2 !text-xs" onClick={() => bulkAction('complete')}><FiCheck size={12} /> {t('task.bulkComplete')}</Button>
          <Button variant="soft" className="!py-1 !px-2 !text-xs" onClick={() => bulkAction('archive')}><FiArchive size={12} /> {t('task.bulkArchive')}</Button>
          <Button variant="danger" className="!py-1 !px-2 !text-xs" onClick={() => bulkAction('delete')}><FiTrash2 size={12} /> {t('task.bulkDelete')}</Button>
          <button className="text-xs text-slate-500 underline" onClick={() => setSelected([])}>{t('common.clear')}</button>
        </div>
      )}

      {/* matrix view */}
      {viewMode === 'matrix' ? (
        <EisenhowerView section={section} tasks={tasks} onEdit={(task) => setModal(task)} />
      ) : visible.length === 0 ? (
        <EmptyState
          message={showArchive ? t('task.emptyArchive') : t('common.empty')}
          action={!showArchive && <Button variant="soft" onClick={() => setModal('new')}><FiPlus /> {t('common.newTask')}</Button>}
        />
      ) : (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-slate-400 px-1 cursor-pointer w-fit">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-primary"
              checked={selected.length === visible.length && visible.length > 0}
              onChange={(e) => setSelected(e.target.checked ? visible.map((task) => task.id) : [])}
            />
            {t('task.selectAll')}
          </label>
          {visible.map((task) => (
            <TodoItem
              key={task.id}
              task={task}
              selectable
              selected={selected.includes(task.id)}
              onSelect={() => setSelected((s) => (s.includes(task.id) ? s.filter((x) => x !== task.id) : [...s, task.id]))}
              draggable={!showArchive}
              onDragStart={() => { dragId.current = task.id; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (dragId.current && dragId.current !== task.id) reorderTasks(section, dragId.current, task.id); dragId.current = null; }}
              onToggle={() => { if (!task.done) toast.success(t('toast.taskCompleted')); toggleTask(section, task.id); }}
              onEdit={() => setModal(task)}
              onDelete={() => handleDelete(task)}
              onArchive={() => { updateTask(section, task.id, { archived: true }); toast.success(t('toast.taskArchived')); }}
              onUnarchive={() => updateTask(section, task.id, { archived: false })}
            />
          ))}
        </div>
      )}

      {/* add / edit modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('common.newTask') : t('common.edit')}>
        <TaskForm
          initial={modal === 'new' ? emptyForm : { ...emptyForm, ...modal }}
          tags={allTags}
          onNewTag={addCustomTag}
          onCancel={() => setModal(null)}
          onSubmit={(form) => {
            if (modal === 'new') {
              addTask(section, form);
              toast.success(t('toast.taskAdded'));
            } else {
              updateTask(section, modal.id, { ...form, done: form.status === 'done' ? true : modal.done && form.status !== 'todo' ? modal.done : false });
              toast.success(t('toast.taskUpdated'));
            }
            setModal(null);
          }}
        />
      </Modal>

      <TemplatesModal open={tplOpen} onClose={() => setTplOpen(false)} section={section} />

      <ConfirmDialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        onConfirm={() => { bulkTasks(section, selected, 'delete'); toast.success(t('toast.taskDeleted')); setSelected([]); }}
        message={t('common.confirmDeleteMsg')}
      />
    </div>
  );
}
