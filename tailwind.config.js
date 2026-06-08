/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pitch: '#07110B',
        panel: '#101914',
        panelSoft: '#17231D',
        line: '#26362D',
        accent: '#00C853',
        gold: '#FFD600',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0, 200, 83, 0.22), 0 18px 45px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
};
