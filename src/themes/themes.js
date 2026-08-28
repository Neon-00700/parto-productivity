// 5 color themes. Each color is an "R G B" string used in CSS variables
// so Tailwind can apply alpha: rgb(var(--c-primary) / <alpha-value>)
export const themes = {
  ocean: {
    id: 'ocean',
    label: { fa: 'آبی اقیانوس', en: 'Ocean Blue' },
    swatch: '#0ea5e9',
    primary: '14 165 233',
    primaryDark: '2 132 199',
    primaryLight: '125 211 252',
    accent: '99 102 241',
  },
  purple: {
    id: 'purple',
    label: { fa: 'شب بنفش', en: 'Purple Night' },
    swatch: '#8b5cf6',
    primary: '139 92 246',
    primaryDark: '124 58 237',
    primaryLight: '196 181 253',
    accent: '236 72 153',
  },
  emerald: {
    id: 'emerald',
    label: { fa: 'سبز زمردی', en: 'Emerald Green' },
    swatch: '#10b981',
    primary: '16 185 129',
    primaryDark: '5 150 105',
    primaryLight: '110 231 183',
    accent: '14 165 233',
  },
  sunset: {
    id: 'sunset',
    label: { fa: 'نارنجی غروب', en: 'Sunset Orange' },
    swatch: '#f97316',
    primary: '249 115 22',
    primaryDark: '234 88 12',
    primaryLight: '253 186 116',
    accent: '239 68 68',
  },
  rose: {
    id: 'rose',
    label: { fa: 'صورتی رز', en: 'Rose Pink' },
    swatch: '#f43f5e',
    primary: '244 63 94',
    primaryDark: '225 29 72',
    primaryLight: '253 164 175',
    accent: '168 85 247',
  },
};

export function applyTheme(themeId, darkMode) {
  const t = themes[themeId] || themes.ocean;
  const root = document.documentElement;
  root.style.setProperty('--c-primary', t.primary);
  root.style.setProperty('--c-primary-dark', t.primaryDark);
  root.style.setProperty('--c-primary-light', t.primaryLight);
  root.style.setProperty('--c-accent', t.accent);
  root.style.setProperty('--c-surface', darkMode ? '30 41 59' : '255 255 255');
  root.style.setProperty('--c-surface-2', darkMode ? '15 23 42' : '241 245 249');
  root.classList.toggle('dark', !!darkMode);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t.swatch);
}

// Section-specific color coding used across the app
export const sectionColors = {
  gym: { text: 'text-orange-500', bg: 'bg-orange-500', soft: 'bg-orange-500/15 text-orange-500', hex: '#f97316' },
  programming: { text: 'text-sky-500', bg: 'bg-sky-500', soft: 'bg-sky-500/15 text-sky-500', hex: '#0ea5e9' },
  german: { text: 'text-amber-500', bg: 'bg-amber-500', soft: 'bg-amber-500/15 text-amber-500', hex: '#f59e0b' },
  gaming: { text: 'text-violet-500', bg: 'bg-violet-500', soft: 'bg-violet-500/15 text-violet-500', hex: '#8b5cf6' },
  custom: { text: 'text-emerald-500', bg: 'bg-emerald-500', soft: 'bg-emerald-500/15 text-emerald-500', hex: '#10b981' },
};

export const eventColors = [
  { id: 'blue', hex: '#3b82f6' },
  { id: 'green', hex: '#22c55e' },
  { id: 'red', hex: '#ef4444' },
  { id: 'yellow', hex: '#eab308' },
  { id: 'purple', hex: '#a855f7' },
  { id: 'pink', hex: '#ec4899' },
];
