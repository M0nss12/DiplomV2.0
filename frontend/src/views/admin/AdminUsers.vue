<template>
  <div class="admin-users">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>👥 Управление пользователями</h1>
        <p class="subtitle">Редактирование профилей, ролей и контактов клиентов</p>
      </div>
      <div class="stats-badge">
        Найдено: <b>{{ filteredUsers.length }}</b> чел.
      </div>
    </div>

    <!-- 1. ФОРМА СОЗДАНИЯ -->
    <section class="admin-card create-card">
      <h3 class="card-title">Добавить пользователя вручную</h3>
      <form @submit.prevent="createUser" class="admin-form">
        <div class="input-grid">
          <div class="input-group">
            <label>Фамилия</label>
            <input v-model="newUser.last_name" placeholder="Иванов" />
          </div>
          <div class="input-group">
            <label>Имя *</label>
            <input v-model="newUser.first_name" placeholder="Иван" required />
          </div>
          <div class="input-group">
            <label>Email</label>
            <input v-model="newUser.email" type="email" placeholder="mail@example.com" />
          </div>
          <div class="input-group">
            <label>Телефон</label>
            <input v-model="newUser.phone_number" placeholder="+7..." />
          </div>
          <div class="input-group">
            <label>Роль</label>
            <select v-model="newUser.role">
              <option value="guest">Гость</option>
              <option value="user">Пользователь</option>
              <option value="admin">Админ</option>
            </select>
          </div>
        </div>
        <div class="form-footer">
          <button type="submit" class="btn-primary">✨ Создать аккаунт</button>
        </div>
      </form>
    </section>

    <!-- 2. УМНЫЕ ФИЛЬТРЫ -->
    <section class="admin-card filter-section">
      <div class="filter-grid">
        <div class="input-group search-group">
          <label>Поиск (ФИО, Email, Телефон)</label>
          <input v-model="searchQuery" placeholder="Начните вводить данные..." />
        </div>
        <div class="input-group">
          <label>Фильтр по роли</label>
          <select v-model="roleFilter">
            <option value="all">Все роли</option>
            <option value="admin">Администраторы</option>
            <option value="user">Пользователи</option>
            <option value="guest">Гости</option>
          </select>
        </div>
        <button @click="resetFilters" class="btn-secondary">Сбросить</button>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ -->
    <div class="table-container">
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-avatar">Аватар</th>
              <th>ID / ФИО</th>
              <th>Контакты</th>
              <th class="text-center">Роль</th>
              <th>Город</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in paginatedUsers" :key="u.id">
              <td class="col-avatar">
                <div class="avatar-edit-box">
                  <img :src="u.avatar_url" class="table-avatar" />
                  <button @click="openAvatarPicker(u)" class="btn-edit-avatar" title="Сменить фото">✎</button>
                </div>
              </td>

              <td>
                <div class="client-id">ID: #{{ u.id }}</div>
                <div class="name-edit-row">
                  <input v-model="u.last_name" @change="updateUser(u)" class="inline-edit bold" placeholder="Фамилия" />
                  <input v-model="u.first_name" @change="updateUser(u)" class="inline-edit bold" placeholder="Имя" />
                </div>
              </td>

              <td>
                <input v-model="u.email" @change="updateUser(u)" class="inline-edit mini" placeholder="Email" />
                <input v-model="u.phone_number" @change="updateUser(u)" class="inline-edit mini muted" placeholder="Телефон" />
              </td>

              <td class="text-center">
                <select v-model="u.role" @change="updateUser(u)" class="status-select" :class="u.role">
                  <option value="guest">Guest</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>

              <td>
                <input v-model="u.saved_address" @change="updateUser(u)" class="inline-edit" placeholder="Город не указан" />
              </td>

              <td class="text-right">
                <button @click="deleteUser(u.id)" class="btn-delete">Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ПАГИНАЦИЯ -->
      <div v-if="totalPages > 1" class="pagination-wrapper">
        <button @click="currentPage--" :disabled="currentPage === 1" class="p-btn">←</button>
        <div class="p-numbers">
          <button v-for="p in totalPages" :key="p" @click="currentPage = p" :class="{ active: currentPage === p }">
            {{ p }}
          </button>
        </div>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-btn">→</button>
      </div>
    </div>

    <!-- 🖼️ МОДАЛКА ВЫБОРА АВАТАРКИ -->
    <div v-if="showAvatarPicker" class="modal-overlay" @click="showAvatarPicker = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Смена аватара для {{ editingUser?.first_name }}</h3>
          <button @click="showAvatarPicker = false" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <p class="section-label">Выберите из библиотеки:</p>
          <div class="avatar-grid">
            <img v-for="url in defaultAvatars" :key="url" :src="url" 
                 @click="setAvatar(url)"
                 class="avatar-option" />
          </div>

          <div class="upload-custom">
            <p class="section-label">Или загрузите свой файл:</p>
            <input type="file" @change="handleFileUpload" accept="image/*" class="custom-file-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showAvatarPicker = false" class="btn-secondary">Отмена</button>
        </div>
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
const currentPage = ref(1);
const itemsPerPage = 20;

const defaultAvatars = ref([]);
const showAvatarPicker = ref(false);
const editingUser = ref(null);

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

const filteredUsers = computed(() => {
  let res = [...users.value];
  if (roleFilter.value !== 'all') res = res.filter(u => u.role === roleFilter.value);
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(u => 
      u.first_name?.toLowerCase().includes(q) || 
      u.last_name?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q) || 
      u.phone_number?.includes(q)
    );
  }
  return res;
});

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage));
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredUsers.value.slice(start, start + itemsPerPage);
});

watch([searchQuery, roleFilter], () => currentPage.value = 1);
const resetFilters = () => { searchQuery.value = ''; roleFilter.value = 'all'; };

const openAvatarPicker = (user) => { editingUser.value = user; showAvatarPicker.value = true; };
const setAvatar = async (url) => { editingUser.value.avatar_url = url; await updateUser(editingUser.value); showAvatarPicker.value = false; };

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

const newUser = reactive({ first_name: '', last_name: '', email: '', phone_number: '', role: 'user', password_hash: '123' });
const createUser = async () => {
  try {
    const res = await axios.post('/api/admin/users', newUser, config);
    users.value.unshift(res.data);
    alert('Пользователь создан');
  } catch (e) { alert('Ошибка'); }
};

const updateUser = async (user) => { try { await axios.put(`/api/admin/users/${user.id}`, user, config); } catch (e) { } };
const deleteUser = async (id) => {
  if (!confirm('Удалить пользователя навсегда?')) return;
  try {
    await axios.delete(`/api/admin/users/${id}`, config);
    users.value = users.value.filter(u => u.id !== id);
  } catch (e) { alert('Ошибка'); }
};

onMounted(loadData);
</script>

<style scoped>
.admin-users {
  padding: 40px 20px;
  animation: fadeIn 0.4s ease-out;
  color: var(--text-main);
}

/* ШАПКА */
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
h1 { font-size: 2.2rem; font-weight: 800; margin: 0; }
.subtitle { color: var(--text-muted); margin-top: 5px; }
.stats-badge { background: var(--primary-light); color: var(--primary); padding: 10px 20px; border-radius: 50px; font-weight: 700; }

/* КАРТОЧКИ */
.admin-card {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 30px;
}

.card-title { margin-top: 0; margin-bottom: 25px; font-size: 1.25rem; font-weight: 700; }

/* ФОРМЫ И ИНПУТЫ */
.admin-form input, .admin-form select, .filter-section input, .filter-section select {
  width: 100%; padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color);
  background-color: var(--bg-input) !important; color: var(--text-main) !important; transition: all 0.2s;
}

.input-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin-bottom: 25px; }
.input-group label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted) !important; margin-bottom: 8px; text-transform: uppercase; }

/* КНОПКИ */
.btn-primary { background-color: var(--primary); color: #fff !important; padding: 14px 30px; border-radius: var(--radius-md); font-weight: 700; border: none; cursor: pointer; }
.btn-secondary { padding: 12px 20px; background-color: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; color: var(--text-main); font-weight: 600; }
.btn-delete { background-color: var(--danger-light); color: var(--danger) !important; border: none; padding: 8px 16px; border-radius: var(--radius-sm); font-weight: 700; cursor: pointer; }

/* ФИЛЬТРЫ */
.filter-section { background-color: var(--bg-input) !important; border-style: dashed !important; }
.filter-grid { display: grid; grid-template-columns: 2.5fr 1.5fr auto; gap: 20px; align-items: flex-end; }

/* ТАБЛИЦА */
.admin-table-wrapper { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { background-color: var(--bg-input) !important; padding: 18px 20px; text-align: left; font-size: 0.75rem; color: var(--text-muted) !important; border-bottom: 2px solid var(--border-color); text-transform: uppercase; }
.admin-table td { padding: 15px 20px; border-bottom: 1px solid var(--border-color); color: var(--text-main) !important; vertical-align: middle; }

/* АВАТАР В ТАБЛИЦЕ */
.col-avatar { width: 80px; text-align: center; }
.avatar-edit-box { position: relative; display: inline-block; }
.table-avatar { width: 55px; height: 55px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color); background: #fff; }
.btn-edit-avatar { position: absolute; bottom: 0; right: 0; background: var(--primary); color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; font-size: 10px; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }

/* РЕДАКТИРОВАНИЕ В ТАБЛИЦЕ */
.client-id { color: var(--text-muted) !important; font-size: 0.75rem; font-family: monospace; }
.inline-edit { background: transparent; border: 1px solid transparent; padding: 4px 8px; border-radius: 6px; color: var(--text-main) !important; width: 100%; }
.inline-edit:hover { background: var(--bg-input); border-color: var(--border-color); }
.bold { font-weight: 700; }
.mini { font-size: 0.85rem; }

/* БЕЙДЖИ РОЛЕЙ */
.status-select { padding: 6px 12px; border-radius: 20px; font-weight: 800; font-size: 0.7rem; text-transform: uppercase; border: none; cursor: pointer; width: auto; }
.admin { background: var(--danger-light) !important; color: var(--danger) !important; }
.user { background: var(--primary-light) !important; color: var(--primary) !important; }
.guest { background: var(--bg-input) !important; color: var(--text-muted) !important; }

/* ПАГИНАЦИЯ */
.pagination-wrapper { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 40px; }
.p-btn { padding: 10px 15px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-main); cursor: pointer; }
.p-numbers { display: flex; gap: 8px; }
.p-numbers button { width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-main); cursor: pointer; font-weight: 700; }
.p-numbers button.active { background-color: var(--primary); color: #fff; border-color: var(--primary); }

/* МОДАЛКА */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 9999; }
.modal-content { background: var(--bg-card); width: 90%; max-width: 450px; border-radius: 24px; padding: 35px; border: 1px solid var(--border-color); box-shadow: var(--shadow-lg); text-align: center; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.close-btn { background: none; border: none; font-size: 24px; color: var(--text-muted); cursor: pointer; }
.section-label { font-size: 0.8rem; font-weight: 800; color: var(--text-muted); margin-bottom: 15px; text-transform: uppercase; }
.avatar-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
.avatar-option { width: 100%; aspect-ratio: 1; border-radius: 50%; cursor: pointer; border: 3px solid transparent; transition: 0.2s; object-fit: cover; background: #fff; }
.avatar-option:hover { border-color: var(--primary); transform: scale(1.05); }

/* ТЕМНАЯ ТЕМА ФОРС */
:deep(body.dark-theme) .admin-card, :deep(body.dark-theme) .modal-content { background-color: #1e293b !important; }
:deep(body.dark-theme) .inline-edit { color: var(--text-main) !important; }
:deep(body.dark-theme) .status-select option { background-color: var(--bg-card); color: var(--text-main); }
</style>