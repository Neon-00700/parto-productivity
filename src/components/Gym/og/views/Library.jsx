import React, { useMemo, useState } from 'react';
import { FiSearch, FiInfo } from 'react-icons/fi';
import Card from '../../../Common/Card';
import Modal from '../../../Common/Modal';
import { gymT } from '../lib/i18n';
import { allExercises, BODYPARTS, equipmentOf } from '../lib/exercises';
import { BP_FA, EQ_FA } from '../lib/calc';
import { musclesOf, MUSCLE_NAME, MUSCLE_FA } from '../lib/muscles';
import BodyMap, { BodyMapLegend } from '../components/BodyMap';
import { faStepsFor, faGuideFor } from '../data/faSteps';
import { localizeDigits } from '../../../../utils/dateUtils';

export default function Library({ api }) {
  const { S, lang } = api;
  const [q, setQ] = useState('');
  const [bp, setBp] = useState('');
  const [eq, setEq] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailMuscle, setDetailMuscle] = useState(null);

  const list = useMemo(() => {
    const all = allExercises(S);
    const needle = q.trim().toLowerCase();
    let out = all.filter((e) => !bp || e.bp === bp);
    if (eq) out = out.filter((e) => e.eq === eq);
    if (needle) out = out.filter((e) => (e.n || '').toLowerCase().includes(needle));
    return out;
  }, [S, q, bp, eq]);
  const eqs = useMemo(() => equipmentOf(list), [list]);

  const chipCls = (active) =>
    `px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap ${
      active ? 'text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`;

  return (
    <div className="space-y-3">
      <div className="relative">
        <FiSearch className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input className="input !ps-9" placeholder={gymT(lang, 'search')} value={q} onChange={(e) => setQ(e.target.value)} />
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {list.map((e) => (
          <Card key={e.id} className="!p-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold capitalize truncate">{e.n}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {lang === 'fa' ? (BP_FA[e.bp] || e.bp) : e.bp}{e.eq ? ` · ${lang === 'fa' ? (EQ_FA[e.eq] || e.eq) : e.eq}` : ''}
                </p>
              </div>
              <button onClick={() => setDetail(e)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary"><FiInfo size={14} /></button>
            </div>
          </Card>
        ))}
      </div>
      {list.length === 0 && <p className="text-center text-sm text-slate-400 py-8">{gymT(lang, 'empty')}</p>}

      <Modal open={!!detail} onClose={() => { setDetail(null); setDetailMuscle(null); }} title={detail?.n || ''}>
        {detail && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="chip">{lang === 'fa' ? (BP_FA[detail.bp] || detail.bp) : detail.bp}</span>
              {detail.eq && <span className="chip">{lang === 'fa' ? (EQ_FA[detail.eq] || detail.eq) : detail.eq}</span>}
              {detail.tg && <span className="chip">{detail.tg}</span>}
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">💪 {gymT(lang, 'muscleMap')}</p>
              <BodyMap load={musclesOf(detail)} onMuscle={setDetailMuscle} selected={detailMuscle} lang={lang} />
              <div className="mt-2 flex flex-wrap items-center gap-2 justify-center">
                <BodyMapLegend lang={lang} />
              </div>
              {(detailMuscle || Object.keys(musclesOf(detail) || {})) ? (
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  {gymT(lang, 'target')}:{' '}
                  {(detailMuscle ? [detailMuscle] : Object.keys(musclesOf(detail)))
                    .map((m) => (lang === 'fa' ? (MUSCLE_FA[m] || m) : (MUSCLE_NAME[m] || m)))
                    .join(' · ')}
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">{gymT(lang, 'howTo')}</p>
              {lang === 'fa' ? (
                <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {faGuideFor(detail).map((s, i) => <p key={i}>{s}</p>)}
                  {faStepsFor(detail.n) && (
                    <ol className="list-decimal ps-5 space-y-1.5 pt-1">
                      {faStepsFor(detail.n).map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  )}
                </div>
              ) : (
                <ol className="list-decimal ps-5 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {(detail.st || []).map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
