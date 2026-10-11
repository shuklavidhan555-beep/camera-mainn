/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        command: {
          bg: '#0a0d14',
          surface: '#111726',
          panel: '#161f33',
          border: '#23304a',
          hover: '#1e2b45',
          text: '#f1f5f9',
          muted: '#94a3b8',
          cyan: '#06b6d4',
          blue: '#3b82f6',
          amber: '#f59e0b',
          red: '#ef4444',
          green: '#10b981',
        },
        monochrome: {
          bg: '#000000',
          surface: '#0a0a0a',
          panel: '#141414',
          border: '#282828',
          hover: '#1f1f1f',
          text: '#ffffff',
          muted: '#a3a3a3',
          accent: '#ffffff',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Roboto Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar 4s linear infinite',
        'scanline': 'scanline 6s linear infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}
