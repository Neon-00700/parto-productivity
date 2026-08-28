/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--c-primary) / <alpha-value>)',
        'primary-dark': 'rgb(var(--c-primary-dark) / <alpha-value>)',
        'primary-light': 'rgb(var(--c-primary-light) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
      },
      fontFamily: {
        fa: ['Vazirmatn', 'Inter', 'sans-serif'],
        en: ['Inter', 'Vazirmatn', 'sans-serif'],
      },
      keyframes: {
        'slide-up': { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'page-in': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        breathe: { '0%,100%': { transform: 'scale(1)', opacity: 0.7 }, '50%': { transform: 'scale(1.15)', opacity: 1 } },
        pop: { '0%': { transform: 'scale(0.6)', opacity: 0 }, '70%': { transform: 'scale(1.1)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'page-in': 'page-in 0.3s ease-out',
        breathe: 'breathe 4s ease-in-out infinite',
        pop: 'pop 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
