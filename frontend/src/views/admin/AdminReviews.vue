<template>
  <div class="admin-reviews">
    <!-- ШАПКА -->
    <div class="header-row">
      <div class="header-left">
        <h1>💬 Управление отзывами</h1>
        <p class="subtitle">Модерация текстов, управление галереей</p>
      </div>
      <div class="stats-badge">
        <span class="stats-icon">📊</span>
        Всего: <b>{{ filteredReviews.length }}</b>
      </div>
    </div>

    <!-- ФИЛЬТРЫ -->
    <section class="admin-card filter-section">
      <div class="filter-header">
        <h3 class="card-title">🔍 Фильтры и поиск</h3>
        <button @click="resetFilters" class="btn-text-link">Сбросить всё</button>
      </div>
      <div class="filter-grid">
        <div class="input-group search-group">
          <label>🔎 Поиск (текст, имя, товар)</label>
          <input v-model="searchQuery" placeholder="Введите текст отзыва, имя пользователя или название товара..." />
        </div>
        <div class="input-group">
          <label>⭐ Оценка</label>
          <select v-model="ratingFilter">
            <option value="all">Любая</option>
            <option v-for="n in 5" :key="n" :value="n">{{ n }} ★</option>
          </select>
        </div>
        <div class="input-group">
          <label>📌 Статус</label>
          <select v-model="statusFilter">
            <option value="all">Все</option>
            <option value="approved">Опубликованные</option>
            <option value="pending">На модерации</option>
          </select>
        </div>
        <div class="input-group">
          <label>📊 Сортировка</label>
          <select v-model="sortOrder">
            <option value="new">Сначала новые</option>
            <option value="old">Сначала старые</option>
            <option value="rating-desc">Высокий рейтинг</option>
            <option value="rating-asc">Низкий рейтинг</option>
          </select>
        </div>
      </div>
    </section>

    <!-- ТАБЛИЦА ОТЗЫВОВ -->
    <div class="table-container">
      <div class="table-meta">
        <span class="meta-icon">📄</span>
        Страница {{ currentPage }} из {{ totalPages || 1 }}
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-id">ID</th>
              <th>Товар / Автор</th>
              <th class="text-center">Оценка</th>
              <th class="col-content">Отзыв и галерея</th>
              <th class="text-center">Статус</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in paginatedReviews" :key="r.id" class="review-row" :class="{ 'row-pending': !r.is_approved }">
              <td class="col-id">
                <span class="id-badge">#{{ r.id }}</span>
                <div class="date-tag">{{ formatDate(r.created_at) }}</div>
              </td>
              
              <td>
                <div class="review-meta-info">
                  <div class="product-name">{{ getProductName(r.product_id) }}</div>
                  <div class="user-name">👤 {{ getUserName(r.user_id) }}</div>
                </div>
              </td>

              <td class="text-center">
                <select v-model.number="r.rating" @change="saveReview(r)" class="rating-select">
                  <option v-for="n in 5" :key="n" :value="n">{{ n }} ★</option>
                </select>
              </td>

              <td class="col-content">
                <div class="review-body-edit">
                  <div class="text-fields">
                    <label>💬 Комментарий:</label>
                    <textarea v-model="r.comment" @change="saveReview(r)" class="comment-textarea" placeholder="Текст отзыва..."></textarea>
                    
                    <div class="pros-cons-grid">
                      <div>
                        <label class="label-pros">➕ Плюсы:</label>
                        <input v-model="r.pros" @change="saveReview(r)" class="mini-input" placeholder="Не указано" />
                      </div>
                      <div>
                        <label class="label-cons">➖ Минусы:</label>
                        <input v-model="r.cons" @change="saveReview(r)" class="mini-input" placeholder="Не указано" />
                      </div>
                    </div>
                  </div>

                  <!-- ГАЛЕРЕЯ -->
                  <div class="image-management-zone">
                    <div class="images-grid">
                      <div v-for="(imgUrl, index) in (r.images || [])" :key="index" class="img-item">
                        <img :src="imgUrl" @click="previewImage(imgUrl)" class="img-preview" />
                        <button @click="deleteSpecificImage(r, index)" class="delete-img-trigger" title="Удалить фото">✕</button>
                      </div>

                      <label v-if="(r.images?.length || 0) < 5" class="upload-new-trigger" :class="{'loading': uploadLoadingId === r.id}">
                        <input type="file" @change="(e) => handleImageUpload(e, r)" accept="image/*" hidden />
                        <span v-if="uploadLoadingId !== r.id">+</span>
                        <span v-else class="loader-mini"></span>
                      </label>
                    </div>
                    <div class="img-counter">{{ r.images?.length || 0 }} / 5 фото</div>
                  </div>
                </div>
              </td>

              <td class="text-center">
                <div class="status-wrapper">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="r.is_approved" @change="saveReview(r)" />
                    <span class="toggle-slider"></span>
                  </label>
                  <span class="status-text" :class="{ 'active': r.is_approved }">
                    {{ r.is_approved ? 'Опубликован' : 'Скрыт' }}
                  </span>
                </div>
              </td>

              <td class="text-right">
                <button @click="removeReview(r.id)" class="btn-delete-review" title="Удалить отзыв и все фото">🗑️ Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ПАГИНАЦИЯ -->
      <div v-if="totalPages > 1" class="pagination-wrapper">
        <button @click="currentPage--" :disabled="currentPage === 1" class="p-btn">←</button>
        <div class="p-numbers">
          <button v-for="page in totalPages" :key="page" @click="currentPage = page" :class="{ active: currentPage === page }">
            {{ page }}
          </button>
        </div>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-btn">→</button>
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
const uploadLoadingId = ref(null);

// Фильтры
const searchQuery = ref('');
const ratingFilter = ref('all');
const statusFilter = ref('all');
const sortOrder = ref('new');
const currentPage = ref(1);
const itemsPerPage = 10;

// Загрузка данных
const loadData = async () => {
  try {
    const [rRes, pRes, uRes] = await Promise.all([
      axios.get('/api/admin/reviews', config),
      axios.get('/api/admin/products', config),
      axios.get('/api/admin/users', config)
    ]);
    
    reviews.value = rRes.data.map(rev => ({
      ...rev,
      images: Array.isArray(rev.images) ? rev.images : [],
      pros: rev.pros || '',
      cons: rev.cons || ''
    }));
    
    products.value = pRes.data;
    users.value = uRes.data;
  } catch (e) { console.error('Ошибка загрузки'); }
};

// Извлечение имени файла из URL
const getFilenameFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  return parts.pop();
};

// Сохранение изменений
const saveReview = async (review) => {
  try {
    const payload = {
      rating: review.rating,
      comment: review.comment,
      pros: review.pros,
      cons: review.cons,
      is_approved: review.is_approved,
      images: Array.isArray(review.images) ? review.images : []
    };
    await axios.put(`/api/admin/reviews/${review.id}`, payload, config);
  } catch (e) { console.error('Ошибка сохранения'); }
};

// Загрузка нового фото
const handleImageUpload = async (event, review) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  uploadLoadingId.value = review.id;

  try {
    const res = await axios.post('/api/upload/reviews', formData);
    if (!Array.isArray(review.images)) review.images = [];
    review.images.push(res.data.url);
    await saveReview(review);
  } catch (e) {
    alert('Ошибка загрузки. Проверьте подключение.');
  } finally {
    uploadLoadingId.value = null;
  }
};

// Удаление конкретного фото
const deleteSpecificImage = async (review, index) => {
  const url = review.images[index];
  const filename = getFilenameFromUrl(url);
  if (!confirm('Удалить это фото навсегда?')) return;

  try {
    await axios.delete(`/api/storage/reviews/${filename}`, config);
    review.images.splice(index, 1);
    await saveReview(review);
  } catch (e) {
    alert('Не удалось удалить файл');
  }
};

// Удаление всего отзыва
const removeReview = async (id) => {
  const review = reviews.value.find(r => r.id === id);
  if (!review) return;
  if (!confirm('Удалить отзыв и все прикреплённые фотографии?')) return;

  try {
    if (review.images && review.images.length > 0) {
      for (const url of review.images) {
        const filename = getFilenameFromUrl(url);
        try {
          await axios.delete(`/api/storage/reviews/${filename}`, config);
        } catch (err) { /* файл уже отсутствует */ }
      }
    }
    await axios.delete(`/api/admin/reviews/${id}`, config);
    reviews.value = reviews.value.filter(r => r.id !== id);
  } catch (e) {
    alert('Ошибка при удалении отзыва');
  }
};

const getProductName = (id) => products.value.find(p => p.id === id)?.name || 'Товар удален';
const getUserName = (id) => {
  const u = users.value.find(user => user.id === id);
  return u ? `${u.last_name || ''} ${u.first_name || ''}`.trim() || 'Пользователь' : 'Гость';
};
const formatDate = (d) => new Date(d).toLocaleDateString('ru-RU');
const previewImage = (url) => window.open(url, '_blank');

// Фильтрация и сортировка
const filteredReviews = computed(() => {
  let res = [...reviews.value];

  // Поиск
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(r => {
      const product = products.value.find(p => p.id === r.product_id);
      const user = users.value.find(u => u.id === r.user_id);
      const userName = user ? `${user.first_name} ${user.last_name}`.toLowerCase() : '';
      const productName = product?.name?.toLowerCase() || '';
      return (r.comment && r.comment.toLowerCase().includes(q)) ||
             (r.pros && r.pros.toLowerCase().includes(q)) ||
             (r.cons && r.cons.toLowerCase().includes(q)) ||
             productName.includes(q) ||
             userName.includes(q);
    });
  }

  // Фильтр по рейтингу
  if (ratingFilter.value !== 'all') {
    res = res.filter(r => r.rating === parseInt(ratingFilter.value));
  }

  // Фильтр по статусу
  if (statusFilter.value === 'approved') {
    res = res.filter(r => r.is_approved);
  } else if (statusFilter.value === 'pending') {
    res = res.filter(r => !r.is_approved);
  }

  // Сортировка
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

const resetFilters = () => {
  searchQuery.value = '';
  ratingFilter.value = 'all';
  statusFilter.value = 'all';
  sortOrder.value = 'new';
  currentPage.value = 1;
};

// Сброс страницы при изменении фильтров
watch([searchQuery, ratingFilter, statusFilter, sortOrder], () => {
  currentPage.value = 1;
});

onMounted(loadData);
</script>

<style scoped>
/* ==========================================================================
   АДМИНКА: УПРАВЛЕНИЕ ОТЗЫВАМИ – СОВРЕМЕННЫЙ СТИЛЬ
   ========================================================================== */

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

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

.stats-icon {
  font-size: 1.2rem;
}

/* КАРТОЧКИ ФИЛЬТРОВ */
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

.review-row:hover td {
  background: var(--primary-light);
}

.row-pending {
  background: rgba(245, 158, 11, 0.03);
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

.review-meta-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-main);
}

.user-name {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Оценка */
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

/* Текст отзыва */
.col-content {
  min-width: 380px;
}

.review-body-edit {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.text-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.text-fields label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.comment-textarea {
  width: 100%;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 0.85rem;
  resize: vertical;
  font-family: inherit;
}

.comment-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-light);
  outline: none;
}

.pros-cons-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 4px;
}

.label-pros {
  color: var(--success);
  font-size: 0.7rem;
  font-weight: 800;
  display: block;
  margin-bottom: 4px;
}

.label-cons {
  color: var(--danger);
  font-size: 0.7rem;
  font-weight: 800;
  display: block;
  margin-bottom: 4px;
}

.mini-input {
  width: 100%;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  font-size: 0.8rem;
  transition: all 0.2s;
}

.mini-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-light);
  outline: none;
}

/* Галерея */
.image-management-zone {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.images-grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.img-item {
  position: relative;
  width: 60px;
  height: 60px;
}

.img-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.img-preview:hover {
  transform: scale(1.05);
  border-color: var(--primary);
}

.delete-img-trigger {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  background: var(--danger);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: all 0.2s;
}

.delete-img-trigger:hover {
  transform: scale(1.1);
  background: var(--danger-hover);
}

.upload-new-trigger {
  width: 60px;
  height: 60px;
  border: 2px dashed var(--border-color);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 1.8rem;
  transition: all 0.2s;
}

.upload-new-trigger:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
  transform: translateY(-2px);
}

.upload-new-trigger.loading {
  cursor: wait;
  opacity: 0.6;
}

.loader-mini {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.img-counter {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 6px;
  text-align: right;
}

/* Переключатель статуса */
.status-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
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
.btn-delete-review {
  background: var(--danger-light);
  border: 1px solid transparent;
  padding: 8px 14px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--danger);
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-delete-review:hover {
  background: var(--danger);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(231, 111, 81, 0.3);
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
  .col-content {
    min-width: 280px;
  }
  .pros-cons-grid {
    grid-template-columns: 1fr;
  }
}

/* ТЁМНАЯ ТЕМА */
body.dark-theme .admin-card {
  background: rgba(30, 41, 59, 0.95);
}
body.dark-theme .img-preview {
  background: #1e293b;
}
body.dark-theme .upload-new-trigger {
  background: rgba(30, 41, 59, 0.5);
}
</style>