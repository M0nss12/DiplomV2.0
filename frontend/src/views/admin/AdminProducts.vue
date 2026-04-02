<template>
  <div class="admin-products">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>📦 Управление товарами</h1>
        <p class="subtitle">Полный каталог запчастей, аксессуаров и расходников</p>
      </div>
      <div class="stats-badge">
        <span class="stats-icon">📊</span>
        Всего: <b>{{ filteredProducts.length }}</b>
      </div>
    </div>

    <!-- 1. ФОРМА ДОБАВЛЕНИЯ ТОВАРА -->
    <section class="admin-card create-card">
      <div class="card-header">
        <h3 class="card-title">✨ Добавить новый товар</h3>
        <div class="card-decoration"></div>
      </div>
      <form @submit.prevent="createProduct" class="admin-form">
        <div class="input-grid">
          <div class="input-group">
            <label>📛 Название товара</label>
            <input v-model="newProduct.name" placeholder="Тормозные колодки..." required />
          </div>
          <div class="input-group">
            <label>🔖 Артикул (SKU)</label>
            <input v-model="newProduct.sku" placeholder="ABC-123" required />
          </div>
          <div class="input-group">
            <label>💰 Цена (₽)</label>
            <input v-model="newProduct.price" type="number" placeholder="0" required />
          </div>
          <div class="input-group">
            <label>📂 Категория</label>
            <select v-model="newProduct.category_id" required>
              <option :value="null">-- Выберите --</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="input-group">
            <label>🏷️ Бренд</label>
            <select v-model="newProduct.brand_id">
              <option :value="null">-- Без бренда --</option>
              <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
          <div class="input-group">
            <label>⚖️ Вес (кг) / 🛡️ Гарантия (мес)</label>
            <div style="display: flex; gap: 10px;">
              <input v-model="newProduct.weight_kg" type="number" step="0.1" placeholder="Вес" style="width: 50%" />
              <input v-model="newProduct.warranty_months" type="number" placeholder="Гарантия" style="width: 50%" />
            </div>
          </div>
          <div class="input-group" style="grid-column: span 2;">
            <label>📝 Описание</label>
            <textarea v-model="newProduct.description" placeholder="Краткое описание товара..." rows="2"></textarea>
          </div>
          <div class="input-group">
            <label>🖼️ Изображение</label>
            <div class="upload-controls">
              <label class="file-label">
                📁 Загрузить
                <input type="file" @change="uploadPhoto" accept="image/*" class="hidden-file" />
              </label>
              <input v-model="newProduct.image_url" placeholder="Или URL" class="url-mini" />
            </div>
          </div>
        </div>
        <div class="form-footer">
          <button type="submit" :disabled="uploading" class="btn-primary">
            <span class="btn-icon">✨</span>
            {{ uploading ? 'Загрузка...' : 'Создать товар' }}
          </button>
        </div>
      </form>
    </section>

    <!-- 2. ФИЛЬТРЫ И СОРТИРОВКА -->
    <section class="admin-card filter-section">
      <div class="filter-header">
        <h3 class="card-title">🔍 Фильтры и сортировка</h3>
        <button @click="resetFilters" class="btn-text-link">Сбросить всё</button>
      </div>
      <div class="filter-grid">
        <div class="input-group search-group">
          <label>🔎 Поиск</label>
          <input v-model="searchQuery" placeholder="Название, артикул или ID..." />
        </div>
        <div class="input-group">
          <label>📂 Категория</label>
          <select v-model="filters.categoryId">
            <option value="all">Все категории</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="input-group">
          <label>🏷️ Бренд</label>
          <select v-model="filters.brandId">
            <option value="all">Все бренды</option>
            <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <div class="input-group">
          <label>📊 Сортировка</label>
          <select v-model="filters.sort">
            <option value="new">Сначала новые</option>
            <option value="price-asc">По возрастанию цены</option>
            <option value="price-desc">По убыванию цены</option>
            <option value="name">По алфавиту</option>
          </select>
        </div>
      </div>
      <div class="filter-footer">
        <label class="custom-checkbox">
          <input type="checkbox" v-model="filters.onlyDiscount" />
          <span class="checkmark"></span>
          <span>🔥 Только товары со скидкой</span>
        </label>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА ТОВАРОВ С АККОРДЕОНОМ -->
    <div class="table-container">
      <div class="table-meta">
        <span class="meta-icon">📄</span> Показана страница {{ currentPage }} из {{ totalPages || 1 }}
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-id">ID</th>
              <th class="col-photo">Фото</th>
              <th>Инфо о товаре</th>
              <th>Категория / Бренд</th>
              <th>Цена (₽)</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody v-for="p in paginatedProducts" :key="p.id">
            <!-- Основная строка -->
            <tr class="product-row">
              <td class="col-id">#{{ p.id }}</td>
              <td class="col-photo">
                <div class="product-img-box" title="Нажмите, чтобы сменить фото">
                  <img :src="p.image_url" class="table-img" @error="p.image_url = '/assets/images/no-photo.png'" />
                  <input type="file" @change="(e) => uploadPhotoToExisting(e, p)" class="hidden-file-input" />
                </div>
              </td>
              <td>
                <input v-model="p.name" @change="updateProduct(p)" class="inline-edit bold" />
                <div class="sku-row">
                  <span class="muted">SKU:</span>
                  <input v-model="p.sku" @change="updateProduct(p)" class="inline-edit mini" />
                </div>
              </td>
              <td>
                <select v-model="p.category_id" @change="updateProduct(p)" class="table-select">
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <select v-model="p.brand_id" @change="updateProduct(p)" class="table-select muted">
                  <option :value="null">Без бренда</option>
                  <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
                </select>
              </td>
              <td>
                <div class="price-edit-row">
                  <input v-model.number="p.price" type="number" @change="updateProduct(p)" class="inline-edit price-val" />
                  <span class="curr">₽</span>
                </div>
                <div class="discount-edit-row" v-if="p.discount_price !== null && p.discount_price !== ''">
                  <span class="muted">Скидка:</span>
                  <input v-model.number="p.discount_price" type="number" @change="updateProduct(p)" class="inline-edit discount-val" />
                  <button @click="p.discount_price = null; updateProduct(p)" title="Удалить скидку" class="remove-discount">❌</button>
                </div>
                <div v-else class="add-discount" @click="p.discount_price = 0">➕ Добавить скидку</div>
              </td>
              <td class="text-right actions-cell">
                <button @click="toggleDetails(p.id)" class="btn-secondary-small">
                  {{ expandedRow === p.id ? 'Скрыть 🔼' : 'Детали ⚙️' }}
                </button>
                <button @click="deleteProduct(p.id)" class="btn-delete-small">🗑️</button>
              </td>
            </tr>

            <!-- Скрытая строка с дополнительными полями -->
            <tr v-if="expandedRow === p.id" class="details-row">
              <td colspan="6">
                <div class="details-panel">
                  <div class="detail-field">
                    <label>⚖️ Вес (кг):</label>
                    <input v-model.number="p.weight_kg" type="number" step="0.1" @change="updateProduct(p)" class="detail-input" />
                  </div>
                  <div class="detail-field">
                    <label>🛡️ Гарантия (мес):</label>
                    <input v-model.number="p.warranty_months" type="number" @change="updateProduct(p)" class="detail-input" />
                  </div>
                  <div class="detail-field full-width">
                    <label>📝 Описание:</label>
                    <textarea v-model="p.description" @change="updateProduct(p)" class="detail-textarea" rows="2"></textarea>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 4. ПАГИНАЦИЯ -->
      <div v-if="totalPages > 1" class="pagination-wrapper">
        <button @click="currentPage--" :disabled="currentPage === 1" class="p-btn">← Назад</button>
        <div class="p-numbers">
          <button v-for="page in totalPages" :key="page" @click="currentPage = page" :class="{ active: currentPage === page }">
            {{ page }}
          </button>
        </div>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-btn">Вперед →</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue';
import axios from 'axios';

const ADMIN_KEY = 'my_super_secret_admin_123';
const config = { headers: { 'x-admin-key': ADMIN_KEY } };

const products = ref([]);
const categories = ref([]);
const brands = ref([]);
const searchQuery = ref('');
const uploading = ref(false);

const currentPage = ref(1);
const itemsPerPage = 20;

const expandedRow = ref(null);
const toggleDetails = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

const filters = reactive({
  categoryId: 'all',
  brandId: 'all',
  onlyDiscount: false,
  sort: 'new'
});

const loadData = async () => {
  try {
    const [pRes, cRes, bRes] = await Promise.all([
      axios.get('/api/admin/products', config),
      axios.get('/api/admin/categories', config),
      axios.get('/api/admin/brands', config)
    ]);
    products.value = pRes.data;
    categories.value = cRes.data;
    brands.value = bRes.data;
  } catch (e) {
    alert('Ошибка при загрузке данных');
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  filters.categoryId = 'all';
  filters.brandId = 'all';
  filters.onlyDiscount = false;
  filters.sort = 'new';
  currentPage.value = 1;
};

const filteredProducts = computed(() => {
  let res = [...products.value];
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.id.toString() === q);
  }
  if (filters.categoryId !== 'all') res = res.filter(p => p.category_id === filters.categoryId);
  if (filters.brandId !== 'all') res = res.filter(p => p.brand_id === filters.brandId);
  if (filters.onlyDiscount) res = res.filter(p => p.discount_price && p.discount_price > 0);
  if (filters.sort === 'price-asc') res.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
  else if (filters.sort === 'price-desc') res.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
  else if (filters.sort === 'name') res.sort((a, b) => a.name.localeCompare(b.name));
  else if (filters.sort === 'new') res.sort((a, b) => b.id - a.id);
  return res;
});

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage));
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredProducts.value.slice(start, end);
});

watch([searchQuery, filters], () => { currentPage.value = 1; expandedRow.value = null; });

const newProduct = reactive({ 
  name: '', sku: '', price: 0, category_id: null, brand_id: null, 
  description: '', image_url: '', discount_price: null, weight_kg: null, warranty_months: 12 
});

const uploadPhoto = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  uploading.value = true;
  try {
    const res = await axios.post('/api/upload/products', formData);
    newProduct.image_url = res.data.url;
  } finally { uploading.value = false; }
};

const uploadPhotoToExisting = async (e, product) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post('/api/upload/products', formData);
  product.image_url = res.data.url;
  await updateProduct(product);
};

const createProduct = async () => {
  try {
    const res = await axios.post('/api/admin/products', newProduct, config);
    products.value.unshift(res.data);
    Object.assign(newProduct, { name: '', sku: '', price: 0, category_id: null, brand_id: null, description: '', image_url: '', discount_price: null, weight_kg: null, warranty_months: 12 });
    alert('Товар добавлен');
  } catch (e) {
    alert('Ошибка при создании');
  }
};

const updateProduct = async (p) => { 
  try {
    await axios.put(`/api/admin/products/${p.id}`, p, config); 
  } catch(e) {
    console.error("Ошибка обновления", e);
  }
};

const deleteProduct = async (id) => {
  if (!confirm('Удалить товар навсегда?')) return;
  await axios.delete(`/api/admin/products/${id}`, config);
  products.value = products.value.filter(p => p.id !== id);
};

onMounted(loadData);
</script>

<style scoped>


@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulseGlow {
  0% { box-shadow: 0 0 0 0 var(--primary-light); }
  70% { box-shadow: 0 0 0 8px rgba(230, 57, 70, 0); }
  100% { box-shadow: 0 0 0 0 rgba(230, 57, 70, 0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.admin-products {
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

/* КАРТОЧКИ (СТЕКЛЯННЫЙ ЭФФЕКТ) */
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
  position: relative;
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
.input-group select,
.input-group textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.input-group textarea {
  resize: vertical;
  font-family: inherit;
}

.input-group input:focus,
.input-group select:focus,
.input-group textarea:focus {
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
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 24px;
  align-items: flex-end;
}

.filter-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-start;
}

.custom-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
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
  min-width: 900px;
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

.product-row:hover td {
  background: var(--primary-light);
}

.col-id {
  width: 70px;
  font-weight: 700;
  color: var(--primary);
}

.col-photo {
  width: 90px;
  text-align: center;
}

.product-img-box {
  position: relative;
  width: 60px;
  height: 60px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.product-img-box:hover {
  transform: scale(1.05);
  border-color: var(--primary);
}

.table-img {
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

/* Редактирование полей */
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

.mini {
  font-size: 0.8rem;
}

.sku-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.muted {
  color: var(--text-muted);
  font-size: 0.7rem;
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

.price-edit-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.price-val {
  font-weight: 800;
  color: var(--primary);
  width: 110px;
}

.curr {
  font-weight: 700;
}

.discount-edit-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.discount-val {
  color: var(--danger);
  font-weight: 700;
  width: 90px;
}

.remove-discount {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.remove-discount:hover {
  opacity: 1;
}

.add-discount {
  margin-top: 6px;
  font-size: 0.7rem;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.add-discount:hover {
  color: var(--success);
  transform: translateX(3px);
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
}

.btn-secondary-small:hover {
  background: var(--primary-light);
  border-color: var(--primary);
  transform: translateY(-1px);
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
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

/* Панель деталей (аккордеон) */
.details-row {
  background: var(--bg-input);
  border-top: 1px solid var(--border-color);
}

.details-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin: 0 20px 20px 20px;
  border: 1px solid var(--border-color);
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-field.full-width {
  grid-column: 1 / -1;
}

.detail-field label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
}

.detail-input,
.detail-textarea {
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.detail-input:focus,
.detail-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-light);
  outline: none;
}

.detail-textarea {
  resize: vertical;
  font-family: inherit;
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
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .admin-products {
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
  .pagination-wrapper {
    flex-direction: column;
  }
  .details-panel {
    margin: 0 10px 10px 10px;
    grid-template-columns: 1fr;
  }
  .actions-cell {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }
}

/* ТЁМНАЯ ТЕМА – ДОПОЛНИТЕЛЬНЫЕ ПРАВКИ */
body.dark-theme .admin-card {
  background: rgba(30, 41, 59, 0.95);
}
body.dark-theme .file-label:hover {
  background: rgba(99, 102, 241, 0.2);
}
body.dark-theme .details-panel {
  background: rgba(30, 41, 59, 0.8);
}
</style>