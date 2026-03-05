<template>
  <div class="admin-stocks">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>📊 Управление остатками</h1>
        <p class="subtitle">Учет запасов товаров на ПВЗ и региональных складах</p>
      </div>
      <div class="stats-badge">
        Записей: <b>{{ filteredStocks.length }}</b>
      </div>
    </div>

    <!-- 1. ФОРМА ПРИЕМКИ ТОВАРА -->
    <section class="admin-card admission-card">
      <h3 class="card-title">📦 Приходовать товар на склад</h3>
      <form @submit.prevent="createStock" class="admin-form">
        <div class="input-grid">
          <div class="input-group">
            <label>Товар</label>
            <select v-model="newStock.product_id" required>
              <option :value="null">-- Выберите товар --</option>
              <option v-for="p in products" :key="p.id" :value="p.id">
                {{ p.name }} (арт: {{ p.sku }})
              </option>
            </select>
          </div>
          <div class="input-group">
            <label>Склад (ПВЗ)</label>
            <select v-model="newStock.warehouse_id" required>
              <option :value="null">-- Выберите склад --</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">
                {{ w.city_name }} — {{ w.address }}
              </option>
            </select>
          </div>
          <div class="input-group mini">
            <label>Кол-во</label>
            <input v-model.number="newStock.quantity" type="number" required />
          </div>
          <div class="input-group mini">
            <label>Место (полка)</label>
            <input v-model="newStock.shelf_location" placeholder="Напр. A-1" />
          </div>
        </div>
        <div class="form-footer">
          <button type="submit" class="btn-admission">✅ Добавить на склад</button>
        </div>
      </form>
    </section>

    <!-- 2. УМНАЯ ФИЛЬТРАЦИЯ -->
    <section class="admin-card filter-section">
      <div class="filter-grid">
        <div class="input-group search-group">
          <label>🔍 Поиск товара/SKU</label>
          <input v-model="searchQuery" placeholder="Название или артикул..." />
        </div>

        <div class="input-group">
          <label>Склад</label>
          <select v-model="filters.warehouseId">
            <option value="all">Все склады</option>
            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.city_name }} ({{ w.address }})</option>
          </select>
        </div>

        <div class="input-group">
          <label>Категория</label>
          <select v-model="filters.categoryId">
            <option value="all">Все категории</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div class="input-group">
          <label>Сортировка</label>
          <select v-model="filters.sort">
            <option value="product-name">По названию</option>
            <option value="qty-asc">Мало на складе ↑</option>
            <option value="qty-desc">Много на складе ↓</option>
            <option value="city">По городам</option>
          </select>
        </div>
      </div>

      <div class="filter-footer">
        <label class="custom-checkbox danger-text">
          <input type="checkbox" v-model="filters.onlyEmpty" />
          <span class="checkmark"></span> ТОЛЬКО НУЛЕВЫЕ ОСТАТКИ
        </label>
        <button @click="resetFilters" class="btn-secondary">🧹 Сбросить всё</button>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА -->
    <div class="table-container">
      <div class="table-meta">
        Страница {{ currentPage }} из {{ totalPages || 1 }}
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-id">ID</th>
              <th>Товар / Артикул</th>
              <th>Склад / Город</th>
              <th class="text-center">Количество</th>
              <th>Место</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stock in paginatedStocks" :key="stock.id" :class="{ 'row-zero': stock.quantity === 0 }">
              <td class="col-id">#{{ stock.id }}</td>
              
              <td>
                <div class="product-info">
                  <span class="p-name">{{ getProductName(stock.product_id) }}</span>
                  <code class="p-sku">{{ getProductSKU(stock.product_id) }}</code>
                </div>
              </td>

              <td>
                <div class="warehouse-info">
                  <span class="w-city">{{ getWarehouseCity(stock.warehouse_id) }}</span>
                  <small class="w-addr">{{ getWarehouseAddress(stock.warehouse_id) }}</small>
                </div>
              </td>

              <td class="text-center">
                <input v-model.number="stock.quantity" type="number" 
                       @change="updateStock(stock)" 
                       class="inline-edit qty-input" 
                       :class="{ 'warning-input': stock.quantity === 0 }" />
              </td>

              <td>
                <input v-model="stock.shelf_location" 
                       @change="updateStock(stock)" 
                       class="inline-edit shelf-input" 
                       placeholder="---" />
              </td>

              <td class="text-right">
                <button @click="deleteStock(stock.id)" class="btn-delete">Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredStocks.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>Ничего не найдено</h3>
        <p>Попробуйте изменить параметры фильтрации</p>
      </div>
    </div>

    <!-- 4. ПАГИНАЦИЯ -->
    <div v-if="totalPages > 1" class="pagination-wrapper">
      <button @click="currentPage = 1" :disabled="currentPage === 1" class="p-btn">«</button>
      <button @click="currentPage--" :disabled="currentPage === 1" class="p-btn">‹</button>
      
      <div class="p-numbers">
        <button v-for="page in totalPages" :key="page" 
                @click="currentPage = page"
                :class="{ active: currentPage === page }">
          {{ page }}
        </button>
      </div>

      <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-btn">›</button>
      <button @click="currentPage = totalPages" :disabled="currentPage === totalPages" class="p-btn">»</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue';
import axios from 'axios';

const ADMIN_KEY = 'my_super_secret_admin_123';
const config = { headers: { 'x-admin-key': ADMIN_KEY } };

const stocks = ref([]);
const products = ref([]);
const warehouses = ref([]);
const categories = ref([]);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 20;

const filters = reactive({
  warehouseId: 'all',
  categoryId: 'all',
  onlyEmpty: false,
  sort: 'product-name'
});

const loadData = async () => {
  try {
    const [sRes, pRes, wRes, cRes] = await Promise.all([
      axios.get('/api/admin/product_stocks', config),
      axios.get('/api/admin/products', config),
      axios.get('/api/admin/warehouses', config),
      axios.get('/api/admin/categories', config)
    ]);
    stocks.value = sRes.data;
    products.value = pRes.data;
    warehouses.value = wRes.data;
    categories.value = cRes.data;
  } catch (e) { console.error('Ошибка загрузки'); }
};

const getProductName = (id) => products.value.find(p => p.id === id)?.name || '---';
const getProductSKU = (id) => products.value.find(p => p.id === id)?.sku || '---';
const getWarehouseCity = (id) => warehouses.value.find(w => w.id === id)?.city_name || '---';
const getWarehouseAddress = (id) => warehouses.value.find(w => w.id === id)?.address || '---';

const resetFilters = () => {
  searchQuery.value = ''; filters.warehouseId = 'all'; filters.categoryId = 'all';
  filters.onlyEmpty = false; filters.sort = 'product-name'; currentPage.value = 1;
};

const filteredStocks = computed(() => {
  let res = [...stocks.value];
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(s => {
      const p = products.value.find(item => item.id === s.product_id);
      return p?.name.toLowerCase().includes(q) || p?.sku.toLowerCase().includes(q);
    });
  }
  if (filters.warehouseId !== 'all') res = res.filter(s => s.warehouse_id === filters.warehouseId);
  if (filters.categoryId !== 'all') {
      res = res.filter(s => {
          const p = products.value.find(item => item.id === s.product_id);
          return p?.category_id === filters.categoryId;
      });
  }
  if (filters.onlyEmpty) res = res.filter(s => s.quantity === 0);
  if (filters.sort === 'product-name') res.sort((a, b) => getProductName(a.product_id).localeCompare(getProductName(b.product_id)));
  else if (filters.sort === 'qty-desc') res.sort((a, b) => b.quantity - a.quantity);
  else if (filters.sort === 'qty-asc') res.sort((a, b) => a.quantity - b.quantity);
  else if (filters.sort === 'city') res.sort((a, b) => getWarehouseCity(a.warehouse_id).localeCompare(getWarehouseCity(b.warehouse_id)));
  return res;
});

const totalPages = computed(() => Math.ceil(filteredStocks.value.length / itemsPerPage));
const paginatedStocks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredStocks.value.slice(start, start + itemsPerPage);
});

watch([searchQuery, filters], () => currentPage.value = 1);

const newStock = reactive({ product_id: null, warehouse_id: null, quantity: 0, shelf_location: '' });
const createStock = async () => {
  if (!newStock.product_id || !newStock.warehouse_id) return alert('Выберите товар и склад!');
  try {
    const res = await axios.post('/api/admin/product_stocks', newStock, config);
    stocks.value.unshift(res.data);
    newStock.quantity = 0; newStock.shelf_location = '';
    alert('Принято на баланс');
  } catch (e) { alert('Ошибка'); }
};

const updateStock = async (stock) => {
  try { await axios.put(`/api/admin/product_stocks/${stock.id}`, stock, config); } catch (e) { }
};

const deleteStock = async (id) => {
  if (!confirm('Удалить запись об остатке?')) return;
  try {
    await axios.delete(`/api/admin/product_stocks/${id}`, config);
    stocks.value = stocks.value.filter(s => s.id !== id);
  } catch (e) { alert('Ошибка'); }
};

onMounted(loadData);
</script>

<style scoped>
.admin-stocks {
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

/* Приемка товара (Зеленый акцент) */
.admission-card {
  border-color: var(--success) !important;
  background-color: rgba(16, 185, 129, 0.05) !important;
}

.card-title { margin-top: 0; margin-bottom: 25px; font-size: 1.25rem; font-weight: 700; }

/* ФОРМЫ И ИНПУТЫ */
.admin-form input, .admin-form select, .filter-section input, .filter-section select {
  width: 100%; padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color);
  background-color: var(--bg-input) !important; color: var(--text-main) !important; transition: all 0.2s;
}

.input-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
.input-grid.mini { grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); }

.input-group label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted) !important; margin-bottom: 8px; text-transform: uppercase; }

/* КНОПКИ */
.btn-admission { background-color: var(--success); color: #fff !important; padding: 12px 30px; border-radius: var(--radius-md); font-weight: 700; border: none; cursor: pointer; }
.btn-admission:hover { background-color: var(--success-hover); transform: translateY(-2px); }

.btn-secondary { padding: 12px 20px; background-color: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; color: var(--text-main); font-weight: 600; }

.btn-delete { background: none; border: none; color: var(--danger); font-weight: 700; cursor: pointer; }

/* ФИЛЬТРЫ */
.filter-section { background-color: var(--bg-input) !important; border-style: dashed !important; }
.filter-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 20px; align-items: flex-end; }
.filter-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }

.danger-text { color: var(--danger) !important; font-weight: 800; font-size: 0.9rem; }

/* ТАБЛИЦА */
.admin-table-wrapper { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { background-color: var(--bg-input) !important; padding: 18px 20px; text-align: left; font-size: 0.75rem; color: var(--text-muted) !important; border-bottom: 2px solid var(--border-color); text-transform: uppercase; }
.admin-table td { padding: 15px 20px; border-bottom: 1px solid var(--border-color); color: var(--text-main) !important; vertical-align: middle; }

/* Выделение пустых остатков */
.row-zero { background-color: rgba(244, 63, 94, 0.05); }

/* ДАННЫЕ В ТАБЛИЦЕ */
.col-id { color: var(--text-muted) !important; font-family: monospace; width: 80px; }
.p-name { display: block; font-weight: 700; color: var(--text-main); }
.p-sku { color: var(--primary); font-weight: 800; font-size: 0.8rem; }
.w-city { display: block; font-weight: 700; }
.w-addr { font-size: 0.8rem; color: var(--text-muted); }

/* INLINE EDIT */
.inline-edit { background: transparent; border: 1px solid transparent; padding: 6px 10px; border-radius: 6px; color: var(--text-main) !important; }
.inline-edit:hover { background: var(--bg-input); border-color: var(--border-color); }
.qty-input { width: 80px; text-align: center; font-weight: 800; font-size: 1.1rem; }
.shelf-input { width: 100px; font-family: monospace; }
.warning-input { color: var(--danger) !important; border-color: var(--danger) !important; }

/* ПАГИНАЦИЯ */
.pagination-wrapper { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 40px; }
.p-btn { padding: 10px 15px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-main); cursor: pointer; }
.p-numbers { display: flex; gap: 8px; }
.p-numbers button { width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-main); cursor: pointer; font-weight: 700; }
.p-numbers button.active { background-color: var(--success); color: #fff; border-color: var(--success); }

/* ПУСТОЕ СОСТОЯНИЕ */
.empty-state { text-align: center; padding: 80px 20px; background-color: var(--bg-input); border-radius: var(--radius-lg); border: 2px dashed var(--border-color); color: var(--text-muted); }
.empty-icon { font-size: 3rem; margin-bottom: 15px; opacity: 0.5; }

/* ТЕМНАЯ ТЕМА ФОРС */
:deep(body.dark-theme) .admin-card { background-color: #1e293b !important; }
:deep(body.dark-theme) .inline-edit { color: var(--text-main) !important; }
</style>