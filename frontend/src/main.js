import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios' // 1. Импортируем axios

import './assets/main.css';

import App from './App.vue'
import router from './router'

// 2. Настраиваем базовый URL для всех запросов
// Если проект запущен локально (npm run dev), будет http://localhost:3000
// Если на хостинге — будет адрес твоего бэкенда на Render
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')