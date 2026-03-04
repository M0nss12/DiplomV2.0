<template>
  <div class="admin-users">
    <h1>👥 Управление пользователями</h1>

    <!-- 1. ФОРМА СОЗДАНИЯ -->
    <section style="border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 30px; background: #fff; border-radius: 12px;">
      <h3 style="margin-top: 0;">Добавить пользователя вручную</h3>
      <form @submit.prevent="createUser" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
        <input v-model="newUser.last_name" placeholder="Фамилия" style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;" />
        <input v-model="newUser.first_name" placeholder="Имя *" required style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;" />
        <input v-model="newUser.email" type="email" placeholder="Email" style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;" />
        <input v-model="newUser.phone_number" placeholder="Телефон" style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;" />
        <select v-model="newUser.role" style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
          <option value="guest">Гость</option>
          <option value="user">Пользователь</option>
          <option value="admin">Админ</option>
        </select>
        <button type="submit" style="background: #10b981; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer;">Создать</button>
      </form>
    </section>

    <hr />

    <!-- 2. УМНЫЕ ФИЛЬТРЫ -->
    <section style="background: #f8fafc; padding: 20px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 15px; align-items: flex-end;">
        <div>
          <label style="font-size: 0.8rem; font-weight: bold; color: #64748b;">Поиск по ФИО, Email или Телефону:</label>
          <input v-model="searchQuery" placeholder="Начните вводить данные..." style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; margin-top: 5px;" />
        </div>
        <div>
          <label style="font-size: 0.8rem; font-weight: bold; color: #64748b;">Роль:</label>
          <select v-model="roleFilter" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; margin-top: 5px;">
            <option value="all">Все роли</option>
            <option value="admin">Администраторы</option>
            <option value="user">Пользователи</option>
            <option value="guest">Гости</option>
          </select>
        </div>
        <button @click="resetFilters" style="padding: 12px; background: white; border: 1px solid #cbd5e1; border-radius: 10px; cursor: pointer; font-weight: 600;">Сбросить</button>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ -->
    <section>
      <div style="margin-bottom: 10px; font-weight: bold; color: #64748b;">Найдено: {{ filteredUsers.length }} чел.</div>
      <table border="1" style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <thead style="background: #f1f5f9;">
          <tr style="text-align: left;">
            <th style="padding: 15px;">Аватар</th>
            <th>ID / ФИО</th>
            <th>Контакты</th>
            <th>Роль</th>
            <th>Город</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in paginatedUsers" :key="u.id" style="border-bottom: 1px solid #f1f5f9;">
            <!-- БЛОК АВАТАРА С ВЫБОРОМ -->
            <td style="padding: 10px; text-align: center;">
              <div style="position: relative; display: inline-block;">
                <img :src="u.avatar_url" width="55" height="55" style="border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0;" />
                <button @click="openAvatarPicker(u)" style="position: absolute; bottom: -5px; right: -5px; background: #4f46e5; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 12px;">✎</button>
              </div>
            </td>

            <td style="padding: 10px;">
              <div style="color: #94a3b8; font-size: 0.7rem;">ID: #{{ u.id }}</div>
              <input v-model="u.last_name" @change="updateUser(u)" placeholder="Фамилия" style="width: 80px; border: none; font-weight: bold;" />
              <input v-model="u.first_name" @change="updateUser(u)" placeholder="Имя" style="width: 80px; border: none; font-weight: bold;" />
            </td>

            <td>
              <input v-model="u.email" @change="updateUser(u)" placeholder="Email" style="width: 100%; border: none; font-size: 0.85rem;" /><br />
              <input v-model="u.phone_number" @change="updateUser(u)" placeholder="Телефон" style="width: 100%; border: none; font-size: 0.85rem; color: #64748b;" />
            </td>

            <td>
              <select v-model="u.role" @change="updateUser(u)" :style="getRoleStyle(u.role)" style="padding: 5px; border-radius: 6px; font-weight: bold; border: none;">
                <option value="guest">Guest</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </td>

            <td>
              <input v-model="u.saved_address" @change="updateUser(u)" placeholder="Город" style="width: 100%; border: none;" />
            </td>

            <td>
              <button @click="deleteUser(u.id)" style="background: #fff1f2; color: #ef4444; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-weight: bold;">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- ПАГИНАЦИЯ -->
      <div v-if="totalPages > 1" style="margin-top: 25px; display: flex; justify-content: center; gap: 8px;">
        <button v-for="p in totalPages" :key="p" @click="currentPage = p" :style="currentPage === p ? {background:'#4f46e5', color:'white'} : {background:'white'}" style="width:35px; height:35px; border-radius:8px; border:1px solid #ddd; cursor:pointer;">{{ p }}</button>
      </div>
    </section>

    <!-- 🖼️ МОДАЛКА ВЫБОРА АВАТАРКИ -->
    <div v-if="showAvatarPicker" style="position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div style="background: white; padding: 30px; border-radius: 24px; width: 450px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
        <h3 style="margin-top: 0;">Изменить аватар для {{ editingUser.first_name }}</h3>
        
        <p style="font-weight: bold; color: #64748b; font-size: 0.9rem;">1. Выберите готовую аватарку:</p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
          <img v-for="url in defaultAvatars" :key="url" :src="url" 
               @click="setAvatar(url)"
               style="width: 80px; height: 80px; border-radius: 50%; cursor: pointer; border: 3px solid transparent; transition: 0.2s;"
               onmouseover="this.style.borderColor='#4f46e5'" onmouseout="this.style.borderColor='transparent'"/>
        </div>

        <p style="font-weight: bold; color: #64748b; font-size: 0.9rem;">2. Или загрузите своё фото:</p>
        <input type="file" @change="handleFileUpload" accept="image/*" style="margin-bottom: 20px;" />

        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button @click="showAvatarPicker = false" style="flex:1; padding: 12px; background: #f1f5f9; border: none; border-radius: 12px; cursor: pointer;">Отмена</button>
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
      axios.get('/api/users/default-avatars') // Эндпоинт из твоего server.js
    ]);
    users.value = uRes.data;
    defaultAvatars.value = aRes.data;
  } catch (e) { alert('Ошибка загрузки'); }
};

// --- ФИЛЬТРАЦИЯ И ПАГИНАЦИЯ ---
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

// --- РАБОТА С АВАТАРАМИ ---
const openAvatarPicker = (user) => {
  editingUser.value = user;
  showAvatarPicker.value = true;
};

const setAvatar = async (url) => {
  editingUser.value.avatar_url = url;
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

// --- CRUD ---
const newUser = reactive({ first_name: '', last_name: '', email: '', phone_number: '', role: 'user', password_hash: '123' });

const createUser = async () => {
  try {
    const res = await axios.post('/api/admin/users', newUser, config);
    users.value.unshift(res.data);
    alert('Создан');
  } catch (e) { alert('Ошибка'); }
};

const updateUser = async (user) => {
  try { await axios.put(`/api/admin/users/${user.id}`, user, config); } catch (e) { }
};

const deleteUser = async (id) => {
  if (!confirm('Удалить?')) return;
  try {
    await axios.delete(`/api/admin/users/${id}`, config);
    users.value = users.value.filter(u => u.id !== id);
  } catch (e) { alert('Ошибка'); }
};

const getRoleStyle = (role) => {
  if (role === 'admin') return { color: '#ef4444', backgroundColor: '#fee2e2' };
  if (role === 'user') return { color: '#4f46e5', backgroundColor: '#eef2ff' };
  return { color: '#64748b', backgroundColor: '#f1f5f9' };
};

const formatDate = (d) => new Date(d).toLocaleDateString('ru-RU');

onMounted(loadData);
</script>