import React, { useMemo, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiTrash2, FiSave } from 'react-icons/fi';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Button from '../Common/Button';
import EmptyState from '../Common/EmptyState';
import ConfirmDialog from '../Common/ConfirmDialog';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { MOODS } from '../../utils/gamification';
import { todayKey, fmtDate, fmtShort, lastNDays, dateKey } from '../../utils/dateUtils';

export default function JournalPage() {
  const { data, saveJournal, deleteJournal, today } = useApp();
  const { t, lang } = useTranslation();
  const journal = data.journal || [];

  const todayEntry = journal.find((j) => j.date === today);
  const [mood, setMood] = useState(todayEntry?.mood || 0);
  const [text, setText] = useState(todayEntry?.text || '');
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => {
    setMood(todayEntry?.mood || 0);
    setText(todayEntry?.text || '');
  }, [today]); // eslint-disable-line

  const moodData = useMemo(() =>
    lastNDays(30).map((d) => {
      const k = dateKey(d);
      const e = journal.find((j) => j.date === k);
      return { name: fmtShort(d, lang), mood: e?.mood || null };
    }), [journal, lang]);

  const hasMoodData = moodData.some((d) => d.mood);
  const past = useMemo(() => [...journal].sort((a, b) => b.date.localeCompare(a.date)).filter((j) => j.date !== today), [journal, today]);

  const save = () => {
    if (!mood && !text.trim()) return;
    saveJournal(today, mood || 3, text.trim());
    toast.success(t('journal.saved'));
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        {/* today's entry */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">✍️ {t('journal.todayEntry')}</h3>
            <span className="text-xs text-slate-400">{fmtDate(new Date(), lang, 'EEEE، d MMMM')}</span>
          </div>
          <div>
            <label className="label">{t('journal.howWasDay')}</label>
            <div className="flex gap-2">
              {MOODS.map((m) => (
                <button key={m.id} onClick={() => setMood(m.id)}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-2xl border-2 py-2.5 transition-all
                    ${mood === m.id ? 'scale-105 shadow-md' : 'border-transparent bg-slate-100 dark:bg-slate-800 opacity-70 hover:opacity-100'}`}
                  style={mood === m.id ? { borderColor: m.color, background: `${m.color}18` } : {}}>
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-[10px] font-medium" style={mood === m.id ? { color: m.color } : {}}>{m[lang]}</span>
                </button>
              ))}
            </div>
          </div>
          <textarea rows={5} className="input resize-none" placeholder={t('journal.writePlaceholder')}
            value={text} onChange={(e) => setText(e.target.value)} />
          <Button onClick={save} disabled={!mood && !text.trim()}><FiSave /> {t('journal.save')}</Button>
        </div>

        {/* mood chart */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3">📊 {t('journal.moodChart')}</h3>
          {!hasMoodData ? (
            <p className="text-xs text-slate-400 py-8 text-center">{t('journal.empty')}</p>
          ) : (
            <div className="h-44" dir="ltr">
              <ResponsiveContainer>
                <LineChart data={moodData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickLine={false} axisLine={false}
                    tickFormatter={(v) => MOODS.find((m) => m.id === v)?.icon || v} />
                  <Tooltip
                    contentStyle={{ background: 'rgb(30 41 59)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }}
                    formatter={(v) => [MOODS.find((m) => m.id === v)?.icon || v, '']}
                  />
                  <Line type="monotone" dataKey="mood" stroke="rgb(var(--c-primary))" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* past entries */}
      <div className="card p-5">
        <h3 className="font-bold text-sm mb-3">📖 {t('journal.entries')}</h3>
        {past.length === 0 ? (
          <EmptyState message={t('journal.empty')} icon={<span className="text-5xl">📖</span>} />
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
            {past.map((j) => {
              const m = MOODS.find((x) => x.id === j.mood);
              return (
                <div key={j.id} className="group rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-xl">{m?.icon}</span>
                    <span className="text-sm font-bold flex-1">{fmtDate(j.date, lang, 'EEEE، d MMMM yyyy')}</span>
                    <button onClick={() => setConfirmDel(j.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                  {j.text && <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{j.text}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!confirmDel} onClose={() => setConfirmDel(null)}
        onConfirm={() => { deleteJournal(confirmDel); toast.success(t('journal.deleted')); }} />
    </div>
  );
}
