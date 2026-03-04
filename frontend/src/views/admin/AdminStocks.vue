<template>
  <div class="admin-stocks">
    <h1>📦 Управление остатками на складах</h1>

    <!-- 1. ФОРМА ПРИЕМКИ ТОВАРА -->
    <section style="border: 1px solid #bbf7d0; padding: 20px; margin-bottom: 30px; background: #f0fdf4; border-radius: 12px;">
      <h3 style="margin-top: 0; color: #166534;">Приходовать товар на склад</h3>
      <form @submit.prevent="createStock">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div>
            <label style="font-size: 0.8rem; font-weight: bold;">Товар:</label>
            <select v-model="newStock.product_id" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
              <option :value="null">-- Выберите товар --</option>
              <option v-for="p in products" :key="p.id" :value="p.id">
                {{ p.name }} (арт: {{ p.sku }})
              </option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: bold;">Склад (ПВЗ):</label>
            <select v-model="newStock.warehouse_id" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
              <option :value="null">-- Выберите склад --</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">
                {{ w.city_name }} — {{ w.address }}
              </option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: bold;">Кол-во:</label>
            <input v-model.number="newStock.quantity" type="number" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;" />
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: bold;">Место (полка):</label>
            <input v-model="newStock.shelf_location" placeholder="A-1" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;" />
          </div>
        </div>
        <button type="submit" style="margin-top: 15px; background: #166534; color: white; border: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; cursor: pointer;">
          ✅ Добавить на склад
        </button>
      </form>
    </section>

    <hr />

    <!-- 2. БЛОК УМНОЙ ФИЛЬТРАЦИИ -->
    <section style="background: #f8fafc; padding: 25px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; font-size: 1.1rem; color: #1e293b;">🔍 Умные фильтры запасов</h3>
      
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; align-items: flex-end;">
        <!-- Поиск -->
        <div>
          <label style="font-size: 0.75rem; font-weight: bold; color: #64748b;">Поиск товара/SKU:</label>
          <input v-model="searchQuery" placeholder="Название или артикул..." style="width: 100%; padding: 11px; border-radius: 10px; border: 1px solid #cbd5e1; margin-top: 5px;" />
        </div>

        <!-- По складу -->
        <div>
          <label style="font-size: 0.75rem; font-weight: bold; color: #64748b;">Склад:</label>
          <select v-model="filters.warehouseId" style="width: 100%; padding: 11px; border-radius: 10px; border: 1px solid #cbd5e1; margin-top: 5px;">
            <option value="all">Все склады</option>
            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.city_name }} ({{ w.address }})</option>
          </select>
        </div>

        <!-- По категории -->
        <div>
          <label style="font-size: 0.75rem; font-weight: bold; color: #64748b;">Категория товара:</label>
          <select v-model="filters.categoryId" style="width: 100%; padding: 11px; border-radius: 10px; border: 1px solid #cbd5e1; margin-top: 5px;">
            <option value="all">Все категории</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <!-- Сортировка -->
        <div>
          <label style="font-size: 0.75rem; font-weight: bold; color: #64748b;">Сортировать:</label>
          <select v-model="filters.sort" style="width: 100%; padding: 11px; border-radius: 10px; border: 1px solid #cbd5e1; margin-top: 5px;">
            <option value="product-name">По названию</option>
            <option value="qty-asc">Мало на складе ↑</option>
            <option value="qty-desc">Много на складе ↓</option>
            <option value="city">По городам</option>
          </select>
        </div>
      </div>

      <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; gap: 20px;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; color: #ef4444; font-weight: 700; font-size: 0.9rem;">
                <input type="checkbox" v-model="filters.onlyEmpty" style="width:18px; height:18px;"/> ТОЛЬКО НУЛЕВЫЕ ОСТАТКИ
            </label>
        </div>
        <button @click="resetFilters" style="padding: 10px 20px; background: white; border: 1px solid #cbd5e1; border-radius: 10px; cursor: pointer; font-weight: bold; color: #4b5563;">
          🧹 Сбросить всё
        </button>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА -->
    <section>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #475569;">Записей: {{ filteredStocks.length }}</h3>
        <div style="font-weight: bold; color: #94a3b8;">Страница {{ currentPage }} из {{ totalPages || 1 }}</div>
      </div>
      
      <table border="1" style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: var(--shadow-sm);">
        <thead style="background: #f8fafc;">
          <tr>
            <th style="padding: 15px; text-align: left; width: 60px;">ID</th>
            <th style="padding: 15px; text-align: left;">Товар / Артикул</th>
            <th style="padding: 15px; text-align: left;">Склад / Город</th>
            <th style="padding: 15px; text-align: left; width: 120px;">Количество</th>
            <th style="padding: 15px; text-align: left; width: 120px;">Место</th>
            <th style="padding: 15px; text-align: center; width: 100px;">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stock in paginatedStocks" :key="stock.id" :style="stock.quantity === 0 ? {background: '#fff1f2'} : {}">
            <td style="padding: 15px; color: #94a3b8;">#{{ stock.id }}</td>
            <td style="padding: 15px;">
              <div style="font-weight: 700; color: #1e293b;">{{ getProductName(stock.product_id) }}</div>
              <small style="color: #6366f1; font-family: monospace; font-weight: bold;">{{ getProductSKU(stock.product_id) }}</small>
            </td>
            <td style="padding: 15px;">
              <div style="font-weight: 600;">{{ getWarehouseCity(stock.warehouse_id) }}</div>
              <div style="font-size: 0.8rem; color: #64748b;">{{ getWarehouseAddress(stock.warehouse_id) }}</div>
            </td>
            <td style="padding: 15px;">
              <input v-model.number="stock.quantity" type="number" @change="updateStock(stock)" 
                :style="stock.quantity === 0 ? {borderColor: '#ef4444', color: '#ef4444', fontWeight: '800'} : {}"
                style="width: 80px; padding: 8px; border-radius: 8px; border: 1px solid #ddd; text-align: center;" />
            </td>
            <td style="padding: 15px;">
              <input v-model="stock.shelf_location" @change="updateStock(stock)" placeholder="---" style="width: 100px; padding: 8px; border-radius: 8px; border: 1px solid #ddd;" />
            </td>
            <td style="padding: 15px; text-align: center;">
              <button @click="deleteStock(stock.id)" style="background: none; border: none; color: #ef4444; cursor: pointer; font-weight: bold;">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 4. ПАГИНАЦИЯ -->
      <div v-if="totalPages > 1" style="margin-top: 30px; display: flex; justify-content: center; align-items: center; gap: 8px;">
        <button @click="currentPage = 1" :disabled="currentPage === 1" class="page-btn">«</button>
        <button @click="currentPage--" :disabled="currentPage === 1" class="page-btn">‹</button>
        
        <div style="display: flex; gap: 5px;">
          <button v-for="page in totalPages" :key="page" 
                  @click="currentPage = page"
                  :style="currentPage === page ? { background: '#166534', color: 'white', borderColor: '#166534' } : {}"
                  class="page-btn-num">
            {{ page }}
          </button>
        </div>

        <button @click="currentPage++" :disabled="currentPage === totalPages" class="page-btn">›</button>
        <button @click="currentPage = totalPages" :disabled="currentPage === totalPages" class="page-btn">»</button>
      </div>

      <div v-if="filteredStocks.length === 0" style="text-align: center; padding: 60px; color: #94a3b8; background: white; border-radius: 12px; margin-top: 20px;">
        Ничего не найдено.
      </div>
    </section>
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

// ПАГИНАЦИЯ
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
  } catch (e) {
    alert('Ошибка загрузки данных');
  }
};

const getProductName = (id) => products.value.find(p => p.id === id)?.name || '---';
const getProductSKU = (id) => products.value.find(p => p.id === id)?.sku || '---';
const getWarehouseCity = (id) => warehouses.value.find(w => w.id === id)?.city_name || '---';
const getWarehouseAddress = (id) => warehouses.value.find(w => w.id === id)?.address || '---';

const resetFilters = () => {
  searchQuery.value = '';
  filters.warehouseId = 'all';
  filters.categoryId = 'all';
  filters.onlyEmpty = false;
  filters.sort = 'product-name';
  currentPage.value = 1;
};

// --- ФИЛЬТРАЦИЯ ---
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

// --- ЛОГИКА ПАГИНАЦИИ ---
const totalPages = computed(() => Math.ceil(filteredStocks.value.length / itemsPerPage));
const paginatedStocks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredStocks.value.slice(start, start + itemsPerPage);
});

watch([searchQuery, filters], () => currentPage.value = 1);

// --- CRUD ---
const newStock = reactive({ product_id: null, warehouse_id: null, quantity: 0, shelf_location: '' });
const createStock = async () => {
  if (!newStock.product_id || !newStock.warehouse_id) return alert('Выберите товар и склад!');
  try {
    const res = await axios.post('/api/admin/product_stocks', newStock, config);
    stocks.value.unshift(res.data);
    alert('Принято');
    newStock.quantity = 0; newStock.shelf_location = '';
  } catch (e) { alert('Ошибка'); }
};

const updateStock = async (stock) => {
  try { await axios.put(`/api/admin/product_stocks/${stock.id}`, stock, config); } catch (e) { }
};

const deleteStock = async (id) => {
  if (!confirm('Удалить?')) return;
  try {
    await axios.delete(`/api/admin/product_stocks/${id}`, config);
    stocks.value = stocks.value.filter(s => s.id !== id);
  } catch (e) { alert('Ошибка'); }
};

onMounted(loadData);
</script>

<style scoped>
.page-btn { padding: 10px 15px; border-radius: 10px; border: 1px solid #ddd; background: white; cursor: pointer; font-weight: bold; }
.page-btn-num { width: 40px; height: 40px; border-radius: 10px; border: 1px solid #ddd; background: white; cursor: pointer; font-weight: bold; transition: 0.2s; }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
</style>