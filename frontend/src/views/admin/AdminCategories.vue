<template>
  <div class="admin-categories">
    <h1>📂 Управление категориями</h1>

    <!-- 1. ФОРМА СОЗДАНИЯ -->
    <section style="border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 30px; background: #fff; border-radius: 12px; box-shadow: var(--shadow-sm);">
      <h3 style="margin-top: 0; color: #1e293b;">Создать новую категорию</h3>
      <form @submit.prevent="createCategory" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        
        <input v-model="newCategory.name" placeholder="Название (напр. Двигатель)" required style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;" />
        <input v-model="newCategory.slug" placeholder="Slug (URL адрес)" required style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;" />
        
        <select v-model="newCategory.parent_id" style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
          <option :value="null">-- Корневая (нет родителя) --</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>

        <!-- Загрузка фото -->
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <input type="file" @change="(e) => handleFileUpload(e, 'new')" accept="image/*" style="font-size: 0.8rem;" />
          <input v-model="newCategory.image_url" placeholder="URL иконки" style="padding: 5px; font-size: 0.8rem;" />
        </div>

        <button type="submit" :disabled="uploading" style="background: #10b981; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer;">
          {{ uploading ? 'Загрузка...' : 'Создать' }}
        </button>
      </form>
    </section>

    <hr />

    <!-- 2. УМНАЯ ФИЛЬТРАЦИЯ -->
    <section style="background: #f8fafc; padding: 20px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; font-size: 1rem; color: #64748b;">🔍 Поиск и структура</h3>
      <div style="display: grid; grid-template-columns: 2fr 1.5fr 1fr; gap: 15px; align-items: flex-end;">
        
        <div>
          <label style="font-size: 0.8rem; font-weight: bold; color: #475569;">Поиск по названию или Slug:</label>
          <input v-model="searchQuery" placeholder="Начните вводить..." style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; margin-top: 5px;" />
        </div>

        <div>
          <label style="font-size: 0.8rem; font-weight: bold; color: #475569;">Родительская категория:</label>
          <select v-model="parentFilter" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; margin-top: 5px;">
            <option value="all">Все (весь список)</option>
            <option :value="null">Только корневые</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <button @click="resetFilters" style="padding: 12px; background: white; border: 1px solid #cbd5e1; border-radius: 10px; cursor: pointer; font-weight: 600;">
          Сбросить всё
        </button>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА КАТЕГОРИЙ -->
    <section>
      <div style="margin-bottom: 10px; color: #94a3b8; font-size: 0.9rem;">
        Найдено: {{ filteredCategories.length }} | Страница {{ currentPage }} из {{ totalPages || 1 }}
      </div>

      <table border="1" style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background: #f1f5f9; text-align: left;">
            <th style="padding: 15px;">ID</th>
            <th>Фото (клик для смены)</th>
            <th>Название</th>
            <th>Slug (URL)</th>
            <th>Вложенность</th>
            <th style="text-align: center;">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in paginatedCategories" :key="cat.id" style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 15px; color: #94a3b8;">#{{ cat.id }}</td>
            
            <td style="padding: 10px; text-align: center;">
              <div style="position: relative; display: inline-block;">
                <img :src="cat.image_url || '/assets/images/no-cat.png'" width="50" height="50" style="object-fit: contain; background: #f8fafc; border-radius: 8px; border: 1px solid #eee;" />
                <input type="file" @change="(e) => handleFileUpload(e, 'edit', cat)" style="position: absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer;" title="Сменить фото" />
              </div>
            </td>

            <td>
              <input v-model="cat.name" @change="updateCategory(cat)" style="width: 90%; font-weight: 800; border: none; padding: 5px;" />
            </td>

            <td>
              <input v-model="cat.slug" @change="updateCategory(cat)" style="width: 90%; color: #6366f1; border: none; font-family: monospace; font-size: 0.9rem;" />
            </td>

            <td>
              <select v-model="cat.parent_id" @change="updateCategory(cat)" style="width: 100%; border: none; background: #f8fafc; padding: 5px; border-radius: 4px;">
                <option :value="null">-- Корневая --</option>
                <option v-for="c in categories" :key="c.id" :value="c.id" :disabled="c.id === cat.id">
                  {{ c.name }}
                </option>
              </select>
            </td>

            <td style="text-align: center;">
              <button @click="deleteCategory(cat.id)" style="color: #ef4444; border: none; background: #fff1f2; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                Удалить
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 4. ПАГИНАЦИЯ -->
      <div v-if="totalPages > 1" style="margin-top: 30px; display: flex; justify-content: center; gap: 8px;">
        <button @click="currentPage--" :disabled="currentPage === 1" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; background: white; cursor: pointer;">←</button>
        <button v-for="p in totalPages" :key="p" @click="currentPage = p" 
                :style="currentPage === p ? {background: '#4f46e5', color: 'white'} : {}"
                style="width: 35px; height: 35px; border-radius: 8px; border: 1px solid #ddd; background: white; cursor: pointer; font-weight: bold;">
          {{ p }}
        </button>
        <button @click="currentPage++" :disabled="currentPage === totalPages" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; background: white; cursor: pointer;">→</button>
      </div>

    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue';
import axios from 'axios';

const ADMIN_KEY = 'my_super_secret_admin_123';
const config = { headers: { 'x-admin-key': ADMIN_KEY } };

const categories = ref([]);
const searchQuery = ref('');
const parentFilter = ref('all');
const uploading = ref(false);

// ПАГИНАЦИЯ
const currentPage = ref(1);
const itemsPerPage = 20;

const newCategory = reactive({ name: '', slug: '', parent_id: null, image_url: '' });

const fetchCategories = async () => {
  try {
    const res = await axios.get('/api/admin/categories', config);
    categories.value = res.data;
  } catch (e) { alert('Ошибка загрузки'); }
};

const resetFilters = () => {
  searchQuery.value = '';
  parentFilter.value = 'all';
  currentPage.value = 1;
};

// --- ЗАГРУЗКА ФОТО ---
const handleFileUpload = async (event, mode, target = null) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  uploading.value = true;

  try {
    const res = await axios.post('/api/upload/categories', formData);
    if (mode === 'new') {
      newCategory.image_url = res.data.url;
    } else {
      target.image_url = res.data.url;
      await updateCategory(target);
    }
  } catch (e) {
    alert('Ошибка загрузки файла');
  } finally {
    uploading.value = false;
  }
};

// --- ФИЛЬТРАЦИЯ ---
const filteredCategories = computed(() => {
  let res = [...categories.value];

  if (parentFilter.value !== 'all') {
    res = res.filter(c => c.parent_id === parentFilter.value);
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }

  return res;
});

// --- ЛОГИКА ПАГИНАЦИИ ---
const totalPages = computed(() => Math.ceil(filteredCategories.value.length / itemsPerPage));
const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredCategories.value.slice(start, start + itemsPerPage);
});

watch([searchQuery, parentFilter], () => currentPage.value = 1);

// --- CRUD ---
const createCategory = async () => {
  try {
    const res = await axios.post('/api/admin/categories', newCategory, config);
    categories.value.unshift(res.data);
    alert('Создана');
    Object.assign(newCategory, { name: '', slug: '', parent_id: null, image_url: '' });
  } catch (e) { alert('Ошибка создания'); }
};

const updateCategory = async (cat) => {
  try { await axios.put(`/api/admin/categories/${cat.id}`, cat, config); } catch (e) { }
};

const deleteCategory = async (id) => {
  if (!confirm('При удалении категории товары в ней останутся без категории. Удалить?')) return;
  try {
    await axios.delete(`/api/admin/categories/${id}`, config);
    categories.value = categories.value.filter(c => c.id !== id);
  } catch (e) { alert('Ошибка удаления (возможно, есть подкатегории)'); }
};

onMounted(fetchCategories);
</script>