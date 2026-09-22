// Thin CRUD layer over AppContext for the Programming module.
// All mutations go through the existing `update()` flow so localStorage +
// cloud sync keep working unchanged.
import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import {
  newTechnology, newMilestone, newProject, newActivity,
} from '../data/programming/model';

export function useProgramming() {
  const { data, update } = useApp();
  const prog = data.programming || {};

  const mutate = useCallback((fn) => update((d) => {
    d.programming = d.programming || {};
    fn(d.programming);
    return d;
  }), [update]);

  // ---------- technologies ----------
  const addTechnology = useCallback((p) => {
    const t = newTechnology(p);
    mutate((pg) => { pg.technologies = [t, ...(pg.technologies || [])]; });
    return t;
  }, [mutate]);

  const updateTechnology = useCallback((id, patch) => {
    mutate((pg) => {
      pg.technologies = (pg.technologies || []).map((t) => (t.id === id ? { ...t, ...patch } : t));
    });
  }, [mutate]);

  const deleteTechnology = useCallback((id) => {
    mutate((pg) => {
      pg.technologies = (pg.technologies || []).filter((t) => t.id !== id);
      pg.projects = (pg.projects || []).map((pr) => ({
        ...pr, techIds: (pr.techIds || []).filter((x) => x !== id),
      }));
      pg.activities = (pg.activities || []).map((a) => (a.technologyId === id ? { ...a, technologyId: '' } : a));
    });
  }, [mutate]);

  const addMilestone = useCallback((techId, title) => {
    if (!title?.trim()) return;
    mutate((pg) => {
      pg.technologies = (pg.technologies || []).map((t) =>
        t.id === techId ? { ...t, milestones: [...(t.milestones || []), newMilestone(title.trim())] } : t);
    });
  }, [mutate]);

  const toggleMilestone = useCallback((techId, msId) => {
    mutate((pg) => {
      pg.technologies = (pg.technologies || []).map((t) => {
        if (t.id !== techId) return t;
        return {
          ...t,
          milestones: (t.milestones || []).map((m) => (m.id === msId ? { ...m, done: !m.done } : m)),
        };
      });
    });
  }, [mutate]);

  const deleteMilestone = useCallback((techId, msId) => {
    mutate((pg) => {
      pg.technologies = (pg.technologies || []).map((t) =>
        t.id === techId ? { ...t, milestones: (t.milestones || []).filter((m) => m.id !== msId) } : t);
    });
  }, [mutate]);

  // ---------- projects ----------
  const addProject = useCallback((p) => {
    const pr = newProject(p);
    mutate((pg) => { pg.projects = [pr, ...(pg.projects || [])]; });
    return pr;
  }, [mutate]);

  const updateProject = useCallback((id, patch) => {
    mutate((pg) => {
      pg.projects = (pg.projects || []).map((p) => (p.id === id ? { ...p, ...patch } : p));
    });
  }, [mutate]);

  const deleteProject = useCallback((id) => {
    mutate((pg) => {
      pg.projects = (pg.projects || []).filter((p) => p.id !== id);
      pg.activities = (pg.activities || []).map((a) => (a.projectId === id ? { ...a, projectId: '' } : a));
    });
  }, [mutate]);

  // ---------- activities ----------
  const addActivity = useCallback((p) => {
    const a = newActivity(p);
    mutate((pg) => { pg.activities = [a, ...(pg.activities || [])]; });
    return a;
  }, [mutate]);

  const updateActivity = useCallback((id, patch) => {
    mutate((pg) => {
      pg.activities = (pg.activities || []).map((a) => (a.id === id ? { ...a, ...patch } : a));
    });
  }, [mutate]);

  const deleteActivity = useCallback((id) => {
    mutate((pg) => { pg.activities = (pg.activities || []).filter((a) => a.id !== id); });
  }, [mutate]);

  // ---------- goal tree ----------
  const setGoalEntry = useCallback((skillId, patch) => {
    mutate((pg) => {
      pg.goalEntries = { ...(pg.goalEntries || {}) };
      const cur = pg.goalEntries[skillId] || {};
      pg.goalEntries[skillId] = { ...cur, ...patch };
    });
  }, [mutate]);

  const removeGoalEntry = useCallback((skillId) => {
    mutate((pg) => {
      pg.goalEntries = { ...(pg.goalEntries || {}) };
      delete pg.goalEntries[skillId];
      pg.goalOrder = (pg.goalOrder || []).filter((x) => x !== skillId);
    });
  }, [mutate]);

  const addToGoal = useCallback((skillId, patch = {}) => {
    mutate((pg) => {
      pg.goalEntries = { ...(pg.goalEntries || {}) };
      if (!pg.goalEntries[skillId]) pg.goalEntries[skillId] = { status: 'todo', ...patch };
      pg.goalOrder = (pg.goalOrder || []).includes(skillId)
        ? pg.goalOrder
        : [...(pg.goalOrder || []), skillId];
    });
  }, [mutate]);

  const reorderGoal = useCallback((skillId, dir) => {
    mutate((pg) => {
      const arr = (pg.goalOrder || []).filter((x) => x !== skillId);
      const cur = (pg.goalOrder || []).indexOf(skillId);
      const target = dir === 'up' ? Math.max(0, cur - 1) : cur + 1;
      arr.splice(target < 0 ? arr.length : target, 0, skillId);
      pg.goalOrder = arr;
    });
  }, [mutate]);

  // ---------- timer (lightweight; only start timestamp is stored) ----------
  const startTimer = useCallback((payload) => {
    mutate((pg) => {
      pg.timer = { ...payload, startedAt: new Date().toISOString(), accumulated: pg.timer?.accumulated || 0 };
    });
  }, [mutate]);

  const stopTimer = useCallback(() => {
    let minutes = 0;
    mutate((pg) => {
      const t = pg.timer;
      if (!t) return;
      const elapsed = Math.max(0, Math.floor((Date.now() - new Date(t.startedAt).getTime()) / 60000));
      minutes = elapsed + (t.accumulated || 0);
      pg.timer = null;
    });
    return minutes;
  }, [mutate]);

  const cancelTimer = useCallback(() => mutate((pg) => { pg.timer = null; }), [mutate]);
  const tickTimer = useCallback(() => mutate((pg) => {
    if (!pg.timer) return;
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(pg.timer.startedAt).getTime()) / 60000));
    pg.timer.elapsedMinutes = elapsed + (pg.timer.accumulated || 0);
  }), [mutate]);

  return {
    technologies: prog.technologies || [],
    projects: prog.projects || [],
    activities: prog.activities || [],
    goalEntries: prog.goalEntries || {},
    goalOrder: prog.goalOrder || [],
    timer: prog.timer || null,
    addTechnology, updateTechnology, deleteTechnology,
    addMilestone, toggleMilestone, deleteMilestone,
    addProject, updateProject, deleteProject,
    addActivity, updateActivity, deleteActivity,
    setGoalEntry, removeGoalEntry, addToGoal, reorderGoal,
    startTimer, stopTimer, cancelTimer, tickTimer,
  };
}
