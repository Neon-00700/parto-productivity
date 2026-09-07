import React, { useMemo, useState } from 'react';
import Modal from '../../../Common/Modal';
import { FiSearch } from 'react-icons/fi';
import { allExercises, BODYPARTS, equipmentOf } from '../lib/exercises';
import { BP_FA, EQ_FA } from '../lib/calc';
import { gymT } from '../lib/i18n';
import { localizeDigits } from '../../../../utils/dateUtils';

// Searchable exercise picker. Returns the id of the chosen exercise via onSelect.
export default function ExercisePicker({ open, onClose, onSelect, state, lang }) {
  const [q, setQ] = useState('');
  const [bp, setBp] = useState('');
  const [eq, setEq] = useState('');

  const list = useMemo(() => {
    const all = allExercises(state);
    const needle = q.trim().toLowerCase();
    let out = all.filter((e) => !bp || e.bp === bp);
    if (eq) out = out.filter((e) => e.eq === eq);
    if (needle) out = out.filter((e) => (e.n || '').toLowerCase().includes(needle));
    return out;
  }, [state, q, bp, eq]);

  const eqs = useMemo(() => equipmentOf(list), [list]);

  const chipCls = (active) =>
    `px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap ${
      active ? 'text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`;

  return (
    <Modal open={open} onClose={onClose} title={gymT(lang, 'addExercise')} wide>
      <div className="space-y-3">
        <div className="relative">
          <FiSearch className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            autoFocus
            className="input !ps-9"
            placeholder={gymT(lang, 'search')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button className={chipCls(!bp)} onClick={() => setBp('')}>{gymT(lang, 'all')}</button>
          {BODYPARTS.map((b) => (
            <button key={b} className={chipCls(bp === b)} style={bp === b ? { background: 'rgb(var(--c-primary))' } : undefined} onClick={() => setBp(b)}>
              {lang === 'fa' ? (BP_FA[b] || b) : b}
            </button>
          ))}
        </div>

        {eqs.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button className={chipCls(!eq)} onClick={() => setEq('')}>{gymT(lang, 'all')}</button>
            {eqs.map((e2) => (
              <button key={e2} className={chipCls(eq === e2)} style={eq === e2 ? { background: 'rgb(var(--c-primary))' } : undefined} onClick={() => setEq(e2)}>
                {lang === 'fa' ? (EQ_FA[e2] || e2) : e2}
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400">{gymT(lang, 'xExercises', localizeDigits(list.length, lang))}</p>

        <div className="max-h-[46vh] overflow-y-auto space-y-1.5">
          {list.map((e) => (
            <button
              key={e.id}
              onClick={() => { onSelect(e.id); onClose(); }}
              className="w-full text-start px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/10 transition-colors flex items-center gap-3"
            >
              <span className="h-8 w-8 shrink-0 rounded-lg grid place-items-center text-slate-400 bg-slate-200 dark:bg-slate-700 text-[11px] font-bold" dir="ltr">
                {e.bp === 'cardio' ? '🏃' : '🏋️'}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium truncate">{e.n}</span>
                <span className="block text-[11px] text-slate-400 truncate">
                  {lang === 'fa' ? (BP_FA[e.bp] || e.bp) : e.bp}{e.eq ? ` · ${lang === 'fa' ? (EQ_FA[e.eq] || e.eq) : e.eq}` : ''}
                </span>
              </span>
            </button>
          ))}
          {list.length === 0 && <p className="text-center text-sm text-slate-400 py-8">{gymT(lang, 'empty')}</p>}
        </div>
      </div>
    </Modal>
  );
}
