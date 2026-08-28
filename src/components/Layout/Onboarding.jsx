import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../hooks/useTheme';
import Button from '../Common/Button';

export default function Onboarding() {
  const { updateSettings } = useApp();
  const { t, lang, setLanguage } = useTranslation();
  const { themes, themeId, setTheme, darkMode, toggleDark } = useTheme();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');

  const finish = () => updateSettings({ onboarded: true, userName: name.trim() });

  const steps = [
    {
      emoji: '🚀', title: t('onboarding.step1Title'), text: t('onboarding.step1Text'),
      extra: (
        <input
          className="input text-center"
          placeholder={t('settings.yourName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      ),
    },
    {
      emoji: '🎨', title: t('onboarding.step2Title'), text: t('onboarding.step2Text'),
      extra: (
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            <button onClick={() => setLanguage('fa')} className={`btn ${lang === 'fa' ? 'btn-primary' : 'btn-ghost border border-slate-300 dark:border-slate-700'}`}>فارسی</button>
            <button onClick={() => setLanguage('en')} className={`btn ${lang === 'en' ? 'btn-primary' : 'btn-ghost border border-slate-300 dark:border-slate-700'}`}>English</button>
          </div>
          <div className="flex justify-center gap-3">
            {Object.values(themes).map((th) => (
              <button
                key={th.id}
                onClick={() => setTheme(th.id)}
                className={`h-9 w-9 rounded-full transition-transform ${themeId === th.id ? 'ring-4 ring-offset-2 ring-primary/50 dark:ring-offset-slate-900 scale-110' : ''}`}
                style={{ background: th.swatch }}
                title={th.label[lang]}
              />
            ))}
          </div>
          <button onClick={toggleDark} className="btn-ghost mx-auto border border-slate-300 dark:border-slate-700">
            {darkMode ? '🌙' : '☀️'} {t('settings.darkMode')}: {darkMode ? t('common.on') : t('common.off')}
          </button>
        </div>
      ),
    },
    { emoji: '☁️', title: t('onboarding.step3Title'), text: t('onboarding.step3Text'), extra: null },
  ];

  const s = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/20 via-transparent to-accent/20">
      <div className="card w-full max-w-md p-8 text-center space-y-5 animate-slide-up">
        <h1 className="text-2xl font-extrabold">{t('onboarding.welcome')}</h1>
        <div className="text-6xl animate-pop" key={step}>{s.emoji}</div>
        <h2 className="text-lg font-bold">{s.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.text}</p>
        {s.extra}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {steps.map((_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-2 bg-slate-300 dark:bg-slate-700'}`} />
          ))}
        </div>
        <div className="flex gap-2 justify-center pt-2">
          <Button variant="ghost" onClick={finish}>{t('onboarding.skip')}</Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>{t('common.next')}</Button>
          ) : (
            <Button onClick={finish}>{t('onboarding.getStarted')}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
