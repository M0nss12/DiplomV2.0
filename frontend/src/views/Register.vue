<template>
  <div class="auth-page">
    <section>
      <h1>Регистрация в ApexDrive</h1>
      <p>Введите ваши данные для создания личного профиля</p>
    </section>

    <form @submit.prevent="handleRegister">
      <!-- ФИО Блок -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
        <div>
          <label>Фамилия *</label><br />
          <input v-model="form.last_name" type="text" placeholder="Иванов" required style="width: 90%;" />
        </div>
        <div>
          <label>Имя *</label><br />
          <input v-model="form.first_name" type="text" placeholder="Иван" required style="width: 90%;" />
        </div>
        <div>
          <label>Отчество *</label><br />
          <input v-model="form.otchestvo" type="text" placeholder="Иванович" required style="width: 90%;" />
        </div>
      </div>

      <br />

      <!-- Город -->
      <div>
        <label>📍 Населенный пункт (Город / Поселок) *</label><br />
        <input 
          v-model="form.city" 
          type="text" 
          placeholder="Напр. Иркутск" 
          required 
          style="width: 100%; padding: 10px;"
        />
        <p><small>Мы подберем ближайшие пункты выдачи в этом месте</small></p>
      </div>

      <br />

      <!-- Контакты -->
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1;">
          <label>📞 Телефон</label><br />
          <input v-model="form.phone" type="tel" placeholder="89001112233" style="width: 100%;" />
        </div>
        <div style="flex: 1;">
          <label>✉️ Email</label><br />
          <input v-model="form.email" type="email" placeholder="example@mail.com" style="width: 100%;" />
        </div>
      </div>
      <p><small>* Укажите хотя бы один способ связи</small></p>

      <br />

      <!-- Пароль -->
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1;">
          <label>🔒 Пароль *</label><br />
          <div style="display: flex; gap: 5px;">
            <input :type="showP ? 'text' : 'password'" v-model="form.password" required style="flex: 1;" />
            <button type="button" @click="showP = !showP">{{ showP ? '🙈' : '👁️' }}</button>
          </div>
        </div>
        <div style="flex: 1;">
          <label>🔒 Повтор пароля *</label><br />
          <div style="display: flex; gap: 5px;">
            <input :type="showCP ? 'text' : 'password'" v-model="form.confirmPassword" required style="flex: 1;" />
            <button type="button" @click="showCP = !showCP">{{ showCP ? '🙈' : '👁️' }}</button>
          </div>
        </div>
      </div>

      <br />

      <button type="submit" :disabled="loading" style="width: 100%; padding: 15px; background: #2c3e50; color: white; cursor: pointer; font-weight: bold;">
        {{ loading ? 'Создание аккаунта...' : 'ЗАРЕГИСТРИРОВАТЬСЯ' }}
      </button>

      <p style="text-align: center;">Уже есть аккаунт? <router-link to="/login">Войти</router-link></p>
    </form>

    <div v-if="error" style="color: red; margin-top: 20px; font-weight: bold; text-align: center;">
      ⚠️ {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAppStore } from '@/stores/appStore';

const router = useRouter();
const appStore = useAppStore();

const loading = ref(false);
const error = ref('');
const showP = ref(false);
const showCP = ref(false);

const form = ref({
  first_name: '',
  last_name: '',
  otchestvo: '',
  city: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
});

onMounted(() => {
    if (appStore.city) form.value.city = appStore.city;
});

const handleRegister = async () => {
  if (!form.value.email && !form.value.phone) {
    error.value = 'Заполните хотя бы один контакт (Email или Телефон)';
    return;
  }
  if (form.value.password.length < 6) {
    error.value = 'Пароль слишком короткий (мин. 6 символов)';
    return;
  }
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Пароли не совпадают';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const res = await axios.post('/api/users/register', {
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      otchestvo: form.value.otchestvo,
      city: form.value.city,
      email: form.value.email || null,
      phone: form.value.phone || null,
      password: form.value.password
    });

    localStorage.setItem('user_id', res.data.id);
    localStorage.setItem('user_name', res.data.first_name);
    localStorage.setItem('user_avatar', res.data.avatar_url);
    
    appStore.setCity(form.value.city);

    alert('Регистрация успешна!');
    router.push('/');
    setTimeout(() => window.location.reload(), 100);

  } catch (err) {
    error.value = err.response?.data?.error || 'Ошибка регистрации. Возможно, Email или Телефон уже заняты.';
  } finally {
    loading.value = false;
  }
};
</script>