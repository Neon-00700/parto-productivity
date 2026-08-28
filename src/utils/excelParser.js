import * as XLSX from 'xlsx';
import { v4 as uuid } from 'uuid';

// Header aliases for auto-detecting columns (English + Persian)
const COLUMN_ALIASES = {
  day: ['day', 'روز', 'day of week', 'weekday', 'روز هفته'],
  exercise: ['exercise', 'حرکت', 'تمرین', 'movement', 'name', 'نام', 'workout'],
  sets: ['sets', 'set', 'ست', 'تعداد ست'],
  reps: ['reps', 'rep', 'تکرار', 'repetitions', 'تعداد تکرار'],
  weight: ['weight', 'وزنه', 'وزن', 'kg', 'کیلوگرم', 'load'],
  notes: ['notes', 'note', 'یادداشت', 'توضیحات', 'comment', 'توضیح'],
};

const DAY_MAP = {
  saturday: 'sat', شنبه: 'sat', sat: 'sat',
  sunday: 'sun', یکشنبه: 'sun', 'یک‌شنبه': 'sun', sun: 'sun',
  monday: 'mon', دوشنبه: 'mon', mon: 'mon',
  tuesday: 'tue', 'سه‌شنبه': 'tue', 'سه شنبه': 'tue', tue: 'tue',
  wednesday: 'wed', چهارشنبه: 'wed', wed: 'wed',
  thursday: 'thu', پنجشنبه: 'thu', 'پنج‌شنبه': 'thu', thu: 'thu',
  friday: 'fri', جمعه: 'fri', fri: 'fri',
};

function normalizeDay(v) {
  if (!v) return '';
  const s = String(v).trim().toLowerCase();
  return DAY_MAP[s] || DAY_MAP[s.slice(0, 3)] || s;
}

function detectColumn(header) {
  const h = String(header).trim().toLowerCase();
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some((a) => h === a || h.includes(a))) return key;
  }
  return null;
}


// CSV files must be read as UTF-8 text (SheetJS defaults to cp1252 for array reads)
async function readWorkbook(file) {
  if (/\.csv$/i.test(file.name || '')) {
    const text = await file.text();
    return XLSX.read(text, { type: 'string' });
  }
  const buf = await file.arrayBuffer();
  return XLSX.read(buf, { type: 'array' });
}

// Returns { rows: [{id, day, exercise, sets, reps, weight, notes}], headers: [...] }
export async function parseWorkoutFile(file) {
  const wb = await readWorkbook(file);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!raw.length) throw new Error('empty');

  const headerRow = raw[0].map((h) => String(h));
  const mapping = {}; // colIndex -> fieldKey
  headerRow.forEach((h, i) => {
    const key = detectColumn(h);
    if (key && !Object.values(mapping).includes(key)) mapping[i] = key;
  });

  // Fallback: if no exercise column was found, assume classic order
  if (!Object.values(mapping).includes('exercise')) {
    const order = ['day', 'exercise', 'sets', 'reps', 'weight', 'notes'];
    headerRow.forEach((_, i) => {
      if (i < order.length) mapping[i] = order[i];
    });
  }

  let lastDay = '';
  const rows = [];
  for (let r = 1; r < raw.length; r++) {
    const line = raw[r];
    if (!line || line.every((c) => String(c).trim() === '')) continue;
    const row = { id: uuid(), day: '', exercise: '', sets: '', reps: '', weight: '', notes: '' };
    line.forEach((cell, i) => {
      const key = mapping[i];
      if (key) row[key] = String(cell).trim();
    });
    row.day = normalizeDay(row.day) || lastDay;
    if (row.day) lastDay = row.day;
    if (!row.exercise) continue;
    rows.push(row);
  }
  if (!rows.length) throw new Error('no rows');
  return { rows, headers: headerRow };
}

// ---- Vocabulary import (German flashcards) ----
const VOCAB_ALIASES = {
  german: ['german', 'deutsch', 'آلمانی', 'word', 'wort', 'کلمه'],
  persian: ['persian', 'farsi', 'فارسی', 'معنی', 'معنی فارسی'],
  english: ['english', 'انگلیسی', 'meaning', 'معنی انگلیسی'],
  example: ['example', 'مثال', 'جمله', 'sentence', 'beispiel'],
  category: ['level', 'سطح', 'category', 'دسته', 'niveau'],
};

function detectVocabColumn(header) {
  const h = String(header).trim().toLowerCase();
  for (const [key, aliases] of Object.entries(VOCAB_ALIASES)) {
    if (aliases.some((a) => h === a || h.includes(a))) return key;
  }
  return null;
}

const LEVELS_SET = ['A1', 'A2', 'B1', 'B2', 'C1'];

export async function parseVocabFile(file) {
  const wb = await readWorkbook(file);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!raw.length) throw new Error('empty');

  const headerRow = raw[0].map((h) => String(h));
  const mapping = {};
  headerRow.forEach((h, i) => {
    const key = detectVocabColumn(h);
    if (key && !Object.values(mapping).includes(key)) mapping[i] = key;
  });

  // fallback: assume order german, persian, english, example, level
  let startRow = 1;
  if (!Object.values(mapping).includes('german')) {
    const order = ['german', 'persian', 'english', 'example', 'category'];
    headerRow.forEach((_, i) => { if (i < order.length) mapping[i] = order[i]; });
    // no recognizable header → treat first row as data too
    startRow = 0;
  }

  const cards = [];
  for (let r = startRow; r < raw.length; r++) {
    const line = raw[r];
    if (!line || line.every((c) => String(c).trim() === '')) continue;
    const card = { german: '', persian: '', english: '', example: '', category: 'A1' };
    line.forEach((cell, i) => {
      const key = mapping[i];
      if (key) card[key] = String(cell).trim();
    });
    card.category = LEVELS_SET.includes(card.category.toUpperCase()) ? card.category.toUpperCase() : 'A1';
    if (!card.german || (!card.persian && !card.english)) continue;
    cards.push(card);
  }
  if (!cards.length) throw new Error('no rows');
  return cards;
}
