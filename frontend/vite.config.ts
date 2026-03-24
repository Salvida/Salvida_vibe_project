import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-leaflet':  ['leaflet', 'react-leaflet'],
            'vendor-motion':   ['motion'],
            'vendor-tanstack': ['@tanstack/react-query'],
            'vendor-router':   ['react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
          },
        },
      },
    },
  };
});
