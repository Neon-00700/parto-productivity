import React from 'react';

export default function StatsCard({ icon, label, value, sub, color = 'text-primary bg-primary/10' }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-lg shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xl font-extrabold leading-tight tabular-nums">{value}</div>
        <div className="text-[11px] text-slate-400 truncate">{label}</div>
        {sub && <div className="text-[10px] text-slate-400">{sub}</div>}
      </div>
    </div>
  );
}
