<template>
  <div class="admin-categories">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>📂 Управление категориями</h1>
        <p class="subtitle">Структура каталога и вложенность разделов</p>
      </div>
      <div class="stats-badge">
        Найдено: <b>{{ filteredCategories.length }}</b>
      </div>
    </div>

    <!-- 1. ФОРМА СОЗДАНИЯ -->
    <section class="admin-card create-card">
      <h3 class="card-title">Создать новую категорию</h3>
      <form @submit.prevent="createCategory" class="admin-form">
        <div class="input-grid">
          <div class="input-group">
            <label>Название</label>
            <input v-model="newCategory.name" placeholder="Напр. Двигатель" required />
          </div>
          <div class="input-group">
            <label>Slug (URL адрес)</label>
            <input v-model="newCategory.slug" placeholder="engine" required />
          </div>
          <div class="input-group">
            <label>Родительская категория</label>
            <select v-model="newCategory.parent_id">
              <option :value="null">-- Корневая (нет родителя) --</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="input-group">
            <label>Иконка категории</label>
            <div class="upload-wrapper">
              <input type="file" @change="(e) => handleFileUpload(e, 'new')" accept="image/*" class="file-input" />
              <input v-model="newCategory.image_url" placeholder="Или URL иконки" class="url-input" />
            </div>
          </div>
        </div>
        <div class="form-footer">
          <button type="submit" :disabled="uploading" class="btn-primary">
            {{ uploading ? 'Загрузка...' : '✨ Создать категорию' }}
          </button>
        </div>
      </form>
    </section>

    <!-- 2. УМНАЯ ФИЛЬТРАЦИЯ -->
    <section class="admin-card filter-section">
      <div class="filter-grid">
        <div class="input-group search-group">
          <label>🔍 Поиск</label>
          <input v-model="searchQuery" placeholder="Название или Slug..." />
        </div>

        <div class="input-group">
          <label>Фильтр по родителю</label>
          <select v-model="parentFilter">
            <option value="all">Все (весь список)</option>
            <option :value="null">Только корневые</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <button @click="resetFilters" class="btn-secondary">Сбросить всё</button>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА КАТЕГОРИЙ -->
    <div class="table-container">
      <div class="table-meta">
        Страница {{ currentPage }} из {{ totalPages || 1 }}
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-id">ID</th>
              <th class="col-photo">Фото</th>
              <th>Название</th>
              <th>Slug (URL)</th>
              <th>Вложенность</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in paginatedCategories" :key="cat.id">
              <td class="col-id">#{{ cat.id }}</td>
              
              <td class="col-photo">
                <div class="category-img-box" title="Нажмите, чтобы сменить фото">
                  <img :src="cat.image_url || '/assets/images/no-cat.png'" class="table-img" />
                  <input type="file" @change="(e) => handleFileUpload(e, 'edit', cat)" class="hidden-file-input" />
                </div>
              </td>

              <td>
                <input v-model="cat.name" @change="updateCategory(cat)" class="inline-edit bold" />
              </td>

              <td>
                <input v-model="cat.slug" @change="updateCategory(cat)" class="inline-edit slug-text" />
              </td>

              <td>
                <select v-model="cat.parent_id" @change="updateCategory(cat)" class="table-select">
                  <option :value="null">-- Корневая --</option>
                  <option v-for="c in categories" :key="c.id" :value="c.id" :disabled="c.id === cat.id">
                    {{ c.name }}
                  </option>
                </select>
              </td>

              <td class="text-right">
                <button @click="deleteCategory(cat.id)" class="btn-delete">Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 4. ПАГИНАЦИЯ -->
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

const currentPage = ref(1);
const itemsPerPage = 20;

const newCategory = reactive({ name: '', slug: '', parent_id: null, image_url: '' });

const fetchCategories = async () => {
  try {
    const res = await axios.get('/api/admin/categories', config);
    categories.value = res.data;
  } catch (e) { console.error('Ошибка загрузки'); }
};

const resetFilters = () => {
  searchQuery.value = '';
  parentFilter.value = 'all';
  currentPage.value = 1;
};

const handleFileUpload = async (event, mode, target = null) => {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  uploading.value = true;
  try {
    const res = await axios.post('/api/upload/categories', formData);
    if (mode === 'new') newCategory.image_url = res.data.url;
    else { target.image_url = res.data.url; await updateCategory(target); }
  } catch (e) { alert('Ошибка загрузки'); } 
  finally { uploading.value = false; }
};

const filteredCategories = computed(() => {
  let res = [...categories.value];
  if (parentFilter.value !== 'all') res = res.filter(c => c.parent_id === parentFilter.value);
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }
  return res;
});

const totalPages = computed(() => Math.ceil(filteredCategories.value.length / itemsPerPage));
const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredCategories.value.slice(start, start + itemsPerPage);
});

watch([searchQuery, parentFilter], () => currentPage.value = 1);

const createCategory = async () => {
  try {
    const res = await axios.post('/api/admin/categories', newCategory, config);
    categories.value.unshift(res.data);
    Object.assign(newCategory, { name: '', slug: '', parent_id: null, image_url: '' });
    alert('Категория создана');
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

<style scoped>
.admin-categories {
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

.input-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 25px; }
.input-group label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted) !important; margin-bottom: 8px; text-transform: uppercase; }

.upload-wrapper { display: flex; flex-direction: column; gap: 8px; }
.file-input { font-size: 0.75rem; border: none !important; padding: 0 !important; background: transparent !important; }
.url-input { padding: 8px 12px !important; font-size: 0.8rem !important; }

/* КНОПКИ */
.btn-primary { background-color: var(--primary); color: #fff !important; padding: 14px 30px; border-radius: var(--radius-md); font-weight: 700; border: none; cursor: pointer; transition: 0.2s; }
.btn-primary:hover { transform: translateY(-2px); background-color: var(--primary-hover); }

.btn-secondary { padding: 12px 20px; background-color: var(--bg-input); border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer; color: var(--text-main); font-weight: 600; }

.btn-delete { background-color: var(--danger-light); color: var(--danger) !important; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-delete:hover { background-color: var(--danger); color: #fff !important; }

/* ФИЛЬТРЫ */
.filter-section { background-color: var(--bg-input) !important; border-style: dashed !important; }
.filter-grid { display: grid; grid-template-columns: 2fr 1.5fr auto; gap: 20px; align-items: flex-end; }

/* ТАБЛИЦА */
.table-meta { margin-bottom: 10px; font-size: 0.85rem; color: var(--text-muted); }
.admin-table-wrapper { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { background-color: var(--bg-input) !important; padding: 18px 20px; text-align: left; font-size: 0.75rem; color: var(--text-muted) !important; border-bottom: 2px solid var(--border-color); text-transform: uppercase; }
.admin-table td { padding: 15px 20px; border-bottom: 1px solid var(--border-color); color: var(--text-main) !important; vertical-align: middle; }

/* ДЕТАЛИ В ТАБЛИЦЕ */
.col-id { color: var(--text-muted) !important; font-family: monospace; width: 80px; }
.col-photo { width: 100px; text-align: center; }

.category-img-box { position: relative; width: 60px; height: 60px; background: #fff; border-radius: 8px; border: 1px solid var(--border-color); display: inline-block; padding: 5px; }
.table-img { width: 100%; height: 100%; object-fit: contain; }
.hidden-file-input { position: absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer; }

.inline-edit { background: transparent; border: 1px solid transparent; padding: 6px 10px; border-radius: 6px; color: var(--text-main) !important; width: 100%; }
.inline-edit:hover { background: var(--bg-input); border-color: var(--border-color); }
.inline-edit:focus { background: var(--bg-card); border-color: var(--primary); outline: none; }
.bold { font-weight: 700; }
.slug-text { font-family: monospace; color: var(--primary) !important; }

.table-select { background: transparent !important; border: none !important; width: 100%; font-size: 0.9rem; cursor: pointer; padding: 5px !important; }

/* ПАГИНАЦИЯ */
.pagination-wrapper { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 40px; }
.p-btn { padding: 10px 15px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-main); cursor: pointer; }
.p-numbers { display: flex; gap: 8px; }
.p-numbers button { width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-main); cursor: pointer; font-weight: 700; }
.p-numbers button.active { background-color: var(--primary); color: #fff; border-color: var(--primary); }

/* ТЕМНАЯ ТЕМА ФОРС */
:deep(body.dark-theme) .admin-card { background-color: #1e293b !important; }
:deep(body.dark-theme) .inline-edit { color: var(--text-main) !important; }
:deep(body.dark-theme) .table-select option { background-color: var(--bg-card); color: var(--text-main); }

.text-right { text-align: right; }
</style>