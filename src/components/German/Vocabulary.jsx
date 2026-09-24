import React, { useMemo, useState } from 'react';
import { VocabularyIcon, PlusIcon, EditIcon, TrashIcon, RefreshIcon, CheckIcon } from '../icons';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import EmptyState from '../Common/EmptyState';
import ConfirmDialog from '../Common/ConfirmDialog';
import Select from '../Common/Select';
import { useTranslation } from '../../hooks/useTranslation';
import { useGerman } from '../../hooks/useGerman';
import { VOCABULARY_ITEMS, GERMAN_LEVELS } from '../../data/german/model.js';
import { isDue, daysUntilDue } from '../../utils/germanUtils';
import { localizeDigits } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const BANDS = ['all', 'A1', 'A2', 'B1', 'B2', 'C1'];

export default function Vocabulary({ german }) {
  const { t, lang } = useTranslation();
  const [band, setBand] = useState('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [session, setSession] = useState(null);

  const all = useMemo(() => [...(german.customVocab || []), ...VOCABULARY_ITEMS], [german.customVocab]);
  const filtered = useMemo(() => all.filter((v) =>
    (band === 'all' || v.level === band || (band !== 'all' && v.level.startsWith(band))) &&
    (!search.trim() || `${v.word} ${v.persian} ${v.example}`.toLowerCase().includes(search.toLowerCase()))
  ), [all, band, search]);

  const due = all.filter((v) => isDue(german.reviews[`vocab:${v.id}`]));

  const startSession = () => {
    const queue = (due.length ? due : all).slice(0, 12);
    setSession({ queue, idx: 0, revealed: false });
  };

  if (session) {
    const v = session.queue[session.idx];
    if (!v) {
      return (
        <div className="max-w-md mx-auto card p-8 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckIcon size={26} />
          </div>
          <h3 className="text-lg font-black">{t('german.reviewDone')}</h3>
          <Button onClick={() => setSession(null)}>{t('german.backToVocab')}</Button>
        </div>
      );
    }
    const st = german.reviews[`vocab:${v.id}`] || { status: 'new' };
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <button onClick={() => setSession(null)} className="hover:text-primary">{t('german.exit')}</button>
          <span className="tabular-nums">{localizeDigits(String(session.idx + 1), lang)} / {localizeDigits(String(session.queue.length), lang)}</span>
        </div>
        <div className="card p-6 text-center space-y-4">
          <span className="chip bg-primary/10 text-primary">{v.level} · {v.topic}</span>
          <div className="text-4xl font-black" dir="ltr">{v.word}</div>
          {v.article && <div className="text-sm text-slate-400" dir="ltr">{v.article} · {v.plural || '—'}</div>}
          {session.revealed ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <div className="text-xl font-bold">{v.persian}</div>
                <div className="text-sm font-semibold mt-2" dir="ltr">{v.example}</div>
                {v.exampleFa && <div className="text-xs text-slate-400 mt-1">{v.exampleFa}</div>}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[['again', t('german.grade_again'), 'bg-red-500/10 text-red-500'],
                  ['hard', t('german.grade_hard'), 'bg-orange-500/10 text-orange-500'],
                  ['good', t('german.grade_good'), 'bg-sky-500/10 text-sky-500'],
                  ['easy', t('german.grade_easy'), 'bg-emerald-500/10 text-emerald-500']].map(([id, label, cls]) => (
                  <button
                    key={id}
                    onClick={() => {
                      german.recordReview('vocab', v.id, id);
                      setSession((s) => ({ ...s, idx: s.idx + 1, revealed: false }));
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-80 ${cls}`}
                  >{label}</button>
                ))}
              </div>
            </div>
          ) : (
            <Button onClick={() => setSession((s) => ({ ...s, revealed: true }))}>
              {t('german.showMeaning')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm">{t('german.vocabBank')}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {localizeDigits(String(filtered.length), lang)} / {localizeDigits(String(all.length), lang)} {t('german.words')}
            {due.length > 0 && ` · ${localizeDigits(String(due.length), lang)} ${t('german.dueNow')}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="soft" onClick={startSession}><RefreshIcon size={15} /> {t('german.review')}</Button>
          <Button onClick={() => { setForm({ word: '', persian: '', example: '', level: 'A1', topic: t('german.customTopic') }); setModal('new'); }}>
            <PlusIcon size={15} /> {t('german.addWord')}
          </Button>
        </div>
      </div>

      <div className="card p-3 flex flex-wrap gap-2 items-center">
        {BANDS.map((b) => (
          <button
            key={b}
            onClick={() => setBand(b)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${band === b ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
          >{b === 'all' ? t('german.allLevels') : b}</button>
        ))}
        <input
          className="input flex-1 min-w-[160px]"
          placeholder={t('german.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          message={t('german.noWords')}
          icon={<span className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center"><VocabularyIcon size={30} /></span>}
          action={<Button onClick={() => { setForm({ word: '', persian: '', example: '', level: 'A1', topic: t('german.customTopic') }); setModal('new'); }}><PlusIcon size={15} /> {t('german.addWord')}</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filtered.slice(0, 120).map((v) => {
            const st = german.reviews[`vocab:${v.id}`] || { status: 'new', due: null };
            const d = st.due ? daysUntilDue({ due: st.due }) : null;
            return (
              <div key={v.id} className="card p-3.5 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate" dir="ltr">{v.word}</div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{v.persian}</div>
                  </div>
                  {v.custom ? (
                    <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setForm({ ...v }); setModal(v); }} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800"><EditIcon size={13} /></button>
                      <button onClick={() => setConfirm(v)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><TrashIcon size={13} /></button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 shrink-0">{v.level}</span>
                  )}
                </div>
                {v.example && <div className="text-[11px] text-slate-400 mt-1.5 truncate" dir="ltr">{v.example}</div>}
                <div className="mt-2 flex items-center gap-1.5">
                  <StatusDot status={st.status} t={t} />
                  {d !== null && d > 0 && <span className="text-[10px] text-slate-400">{t('german.dueInDays', { n: String(d) })}</span>}
                  {d !== null && d <= 0 && <span className="text-[10px] text-amber-500">{t('german.dueTodayLabel')}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('german.addWord') : t('german.editWord')}>
        {form && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.word.trim() || !form.persian.trim()) { toast.error(t('german.wordRequired')); return; }
              if (modal === 'new') {
                german.addCustomVocab(form);
                toast.success(t('german.wordAdded'));
              } else {
                const cv = (german.customVocab || []).find((x) => x.id === modal.id);
                if (cv) {
                  german.mutateCustomVocab?.(modal.id, form);
                }
                toast.success(t('common.updated'));
              }
              setModal(null);
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">{t('german.germanWord')} *</label>
              <input className="input" dir="ltr" value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('german.persianMeaning')} *</label>
              <input className="input" value={form.persian} onChange={(e) => setForm({ ...form, persian: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('german.exampleSentence')}</label>
              <input className="input" dir="ltr" value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('german.level')}</label>
              <Select value={form.level} onChange={(v) => setForm({ ...form, level: v })} options={GERMAN_LEVELS.map((l) => ({ value: l, label: l }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
              <Button type="submit">{t('common.save')}</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { german.deleteCustomVocab(confirm.id); toast.success(t('common.deleted')); }}
      />
    </div>
  );
}

function StatusDot({ status, t }) {
  const map = {
    new: 'bg-slate-300 dark:bg-slate-600',
    learning: 'bg-amber-500',
    review: 'bg-sky-500',
    mastered: 'bg-emerald-500',
  };
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
      <span className={`h-2 w-2 rounded-full ${map[status] || map.new}`} />
      {t(`german.st_${status}`)}
    </span>
  );
}
