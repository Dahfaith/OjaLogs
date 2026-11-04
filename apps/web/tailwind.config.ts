import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        oj: {
          midnight: '#0B1220',
          navy: '#172554',
          primary: '#2563EB',
          'primary-hover': '#1D4ED8',
          cyan: '#06B6D4',
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          'surface-alt': '#F1F5F9',
          border: '#E2E8F0',
          muted: '#64748B',
          dark: {
            bg: '#070B14',
            surface: '#0E1626',
            'surface-alt': '#162034',
            border: '#1E293B',
            text: '#F8FAFC',
            muted: '#94A3B8'
          }
        }
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['Geist Mono', 'monospace', 'Courier New']
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
        'input': '12px'
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'elevated': '0 10px 25px -5px rgba(11, 18, 32, 0.08), 0 8px 10px -6px rgba(11, 18, 32, 0.04)',
        'glow-primary': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.35)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.07)'
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;

