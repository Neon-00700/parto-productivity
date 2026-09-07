import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiTarget } from 'react-icons/fi';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import Card from '../../../Common/Card';
import Button from '../../../Common/Button';
import EmptyState from '../../../Common/EmptyState';
import { gymT } from '../lib/i18n';
import { todayKey, localizeDigits, fmtShort } from '../../../../utils/dateUtils';
import { uid } from '../lib/util';

export default function Body({ api }) {
  const { S, update, lang } = api;
  const [form, setForm] = useState({ date: todayKey(), w: '', chest: '', waist: '', arm: '' });
  const [error, setError] = useState(false);

  const chartData = useMemo(
    () => S.bodyweight.slice(-60).map((b) => ({ d: fmtShort(b.d, lang), w: Number(b.w) || null })),
    [S.bodyweight, lang]
  );
  const latest = S.bodyweight.length ? S.bodyweight[S.bodyweight.length - 1] : null;

  const submit = (e) => {
    e.preventDefault();
    if (!form.w) { setError(true); return; }
    update((s) => {
      s.bodyweight.push({ id: uid(), d: form.date, w: Number(form.w), chest: form.chest || null, waist: form.waist || null, arm: form.arm || null });
      s.bodyweight.sort((a, b) => a.d.localeCompare(b.d));
    });
    setForm({ date: todayKey(), w: '', chest: '', waist: '', arm: '' });
    setError(false);
    toast.success(gymT(lang, 'workoutSaved'));
  };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setTarget = (v) => update((s) => { s.targetW = v === '' ? null : Number(v); });

  return (
    <div className="grid lg:grid-cols-2 gap-3">
      <div className="space-y-3">
        <form onSubmit={submit} className="card p-4 space-y-3">
          <h3 className="font-bold text-sm">⚖️ {gymT(lang, 'logWeightNow')}</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div><label className="label">{gymT(lang, 'date')}</label><input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
            <div>
              <label className="label">{gymT(lang, 'weight')} *</label>
              <input type="number" step="0.1" min="0" className={`input ${error ? 'input-error' : ''}`} value={form.w} onChange={(e) => { set('w', e.target.value); setError(false); }} />
            </div>
            <div><label className="label">🫁</label><input type="number" step="0.5" min="0" className="input" value={form.chest} onChange={(e) => set('chest', e.target.value)} /></div>
            <div><label className="label">⏳</label><input type="number" step="0.5" min="0" className="input" value={form.waist} onChange={(e) => set('waist', e.target.value)} /></div>
            <div><label className="label">💪</label><input type="number" step="0.5" min="0" className="input" value={form.arm} onChange={(e) => set('arm', e.target.value)} /></div>
          </div>
          {error && <p className="text-xs text-red-500">{gymT(lang, 'required')}</p>}
          <Button type="submit"><FiPlus size={14} /> {gymT(lang, 'logWeightNow')}</Button>
        </form>

        <Card className="!p-4">
          <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5"><FiTarget size={14} /> {gymT(lang, 'targetWeight')}</h3>
          <input type="number" step="0.5" min="0" className="input" value={S.targetW ?? ''} placeholder={S.unit} onChange={(e) => setTarget(e.target.value)} />
        </Card>

        <div className="card p-4">
          <h3 className="font-bold text-sm mb-3">🗒️ {gymT(lang, 'totalWorkouts')}: {localizeDigits(S.bodyweight.length, lang)}</h3>
          {S.bodyweight.length === 0 ? (
            <EmptyState message={gymT(lang, 'noBW')} icon={<span className="text-3xl">⚖️</span>} />
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {[...S.bodyweight].reverse().map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm">
                  <span className="text-xs text-slate-400 w-20 shrink-0">{fmtShort(b.d, lang)}</span>
                  <span className="font-bold" dir="ltr">{localizeDigits(b.w, lang)} {S.unit}</span>
                  <span className="text-[11px] text-slate-400 flex-1 truncate">
                    {b.chest ? `🫁 ${localizeDigits(b.chest, lang)}` : ''} {b.waist ? `· ⏳ ${localizeDigits(b.waist, lang)}` : ''} {b.arm ? `· 💪 ${localizeDigits(b.arm, lang)}` : ''}
                  </span>
                  <button onClick={() => update((s) => { s.bodyweight = s.bodyweight.filter((x) => x.id !== b.id); })} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500">
                    <FiTrash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-4 h-fit">
        <h3 className="font-bold text-sm mb-3">📉 {gymT(lang, 'bodyWeight')}</h3>
        {chartData.length < 2 ? (
          <EmptyState message={gymT(lang, 'noBW')} icon={<span className="text-3xl">⚖️</span>} />
        ) : (
          <div className="h-64" dir="ltr">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} fontSize={10} width={44} />
                <Tooltip contentStyle={{ background: 'rgb(30 41 59)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                {S.targetW && <ReferenceLine y={S.targetW} stroke="rgb(var(--c-accent))" strokeDasharray="4 4" />}
                <Line type="monotone" dataKey="w" stroke="rgb(var(--c-primary))" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {latest && (
          <p className="text-xs text-slate-400 mt-2 text-center">
            {gymT(lang, 'bodyWeight')}: <span className="font-bold text-slate-600 dark:text-slate-200" dir="ltr">{localizeDigits(latest.w, lang)} {S.unit}</span>
          </p>
        )}
      </div>
    </div>
  );
}
