import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2, FiPlay, FiVolume2, FiUpload, FiHelpCircle } from 'react-icons/fi';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Badge from '../Common/Badge';
import EmptyState from '../Common/EmptyState';
import ConfirmDialog from '../Common/ConfirmDialog';
import StatsCard from '../Dashboard/StatsCard';
import QuizMode from './QuizMode';
import { parseVocabFile } from '../../utils/excelParser';
import { speak, canSpeak } from '../../utils/speech';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { localizeDigits } from '../../utils/dateUtils';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const emptyForm = { german: '', persian: '', english: '', example: '', category: 'A1' };

export default function Flashcards() {
  const { data, addCard, updateCard, deleteCard, reviewCard } = useApp();
  const { t, lang } = useTranslation();
  const cards = data.flashcards;

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [levelFilter, setLevelFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');
  const [reviewMode, setReviewMode] = useState(false);
  const [queue, setQueue] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [quizMode, setQuizMode] = useState(false);
  const importRef = React.useRef(null);

  const handleImport = async (file) => {
    if (!file) return;
    try {
      const parsed = await parseVocabFile(file);
      parsed.forEach((c) => addCard(c));
      toast.success(`${parsed.length} ${t('vocab.imported')}`);
    } catch (err) {
      console.warn(err);
      toast.error(t('vocab.importError'));
    }
  };

  const now = Date.now();
  const due = useMemo(() => cards.filter((c) => new Date(c.nextReview).getTime() <= now), [cards, now]);
  const mastered = useMemo(() => cards.filter((c) => (c.easyStreak || 0) >= 3), [cards]);

  const filtered = useMemo(() => {
    let list = cards;
    if (levelFilter !== 'all') list = list.filter((c) => c.category === levelFilter);
    if (diffFilter !== 'all') list = list.filter((c) => c.difficulty === diffFilter);
    return list;
  }, [cards, levelFilter, diffFilter]);

  const startReview = () => {
    if (!due.length) return;
    setQueue(due.map((c) => c.id));
    setFlipped(false);
    setReviewMode(true);
  };

  const currentCard = cards.find((c) => c.id === queue[0]);

  const rate = (difficulty) => {
    reviewCard(queue[0], difficulty);
    const rest = queue.slice(1);
    setQueue(rest);
    setFlipped(false);
    if (!rest.length) {
      setReviewMode(false);
      toast.success(t('german.reviewDone'));
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.german.trim()) errs.german = true;
    if (!form.persian.trim() && !form.english.trim()) errs.persian = true;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (modal === 'new') { addCard(form); toast.success(t('toast.cardAdded')); }
    else { updateCard(modal.id, form); toast.success(t('toast.cardUpdated')); }
    setModal(null);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ---- quiz mode ----
  if (quizMode) {
    return <QuizMode onExit={() => setQuizMode(false)} />;
  }

  // ---- review mode ----
  if (reviewMode && currentCard) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <button className="underline" onClick={() => setReviewMode(false)}>{t('common.back')}</button>
          <span>{localizeDigits(queue.length, lang)} {t('german.cardsLeft')}</span>
        </div>
        <button
          onClick={() => setFlipped(!flipped)}
          className="w-full card p-10 min-h-[260px] flex flex-col items-center justify-center gap-4 text-center cursor-pointer select-none hover:shadow-lg"
        >
          {!flipped ? (
            <>
              <Badge tone="primary">{currentCard.category}</Badge>
              <div className="flex items-center gap-3" dir="ltr">
                <span className="text-3xl font-extrabold">{currentCard.german}</span>
                {canSpeak() && (
                  <span onClick={(e) => { e.stopPropagation(); speak(currentCard.german); }} className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer">
                    <FiVolume2 size={16} />
                  </span>
                )}
              </div>
              {currentCard.example && <p className="text-sm text-slate-400 italic" dir="ltr">{currentCard.example}</p>}
              <span className="text-xs text-primary font-semibold mt-2">👆 {t('german.showAnswer')}</span>
            </>
          ) : (
            <div className="animate-fade-in space-y-3">
              <div className="flex items-center justify-center gap-2" dir="ltr">
                <span className="text-2xl font-bold">{currentCard.german}</span>
                {canSpeak() && (
                  <span onClick={(e) => { e.stopPropagation(); speak(currentCard.german); }} className="p-1.5 rounded-lg bg-primary/10 text-primary cursor-pointer">
                    <FiVolume2 size={14} />
                  </span>
                )}
              </div>
              {currentCard.persian && <div className="text-xl font-semibold" dir="rtl">🇮🇷 {currentCard.persian}</div>}
              {currentCard.english && <div className="text-lg text-slate-500" dir="ltr">🇬🇧 {currentCard.english}</div>}
              {currentCard.example && <p className="text-sm text-slate-400 italic" dir="ltr">{currentCard.example}</p>}
            </div>
          )}
        </button>
        {flipped && (
          <div className="grid grid-cols-3 gap-2 animate-slide-up">
            <Button variant="danger" onClick={() => rate('hard')}>{t('german.hard')}</Button>
            <Button variant="soft" className="!bg-yellow-500/10 !text-yellow-600 dark:!text-yellow-400 hover:!bg-yellow-500/20" onClick={() => rate('medium')}>{t('german.medium')}</Button>
            <Button variant="soft" className="!bg-green-500/10 !text-green-600 dark:!text-green-400 hover:!bg-green-500/20" onClick={() => rate('easy')}>{t('german.easy')}</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatsCard icon="🗂️" label={t('german.totalCards')} value={localizeDigits(cards.length, lang)} />
        <StatsCard icon="⏰" label={t('german.dueToday')} value={localizeDigits(due.length, lang)} color="text-amber-500 bg-amber-500/10" />
        <StatsCard icon="🏆" label={t('german.mastered')} value={localizeDigits(mastered.length, lang)} color="text-green-500 bg-green-500/10" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => { setForm(emptyForm); setErrors({}); setModal('new'); }}><FiPlus /> {t('german.addCard')}</Button>
        <Button variant="soft" onClick={startReview} disabled={!due.length}><FiPlay /> {t('german.startReview')} ({localizeDigits(due.length, lang)})</Button>
        <Button variant="soft" onClick={() => (cards.length >= 4 ? setQuizMode(true) : toast.error(t('quiz.needCards')))}>
          <FiHelpCircle /> {t('quiz.title')}
        </Button>
        <Button variant="ghost" onClick={() => importRef.current?.click()}><FiUpload /> {t('vocab.import')}</Button>
        <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { handleImport(e.target.files?.[0]); e.target.value = ''; }} />
        <select className="input !w-auto !py-1.5 text-xs" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          <option value="all">{t('german.level')}: {t('common.all')}</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="input !w-auto !py-1.5 text-xs" value={diffFilter} onChange={(e) => setDiffFilter(e.target.value)}>
          <option value="all">{t('common.status')}: {t('common.all')}</option>
          <option value="easy">{t('common.low')}</option>
          <option value="medium">{t('common.medium')}</option>
          <option value="hard">{t('common.high')}</option>
        </select>
      </div>

      {due.length === 0 && cards.length > 0 && (
        <p className="text-sm text-green-500 font-medium">🎉 {t('german.noDue')}</p>
      )}

      {filtered.length === 0 ? (
        <EmptyState message={t('common.empty')} icon={<span className="text-5xl">🇩🇪</span>}
          action={<Button variant="soft" onClick={() => { setForm(emptyForm); setModal('new'); }}><FiPlus /> {t('german.addCard')}</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filtered.map((c) => (
            <div key={c.id} className="group card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold flex items-center gap-1.5" dir="ltr">
                    <span className="truncate">{c.german}</span>
                    {canSpeak() && (
                      <span onClick={() => speak(c.german)} className="p-1 rounded-md text-primary/70 hover:text-primary hover:bg-primary/10 cursor-pointer shrink-0">
                        <FiVolume2 size={13} />
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 truncate">{lang === 'fa' ? c.persian || c.english : c.english || c.persian}</div>
                </div>
                <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <button onClick={() => { setForm({ ...emptyForm, ...c }); setErrors({}); setModal(c); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary"><FiEdit2 size={13} /></button>
                  <button onClick={() => setConfirmDel(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500"><FiTrash2 size={13} /></button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="primary">{c.category}</Badge>
                {c.difficulty && <Badge tone={c.difficulty === 'easy' ? 'low' : c.difficulty === 'hard' ? 'high' : 'medium'}>{t(`german.${c.difficulty}`).split('·')[0]}</Badge>}
                {(c.easyStreak || 0) >= 3 && <Badge tone="low">🏆 {t('german.mastered')}</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'new' ? t('german.addCard') : t('german.editCard')}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">{t('german.german')} *</label>
            <input autoFocus dir="ltr" className={`input ${errors.german ? 'input-error' : ''}`} value={form.german} onChange={(e) => set('german', e.target.value)} />
            {errors.german && <p className="mt-1 text-xs text-red-500">{t('common.requiredField')}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('german.persian')}</label>
              <input dir="rtl" className={`input ${errors.persian ? 'input-error' : ''}`} value={form.persian} onChange={(e) => set('persian', e.target.value)} />
            </div>
            <div>
              <label className="label">{t('german.english')}</label>
              <input dir="ltr" className="input" value={form.english} onChange={(e) => set('english', e.target.value)} />
            </div>
          </div>
          {errors.persian && <p className="text-xs text-red-500">{t('common.requiredField')}</p>}
          <div>
            <label className="label">{t('german.example')}</label>
            <input dir="ltr" className="input" value={form.example} onChange={(e) => set('example', e.target.value)} />
          </div>
          <div>
            <label className="label">{t('german.level')}</label>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => { deleteCard(confirmDel); toast.success(t('toast.cardDeleted')); }}
        title={t('german.deleteCard')}
      />
    </div>
  );
}
