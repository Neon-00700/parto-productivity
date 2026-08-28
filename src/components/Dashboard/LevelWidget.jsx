import React from 'react';
import { useGamification } from '../../hooks/useGamification';
import { useTranslation } from '../../hooks/useTranslation';
import { localizeDigits } from '../../utils/dateUtils';

export default function LevelWidget({ compact = false }) {
  const { level, current, needed, pct, title, earnedCount, badges } = useGamification();
  const { t, lang } = useTranslation();

  if (compact) {
    return (
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-bold">{title.icon} {t('gam.level')} {localizeDigits(level, lang)}</span>
          <span className="text-slate-400">{localizeDigits(`${current}/${needed}`, lang)} {t('gam.xp')}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 bg-gradient-to-br from-accent/10 to-primary/10">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl shadow-md">
          {title.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-lg">{t('gam.level')} {localizeDigits(level, lang)}</span>
            <span className="text-xs text-slate-400">· {title[lang]}</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>{localizeDigits(current, lang)}/{localizeDigits(needed, lang)} {t('gam.xp')} {t('gam.xpToNext')}</span>
            <span>🏅 {localizeDigits(earnedCount, lang)}/{localizeDigits(badges.length, lang)} {t('gam.achievements')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
