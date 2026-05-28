import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        /* ── Reference palette (Arcade Architecture) ── */
        plum: {
          DEFAULT: '#A04A84',
          light: '#B86A9E',
          dark: '#7A3466',
          muted: 'rgba(160, 74, 132, 0.12)',
        },
        violet: {
          DEFAULT: '#6B70A3',
          light: '#8F93C0',
          muted: 'rgba(107, 112, 163, 0.15)',
        },
        teal: {
          DEFAULT: '#00859E',
          light: '#57A7B3',
          sky: '#A2D9F7',
          muted: 'rgba(0, 133, 158, 0.12)',
        },
        peach: {
          DEFAULT: '#FCD5A6',
          muted: 'rgba(252, 213, 166, 0.2)',
        },
        /* ── Surfaces (warm dark tones) ── */
        surface: {
          DEFAULT: '#1E1515',
          raised: '#2A2020',
          overlay: '#342A2A',
          light: '#ededed',
        },
        /* ── Text ── */
        foreground: {
          DEFAULT: '#f0f0f0',
          secondary: '#c8c8c8',
          tertiary: '#838383',
          dark: '#222222',
        },
        /* ── Status ── */
        success: '#57A7B3',
        warning: '#FCD5A6',
        danger: '#A04A84',
        muted: '#727272',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(30, 21, 21, 0.4)',
        'glass-lg': '0 16px 48px rgba(30, 21, 21, 0.5)',
        glow: '0 0 24px rgba(160, 74, 132, 0.15)',
        'glow-lg': '0 0 40px rgba(160, 74, 132, 0.2)',
        'glow-teal': '0 0 24px rgba(0, 133, 158, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-out-left': 'slideOutLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutLeft: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(-30px)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      },
    },
  },
  plugins: [],
};

export default config;
