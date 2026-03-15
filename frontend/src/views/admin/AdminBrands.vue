<template>
  <div class="admin-brands">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>🏭 Управление брендами</h1>
        <p class="subtitle">База данных производителей и их визуальная идентификация</p>
      </div>
      <div class="stats-badge">
        Всего: <b>{{ filteredBrands.length }}</b>
      </div>
    </div>

    <!-- 1. ФОРМА СОЗДАНИЯ -->
    <section class="admin-card create-card">
      <h3 class="card-title">Добавить новый бренд</h3>
      <form @submit.prevent="createBrand" class="admin-form">
        <div class="input-grid">
          <div class="input-group">
            <label>Название</label>
            <input v-model="newBrand.name" placeholder="Напр. Bosch" required />
          </div>

          <div class="input-group">
            <label>Страна</label>
            <input v-model="newBrand.country" placeholder="Германия" />
          </div>

          <div class="input-group">
            <label>Логотип (Файл или URL)</label>
            <div class="upload-controls">
              <input type="file" @change="(e) => handleFileUpload(e, 'new')" accept="image/*" class="file-mini" />
              <input v-model="newBrand.logo_url" placeholder="Или ссылка на лого" class="url-mini" />
            </div>
          </div>
        </div>

        <div class="form-footer">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="newBrand.is_popular" />
            <span class="checkmark"></span>
            Популярный (на главную)
          </label>
          <button type="submit" :disabled="uploading" class="btn-primary">
            {{ uploading ? 'Загрузка...' : '✨ Добавить бренд' }}
          </button>
        </div>
      </form>
    </section>

    <!-- 2. УМНАЯ ФИЛЬТРАЦИЯ -->
    <section class="admin-card filter-section">
      <div class="filter-grid">
        <div class="input-group search-group">
          <label>🔍 Поиск</label>
          <input v-model="searchQuery" placeholder="Введите имя бренда..." />
        </div>

        <div class="input-group">
          <label>Страна</label>
          <select v-model="countryFilter">
            <option value="all">Все страны</option>
            <option v-for="country in uniqueCountries" :key="country" :value="country">{{ country }}</option>
          </select>
        </div>

        <div class="checkbox-group">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="popularOnly" />
            <span class="checkmark"></span>
            Только популярные
          </label>
        </div>

        <button @click="resetFilters" class="btn-secondary">Сбросить всё</button>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА БРЕНДОВ -->
    <div class="table-container">
      <div class="table-meta">
        Найдено: <b>{{ filteredBrands.length }}</b> | Страница {{ currentPage }} из {{ totalPages || 1 }}
      </div>

      <div class="admin-table-wrapper">
        <table class="brand-table">
          <thead>
            <tr>
              <th class="col-id">ID</th>
              <th class="col-logo">Логотип</th>
              <th>Название бренда</th>
              <th>Страна</th>
              <th class="text-center">Популярный</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="brand in paginatedBrands" :key="brand.id">
              <td class="col-id">#{{ brand.id }}</td>
              
              <td class="col-logo">
                <div class="logo-preview-box" title="Кликните для смены лого">
                  <img :src="brand.logo_url || '/assets/images/no-brand.png'" class="table-logo" />
                  <input type="file" @change="(e) => handleFileUpload(e, 'edit', brand)" class="hidden-file-input" />
                </div>
              </td>

              <td>
                <input v-model="brand.name" @change="updateBrand(brand)" class="inline-edit bold" />
              </td>

              <td>
                <input v-model="brand.country" @change="updateBrand(brand)" class="inline-edit muted-text" />
              </td>

              <td class="text-center">
                <label class="custom-checkbox no-text">
                  <input type="checkbox" v-model="brand.is_popular" @change="updateBrand(brand)" />
                  <span class="checkmark"></span>
                </label>
              </td>

              <td class="text-right">
                <button @click="deleteBrand(brand.id)" class="btn-delete">Удалить</button>
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
/* КОД СКРИПТА ОСТАВЛЯЕМ ТВОЙ ОРИГИНАЛЬНЫЙ (логика не меняется) */
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
    else { target.logo_url = res.data.url; await updateBrand(target); }
  } catch (e) { alert('Ошибка загрузки логотипа'); } 
  finally { uploading.value = false; }
};

const filteredBrands = computed(() => {
  let res = [...brands.value];
  if (popularOnly.value) res = res.filter(b => b.is_popular);
  if (countryFilter.value !== 'all') res = res.filter(b => b.country === countryFilter.value);
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(b => b.name.toLowerCase().includes(q) || b.country?.toLowerCase().includes(q));
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
    alert('Бренд добавлен');
  } catch (e) { alert('Ошибка создания'); }
};

const updateBrand = async (brand) => {
  try { await axios.put(`/api/admin/brands/${brand.id}`, brand, config); } catch (e) { }
};

const deleteBrand = async (id) => {
  if (!confirm('Удалить бренд?')) return;
  try {
    await axios.delete(`/api/admin/brands/${id}`, config);
    brands.value = brands.value.filter(b => b.id !== id);
  } catch (e) { alert('Ошибка удаления'); }
};

onMounted(fetchBrands);
</script>

<style scoped>
.admin-brands {
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
.admin-form input, .filter-section input, .filter-section select {
  width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border-color);
  background-color: var(--bg-input) !important; color: var(--text-main) !important; transition: all 0.2s;
}

.input-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 25px; }
.input-group label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted) !important; margin-bottom: 8px; text-transform: uppercase; }

.upload-controls { display: flex; flex-direction: column; gap: 8px; }
.file-mini { font-size: 0.75rem; border: none !important; padding: 0 !important; background: transparent !important; }
.url-mini { padding: 8px 12px !important; font-size: 0.8rem !important; }

.form-footer { margin-top: 25px; padding-top: 20px; border-top: 1px dashed var(--border-color); display: flex; justify-content: space-between; align-items: center; }

/* КНОПКИ */
.btn-primary { background-color: var(--primary); color: #fff !important; padding: 14px 30px; border-radius: var(--radius-md); font-weight: 700; border: none; cursor: pointer; }
.btn-secondary { padding: 12px 20px; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer; color: var(--text-main); font-weight: 600; }
.btn-delete { background-color: var(--danger-light); color: var(--danger) !important; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; }

/* ФИЛЬТРЫ */
.filter-section { background-color: var(--bg-input) !important; border-style: dashed !important; }
.filter-grid { display: grid; grid-template-columns: 2fr 1.5fr 1fr auto; gap: 20px; align-items: flex-end; }

/* ТАБЛИЦА */
.table-meta { margin-bottom: 10px; font-size: 0.85rem; color: var(--text-muted); }
.admin-table-wrapper { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; }
.brand-table { width: 100%; border-collapse: collapse; }
.brand-table th { background-color: var(--bg-input) !important; padding: 18px 20px; text-align: left; font-size: 0.75rem; color: var(--text-muted) !important; border-bottom: 2px solid var(--border-color); text-transform: uppercase; }
.brand-table td { padding: 15px 20px; border-bottom: 1px solid var(--border-color); color: var(--text-main) !important; vertical-align: middle; }

/* ДЕТАЛИ В ТАБЛИЦЕ */
.col-id { color: var(--text-muted) !important; font-family: monospace; width: 60px; }
.col-logo { width: 120px; text-align: center; }

/* Логотип (всегда на белом для видимости) */
.logo-preview-box { position: relative; display: inline-block; padding: 5px; background: #fff; border-radius: 8px; border: 1px solid var(--border-color); }
.table-logo { width: 80px; height: 40px; object-fit: contain; }
.hidden-file-input { position: absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer; }

.inline-edit { background: transparent; border: 1px solid transparent; padding: 6px 10px; border-radius: 6px; color: var(--text-main) !important; width: 100%; }
.inline-edit:hover { background: var(--bg-input); border-color: var(--border-color); }
.inline-edit:focus { background: var(--bg-card); border-color: var(--primary); outline: none; }
.bold { font-weight: 700; }
.muted-text { color: var(--text-muted) !important; }

/* ПАГИНАЦИЯ */
.pagination-wrapper { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 40px; }
.p-btn { padding: 10px 15px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-main); cursor: pointer; }
.p-numbers { display: flex; gap: 8px; }
.p-numbers button { width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-main); cursor: pointer; font-weight: 700; }
.p-numbers button.active { background-color: var(--primary); color: #fff; border-color: var(--primary); }

/* ЧЕКБОКСЫ */
.custom-checkbox { display: flex; align-items: center; gap: 10px; cursor: pointer; position: relative; }
.custom-checkbox input { position: absolute; opacity: 0; }
.checkmark { height: 22px; width: 22px; background-color: var(--bg-input); border: 2px solid var(--border-color); border-radius: 6px; position: relative; }
.custom-checkbox input:checked ~ .checkmark { background-color: var(--primary); border-color: var(--primary); }
.checkmark:after { content: ""; position: absolute; display: none; left: 7px; top: 3px; width: 6px; height: 11px; border: solid white; border-width: 0 2.5px 2.5px 0; transform: rotate(45deg); }
.custom-checkbox input:checked ~ .checkmark:after { display: block; }
.no-text { padding: 0; margin: 0 auto; width: 22px; }

/* ТЕМНАЯ ТЕМА ФОРС */
:deep(body.dark-theme) .admin-card { background-color: #1e293b !important; }
:deep(body.dark-theme) .inline-edit { color: var(--text-main) !important; }

.text-right { text-align: right; }
.text-center { text-align: center; }
</style>