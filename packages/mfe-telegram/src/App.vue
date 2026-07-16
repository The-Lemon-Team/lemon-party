<script setup lang="ts">
import TelegramExportViewer from './views/TelegramExportViewer.vue';
</script>

<template>
  <main class="app-main">
    <TelegramExportViewer />
  </main>
</template>

<style>
:root {
  --bg-primary: #1e1e24;
  --text-primary: #f0f0f5;
  --text-secondary: #d0d0e0;
  --text-muted: #7a7a8a;
  --border-color: rgba(255, 255, 255, 0.08);
  --accent-color: #7070ff;
}

body {
  margin: 0;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.app-main {
  width: 100vw;
  height: 100vh;
}
</style>
