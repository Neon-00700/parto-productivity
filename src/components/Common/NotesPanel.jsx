import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { fmtShort } from '../../utils/dateUtils';

const NOTE_COLORS = ['#fef08a', '#bae6fd', '#bbf7d0', '#fbcfe8', '#ddd6fe', '#fed7aa'];

export default function NotesPanel() {
  const { notesOpen, setNotesOpen, data, addNote, deleteNote, updateNote } = useApp();
  const { t, lang } = useTranslation();
  const [text, setText] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const notes = data.notes || [];

  if (!notesOpen) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addNote(text.trim(), color);
    setText('');
    toast.success(t('notes.added'));
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" onMouseDown={(e) => e.target === e.currentTarget && setNotesOpen(false)}>
      <div className="absolute inset-y-0 end-0 w-full sm:w-96 bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-slide-up sm:animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold">📝 {t('notes.title')}</h2>
          <button onClick={() => setNotesOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><FiX /></button>
        </div>

        <form onSubmit={submit} className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
          <textarea
            rows={3} autoFocus className="input resize-none" placeholder={t('notes.placeholder')}
            value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e); }}
          />
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 flex-1">
              {NOTE_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 dark:ring-offset-slate-900 ring-primary scale-110' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
            <button type="submit" className="btn-primary !py-1.5 !px-3 !text-xs"><FiPlus /> {t('common.add')}</button>
          </div>
        </form>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notes.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">{t('notes.empty')}</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="group rounded-2xl p-3.5 shadow-sm relative text-slate-800" style={{ background: n.color || NOTE_COLORS[0] }}>
                <textarea
                  className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed"
                  rows={Math.min(6, Math.max(2, n.text.split('\n').length))}
                  value={n.text}
                  onChange={(e) => updateNote(n.id, { text: e.target.value })}
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] opacity-60">{fmtShort(n.createdAt, lang)}</span>
                  <button
                    onClick={() => { deleteNote(n.id); toast.success(t('notes.deleted')); }}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-opacity"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
