import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import './assets/main.css';

import App from './App.vue'
import router from './router'

// АВТОМАТИЧЕСКОЕ ОПРЕДЕЛЕНИЕ URL БЭКЕНДА
const isProduction = window.location.hostname !== 'localhost';

axios.defaults.baseURL = isProduction 
  ? 'https://diplomv2-0.onrender.com'  // Твой адрес на Render
  : 'http://localhost:3000';           // Твой адрес при разработке дома

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')