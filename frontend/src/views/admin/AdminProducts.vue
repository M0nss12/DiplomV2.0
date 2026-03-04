<template>
  <div class="admin-products">
    <h1>Управление товарами (CRUD)</h1>

    <!-- 1. ФОРМА ДОБАВЛЕНИЯ ТОВАРА -->
    <section style="border: 1px solid #000; padding: 15px; margin-bottom: 30px; background: #f9f9f9;">
      <h3>Добавить новый товар</h3>
      <form @submit.prevent="createProduct">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
          <input v-model="newProduct.name" placeholder="Название товара" required />
          <input v-model="newProduct.sku" placeholder="Артикул (SKU)" required />
          <input v-model="newProduct.price" type="number" placeholder="Цена" required />
          
          <select v-model="newProduct.category_id" required>
            <option :value="null">-- Выберите категорию --</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>

          <select v-model="newProduct.brand_id">
            <option :value="null">-- Выберите бренд --</option>
            <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>

          <div style="display: flex; flex-direction: column; gap: 5px;">
            <label style="font-size: 0.8rem; font-weight: bold;">Изображение:</label>
            <input type="file" @change="uploadPhoto" accept="image/*" />
            <input v-model="newProduct.image_url" placeholder="URL изображения" />
          </div>
        </div>
        <br />
        <button type="submit" :disabled="uploading" style="background: green; color: white; padding: 10px 20px; cursor: pointer;">
          {{ uploading ? 'Загрузка...' : 'Создать товар' }}
        </button>
      </form>
    </section>

    <hr />

    <!-- 2. БЛОК УМНОЙ ФИЛЬТРАЦИИ И ПОИСКА -->
    <section style="background: #eef2ff; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #c7d2fe;">
      <h3 style="margin-top: 0;">🔍 Фильтры и поиск</h3>
      
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; align-items: flex-end;">
        <div>
          <label style="font-size: 0.8rem; font-weight: bold;">Поиск по названию/SKU:</label>
          <input v-model="searchQuery" placeholder="Введите название или артикул..." style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;" />
        </div>

        <div>
          <label style="font-size: 0.8rem; font-weight: bold;">Категория:</label>
          <select v-model="filters.categoryId" style="width: 100%; padding: 10px; border-radius: 8px;">
            <option value="all">Все категории</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div>
          <label style="font-size: 0.8rem; font-weight: bold;">Бренд:</label>
          <select v-model="filters.brandId" style="width: 100%; padding: 10px; border-radius: 8px;">
            <option value="all">Все бренды</option>
            <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>

        <div>
          <label style="font-size: 0.8rem; font-weight: bold;">Сортировка:</label>
          <select v-model="filters.sort" style="width: 100%; padding: 10px; border-radius: 8px;">
            <option value="new">Сначала новые</option>
            <option value="price-asc">Дешевле</option>
            <option value="price-desc">Дороже</option>
            <option value="name">По алфавиту</option>
          </select>
        </div>
      </div>

      <div style="margin-top: 15px; display: flex; gap: 20px; align-items: center;">
        <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" v-model="filters.onlyDiscount" /> Только товары со скидкой
        </label>
        <button @click="resetFilters" style="background: none; border: none; color: #475be8; cursor: pointer; text-decoration: underline;">Сбросить всё</button>
      </div>
    </section>

    <!-- 3. СПИСОК ТОВАРОВ -->
    <section>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3>Найдено товаров: {{ filteredProducts.length }}</h3>
        <div style="color: #64748b; font-size: 0.9rem;">
            Показана страница {{ currentPage }} из {{ totalPages || 1 }}
        </div>
      </div>
      
      <table border="1" style="width: 100%; border-collapse: collapse; background: white;">
        <thead style="background: #f8fafc;">
          <tr>
            <th>ID</th>
            <th>Фото</th>
            <th>Инфо о товаре</th>
            <th>Категория / Бренд</th>
            <th>Цена</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in paginatedProducts" :key="p.id">
            <td style="text-align: center;">{{ p.id }}</td>
            <td style="text-align: center; padding: 10px;">
              <img :src="p.image_url" width="60" style="object-fit: contain; background: white; border-radius: 8px;" @error="p.image_url = '/assets/images/no-photo.png'"/>
              <input type="file" @change="(e) => uploadPhotoToExisting(e, p)" style="font-size: 0.6rem; width: 80px; margin-top: 5px;" />
            </td>
            
            <td style="padding: 10px;">
              <input v-model="p.name" @change="updateProduct(p)" style="width: 95%; font-weight: bold; margin-bottom: 5px;" />
              <div style="display: flex; gap: 10px; align-items: center;">
                <small>SKU:</small> <input v-model="p.sku" @change="updateProduct(p)" style="width: 120px; font-size: 0.8rem;" />
              </div>
            </td>

            <td style="padding: 10px;">
              <select v-model="p.category_id" @change="updateProduct(p)" style="width: 100%; margin-bottom: 5px;">
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <select v-model="p.brand_id" @change="updateProduct(p)" style="width: 100%;">
                <option :value="null">Без бренда</option>
                <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </td>

            <td style="padding: 10px;">
              <div style="margin-bottom: 5px;">
                <b><input v-model.number="p.price" type="number" @change="updateProduct(p)" style="width: 80px;" /> ₽</b>
              </div>
              <small>Скидка:</small> <input v-model.number="p.discount_price" type="number" @change="updateProduct(p)" style="width: 80px; color: red;" />
            </td>

            <td style="text-align: center;">
              <button @click="deleteProduct(p.id)" style="background: #fee2e2; color: #ef4444; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 4. БЛОК ПАГИНАЦИИ -->
      <div v-if="totalPages > 1" style="margin-top: 30px; display: flex; justify-content: center; align-items: center; gap: 10px;">
        <button @click="currentPage--" :disabled="currentPage === 1" style="padding: 8px 15px; border-radius: 8px; border: 1px solid #ddd; background: white; cursor: pointer;">
          ← Пред.
        </button>
        
        <div style="display: flex; gap: 5px;">
          <button v-for="page in totalPages" :key="page" 
                  @click="currentPage = page"
                  :style="currentPage === page ? { background: '#475be8', color: 'white', borderColor: '#475be8' } : {}"
                  style="width: 35px; height: 35px; border-radius: 8px; border: 1px solid #ddd; background: white; cursor: pointer; font-weight: bold;">
            {{ page }}
          </button>
        </div>

        <button @click="currentPage++" :disabled="currentPage === totalPages" style="padding: 8px 15px; border-radius: 8px; border: 1px solid #ddd; background: white; cursor: pointer;">
          След. →
        </button>
      </div>

    </section>
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

// ПЕРЕМЕННЫЕ ПАГИНАЦИИ
const currentPage = ref(1);
const itemsPerPage = 20;

// ОБЪЕКТ ФИЛЬТРОВ
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

// --- УМНАЯ ФИЛЬТРАЦИЯ (СУПЕР-ВЫЧИСЛЯЕМОЕ СВОЙСТВО) ---
const filteredProducts = computed(() => {
  let res = [...products.value];

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.sku.toLowerCase().includes(q) || 
      p.id.toString() === q
    );
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

// --- ВЫЧИСЛЕНИЯ ПАГИНАЦИИ ---
const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage));

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredProducts.value.slice(start, end);
});

// Сброс на 1 страницу при поиске или фильтрах
watch([searchQuery, filters], () => {
  currentPage.value = 1;
});

// --- CRUD ОПЕРАЦИИ ---
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

const updateProduct = async (p) => {
  await axios.put(`/api/admin/products/${p.id}`, p, config);
};

const deleteProduct = async (id) => {
  if (!confirm('Удалить?')) return;
  await axios.delete(`/api/admin/products/${id}`, config);
  products.value = products.value.filter(p => p.id !== id);
};

onMounted(loadData);
</script>