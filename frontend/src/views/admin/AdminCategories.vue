<template>
  <div class="admin-categories">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>📂 Управление категориями</h1>
        <p class="subtitle">Структура каталога и автоматическая очистка хранилища иконок</p>
      </div>
      <div class="stats-badge">
        <span class="stats-icon">📊</span>
        Всего: <b>{{ filteredCategories.length }}</b>
      </div>
    </div>

    <!-- 1. ФОРМА СОЗДАНИЯ -->
    <section class="admin-card create-card">
      <div class="card-header">
        <h3 class="card-title">✨ Создать новую категорию</h3>
        <div class="card-decoration"></div>
      </div>
      <form @submit.prevent="createCategory" class="admin-form">
        <div class="input-grid">
          <div class="input-group">
            <label>📛 Название</label>
            <input v-model="newCategory.name" placeholder="Напр. Трансмиссия" required />
          </div>
          <div class="input-group">
            <label>🔗 Slug (URL адрес)</label>
            <input v-model="newCategory.slug" placeholder="transmission" required />
          </div>
          <div class="input-group">
            <label>📁 Родительская категория</label>
            <select v-model="newCategory.parent_id">
              <option :value="null">-- Корневая (нет родителя) --</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="input-group">
            <label>🖼️ Иконка раздела</label>
            <div class="upload-controls">
              <div v-if="newCategory.image_url" class="preview-new-img">
                <img :src="newCategory.image_url" @click="previewImage(newCategory.image_url)" title="Просмотр" />
                <button type="button" @click="newCategory.image_url = ''" class="btn-clear-img">✕</button>
              </div>
              <label v-else class="file-label">
                📁 Загрузить файл
                <input type="file" @change="(e) => handleFileUpload(e, 'new')" accept="image/*" class="hidden-file" />
              </label>
              <input v-model="newCategory.image_url" placeholder="Или прямая ссылка" class="url-mini" />
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
      <div class="filter-header">
        <h3 class="card-title">🔍 Поиск и фильтры</h3>
        <button @click="resetFilters" class="btn-text-link">Сбросить всё</button>
      </div>
      <div class="filter-grid">
        <div class="input-group">
          <label>🔎 Поиск (Название, Slug или ID)</label>
          <input v-model="searchQuery" placeholder="Введите данные для поиска..." />
        </div>

        <div class="input-group">
          <label>📂 Фильтр по родителю</label>
          <select v-model="parentFilter">
            <option value="all">Все категории</option>
            <option :value="null">Только корневые</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА КАТЕГОРИЙ -->
    <div class="table-container">
      <div class="table-meta">
        <span class="meta-icon">📄</span>
        Страница {{ currentPage }} из {{ totalPages || 1 }}
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-id">ID</th>
              <th class="col-photo">Иконка</th>
              <th>Название категории</th>
              <th>Slug (URL)</th>
              <th>Родительский раздел</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in paginatedCategories" :key="cat.id" class="category-row">
              <td class="col-id">#{{ cat.id }}</td>
              
              <td class="col-photo">
                <div class="category-img-box">
                  <template v-if="cat.image_url">
                    <img :src="cat.image_url" @click="previewImage(cat.image_url)" title="Клик для просмотра" />
                    <button @click="removeExistingIcon(cat)" class="btn-img-delete" title="Удалить из облака">✕</button>
                  </template>
                  <label v-else class="upload-mini-btn">
                    <span>+</span>
                    <input type="file" @change="(e) => handleFileUpload(e, 'edit', cat)" hidden />
                  </label>
                </div>
              </td>

              <td>
                <input v-model="cat.name" @change="updateCategory(cat)" class="inline-edit bold" />
              </td>

              <td>
                <div class="slug-wrapper">
                  <span class="slug-prefix">/</span>
                  <input v-model="cat.slug" @change="updateCategory(cat)" class="inline-edit slug-text" />
                </div>
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
                <button @click="deleteCategory(cat)" class="btn-delete-small">🗑️ Удалить</button>
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

// Загрузка данных
const loadData = async () => {
  try {
    const res = await axios.get('/api/admin/categories', config);
    categories.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) { console.error('Ошибка загрузки данных'); }
};

// --- МЕНЕДЖМЕНТ ФАЙЛОВ ---
const getFilenameFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  return parts.pop();
};

const previewImage = (url) => { if (url) window.open(url, '_blank'); };

const removeExistingIcon = async (cat) => {
  if (!confirm('Удалить иконку физически из хранилища?')) return;
  const filename = getFilenameFromUrl(cat.image_url);
  try {
    if (filename) await axios.delete(`/api/storage/categories/${filename}`, config);
    cat.image_url = null;
    await updateCategory(cat);
  } catch (e) { alert('Ошибка при удалении файла'); }
};

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
      if (target.image_url) {
        const oldFile = getFilenameFromUrl(target.image_url);
        await axios.delete(`/api/storage/categories/${oldFile}`, config).catch(() => {});
      }
      target.image_url = res.data.url;
      await updateCategory(target);
    }
  } catch (e) { alert('Ошибка загрузки'); } 
  finally { uploading.value = false; }
};

// --- CRUD ---
const createCategory = async () => {
  try {
    const res = await axios.post('/api/admin/categories', newCategory, config);
    categories.value.unshift(res.data);
    Object.assign(newCategory, { name: '', slug: '', parent_id: null, image_url: '' });
    alert('Категория успешно создана');
  } catch (e) { alert('Ошибка при создании'); }
};

const updateCategory = async (cat) => {
  try { await axios.put(`/api/admin/categories/${cat.id}`, cat, config); } catch (e) { }
};

const deleteCategory = async (cat) => {
  if (!confirm('Удалить категорию и её иконку?')) return;
  try {
    if (cat.image_url) {
      const filename = getFilenameFromUrl(cat.image_url);
      await axios.delete(`/api/storage/categories/${filename}`, config).catch(() => {});
    }
    await axios.delete(`/api/admin/categories/${cat.id}`, config);
    categories.value = categories.value.filter(c => c.id !== cat.id);
  } catch (e) { alert('Ошибка удаления (возможно, есть подкатегории)'); }
};

// --- ФИЛЬТРАЦИЯ И ПАГИНАЦИЯ ---
const filteredCategories = computed(() => {
  if (!Array.isArray(categories.value)) return [];
  let res = [...categories.value];
  
  if (parentFilter.value !== 'all') {
    res = res.filter(c => c.parent_id === parentFilter.value);
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(c => 
      (c.name && c.name.toLowerCase().includes(q)) || 
      (c.slug && c.slug.toLowerCase().includes(q)) ||
      c.id.toString() === q
    );
  }
  return res;
});

const totalPages = computed(() => Math.ceil(filteredCategories.value.length / itemsPerPage));

const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredCategories.value.slice(start, start + itemsPerPage);
});

const resetFilters = () => {
  searchQuery.value = '';
  parentFilter.value = 'all';
  currentPage.value = 1;
};

watch([searchQuery, parentFilter], () => {
  currentPage.value = 1;
});

onMounted(loadData);
</script>

<style scoped>
/* ==========================================================================
   АДМИНКА: УПРАВЛЕНИЕ КАТЕГОРИЯМИ – ПОЛНОСТЬЮ ОБНОВЛЁННЫЙ ДИЗАЙН
   ========================================================================== */

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.admin-categories {
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

/* КАРТОЧКИ */
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

/* ФОРМА ДОБАВЛЕНИЯ */
.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

.upload-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  width: fit-content;
  transition: all 0.2s;
}

.file-label:hover {
  background: var(--primary-light);
  border-color: var(--primary);
  transform: translateY(-2px);
}

.hidden-file {
  display: none;
}

.url-mini {
  width: 100%;
}

.preview-new-img {
  position: relative;
  width: 80px;
  height: 60px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  margin-bottom: 8px;
}

.preview-new-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.btn-clear-img {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  background: var(--danger);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
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
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(230, 57, 70, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  grid-template-columns: 2fr 1.5fr;
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
  min-width: 800px;
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

.category-row:hover td {
  background: var(--primary-light);
}

.col-id {
  width: 70px;
  font-weight: 700;
  color: var(--primary);
  font-family: monospace;
}

.col-photo {
  width: 90px;
  text-align: center;
}

.category-img-box {
  position: relative;
  width: 60px;
  height: 60px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  margin: 0 auto;
  transition: all 0.2s;
}

.category-img-box:hover {
  transform: scale(1.05);
  border-color: var(--primary);
}

.category-img-box img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: zoom-in;
}

.upload-mini-btn {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.upload-mini-btn:hover {
  color: var(--primary);
  background: var(--primary-light);
}

.btn-img-delete {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  background: var(--danger);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: all 0.2s;
}

.btn-img-delete:hover {
  transform: scale(1.1);
  background: var(--danger-hover);
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
  font-size: 0.95rem;
}

.slug-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
}

.slug-prefix {
  font-size: 0.9rem;
  font-weight: 500;
}

.slug-text {
  font-family: monospace;
  color: var(--primary);
}

.table-select {
  background: transparent;
  border: 1px solid transparent;
  padding: 6px 8px;
  border-radius: 8px;
  width: 100%;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.table-select:hover {
  background: var(--bg-input);
  border-color: var(--border-color);
}

/* Кнопка удаления */
.btn-delete-small {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  padding: 8px 14px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-delete-small:hover {
  background: var(--danger-light);
  color: var(--danger);
  border-color: var(--danger);
  transform: translateY(-2px);
}

.text-right {
  text-align: right;
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

/* АДАПТИВНОСТЬ */
@media (max-width: 1024px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .admin-categories {
    padding: 24px 16px;
  }
  .header-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .input-grid {
    grid-template-columns: 1fr;
  }
  .pagination-wrapper {
    flex-direction: column;
  }
  .admin-table th,
  .admin-table td {
    padding: 12px;
  }
}

/* ТЁМНАЯ ТЕМА – ДОПОЛНИТЕЛЬНЫЕ ПРАВКИ */
body.dark-theme .admin-card {
  background: rgba(30, 41, 59, 0.95);
}
body.dark-theme .file-label:hover {
  background: rgba(99, 102, 241, 0.2);
}
body.dark-theme .category-img-box {
  background: #1e293b;
}
body.dark-theme .preview-new-img {
  background: #1e293b;
}
</style>