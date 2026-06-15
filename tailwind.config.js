/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'arc-blue': '#00d4ff',
        'arc-blue-dim': '#006680',
        'discharge-orange': '#ff6b35',
        'deep-navy': '#0a0e27',
        'panel-bg': '#0d1235',
        'panel-border': '#1a2550',
        'info-white': '#e8f0ff',
        'grid-line': '#1a2550',
        'pulse-green': '#39ff14',
        'alert-red': '#ff2d55',
        'warn-yellow': '#ffd60a',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Rajdhani', 'sans-serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan-line': 'scanLine 4s linear infinite',
        'data-flash': 'dataFlash 0.3s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        dataFlash: {
          '0%': { backgroundColor: 'rgba(0, 212, 255, 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
};
