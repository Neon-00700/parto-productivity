import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './contexts/AppContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PomodoroProvider } from './contexts/PomodoroContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import GymPage from './components/Gym/og/GymPage';
import ProgrammingPage from './components/Programming/ProgrammingPage';
import GermanPage from './components/German/GermanPage';
import GamingPage from './components/Gaming/GamingPage';
import HabitsPage from './components/Habits/HabitsPage';
import CalendarPage from './components/Calendar/CalendarPage';
import PomodoroPage from './components/Pomodoro/PomodoroPage';
import JournalPage from './components/Journal/JournalPage';
import BudgetPage from './components/Budget/BudgetPage';
import ReportsPage from './components/Reports/ReportsPage';
import SettingsPage from './components/Settings/SettingsPage';
import DailyTasksPage from './components/DailyTasksPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <LanguageProvider>
          <ThemeProvider>
            <PomodoroProvider>
              <HashRouter>
                <Toaster
                  position="bottom-center"
                  toastOptions={{
                    className: '!bg-slate-800 !text-white !rounded-xl !text-sm dark:!bg-slate-700',
                    duration: 2500,
                  }}
                />
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/today" element={<DailyTasksPage />} />
                    <Route path="/gym" element={<GymPage />} />
                    <Route path="/programming" element={<ProgrammingPage />} />
                    <Route path="/german" element={<GermanPage />} />
                    <Route path="/gaming" element={<GamingPage />} />
                    <Route path="/habits" element={<HabitsPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/pomodoro" element={<PomodoroPage />} />
                    <Route path="/journal" element={<JournalPage />} />
                    <Route path="/budget" element={<BudgetPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Dashboard />} />
                  </Route>
                </Routes>
              </HashRouter>
            </PomodoroProvider>
          </ThemeProvider>
        </LanguageProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
