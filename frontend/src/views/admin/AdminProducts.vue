<template>
  <div class="admin-products">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>📦 Управление товарами</h1>
        <p class="subtitle">Полный каталог запчастей, аксессуаров и расходников</p>
      </div>
      <div class="stats-badge">
        Всего: <b>{{ filteredProducts.length }}</b>
      </div>
    </div>

    <!-- 1. ФОРМА ДОБАВЛЕНИЯ ТОВАРА -->
    <section class="admin-card create-card">
      <h3 class="card-title">Добавить новый товар</h3>
      <form @submit.prevent="createProduct" class="admin-form">
        <div class="input-grid">
          <div class="input-group">
            <label>Название товара</label>
            <input v-model="newProduct.name" placeholder="Тормозные колодки..." required />
          </div>
          <div class="input-group">
            <label>Артикул (SKU)</label>
            <input v-model="newProduct.sku" placeholder="ABC-123" required />
          </div>
          <div class="input-group">
            <label>Цена (₽)</label>
            <input v-model="newProduct.price" type="number" placeholder="0" required />
          </div>
          <div class="input-group">
            <label>Категория</label>
            <select v-model="newProduct.category_id" required>
              <option :value="null">-- Выберите категорию --</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="input-group">
            <label>Бренд</label>
            <select v-model="newProduct.brand_id">
              <option :value="null">-- Выберите бренд --</option>
              <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
          <div class="input-group">
            <label>Изображение</label>
            <div class="upload-controls">
              <input type="file" @change="uploadPhoto" accept="image/*" class="file-mini" />
              <input v-model="newProduct.image_url" placeholder="Или вставьте URL" class="url-mini" />
            </div>
          </div>
        </div>
        <div class="form-footer">
          <button type="submit" :disabled="uploading" class="btn-primary">
            {{ uploading ? 'Загрузка...' : '✨ Создать товар' }}
          </button>
        </div>
      </form>
    </section>

    <!-- 2. БЛОК ФИЛЬТРАЦИИ И ПОИСКА -->
    <section class="admin-card filter-section">
      <div class="filter-grid">
        <div class="input-group search-group">
          <label>🔍 Поиск</label>
          <input v-model="searchQuery" placeholder="Название или артикул..." />
        </div>

        <div class="input-group">
          <label>Категория</label>
          <select v-model="filters.categoryId">
            <option value="all">Все категории</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div class="input-group">
          <label>Бренд</label>
          <select v-model="filters.brandId">
            <option value="all">Все бренды</option>
            <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>

        <div class="input-group">
          <label>Сортировка</label>
          <select v-model="filters.sort">
            <option value="new">Сначала новые</option>
            <option value="price-asc">Дешевле</option>
            <option value="price-desc">Дороже</option>
            <option value="name">По алфавиту</option>
          </select>
        </div>
      </div>

      <div class="filter-footer">
        <label class="custom-checkbox">
          <input type="checkbox" v-model="filters.onlyDiscount" />
          <span class="checkmark"></span>
          Только товары со скидкой
        </label>
        <button @click="resetFilters" class="btn-text-link">Сбросить все фильтры</button>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА ТОВАРОВ -->
    <div class="table-container">
      <div class="table-meta">
        Показана страница {{ currentPage }} из {{ totalPages || 1 }}
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
          <tbody>
            <tr v-for="p in paginatedProducts" :key="p.id">
              <td class="col-id">#{{ p.id }}</td>
              
              <td class="col-photo">
                <div class="product-img-box" title="Нажмите, чтобы сменить фото">
                  <img :src="p.image_url" class="table-img" @error="p.image_url = '/assets/images/no-photo.png'"/>
                  <input type="file" @change="(e) => uploadPhotoToExisting(e, p)" class="hidden-file-input" />
                </div>
              </td>
              
              <td>
                <input v-model="p.name" @change="updateProduct(p)" class="inline-edit bold" />
                <div class="sku-row">
                  <small class="muted">SKU:</small>
                  <input v-model="p.sku" @change="updateProduct(p)" class="inline-edit mini muted" />
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
                <div class="discount-edit-row">
                  <small class="muted">Скидка:</small>
                  <input v-model.number="p.discount_price" type="number" @change="updateProduct(p)" class="inline-edit discount-val" />
                </div>
              </td>

              <td class="text-right">
                <button @click="deleteProduct(p.id)" class="btn-delete-small">Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 4. ПАГИНАЦИЯ -->
      <div v-if="totalPages > 1" class="pagination-wrapper">
        <button @click="currentPage--" :disabled="currentPage === 1" class="p-btn">← Пред.</button>
        <div class="p-numbers">
          <button v-for="page in totalPages" :key="page" 
                  @click="currentPage = page"
                  :class="{ active: currentPage === page }">
            {{ page }}
          </button>
        </div>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-btn">След. →</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* КОД СКРИПТА ОСТАВЛЯЕМ ТВОЙ ОРИГИНАЛЬНЫЙ БЕЗ ИЗМЕНЕНИЙ */
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

watch([searchQuery, filters], () => { currentPage.value = 1; });

const newProduct = reactive({ name: '', sku: '', price: 0, category_id: null, brand_id: null, description: '', image_url: '', discount_price: null, weight_kg: 0, warranty_months: 12 });

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
  const res = await axios.post('/api/admin/products', newProduct, config);
  products.value.unshift(res.data);
  alert('Добавлено');
};

const updateProduct = async (p) => { await axios.put(`/api/admin/products/${p.id}`, p, config); };

const deleteProduct = async (id) => {
  if (!confirm('Удалить товар навсегда?')) return;
  await axios.delete(`/api/admin/products/${id}`, config);
  products.value = products.value.filter(p => p.id !== id);
};

onMounted(loadData);
</script>

<style scoped>
.admin-products {
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

.file-mini { font-size: 0.75rem; border: none !important; background: transparent !important; padding: 0 !important; }
.url-mini { margin-top: 10px; font-size: 0.8rem !important; padding: 8px 12px !important; }

/* КНОПКИ */
.btn-primary { background-color: var(--primary); color: #fff !important; padding: 14px 30px; border-radius: var(--radius-md); font-weight: 700; border: none; cursor: pointer; transition: 0.2s; }
.btn-primary:hover { transform: translateY(-2px); background-color: var(--primary-hover); }

/* ФИЛЬТРЫ */
.filter-section { background-color: var(--bg-input) !important; border-style: dashed !important; }
.filter-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 20px; align-items: flex-end; }
.filter-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 25px; }
.btn-text-link { background: none; border: none; color: var(--primary); text-decoration: underline; cursor: pointer; font-weight: 600; }

/* ТАБЛИЦА */
.table-meta { margin-bottom: 10px; font-size: 0.85rem; color: var(--text-muted); }
.admin-table-wrapper { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { background-color: var(--bg-input) !important; padding: 18px 20px; text-align: left; font-size: 0.75rem; color: var(--text-muted) !important; border-bottom: 2px solid var(--border-color); text-transform: uppercase; }
.admin-table td { padding: 15px 20px; border-bottom: 1px solid var(--border-color); color: var(--text-main) !important; vertical-align: middle; }

/* ДЕТАЛИ В ТАБЛИЦЕ */
.col-photo { width: 100px; text-align: center; }
.product-img-box { position: relative; width: 60px; height: 60px; background: #fff; border-radius: 8px; border: 1px solid var(--border-color); display: inline-block; }
.table-img { width: 100%; height: 100%; object-fit: contain; }
.hidden-file-input { position: absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer; }

.inline-edit { background: transparent; border: 1px solid transparent; padding: 6px 10px; border-radius: 6px; color: var(--text-main) !important; width: 100%; }
.inline-edit:hover { background: var(--bg-input); border-color: var(--border-color); }
.inline-edit:focus { background: var(--bg-card); border-color: var(--primary); outline: none; }
.bold { font-weight: 700; }
.mini { font-size: 0.8rem; }
.muted { color: var(--text-muted) !important; }

.table-select { background: transparent !important; border: none !important; width: 100%; font-size: 0.9rem; cursor: pointer; padding: 5px !important; }
.price-val { font-weight: 800; font-size: 1.1rem; color: var(--primary) !important; width: 100px !important; }
.discount-val { color: var(--danger) !important; font-weight: 700; width: 80px !important; }

.btn-delete-small { background: var(--danger-light); color: var(--danger) !important; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }

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