import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'mfe_telegram',
      filename: 'remoteEntry.js',
      exposes: {
        './TelegramExportViewer': './src/views/TelegramExportViewer.vue',
      },
      shared: ['vue', 'pinia', 'vue-router'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
    cssCodeSplit: false,
    minify: false,
  },
});
