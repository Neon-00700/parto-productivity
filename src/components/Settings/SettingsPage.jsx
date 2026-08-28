import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCopy, FiDownload, FiUpload, FiCloud, FiRefreshCw, FiCheckCircle, FiTrash2, FiZap } from 'react-icons/fi';
import Button from '../Common/Button';
import ConfirmDialog from '../Common/ConfirmDialog';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../hooks/useTheme';
import { useSupabase } from '../../hooks/useSupabase';
import { SETUP_SQL } from '../../utils/supabaseClient';
import { APP_VERSION, getDeviceId, setDeviceId } from '../../utils/storageUtils';
import { fmtDateTime, localizeDigits } from '../../utils/dateUtils';

const AVATARS = ['🙂', '😎', '🚀', '🦁', '🐼', '🌟', '🔥', '🎯', '🧠', '💪', '🌙', '⚡'];

function Section({ title, children }) {
  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-bold text-sm">{title}</h3>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { data, updateSettings, updatePomodoroSettings, importData, resetSection, resetAll } = useApp();
  const { t, lang, setLanguage } = useTranslation();
  const { themes, themeId, setTheme, darkMode, toggleDark } = useTheme();
  const { configured, status, testConnection, pushToCloud, loadFromCloud, lastSync } = useSupabase();
  const s = data.settings;
  const ps = data.pomodoro.settings;

  const fileRef = useRef(null);
  const [resetStep, setResetStep] = useState(0);
  const [confirmSection, setConfirmSection] = useState(null);
  const [syncCodeInput, setSyncCodeInput] = useState(getDeviceId());

  const handleNotifToggle = async (on) => {
    if (on && 'Notification' in window && Notification.permission === 'default') {
      const p = await Notification.requestPermission();
      if (p === 'denied') { toast.error(t('settings.notifDenied')); return; }
    }
    if (on && 'Notification' in window && Notification.permission === 'denied') {
      toast.error(t('settings.notifDenied'));
      return;
    }
    updateSettings({ notifications: on });
    if (on) toast.success(t('settings.notifGranted'));
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `parto-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importBackup = async (file) => {
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      if (!json || typeof json !== 'object' || !json.tasks) throw new Error('invalid');
      importData(json);
      toast.success(t('settings.importOk'));
    } catch (e) {
      console.warn(e);
      toast.error(t('settings.importFail'));
    }
  };

  const runTest = async () => {
    if (!configured) { toast.error(t('settings.configureFirst')); return; }
    const r = await testConnection();
    if (r.ok) toast.success(t('settings.connectionOk'));
    else toast.error(`${t('settings.connectionFail')}: ${r.error || ''}`);
  };
  const runPush = async () => {
    if (!configured) { toast.error(t('settings.configureFirst')); return; }
    const r = await pushToCloud();
    if (r.ok) toast.success(t('settings.syncOk'));
    else toast.error(`${t('settings.syncFail')}: ${r.error || ''}`);
  };
  const runLoad = async () => {
    if (!configured) { toast.error(t('settings.configureFirst')); return; }
    const r = await loadFromCloud();
    if (r.ok) toast.success(t('settings.loadOk'));
    else toast.error(`${t('settings.loadFail')}: ${r.error || ''}`);
  };

  const loading = status === 'loading';

  const applySyncCode = () => {
    const clean = syncCodeInput.trim();
    if (!clean) { toast.error(t('settings.syncCodeEmpty')); return; }
    if (setDeviceId(clean)) {
      toast.success(t('settings.syncCodeApplied'));
    } else {
      toast.error(t('settings.syncCodeEmpty'));
    }
  };
  const copySyncCode = () => {
    navigator.clipboard?.writeText(getDeviceId()).then(() => toast.success(t('settings.copied')));
  };

  return (
    <div className="max-w-3xl space-y-4">
      {/* profile */}
      <Section title={`👤 ${t('settings.profile')}`}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('settings.yourName')}</label>
            <input className="input" value={s.userName} onChange={(e) => updateSettings({ userName: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('settings.avatar')}</label>
            <div className="flex flex-wrap gap-1.5">
              {AVATARS.map((a) => (
                <button key={a} onClick={() => updateSettings({ avatar: a })}
                  className={`h-9 w-9 rounded-xl text-lg flex items-center justify-center transition-all ${s.avatar === a ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'bg-slate-100 dark:bg-slate-800 hover:scale-105'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* appearance */}
      <Section title={`🎨 ${t('settings.appearance')}`}>
        <div>
          <label className="label">{t('settings.language')}</label>
          <div className="flex gap-2">
            <button onClick={() => setLanguage('fa')} className={`btn ${lang === 'fa' ? 'btn-primary' : 'btn-ghost border border-slate-300 dark:border-slate-700'}`}>فارسی</button>
            <button onClick={() => setLanguage('en')} className={`btn ${lang === 'en' ? 'btn-primary' : 'btn-ghost border border-slate-300 dark:border-slate-700'}`}>English</button>
          </div>
        </div>
        <div>
          <label className="label">{t('settings.theme')}</label>
          <div className="flex flex-wrap gap-3">
            {Object.values(themes).map((th) => (
              <button key={th.id} onClick={() => setTheme(th.id)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all ${themeId === th.id ? 'border-primary bg-primary/10' : 'border-slate-200 dark:border-slate-800 hover:border-primary/40'}`}>
                <span className="h-8 w-8 rounded-full shadow-inner" style={{ background: th.swatch }} />
                <span className="text-[11px] font-medium">{th.label[lang]}</span>
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium">🌙 {t('settings.darkMode')}</span>
          <button onClick={toggleDark} className={`relative h-6 w-11 rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${darkMode ? 'start-[22px]' : 'start-0.5'}`} />
          </button>
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium">📏 {t('settings.compactMode')}</span>
          <button onClick={() => updateSettings({ compactMode: !s.compactMode })} className={`relative h-6 w-11 rounded-full transition-colors ${s.compactMode ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${s.compactMode ? 'start-[22px]' : 'start-0.5'}`} />
          </button>
        </label>
      </Section>

      {/* general */}
      <Section title={`⚙️ ${t('settings.general')}`}>
        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="label">{t('settings.dailyGoal')}</label>
            <input type="number" min="1" max="100" className="input"
              value={s.dailyGoal}
              onChange={(e) => updateSettings({ dailyGoal: Math.max(1, parseInt(e.target.value || '1', 10)) })} />
          </div>
          <label className="flex items-center justify-between cursor-pointer pb-2">
            <span className="text-sm font-medium">🔔 {t('settings.notifications')}</span>
            <button onClick={() => handleNotifToggle(!s.notifications)} className={`relative h-6 w-11 rounded-full transition-colors ${s.notifications ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${s.notifications ? 'start-[22px]' : 'start-0.5'}`} />
            </button>
          </label>
        </div>
        <div>
          <label className="label">{t('settings.pomodoroDefaults')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[['workTime', 'pomodoro.workTime'], ['shortBreak', 'pomodoro.shortBreakTime'], ['longBreak', 'pomodoro.longBreakTime'], ['rounds', 'pomodoro.rounds']].map(([key, label]) => (
              <div key={key}>
                <label className="label !text-[10px]">{t(label)}</label>
                <input type="number" min="1" className="input"
                  value={ps[key]}
                  onChange={(e) => updatePomodoroSettings({ [key]: Math.max(1, parseInt(e.target.value || '1', 10)), preset: 'custom' })} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="label">⌨️ {t('settings.shortcuts')}</label>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span><kbd className="chip bg-slate-200 dark:bg-slate-800 font-mono">Ctrl+N</kbd> {t('settings.shortcutNew')}</span>
            <span><kbd className="chip bg-slate-200 dark:bg-slate-800 font-mono">Ctrl+P</kbd> {t('settings.shortcutPomodoro')}</span>
            <span><kbd className="chip bg-slate-200 dark:bg-slate-800 font-mono">Ctrl+D</kbd> {t('settings.shortcutDark')}</span>
            <span><kbd className="chip bg-slate-200 dark:bg-slate-800 font-mono">Ctrl+F</kbd> {t('settings.shortcutSearch')}</span>
          </div>
        </div>
      </Section>

      {/* supabase */}
      <Section title={`☁️ ${t('settings.cloud')}`}>
        <div className="space-y-3">
          <div>
            <label className="label">{t('settings.supabaseUrl')}</label>
            <input dir="ltr" className="input font-mono text-xs" placeholder="https://xxxx.supabase.co"
              value={s.supabaseUrl} onChange={(e) => updateSettings({ supabaseUrl: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('settings.supabaseKey')}</label>
            <input dir="ltr" type="password" className="input font-mono text-xs" placeholder="eyJhbGciOi…"
              value={s.supabaseKey} onChange={(e) => updateSettings({ supabaseKey: e.target.value })} />
          </div>
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="label !mb-0">{t('settings.syncCode')}</label>
              <button
                className="text-xs text-primary font-semibold flex items-center gap-1"
                onClick={copySyncCode}
              >
                <FiCopy size={12} /> {t('settings.copy')}
              </button>
            </div>
            <p className="text-xs text-slate-400">{t('settings.syncCodeHint')}</p>
            <div className="flex flex-wrap gap-2">
              <input dir="ltr" className="input font-mono text-xs flex-1 min-w-[200px]"
                value={syncCodeInput} onChange={(e) => setSyncCodeInput(e.target.value)} />
              <Button variant="soft" onClick={applySyncCode}><FiCheckCircle /> {t('settings.syncCodeApply')}</Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="soft" onClick={runTest} disabled={loading}><FiZap /> {t('settings.testConnection')}</Button>
            <Button onClick={runPush} disabled={loading}>
              {loading ? <FiRefreshCw className="animate-spin" /> : <FiCloud />} {t('settings.syncNow')}
            </Button>
            <Button variant="soft" onClick={runLoad} disabled={loading}><FiDownload /> {t('settings.loadCloud')}</Button>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <FiCheckCircle className={lastSync ? 'text-green-500' : 'text-slate-300'} />
            {t('settings.lastSync')}: {lastSync ? fmtDateTime(lastSync, lang) : t('settings.neverSynced')}
          </p>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label !mb-0">{t('settings.sqlTitle')}</label>
              <button
                className="text-xs text-primary font-semibold flex items-center gap-1"
                onClick={() => { navigator.clipboard?.writeText(SETUP_SQL).then(() => toast.success(t('settings.copied'))); }}
              >
                <FiCopy size={12} /> {t('settings.copySql')}
              </button>
            </div>
            <pre dir="ltr" className="rounded-xl bg-slate-950 text-emerald-300 text-[10px] leading-relaxed p-4 overflow-x-auto max-h-64">{SETUP_SQL}</pre>
          </div>
        </div>
      </Section>

      {/* data */}
      <Section title={`💾 ${t('settings.dataSection')}`}>
        <div className="flex flex-wrap gap-2">
          <Button variant="soft" onClick={exportBackup}><FiDownload /> {t('settings.exportData')}</Button>
          <Button variant="soft" onClick={() => fileRef.current?.click()}><FiUpload /> {t('settings.importData')}</Button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { importBackup(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        <div>
          <label className="label">{t('settings.resetSection')}</label>
          <div className="flex flex-wrap gap-1.5">
            {['gym', 'programming', 'german', 'gaming', 'habits', 'calendar', 'pomodoro', 'journal', 'budget'].map((sec) => (
              <button key={sec} onClick={() => setConfirmSection(sec)} className="chip bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                {t(`nav.${sec}`)} ✕
              </button>
            ))}
          </div>
        </div>
        <Button variant="danger" onClick={() => setResetStep(1)}><FiTrash2 /> {t('settings.resetAll')}</Button>
      </Section>

      {/* about */}
      <Section title={`ℹ️ ${t('settings.about')}`}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-black">✓</div>
          <div>
            <div className="font-bold">{t('app.name')} — {t('app.tagline')}</div>
            <div className="text-xs text-slate-400">{t('settings.version')} {localizeDigits(APP_VERSION, lang)}</div>
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{t('settings.features')}</p>
      </Section>

      <ConfirmDialog
        open={!!confirmSection}
        onClose={() => setConfirmSection(null)}
        onConfirm={() => { resetSection(confirmSection); toast.success(t('settings.resetDone')); }}
        message={t('common.confirmDeleteMsg')}
      />
      <ConfirmDialog
        open={resetStep === 1}
        onClose={() => setResetStep(0)}
        onConfirm={() => setTimeout(() => setResetStep(2), 150)}
        title={t('settings.resetAll')}
        message={t('settings.resetAllConfirm1')}
      />
      <ConfirmDialog
        open={resetStep === 2}
        onClose={() => setResetStep(0)}
        onConfirm={() => { resetAll(); toast.success(t('settings.resetDone')); }}
        title={`⚠️ ${t('settings.resetAll')}`}
        message={t('settings.resetAllConfirm2')}
      />
    </div>
  );
}
