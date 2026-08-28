import React, { useState } from 'react';
import { FiCalendar, FiPlay, FiBarChart2, FiDroplet, FiBookOpen } from 'react-icons/fi';
import { useApp } from '../../../contexts/AppContext';
import { useTranslation } from '../../../hooks/useTranslation';
import { gymT } from './lib/i18n';
import { localizeDigits } from '../../../utils/dateUtils';
import Home from './views/Home';
import Plan from './views/Plan';
import Workout from './views/Workout';
import Body from './views/Body';
import Library from './views/Library';
import Stats from './views/Stats';

export default function GymPage() {
  const { data, updateOpengym, setOpengym } = useApp();
  const { lang } = useTranslation();
  const [tab, setTab] = useState('home');
  const [routineId, setRoutineId] = useState(null); // for routine editor in Plan

  const S = data.opengym || {};
  const api = { S, update: updateOpengym, set: setOpengym, lang, go: setTab, routineId, setRoutineId };

  const tabs = [
    { id: 'home', icon: <FiCalendar size={14} />, label: gymT(lang, 'nav.plan') },
    { id: 'workout', icon: <FiPlay size={14} />, label: gymT(lang, 'nav.workout') },
    { id: 'body', icon: <FiDroplet size={14} />, label: gymT(lang, 'nav.body') },
    { id: 'library', icon: <FiBookOpen size={14} />, label: gymT(lang, 'nav.library') },
    { id: 'stats', icon: <FiBarChart2 size={14} />, label: gymT(lang, 'nav.stats') },
  ];

  // Global training settings (shown as a slim strip under the tabs).
  const setEffort = (v) => update((s) => { s.effort = v; });
  const setRest = (v) => update((s) => { s.restSec = Number(v) || 90; });

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-2xl bg-slate-200/70 dark:bg-slate-900 p-1 w-fit max-w-full overflow-x-auto">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`btn !py-1.5 !text-xs whitespace-nowrap ${tab === tb.id ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500'}`}
          >
            {tb.icon} {tb.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-1">
        <label className="flex items-center gap-1.5 text-xs text-slate-400">
          {gymT(lang, 'effort')}
          <select className="input !w-auto !py-1 !text-xs" value={S.effort || 'none'} onChange={(e) => setEffort(e.target.value)}>
            <option value="none">{gymT(lang, 'effort.none')}</option>
            <option value="rir">{gymT(lang, 'effort.rir')}</option>
            <option value="rpe">{gymT(lang, 'effort.rpe')}</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-400">
          {gymT(lang, 'restSec')}
          <select className="input !w-auto !py-1 !text-xs" value={S.restSec || 90} onChange={(e) => setRest(e.target.value)}>
            {[30, 45, 60, 90, 120, 180].map((r) => <option key={r} value={r}>{localizeDigits(r, lang)}s</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-400">
          {gymT(lang, 'unit')}
          <select className="input !w-auto !py-1 !text-xs" value={S.unit || 'kg'} onChange={(e) => update((s) => { s.unit = e.target.value; })}>
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </label>
      </div>

      {tab === 'home' && <Home api={api} />}
      {tab === 'workout' && <Workout api={api} />}
      {tab === 'body' && <Body api={api} />}
      {tab === 'library' && <Library api={api} />}
      {tab === 'stats' && <Stats api={api} />}
    </div>
  );
}
