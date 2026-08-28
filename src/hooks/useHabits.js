import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { dateKey, addDays, todayKey, lastNDays } from '../utils/dateUtils';

export function habitDoneOn(habit, key) {
  const v = habit.history?.[key];
  if (habit.type === 'water') return (v || 0) >= (habit.target || 8);
  return !!v;
}

export function habitStreak(habit, endDate = new Date()) {
  let streak = 0;
  let d = new Date(endDate);
  // today may still be in progress: start from today if done, else from yesterday
  if (!habitDoneOn(habit, dateKey(d))) d = addDays(d, -1);
  while (habitDoneOn(habit, dateKey(d))) {
    streak++;
    d = addDays(d, -1);
  }
  return streak;
}

export function habitLongestStreak(habit) {
  const keys = Object.keys(habit.history || {}).filter((k) => habitDoneOn(habit, k)).sort();
  let best = 0;
  let cur = 0;
  let prev = null;
  for (const k of keys) {
    if (prev) {
      const diff = (new Date(k) - new Date(prev)) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
    } else cur = 1;
    best = Math.max(best, cur);
    prev = k;
  }
  return best;
}

export function habitRate(habit, days) {
  const keys = lastNDays(days).map(dateKey);
  const done = keys.filter((k) => habitDoneOn(habit, k)).length;
  return Math.round((done / days) * 100);
}

export function useHabits() {
  const { data, toggleHabit, setWater, addHabit, updateHabit, deleteHabit, today } = useApp();
  const habits = data.habits;

  const stats = useMemo(() => {
    const tk = todayKey();
    const doneToday = habits.filter((h) => habitDoneOn(h, tk)).length;
    const allDone = habits.length > 0 && doneToday === habits.length;
    const withStreaks = habits.map((h) => ({
      habit: h,
      streak: habitStreak(h),
      longest: habitLongestStreak(h),
      weekRate: habitRate(h, 7),
      monthRate: habitRate(h, 30),
    }));
    return { doneToday, total: habits.length, allDone, withStreaks };
  }, [habits, today]);

  return { habits, stats, toggleHabit, setWater, addHabit, updateHabit, deleteHabit };
}
