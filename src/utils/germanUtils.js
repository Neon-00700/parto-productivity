// Shared helpers for the German module (pure functions, no React state).
import { GERMAN_LEVELS, LEVEL_CONFIG, REVIEW_STATUS, SR_GRACE } from '../data/german/model.js';
import { todayKey, dateKey, addDays } from './dateUtils';

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- Question Bank ----
// A level's bank = its grammar fill-in questions + vocabulary meaning questions.
// Grammar questions reference their topic by id (no duplicated content).
export function questionBankFor(level, { grammar, vocabulary }) {
  const out = [];
  for (const g of grammar) {
    out.push({
      id: `g:${g.id}`,
      kind: 'grammar',
      topicId: g.id,
      prompt: g.question,
      options: g.options,
      answer: g.answer,
      hint: g.title,
    });
  }
  const pool = vocabulary;
  for (const v of pool) {
    const distractors = shuffle(pool.filter((x) => x.id !== v.id && x.persian !== v.persian)).slice(0, 3);
    out.push({
      id: `v:${v.id}`,
      kind: 'vocab',
      vocabId: v.id,
      prompt: v.word,
      options: shuffle([v.persian, ...distractors.map((d) => d.persian)]),
      answer: v.persian,
      hint: v.topic,
    });
  }
  return out;
}

// Pick a random subset for a level test (order shuffled too).
export function buildTest(level, { grammar, vocabulary, size = LEVEL_CONFIG.testSize }) {
  const bank = questionBankFor(level, { grammar, vocabulary });
  return shuffle(bank).slice(0, Math.min(size, bank.length));
}

// ---- Spaced repetition ----
// state per item: { status, due, streak, last }
export function initialReview() {
  return { status: REVIEW_STATUS.NEW, due: todayKey(), streak: 0, last: null };
}

export function applyAnswer(state, grade) {
  // grade: 'again' | 'hard' | 'good' | 'easy'
  const s = { ...(state || initialReview()), last: todayKey() };
  if (grade === 'again') {
    s.streak = 0;
    s.status = REVIEW_STATUS.LEARNING;
    s.due = todayKey(); // review again today
  } else {
    s.streak = (s.streak || 0) + 1;
    const days = SR_GRACE[grade] || 1;
    s.due = dateKey(addDays(new Date(), days));
    s.status =
      days >= SR_GRACE.easy ? REVIEW_STATUS.MASTERED
      : days >= SR_GRACE.good ? REVIEW_STATUS.REVIEW
      : REVIEW_STATUS.LEARNING;
  }
  return s;
}

export function isDue(state) {
  const s = state || initialReview();
  return s.due <= todayKey();
}

export function daysUntilDue(state) {
  const s = state || initialReview();
  const t = new Date(todayKey() + 'T00:00:00');
  const d = new Date(s.due + 'T00:00:00');
  return Math.round((d - t) / 86400000);
}

// ---- Level tests ----
// One level-test attempt per local day.
export function canTakeTestToday(lastTestDate) {
  return !lastTestDate || lastTestDate !== todayKey();
}

export function scoreAttempt(questions, answers) {
  const correct = questions.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
  const total = questions.length;
  return { correct, total, percent: total ? Math.round((correct / total) * 100) : 0 };
}

export function isPassed(percent, threshold = LEVEL_CONFIG.passingThreshold) {
  return percent >= threshold;
}

// Best result for a level from the attempt history.
export function bestForLevel(attempts, level) {
  const list = (attempts || []).filter((a) => a.level === level);
  if (!list.length) return null;
  return list.reduce((b, a) => (a.percent > b.percent ? a : b), list[0]);
}

export function lastForLevel(attempts, level) {
  const list = (attempts || []).filter((a) => a.level === level);
  if (!list.length) return null;
  return list.reduce((l, a) => (a.date > l.date ? a : l), list[0]);
}

// Confirmed level = the highest level with a passing attempt.
export function confirmedLevelFrom(attempts) {
  let confirmed = null;
  for (const lvl of GERMAN_LEVELS) {
    const b = bestForLevel(attempts, lvl);
    if (b && isPassed(b.percent)) confirmed = lvl;
    else break; // levels are sequential
  }
  return confirmed;
}

export { todayKey, dateKey, addDays };
