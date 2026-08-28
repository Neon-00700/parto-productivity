import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import Button from '../Common/Button';
import EmptyState from '../Common/EmptyState';
import StatsCard from '../Dashboard/StatsCard';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { EXPENSE_CATEGORIES } from '../../utils/gamification';
import { todayKey, fmtShort, localizeDigits } from '../../utils/dateUtils';
import { format as formatJ, addMonths as addMonthsJ, startOfMonth as somJ, endOfMonth as eomJ } from 'date-fns-jalali';
import { format as formatG, addMonths as addMonthsG, startOfMonth as somG, endOfMonth as eomG } from 'date-fns';

export default function BudgetPage() {
  const { data, addExpense, deleteExpense } = useApp();
  const { t, lang } = useTranslation();
  const expenses = data.expenses || [];
  const fa = lang === 'fa';

  const [cursor, setCursor] = useState(new Date());
  const [form, setForm] = useState({ type: 'expense', amount: '', category: 'food', note: '', date: todayKey() });
  const [error, setError] = useState(false);

  const [mStart, mEnd, monthLabel] = useMemo(() => {
    const som = fa ? somJ : somG;
    const eom = fa ? eomJ : eomG;
    const fmt = fa ? formatJ : formatG;
    const s = som(cursor);
    const e = eom(cursor);
    const label = localizeDigits(fmt(cursor, 'MMMM yyyy'), lang);
    const key = (d) => formatG(d, 'yyyy-MM-dd');
    return [key(s), key(e), label];
  }, [cursor, fa, lang]);

  const monthEntries = useMemo(
    () => expenses.filter((e) => e.date >= mStart && e.date <= mEnd).sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, mStart, mEnd]
  );

  const totals = useMemo(() => {
    const spent = monthEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + Number(e.amount || 0), 0);
    const income = monthEntries.filter((e) => e.type === 'income').reduce((s, e) => s + Number(e.amount || 0), 0);
    return { spent, income, balance: income - spent };
  }, [monthEntries]);

  const pieData = useMemo(() =>
    EXPENSE_CATEGORIES.map((c) => ({
      name: `${c.icon} ${c[lang]}`,
      value: monthEntries.filter((e) => e.type === 'expense' && e.category === c.id).reduce((s, e) => s + Number(e.amount || 0), 0),
      color: c.color,
    })).filter((d) => d.value > 0), [monthEntries, lang]);

  const fmtAmount = (n) => localizeDigits(Number(n).toLocaleString(lang === 'fa' ? 'en-US' : 'en-US'), lang);

  const submit = (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { setError(true); return; }
    addExpense({ ...form, amount: Number(form.amount) });
    setForm((f) => ({ ...f, amount: '', note: '' }));
    setError(false);
    toast.success(t('budget.added'));
  };

  const addM = fa ? addMonthsJ : addMonthsG;

  return (
    <div className="space-y-4">
      {/* month nav + totals */}
      <div className="flex items-center gap-3">
        <button onClick={() => setCursor((c) => addM(c, -1))} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 rtl:rotate-180"><FiChevronLeft /></button>
        <h2 className="font-extrabold">{monthLabel}</h2>
        <button onClick={() => setCursor((c) => addM(c, 1))} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 rtl:rotate-180"><FiChevronRight /></button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatsCard icon="💸" label={t('budget.monthTotal')} value={fmtAmount(totals.spent)} color="text-red-500 bg-red-500/10" />
        <StatsCard icon="💰" label={t('budget.incomeTotal')} value={fmtAmount(totals.income)} color="text-green-500 bg-green-500/10" />
        <StatsCard icon="🧮" label={t('budget.balance')} value={fmtAmount(totals.balance)} color={totals.balance >= 0 ? 'text-primary bg-primary/10' : 'text-red-500 bg-red-500/10'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          {/* add form */}
          <form onSubmit={submit} className="card p-5 space-y-3">
            <h3 className="font-bold text-sm">➕ {t('budget.addEntry')}</h3>
            <div className="flex gap-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1 w-fit">
              <button type="button" onClick={() => setForm({ ...form, type: 'expense' })}
                className={`btn !py-1 !px-3 !text-xs ${form.type === 'expense' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-500' : 'text-slate-500'}`}>
                💸 {t('budget.expense')}
              </button>
              <button type="button" onClick={() => setForm({ ...form, type: 'income' })}
                className={`btn !py-1 !px-3 !text-xs ${form.type === 'income' ? 'bg-white dark:bg-slate-700 shadow-sm text-green-500' : 'text-slate-500'}`}>
                💰 {t('budget.income')}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('budget.amount')} *</label>
                <input type="number" min="0" className={`input ${error ? 'input-error' : ''}`} value={form.amount}
                  onChange={(e) => { setForm({ ...form, amount: e.target.value }); setError(false); }} />
              </div>
              <div>
                <label className="label">{t('common.date')}</label>
                <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            {form.type === 'expense' && (
              <div>
                <label className="label">{t('budget.category')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <button key={c.id} type="button" onClick={() => setForm({ ...form, category: c.id })}
                      className={`chip !px-2.5 !py-1.5 transition-all ${form.category === c.id ? 'text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                      style={form.category === c.id ? { background: c.color } : {}}>
                      {c.icon} {c[lang]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="label">{t('budget.note')}</label>
              <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <Button type="submit"><FiPlus /> {t('common.add')}</Button>
          </form>

          {/* pie */}
          <div className="card p-5">
            <h3 className="font-bold text-sm mb-3">🥧 {t('budget.byCategory')}</h3>
            {pieData.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">{t('budget.empty')}</p>
            ) : (
              <>
                <div className="h-48" dir="ltr">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" innerRadius={42} outerRadius={72} paddingAngle={2}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'rgb(30 41 59)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 12 }} formatter={(v) => fmtAmount(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {pieData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1 text-[11px] text-slate-400">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} /> {d.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* entries */}
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3">🧾 {monthLabel}</h3>
          {monthEntries.length === 0 ? (
            <EmptyState message={t('budget.empty')} icon={<span className="text-5xl">💰</span>} />
          ) : (
            <div className="space-y-1.5 max-h-[calc(100vh-300px)] overflow-y-auto">
              {monthEntries.map((e) => {
                const cat = EXPENSE_CATEGORIES.find((c) => c.id === e.category) || EXPENSE_CATEGORIES[7];
                return (
                  <div key={e.id} className="group flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
                    <span className="h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ background: `${e.type === 'income' ? '#22c55e' : cat.color}22` }}>
                      {e.type === 'income' ? '💰' : cat.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{e.note || (e.type === 'income' ? t('budget.income') : cat[lang])}</div>
                      <div className="text-[10px] text-slate-400">{fmtShort(e.date, lang)}</div>
                    </div>
                    <span className={`font-bold tabular-nums text-sm ${e.type === 'income' ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                      {e.type === 'income' ? '+' : '−'}{fmtAmount(e.amount)}
                    </span>
                    <button onClick={() => { deleteExpense(e.id); toast.success(t('budget.deleted')); }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
