// Bilingual content constants: task templates, expense categories, moods.
// (Split out of the old gamification module so XP/level logic could be removed.)

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
