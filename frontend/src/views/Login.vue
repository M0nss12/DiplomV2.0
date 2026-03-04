<template>
  <div class="login-page">
    <section>
      <h1>Вход в ApexDrive</h1>
      <p>Введите Email или телефон, указанный при регистрации</p>
    </section>

    <form @submit.prevent="handleLogin">
      
      <!-- Поле: Логин -->
      <div>
        <label>👤 Логин</label><br />
        <input 
          v-model="form.login" 
          type="text" 
          placeholder="example@mail.com или 8900..." 
          required 
          style="width: 100%; padding: 10px;"
        />
      </div>

      <br />

      <!-- Поле: Пароль с "глазком" -->
      <div>
        <label>🔒 Пароль</label><br />
        <div style="display: flex; gap: 5px;">
          <input 
            v-model="form.password" 
            :type="isPasswordVisible ? 'text' : 'password'" 
            placeholder="Введите ваш пароль" 
            required 
            style="flex: 1; padding: 10px;"
          />
          <button type="button" @click="isPasswordVisible = !isPasswordVisible" style="padding: 10px;">
            {{ isPasswordVisible ? '🙈' : '👁️' }}
          </button>
        </div>
      </div>

      <br />

      <!-- КНОПКА ВХОДА -->
      <button type="submit" :disabled="loading" style="width: 100%; padding: 12px; cursor: pointer; background: #2c3e50; color: white; border: none; font-weight: bold;">
        {{ loading ? 'Проверка данных...' : 'Войти в аккаунт' }}
      </button>

      <p style="text-align: center; margin-top: 15px;">
        Нет аккаунта? 
        <router-link to="/register">Зарегистрироваться</router-link>
      </p>
    </form>

    <!-- ВЫВОД ОШИБОК -->
    <div v-if="error" style="color: red; margin-top: 20px; text-align: center; font-weight: bold;">
      ⚠️ {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAppStore } from '@/stores/appStore';

const router = useRouter();
const appStore = useAppStore();

const loading = ref(false);
const error = ref('');
const isPasswordVisible = ref(false);

const form = ref({
  login: '',
  password: ''
});

const handleLogin = async () => {
  error.value = '';
  loading.value = true;

  try {
    const response = await axios.post('/api/users/login', {
      login: form.value.login,
      password: form.value.password
    });

    const user = response.data;
    
    // 1. Сохраняем данные в localStorage
    localStorage.setItem('user_id', user.id);
    localStorage.setItem('role', user.role);
    localStorage.setItem('user_name', user.first_name);
    localStorage.setItem('user_avatar', user.avatar_url);

    // 2. Умная синхронизация города:
    // Если у пользователя в адресе "г. Ангарск...", вытащим город и применим к сайту
    if (user.saved_address) {
      let extractedCity = user.saved_address.split(',')[0].replace('г.', '').trim();
      if (extractedCity) {
        appStore.setCity(extractedCity);
      }
    }

    alert(`С возвращением, ${user.first_name}!`);

    // 3. Перенаправляем на главную
    router.push('/');

    // Небольшая задержка перед обновлением для очистки состояния
    setTimeout(() => {
        window.location.reload();
    }, 100);

  } catch (err) {
    error.value = err.response?.data?.error || 'Неверный логин или пароль';
  } finally {
    loading.value = false;
  }
};
</script>