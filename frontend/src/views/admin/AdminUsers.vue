<template>
  <div class="admin-users">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>👥 Управление пользователями</h1>
        <p class="subtitle">Редактирование профилей, управление аватарами и ролями</p>
      </div>
      <div class="stats-badge">
        <span class="stats-icon">📊</span>
        Всего: <b>{{ filteredUsers.length }}</b>
      </div>
    </div>

    <!-- 1. ФОРМА СОЗДАНИЯ (улучшенная) -->
    <section class="admin-card create-card">
      <div class="card-header">
        <h3 class="card-title">✨ Добавить пользователя</h3>
        <div class="card-decoration"></div>
      </div>
      <form @submit.prevent="createUser" class="admin-form">
        <div class="input-grid">
          <div class="input-group">
            <label>📛 Фамилия</label>
            <input v-model="newUser.last_name" placeholder="Иванов" />
          </div>
          <div class="input-group">
            <label>📛 Имя *</label>
            <input v-model="newUser.first_name" placeholder="Иван" required />
          </div>
          <div class="input-group">
            <label>📛 Отчество</label>
            <input v-model="newUser.otchestvo" placeholder="Иванович" />
          </div>
          <div class="input-group">
            <label>📧 Email</label>
            <input v-model="newUser.email" type="email" placeholder="mail@example.com" />
          </div>
          <div class="input-group">
            <label>📞 Телефон</label>
            <input v-model="newUser.phone_number" placeholder="+7..." />
          </div>
          <div class="input-group">
            <label>👑 Роль</label>
            <select v-model="newUser.role">
              <option value="guest">Гость</option>
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <div class="input-group">
            <label>🔒 Пароль</label>
            <input v-model="newUser.password_hash" type="password" placeholder="Задайте пароль..." />
          </div>
        </div>
        <div class="form-footer">
          <button type="submit" class="btn-primary">
            <span class="btn-icon">✨</span> Создать аккаунт
          </button>
        </div>
      </form>
    </section>

    <!-- 2. ФИЛЬТРЫ (продвинутые) -->
    <section class="admin-card filter-section">
      <div class="filter-header">
        <h3 class="card-title">🔍 Фильтры и поиск</h3>
        <button @click="resetFilters" class="btn-text-link">Сбросить всё</button>
      </div>
      <div class="filter-grid">
        <div class="input-group search-group">
          <label>🔎 Умный поиск</label>
          <input v-model="searchQuery" placeholder="ФИО, Email, Телефон, ID..." />
        </div>
        <div class="input-group">
          <label>👑 Роль</label>
          <select v-model="roleFilter">
            <option value="all">Все роли</option>
            <option value="admin">Администраторы</option>
            <option value="user">Пользователи</option>
            <option value="guest">Гости</option>
          </select>
        </div>
        <div class="input-group">
          <label>📊 Сортировка</label>
          <select v-model="sortOrder">
            <option value="new">Сначала новые</option>
            <option value="old">Сначала старые</option>
            <option value="name">По имени (А→Я)</option>
          </select>
        </div>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ (премиум) -->
    <div class="table-container">
      <div class="table-meta">
        <span class="meta-icon">📄</span>
        Страница {{ currentPage }} из {{ totalPages || 1 }}
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-avatar">Аватар</th>
              <th>ID / ФИО</th>
              <th>Контакты</th>
              <th class="text-center">Роль / Согласие</th>
              <th>Адрес (Город)</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in paginatedUsers" :key="u.id" class="user-row">
              <td class="col-avatar">
                <div class="avatar-edit-box">
                  <img :src="u.avatar_url" 
                       class="table-avatar clickable" 
                       @click="openImagePreview(u.avatar_url)"
                       title="Нажмите для просмотра"
                       @error="u.avatar_url = defaultAvatars[0]" />
                  <button @click="openAvatarPicker(u)" class="btn-edit-avatar" title="Сменить аватар">✎</button>
                </div>
              </td>

              <td>
                <div class="client-id">ID: #{{ u.id }}</div>
                <div class="name-edit-row">
                  <input v-model="u.last_name" @change="updateUser(u)" class="inline-edit bold" placeholder="Фамилия" />
                  <input v-model="u.first_name" @change="updateUser(u)" class="inline-edit bold" placeholder="Имя" />
                  <input v-model="u.otchestvo" @change="updateUser(u)" class="inline-edit" placeholder="Отчество" />
                </div>
                <div class="date-tag">Рег: {{ formatDate(u.created_at) }}</div>
              </td>

              <td>
                <div class="contact-fields">
                  <input v-model="u.email" @change="updateUser(u)" class="inline-edit" placeholder="Email" />
                  <input v-model="u.phone_number" @change="updateUser(u)" class="inline-edit" placeholder="Телефон" />
                </div>
              </td>

              <td class="text-center">
                <div class="role-control">
                  <select v-model="u.role" @change="updateUser(u)" class="role-select" :class="u.role">
                    <option value="guest">Гость</option>
                    <option value="user">Пользователь</option>
                    <option value="admin">Админ</option>
                  </select>
                </div>
                <div class="consent-control">
                  <label class="custom-checkbox">
                    <input type="checkbox" v-model="u.allows_data_saving" @change="updateUser(u)" />
                    <span class="checkmark"></span>
                    <span class="consent-text">Согласие на обработку</span>
                  </label>
                </div>
              </td>

              <td>
                <textarea v-model="u.saved_address" @change="updateUser(u)" class="inline-edit address-input" placeholder="Город не указан"></textarea>
              </td>

              <td class="text-right action-buttons">
                <button @click="resetUserPassword(u)" class="btn-secondary-small" title="Сбросить пароль">🔑 Пароль</button>
                <button @click="deleteUser(u)" class="btn-delete-small" title="Удалить пользователя">🗑️ Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ПАГИНАЦИЯ -->
      <div v-if="totalPages > 1" class="pagination-wrapper">
        <button @click="currentPage--" :disabled="currentPage === 1" class="p-btn">←</button>
        <div class="p-numbers">
          <button v-for="p in totalPages" :key="p" @click="currentPage = p" :class="{ active: currentPage === p }">{{ p }}</button>
        </div>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-btn">→</button>
      </div>
    </div>

    <!-- МОДАЛКА ВЫБОРА АВАТАРА -->
    <div v-if="showAvatarPicker" class="modal-overlay" @click.self="showAvatarPicker = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Аватар для {{ editingUser?.first_name }}</h3>
          <button @click="showAvatarPicker = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p class="section-label">🎨 Выбрать стандартный:</p>
          <div class="avatar-grid">
            <img v-for="url in defaultAvatars" :key="url" :src="url" @click="setAvatar(url)" class="avatar-option" />
          </div>
          <div class="upload-custom">
            <p class="section-label">📁 Или загрузить свой:</p>
            <label class="file-upload-label">
              <input type="file" @change="handleFileUpload" accept="image/*" hidden />
              <span>Выбрать файл</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- ФУЛЛ-СКРИН ПРОСМОТР ФОТО -->
    <div v-if="previewUrl" class="image-preview-overlay" @click="previewUrl = null">
      <div class="preview-container">
        <img :src="previewUrl" class="full-image" />
        <button class="close-preview" @click="previewUrl = null">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue';
import axios from 'axios';

const ADMIN_KEY = 'my_super_secret_admin_123';
const config = { headers: { 'x-admin-key': ADMIN_KEY } };

const users = ref([]);
const searchQuery = ref('');
const roleFilter = ref('all');
const sortOrder = ref('new');
const currentPage = ref(1);
const itemsPerPage = 20;

const defaultAvatars = ref([]);
const showAvatarPicker = ref(false);
const editingUser = ref(null);
const previewUrl = ref(null);

// Загрузка данных
const loadData = async () => {
  try {
    const [uRes, aRes] = await Promise.all([
      axios.get('/api/admin/users', config),
      axios.get('/api/users/default-avatars')
    ]);
    users.value = uRes.data;
    defaultAvatars.value = aRes.data;
  } catch (e) { console.error('Ошибка загрузки'); }
};

// Вспомогательные функции
const formatDate = (date) => date ? new Date(date).toLocaleDateString('ru-RU') : '';

const getFilenameFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  return parts.pop();
};

const isProtectedAvatar = (url) => {
  const filename = getFilenameFromUrl(url);
  const protectedNames = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png'];
  return protectedNames.includes(filename);
};

const deleteAvatarFromStorage = async (url) => {
  if (!url || isProtectedAvatar(url)) return;
  const filename = getFilenameFromUrl(url);
  try {
    await axios.delete(`/api/storage/avatars/${filename}`, config);
  } catch (e) { console.warn('Файл уже удалён'); }
};

// Просмотр фото
const openImagePreview = (url) => { if (url) previewUrl.value = url; };

// Управление аватарами
const openAvatarPicker = (user) => { editingUser.value = user; showAvatarPicker.value = true; };

const setAvatar = async (newUrl) => {
  await deleteAvatarFromStorage(editingUser.value.avatar_url);
  editingUser.value.avatar_url = newUrl;
  await updateUser(editingUser.value);
  showAvatarPicker.value = false;
};

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await axios.post('/api/upload/avatars', formData);
    await setAvatar(res.data.url);
  } catch (err) { alert('Ошибка загрузки файла'); }
};

// CRUD операции
const newUser = reactive({ first_name: '', last_name: '', otchestvo: '', email: '', phone_number: '', role: 'user', password_hash: '', allows_data_saving: false });

const createUser = async () => {
  try {
    const payload = { ...newUser, avatar_url: defaultAvatars.value[0] };
    const res = await axios.post('/api/admin/users', payload, config);
    users.value.unshift(res.data);
    Object.assign(newUser, { first_name: '', last_name: '', otchestvo: '', email: '', phone_number: '', role: 'user', password_hash: '' });
    alert('Пользователь создан');
  } catch (e) { alert('Ошибка создания'); }
};

const updateUser = async (user) => { await axios.put(`/api/admin/users/${user.id}`, user, config); };

const resetUserPassword = async (user) => {
  const newPass = prompt(`Новый пароль для ${user.first_name}:`);
  if (newPass && newPass.length >= 6) {
    await axios.put(`/api/admin/users/${user.id}`, { password_hash: newPass }, config);
    alert('Пароль изменён');
  } else if (newPass) alert('Пароль должен быть не менее 6 символов');
};

const deleteUser = async (user) => {
  if (!confirm(`Удалить пользователя ${user.first_name} ${user.last_name} и его аватар?`)) return;
  try {
    await deleteAvatarFromStorage(user.avatar_url);
    await axios.delete(`/api/admin/users/${user.id}`, config);
    users.value = users.value.filter(u => u.id !== user.id);
  } catch (e) { alert('Ошибка удаления'); }
};

// Фильтрация, сортировка, пагинация
const filteredUsers = computed(() => {
  let res = [...users.value];
  if (roleFilter.value !== 'all') res = res.filter(u => u.role === roleFilter.value);
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(u => 
      `${u.first_name} ${u.last_name} ${u.otchestvo || ''}`.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q) || 
      u.phone_number?.includes(q) ||
      u.id.toString() === q
    );
  }
  if (sortOrder.value === 'new') res.sort((a, b) => b.id - a.id);
  else if (sortOrder.value === 'old') res.sort((a, b) => a.id - b.id);
  else if (sortOrder.value === 'name') res.sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));
  return res;
});

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage));
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredUsers.value.slice(start, start + itemsPerPage);
});

const resetFilters = () => {
  searchQuery.value = '';
  roleFilter.value = 'all';
  sortOrder.value = 'new';
  currentPage.value = 1;
};

watch([searchQuery, roleFilter, sortOrder], () => { currentPage.value = 1; });

onMounted(loadData);
</script>

<style scoped>
/* ==========================================================================
   АДМИНКА: УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ – ПРЕМИУМ ДИЗАЙН
   ========================================================================== */

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulseGlow {
  0% { box-shadow: 0 0 0 0 var(--primary-light); }
  70% { box-shadow: 0 0 0 8px rgba(230, 57, 70, 0); }
  100% { box-shadow: 0 0 0 0 rgba(230, 57, 70, 0); }
}

.admin-users {
  padding: 40px 24px;
  animation: fadeSlideUp 0.5s ease-out;
  color: var(--text-main);
}

/* ШАПКА */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 32px;
}

.header-left h1 {
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0 0 6px 0;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--text-muted);
  margin: 0;
  font-size: 0.95rem;
}

.stats-badge {
  background: var(--bg-card);
  backdrop-filter: blur(4px);
  border: 1px solid var(--border-color);
  padding: 10px 20px;
  border-radius: 60px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-sm);
}

.stats-icon {
  font-size: 1.2rem;
}

/* КАРТОЧКИ (СТЕКЛО) */
.admin-card {
  background: var(--bg-card);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 28px;
  margin-bottom: 32px;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-shadow: var(--shadow-sm);
}

.admin-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.card-title {
  font-size: 1.35rem;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-decoration {
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  border-radius: 3px;
}

/* ФОРМА СОЗДАНИЯ */
.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 28px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.input-group input:focus,
.input-group select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
  outline: none;
  transform: scale(1.01);
}

.form-footer {
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(230, 57, 70, 0.4);
}

/* ФИЛЬТРЫ */
.filter-section {
  background: var(--bg-input);
  border-style: solid;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 24px;
  align-items: flex-end;
}

.btn-text-link {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: underline;
}

.btn-text-link:hover {
  transform: translateX(-3px);
  text-decoration: none;
}

/* ТАБЛИЦА */
.table-container {
  margin-top: 16px;
}

.table-meta {
  margin-bottom: 16px;
  font-size: 0.85rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-table-wrapper {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  box-shadow: var(--shadow-sm);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.admin-table th {
  background: linear-gradient(135deg, var(--primary-light), transparent);
  padding: 16px 20px;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  border-bottom: 2px solid var(--border-color);
}

.admin-table td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
  transition: background 0.2s;
}

.user-row:hover td {
  background: var(--primary-light);
}

.col-avatar {
  width: 80px;
  text-align: center;
}

.table-avatar {
  width: 55px;
  height: 55px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.table-avatar:hover {
  transform: scale(1.05);
  border-color: var(--primary);
}

.avatar-edit-box {
  position: relative;
  display: inline-block;
}

.btn-edit-avatar {
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-edit-avatar:hover {
  transform: scale(1.1);
  background: var(--primary-hover);
}

.client-id {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary);
  font-family: monospace;
  margin-bottom: 6px;
}

.name-edit-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.name-edit-row input {
  flex: 1;
  min-width: 80px;
}

.date-tag {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.contact-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Редактируемые поля */
.inline-edit {
  background: transparent;
  border: 1px solid transparent;
  padding: 6px 8px;
  border-radius: 8px;
  color: var(--text-main);
  width: 100%;
  transition: all 0.2s;
}

.inline-edit:hover {
  background: var(--bg-input);
  border-color: var(--border-color);
}

.inline-edit:focus {
  background: var(--bg-card);
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-light);
}

.bold {
  font-weight: 700;
}

.address-input {
  resize: vertical;
  min-height: 50px;
  font-size: 0.85rem;
}

/* Роль и согласие */
.role-control {
  margin-bottom: 12px;
}

.role-select {
  padding: 6px 12px;
  border-radius: 40px;
  font-weight: 800;
  font-size: 0.7rem;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  background: var(--bg-input);
  transition: all 0.2s;
}

.role-select.admin {
  background: rgba(230, 57, 70, 0.15);
  color: var(--danger);
}
.role-select.user {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}
.role-select.guest {
  background: rgba(107, 114, 128, 0.15);
  color: #6b7280;
}

.consent-control {
  margin-top: 8px;
}

.custom-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 0.7rem;
}

.custom-checkbox input {
  display: none;
}

.checkmark {
  width: 16px;
  height: 16px;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 4px;
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
  font-size: 10px;
  font-weight: bold;
}

.consent-text {
  color: var(--text-muted);
}

/* Кнопки действий */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.btn-secondary-small {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100px;
}

.btn-secondary-small:hover {
  background: var(--primary-light);
  border-color: var(--primary);
  transform: translateY(-2px);
}

.btn-delete-small {
  background: var(--danger-light);
  border: none;
  padding: 6px 12px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--danger);
  cursor: pointer;
  transition: all 0.2s;
  width: 100px;
}

.btn-delete-small:hover {
  background: var(--danger);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(231, 111, 81, 0.3);
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

/* ПАГИНАЦИЯ */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
  flex-wrap: wrap;
}

.p-btn {
  padding: 10px 20px;
  border-radius: 40px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-main);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.p-btn:hover:not(:disabled) {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  transform: translateY(-2px);
}

.p-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.p-numbers {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.p-numbers button {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-main);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.p-numbers button:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}

.p-numbers button.active {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
}

/* МОДАЛЬНЫЕ ОКНА */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg-overlay);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeSlideUp 0.2s ease-out;
}

.modal-content {
  background: var(--bg-card);
  width: 90%;
  max-width: 500px;
  border-radius: var(--radius-lg);
  padding: 28px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
}

.close-btn:hover {
  color: var(--danger);
  transform: rotate(90deg);
}

.section-label {
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text-muted);
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.avatar-option {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.2s;
}

.avatar-option:hover {
  transform: scale(1.05);
  border-color: var(--primary);
}

.file-upload-label {
  display: inline-block;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.file-upload-label:hover {
  background: var(--primary-light);
  border-color: var(--primary);
  transform: translateY(-2px);
}

/* ПРОСМОТР ФОТО */
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  cursor: zoom-out;
}

.preview-container {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.full-image {
  max-width: 100%;
  max-height: 85vh;
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border: 3px solid white;
}

.close-preview {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.close-preview:hover {
  transform: scale(1.1);
  color: var(--danger);
}

/* АДАПТИВНОСТЬ */
@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .admin-users {
    padding: 24px 16px;
  }
  .header-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .filter-grid {
    grid-template-columns: 1fr;
  }
  .input-grid {
    grid-template-columns: 1fr;
  }
  .admin-table th,
  .admin-table td {
    padding: 12px;
  }
  .pagination-wrapper {
    flex-direction: column;
  }
  .name-edit-row {
    flex-direction: column;
  }
  .action-buttons {
    flex-direction: row;
    justify-content: flex-end;
    gap: 6px;
  }
  .btn-secondary-small,
  .btn-delete-small {
    width: auto;
    padding: 4px 10px;
  }
}

/* ТЁМНАЯ ТЕМА – ДОПОЛНИТЕЛЬНЫЕ ПРАВКИ */
body.dark-theme .admin-card {
  background: rgba(30, 41, 59, 0.95);
}
body.dark-theme .role-select.admin {
  background: rgba(230, 57, 70, 0.25);
}
body.dark-theme .role-select.user {
  background: rgba(59, 130, 246, 0.25);
}
body.dark-theme .role-select.guest {
  background: rgba(107, 114, 128, 0.25);
}
</style>