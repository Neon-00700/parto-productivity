// Thin CRUD layer over AppContext for the University module.
// All mutations go through the existing `update()` flow so localStorage +
// cloud sync keep working unchanged.
import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { newCourse, newClass, newExam, newAssignment } from '../data/university/model';

export function useUniversity() {
  const { data, update } = useApp();
  const uni = data.university || {};

  const mutate = useCallback((fn) => update((d) => {
    d.university = d.university || {};
    fn(d.university);
    return d;
  }), [update]);

  // ---------- courses ----------
  const addCourse = useCallback((p) => {
    const c = newCourse(p);
    mutate((u) => { u.courses = [c, ...(u.courses || [])]; });
    return c;
  }, [mutate]);

  const updateCourse = useCallback((id, patch) => {
    mutate((u) => { u.courses = (u.courses || []).map((c) => (c.id === id ? { ...c, ...patch } : c)); });
  }, [mutate]);

  const deleteCourse = useCallback((id) => {
    mutate((u) => {
      u.courses = (u.courses || []).filter((c) => c.id !== id);
      u.classes = (u.classes || []).filter((c) => c.courseId !== id);
      u.exams = (u.exams || []).filter((e) => e.courseId !== id);
      u.assignments = (u.assignments || []).filter((a) => a.courseId !== id);
    });
  }, [mutate]);

  // ---------- classes ----------
  const addClass = useCallback((p) => {
    const c = newClass(p);
    mutate((u) => { u.classes = [...(u.classes || []), c]; });
    return c;
  }, [mutate]);

  const updateClass = useCallback((id, patch) => {
    mutate((u) => { u.classes = (u.classes || []).map((c) => (c.id === id ? { ...c, ...patch } : c)); });
  }, [mutate]);

  const deleteClass = useCallback((id) => {
    mutate((u) => { u.classes = (u.classes || []).filter((c) => c.id !== id); });
  }, [mutate]);

  // ---------- exams ----------
  const addExam = useCallback((p) => {
    const e = newExam(p);
    mutate((u) => { u.exams = [...(u.exams || []), e]; });
    return e;
  }, [mutate]);

  const updateExam = useCallback((id, patch) => {
    mutate((u) => { u.exams = (u.exams || []).map((e) => (e.id === id ? { ...e, ...patch } : e)); });
  }, [mutate]);

  const deleteExam = useCallback((id) => {
    mutate((u) => { u.exams = (u.exams || []).filter((e) => e.id !== id); });
  }, [mutate]);

  // ---------- assignments ----------
  const addAssignment = useCallback((p) => {
    const a = newAssignment(p);
    mutate((u) => { u.assignments = [...(u.assignments || []), a]; });
    return a;
  }, [mutate]);

  const updateAssignment = useCallback((id, patch) => {
    mutate((u) => { u.assignments = (u.assignments || []).map((a) => (a.id === id ? { ...a, ...patch } : a)); });
  }, [mutate]);

  const deleteAssignment = useCallback((id) => {
    mutate((u) => { u.assignments = (u.assignments || []).filter((a) => a.id !== id); });
  }, [mutate]);

  // ---------- reference week ----------
  const setReferenceWeek = useCallback((patch) => {
    mutate((u) => { u.reference = { ...u.reference, ...patch }; });
  }, [mutate]);

  return {
    courses: uni.courses || [],
    classes: uni.classes || [],
    exams: uni.exams || [],
    assignments: uni.assignments || [],
    reference: uni.reference || {},
    addCourse, updateCourse, deleteCourse,
    addClass, updateClass, deleteClass,
    addExam, updateExam, deleteExam,
    addAssignment, updateAssignment, deleteAssignment,
    setReferenceWeek,
  };
}
