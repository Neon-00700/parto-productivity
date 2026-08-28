import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { loadData, saveData, defaultData } from '../utils/storageUtils';
import { todayKey, isoDay, dateKey, addDays } from '../utils/dateUtils';
import { XP_RULES, levelOf } from '../utils/gamification';
import { defaultHabits } from '../data/defaultHabits';
import { GERMAN_LEVELS } from '../data/germanCourse';
import { cloudConfigured, pushDataToCloud, pullDataFromCloud } from '../utils/cloudSync';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [data, setData] = useState(() => {
    const initial = loadData();
    const day = todayKey();
    initial.games = (initial.games || []).map((g) => {
      const a = g.activityHistory?.[day] || { minutes: 0, achievements: 0 };
      return { ...g, dailyMinutes: a.minutes || 0, dailyAchievements: a.achievements || 0 };
    });
    return initial;
  });
  const [today, setToday] = useState(todayKey());
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const firstRender = useRef(true);

  // persist to localStorage in real-time
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    saveData(data);
  }, [data]);

  // Online backup/sync. Local storage remains the primary/offline copy.
  const cloudBooted = useRef(false);
  const cloudTimer = useRef(null);
  const cloudSyncing = useRef(false);
  const lastPushedAt = useRef(null);
  const meaningfulLocal = useCallback((d) => !!(
    (d.tasks && Object.values(d.tasks).some(a => (a || []).length)) ||
    (d.dailyTasks || []).length || (d.games || []).length || (d.gymProgram || []).length ||
    (d.calendar || []).length || (d.flashcards || []).length || (d.notes || []).length ||
    (d.journal || []).length || (d.expenses || []).length || (d.bodyLog || []).length ||
    (d.templates || []).length || (d.pomodoro?.history || []).length ||
    Object.keys(d.german?.completedUnits || {}).length || (d.german?.studyLog || []).length ||
    (d.german?.testHistory || []).length
  ), []);

  useEffect(() => {
    if (!cloudConfigured(data.settings)) return;
    if (!cloudBooted.current) {
      cloudBooted.current = true;
      (async () => {
        cloudSyncing.current = true;
        try {
          if (!meaningfulLocal(data) && !data.lastSync) {
            const pulled = await pullDataFromCloud(data);
            if (pulled.ok && pulled.data) {
              lastPushedAt.current = pulled.updatedAt || pulled.data.lastSync || null;
              setData(pulled.data);
            } else if (pulled.error === 'not-found') {
              const pushed = await pushDataToCloud(data);
              if (pushed.ok) { lastPushedAt.current = pushed.at; setData(d => ({ ...d, lastSync: pushed.at })); }
            }
          } else {
            const pushed = await pushDataToCloud(data);
            if (pushed.ok) { lastPushedAt.current = pushed.at; setData(d => ({ ...d, lastSync: pushed.at })); }
          }
        } finally { cloudSyncing.current = false; }
      })();
      return;
    }
    if (cloudSyncing.current) return;
    if (lastPushedAt.current && data.lastSync === lastPushedAt.current) return;
    clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      cloudSyncing.current = true;
      try {
        const result = await pushDataToCloud(data);
        if (result.ok) { lastPushedAt.current = result.at; setData(d => ({ ...d, lastSync: result.at })); }
      } finally { cloudSyncing.current = false; }
    }, 1200);
    return () => clearTimeout(cloudTimer.current);
  }, [data, meaningfulLocal]);

  // detect day change (auto-resets daily habit checkboxes since they are date-keyed)
  useEffect(() => {
    const iv = setInterval(() => {
      const k = todayKey();
      setToday((prev) => {
        if (prev === k) return prev;
        setData((current) => {
          const next = structuredClone(current);
          next.games = (next.games || []).map((g) => {
            const todayActivity = g.activityHistory?.[k] || { minutes: 0, achievements: 0 };
            return { ...g, dailyMinutes: todayActivity.minutes || 0, dailyAchievements: todayActivity.achievements || 0 };
          });
          return next;
        });
        return k;
      });
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  const update = useCallback((fn) => setData((d) => fn(structuredClone(d))), []);

  // synchronous snapshot of current data for reads inside action creators
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // ---------- gamification (XP) ----------
  const xpRef = useRef(data.gamification?.xp || 0);
  useEffect(() => { xpRef.current = data.gamification?.xp || 0; }, [data.gamification?.xp]);
  const [levelUpFlash, setLevelUpFlash] = useState(null); // new level number, consumed by Layout

  const addXp = useCallback((amount) => {
    const before = levelOf(xpRef.current);
    const after = levelOf(Math.max(0, xpRef.current + amount));
    xpRef.current = Math.max(0, xpRef.current + amount);
    if (after > before && amount > 0) setLevelUpFlash(after);
    update((d) => {
      d.gamification = d.gamification || { xp: 0 };
      d.gamification.xp = Math.max(0, (d.gamification.xp || 0) + amount);
      return d;
    });
  }, [update]);

  // ---------- settings ----------
  const updateSettings = useCallback((patch) => {
    update((d) => {
      d.settings = { ...d.settings, ...patch };
      return d;
    });
  }, [update]);

  // ---------- tasks ----------
  const addTask = useCallback((section, task) => {
    const full = {
      id: uuid(), title: '', description: '', priority: 'medium', dueDate: '', tags: [],
      estimatedTime: '', actualTime: '', notes: '', status: 'todo', done: false, archived: false,
      createdAt: new Date().toISOString(), completedAt: null, ...task,
    };
    update((d) => {
      d.tasks[section] = [full, ...(d.tasks[section] || [])];
      return d;
    });
    return full;
  }, [update]);

  const updateTask = useCallback((section, id, patch) => {
    update((d) => {
      d.tasks[section] = d.tasks[section].map((t) => (t.id === id ? { ...t, ...patch } : t));
      return d;
    });
  }, [update]);

  const toggleTask = useCallback((section, id) => {
    const existing = (dataRef.current.tasks[section] || []).find((t) => t.id === id);
    const wasDone = !!existing?.done;
    update((d) => {
      let recurringSpawn = null;
      d.tasks[section] = d.tasks[section].map((t) => {
        if (t.id !== id) return t;
        const done = !t.done;
        // recurring: spawn next occurrence on completion
        if (done && t.recurring && t.recurring !== 'none' && !recurringSpawn) {
          const days = t.recurring === 'daily' ? 1 : 7;
          const base = t.dueDate ? new Date(t.dueDate + 'T00:00') : new Date();
          recurringSpawn = {
            ...t, id: uuid(), done: false, status: 'todo', completedAt: null, archived: false,
            createdAt: new Date().toISOString(), dueDate: dateKey(addDays(base, days)),
          };
        }
        return { ...t, done, status: done ? 'done' : 'todo', completedAt: done ? new Date().toISOString() : null };
      });
      if (recurringSpawn) d.tasks[section] = [recurringSpawn, ...d.tasks[section]];
      return d;
    });
    // XP: symmetric award/remove prevents farming
    addXp(wasDone ? -XP_RULES.task : XP_RULES.task);
    return !wasDone;
  }, [update, addXp]);

  const deleteTask = useCallback((section, id) => {
    let removed = null;
    let index = -1;
    update((d) => {
      index = d.tasks[section].findIndex((t) => t.id === id);
      if (index >= 0) {
        removed = d.tasks[section][index];
        d.tasks[section].splice(index, 1);
      }
      return d;
    });
    return { removed, index, restore: () => update((d) => {
      const arr = d.tasks[section];
      arr.splice(Math.min(index < 0 ? 0 : index, arr.length), 0, removed);
      return d;
    }) };
  }, [update]);

  const bulkTasks = useCallback((section, ids, action) => {
    update((d) => {
      if (action === 'delete') d.tasks[section] = d.tasks[section].filter((t) => !ids.includes(t.id));
      else d.tasks[section] = d.tasks[section].map((t) => {
        if (!ids.includes(t.id)) return t;
        if (action === 'complete') return { ...t, done: true, status: 'done', completedAt: t.completedAt || new Date().toISOString() };
        if (action === 'archive') return { ...t, archived: true };
        return t;
      });
      return d;
    });
  }, [update]);

  const reorderTasks = useCallback((section, fromId, toId) => {
    update((d) => {
      const arr = d.tasks[section];
      const from = arr.findIndex((t) => t.id === fromId);
      const to = arr.findIndex((t) => t.id === toId);
      if (from < 0 || to < 0) return d;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return d;
    });
  }, [update]);

  const addCustomTag = useCallback((tag) => {
    update((d) => {
      if (!d.customTags.includes(tag)) d.customTags.push(tag);
      return d;
    });
  }, [update]);

  // ---------- today tasks ----------
  const addDailyTask = useCallback((task) => {
    const full = {
      id: uuid(), date: todayKey(), title: '', type: 'task', done: false, recurring: 'none',
      linkedSection: 'custom', linkedId: '', gameId: '', timerSeconds: 0, timerRunning: false,
      timerStartedAt: null, createdAt: new Date().toISOString(), ...task,
    };
    update((d) => { d.dailyTasks = [full, ...(d.dailyTasks || [])]; return d; });
    return full;
  }, [update]);

  const addGameToToday = useCallback((gameId) => {
    const existing = (dataRef.current.dailyTasks || []).find((x) => x.date === todayKey() && x.gameId === gameId && !x.archived);
    if (existing) return existing;
    const game = (dataRef.current.games || []).find((g) => g.id === gameId);
    if (!game) return null;
    return addDailyTask({ title: game.name, type: 'game', gameId, linkedSection: 'gaming', linkedId: gameId });
  }, [addDailyTask]);

  const updateDailyTask = useCallback((id, patch) => {
    update((d) => { d.dailyTasks = (d.dailyTasks || []).map((x) => x.id === id ? { ...x, ...patch } : x); return d; });
  }, [update]);

  const toggleDailyTask = useCallback((id) => {
    const existing = (dataRef.current.dailyTasks || []).find((x) => x.id === id);
    if (!existing) return;
    update((d) => {
      d.dailyTasks = (d.dailyTasks || []).map((x) => x.id === id ? { ...x, done: !x.done, completedAt: !x.done ? new Date().toISOString() : null } : x);
      const current = d.dailyTasks.find((x) => x.id === id);
      if (current?.done && current.recurring === 'daily') {
        const tomorrow = addDays(new Date(current.date + 'T00:00'), 1);
        const key = dateKey(tomorrow);
        const exists = d.dailyTasks.some((x) => x.title === current.title && x.date === key && x.recurring === 'daily');
        if (!exists) d.dailyTasks.unshift({ ...current, id: uuid(), date: key, done: false, completedAt: null, timerSeconds: 0, timerRunning: false, timerStartedAt: null, createdAt: new Date().toISOString() });
      }
      return d;
    });
  }, [update]);

  const deleteDailyTask = useCallback((id) => {
    update((d) => { d.dailyTasks = (d.dailyTasks || []).filter((x) => x.id !== id); return d; });
  }, [update]);

  const startDailyTimer = useCallback((id) => {
    update((d) => { d.dailyTasks = (d.dailyTasks || []).map((x) => x.id === id ? { ...x, timerRunning: true, timerStartedAt: new Date().toISOString() } : x); return d; });
  }, [update]);

  const stopDailyTimer = useCallback((id) => {
    const current = (dataRef.current.dailyTasks || []).find((x) => x.id === id);
    if (!current?.timerRunning || !current.timerStartedAt) return;
    const extra = Math.max(0, Math.floor((Date.now() - new Date(current.timerStartedAt).getTime()) / 1000));
    update((d) => { d.dailyTasks = (d.dailyTasks || []).map((x) => x.id === id ? { ...x, timerRunning: false, timerStartedAt: null, timerSeconds: (x.timerSeconds || 0) + extra } : x); return d; });
  }, [update]);

  const updateTodayGameActivity = useCallback((gameId, patch) => {
    const day = todayKey();
    const old = (dataRef.current.games || []).find((g) => g.id === gameId);
    if (!old) return;
    const oldDay = old.activityHistory?.[day] || { minutes: 0, achievements: 0 };
    const minutes = Math.max(0, Math.round(Number(patch.hours || 0) * 60));
    const achievements = Math.max(0, Math.round(Number(patch.achievements || 0)));
    update((d) => {
      d.games = (d.games || []).map((g) => {
        if (g.id !== gameId) return g;
        const activityHistory = { ...(g.activityHistory || {}), [day]: { minutes, achievements } };
        return { ...g, activityHistory, dailyMinutes: minutes, dailyAchievements: achievements,
          totalMinutes: Math.max(0, Number(g.totalMinutes || 0) + (minutes - Number(oldDay.minutes || 0))),
          achievements: Math.max(0, Number(g.achievements || 0) + (achievements - Number(oldDay.achievements || 0))) };
      });
      return d;
    });
  }, [update]);

  // ---------- gym program ----------
  const setGymProgram = useCallback((rows) => {
    update((d) => { d.gymProgram = rows; return d; });
  }, [update]);

  // ---------- habits ----------
  const addHabit = useCallback((habit) => {
    update((d) => {
      d.habits.push({ id: uuid(), type: 'check', history: {}, createdAt: new Date().toISOString(), ...habit });
      return d;
    });
  }, [update]);

  const updateHabit = useCallback((id, patch) => {
    update((d) => {
      d.habits = d.habits.map((h) => (h.id === id ? { ...h, ...patch } : h));
      return d;
    });
  }, [update]);

  const deleteHabit = useCallback((id) => {
    update((d) => {
      d.habits = d.habits.filter((h) => h.id !== id);
      return d;
    });
  }, [update]);

  const toggleHabit = useCallback((id, day = todayKey()) => {
    const h = dataRef.current.habits.find((x) => x.id === id);
    const wasDone = !!h?.history?.[day];
    update((d) => {
      d.habits = d.habits.map((habit) => {
        if (habit.id !== id) return habit;
        const history = { ...habit.history };
        if (history[day]) delete history[day];
        else history[day] = true;
        return { ...habit, history };
      });
      return d;
    });
    addXp(wasDone ? -XP_RULES.habit : XP_RULES.habit);
  }, [update, addXp]);

  const setWater = useCallback((id, count, day = todayKey()) => {
    update((d) => {
      d.habits = d.habits.map((h) => {
        if (h.id !== id) return h;
        const history = { ...h.history };
        if (count <= 0) delete history[day];
        else history[day] = count;
        return { ...h, history };
      });
      return d;
    });
  }, [update]);

  // ---------- calendar ----------
  const addEvent = useCallback((ev) => {
    update((d) => {
      d.calendar.push({ id: uuid(), createdAt: new Date().toISOString(), ...ev });
      return d;
    });
  }, [update]);

  const updateEvent = useCallback((id, patch) => {
    update((d) => {
      d.calendar = d.calendar.map((e) => (e.id === id ? { ...e, ...patch } : e));
      return d;
    });
  }, [update]);

  const deleteEvent = useCallback((id) => {
    update((d) => {
      d.calendar = d.calendar.filter((e) => e.id !== id);
      return d;
    });
  }, [update]);

  // ---------- flashcards ----------
  const addCard = useCallback((card) => {
    update((d) => {
      d.flashcards.push({
        id: uuid(), german: '', persian: '', english: '', example: '', category: 'A1',
        difficulty: null, reviews: 0, easyStreak: 0, nextReview: new Date().toISOString(),
        createdAt: new Date().toISOString(), ...card,
      });
      return d;
    });
  }, [update]);

  const updateCard = useCallback((id, patch) => {
    update((d) => {
      d.flashcards = d.flashcards.map((c) => (c.id === id ? { ...c, ...patch } : c));
      return d;
    });
  }, [update]);

  const deleteCard = useCallback((id) => {
    update((d) => {
      d.flashcards = d.flashcards.filter((c) => c.id !== id);
      return d;
    });
  }, [update]);

  // ---------- German learning ----------
  const updateGerman = useCallback((patch) => {
    update((d) => { d.german = { ...(d.german || {}), ...patch }; return d; });
  }, [update]);
  const setGermanUnitDone = useCallback((level, unitId, done = true) => {
    update((d) => {
      d.german = d.german || { currentLevel:'A1.1', goalLevel:'B2', completedUnits:{}, skillMinutes:{}, studyLog:[], testHistory:[], uploadedFileMeta:[] };
      const key = `${level}:${unitId}`;
      d.german.completedUnits = { ...(d.german.completedUnits || {}) };
      if (done) d.german.completedUnits[key] = new Date().toISOString(); else delete d.german.completedUnits[key];
      const currentIndex = Math.max(0, GERMAN_LEVELS.findIndex(x => x.id === (d.german.currentLevel || 'A1.1')));
      const current = GERMAN_LEVELS[currentIndex];
      if (done && current && current.units.every(u => d.german.completedUnits[`${current.id}:${u[0]}`])) {
        const next = GERMAN_LEVELS[currentIndex + 1]; if (next) d.german.currentLevel = next.id;
      }
      return d;
    });
  }, [update]);
  const addGermanStudy = useCallback((entry) => {
    update((d) => { d.german = d.german || {}; d.german.studyLog = [...(d.german.studyLog || []), { id: uuid(), createdAt:new Date().toISOString(), ...entry }]; d.german.skillMinutes = { ...(d.german.skillMinutes || {}) }; if (entry.skill) d.german.skillMinutes[entry.skill] = (d.german.skillMinutes[entry.skill] || 0) + Number(entry.minutes || 0); return d; });
  }, [update]);
  const addGermanTestResult = useCallback((result) => {
    update((d) => { d.german = d.german || {}; d.german.testHistory = [...(d.german.testHistory || []), { id:uuid(), createdAt:new Date().toISOString(), ...result }]; return d; });
  }, [update]);

  // spaced repetition: easy=3 days, medium=1 day, hard=1 hour
  const reviewCard = useCallback((id, difficulty) => {
    const next = new Date();
    if (difficulty === 'easy') next.setDate(next.getDate() + 3);
    else if (difficulty === 'medium') next.setDate(next.getDate() + 1);
    else next.setHours(next.getHours() + 1);
    update((d) => {
      d.flashcards = d.flashcards.map((c) => {
        if (c.id !== id) return c;
        const easyStreak = difficulty === 'easy' ? (c.easyStreak || 0) + 1 : 0;
        return { ...c, difficulty, reviews: (c.reviews || 0) + 1, easyStreak, nextReview: next.toISOString(), lastReview: new Date().toISOString() };
      });
      return d;
    });
    addXp(XP_RULES.flashcard);
  }, [update, addXp]);

  // ---------- games ----------
  const addGame = useCallback((game) => {
    update((d) => {
      const id = uuid();
      d.games.push({ id, createdAt: new Date().toISOString(), totalAchievements: 0, achievements: 0, totalMinutes: 0, dailyMinutes: 0, dailyAchievements: 0, activityHistory: {}, ...game });
      return d;
    });
  }, [update]);

  const updateGame = useCallback((id, patch) => {
    update((d) => {
      d.games = d.games.map((g) => (g.id === id ? { ...g, ...patch } : g));
      return d;
    });
  }, [update]);

  const deleteGame = useCallback((id) => {
    update((d) => {
      d.games = d.games.filter((g) => g.id !== id);
      return d;
    });
  }, [update]);

  // ---------- pomodoro data ----------
  const updatePomodoroSettings = useCallback((patch) => {
    update((d) => {
      d.pomodoro.settings = { ...d.pomodoro.settings, ...patch };
      return d;
    });
  }, [update]);

  const addPomodoroHistory = useCallback((entry) => {
    update((d) => {
      d.pomodoro.history.push({ id: uuid(), ...entry });
      return d;
    });
    if (entry.phase === 'work') addXp(XP_RULES.pomodoro);
  }, [update, addXp]);

  // ---------- quick notes ----------
  const addNote = useCallback((text, color) => {
    update((d) => {
      d.notes = [{ id: uuid(), text, color, createdAt: new Date().toISOString() }, ...(d.notes || [])];
      return d;
    });
  }, [update]);

  const updateNote = useCallback((id, patch) => {
    update((d) => { d.notes = (d.notes || []).map((n) => (n.id === id ? { ...n, ...patch } : n)); return d; });
  }, [update]);

  const deleteNote = useCallback((id) => {
    update((d) => { d.notes = (d.notes || []).filter((n) => n.id !== id); return d; });
  }, [update]);

  // ---------- journal ----------
  const saveJournal = useCallback((day, mood, text) => {
    const existed = (dataRef.current.journal || []).some((j) => j.date === day);
    update((d) => {
      d.journal = d.journal || [];
      const i = d.journal.findIndex((j) => j.date === day);
      if (i >= 0) d.journal[i] = { ...d.journal[i], mood, text, updatedAt: new Date().toISOString() };
      else d.journal.push({ id: uuid(), date: day, mood, text, createdAt: new Date().toISOString() });
      return d;
    });
    if (!existed) addXp(XP_RULES.journal);
  }, [update, addXp]);

  const deleteJournal = useCallback((id) => {
    update((d) => { d.journal = (d.journal || []).filter((j) => j.id !== id); return d; });
  }, [update]);

  // ---------- expenses ----------
  const addExpense = useCallback((entry) => {
    update((d) => {
      d.expenses = [{ id: uuid(), createdAt: new Date().toISOString(), ...entry }, ...(d.expenses || [])];
      return d;
    });
  }, [update]);

  const deleteExpense = useCallback((id) => {
    update((d) => { d.expenses = (d.expenses || []).filter((e) => e.id !== id); return d; });
  }, [update]);

  // ---------- body log ----------
  const addBodyEntry = useCallback((entry) => {
    update((d) => {
      d.bodyLog = [...(d.bodyLog || []), { id: uuid(), ...entry }].sort((a, b) => a.date.localeCompare(b.date));
      return d;
    });
  }, [update]);

  const deleteBodyEntry = useCallback((id) => {
    update((d) => { d.bodyLog = (d.bodyLog || []).filter((e) => e.id !== id); return d; });
  }, [update]);

  // ---------- task templates ----------
  const addTemplate = useCallback((tpl) => {
    update((d) => {
      d.templates = [...(d.templates || []), { id: uuid(), builtin: false, ...tpl }];
      return d;
    });
  }, [update]);

  const deleteTemplate = useCallback((id) => {
    update((d) => { d.templates = (d.templates || []).filter((x) => x.id !== id); return d; });
  }, [update]);

  const applyTemplate = useCallback((section, titles) => {
    update((d) => {
      const now = new Date().toISOString();
      const items = titles.map((title) => ({
        id: uuid(), title, description: '', priority: 'medium', dueDate: todayKey(), tags: [],
        estimatedTime: '', actualTime: '', notes: '', status: 'todo', done: false, archived: false,
        createdAt: now, completedAt: null,
      }));
      d.tasks[section] = [...items, ...(d.tasks[section] || [])];
      return d;
    });
  }, [update]);

  // ---------- eat the frog ----------
  const setFrog = useCallback((taskId, section) => {
    update((d) => {
      d.frog = { date: todayKey(), taskId, section };
      return d;
    });
  }, [update]);

  // ---------- data management ----------
  const importData = useCallback((json) => {
    const merged = { ...defaultData(), ...json };
    setData(merged);
  }, []);

  const resetSection = useCallback((section) => {
    update((d) => {
      if (section === 'gym') { d.tasks.gym = []; d.gymProgram = []; }
      else if (section === 'programming') d.tasks.programming = [];
      else if (section === 'german') { d.tasks.german = []; d.flashcards = []; }
      else if (section === 'gaming') { d.tasks.gaming = []; d.games = []; }
      else if (section === 'habits') d.habits = defaultHabits();
      else if (section === 'calendar') d.calendar = [];
      else if (section === 'pomodoro') d.pomodoro.history = [];
      else if (section === 'journal') d.journal = [];
      else if (section === 'budget') d.expenses = [];
      return d;
    });
  }, [update]);

  const resetAll = useCallback(() => {
    const fresh = defaultData();
    fresh.settings.onboarded = true;
    setData(fresh);
  }, []);

  const setLastSync = useCallback((iso) => {
    update((d) => { d.lastSync = iso; return d; });
  }, [update]);

  // ---------- derived ----------
  const derived = useMemo(() => {
    const sections = ['gym', 'programming', 'german', 'gaming', 'custom'];
    const all = sections.flatMap((s) => (data.tasks[s] || []).map((t) => ({ ...t, section: s })));
    const active = all.filter((t) => !t.archived);
    const daily = (data.dailyTasks || []).filter((t) => t.date === today);
    const dailyCompleted = daily.filter((t) => t.done && (t.completedAt ? isoDay(t.completedAt) === today : true));
    const completedToday = [...all.filter((t) => t.completedAt && isoDay(t.completedAt) === today), ...dailyCompleted];
    const dueToday = [...active.filter((t) => !t.done && t.dueDate === today), ...daily.filter((t) => !t.done)];
    const overdue = active.filter((t) => !t.done && t.dueDate && t.dueDate < today);
    const todayTasks = [...active.filter((t) => t.dueDate === today || (!t.done && !t.dueDate && isoDay(t.createdAt) === today) || (t.completedAt && isoDay(t.completedAt) === today)), ...daily];
    const pomodorosToday = data.pomodoro.history.filter((h) => h.endedAt && isoDay(h.endedAt) === today && h.phase === 'work');
    return { allTasks: all, activeTasks: active, completedToday, dueToday, overdue, todayTasks, pomodorosToday };
  }, [data, today]);

  const value = {
    data, setData, today,
    searchOpen, setSearchOpen, quickAddOpen, setQuickAddOpen,
    notesOpen, setNotesOpen,
    levelUpFlash, setLevelUpFlash, addXp,
    updateSettings,
    addDailyTask, updateDailyTask, deleteDailyTask, toggleDailyTask, addGameToToday, updateTodayGameActivity, startDailyTimer, stopDailyTimer,
    addTask, updateTask, toggleTask, deleteTask, bulkTasks, reorderTasks, addCustomTag,
    setGymProgram,
    addHabit, updateHabit, deleteHabit, toggleHabit, setWater,
    addEvent, updateEvent, deleteEvent,
    addCard, updateCard, deleteCard, reviewCard,
    updateGerman, setGermanUnitDone, addGermanStudy, addGermanTestResult,
    addGame, updateGame, deleteGame,
    updatePomodoroSettings, addPomodoroHistory,
    addNote, updateNote, deleteNote,
    saveJournal, deleteJournal,
    addExpense, deleteExpense,
    addBodyEntry, deleteBodyEntry,
    addTemplate, deleteTemplate, applyTemplate,
    setFrog,
    importData, resetSection, resetAll, setLastSync,
    ...derived,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
