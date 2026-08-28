// XP, levels and badge definitions (bilingual, offline)
export const XP_RULES = {
  task: 10,
  habit: 5,
  pomodoro: 15,
  flashcard: 2,
  journal: 5,
  quizCorrect: 3,
};

export function levelOf(xp) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}

export function xpForLevel(level) {
  return Math.pow(level - 1, 2) * 100;
}

export function levelProgress(xp) {
  const lvl = levelOf(xp);
  const cur = xpForLevel(lvl);
  const next = xpForLevel(lvl + 1);
  return { level: lvl, current: xp - cur, needed: next - cur, pct: Math.min(100, Math.round(((xp - cur) / (next - cur)) * 100)) };
}

export const LEVEL_TITLES = [
  { min: 1, fa: 'تازه‌کار', en: 'Beginner', icon: '🌱' },
  { min: 3, fa: 'کوشا', en: 'Achiever', icon: '⚡' },
  { min: 5, fa: 'حرفه‌ای', en: 'Pro', icon: '🚀' },
  { min: 8, fa: 'استاد', en: 'Master', icon: '🏆' },
  { min: 12, fa: 'افسانه', en: 'Legend', icon: '👑' },
];

export function titleOf(level) {
  return [...LEVEL_TITLES].reverse().find((t) => level >= t.min) || LEVEL_TITLES[0];
}

// badge conditions receive a stats object computed in useGamification
export const BADGES = [
  { id: 'first-task', icon: '✅', fa: 'اولین قدم', en: 'First Step', dfa: 'اولین کار را انجام دادید', den: 'Complete your first task', check: (s) => s.tasksCompleted >= 1 },
  { id: 'task-25', icon: '📋', fa: 'کاربلد', en: 'Task Tamer', dfa: '۲۵ کار انجام شده', den: 'Complete 25 tasks', check: (s) => s.tasksCompleted >= 25 },
  { id: 'task-100', icon: '💯', fa: 'صدتایی', en: 'Century', dfa: '۱۰۰ کار انجام شده', den: 'Complete 100 tasks', check: (s) => s.tasksCompleted >= 100 },
  { id: 'pomo-1', icon: '🍅', fa: 'اولین تمرکز', en: 'First Focus', dfa: 'اولین پومودورو', den: 'Finish your first Pomodoro', check: (s) => s.pomodoros >= 1 },
  { id: 'pomo-50', icon: '🔥', fa: 'ماشین تمرکز', en: 'Focus Machine', dfa: '۵۰ جلسه پومودورو', den: 'Finish 50 Pomodoros', check: (s) => s.pomodoros >= 50 },
  { id: 'focus-24h', icon: '⏰', fa: 'یک شبانه‌روز', en: 'Full Day', dfa: '۲۴ ساعت تمرکز مجموع', den: '24 hours of total focus', check: (s) => s.focusMinutes >= 1440 },
  { id: 'streak-7', icon: '📅', fa: 'یک هفته', en: 'One Week', dfa: 'زنجیره ۷ روزه عادت', den: '7-day habit streak', check: (s) => s.bestStreak >= 7 },
  { id: 'streak-30', icon: '🗓️', fa: 'یک ماه', en: 'One Month', dfa: 'زنجیره ۳۰ روزه عادت', den: '30-day habit streak', check: (s) => s.bestStreak >= 30 },
  { id: 'cards-100', icon: '🇩🇪', fa: 'واژه‌باز', en: 'Wortschatz', dfa: '۱۰۰ مرور فلش‌کارت', den: '100 flashcard reviews', check: (s) => s.cardReviews >= 100 },
  { id: 'journal-7', icon: '📖', fa: 'خاطره‌نویس', en: 'Journaler', dfa: '۷ روز ژورنال', den: 'Write 7 journal entries', check: (s) => s.journalEntries >= 7 },
  { id: 'budget-10', icon: '💰', fa: 'حسابدار', en: 'Bookkeeper', dfa: '۱۰ تراکنش ثبت شده', den: 'Track 10 transactions', check: (s) => s.expenseEntries >= 10 },
  { id: 'level-5', icon: '🚀', fa: 'سطح ۵', en: 'Level 5', dfa: 'رسیدن به سطح ۵', den: 'Reach level 5', check: (s) => s.level >= 5 },
  { id: 'level-10', icon: '👑', fa: 'سطح ۱۰', en: 'Level 10', dfa: 'رسیدن به سطح ۱۰', den: 'Reach level 10', check: (s) => s.level >= 10 },
  { id: 'goal-day', icon: '🎯', fa: 'هدف‌زن', en: 'Goal Getter', dfa: 'رسیدن به هدف روزانه', den: 'Reach your daily goal', check: (s) => s.bestDayTasks >= s.dailyGoal },
  { id: 'weight-5', icon: '⚖️', fa: 'پایش بدن', en: 'Body Aware', dfa: '۵ ثبت وزن', den: 'Log body weight 5 times', check: (s) => s.bodyEntries >= 5 },
];

// default task templates (bilingual)
export const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-morning', builtin: true, section: 'custom',
    name: { fa: '🌅 روتین صبح', en: '🌅 Morning routine' },
    tasks: [
      { fa: 'نوشیدن یک لیوان آب', en: 'Drink a glass of water' },
      { fa: '۱۰ دقیقه حرکات کششی', en: '10 min stretching' },
      { fa: 'مرور برنامه روز', en: 'Review today’s plan' },
      { fa: 'صبحانه سالم', en: 'Healthy breakfast' },
    ],
  },
  {
    id: 'tpl-study', builtin: true, section: 'german',
    name: { fa: '📚 جلسه مطالعه آلمانی', en: '📚 German study session' },
    tasks: [
      { fa: 'مرور فلش‌کارت‌ها', en: 'Review flashcards' },
      { fa: '۲۰ دقیقه شنیداری', en: '20 min listening' },
      { fa: 'یادگیری ۱۰ کلمه جدید', en: 'Learn 10 new words' },
      { fa: 'یک تمرین گرامر', en: 'One grammar exercise' },
    ],
  },
  {
    id: 'tpl-code', builtin: true, section: 'programming',
    name: { fa: '💻 روز کدنویسی', en: '💻 Coding day' },
    tasks: [
      { fa: 'مرور کدهای دیروز', en: 'Review yesterday’s code' },
      { fa: 'حل یک چالش الگوریتمی', en: 'Solve one algorithm challenge' },
      { fa: '۱ ساعت روی پروژه اصلی', en: '1 hour on main project' },
      { fa: 'خواندن یک مقاله فنی', en: 'Read one tech article' },
    ],
  },
  {
    id: 'tpl-gym', builtin: true, section: 'gym',
    name: { fa: '🏋️ روز باشگاه', en: '🏋️ Gym day' },
    tasks: [
      { fa: 'گرم کردن ۱۰ دقیقه', en: '10 min warm-up' },
      { fa: 'تمرین اصلی طبق برنامه', en: 'Main workout per program' },
      { fa: 'سرد کردن و کشش', en: 'Cool-down & stretch' },
      { fa: 'شیک پروتئین', en: 'Protein shake' },
    ],
  },
];

// budget categories (bilingual)
export const EXPENSE_CATEGORIES = [
  { id: 'food', icon: '🍔', fa: 'خوراک', en: 'Food', color: '#f97316' },
  { id: 'transport', icon: '🚌', fa: 'حمل‌ونقل', en: 'Transport', color: '#0ea5e9' },
  { id: 'shopping', icon: '🛍️', fa: 'خرید', en: 'Shopping', color: '#ec4899' },
  { id: 'bills', icon: '🧾', fa: 'قبض‌ها', en: 'Bills', color: '#eab308' },
  { id: 'fun', icon: '🎮', fa: 'تفریح', en: 'Fun', color: '#8b5cf6' },
  { id: 'health', icon: '💊', fa: 'سلامت', en: 'Health', color: '#10b981' },
  { id: 'education', icon: '🎓', fa: 'آموزش', en: 'Education', color: '#6366f1' },
  { id: 'other', icon: '📦', fa: 'سایر', en: 'Other', color: '#64748b' },
];

export const MOODS = [
  { id: 1, icon: '😞', fa: 'خیلی بد', en: 'Awful', color: '#ef4444' },
  { id: 2, icon: '🙁', fa: 'بد', en: 'Bad', color: '#f97316' },
  { id: 3, icon: '😐', fa: 'معمولی', en: 'Okay', color: '#eab308' },
  { id: 4, icon: '🙂', fa: 'خوب', en: 'Good', color: '#22c55e' },
  { id: 5, icon: '😄', fa: 'عالی', en: 'Great', color: '#10b981' },
];
