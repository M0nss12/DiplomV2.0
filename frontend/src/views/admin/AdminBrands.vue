<template>
  <div class="admin-brands">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>🏭 Управление брендами</h1>
        <p class="subtitle">База данных производителей, их страны и логотипы</p>
      </div>
      <div class="stats-badge">
        <span class="stats-icon">📊</span>
        Всего: <b>{{ filteredBrands.length }}</b>
      </div>
    </div>

    <!-- 1. ФОРМА СОЗДАНИЯ -->
    <section class="admin-card create-card">
      <div class="card-header">
        <h3 class="card-title">✨ Добавить новый бренд</h3>
        <div class="card-decoration"></div>
      </div>
      <form @submit.prevent="createBrand" class="admin-form">
        <div class="input-grid">
          <div class="input-group">
            <label>📛 Название бренда</label>
            <input v-model="newBrand.name" placeholder="Напр. Bosch, Brembo..." required />
          </div>

          <div class="input-group">
            <label>🌍 Страна происхождения</label>
            <input v-model="newBrand.country" placeholder="Германия, Италия..." />
          </div>

          <div class="input-group">
            <label>🖼️ Логотип</label>
            <div class="upload-controls">
              <label class="file-label">
                📁 Загрузить
                <input type="file" @change="(e) => handleFileUpload(e, 'new')" accept="image/*" class="hidden-file" />
              </label>
              <input v-model="newBrand.logo_url" placeholder="Или прямая ссылка на лого" class="url-mini" />
            </div>
          </div>
        </div>

        <div class="form-footer">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="newBrand.is_popular" />
            <span class="checkmark"></span>
            <span>⭐ Популярный бренд (выводить на главной)</span>
          </label>
          <button type="submit" :disabled="uploading" class="btn-primary">
            <span class="btn-icon">✨</span>
            {{ uploading ? 'Загрузка...' : 'Создать бренд' }}
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
        <div class="input-group search-group">
          <label>🔎 Поиск по названию, стране или ID</label>
          <input v-model="searchQuery" placeholder="Введите название или ID..." />
        </div>

        <div class="input-group">
          <label>🌍 Фильтр по стране</label>
          <select v-model="countryFilter">
            <option value="all">Все страны</option>
            <option v-for="country in uniqueCountries" :key="country" :value="country">{{ country }}</option>
          </select>
        </div>

        <div class="checkbox-group">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="popularOnly" />
            <span class="checkmark"></span>
            <span>⭐ Только популярные</span>
          </label>
        </div>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА БРЕНДОВ -->
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
              <th class="col-logo">Логотип</th>
              <th>Название</th>
              <th>Страна</th>
              <th class="text-center">Популярный</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="brand in paginatedBrands" :key="brand.id" class="brand-row">
              <td class="col-id">
                <span class="id-badge">#{{ brand.id }}</span>
              </td>
              
              <td class="col-logo">
                <div class="logo-preview-box" title="Кликните для замены логотипа">
                  <img :src="brand.logo_url || '/assets/images/no-brand.png'" />
                  <input type="file" @change="(e) => handleFileUpload(e, 'edit', brand)" class="hidden-file-input" />
                </div>
              </td>

              <td>
                <input v-model="brand.name" @change="updateBrand(brand)" class="inline-edit bold" />
              </td>

              <td>
                <input v-model="brand.country" @change="updateBrand(brand)" class="inline-edit" placeholder="Указать страну" />
              </td>

              <td class="text-center">
                <label class="custom-checkbox no-text">
                  <input type="checkbox" v-model="brand.is_popular" @change="updateBrand(brand)" />
                  <span class="checkmark"></span>
                </label>
              </td>

              <td class="text-right">
                <button @click="deleteBrand(brand.id)" class="btn-delete-small">
                  🗑️ Удалить
                </button>
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

const brands = ref([]);
const searchQuery = ref('');
const countryFilter = ref('all');
const popularOnly = ref(false);
const uploading = ref(false);
const currentPage = ref(1);
const itemsPerPage = 20;

const newBrand = reactive({ name: '', country: '', logo_url: '', is_popular: true });

const fetchBrands = async () => {
  try {
    const res = await axios.get('/api/admin/brands', config);
    brands.value = res.data;
  } catch (e) { console.error('Ошибка загрузки'); }
};

const uniqueCountries = computed(() => {
  const countries = brands.value.map(b => b.country).filter(c => c);
  return Array.from(new Set(countries)).sort();
});

const resetFilters = () => {
  searchQuery.value = ''; countryFilter.value = 'all'; popularOnly.value = false; currentPage.value = 1;
};

const handleFileUpload = async (event, mode, target = null) => {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  uploading.value = true;
  try {
    const res = await axios.post('/api/upload/brands', formData);
    if (mode === 'new') newBrand.logo_url = res.data.url;
    else { 
      target.logo_url = res.data.url; 
      await updateBrand(target); 
    }
  } catch (e) { alert('Ошибка загрузки логотипа'); } 
  finally { uploading.value = false; }
};

const filteredBrands = computed(() => {
  let res = [...brands.value];
  if (popularOnly.value) res = res.filter(b => b.is_popular);
  if (countryFilter.value !== 'all') res = res.filter(b => b.country === countryFilter.value);
  
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(b => 
      b.name.toLowerCase().includes(q) || 
      (b.country && b.country.toLowerCase().includes(q)) ||
      b.id.toString() === q
    );
  }
  return res;
});

const totalPages = computed(() => Math.ceil(filteredBrands.value.length / itemsPerPage));
const paginatedBrands = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredBrands.value.slice(start, start + itemsPerPage);
});

watch([searchQuery, countryFilter, popularOnly], () => currentPage.value = 1);

const createBrand = async () => {
  try {
    const res = await axios.post('/api/admin/brands', newBrand, config);
    brands.value.unshift(res.data);
    Object.assign(newBrand, { name: '', country: '', logo_url: '', is_popular: true });
    alert('Бренд успешно добавлен');
  } catch (e) { alert('Ошибка при создании'); }
};

const updateBrand = async (brand) => {
  try { 
    await axios.put(`/api/admin/brands/${brand.id}`, brand, config); 
  } catch (e) {
    console.error("Ошибка обновления");
  }
};

const deleteBrand = async (id) => {
  if (!confirm('ВНИМАНИЕ! Удаление бренда может оставить товары без привязки к производителю. Удалить?')) return;
  try {
    await axios.delete(`/api/admin/brands/${id}`, config);
    brands.value = brands.value.filter(b => b.id !== id);
  } catch (e) { alert('Ошибка при удалении бренда'); }
};

onMounted(fetchBrands);
</script>

<style scoped>
/* ==========================================================================
   АДМИНКА: УПРАВЛЕНИЕ БРЕНДАМИ – СОВРЕМЕННЫЙ СТИЛЬ (БЕЗ КРАСНЫХ ВЫДЕЛЕНИЙ)
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

.admin-brands {
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

.form-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
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
  grid-template-columns: 2fr 1.5fr 1fr;
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

/* Убираем красное выделение при наведении */
.brand-row:hover td {
  background: transparent;
}

.col-id {
  width: 70px;
  font-weight: 700;
  color: var(--primary);
  font-family: monospace;
}

.id-badge {
  display: inline-block;
  font-weight: 800;
  color: var(--primary);
  font-family: monospace;
}

.col-logo {
  width: 90px;
  text-align: center;
}

.logo-preview-box {
  position: relative;
  width: 60px;
  height: 40px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  margin: 0 auto;
}

.logo-preview-box:hover {
  transform: scale(1.05);
  border-color: var(--primary);
}

.logo-preview-box img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.hidden-file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
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

/* Чекбоксы */
.custom-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  font-size: 0.85rem;
}

.custom-checkbox input {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 6px;
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

.no-text {
  justify-content: center;
  padding: 0;
  margin: 0;
}

/* Кнопка удаления (мягкая, без красного фона) */
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

/* АДАПТИВНОСТЬ */
@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .admin-brands {
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
  .form-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .form-footer button {
    width: 100%;
    justify-content: center;
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
body.dark-theme .logo-preview-box {
  background: rgba(30, 41, 59, 0.8);
}
</style>