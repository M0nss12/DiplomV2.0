<template>
  <div class="settings-page">
    <div v-if="user" class="settings-container">
      <h1>Настройки профиля</h1>
      <router-link to="/profile">← Вернуться в кабинет</router-link>

      <!-- 1. БЛОК АВАТАРА -->
      <section style="text-align: center; margin-top: 20px;">
        <img :src="user.avatar_url" width="120" height="120" style="border-radius: 50%; object-fit: cover; border: 3px solid #007bff;" />
        <br />
        <input type="file" @change="handleCustomPhoto" id="avatar-file" style="display:none" accept="image/*" />
        <button @click="triggerFile" style="margin-top: 10px;">📷 Загрузить своё фото</button>
        
        <div style="margin-top: 15px;">
          <p>Или выберите один из вариантов:</p>
          <div style="display: flex; justify-content: center; gap: 10px;">
            <img 
              v-for="url in defaultAvatars" 
              :key="url" 
              :src="url" 
              width="50" height="50" 
              @click="user.avatar_url = url"
              style="cursor: pointer; border-radius: 50%; border: 2px solid transparent;"
              :style="{ borderColor: user.avatar_url === url ? '#007bff' : '#eee' }"
            />
          </div>
        </div>
      </section>

      <hr />

      <!-- 2. ДАННЫЕ (ФИО) -->
      <section>
        <h3>🔸 Основная информация</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
          <div><label>Фамилия</label><br/><input v-model="user.last_name" style="width:100%; padding:8px;"/></div>
          <div><label>Имя *</label><br/><input v-model="user.first_name" style="width:100%; padding:8px;"/></div>
          <div><label>Отчество</label><br/><input v-model="user.otchestvo" style="width:100%; padding:8px;"/></div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
          <div><label>Email</label><br/><input v-model="user.email" style="width:100%; padding:8px;"/></div>
          <div><label>Телефон</label><br/><input v-model="user.phone_number" style="width:100%; padding:8px;"/></div>
        </div>
      </section>

      <br />

      <!-- 3. НАСЕЛЕННЫЙ ПУНКТ -->
      <section style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
        <h3>📍 Ваш регион</h3>
        <label>Населенный пункт (Город / Поселок)</label><br />
        <input v-model="user.saved_address" placeholder="Напр. г. Ангарск" style="width: 100%; padding: 10px; margin-top: 5px;" />
        <br /><br />
        <label style="cursor: pointer;">
          <input type="checkbox" v-model="user.allows_data_saving" /> Сохранять мои данные для заказов
        </label>
      </section>

      <br />

      <!-- 4. ПАРОЛЬ -->
      <section style="background: #fff5f5; padding: 20px; border: 1px solid #feb2b2; border-radius: 8px;">
        <h3>🔒 Смена пароля</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
          <div v-for="field in ['old', 'new', 'confirm']" :key="field">
            <label>{{ field === 'old' ? 'Текущий' : field === 'new' ? 'Новый' : 'Повтор' }}:</label>
            <div style="display: flex;">
              <input v-model="passwords[field]" :type="visibility[field] ? 'text' : 'password'" style="flex:1; padding:8px;" />
              <button type="button" @click="visibility[field] = !visibility[field]">{{ visibility[field] ? '🙈' : '👁️' }}</button>
            </div>
          </div>
        </div>
      </section>

      <br />

      <div style="display: flex; justify-content: flex-end; gap: 15px; margin-bottom: 50px;">
        <button @click="$router.push('/profile')" type="button">Отмена</button>
        <button @click="saveChanges" style="background: #e44d26; color: white; padding: 12px 35px; font-weight: bold; border: none; cursor: pointer; border-radius: 5px;">
          💾 СОХРАНИТЬ ВСЁ
        </button>
      </div>
    </div>

    <!-- ЗАГРУЗКА -->
    <div v-else style="padding: 100px; text-align: center;">
      <h2 v-if="!errorMessage">Загрузка данных профиля...</h2>
      <div v-else>
        <h2 style="color: red;">{{ errorMessage }}</h2>
        <button @click="logout">Войти заново</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
// 1. ШАГ: ИМПОРТИРУЕМ ГЛОБАЛЬНОЕ ХРАНИЛИЩЕ
import { useAppStore } from '@/stores/appStore';

const router = useRouter();
// 2. ШАГ: ИНИЦИАЛИЗИРУЕМ СТОР
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
      if (e.response?.status === 404) {
          errorMessage.value = "Ошибка: Пользователь не найден.";
      } else {
          errorMessage.value = "Ошибка связи с сервером.";
      }
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

  // Смена пароля
  if (passwords.old || passwords.new) {
    if (passwords.new !== passwords.confirm) return alert("Новые пароли не совпадают");
    try {
      await axios.post(`/api/users/change-password/${userId}`, {
        oldPassword: passwords.old,
        newPassword: passwords.new
      });
    } catch (e) {
      return alert(e.response?.data?.error || "Старый пароль неверный");
    }
  }

  // Сохранение всех данных профиля
  try {
    const res = await axios.put(`/api/users/profile/${userId}`, user.value);
    user.value = res.data;

    // 3. ШАГ: ОБНОВЛЯЕМ ГОРОД В ГЛОБАЛЬНОМ СТОРЕ
    // Как только база сохранила новый город, мы прописываем его в Store
    if (user.value.saved_address) {
        appStore.setCity(user.value.saved_address);
        console.log("Город синхронизирован со стором:", user.value.saved_address);
    }

    // Обновляем остальные данные в localStorage дляNavbar
    localStorage.setItem('user_name', user.value.first_name);
    localStorage.setItem('user_avatar', user.value.avatar_url);

    alert("Данные успешно сохранены!");
    passwords.old = ''; passwords.new = ''; passwords.confirm = '';
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