import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/quiniela-mundial-2026/',
  plugins: [react()],
});
