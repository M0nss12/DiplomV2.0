<template>
  <div class="settings-page">
    <div v-if="user" class="settings-container card-shadow">
      <div class="settings-header">
        <h1>Настройки профиля</h1>
        <router-link to="/profile" class="back-link">← Вернуться в кабинет</router-link>
      </div>

      <!-- 1. БЛОК АВАТАРА -->
      <section class="avatar-section">
        <div class="avatar-main">
          <img :src="user.avatar_url" class="current-avatar-img" />
          <input type="file" @change="handleCustomPhoto" id="avatar-file" style="display:none" accept="image/*" />
          <button @click="triggerFile" class="btn-upload">📷 Загрузить фото</button>
        </div>
        
        <div class="avatar-picker">
          <p class="section-subtitle">Или выберите готовый аватар:</p>
          <div class="avatar-grid">
            <img 
              v-for="url in defaultAvatars" 
              :key="url" 
              :src="url" 
              @click="user.avatar_url = url"
              class="avatar-option"
              :class="{ 'is-selected': user.avatar_url === url }"
            />
          </div>
        </div>
      </section>

      <hr class="section-divider" />

      <!-- 2. ДАННЫЕ (ФИО) -->
      <section class="data-section">
        <h3 class="section-title">🔸 Основная информация</h3>
        <div class="input-grid-3">
          <div class="field-box">
            <label>Фамилия</label>
            <input v-model="user.last_name" placeholder="Иванов" />
          </div>
          <div class="field-box">
            <label>Имя *</label>
            <input v-model="user.first_name" placeholder="Иван" />
          </div>
          <div class="field-box">
            <label>Отчество</label>
            <input v-model="user.otchestvo" placeholder="Иванович" />
          </div>
        </div>
        
        <div class="input-grid-2">
          <div class="field-box">
            <label>Email</label>
            <input v-model="user.email" placeholder="example@mail.com" />
          </div>
          <div class="field-box">
            <label>Телефон</label>
            <input v-model="user.phone_number" placeholder="+7 (___) ___-__-__" />
          </div>
        </div>
      </section>

      <!-- 3. НАСЕЛЕННЫЙ ПУНКТ -->
      <section class="region-section">
        <h3 class="section-title">📍 Ваш регион</h3>
        <div class="field-box">
          <label>Населенный пункт (Город / Поселок)</label>
          <input v-model="user.saved_address" placeholder="Напр. г. Ангарск" class="full-input" />
        </div>
        <div class="checkbox-box">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="user.allows_data_saving" />
            <span class="checkmark"></span>
            Сохранять мои данные для будущих заказов
          </label>
        </div>
      </section>

      <!-- 4. ПАРОЛЬ -->
      <section class="password-section">
        <h3 class="section-title">🔒 Безопасность</h3>
        <div class="input-grid-3">
          <div v-for="field in ['old', 'new', 'confirm']" :key="field" class="field-box">
            <label>{{ field === 'old' ? 'Текущий пароль' : field === 'new' ? 'Новый пароль' : 'Повтор пароля' }}</label>
            <div class="password-input-wrap">
              <input v-model="passwords[field]" :type="visibility[field] ? 'text' : 'password'" />
              <button type="button" @click="visibility[field] = !visibility[field]" class="eye-btn">
                {{ visibility[field] ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ФУТЕР КНОПКИ -->
      <div class="settings-footer">
        <button @click="$router.push('/profile')" class="btn-cancel">Отмена</button>
        <button @click="saveChanges" class="btn-save">
          <span>💾</span> СОХРАНИТЬ ВСЁ
        </button>
      </div>
    </div>

    <!-- ЗАГРУЗКА -->
    <div v-else class="loading-container">
      <div v-if="!errorMessage" class="loading-box">
        <div class="loader"></div>
        <h2>Загрузка профиля...</h2>
      </div>
      <div v-else class="error-box">
        <h2>⚠️ {{ errorMessage }}</h2>
        <button @click="logout" class="btn-login-redirect">Войти заново</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAppStore } from '@/stores/appStore';

const router = useRouter();
const appStore = useAppStore();

const user = ref(null);
const errorMessage = ref('');
const defaultAvatars = ref([]);
const passwords = reactive({ old: '', new: '', confirm: '' });
const visibility = reactive({ old: false, new: false, confirm: false });

const loadData = async () => {
  const userId = localStorage.getItem('user_id');
  if (!userId) { router.push('/login'); return; }

  try {
    const [uRes, aRes] = await Promise.all([
      axios.get(`/api/users/profile/${userId}`),
      axios.get('/api/users/default-avatars')
    ]);
    user.value = uRes.data;
    defaultAvatars.value = aRes.data;
  } catch (e) { 
      console.error(e);
      errorMessage.value = e.response?.status === 404 ? "Пользователь не найден." : "Ошибка связи с сервером.";
  }
};

const triggerFile = () => document.getElementById('avatar-file').click();

const handleCustomPhoto = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await axios.post('/api/upload/avatars', formData);
    user.value.avatar_url = res.data.url;
    alert("Фото загружено. Нажмите 'Сохранить всё' внизу.");
  } catch (err) { alert("Ошибка при загрузке фото"); }
};

const saveChanges = async () => {
  const userId = localStorage.getItem('user_id');

  // 1. Обработка пароля (если заполнено поле нового пароля)
  if (passwords.new) {
    if (!passwords.old) return alert("Введите текущий пароль для подтверждения");
    if (passwords.new.length < 6) return alert("Новый пароль слишком короткий");
    if (passwords.new !== passwords.confirm) return alert("Новые пароли не совпадают");

    try {
      await axios.post(`/api/users/change-password/${userId}`, {
        oldPassword: passwords.old,
        newPassword: passwords.new
      });
      // Очистка полей
      passwords.old = ''; passwords.new = ''; passwords.confirm = '';
    } catch (e) {
      alert(e.response?.data?.error || "Ошибка при смене пароля");
      return; // Останавливаем сохранение профиля, если пароль не подошел
    }
  }

  // 2. Сохранение профиля
  try {
    // Удаляем из отправки хэш пароля (он меняется только через спец. роут выше)
    const { password_hash, ...updateData } = user.value;

    const res = await axios.put(`/api/users/profile/${userId}`, updateData);
    user.value = res.data;

    if (user.value.saved_address) {
        appStore.setCity(user.value.saved_address);
    }

    localStorage.setItem('user_name', user.value.first_name);
    localStorage.setItem('user_avatar', user.value.avatar_url);

    alert("Данные успешно сохранены!");
  } catch (e) { 
      alert("Ошибка сохранения профиля"); 
  }
};

const logout = () => {
    localStorage.clear();
    router.push('/login');
};

onMounted(loadData);
</script>

<style scoped>
.settings-page {
    padding: 60px 20px;
    display: flex;
    justify-content: center;
    min-height: 100vh;
    animation: fadeIn 0.5s ease-out;
}

.settings-container {
    width: 100%;
    max-width: 900px;
    background: var(--bg-card);
    padding: 40px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
}

.settings-header {
    margin-bottom: 40px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.settings-header h1 {
    font-size: 2.2rem;
    margin: 0;
    font-weight: 800;
}

.back-link {
    font-weight: 600;
    color: var(--primary);
    font-size: 0.95rem;
}

/* 1. АВАТАР */
.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;
    padding: 20px 0;
}

.avatar-main {
    text-align: center;
    position: relative;
}

.current-avatar-img {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid var(--bg-card);
    box-shadow: 0 0 0 3px var(--primary);
    transition: var(--transition);
}

.btn-upload {
    display: block;
    margin: 15px auto 0;
    background: var(--bg-input);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-main);
    border: 1px solid var(--border-color);
}

.btn-upload:hover {
    background: var(--primary-light);
    color: var(--primary);
    border-color: var(--primary);
}

.avatar-picker {
    width: 100%;
    text-align: center;
}

.section-subtitle {
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 15px;
}

.avatar-grid {
    display: flex;
    justify-content: center;
    gap: 15px;
    flex-wrap: wrap;
}

.avatar-option {
    width: 55px;
    height: 55px;
    border-radius: 50%;
    cursor: pointer;
    border: 3px solid transparent;
    transition: var(--transition);
    opacity: 0.6;
}

.avatar-option:hover {
    transform: translateY(-4px);
    opacity: 1;
}

.avatar-option.is-selected {
    border-color: var(--primary);
    opacity: 1;
    box-shadow: var(--shadow-md);
}

.section-divider {
    margin: 40px 0;
}

/* 2. СЕКЦИИ ДАННЫХ */
.section-title {
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 25px;
}

.input-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 25px;
}

.input-grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}

.field-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.field-box label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.field-box input {
    width: 100%;
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    background: var(--bg-input);
    border: 2px solid transparent;
    font-size: 1rem;
    color: var(--text-main);
    transition: var(--transition);
}

.field-box input:focus {
    background: #fff;
    border-color: var(--primary);
    box-shadow: 0 0 0 4px var(--primary-light);
}

/* СПЕЦИАЛЬНЫЕ ФОНЫ */
.region-section {
    background: var(--primary-light);
    padding: 30px;
    border-radius: var(--radius-md);
    margin: 40px 0;
    border: 1px solid rgba(79, 70, 229, 0.1);
}

.password-section {
    background: var(--danger-light);
    padding: 30px;
    border-radius: var(--radius-md);
    margin-bottom: 40px;
    border: 1px solid rgba(244, 63, 94, 0.1);
}

/* ПАРОЛЬ С ГЛАЗОМ */
.password-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.eye-btn {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    opacity: 0.5;
}

.eye-btn:hover { opacity: 1; }

/* ЧЕКБОКС */
.checkbox-box {
    margin-top: 20px;
}

.custom-checkbox {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
}

/* КНОПКИ */
.settings-footer {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
}

.btn-cancel {
    background: var(--bg-input);
    padding: 12px 30px;
    border-radius: var(--radius-md);
    font-weight: 700;
    color: var(--text-muted);
}

.btn-cancel:hover {
    background: var(--border-color);
    color: var(--text-main);
}

.btn-save {
    background: var(--accent) !important;
    color: #fff !important;
    padding: 12px 40px;
    border-radius: var(--radius-md);
    font-weight: 800;
    box-shadow: 0 8px 20px rgba(228, 77, 38, 0.3);
}

.btn-save:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 25px rgba(228, 77, 38, 0.4);
}

/* СОСТОЯНИЯ ЗАГРУЗКИ */
.loading-container {
    padding: 100px;
    text-align: center;
}

.loader {
    width: 50px;
    height: 50px;
    border: 5px solid var(--primary-light);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* АДАПТИВНОСТЬ */
@media (max-width: 768px) {
    .settings-container { padding: 25px; }
    .input-grid-3, .input-grid-2 { grid-template-columns: 1fr; }
    .settings-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .settings-footer { flex-direction: column-reverse; }
    .settings-footer button { width: 100%; }
    .current-avatar-img { width: 100px; height: 100px; }
}

/* DARK THEME FIXES */
body.dark-theme .field-box input:focus {
    background: var(--bg-card);
}
body.dark-theme .region-section,
body.dark-theme .password-section {
    background: rgba(255, 255, 255, 0.03);
}
</style>