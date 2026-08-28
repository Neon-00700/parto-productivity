import React from 'react';

const styles = {
  high: 'bg-red-500/15 text-red-500',
  medium: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  low: 'bg-green-500/15 text-green-600 dark:text-green-400',
  neutral: 'bg-slate-500/15 text-slate-500 dark:text-slate-400',
  primary: 'bg-primary/15 text-primary',
};

export default function Badge({ tone = 'neutral', className = '', children }) {
  return <span className={`chip ${styles[tone] || styles.neutral} ${className}`}>{children}</span>;
}
