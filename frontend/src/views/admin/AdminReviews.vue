<template>
  <div class="admin-reviews">
    <h1>💬 Модерация отзывов</h1>

    <!-- 1. БЛОК УМНОЙ ФИЛЬТРАЦИИ -->
    <section style="background: #f8fafc; padding: 25px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; font-size: 1.1rem; color: #1e293b;">🔍 Поиск и фильтры</h3>
      
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; align-items: flex-end;">
        <!-- Поиск -->
        <div>
          <label style="font-size: 0.75rem; font-weight: bold; color: #64748b;">Поиск (текст, автор, товар):</label>
          <input v-model="searchQuery" placeholder="Начните вводить..." style="width: 100%; padding: 11px; border-radius: 10px; border: 1px solid #cbd5e1; margin-top: 5px;" />
        </div>

        <!-- По статусу -->
        <div>
          <label style="font-size: 0.75rem; font-weight: bold; color: #64748b;">Статус:</label>
          <select v-model="filterStatus" style="width: 100%; padding: 11px; border-radius: 10px; border: 1px solid #cbd5e1; margin-top: 5px;">
            <option value="all">Все отзывы</option>
            <option value="pending">⏳ На проверке</option>
            <option value="approved">✅ Опубликованные</option>
          </select>
        </div>

        <!-- По оценке -->
        <div>
          <label style="font-size: 0.75rem; font-weight: bold; color: #64748b;">Оценка:</label>
          <select v-model="ratingFilter" style="width: 100%; padding: 11px; border-radius: 10px; border: 1px solid #cbd5e1; margin-top: 5px;">
            <option value="all">Любая оценка</option>
            <option value="5">⭐⭐⭐⭐⭐ (5)</option>
            <option value="4">⭐⭐⭐⭐ (4)</option>
            <option value="3">⭐⭐⭐ (3)</option>
            <option value="2">⭐⭐ (2)</option>
            <option value="1">⭐ (1)</option>
          </select>
        </div>

        <button @click="resetFilters" style="padding: 12px; background: white; border: 1px solid #cbd5e1; border-radius: 10px; cursor: pointer; font-weight: 600;">
          Сбросить
        </button>
      </div>
    </section>

    <!-- 2. ТАБЛИЦА ОТЗЫВОВ -->
    <section>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #475569;">Найдено отзывов: {{ filteredReviews.length }}</h3>
        <div style="font-weight: bold; color: #94a3b8;">Страница {{ currentPage }} из {{ totalPages || 1 }}</div>
      </div>

      <table border="1" style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: var(--shadow-sm);">
        <thead style="background: #f1f5f9;">
          <tr style="text-align: left;">
            <th style="padding: 15px; width: 60px;">ID</th>
            <th>Товар</th>
            <th>Автор</th>
            <th style="width: 100px;">Оценка</th>
            <th style="width: 350px;">Комментарий</th>
            <th style="text-align: center;">Статус</th>
            <th style="text-align: center;">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in paginatedReviews" :key="r.id" :style="!r.is_approved ? {background: '#fffbeb'} : {}">
            <td style="padding: 15px; color: #94a3b8;">#{{ r.id }}</td>
            
            <td style="padding: 15px;">
              <div style="font-weight: 700; color: #1e293b; font-size: 0.9rem;">{{ getProductName(r.product_id) }}</div>
              <small style="color: #6366f1;">ID товара: {{ r.product_id }}</small>
            </td>

            <td style="padding: 15px;">
              <div style="font-weight: 600;">{{ getUserName(r.user_id) }}</div>
              <small style="color: #94a3b8;">User ID: {{ r.user_id }}</small>
            </td>

            <td style="padding: 15px; text-align: center;">
              <b style="color: #f59e0b; font-size: 1.1rem;">{{ r.rating }}</b><span style="color: #f59e0b;">★</span>
            </td>

            <td style="padding: 15px; font-size: 0.9rem;">
              <div style="margin-bottom: 5px;">{{ r.comment }}</div>
              <div v-if="r.pros" style="color: #10b981;"><small><b>+</b> {{ r.pros }}</small></div>
              <div v-if="r.cons" style="color: #f43f5e;"><small><b>−</b> {{ r.cons }}</small></div>
            </td>

            <td style="padding: 15px; text-align: center;">
              <span v-if="r.is_approved" style="color: #10b981; font-weight: 800; font-size: 0.75rem; text-transform: uppercase;">Опубликован</span>
              <span v-else style="color: #f59e0b; font-weight: 800; font-size: 0.75rem; text-transform: uppercase;">На проверке</span>
              <br />
              <button @click="toggleApproval(r)" style="margin-top: 8px; padding: 5px 10px; border-radius: 6px; border: 1px solid #ddd; background: white; cursor: pointer; font-size: 0.8rem;">
                {{ r.is_approved ? 'Скрыть' : 'Одобрить' }}
              </button>
            </td>

            <td style="padding: 15px; text-align: center;">
              <button @click="deleteReview(r.id)" style="background: none; border: none; color: #ef4444; cursor: pointer; font-weight: bold;">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 3. ПАГИНАЦИЯ -->
      <div v-if="totalPages > 1" style="margin-top: 30px; display: flex; justify-content: center; align-items: center; gap: 8px;">
        <button @click="currentPage--" :disabled="currentPage === 1" class="page-btn">←</button>
        <button v-for="p in totalPages" :key="p" @click="currentPage = p" 
                :style="currentPage === p ? {background: '#4f46e5', color: 'white', borderColor: '#4f46e5'} : {}"
                class="page-btn-num">{{ p }}</button>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="page-btn">→</button>
      </div>

      <div v-if="filteredReviews.length === 0" style="text-align: center; padding: 60px; color: #94a3b8; background: white; border-radius: 12px; margin-top: 20px;">
        Отзывов не найдено.
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import axios from 'axios';

const ADMIN_KEY = 'my_super_secret_admin_123';
const config = { headers: { 'x-admin-key': ADMIN_KEY } };

const reviews = ref([]);
const products = ref([]);
const users = ref([]);
const loading = ref(true);

// Фильтры
const filterStatus = ref('all');
const ratingFilter = ref('all');
const searchQuery = ref('');

// Пагинация
const currentPage = ref(1);
const itemsPerPage = 20;

const loadData = async () => {
  loading.value = true;
  try {
    const [rRes, pRes, uRes] = await Promise.all([
      axios.get('/api/admin/reviews', config),
      axios.get('/api/admin/products', config),
      axios.get('/api/admin/users', config)
    ]);
    reviews.value = rRes.data;
    products.value = pRes.data;
    users.value = uRes.data;
  } catch (e) {
    alert('Ошибка загрузки данных');
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filterStatus.value = 'all';
  ratingFilter.value = 'all';
  searchQuery.value = '';
  currentPage.value = 1;
};

const getProductName = (id) => products.value.find(p => p.id === id)?.name || 'Товар не найден';
const getUserName = (id) => {
  const u = users.value.find(user => user.id === id);
  return u ? `${u.first_name} ${u.last_name || ''}` : 'Гость';
};

// --- ЛОГИКА ФИЛЬТРАЦИИ ---
const filteredReviews = computed(() => {
  let res = [...reviews.value];

  // 1. По статусу
  if (filterStatus.value === 'approved') res = res.filter(r => r.is_approved);
  if (filterStatus.value === 'pending') res = res.filter(r => !r.is_approved);

  // 2. По оценке
  if (ratingFilter.value !== 'all') res = res.filter(r => r.rating === parseInt(ratingFilter.value));

  // 3. По тексту (Поиск)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(r => 
      r.comment?.toLowerCase().includes(q) ||
      getProductName(r.product_id).toLowerCase().includes(q) ||
      getUserName(r.user_id).toLowerCase().includes(q)
    );
  }

  return res;
});

// --- ЛОГИКА ПАГИНАЦИИ ---
const totalPages = computed(() => Math.ceil(filteredReviews.value.length / itemsPerPage));
const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredReviews.value.slice(start, start + itemsPerPage);
});

watch([searchQuery, filterStatus, ratingFilter], () => currentPage.value = 1);

// CRUD
const toggleApproval = async (review) => {
  try {
    const newStatus = !review.is_approved;
    await axios.put(`/api/admin/reviews/${review.id}`, { is_approved: newStatus }, config);
    review.is_approved = newStatus;
  } catch (e) { alert('Ошибка'); }
};

const deleteReview = async (id) => {
  if (!confirm('Удалить отзыв навсегда?')) return;
  try {
    await axios.delete(`/api/admin/reviews/${id}`, config);
    reviews.value = reviews.value.filter(r => r.id !== id);
  } catch (e) { alert('Ошибка'); }
};

onMounted(loadData);
</script>

<style scoped>
.page-btn { padding: 10px 15px; border-radius: 10px; border: 1px solid #ddd; background: white; cursor: pointer; font-weight: bold; }
.page-btn-num { width: 40px; height: 40px; border-radius: 10px; border: 1px solid #ddd; background: white; cursor: pointer; font-weight: bold; }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
</style>