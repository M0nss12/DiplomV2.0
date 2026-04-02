<template>
  <div class="admin-reviews">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>💬 Модерация и правка отзывов</h1>
        <p class="subtitle">Управление мнениями: проверка текстов, исправление ошибок и публикация</p>
      </div>
      <div class="stats-badge">
        <span class="stats-icon">📊</span>
        Найдено: <b>{{ filteredReviews.length }}</b>
      </div>
    </div>

    <!-- 1. ПРОДВИНУТЫЕ ФИЛЬТРЫ -->
    <section class="admin-card filter-section">
      <div class="filter-header">
        <h3 class="card-title">🔍 Поиск и фильтрация</h3>
        <button @click="resetFilters" class="btn-text-link">Сбросить всё</button>
      </div>
      <div class="filter-grid">
        <div class="input-group search-group">
          <label>🔎 Умный поиск (Текст, Имя, ID отзыва/товара/юзера)</label>
          <input v-model="searchQuery" placeholder="Начните вводить данные..." />
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
            <option v-for="n in 5" :key="n" :value="n">{{ n }} ★</option>
          </select>
        </div>

        <div class="input-group">
          <label>Сортировка</label>
          <select v-model="sortOrder">
            <option value="new">Сначала новые</option>
            <option value="old">Сначала старые</option>
            <option value="rating-desc">Высокий рейтинг</option>
            <option value="rating-asc">Низкий рейтинг</option>
          </select>
        </div>
      </div>
    </section>

    <!-- 2. ТАБЛИЦА ОТЗЫВОВ -->
    <div class="table-container">
      <div class="table-meta">
        <span class="meta-icon">📄</span>
        Страница {{ currentPage }} из {{ totalPages || 1 }}
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-id">ID / Дата</th>
              <th>Товар (Цель отзыва)</th>
              <th>Автор (Клиент)</th>
              <th class="text-center">Оценка</th>
              <th class="col-content">Содержание (Кликните для правки)</th>
              <th class="text-center">Публикация</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in paginatedReviews" :key="r.id" :class="{ 'row-pending': !r.is_approved }" class="review-row">
              
              <!-- ID и ДАТА -->
              <td class="col-id">
                <span class="id-badge">#{{ r.id }}</span>
                <div class="date-tag">{{ formatDate(r.created_at) }}</div>
              </td>
              
              <!-- ТОВАР (Только чтение для безопасности) -->
              <td>
                <div class="info-block">
                  <strong class="info-title">{{ getProductName(r.product_id) }}</strong>
                  <div class="info-subtitle">ID Товара: {{ r.product_id }}</div>
                  <div class="sku-hint">SKU: {{ getProductSKU(r.product_id) }}</div>
                </div>
              </td>

              <!-- АВТОР (Только чтение для безопасности) -->
              <td>
                <div class="info-block">
                  <strong class="info-title">{{ getUserName(r.user_id) }}</strong>
                  <div class="info-subtitle">User ID: {{ r.user_id }}</div>
                </div>
              </td>

              <!-- ОЦЕНКА (Редактируемая) -->
              <td class="text-center">
                <div class="rating-select-wrapper">
                  <select v-model.number="r.rating" @change="updateReview(r)" class="rating-select">
                    <option v-for="n in 5" :key="n" :value="n">{{ n }} ★</option>
                  </select>
                </div>
              </td>

              <!-- ТЕКСТЫ (Редактируемые) -->
              <td class="col-content">
                <div class="edit-fields-group">
                  <div class="field-row">
                    <label>💬 Комментарий:</label>
                    <textarea v-model="r.comment" @change="updateReview(r)" rows="2" placeholder="Текст отзыва..."></textarea>
                  </div>
                  <div class="field-row">
                    <label class="p-label">➕ Плюсы:</label>
                    <input v-model="r.pros" @change="updateReview(r)" placeholder="Не указано" />
                  </div>
                  <div class="field-row">
                    <label class="c-label">➖ Минусы:</label>
                    <input v-model="r.cons" @change="updateReview(r)" placeholder="Не указано" />
                  </div>
                </div>
              </td>

              <!-- СТАТУС (Toggle) -->
              <td class="text-center">
                <div class="status-toggle-box">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="r.is_approved" @change="updateReview(r)" />
                    <span class="toggle-slider"></span>
                  </label>
                  <span class="status-text" :class="{ 'active': r.is_approved }">
                    {{ r.is_approved ? 'ОПУБЛИКОВАН' : 'СКРЫТ' }}
                  </span>
                </div>
              </td>

              <!-- УДАЛЕНИЕ -->
              <td class="text-right">
                <button @click="deleteReview(r.id)" class="btn-delete-small" title="Удалить отзыв навсегда">🗑️ Удалить</button>
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

      <!-- ПУСТОЕ СОСТОЯНИЕ -->
      <div v-if="!loading && filteredReviews.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>Отзывы не найдены</h3>
        <p>Попробуйте изменить параметры поиска или фильтры.</p>
        <button @click="resetFilters" class="btn-primary-small">Сбросить всё</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
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
const sortOrder = ref('new');
const currentPage = ref(1);
const itemsPerPage = 15;

const formatDate = (date) => date ? new Date(date).toLocaleDateString('ru-RU') : '';

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
  } catch (e) { console.error('Ошибка загрузки'); } 
  finally { loading.value = false; }
};

const resetFilters = () => {
  filterStatus.value = 'all';
  ratingFilter.value = 'all';
  searchQuery.value = '';
  sortOrder.value = 'new';
  currentPage.value = 1;
};

const getProductName = (id) => products.value.find(p => p.id === id)?.name || 'Товар удален';
const getProductSKU = (id) => products.value.find(p => p.id === id)?.sku || '---';
const getUserName = (id) => {
  const u = users.value.find(user => user.id === id);
  return u ? `${u.last_name || ''} ${u.first_name || ''}`.trim() || `Пользователь #${id}` : `Пользователь #${id}`;
};

const filteredReviews = computed(() => {
  let res = [...reviews.value];
  
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(r => {
      const p = products.value.find(item => item.id === r.product_id) || {};
      const u = users.value.find(user => user.id === r.user_id) || {};
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
      return (
        r.id.toString() === q || 
        r.product_id.toString() === q || 
        r.user_id.toString().toLowerCase().includes(q) || 
        (r.comment && r.comment.toLowerCase().includes(q)) || 
        (p.name && p.name.toLowerCase().includes(q)) || 
        fullName.includes(q)
      );
    });
  }

  if (filterStatus.value === 'approved') res = res.filter(r => r.is_approved);
  if (filterStatus.value === 'pending') res = res.filter(r => !r.is_approved);
  if (ratingFilter.value !== 'all') res = res.filter(r => r.rating === parseInt(ratingFilter.value));

  if (sortOrder.value === 'new') res.sort((a, b) => b.id - a.id);
  else if (sortOrder.value === 'old') res.sort((a, b) => a.id - b.id);
  else if (sortOrder.value === 'rating-desc') res.sort((a, b) => b.rating - a.rating);
  else if (sortOrder.value === 'rating-asc') res.sort((a, b) => a.rating - b.rating);

  return res;
});

const totalPages = computed(() => Math.ceil(filteredReviews.value.length / itemsPerPage));
const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredReviews.value.slice(start, start + itemsPerPage);
});

watch([searchQuery, filterStatus, ratingFilter, sortOrder], () => currentPage.value = 1);

const updateReview = async (review) => {
  try {
    await axios.put(`/api/admin/reviews/${review.id}`, review, config);
  } catch (e) { alert('Ошибка сохранения'); }
};

const deleteReview = async (id) => {
  if (!confirm('Отзыв будет удален безвозвратно. Продолжить?')) return;
  try {
    await axios.delete(`/api/admin/reviews/${id}`, config);
    reviews.value = reviews.value.filter(r => r.id !== id);
  } catch (e) { alert('Ошибка при удалении'); }
};

onMounted(loadData);
</script>

<style scoped>
/* ==========================================================================
   АДМИНКА: УПРАВЛЕНИЕ ОТЗЫВАМИ – СОВРЕМЕННЫЙ СТИЛЬ (БЕЗ КРАСНЫХ ВЫДЕЛЕНИЙ)
   ========================================================================== */

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin { to { transform: rotate(360deg); } }

.admin-reviews {
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

.stats-icon { font-size: 1.2rem; }

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

.filter-header {
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

.filter-section {
  background: var(--bg-input);
  border-style: solid;
}

.filter-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 24px;
  align-items: flex-end;
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
  min-width: 1100px;
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

/* Строка с ожидающим отзывом – слабая подсветка (не красная) */
.row-pending {
  background: rgba(245, 158, 11, 0.04);
}

.review-row:hover td {
  background: var(--primary-light);
}

.col-id {
  width: 80px;
  font-weight: 700;
}

.id-badge {
  display: inline-block;
  font-weight: 800;
  color: var(--primary);
  font-family: monospace;
}

.date-tag {
  display: block;
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Информационные блоки */
.info-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
}

.info-subtitle,
.sku-hint {
  font-size: 0.7rem;
  color: var(--text-muted);
}

/* Выбор рейтинга */
.rating-select-wrapper {
  display: flex;
  justify-content: center;
}

.rating-select {
  width: 80px;
  padding: 6px 10px;
  border-radius: 30px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  font-weight: 700;
  text-align: center;
  cursor: pointer;
}

/* Редактируемые поля */
.col-content {
  min-width: 320px;
}

.edit-fields-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-row label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.field-row label.p-label { color: var(--success); }
.field-row label.c-label { color: var(--danger); }

.field-row textarea,
.field-row input {
  width: 100%;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 0.85rem;
  transition: all 0.2s;
  resize: vertical;
}

.field-row textarea:focus,
.field-row input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-light);
  outline: none;
}

/* Переключатель статуса (toggle) */
.status-toggle-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color);
  transition: 0.3s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--success);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.status-text {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--text-muted);
}

.status-text.active {
  color: var(--success);
}

/* Кнопка удаления */
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

/* Пустое состояние */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--border-color);
  margin-top: 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.3rem;
  margin-bottom: 8px;
}

.empty-state p {
  color: var(--text-muted);
  margin-bottom: 20px;
}

.btn-primary-small {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 40px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary-small:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
}

/* АДАПТИВНОСТЬ */
@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .admin-reviews {
    padding: 24px 16px;
  }
  .header-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .filter-grid {
    grid-template-columns: 1fr;
  }
  .admin-table th,
  .admin-table td {
    padding: 12px;
  }
  .pagination-wrapper {
    flex-direction: column;
  }
  .status-toggle-box {
    flex-direction: column;
    gap: 8px;
  }
  .col-content {
    min-width: 250px;
  }
}

/* ТЁМНАЯ ТЕМА */
body.dark-theme .admin-card {
  background: rgba(30, 41, 59, 0.95);
}
</style>