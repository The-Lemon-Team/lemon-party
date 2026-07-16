import { createApp } from 'vue';
import App from './App.vue';
import '@/style.css'; // Let's make sure it imports styling if any, or a simple mock

const app = createApp(App);
app.mount('#app');
