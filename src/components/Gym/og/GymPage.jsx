import React, { useState } from 'react';
import { FiHome, FiCalendar, FiPlay, FiBarChart2, FiDroplet, FiBookOpen, FiHelpCircle } from 'react-icons/fi';
import { useApp } from '../../../contexts/AppContext';
import { useTranslation } from '../../../hooks/useTranslation';
import Modal from '../../Common/Modal';
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
  const [helpOpen, setHelpOpen] = useState(false);

  const S = data.opengym || {};
  const api = { S, update: updateOpengym, set: setOpengym, lang, go: setTab, routineId, setRoutineId };

  const tabs = [
    { id: 'home', icon: <FiHome size={14} />, label: gymT(lang, 'nav.home') },
    { id: 'plan', icon: <FiCalendar size={14} />, label: gymT(lang, 'nav.plan') },
    { id: 'workout', icon: <FiPlay size={14} />, label: gymT(lang, 'nav.workout') },
    { id: 'body', icon: <FiDroplet size={14} />, label: gymT(lang, 'nav.body') },
    { id: 'library', icon: <FiBookOpen size={14} />, label: gymT(lang, 'nav.library') },
    { id: 'stats', icon: <FiBarChart2 size={14} />, label: gymT(lang, 'nav.stats') },
  ];

  const setEffort = (v) => update((s) => { s.effort = v; });
  const setRest = (v) => update((s) => { s.restSec = Number(v) || 90; });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-2xl bg-slate-200/70 dark:bg-slate-900 p-1 w-fit max-w-full overflow-x-auto flex-1">
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
        <button
          onClick={() => setHelpOpen(true)}
          className="btn-ghost !px-3 !py-1.5 !text-xs flex items-center gap-1 text-slate-500"
          style={{ color: 'rgb(var(--c-primary))' }}
        >
          <FiHelpCircle size={14} /> {gymT(lang, 'help')}
        </button>
      </div>

      {/* If the user hasn't built a plan yet, show a one-line hint to guide them. */}
      {tab === 'home' && !S.routines.length && (
        <div className="card !p-3 text-xs text-slate-400 flex items-center gap-2">
          <span>💡</span> {gymT(lang, 'noDefault')}
        </div>
      )}

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
      {tab === 'plan' && <Plan api={api} />}
      {tab === 'workout' && <Workout api={api} />}
      {tab === 'body' && <Body api={api} />}
      {tab === 'library' && <Library api={api} />}
      {tab === 'stats' && <Stats api={api} />}

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title={gymT(lang, 'help')} wide>
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <div>
            <p className="font-semibold mb-2">{gymT(lang, 'helpIntro')}</p>
            <ol className="space-y-2 list-none ps-0">
              <li className="flex gap-2"><span className="text-primary font-bold">۱</span> {gymT(lang, 'helpCreatRoutine')}</li>
              <li className="flex gap-2"><span className="text-primary font-bold">۲</span> {gymT(lang, 'helpAddEx')}</li>
              <li className="flex gap-2"><span className="text-primary font-bold">۳</span> {gymT(lang, 'helpStart')}</li>
              <li className="flex gap-2"><span className="text-primary font-bold">۴</span> {gymT(lang, 'helpProgress')}</li>
              <li className="flex gap-2"><span className="text-primary font-bold">۵</span> {gymT(lang, 'helpMap')}</li>
            </ol>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <p className="font-semibold mb-2">📖 {gymT(lang, 'glossary')}</p>
            <p className="text-xs text-slate-400 mb-2">{gymT(lang, 'gloss.intro')}</p>
            <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2">
              {[
                ['gloss.set', 'gloss.setD'],
                ['gloss.rep', 'gloss.repD'],
                ['gloss.weight', 'gloss.weightD'],
                ['gloss.effort', 'gloss.effortD'],
                ['gloss.prog', 'gloss.progD'],
                ['gloss.rest', 'gloss.restD'],
                ['gloss.bw', 'gloss.bwD'],
                ['gloss.side', 'gloss.sideD'],
                ['gloss.timed', 'gloss.timedD'],
                ['gloss.cardio', 'gloss.cardioD'],
              ].map(([k, d]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold" style={{ color: 'rgb(var(--c-primary))' }}>{gymT(lang, k)}</dt>
                  <dd className="text-xs text-slate-500 dark:text-slate-400">{gymT(lang, d)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Modal>
    </div>
  );
}
