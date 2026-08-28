import React, { useRef, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiTrash2, FiSave, FiRefreshCw, FiPlus } from 'react-icons/fi';
import Button from '../Common/Button';
import ConfirmDialog from '../Common/ConfirmDialog';
import EmptyState from '../Common/EmptyState';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { parseWorkoutFile } from '../../utils/excelParser';
import { DAY_IDS, localizeDigits } from '../../utils/dateUtils';
import { v4 as uuid } from 'uuid';

const FIELDS = ['day', 'exercise', 'sets', 'reps', 'weight', 'notes'];

function EditableTable({ rows, onChange, onDeleteRow, t }) {
  const headers = {
    day: t('gym.dayOfWeek'), exercise: t('gym.exercise'), sets: t('gym.sets'),
    reps: t('gym.reps'), weight: t('gym.weight'), notes: t('common.notes'),
  };
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800/70 text-xs text-slate-500">
            {FIELDS.map((f) => <th key={f} className="px-3 py-2.5 text-start font-semibold">{headers[f]}</th>)}
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
              {FIELDS.map((f) => (
                <td key={f} className="px-1 py-1">
                  {f === 'day' ? (
                    <select
                      className="w-full bg-transparent rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      value={row.day}
                      onChange={(e) => onChange(ri, 'day', e.target.value)}
                    >
                      <option value="">—</option>
                      {DAY_IDS.map((d) => <option key={d} value={d}>{t(`days.${d}`)}</option>)}
                    </select>
                  ) : (
                    <input
                      className="w-full bg-transparent rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      value={row[f]}
                      onChange={(e) => onChange(ri, f, e.target.value)}
                    />
                  )}
                </td>
              ))}
              <td className="px-1">
                <button onClick={() => onDeleteRow(ri)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500"><FiTrash2 size={13} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ExcelUploader() {
  const { data, setGymProgram } = useApp();
  const { t, lang } = useTranslation();
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [draft, setDraft] = useState(null); // parsed rows awaiting save
  const [confirmClear, setConfirmClear] = useState(false);
  const program = data.gymProgram || [];

  const handleFile = async (file) => {
    if (!file) return;
    setParsing(true);
    try {
      const { rows } = await parseWorkoutFile(file);
      setDraft(rows);
      toast.success(`${localizeDigits(rows.length, lang)} ${t('gym.parsedRows')}`);
    } catch (e) {
      console.warn(e);
      toast.error(t('gym.uploadError'));
    } finally {
      setParsing(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const editDraft = (ri, field, value) => setDraft((d) => d.map((r, i) => (i === ri ? { ...r, [field]: value } : r)));
  const editProgram = (ri, field, value) => setGymProgram(program.map((r, i) => (i === ri ? { ...r, [field]: value } : r)));

  const byDay = useMemo(() => {
    const map = {};
    DAY_IDS.forEach((d) => { map[d] = []; });
    const other = [];
    program.forEach((r) => (map[r.day] ? map[r.day].push(r) : other.push(r)));
    return { map, other };
  }, [program]);

  // ---- draft (just parsed) view ----
  if (draft) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => { setGymProgram(draft); setDraft(null); toast.success(t('gym.programSaved')); }}>
            <FiSave /> {t('gym.saveProgram')}
          </Button>
          <Button variant="ghost" onClick={() => setDraft(null)}>{t('common.cancel')}</Button>
          <Button variant="soft" onClick={() => setDraft((d) => [...d, { id: uuid(), day: '', exercise: '', sets: '', reps: '', weight: '', notes: '' }])}>
            <FiPlus /> {t('common.add')}
          </Button>
          <span className="text-xs text-slate-400">{t('gym.editCellHint')}</span>
        </div>
        <EditableTable rows={draft} onChange={editDraft} onDeleteRow={(ri) => setDraft((d) => d.filter((_, i) => i !== ri))} t={t} />
      </div>
    );
  }

  // ---- saved program view ----
  if (program.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="soft" onClick={() => inputRef.current?.click()}><FiRefreshCw /> {t('gym.reupload')}</Button>
          <Button variant="danger" onClick={() => setConfirmClear(true)}><FiTrash2 /> {t('gym.clearProgram')}</Button>
          <span className="text-xs text-slate-400">{t('gym.editCellHint')}</span>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
        </div>

        <h3 className="font-bold text-sm">🗓️ {t('gym.programByDay')}</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {DAY_IDS.filter((d) => byDay.map[d].length > 0).map((d) => (
            <div key={d} className="card p-4">
              <h4 className="font-bold text-sm text-primary mb-2">{t(`days.${d}`)}</h4>
              <div className="space-y-1.5">
                {byDay.map[d].map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                    <span className="font-medium flex-1">{r.exercise}</span>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {r.sets && `${localizeDigits(r.sets, lang)}×${localizeDigits(r.reps || '?', lang)}`}
                      {r.weight && ` · ${localizeDigits(r.weight, lang)}kg`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-sm pt-2">✏️ {t('gym.program')}</h3>
        <EditableTable rows={program} onChange={editProgram} onDeleteRow={(ri) => setGymProgram(program.filter((_, i) => i !== ri))} t={t} />

        <ConfirmDialog
          open={confirmClear}
          onClose={() => setConfirmClear(false)}
          onConfirm={() => { setGymProgram([]); toast.success(t('gym.programCleared')); }}
          message={t('common.confirmDeleteMsg')}
        />
      </div>
    );
  }

  // ---- empty / upload zone ----
  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all
          ${dragOver ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-slate-300 dark:border-slate-700 hover:border-primary/60 hover:bg-primary/5'}`}
      >
        <FiUploadCloud size={44} className={`mx-auto mb-3 ${dragOver ? 'text-primary' : 'text-slate-300 dark:text-slate-600'}`} />
        <h3 className="font-bold">{dragOver ? t('gym.dropHere') : t('gym.uploadTitle')}</h3>
        <p className="text-xs text-slate-400 mt-1.5">{parsing ? `${t('common.loading')}…` : t('gym.uploadHint')}</p>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      <EmptyState message={t('gym.noProgram')} icon={<span className="text-5xl">🏋️</span>} />
    </div>
  );
}
