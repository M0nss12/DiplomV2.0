<template>
  <div class="login-page">
    <div class="login-card">
      
      <!-- ЗАГОЛОВОК -->
      <section class="login-header">
        <h1>Вход в <span class="highlight">ApexDrive</span></h1>
        <p>Добро пожаловать! Войдите в свой профиль через почту или Google.</p>
      </section>

      <!-- ФОРМА ВХОДА (ОБЫЧНАЯ) -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label>Логин (Email или Телефон)</label>
          <input 
            v-model="form.login" 
            type="text" 
            placeholder="example@mail.com" 
            required 
          />
        </div>

        <div class="input-group">
          <label>Пароль</label>
          <div class="password-wrapper">
            <input 
              v-model="form.password" 
              :type="isPasswordVisible ? 'text' : 'password'" 
              placeholder="••••••••" 
              required 
            />
            <button type="button" class="eye-btn" @click="isPasswordVisible = !isPasswordVisible">
              {{ isPasswordVisible ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <button type="submit" :disabled="loading" class="btn-submit">
          {{ loading ? 'Проверка...' : 'Войти в аккаунт' }}
        </button>
      </form>

      <!-- РАЗДЕЛИТЕЛЬ -->
      <div class="separator">
        <span>или</span>
      </div>

      <!-- СОЦИАЛЬНЫЙ ВХОД (GOOGLE) -->
      <div class="social-login">
        <button @click="socialAuth('google')" class="social-btn google" title="Войти через Google">
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google">
          <span>Войти через Google Account</span>
        </button>
      </div>

      <p class="auth-footer">
        Нет аккаунта? 
        <router-link to="/register">Зарегистрироваться</router-link>
      </p>

      <!-- ОШИБКИ -->
      <transition name="fade">
        <div v-if="error" class="error-box">
          ⚠️ {{ error }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { supabase } from '@/supabase'; // ИМПОРТ ОБЩЕГО КЛИЕНТА
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

// 1. СОХРАНЕНИЕ СЕССИИ (localStorage)
const saveSession = (user) => {
    localStorage.setItem('user_id', user.id);
    localStorage.setItem('role', user.role || 'user');
    localStorage.setItem('user_name', user.first_name || user.email);
    localStorage.setItem('user_avatar', user.avatar_url || '/assets/images/avatars/1.png');
    
    if (user.saved_address) appStore.setCity(user.saved_address);
    
    router.push('/');
    setTimeout(() => window.location.reload(), 100);
};

// 2. ОБЫЧНЫЙ ВХОД ЧЕРЕЗ BACKEND
const handleLogin = async () => {
  error.value = '';
  loading.value = true;
  try {
    const response = await axios.post('/api/users/login', {
      login: form.value.login,
      password: form.value.password
    });
    saveSession(response.data);
  } catch (err) {
    error.value = err.response?.data?.error || 'Неверный логин или пароль';
  } finally {
    loading.value = false;
  }
};

// 3. ВХОД ЧЕРЕЗ GOOGLE
const socialAuth = async (provider) => {
  loading.value = true;
  try {
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin + '/login', // Возвращаемся сюда же для обработки сессии
      },
    });
    if (authError) throw authError;
  } catch (err) {
    error.value = `Ошибка Google: ${err.message}`;
    loading.value = false;
  }
};

// 4. ОБРАБОТКА ВОЗВРАТА ОТ GOOGLE (Синхронизация с localStorage)
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (session && !localStorage.getItem('user_id')) {
    const sbUser = session.user;
    
    try {
      // Пытаемся найти пользователя в нашей таблице public.users
      const res = await axios.get(`/api/users/profile/${sbUser.id}`);
      saveSession(res.data);
    } catch (e) {
      // Если пользователя еще нет в таблице (первый вход), создаем временный объект
      const newUser = {
        id: sbUser.id,
        email: sbUser.email,
        first_name: sbUser.user_metadata.full_name || sbUser.user_metadata.first_name || 'Пользователь',
        avatar_url: sbUser.user_metadata.avatar_url || '/assets/images/avatars/1.png',
        role: 'user'
      };
      saveSession(newUser);
    }
  }
});
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: var(--bg-body);
}

.login-card {
  background: var(--bg-card);
  width: 100%;
  max-width: 440px;
  padding: 50px 40px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  text-align: center;
  animation: fadeIn 0.5s ease-out;
}

.login-header h1 {
  font-size: 2.4rem;
  margin-bottom: 12px;
  font-weight: 800;
  color: var(--text-main);
}

.highlight {
  color: var(--primary);
  background: var(--primary-light);
  padding: 0 10px;
  border-radius: 8px;
}

.login-header p {
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.5;
}

.login-form {
  margin-top: 35px;
  text-align: left;
}

.input-group {
  margin-bottom: 25px;
}

.input-group label {
  display: block;
  font-weight: 700;
  font-size: 0.8rem;
  margin-bottom: 8px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  padding-right: 50px;
  width: 100%;
  height: 52px;
}

.eye-btn {
  position: absolute;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.eye-btn:hover { opacity: 1; }

.btn-submit {
  width: 100%;
  height: 52px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: 700;
  margin-top: 10px;
  box-shadow: 0 10px 20px var(--primary-light);
  cursor: pointer;
}

.btn-submit:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.separator {
  margin: 35px 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.separator::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 1px;
  background: var(--border-color);
}

.separator span {
  position: relative;
  background: var(--bg-card);
  padding: 0 20px;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
}

.social-login {
  display: flex;
  flex-direction: column;
}

.social-btn {
  width: 100%;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1.5px solid var(--border-color);
  color: var(--text-main);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
}

.social-btn img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.social-btn:hover {
  background: var(--bg-input);
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.auth-footer {
  margin-top: 35px;
  font-size: 1rem;
  color: var(--text-muted);
}

.auth-footer a {
  font-weight: 800;
  color: var(--primary);
}

.error-box {
  margin-top: 25px;
  padding: 16px;
  background: var(--danger-light);
  color: var(--danger);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 700;
  border: 1.5px solid var(--danger);
  animation: shake 0.4s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
    border: none;
    box-shadow: none;
    background: transparent;
  }
  .login-header h1 { font-size: 1.8rem; }
}
</style>