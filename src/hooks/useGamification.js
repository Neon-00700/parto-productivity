import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { habitLongestStreak } from './useHabits';
import { levelProgress, titleOf, BADGES } from '../utils/gamification';
import { isoDay } from '../utils/dateUtils';

export function useGamification() {
  const { data, allTasks } = useApp();
  const xp = data.gamification?.xp || 0;

  return useMemo(() => {
    const prog = levelProgress(xp);
    const title = titleOf(prog.level);

    const completed = allTasks.filter((t) => t.completedAt);
    const perDay = {};
    completed.forEach((t) => { const k = isoDay(t.completedAt); perDay[k] = (perDay[k] || 0) + 1; });
    const bestDayTasks = Math.max(0, ...Object.values(perDay));

    const work = data.pomodoro.history.filter((h) => h.phase === 'work');
    const stats = {
      level: prog.level,
      tasksCompleted: completed.length,
      pomodoros: work.length,
      focusMinutes: work.reduce((s, h) => s + (h.duration || 0), 0),
      bestStreak: Math.max(0, ...data.habits.map((h) => habitLongestStreak(h))),
      cardReviews: data.flashcards.reduce((s, c) => s + (c.reviews || 0), 0),
      journalEntries: (data.journal || []).length,
      expenseEntries: (data.expenses || []).length,
      bodyEntries: (data.bodyLog || []).length,
      bestDayTasks,
      dailyGoal: data.settings.dailyGoal || 10,
    };

    const badges = BADGES.map((b) => ({ ...b, earned: b.check(stats) }));
    return { xp, ...prog, title, stats, badges, earnedCount: badges.filter((b) => b.earned).length };
  }, [xp, data, allTasks]);
}
