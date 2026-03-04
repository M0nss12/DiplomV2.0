<template>
  <div class="admin-brands">
    <h1>🏭 Управление брендами</h1>

    <!-- 1. ФОРМА СОЗДАНИЯ -->
    <section style="border: 1px solid #e2e8f0; padding: 25px; margin-bottom: 30px; background: #fff; border-radius: 16px; box-shadow: var(--shadow-sm);">
      <h3 style="margin-top: 0; color: #1e293b;">Добавить новый бренд</h3>
      <form @submit.prevent="createBrand" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; align-items: flex-end;">
        
        <div>
          <label style="font-size: 0.8rem; font-weight: bold; color: #64748b;">Название:</label>
          <input v-model="newBrand.name" placeholder="Напр. Bosch" required style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd;" />
        </div>

        <div>
          <label style="font-size: 0.8rem; font-weight: bold; color: #64748b;">Страна:</label>
          <input v-model="newBrand.country" placeholder="Напр. Германия" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd;" />
        </div>

        <!-- Загрузка Лого -->
        <div>
          <label style="font-size: 0.8rem; font-weight: bold; color: #64748b;">Логотип бренда:</label>
          <input type="file" @change="(e) => handleFileUpload(e, 'new')" accept="image/*" style="font-size: 0.8rem; margin-bottom: 5px;" />
          <input v-model="newBrand.logo_url" placeholder="Или URL логотипа" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #eee; font-size: 0.8rem;" />
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600;">
            <input type="checkbox" v-model="newBrand.is_popular" /> Популярный (на главную)
          </label>
          <button type="submit" :disabled="uploading" style="background: #4f46e5; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.3s;">
            {{ uploading ? 'Загрузка...' : 'Добавить бренд' }}
          </button>
        </div>
      </form>
    </section>

    <hr />

    <!-- 2. УМНАЯ ФИЛЬТРАЦИЯ -->
    <section style="background: #f8fafc; padding: 20px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; font-size: 1rem; color: #64748b;">🔍 Поиск и фильтры</h3>
      <div style="display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr; gap: 15px; align-items: flex-end;">
        
        <div>
          <label style="font-size: 0.8rem; font-weight: bold; color: #475569;">Поиск по названию:</label>
          <input v-model="searchQuery" placeholder="Введите имя бренда..." style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; margin-top: 5px;" />
        </div>

        <div>
          <label style="font-size: 0.8rem; font-weight: bold; color: #475569;">Страна:</label>
          <select v-model="countryFilter" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; margin-top: 5px;">
            <option value="all">Все страны</option>
            <option v-for="country in uniqueCountries" :key="country" :value="country">{{ country }}</option>
          </select>
        </div>

        <div style="padding-bottom: 12px;">
          <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 600;">
            <input type="checkbox" v-model="popularOnly" /> Только популярные
          </label>
        </div>

        <button @click="resetFilters" style="padding: 12px; background: white; border: 1px solid #cbd5e1; border-radius: 10px; cursor: pointer; font-weight: 600;">
          Сбросить всё
        </button>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА БРЕНДОВ -->
    <section>
      <div style="margin-bottom: 10px; color: #94a3b8; font-size: 0.9rem;">
        Найдено: {{ filteredBrands.length }} | Страница {{ currentPage }} из {{ totalPages || 1 }}
      </div>

      <table border="1" style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background: #f1f5f9; text-align: left;">
            <th style="padding: 15px;">ID</th>
            <th>Логотип (клик для смены)</th>
            <th>Название бренда</th>
            <th>Страна</th>
            <th style="text-align: center;">Популярный</th>
            <th style="text-align: center;">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="brand in paginatedBrands" :key="brand.id" style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 15px; color: #94a3b8;">#{{ brand.id }}</td>
            
            <!-- Интерактивный логотип -->
            <td style="padding: 10px; text-align: center;">
              <div style="position: relative; display: inline-block;">
                <img :src="brand.logo_url || '/assets/images/no-brand.png'" width="80" height="40" style="object-fit: contain; background: #fff; border-radius: 6px; border: 1px solid #eee; padding: 4px;" />
                <input type="file" @change="(e) => handleFileUpload(e, 'edit', brand)" style="position: absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer;" title="Сменить лого" />
              </div>
            </td>

            <td>
              <input v-model="brand.name" @change="updateBrand(brand)" style="width: 90%; font-weight: 800; border: none; padding: 8px; border-radius: 6px;" />
            </td>

            <td>
              <input v-model="brand.country" @change="updateBrand(brand)" style="width: 90%; color: #64748b; border: none; padding: 8px;" />
            </td>

            <td style="text-align: center;">
              <input type="checkbox" v-model="brand.is_popular" @change="updateBrand(brand)" style="transform: scale(1.2); cursor: pointer;" />
            </td>

            <td style="text-align: center;">
              <button @click="deleteBrand(brand.id)" style="color: #ef4444; border: none; background: #fff1f2; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-weight: bold;">
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

const brands = ref([]);
const searchQuery = ref('');
const countryFilter = ref('all');
const popularOnly = ref(false);
const uploading = ref(false);

// ПАГИНАЦИЯ
const currentPage = ref(1);
const itemsPerPage = 20;

const newBrand = reactive({ name: '', country: '', logo_url: '', is_popular: true });

const fetchBrands = async () => {
  try {
    const res = await axios.get('/api/admin/brands', config);
    brands.value = res.data;
  } catch (e) { alert('Ошибка загрузки'); }
};

// Список уникальных стран для фильтра
const uniqueCountries = computed(() => {
  const countries = brands.value.map(b => b.country).filter(c => c);
  return Array.from(new Set(countries)).sort();
});

const resetFilters = () => {
  searchQuery.value = '';
  countryFilter.value = 'all';
  popularOnly.value = false;
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
    const res = await axios.post('/api/upload/brands', formData);
    if (mode === 'new') {
      newBrand.logo_url = res.data.url;
    } else {
      target.logo_url = res.data.url;
      await updateBrand(target);
    }
  } catch (e) {
    alert('Ошибка загрузки логотипа');
  } finally {
    uploading.value = false;
  }
};

// --- ФИЛЬТРАЦИЯ ---
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

// --- ЛОГИКА ПАГИНАЦИИ ---
const totalPages = computed(() => Math.ceil(filteredBrands.value.length / itemsPerPage));
const paginatedBrands = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredBrands.value.slice(start, start + itemsPerPage);
});

watch([searchQuery, countryFilter, popularOnly], () => currentPage.value = 1);

// --- CRUD ---
const createBrand = async () => {
  try {
    const res = await axios.post('/api/admin/brands', newBrand, config);
    brands.value.unshift(res.data);
    alert('Бренд добавлен');
    Object.assign(newBrand, { name: '', country: '', logo_url: '', is_popular: true });
  } catch (e) { alert('Ошибка создания'); }
};

const updateBrand = async (brand) => {
  try { await axios.put(`/api/admin/brands/${brand.id}`, brand, config); } catch (e) { }
};

const deleteBrand = async (id) => {
  if (!confirm('Удалить бренд? Это может повлиять на товары.')) return;
  try {
    await axios.delete(`/api/admin/brands/${id}`, config);
    brands.value = brands.value.filter(b => b.id !== id);
  } catch (e) { alert('Ошибка удаления'); }
};

onMounted(fetchBrands);
</script>