<template>
  <div class="auth-page">
    <section class="auth-header">
      <h1>Регистрация в <span class="highlight">ApexDrive</span></h1>
      <p>Создайте профиль за пару минут, чтобы получить доступ к истории заказов и гаражу</p>
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
import { supabase } from '@/supabase'; // Импорт общего клиента
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

// 1. ОБЫЧНАЯ РЕГИСТРАЦИЯ
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

// 2. СОЦИАЛЬНАЯ РЕГИСТРАЦИЯ (Google)
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

// 3. СОХРАНЕНИЕ СЕССИИ
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
.auth-page {
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background-color: var(--bg-body);
}

.auth-header { text-align: center; margin-bottom: 35px; }
.auth-header h1 { font-size: 2.4rem; margin-bottom: 8px; font-weight: 800; }
.highlight { color: var(--primary); background: var(--primary-light); padding: 0 10px; border-radius: 8px; }
.auth-header p { color: var(--text-muted); max-width: 500px; margin: 0 auto; }

.auth-card {
  background: var(--bg-card);
  width: 100%;
  max-width: 650px;
  padding: 45px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  animation: fadeIn 0.5s ease-out;
}

/* СЕТКИ */
.input-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
.input-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
.full-width { margin-bottom: 20px; }

.input-wrapper label {
  display: block;
  font-weight: 700;
  font-size: 0.75rem;
  margin-bottom: 8px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  border: 1.5px solid transparent;
  transition: 0.3s;
  font-size: 0.95rem;
}

.input-wrapper input:focus {
  background: #fff;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

/* ПАРОЛЬ */
.pass-input-wrap { position: relative; display: flex; align-items: center; }
.eye-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  opacity: 0.5;
}

/* КНОПКА */
.btn-register {
  width: 100%;
  padding: 18px;
  background: var(--success);
  color: white;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: 800;
  margin-top: 15px;
  box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
  cursor: pointer;
}

.btn-register:hover:not(:disabled) {
  background: var(--success-hover);
  transform: translateY(-2px);
}

/* СОЦИАЛЬНЫЕ */
.separator {
  margin: 35px 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.separator::before {
  content: ""; position: absolute; width: 100%; height: 1px; background: var(--border-color);
}
.separator span {
  position: relative; background: var(--bg-card); padding: 0 20px; color: var(--text-muted); font-size: 0.9rem;
}

.social-btn {
  width: 100%;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1.5px solid var(--border-color);
  color: var(--text-main);
  font-weight: 700;
  cursor: pointer;
}
.social-btn:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow-md); }
.social-btn img { width: 24px; }

.auth-footer { margin-top: 35px; font-size: 1rem; color: var(--text-muted); text-align: center; }
.auth-footer a { font-weight: 800; color: var(--primary); }

.error-box {
  margin-top: 25px;
  padding: 15px;
  background: var(--danger-light);
  color: var(--danger);
  border-radius: var(--radius-md);
  text-align: center;
  font-weight: 700;
  border: 1.5px solid var(--danger);
  animation: shake 0.4s;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }

@media (max-width: 768px) {
  .input-grid-3, .input-grid-2 { grid-template-columns: 1fr; gap: 20px; }
  .auth-card { padding: 30px 20px; border: none; box-shadow: none; background: transparent; }
}
</style>