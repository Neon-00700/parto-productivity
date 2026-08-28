import { v4 as uuid } from 'uuid';

// Default habits, bilingual names. `type: 'water'` gets the glass-filling UI.
export const defaultHabits = () => [
  { id: uuid(), name: { fa: 'مسواک زدن', en: 'Brush teeth' }, icon: '🪥', color: '#38bdf8', type: 'check', history: {}, createdAt: new Date().toISOString() },
  { id: uuid(), name: { fa: 'حمام', en: 'Shower' }, icon: '🚿', color: '#22d3ee', type: 'check', history: {}, createdAt: new Date().toISOString() },
  { id: uuid(), name: { fa: 'نوشیدن آب (۸ لیوان)', en: 'Drink water (8 glasses)' }, icon: '💧', color: '#3b82f6', type: 'water', target: 8, history: {}, createdAt: new Date().toISOString() },
  { id: uuid(), name: { fa: 'ورزش', en: 'Exercise' }, icon: '🏃', color: '#f97316', type: 'check', history: {}, createdAt: new Date().toISOString() },
  { id: uuid(), name: { fa: 'کتاب خواندن', en: 'Read' }, icon: '📚', color: '#a855f7', type: 'check', history: {}, createdAt: new Date().toISOString() },
  { id: uuid(), name: { fa: 'خواب قبل از نیمه شب', en: 'Sleep before midnight' }, icon: '🌙', color: '#6366f1', type: 'check', history: {}, createdAt: new Date().toISOString() },
  { id: uuid(), name: { fa: 'مدیتیشن', en: 'Meditation' }, icon: '🧘', color: '#10b981', type: 'check', history: {}, createdAt: new Date().toISOString() },
  { id: uuid(), name: { fa: 'بدون شبکه اجتماعی', en: 'No social media' }, icon: '📵', color: '#ef4444', type: 'check', history: {}, createdAt: new Date().toISOString() },
];
