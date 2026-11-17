import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { devvit } from '@devvit/start/vite';
import { defineConfig } from 'vite';

// Keep the standalone Vite configuration intact. This config is used only for
// building the Reddit Devvit Web client and server bundle.
export default defineConfig({
  plugins: [react(), tailwindcss(), devvit()],
});
