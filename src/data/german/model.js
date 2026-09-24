// German module — normalized, database-ready data model.
// IDs are stable (uuid-style or deterministic slugs). All cross-references go by id.
// Designed to later sync to Supabase without a full rewrite.
//
// Content priority: Menschen structure (A1.1..B1.2) > Zisch > other reliable sources
// > existing Parto data. Existing grammar/vocabulary packs were reused after review
// because their quality and CEFR progression are solid.
import { GERMAN_GRAMMAR } from '../germanGrammar.js';
import { GERMAN_VOCABULARY } from '../germanVocabularyExpanded.js';

export const GERMAN_LEVELS = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'];

// Next level in the CEFR ladder (null at the top of the tracked range).
export function nextLevelOf(level) {
  const i = GERMAN_LEVELS.indexOf(level);
  return i >= 0 && i < GERMAN_LEVELS.length - 1 ? GERMAN_LEVELS[i + 1] : null;
}

// Passing threshold for level confirmation. Configurable, not hard-coded in logic.
export const LEVEL_CONFIG = {
  passingThreshold: 80, // %
  testSize: 20,         // questions per attempt
};

// ---- Review statuses (shared by Grammar + Vocabulary) ----
export const REVIEW_STATUS = {
  NEW: 'new',
  LEARNING: 'learning',
  REVIEW: 'review',
  MASTERED: 'mastered',
};
export const REVIEW_STATUS_LIST = [
  { id: REVIEW_STATUS.NEW },
  { id: REVIEW_STATUS.LEARNING },
  { id: REVIEW_STATUS.REVIEW },
  { id: REVIEW_STATUS.MASTERED },
];

// Simple, reliable spaced repetition.
// interval grows with consecutive correct answers; a wrong answer resets it.
//   wrong  -> review again soon (same day bucket)
//   ok     -> short interval
//   good   -> medium interval
//   easy   -> long interval
export const SR_INTERVALS = {
  new: 0,
  learning: 1,
  review: 3,
  mastered: 7,
};
export const SR_GRACE = { again: 0, hard: 1, good: 3, easy: 7 };

// ---- Activity types ----
export const ACTIVITY_TYPES = [
  'class', 'youtube', 'selfStudy', 'grammar', 'vocabulary', 'speaking', 'reading', 'writing', 'other',
];

// ---- Grammar topics (from the existing curriculum; reviewed & kept) ----
// Entity: GermanGrammarTopic
export const GRAMMAR_TOPICS = GERMAN_GRAMMAR.flatMap((g) =>
  g.lessons.map((x, i) => ({
    id: `${g.level}-${i + 1}`,
    level: g.level,
    title: x[0],
    term: x[1],
    explanation: x[2],
    example: x[3],
    question: x[4],
    options: x[5],
    answer: x[6],
  }))
);

// ---- Vocabulary items (from the existing pack; reviewed & kept) ----
// Entity: GermanVocabularyItem
export const VOCABULARY_ITEMS = GERMAN_VOCABULARY.map((v) => ({
  id: String(v.id),
  word: v.word,
  persian: v.persian,
  example: v.example,
  exampleFa: v.exampleFa || '',
  level: v.level,       // broad CEFR band: A1..C1
  topic: v.topic,
  article: v.article || '',
  plural: v.plural || '',
  pos: v.pos || 'word',
  custom: false,
}));

export function grammarByLevel(level) {
  return GRAMMAR_TOPICS.filter((t) => t.level === level);
}
export function vocabByLevel(level) {
  // Map a fine level (A1.1) to the vocabulary pack's broad band (A1).
  const band = level.split('.')[0];
  return VOCABULARY_ITEMS.filter((v) => v.level === band);
}
