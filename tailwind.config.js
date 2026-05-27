/** @type {import('tailwindcss').Config} */
import animate from 'tailwindcss-animate'
import containerQueries from '@tailwindcss/container-queries'

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        light: {
          bg: '#FFF8F6',
          base: '#FDF5ED',
          cream: '#FFFBF5',
          pink: '#F4A8C7',
          accent: '#E879B4',
          purple: '#C9A0DC',
          text: '#2D1B28',
          card: '#FFFFFF',
        },
        dark: {
          bg: '#12071E',
          base: '#0A0414',
          purple: '#C77DFF',
          pink: '#E0A7C8',
          'mesh-1': '#3D1A5C',
          'mesh-2': '#5C1F8B',
          text: '#F5EEF8',
          card: '#1A0828',
        },
      },
      fontFamily: {
        display: ['Fraunces Variable', 'serif'],
        heading: ['Fraunces Variable', 'serif'],
        body: ['Inter Variable', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
      },
      fontVariationSettings: {
        wonky: '"SOFT" 80, "WONK" 1',
      },
      keyframes: {
        'confetti-fall': {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        'paw-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(-8deg)', opacity: '0.15' },
          '50%': { transform: 'translateY(-18px) rotate(2deg)', opacity: '0.25' },
        },
        'mesh-breathe': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -20px) scale(1.08)' },
          '66%': { transform: 'translate(-30px, 10px) scale(0.96)' },
        },
        'heart-beat': {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.2)' },
          '50%': { transform: 'scale(0.95)' },
          '75%': { transform: 'scale(1.15)' },
        },
        'eyebrow-dot': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        'breath-pulse': {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 8px 20px rgba(232,121,180,0.35)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 12px 32px rgba(232,121,180,0.55)' },
        },
      },
      animation: {
        'confetti-fall': 'confetti-fall 2s ease-in forwards',
        'paw-float': 'paw-float 6s ease-in-out infinite',
        'mesh-breathe': 'mesh-breathe 18s ease-in-out infinite',
        'heart-beat': 'heart-beat 1.6s ease-in-out infinite',
        'eyebrow-dot': 'eyebrow-dot 2s ease-in-out infinite',
        'breath-pulse': 'breath-pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [animate, containerQueries],
  future: {
    hoverOnlyWhenSupported: true,
  },
}
