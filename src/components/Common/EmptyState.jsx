import React from 'react';

export default function EmptyState({ message, action, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      {icon || (
        <svg width="88" height="88" viewBox="0 0 88 88" fill="none" className="opacity-70">
          <circle cx="44" cy="44" r="40" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="3" strokeDasharray="6 8" strokeLinecap="round" />
          <path d="M30 46l9 9 19-20" className="stroke-primary" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{message}</p>
      {action}
    </div>
  );
}
