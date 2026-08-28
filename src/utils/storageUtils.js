import { v4 as uuid } from 'uuid';
import { defaultHabits } from '../data/defaultHabits';

const KEY = 'parto_data_v1';
const DEVICE_KEY = 'parto_device_id';

export const APP_VERSION = '1.0.0';

// Default state for the openGym-style training module. Kept normalized to the
// Parto data model so it persists to localStorage and rides the existing cloud
// sync (Supabase) → later it can be synced between phone and computer.
export function defaultOpengym() {
  return {
    unit: 'kg',
    restSec: 90,
    targetW: null,
    bodyweight: [],
    routines: [],
    week: {},      // weekday (0=Sun..6) -> routineId
    dayPlan: {},   // ISO date -> 'rest' | routineId
    exWeights: {}, // exerciseId -> { w }
    workouts: [],  // finished sessions
    active: null,  // in-progress session
    customEx: [],
    effort: null,  // 'none' | 'rir' | 'rpe'
  };
}

export function defaultData() {
  return {
    tasks: { gym: [], programming: [], german: [], gaming: [], custom: [] },
    dailyTasks: [],
    german: { currentLevel: 'A1.1', goalLevel: 'B2', completedUnits: {}, skillMinutes: { Vocabulary: 0, Grammar: 0, Listening: 0, Speaking: 0, Reading: 0, Writing: 0 }, studyLog: [], testHistory: [], uploadedFileMeta: [], vocabProgress: {}, speakingDone: {}, speakingSkipped: {}, speakingLater: {} },
    gymProgram: [],
    opengym: defaultOpengym(),
    habits: defaultHabits(),
    calendar: [],
    pomodoro: {
      settings: { workTime: 25, shortBreak: 5, longBreak: 15, rounds: 4, preset: 'classic', autoStartWork: false, autoStartBreak: true },
      history: [],
    },
    flashcards: [],
    games: [],
    notes: [],
    journal: [],
    expenses: [],
    bodyLog: [],
    templates: [],
    frog: { date: '', taskId: '', section: '' },
    gamification: { xp: 0 },
    customTags: ['React', 'Python', 'CSS', 'JavaScript'],
    settings: {
      language: 'fa',
      theme: 'ocean',
      darkMode: true,
      dailyGoal: 10,
      supabaseUrl: '',
      supabaseKey: '',
      notifications: true,
      userName: '',
      avatar: '🙂',
      onboarded: false,
      compactMode: false,
    },
    lastSync: null,
  };
}

// localStorage must never throw
export function safeGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) {
    console.warn('localStorage read failed', e);
    return fallback;
  }
}

export function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('localStorage write failed', e);
    return false;
  }
}

function deepMergeDefaults(defaults, stored) {
  if (Array.isArray(defaults) || Array.isArray(stored)) return stored ?? defaults;
  if (typeof defaults !== 'object' || defaults === null) return stored ?? defaults;
  const out = { ...defaults };
  if (stored && typeof stored === 'object') {
    for (const k of Object.keys(stored)) {
      out[k] = k in defaults ? deepMergeDefaults(defaults[k], stored[k]) : stored[k];
    }
  }
  return out;
}

export function loadData() {
  const stored = safeGet(KEY);
  if (!stored) return defaultData();
  return deepMergeDefaults(defaultData(), stored);
}

export function saveData(data) {
  return safeSet(KEY, data);
}

export function getDeviceId() {
  let id = safeGet(DEVICE_KEY);
  if (!id) {
    id = uuid();
    safeSet(DEVICE_KEY, id);
  }
  return id;
}

// Lets the user force this device to share the same cloud row as another
// device, by manually setting the same sync code on both. Returns false if
// the code is empty/invalid so the caller can show an error.
export function setDeviceId(id) {
  const clean = (id || '').trim();
  if (!clean) return false;
  safeSet(DEVICE_KEY, clean);
  return true;
}

// ---- Simple LZW compression for Supabase payloads (saves space) ----
export function lzwCompress(str) {
  const dict = new Map();
  const data = Array.from(str);
  const out = [];
  let dictSize = 256;
  for (let i = 0; i < 256; i++) dict.set(String.fromCharCode(i), i);
  let w = '';
  for (const c of data) {
    const wc = w + c;
    if (dict.has(wc)) {
      w = wc;
    } else {
      out.push(dict.has(w) ? dict.get(w) : w.codePointAt(0));
      dict.set(wc, dictSize++);
      w = c;
    }
  }
  if (w !== '') out.push(dict.has(w) ? dict.get(w) : w.codePointAt(0));
  return out;
}

export function lzwDecompress(codes) {
  if (!Array.isArray(codes) || codes.length === 0) return '';
  const dict = new Map();
  let dictSize = 256;
  for (let i = 0; i < 256; i++) dict.set(i, String.fromCharCode(i));
  let w = dict.has(codes[0]) ? dict.get(codes[0]) : String.fromCodePoint(codes[0]);
  let result = w;
  for (let i = 1; i < codes.length; i++) {
    const k = codes[i];
    let entry;
    if (dict.has(k)) entry = dict.get(k);
    else if (k === dictSize) entry = w + w[0];
    else entry = String.fromCodePoint(k);
    result += entry;
    dict.set(dictSize++, w + entry[0]);
    w = entry;
  }
  return result;
}

// Compress an object to a compact payload; decompress back.
export function compressData(obj) {
  const json = JSON.stringify(obj);
  const codes = lzwCompress(json);
  return { __lzw: true, codes };
}

export function decompressData(payload) {
  if (payload && payload.__lzw && Array.isArray(payload.codes)) {
    try {
      return JSON.parse(lzwDecompress(payload.codes));
    } catch (e) {
      console.warn('decompress failed', e);
      return null;
    }
  }
  return payload; // plain JSON fallback
}
