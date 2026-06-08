import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/quinielas_minigrip/',
  plugins: [react()],
});
