<template>
  <div class="admin-reviews">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>💬 Модерация отзывов</h1>
        <p class="subtitle">Проверка и управление мнениями пользователей о товарах</p>
      </div>
      <div class="stats-badge">
        Найдено: <b>{{ filteredReviews.length }}</b>
      </div>
    </div>

    <!-- 1. БЛОК ФИЛЬТРОВ -->
    <section class="admin-card filter-section">
      <div class="filter-grid">
        <div class="input-group search-group">
          <label>🔍 Поиск</label>
          <input v-model="searchQuery" placeholder="Текст, автор или товар..." />
        </div>

        <div class="input-group">
          <label>Статус</label>
          <select v-model="filterStatus">
            <option value="all">Все отзывы</option>
            <option value="pending">⏳ На проверке</option>
            <option value="approved">✅ Опубликованные</option>
          </select>
        </div>

        <div class="input-group">
          <label>Оценка</label>
          <select v-model="ratingFilter">
            <option value="all">Любая оценка</option>
            <option value="5">⭐⭐⭐⭐⭐ (5)</option>
            <option value="4">⭐⭐⭐⭐ (4)</option>
            <option value="3">⭐⭐⭐ (3)</option>
            <option value="2">⭐⭐ (2)</option>
            <option value="1">⭐ (1)</option>
          </select>
        </div>

        <button @click="resetFilters" class="btn-secondary">Сбросить</button>
      </div>
    </section>

    <!-- 2. ТАБЛИЦА ОТЗЫВОВ -->
    <div class="table-container">
      <div class="table-meta">
        Страница {{ currentPage }} из {{ totalPages || 1 }}
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-id">ID</th>
              <th>Товар</th>
              <th>Автор</th>
              <th class="text-center">Оценка</th>
              <th class="col-comment">Комментарий</th>
              <th class="text-center">Статус</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in paginatedReviews" :key="r.id" :class="{ 'row-pending': !r.is_approved }">
              <td class="col-id">#{{ r.id }}</td>
              
              <td>
                <div class="product-info">
                  <span class="product-name">{{ getProductName(r.product_id) }}</span>
                  <small class="id-label">ID: {{ r.product_id }}</small>
                </div>
              </td>

              <td>
                <div class="author-info">
                  <span class="author-name">{{ getUserName(r.user_id) }}</span>
                  <small class="id-label">User ID: {{ r.user_id }}</small>
                </div>
              </td>

              <td class="text-center">
                <div class="rating-badge">
                  <b>{{ r.rating }}</b><span>★</span>
                </div>
              </td>

              <td class="col-comment">
                <div class="comment-text">{{ r.comment }}</div>
                <div class="pros-cons">
                  <div v-if="r.pros" class="pros"><b>+</b> {{ r.pros }}</div>
                  <div v-if="r.cons" class="cons"><b>−</b> {{ r.cons }}</div>
                </div>
              </td>

              <td class="text-center">
                <div class="status-cell">
                  <span class="badge" :class="r.is_approved ? 'approved' : 'pending'">
                    {{ r.is_approved ? 'Опубликован' : 'На проверке' }}
                  </span>
                  <button @click="toggleApproval(r)" class="btn-toggle-status">
                    {{ r.is_approved ? 'Скрыть' : 'Одобрить' }}
                  </button>
                </div>
              </td>

              <td class="text-right">
                <button @click="deleteReview(r.id)" class="btn-delete">Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 3. ПАГИНАЦИЯ -->
      <div v-if="totalPages > 1" class="pagination-wrapper">
        <button @click="currentPage--" :disabled="currentPage === 1" class="p-btn">←</button>
        <div class="p-numbers">
          <button v-for="p in totalPages" :key="p" @click="currentPage = p" :class="{ active: currentPage === p }">
            {{ p }}
          </button>
        </div>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-btn">→</button>
      </div>

      <div v-if="filteredReviews.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>Отзывов не найдено</h3>
        <p>Попробуйте изменить параметры фильтрации</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/* КОД СКРИПТА ОСТАВЛЯЕМ ТВОЙ ОРИГИНАЛЬНЫЙ (логика не меняется) */
import { ref, onMounted, computed, reactive, watch } from 'vue';
import axios from 'axios';

const ADMIN_KEY = 'my_super_secret_admin_123';
const config = { headers: { 'x-admin-key': ADMIN_KEY } };

const reviews = ref([]);
const products = ref([]);
const users = ref([]);
const loading = ref(true);

const filterStatus = ref('all');
const ratingFilter = ref('all');
const searchQuery = ref('');
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
  } catch (e) { console.error('Ошибка загрузки данных'); } 
  finally { loading.value = false; }
};

const resetFilters = () => {
  filterStatus.value = 'all'; ratingFilter.value = 'all'; searchQuery.value = ''; currentPage.value = 1;
};

const getProductName = (id) => products.value.find(p => p.id === id)?.name || 'Товар не найден';
const getUserName = (id) => {
  const u = users.value.find(user => user.id === id);
  return u ? `${u.first_name} ${u.last_name || ''}` : 'Гость';
};

const filteredReviews = computed(() => {
  let res = [...reviews.value];
  if (filterStatus.value === 'approved') res = res.filter(r => r.is_approved);
  if (filterStatus.value === 'pending') res = res.filter(r => !r.is_approved);
  if (ratingFilter.value !== 'all') res = res.filter(r => r.rating === parseInt(ratingFilter.value));
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

const totalPages = computed(() => Math.ceil(filteredReviews.value.length / itemsPerPage));
const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredReviews.value.slice(start, start + itemsPerPage);
});

watch([searchQuery, filterStatus, ratingFilter], () => currentPage.value = 1);

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
.admin-reviews {
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

.card-title { margin-top: 0; margin-bottom: 25px; font-size: 1.1rem; font-weight: 700; }

/* ФИЛЬТРЫ */
.filter-section { background-color: var(--bg-input) !important; border-style: dashed !important; }
.filter-grid { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 20px; align-items: flex-end; }

.input-group label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted) !important; margin-bottom: 8px; text-transform: uppercase; }

input, select {
  width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border-color);
  background-color: var(--bg-input) !important; color: var(--text-main) !important; transition: all 0.2s;
}

.btn-secondary { padding: 12px 20px; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer; color: var(--text-main); font-weight: 600; }

/* ТАБЛИЦА */
.table-meta { margin-bottom: 10px; font-size: 0.85rem; color: var(--text-muted); }
.admin-table-wrapper { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { background-color: var(--bg-input) !important; padding: 18px 20px; text-align: left; font-size: 0.75rem; color: var(--text-muted) !important; border-bottom: 2px solid var(--border-color); text-transform: uppercase; }
.admin-table td { padding: 15px 20px; border-bottom: 1px solid var(--border-color); color: var(--text-main) !important; vertical-align: middle; }

/* ПОДСВЕТКА ОЖИДАЮЩИХ */
.row-pending { background-color: rgba(245, 158, 11, 0.05); }

/* ДАННЫЕ В ТАБЛИЦЕ */
.col-id { color: var(--text-muted) !important; font-family: monospace; width: 60px; }
.product-name, .author-name { display: block; font-weight: 700; color: var(--text-main); font-size: 0.95rem; }
.id-label { color: var(--text-muted); font-size: 0.75rem; }

.rating-badge { color: var(--warning); font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 2px; }

.col-comment { width: 350px; }
.comment-text { font-size: 0.9rem; line-height: 1.4; margin-bottom: 8px; }
.pros-cons { font-size: 0.8rem; }
.pros { color: var(--success); }
.cons { color: var(--danger); }

/* СТАТУСЫ */
.badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; }
.approved { background: var(--success-light) !important; color: var(--success) !important; }
.pending { background: var(--warning-light) !important; color: var(--warning) !important; }

.btn-toggle-status { display: block; width: 100%; background: var(--bg-input); border: 1px solid var(--border-color); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; color: var(--text-main); }

.btn-delete { background: var(--danger-light); color: var(--danger) !important; border: none; padding: 8px 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }

/* ПАГИНАЦИЯ */
.pagination-wrapper { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 40px; }
.p-btn { padding: 10px 15px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-main); cursor: pointer; }
.p-numbers { display: flex; gap: 8px; }
.p-numbers button { width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-main); cursor: pointer; font-weight: 700; }
.p-numbers button.active { background-color: var(--primary); color: #fff; border-color: var(--primary); }

/* ПУСТОЕ СОСТОЯНИЕ */
.empty-state { text-align: center; padding: 80px 20px; background-color: var(--bg-input); border-radius: var(--radius-lg); border: 2px dashed var(--border-color); color: var(--text-muted); }
.empty-icon { font-size: 3rem; margin-bottom: 15px; opacity: 0.5; }

/* ТЕМНАЯ ТЕМА ФОРС */
:deep(body.dark-theme) .admin-card { background-color: #1e293b !important; }
:deep(body.dark-theme) .admin-table tr:hover { background-color: rgba(255,255,255,0.02); }
</style>