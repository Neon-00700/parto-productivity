// Thin CRUD layer over AppContext for the German module.
// All mutations go through the existing update() flow so localStorage +
// cloud sync keep working unchanged. Shape is database-ready.
import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { useApp } from '../contexts/AppContext';
import { GERMAN_LEVELS } from '../data/german/model.js';

export function useGerman() {
  const { data, update } = useApp();
  const g = data.german || {};

  const mutate = useCallback((fn) => update((d) => {
    d.german = d.german || {};
    fn(d.german);
    return d;
  }), [update]);

  // ---------- goal ----------
  const setGoal = useCallback((patch) => {
    mutate((u) => { u.goal = { ...(u.goal || {}), ...patch }; });
  }, [mutate]);

  // ---------- reviews (grammar + vocabulary share the SRS state) ----------
  // state shape: { [kind:topicId]: { status, due, streak, last } }
  const recordReview = useCallback((kind, itemId, grade) => {
    mutate((u) => {
      u.reviews = u.reviews || {};
      const prev = u.reviews[`${kind}:${itemId}`] || { status: 'new', due: new Date().toISOString().slice(0, 10), streak: 0, last: null };
      const streak = grade === 'again' ? 0 : (prev.streak || 0) + 1;
      const days = grade === 'again' ? 0 : grade === 'hard' ? 1 : grade === 'good' ? 3 : 7;
      const due = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
      u.reviews[`${kind}:${itemId}`] = {
        status: days >= 7 ? 'mastered' : days >= 3 ? 'review' : streak > 0 ? 'learning' : 'learning',
        due, streak, last: new Date().toISOString().slice(0, 10),
      };
    });
  }, [mutate]);

  const resetReview = useCallback((kind, itemId) => {
    mutate((u) => {
      u.reviews = u.reviews || {};
      delete u.reviews[`${kind}:${itemId}`];
    });
  }, [mutate]);

  // ---------- level tests ----------
  const addTestAttempt = useCallback((attempt) => {
    const a = {
      id: uuid(),
      level: attempt.level,
      date: new Date().toISOString().slice(0, 10),
      correct: attempt.correct,
      total: attempt.total,
      percent: attempt.percent,
      passed: attempt.passed,
      createdAt: new Date().toISOString(),
    };
    mutate((u) => {
      u.testAttempts = [a, ...(u.testAttempts || [])];
      u.lastTestDate = a.date; // enforces one test per day
    });
    return a;
  }, [mutate]);

  // ---------- activities ----------
  const addActivity = useCallback((p) => {
    const a = {
      id: uuid(),
      type: p.type || 'selfStudy',
      date: p.date || new Date().toISOString().slice(0, 10),
      duration: Number(p.duration) || 0,
      topic: p.topic || '',
      level: p.level || '',
      notes: p.notes || '',
      grammarTopicId: p.grammarTopicId || '',
      externalSource: p.externalSource || '',
      externalUrl: p.externalUrl || '',
      createdAt: new Date().toISOString(),
    };
    mutate((u) => { u.activities = [a, ...(u.activities || [])]; });
    return a;
  }, [mutate]);

  const updateActivity = useCallback((id, patch) => {
    mutate((u) => { u.activities = (u.activities || []).map((a) => (a.id === id ? { ...a, ...patch } : a)); });
  }, [mutate]);

  const deleteActivity = useCallback((id) => {
    mutate((u) => { u.activities = (u.activities || []).filter((a) => a.id !== id); });
  }, [mutate]);

  // ---------- custom vocabulary ----------
  const addCustomVocab = useCallback((p) => {
    const v = {
      id: uuid(),
      word: (p.word || '').trim(),
      persian: (p.persian || '').trim(),
      example: p.example || '',
      exampleFa: p.exampleFa || '',
      level: p.level || 'A1',
      topic: p.topic || 'شخصی',
      article: p.article || '',
      plural: p.plural || '',
      pos: p.pos || 'word',
      custom: true,
      createdAt: new Date().toISOString(),
    };
    mutate((u) => { u.customVocab = [v, ...(u.customVocab || [])]; });
    return v;
  }, [mutate]);

  const deleteCustomVocab = useCallback((id) => {
    mutate((u) => { u.customVocab = (u.customVocab || []).filter((v) => v.id !== id); });
  }, [mutate]);

  return {
    goal: g.goal || {},
    reviews: g.reviews || {},
    testAttempts: g.testAttempts || [],
    activities: g.activities || [],
    customVocab: g.customVocab || [],
    lastTestDate: g.lastTestDate || null,
    setGoal,
    recordReview,
    resetReview,
    addTestAttempt,
    addActivity, updateActivity, deleteActivity,
    addCustomVocab, deleteCustomVocab,
  };
}
