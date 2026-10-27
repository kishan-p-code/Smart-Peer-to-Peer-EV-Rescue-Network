/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        evio: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          borderLight: '#BAE6FD',
          hover: '#F0F9FF',
          sky: '#0284C7',
          skyLight: '#E0F2FE',
          skyHover: '#0369A1',
          green: '#16A34A',
          amber: '#D97706',
          red: '#DC2626',
          alertBg: '#FEF2F2',
          textPrimary: '#0F172A',
          textSecondary: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
      }
    },
  },
  plugins: [],
}
