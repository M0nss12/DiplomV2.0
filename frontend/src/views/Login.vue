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
import { supabase } from '@/supabase';
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
        redirectTo: window.location.origin + '/login',
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
      const res = await axios.get(`/api/users/profile/${sbUser.id}`);
      saveSession(res.data);
    } catch (e) {
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.login-page {
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--bg-body);
}

.login-card {
  background: var(--bg-card);
  backdrop-filter: blur(4px);
  width: 100%;
  max-width: 480px;
  padding: 48px 40px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  text-align: center;
  animation: fadeIn 0.5s ease-out;
  transition: transform 0.3s, box-shadow 0.3s;
}

.login-card:hover {
  box-shadow: var(--shadow-xl);
}

/* ЗАГОЛОВОК */
.login-header h1 {
  font-size: 2.4rem;
  margin-bottom: 12px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--text-main), var(--primary));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.highlight {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  padding: 0 4px;
}

.login-header p {
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.5;
}

/* ФОРМА */
.login-form {
  margin-top: 35px;
  text-align: left;
}

.input-group {
  margin-bottom: 24px;
}

.input-group label {
  display: block;
  font-weight: 800;
  font-size: 0.75rem;
  margin-bottom: 8px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  transition: color 0.2s;
}

/* ЕДИНАЯ ВЫСОТА ДЛЯ ВСЕХ ПОЛЕЙ */
.input-group input,
.password-wrapper input {
  width: 100%;
  height: 52px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  border: 1.5px solid var(--border-color);
  font-size: 0.95rem;
  color: var(--text-main);
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-sizing: border-box;
}

.input-group input:focus {
  border-color: var(--primary);
  background: var(--bg-card);
  box-shadow: 0 0 0 4px var(--primary-light);
  outline: none;
  transform: scale(1.01);
}

/* ПОЛЕ С ГЛАЗКОМ */
.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  padding-right: 50px;
}

.eye-btn {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eye-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* КНОПКА ВХОДА */
.btn-submit {
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 1px;
  margin-top: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-shadow: 0 8px 20px rgba(230, 57, 70, 0.3);
  border: none;
  position: relative;
  overflow: hidden;
}

.btn-submit::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn-submit:hover::before {
  left: 100%;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(230, 57, 70, 0.4);
}

.btn-submit:active {
  transform: translateY(0);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* РАЗДЕЛИТЕЛЬ */
.separator {
  margin: 32px 0;
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
  background: linear-gradient(90deg, transparent, var(--border-color), transparent);
}

.separator span {
  position: relative;
  background: var(--bg-card);
  padding: 0 20px;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
}

/* СОЦИАЛЬНАЯ КНОПКА */
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
  gap: 14px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1.5px solid var(--border-color);
  color: var(--text-main);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  backdrop-filter: blur(4px);
}

.social-btn img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.social-btn:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  background: var(--primary-light);
}

/* ФУТЕР ССЫЛКА */
.auth-footer {
  margin-top: 32px;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.auth-footer a {
  font-weight: 800;
  color: var(--primary);
  text-decoration: none;
  transition: all 0.2s;
}

.auth-footer a:hover {
  text-decoration: underline;
  text-shadow: 0 0 2px var(--primary-light);
}

/* ОШИБКА */
.error-box {
  margin-top: 24px;
  padding: 14px 18px;
  background: var(--danger-light);
  color: var(--danger);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 700;
  border: 1.5px solid var(--danger);
  animation: shake 0.4s ease-in-out;
  backdrop-filter: blur(4px);
}

/* АНИМАЦИИ ДЛЯ ПЕРЕХОДОВ */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* АДАПТИВНОСТЬ */
@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
    box-shadow: var(--shadow-md);
  }
  .login-header h1 {
    font-size: 1.8rem;
  }
  .btn-submit,
  .social-btn,
  .input-group input,
  .password-wrapper input {
    height: 48px;
  }
  .eye-btn {
    font-size: 1.2rem;
  }
}

/* ТЁМНАЯ ТЕМА – ДОПОЛНИТЕЛЬНЫЕ ПРАВКИ */
body.dark-theme .social-btn:hover {
  background: rgba(99, 102, 241, 0.15);
}
</style>