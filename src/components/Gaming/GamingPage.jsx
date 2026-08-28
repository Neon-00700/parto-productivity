import React, { useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiTrash2, FiPlay, FiClock, FiAward } from 'react-icons/fi';
import toast from 'react-hot-toast';
import StatsCard from '../Dashboard/StatsCard';
import EmptyState from '../Common/EmptyState';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import ConfirmDialog from '../Common/ConfirmDialog';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { localizeDigits, minutesToHuman } from '../../utils/dateUtils';

const EMPTY = { name: '', totalAchievements: 0, achievements: 0, totalMinutes: 0, notes: '' };

export default function GamingPage() {
  const { data, addGame, updateGame, deleteGame, addGameToToday } = useApp();
  const { t, lang } = useTranslation();
  const games = data.games || [];
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmDel, setConfirmDel] = useState(null);

  const totals = useMemo(() => ({
    games: games.length,
    achievements: games.reduce((s, g) => s + Number(g.achievements || 0), 0),
    totalAchievements: games.reduce((s, g) => s + Number(g.totalAchievements || 0), 0),
    minutes: games.reduce((s, g) => s + Number(g.totalMinutes || 0), 0),
  }), [games]);

  const openNew = () => { setForm(EMPTY); setModal('new'); };
  const openEdit = (g) => { setForm({ ...EMPTY, ...g }); setModal(g); };
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = { ...form, name: form.name.trim(), totalAchievements: Number(form.totalAchievements) || 0, achievements: Number(form.achievements) || 0, totalMinutes: Number(form.totalMinutes) || 0 };
    if (modal === 'new') { addGame(payload); toast.success(t('gaming.added')); }
    else { updateGame(modal.id, payload); toast.success(t('gaming.updated')); }
    setModal(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black">🎮 {t('gaming.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('gaming.subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard icon="🎮" label={t('gaming.totalGames')} value={localizeDigits(totals.games, lang)} />
        <StatsCard icon="🏆" label={t('gaming.achievements')} value={`${localizeDigits(totals.achievements, lang)} / ${localizeDigits(totals.totalAchievements, lang)}`} />
        <StatsCard icon="⏱️" label={t('gaming.totalTime')} value={minutesToHuman(totals.minutes, lang, t)} />
        <StatsCard icon="📅" label={t('gaming.todayTime')} value={minutesToHuman(games.reduce((s,g)=>s+Number(g.dailyMinutes||0),0), lang, t)} />
      </div>
      <Button onClick={openNew}><FiPlus /> {t('gaming.addGame')}</Button>

      {games.length === 0 ? <EmptyState message={t('gaming.noGames')} icon={<span className="text-5xl">🎮</span>} action={<Button onClick={openNew}><FiPlus /> {t('gaming.addGame')}</Button>} /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((g) => {
            const pct = g.totalAchievements ? Math.min(100, Math.round((g.achievements || 0) / g.totalAchievements * 100)) : 0;
            return <div key={g.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h3 className="font-black truncate">{g.name}</h3><p className="text-xs text-slate-400 mt-1">{localizeDigits(g.achievements || 0, lang)} / {localizeDigits(g.totalAchievements || 0, lang)} 🏆</p></div>
                <div className="flex gap-1"><button className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => openEdit(g)}><FiEdit2 size={14}/></button><button className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setConfirmDel(g.id)}><FiTrash2 size={14}/></button></div>
              </div>
              <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-primary" style={{width:`${pct}%`}}/></div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs"><div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3"><div className="text-slate-400">{t('gaming.totalTime')}</div><div className="font-bold mt-1">{minutesToHuman(g.totalMinutes || 0, lang, t)}</div></div><div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3"><div className="text-slate-400">{t('gaming.todayTime')}</div><div className="font-bold mt-1">{minutesToHuman(g.dailyMinutes || 0, lang, t)}</div></div></div>
              <div className="mt-3 flex items-center justify-between text-xs"><span className="text-slate-400">🏆 {localizeDigits(g.dailyAchievements || 0, lang)} {t('gaming.todayAchievements')}</span><Button variant="soft" className="!py-1.5 !px-3" onClick={() => { addGameToToday(g.id); toast.success(t('gaming.addedToToday')); }}><FiPlay size={12}/> {t('gaming.addToToday')}</Button></div>
              {g.notes && <p className="text-xs text-slate-400 mt-3 line-clamp-2">{g.notes}</p>}
            </div>;
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('gaming.addGame') : t('gaming.editGame')}>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">{t('gaming.gameName')} *</label><input autoFocus className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('gaming.totalAchievements')}</label><input className="input" type="number" min="0" value={form.totalAchievements} onChange={e=>setForm({...form,totalAchievements:e.target.value})}/></div>
            <div><label className="label">{t('gaming.achievements')}</label><input className="input" type="number" min="0" value={form.achievements} onChange={e=>setForm({...form,achievements:e.target.value})}/></div>
            <div><label className="label">{t('gaming.totalTime')}</label><input className="input" type="number" min="0" step="0.25" value={Number(form.totalMinutes||0)/60} onChange={e=>setForm({...form,totalMinutes:Number(e.target.value||0)*60})}/></div>
          </div>
          <div><label className="label">{t('common.notes')}</label><textarea className="input resize-none" rows="2" value={form.notes || ''} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={()=>setModal(null)}>{t('common.cancel')}</Button><Button type="submit">{t('common.save')}</Button></div>
        </form>
      </Modal>
      <ConfirmDialog open={!!confirmDel} onClose={()=>setConfirmDel(null)} onConfirm={()=>{deleteGame(confirmDel);setConfirmDel(null);toast.success(t('gaming.deleted'));}} />
    </div>
  );
}
