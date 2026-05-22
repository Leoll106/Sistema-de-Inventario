/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0f1117',
          1: '#161922',
          2: '#1e2230',
          3: '#252a3a',
          4: '#2d3348',
        },
        brand: {
          DEFAULT: '#4f8ef7',
          light: '#6ea8ff',
          dark: '#3a72d8',
        },
        success: { DEFAULT: '#22c55e', light: '#4ade80', muted: 'rgba(34,197,94,0.12)' },
        warning: { DEFAULT: '#f59e0b', light: '#fbbf24', muted: 'rgba(245,158,11,0.12)' },
        danger:  { DEFAULT: '#ef4444', light: '#f87171', muted: 'rgba(239,68,68,0.12)'  },
        info:    { DEFAULT: '#4f8ef7', light: '#6ea8ff', muted: 'rgba(79,142,247,0.12)' },
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.08)',
        hover: 'rgba(255,255,255,0.14)',
        strong: 'rgba(255,255,255,0.22)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #4f8ef7, #a78bfa)',
        'gradient-success': 'linear-gradient(135deg, #22c55e, #2dd4bf)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'pulse-slow': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.25s ease-out',
        'pulse-slow': 'pulse-slow 2s infinite',
      },
    },
  },
  plugins: [],
}
