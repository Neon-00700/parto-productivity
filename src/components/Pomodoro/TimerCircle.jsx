import React from 'react';
import { localizeDigits } from '../../utils/dateUtils';

export default function TimerCircle({ remaining, progress, phase, size = 280, lang = 'en', label }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const color = phase === 'work' ? 'rgb(var(--c-primary))' : phase === 'short' ? '#10b981' : '#8b5cf6';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-200 dark:stroke-slate-800" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          stroke={color} strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.4s linear, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="font-extrabold tabular-nums" style={{ fontSize: size / 5 }} dir="ltr">
          {localizeDigits(`${mm}:${ss}`, lang)}
        </span>
        {label && <span className="text-sm font-semibold" style={{ color }}>{label}</span>}
      </div>
    </div>
  );
}
