import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Button from '../Common/Button';
import EmptyState from '../Common/EmptyState';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { todayKey, fmtShort, localizeDigits } from '../../utils/dateUtils';

export default function BodyTracker() {
  const { data, addBodyEntry, deleteBodyEntry } = useApp();
  const { t, lang } = useTranslation();
  const log = data.bodyLog || [];

  const [form, setForm] = useState({ date: todayKey(), weight: '', chest: '', waist: '', arm: '' });
  const [error, setError] = useState(false);
  const [rm, setRm] = useState({ weight: '', reps: '' });

  const chartData = useMemo(
    () => log.map((e) => ({ name: fmtShort(e.date, lang), weight: Number(e.weight) || null })),
    [log, lang]
  );

  const oneRm = useMemo(() => {
    const w = parseFloat(rm.weight);
    const r = parseInt(rm.reps, 10);
    if (!w || !r || r < 1) return null;
    if (r === 1) return w;
    return Math.round(w * (1 + r / 30) * 10) / 10; // Epley formula
  }, [rm]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.weight) { setError(true); return; }
    addBodyEntry({ ...form });
    setForm({ date: todayKey(), weight: '', chest: '', waist: '', arm: '' });
    setError(false);
    toast.success(t('body.added'));
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        {/* add entry */}
        <form onSubmit={submit} className="card p-5 space-y-3">
          <h3 className="font-bold text-sm">⚖️ {t('body.addEntry')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('common.date')}</label>
              <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
            <div>
              <label className="label">{t('body.weight')} *</label>
              <input type="number" step="0.1" min="0" className={`input ${error ? 'input-error' : ''}`} value={form.weight} onChange={(e) => { set('weight', e.target.value); setError(false); }} />
            </div>
            <div><label className="label">{t('body.chest')}</label><input type="number" step="0.5" min="0" className="input" value={form.chest} onChange={(e) => set('chest', e.target.value)} /></div>
            <div><label className="label">{t('body.waist')}</label><input type="number" step="0.5" min="0" className="input" value={form.waist} onChange={(e) => set('waist', e.target.value)} /></div>
            <div><label className="label">{t('body.arm')}</label><input type="number" step="0.5" min="0" className="input" value={form.arm} onChange={(e) => set('arm', e.target.value)} /></div>
          </div>
          {error && <p className="text-xs text-red-500">{t('common.requiredField')}</p>}
          <Button type="submit"><FiPlus /> {t('body.addEntry')}</Button>
        </form>

        {/* 1RM calculator */}
        <div className="card p-5 space-y-3">
          <h3 className="font-bold text-sm">🏋️ {t('body.oneRm')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('body.liftWeight')}</label><input type="number" min="0" step="0.5" className="input" value={rm.weight} onChange={(e) => setRm({ ...rm, weight: e.target.value })} /></div>
            <div><label className="label">{t('body.reps')}</label><input type="number" min="1" max="20" className="input" value={rm.reps} onChange={(e) => setRm({ ...rm, reps: e.target.value })} /></div>
          </div>
          {oneRm && (
            <div className="rounded-xl bg-primary/10 p-3 text-center animate-pop">
              <span className="text-xs text-slate-400">{t('body.result')}: </span>
              <span className="text-xl font-extrabold text-primary" dir="ltr">{localizeDigits(oneRm, lang)} kg</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* chart */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3">📉 {t('body.chart')}</h3>
          {chartData.length < 2 ? (
            <p className="text-xs text-slate-400 py-8 text-center">{t('body.empty')}</p>
          ) : (
            <div className="h-52" dir="ltr">
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'rgb(30 41 59)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                  <Line type="monotone" dataKey="weight" stroke="rgb(var(--c-primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* entries */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3">🗒️ {t('common.total')}: {localizeDigits(log.length, lang)}</h3>
          {log.length === 0 ? (
            <EmptyState message={t('body.empty')} icon={<span className="text-4xl">⚖️</span>} />
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {[...log].reverse().map((e) => (
                <div key={e.id} className="group flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm">
                  <span className="text-xs text-slate-400 w-20 shrink-0">{fmtShort(e.date, lang)}</span>
                  <span className="font-bold" dir="ltr">{localizeDigits(e.weight, lang)} kg</span>
                  <span className="text-[11px] text-slate-400 flex-1 truncate">
                    {e.chest && `🫁 ${localizeDigits(e.chest, lang)}`} {e.waist && `· ⏳ ${localizeDigits(e.waist, lang)}`} {e.arm && `· 💪 ${localizeDigits(e.arm, lang)}`}
                  </span>
                  <button onClick={() => { deleteBodyEntry(e.id); toast.success(t('body.deleted')); }}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiTrash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
