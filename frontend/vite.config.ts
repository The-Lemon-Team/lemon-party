import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  base: mode === 'electron' ? './' : '/',
  plugins: [
    vue(),
    /*
    federation({
      name: 'host',
      remotes: {
        mfe_telegram: 'http://localhost:5174/assets/remoteEntry.js',
      },
      shared: ['vue', 'pinia', 'vue-router'],
    }),
    */
  ],
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@lemon-party/blocks': fileURLToPath(
        new URL('../packages/blocks/src', import.meta.url),
      ),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3008',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: 'http://localhost:3008',
        changeOrigin: true,
      },
    },
  },
}));
