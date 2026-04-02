<template>
  <div class="auth-page">
    <section class="auth-header">
      <h1>Регистрация в <span class="highlight">ApexDrive</span></h1>
    </section>

    <div class="auth-card">
      <form @submit.prevent="handleRegister">
        
        <!-- БЛОК: ФИО (Сетка 3 колонки) -->
        <div class="input-grid-3">
          <div class="input-wrapper">
            <label>Фамилия</label>
            <input v-model="form.last_name" placeholder="Иванов" />
          </div>
          <div class="input-wrapper">
            <label>Имя *</label>
            <input v-model="form.first_name" placeholder="Иван" required />
          </div>
          <div class="input-wrapper">
            <label>Отчество</label>
            <input v-model="form.otchestvo" placeholder="Иванович" />
          </div>
        </div>

        <!-- БЛОК: ГОРОД -->
        <div class="input-wrapper full-width">
          <label>📍 Ваш населенный пункт *</label>
          <input v-model="form.city" placeholder="Напр. Москва" required />
          <small>Это поможет нам точнее рассчитывать сроки доставки</small>
        </div>

        <!-- БЛОК: КОНТАКТЫ (Сетка 2 колонки) -->
        <div class="input-grid-2">
          <div class="input-wrapper">
            <label>📞 Номер телефона</label>
            <input v-model="form.phone" type="tel" placeholder="+7 999 000-00-00" />
          </div>
          <div class="input-wrapper">
            <label>✉️ Электронная почта</label>
            <input v-model="form.email" type="email" placeholder="mail@example.com" />
          </div>
        </div>

        <!-- БЛОК: ПАРОЛИ (Сетка 2 колонки) -->
        <div class="input-grid-2">
          <div class="input-wrapper password-box">
            <label>Придумайте пароль *</label>
            <div class="pass-input-wrap">
              <input :type="showP ? 'text' : 'password'" v-model="form.password" required placeholder="••••••" />
              <button type="button" class="eye-btn" @click="showP = !showP">{{ showP ? '🙈' : '👁️' }}</button>
            </div>
          </div>
          <div class="input-wrapper password-box">
            <label>Повторите пароль *</label>
            <div class="pass-input-wrap">
              <input :type="showCP ? 'text' : 'password'" v-model="form.confirmPassword" required placeholder="••••••" />
              <button type="button" class="eye-btn" @click="showCP = !showCP">{{ showCP ? '🙈' : '👁️' }}</button>
            </div>
          </div>
        </div>

        <button type="submit" :disabled="loading" class="btn-register">
          {{ loading ? 'Создание профиля...' : 'ЗАРЕГИСТРИРОВАТЬСЯ' }}
        </button>
      </form>

      <!-- РАЗДЕЛИТЕЛЬ -->
      <div class="separator"><span>или</span></div>

      <!-- GOOGLE РЕГИСТРАЦИЯ -->
      <button @click="socialRegister('google')" class="social-btn google">
        <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google">
        <span>Быстрая регистрация через Google</span>
      </button>

      <p class="auth-footer">
        Уже есть аккаунт? <router-link to="/login">Войти в систему</router-link>
      </p>

      <!-- ОШИБКИ -->
      <transition name="fade">
        <div v-if="error" class="error-box">⚠️ {{ error }}</div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { supabase } from '@/supabase';
import { useAppStore } from '@/stores/appStore';

const router = useRouter();
const appStore = useAppStore();

const loading = ref(false);
const error = ref('');
const showP = ref(false);
const showCP = ref(false);

const form = reactive({
  first_name: '', last_name: '', otchestvo: '',
  city: '', email: '', phone: '',
  password: '', confirmPassword: ''
});

onMounted(() => { 
  if (appStore.city) form.city = appStore.city; 
});

const handleRegister = async () => {
  if (!form.email && !form.phone) return error.value = 'Укажите Email или Телефон для связи';
  if (form.password.length < 6) return error.value = 'Пароль должен быть не менее 6 символов';
  if (form.password !== form.confirmPassword) return error.value = 'Введенные пароли не совпадают';

  loading.value = true;
  error.value = '';

  try {
    const res = await axios.post('/api/users/register', form);
    saveSession(res.data);
  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка при создании аккаунта. Возможно, почта уже занята.';
  } finally {
    loading.value = false;
  }
};

const socialRegister = async (provider) => {
    loading.value = true;
    const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: { 
            redirectTo: window.location.origin + '/profile' 
        }
    });
    if (authError) {
        error.value = authError.message;
        loading.value = false;
    }
};

const saveSession = (user) => {
    localStorage.setItem('user_id', user.id);
    localStorage.setItem('role', user.role || 'user');
    localStorage.setItem('user_name', user.first_name);
    localStorage.setItem('user_avatar', user.avatar_url);
    
    if (user.saved_address) appStore.setCity(user.saved_address);
    
    router.push('/');
    setTimeout(() => window.location.reload(), 100);
};
</script>

<style scoped>


@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-page {
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--bg-body);
  animation: fadeIn 0.5s ease-out;
}

/* ЗАГОЛОВОК */
.auth-header {
  text-align: center;
  margin-bottom: 35px;
  animation: fadeSlideUp 0.6s ease-out;
}

.auth-header h1 {
  font-size: 2.5rem;
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

.auth-header p {
  color: var(--text-muted);
  max-width: 500px;
  margin: 0 auto;
  font-size: 1rem;
}

/* КАРТОЧКА ФОРМЫ */
.auth-card {
  background: var(--bg-card);
  backdrop-filter: blur(4px);
  width: 100%;
  max-width: 700px;
  padding: 48px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  transition: transform 0.3s, box-shadow 0.3s;
  animation: fadeSlideUp 0.7s ease-out;
}

.auth-card:hover {
  box-shadow: var(--shadow-xl);
}

/* ========== ИСПРАВЛЕННЫЕ СЕТКИ ДЛЯ РОВНОГО ВЫРАВНИВАНИЯ ========== */
.input-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
  align-items: start;
}

.input-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
  align-items: start;
}

.full-width {
  margin-bottom: 24px;
}

/* ОБЩИЕ СТИЛИ ДЛЯ ВСЕХ ОБЁРТОК ПОЛЕЙ */
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.input-wrapper label {
  font-weight: 800;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  transition: color 0.2s;
}

/* ЕДИНАЯ ВЫСОТА ДЛЯ ВСЕХ ПОЛЕЙ ВВОДА */
.input-wrapper input,
.pass-input-wrap input {
  width: 100%;
  height: 46px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  border: 1.5px solid var(--border-color);
  font-size: 0.95rem;
  color: var(--text-main);
  box-sizing: border-box;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}

.input-wrapper input:focus {
  border-color: var(--primary);
  background: var(--bg-card);
  box-shadow: 0 0 0 4px var(--primary-light);
  outline: none;
  transform: scale(1.01);
}

/* ПАРОЛЬ С ГЛАЗКОМ */
.pass-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.pass-input-wrap input {
  flex: 1;
  padding-right: 45px;
}

.eye-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
  padding: 4px;
  z-index: 2;
}

.eye-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* ПОДСКАЗКИ */
small {
  display: block;
  margin-top: 6px;
  font-size: 0.7rem;
  color: var(--text-muted);
  letter-spacing: 0.3px;
  line-height: 1.2;
}

/* КНОПКА РЕГИСТРАЦИИ */
.btn-register {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--success), var(--success-hover));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 1px;
  margin-top: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  position: relative;
  overflow: hidden;
}

.btn-register::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn-register:hover::before {
  left: 100%;
}

.btn-register:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(16, 185, 129, 0.45);
}

.btn-register:active {
  transform: translateY(0);
}

.btn-register:disabled {
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
.social-btn {
  width: 100%;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1.5px solid var(--border-color);
  color: var(--text-main);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  backdrop-filter: blur(4px);
}

.social-btn:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  background: var(--primary-light);
}

.social-btn img {
  width: 22px;
  height: 22px;
}

/* ФУТЕР ССЫЛКА */
.auth-footer {
  margin-top: 32px;
  font-size: 0.95rem;
  color: var(--text-muted);
  text-align: center;
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

/* СООБЩЕНИЕ ОБ ОШИБКЕ */
.error-box {
  margin-top: 24px;
  padding: 14px 18px;
  background: var(--danger-light);
  color: var(--danger);
  border-radius: var(--radius-md);
  text-align: center;
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
@media (max-width: 768px) {
  .auth-page {
    padding: 30px 16px;
  }
  
  .auth-header h1 {
    font-size: 1.8rem;
  }
  
  .auth-card {
    padding: 28px 20px;
    box-shadow: var(--shadow-md);
  }
  
  .input-grid-3,
  .input-grid-2 {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .btn-register {
    padding: 14px;
    font-size: 0.95rem;
  }
  
  .social-btn {
    padding: 12px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 24px 16px;
  }
  
  .auth-header h1 {
    font-size: 1.6rem;
  }
  
  .social-btn img {
    width: 18px;
  }
}

/* ТЁМНАЯ ТЕМА – ДОПОЛНИТЕЛЬНЫЕ ПРАВКИ */
body.dark-theme .input-wrapper input:focus {
  background: var(--bg-card);
}

body.dark-theme .social-btn:hover {
  background: rgba(99, 102, 241, 0.15);
}
</style>