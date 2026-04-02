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
          <div class="avatar-wrapper">
            <img :src="user.avatar_url" class="current-avatar-img" />
            <div class="avatar-overlay" @click="triggerFile">
              <span class="camera-icon">📷</span>
            </div>
          </div>
          <input type="file" @change="handleCustomPhoto" id="avatar-file" style="display:none" accept="image/*" />
          <button @click="triggerFile" class="btn-upload">Загрузить фото</button>
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulseGlow {
  0% {
    box-shadow: 0 0 0 0 var(--primary-light);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(230, 57, 70, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(230, 57, 70, 0);
  }
}

.settings-page {
  padding: 60px 20px;
  display: flex;
  justify-content: center;
  min-height: 100vh;
  animation: fadeIn 0.5s ease-out;
  background: var(--bg-body);
}

.settings-container {
  width: 100%;
  max-width: 1000px;
  background: var(--bg-card);
  backdrop-filter: blur(4px);
  padding: 48px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  transition: transform 0.3s, box-shadow 0.3s;
}

.settings-container:hover {
  box-shadow: var(--shadow-lg);
}

/* ШАПКА */
.settings-header {
  margin-bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
}

.settings-header h1 {
  font-size: 2.2rem;
  margin: 0;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: var(--primary);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  padding: 6px 0;
}

.back-link:hover {
  transform: translateX(-6px);
  text-shadow: 0 0 2px var(--primary-light);
}

/* АВАТАР */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 20px 0;
}

.avatar-main {
  text-align: center;
  position: relative;
}

.avatar-wrapper {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 auto;
  cursor: pointer;
}

.current-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--bg-card);
  box-shadow: 0 0 0 3px var(--primary);
  transition: all 0.3s ease;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-wrapper:hover .current-avatar-img {
  transform: scale(1.02);
}

.camera-icon {
  font-size: 2rem;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.btn-upload {
  display: inline-block;
  margin: 16px auto 0;
  background: var(--bg-input);
  padding: 8px 20px;
  border-radius: 40px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-main);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}

.btn-upload:hover {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary);
  transform: translateY(-2px);
}

.avatar-picker {
  width: 100%;
  text-align: center;
}

.section-subtitle {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 16px;
  letter-spacing: 0.3px;
}

.avatar-grid {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.avatar-option {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  opacity: 0.7;
  object-fit: cover;
}

.avatar-option:hover {
  transform: translateY(-5px) scale(1.05);
  opacity: 1;
}

.avatar-option.is-selected {
  border-color: var(--primary);
  opacity: 1;
  box-shadow: 0 0 0 3px var(--primary-light);
}

.section-divider {
  margin: 40px 0;
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), var(--accent), transparent);
}

/* СЕКЦИИ ДАННЫХ */
.section-title {
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-main);
}

.input-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.input-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.field-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-box label {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.field-box input {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  border: 2px solid transparent;
  font-size: 0.95rem;
  color: var(--text-main);
  transition: all 0.3s;
}

.field-box input:focus {
  background: var(--bg-card);
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
  outline: none;
  transform: scale(1.01);
}

/* РЕГИОН (СИНИЙ ОТТЕНОК) */
.region-section {
  background: linear-gradient(145deg, var(--primary-light), transparent);
  padding: 28px 32px;
  border-radius: var(--radius-md);
  margin: 40px 0;
  border: 1px solid rgba(79, 70, 229, 0.15);
  transition: all 0.3s;
}

.region-section:hover {
  box-shadow: var(--shadow-sm);
}

/* ПАРОЛЬ (РОЗОВЫЙ ОТТЕНОК) */
.password-section {
  background: linear-gradient(145deg, var(--danger-light), transparent);
  padding: 28px 32px;
  border-radius: var(--radius-md);
  margin-bottom: 40px;
  border: 1px solid rgba(244, 63, 94, 0.15);
  transition: all 0.3s;
}

.password-section:hover {
  box-shadow: var(--shadow-sm);
}

/* ПОЛЕ ПАРОЛЯ С ГЛАЗКОМ */
.password-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrap input {
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
}

.eye-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* ЧЕКБОКС */
.checkbox-box {
  margin-top: 24px;
}

.custom-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-main);
  user-select: none;
}

.custom-checkbox input {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 5px;
  display: inline-block;
  position: relative;
  transition: all 0.2s;
}

.custom-checkbox input:checked + .checkmark {
  background: var(--primary);
  border-color: var(--primary);
}

.custom-checkbox input:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.custom-checkbox:hover .checkmark {
  border-color: var(--primary);
}

/* КНОПКИ ДЕЙСТВИЙ */
.settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  margin-top: 40px;
}

.btn-cancel {
  background: var(--bg-input);
  padding: 12px 32px;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}

.btn-cancel:hover {
  background: var(--danger-light);
  color: var(--danger);
  border-color: var(--danger);
  transform: translateY(-2px);
}

.btn-save {
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  color: white !important;
  padding: 12px 44px;
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 1px;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-shadow: 0 8px 20px rgba(228, 77, 38, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-save:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(228, 77, 38, 0.45);
}

.btn-save:active {
  transform: translateY(0);
}

/* ЛОАДЕР */
.loading-container {
  padding: 100px;
  text-align: center;
}

.loading-box {
  background: var(--bg-card);
  padding: 40px;
  border-radius: var(--radius-lg);
  max-width: 400px;
  margin: 0 auto;
}

.loader {
  width: 60px;
  height: 60px;
  border: 4px solid var(--primary-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 24px;
}

.loading-box h2 {
  color: var(--text-muted);
  font-size: 1.2rem;
  font-weight: 600;
}

.error-box {
  background: var(--danger-light);
  padding: 40px;
  border-radius: var(--radius-lg);
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}

.error-box h2 {
  color: var(--danger);
  margin-bottom: 20px;
}

.btn-login-redirect {
  background: var(--primary);
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 700;
  border: none;
  cursor: pointer;
}

/* АДАПТИВНОСТЬ */
@media (max-width: 992px) {
  .settings-container {
    padding: 32px;
  }
}

@media (max-width: 768px) {
  .settings-page {
    padding: 40px 16px;
  }
  
  .settings-container {
    padding: 24px;
  }
  
  .input-grid-3,
  .input-grid-2 {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .settings-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .settings-footer {
    flex-direction: column-reverse;
    gap: 12px;
  }
  
  .settings-footer button {
    width: 100%;
    justify-content: center;
  }
  
  .region-section,
  .password-section {
    padding: 20px;
  }
  
  .avatar-wrapper {
    width: 110px;
    height: 110px;
  }
  
  .avatar-option {
    width: 50px;
    height: 50px;
  }
}

@media (max-width: 480px) {
  .avatar-grid {
    gap: 10px;
  }
  
  .avatar-option {
    width: 45px;
    height: 45px;
  }
}

/* ТЁМНАЯ ТЕМА – ДОПОЛНИТЕЛЬНЫЕ ПРАВКИ */
body.dark-theme .region-section,
body.dark-theme .password-section {
  background: rgba(255, 255, 255, 0.03);
}

body.dark-theme .field-box input:focus {
  background: var(--bg-card);
}
</style>