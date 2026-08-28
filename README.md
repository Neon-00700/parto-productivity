# پرتو | Parto — Personal Productivity App

A complete, offline-first, bilingual (فارسی / English) productivity PWA built with **React 18 + Vite + Tailwind CSS**.

## ✨ Features

- **📊 Dashboard** — daily goal progress, weekly chart (recharts), section pie chart, mini habits, mini pomodoro, next events, overdue banner, 50+ bilingual quotes, confetti on goal 🎉
- **🏋️ Gym** — workout to-dos (sets/reps/weight/day) + **Excel/CSV program upload** (SheetJS, auto column detection incl. Persian headers, inline cell editing, grouped by day)
- **💻 Programming** — full to-do: priority, due date, tags (+custom), estimates, bulk actions, archive, drag-reorder, undo-delete toast, overdue highlighting
- **🇩🇪 German** — study tasks + **flashcards with spaced repetition** (Easy 3d / Medium 1d / Hard 1h), A1–C1 levels, mastery tracking
- **🎮 Gaming** — library with platform/genre/status/5-star rating/hours/cover
- **✅ Habits** — 8 default bilingual habits, custom habits (emoji + color), **visual water tracker**, streaks & records, GitHub-style week/month grids, stats charts, auto day-reset, celebration burst
- **📅 Calendar** — month/week/day views, **Jalali calendar in Persian**, repeats, reminders, 6 color tags, all-day events, upcoming sidebar
- **🍅 Pomodoro** — presets (Classic/Deep Work/Sprint/Custom), SVG progress ring, **fullscreen focus mode** with breathing animation, WebAudio chime, browser notifications, task linking, history — timer lives in context so it survives navigation
- **📈 Reports** — range selector, line/bar/pie/area charts, streak leaderboard, most productive hour, JSON export, print-friendly
- **⚙️ Settings** — profile, 5 themes, dark mode (default on), fa/en toggle with RTL/LTR, Supabase sync, backup import/export, per-section & full reset

Plus: PWA (manifest + service worker), global search (Ctrl+F), shortcuts (Ctrl+N/P/D/F), toast notifications, error boundaries, onboarding, 9 PM daily summary notification.

## 🆕 v1.1 — Offline feature pack

- **🏅 Gamification** — XP for every task/habit/pomodoro/flashcard/journal, levels & titles, 15 achievement badges, level-up confetti, XP bar in sidebar & dashboard
- **🐸 Eat the Frog** — pin the day's most important task on the dashboard
- **🔁 Recurring tasks** — daily/weekly tasks auto-respawn on completion
- **📋 Task templates** — 4 built-in bilingual routines + create your own
- **🧭 Eisenhower matrix** — list/matrix view toggle in every task section
- **📝 Quick notes** — sticky-notes slide-over panel (feather icon in header)
- **📖 Journal + mood tracker** — daily entry with 5 moods, 30-day mood chart
- **💰 Budget** — expenses/income with 8 categories, month navigation (Jalali aware), pie chart
- **⚖️ Body tracker** — weight/measurements log with chart + Epley 1RM calculator (Gym → Body tab)
- **⏲️ Rest timer** — 30s–3m between-sets countdown with chime (Gym tasks)
- **🔊 German pronunciation** — Web Speech API on all flashcards, review & quiz
- **❓ Flashcard quiz** — 4-choice quiz with scoring and XP
- **📥 Bulk vocab import** — xlsx/csv word lists (Persian headers supported, UTF-8 safe)
- **🎧 Ambient sounds** — rain / café / white noise synthesized offline with WebAudio
- **🟦 Year in Pixels** — 365-day productivity heatmap in Reports
- **🥇 Personal records** — best day, most pomodoros, longest focus…
- **⌨️ Command palette** — Ctrl+K (or Ctrl+F): commands + global search in one
- **📏 Compact mode** — denser UI toggle in Settings


## 🚀 Run

```bash
npm install
npm run dev      # development
npm run build    # production build → dist/
```

## ☁️ Supabase cloud sync (optional)

1. Create a free project at supabase.com
2. Run the SQL below in the **SQL Editor** (also shown inside Settings → Cloud):

```sql
CREATE TABLE IF NOT EXISTS user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  tasks JSONB DEFAULT '{}',
  daily_tasks JSONB DEFAULT '[]',
  gym_program JSONB DEFAULT '[]',
  habits JSONB DEFAULT '[]',
  calendar_events JSONB DEFAULT '[]',
  pomodoro_history JSONB DEFAULT '[]',
  pomodoro_settings JSONB DEFAULT '{}',
  flashcards JSONB DEFAULT '[]',
  games JSONB DEFAULT '[]',
  app_settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON user_data
  FOR ALL USING (true) WITH CHECK (true);
```

3. Paste your **Project URL** and **anon key** in Settings → Cloud, then Test / Sync / Load.
   Data is LZW-compressed before upload. Push = local wins, Load = cloud wins.

## 🧪 Sample data

`sample-workout-program.xlsx` at the project root is a ready-made file to test the Gym → Excel upload tab.


## 🔐 Security

- Do **not** commit `.env` files, API keys, passwords, private keys, database dumps, or real personal data.
- Supabase credentials are entered locally through **Settings → Cloud** and are not required to run the app.
- If you enable the optional Supabase sync, review the database Row Level Security (RLS) policy before using it with sensitive data. The sample policy in this project is intentionally simple and is **not suitable for multi-user or sensitive production data**.

## 🏗️ Architecture

```
src/
├── components/   Layout, Dashboard, Gym, Programming, German, Gaming,
│                 Habits, Calendar, Pomodoro, Reports, Settings, Common
├── contexts/     AppContext (data + localStorage), Theme, Language, Pomodoro
├── hooks/        useLocalStorage, useTranslation, useTheme, usePomodoro, useHabits, useSupabase
├── utils/        dateUtils (Jalali aware), storageUtils (safe LS + LZW), supabaseClient, excelParser, sound
├── translations/ fa.js · en.js
├── themes/       5 themes via CSS variables
└── data/         quotes.js (53 bilingual) · defaultHabits.js
```
