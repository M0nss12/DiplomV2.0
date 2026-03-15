<template>
  <div class="catalog-page">
    
    <!-- ХЛЕБНЫЕ КРОШКИ -->
    <nav class="breadcrumbs">
      <router-link to="/catalog">Каталог</router-link>
      <span v-for="crumb in breadcrumbs" :key="crumb.id" class="crumb-item">
        <span class="separator">/</span>
        <router-link :to="'/catalog/' + crumb.id">{{ crumb.name }}</router-link>
      </span>
    </nav>

    <div class="header-row">
      <h1>{{ currentCategoryName }}</h1>
      <div class="cat-count">Всего: {{ visibleCategories.length }}</div>
    </div>
    
    <hr class="divider" />

    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Загрузка категорий...</p>
    </div>

    <div v-else-if="visibleCategories.length > 0">
      
      <div class="categories-grid">
        <div v-for="cat in paginatedCategories" :key="cat.id" @click="goToCategory(cat)" class="category-card">
          
          <div class="card-header">
            <h3>{{ cat.name }}</h3>
            <img :src="cat.image_url || '/assets/images/no-cat.png'" :alt="cat.name" loading="lazy" />
          </div>
          
          <div class="card-body">
            <ul class="subcategories-list">
              <li v-for="child in getChildCategories(cat.id).slice(0, 4)" :key="child.id">
                {{ child.name }}
              </li>
              <li v-if="getChildCategories(cat.id).length > 4" class="more-link">
                и еще {{ getChildCategories(cat.id).length - 4 }}...
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- ПАГИНАЦИЯ -->
      <div v-if="totalPages > 1" class="pagination-controls">
        <button @click="currentPage--" :disabled="currentPage === 1" class="page-btn prev">← Назад</button>
        
        <div class="page-numbers">
          <span class="current-page">{{ currentPage }}</span> / <span class="total-pages">{{ totalPages }}</span>
        </div>

        <button @click="currentPage++" :disabled="currentPage === totalPages" class="page-btn next">Вперед →</button>
      </div>

    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📂</div>
      <h3>В этой категории пока пусто</h3>
      <p>Попробуйте выбрать другой раздел или вернитесь назад.</p>
      <button @click="$router.push('/catalog')" class="btn-back">Вернуться в начало</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const allCategories = ref([]);
const loading = ref(true);

// Пагинация
const currentPage = ref(1);
const itemsPerPage = 9;

const loadCategories = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/categories');
    allCategories.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const currentParentId = computed(() => route.params.id ? Number(route.params.id) : null);

const currentCategoryName = computed(() => {
  if (!currentParentId.value) return 'Каталог запчастей';
  const cat = allCategories.value.find(c => Number(c.id) === currentParentId.value);
  return cat ? cat.name : 'Каталог';
});

const getChildCategories = (parentId) => {
  return allCategories.value.filter(c => {
    const pId = c.parent_id ? Number(c.parent_id) : null;
    return pId === parentId;
  });
};

const visibleCategories = computed(() => getChildCategories(currentParentId.value));

// Логика пагинации
const totalPages = computed(() => Math.ceil(visibleCategories.value.length / itemsPerPage));

const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return visibleCategories.value.slice(start, end);
});

// Сброс страницы при переходе в другую категорию
watch(() => route.params.id, () => {
  currentPage.value = 1;
  window.scrollTo(0, 0);
});

const goToCategory = (cat) => {
  const children = getChildCategories(cat.id);
  if (children.length > 0) {
    router.push(`/catalog/${cat.id}`);
  } else {
    router.push(`/category/${cat.id}`);
  }
};

const breadcrumbs = computed(() => {
  const crumbs = [];
  let currentId = currentParentId.value;
  while (currentId) {
    const cat = allCategories.value.find(c => Number(c.id) === currentId);
    if (cat) {
      crumbs.unshift(cat);
      currentId = cat.parent_id ? Number(cat.parent_id) : null;
    } else break;
  }
  return crumbs;
});

onMounted(loadCategories);
</script>

<style scoped>
.catalog-page {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
}

/* ХЛЕБНЫЕ КРОШКИ */
.breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 25px;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.breadcrumbs a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.breadcrumbs a:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

.separator {
  color: var(--border-color);
  margin: 0 4px;
}

/* ЗАГОЛОВОК И СЧЕТЧИК */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 15px;
}

h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
}

.cat-count {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 600;
}

.divider {
  border: none;
  border-top: 1px solid var(--border-color);
  margin-bottom: 40px;
}

/* СЕТКА КАТЕГОРИЙ */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.category-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.category-card h3 {
  font-size: 1.25rem;
  color: var(--text-main);
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
}

.category-card img {
  width: 70px;
  height: 70px;
  object-fit: contain;
  transition: transform 0.3s ease;
  opacity: 0.9;
  margin-left: 10px;
}

.category-card:hover img {
  transform: scale(1.1) rotate(5deg);
  opacity: 1;
}

/* СПИСОК ПОДКАТЕГОРИЙ */
.subcategories-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.subcategories-list li {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 6px;
  padding-left: 12px;
  position: relative;
  transition: color 0.2s;
}

.subcategories-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--primary-light); 
  font-weight: bold;
}

.category-card:hover .subcategories-list li {
  color: var(--text-main);
}

.category-card:hover .subcategories-list li::before {
  color: var(--primary); 
}

.more-link {
  color: var(--primary) !important;
  font-style: italic;
  font-size: 0.85rem !important;
  margin-top: 8px;
}

/* ПАГИНАЦИЯ */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
}

.page-btn {
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-main);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-input);
}

.page-numbers {
  font-size: 1rem;
  color: var(--text-muted);
  font-weight: 600;
}

.current-page {
  color: var(--primary);
  font-weight: 800;
}

/* СОСТОЯНИЯ ЗАГРУЗКИ И ПУСТОТЫ */
.loading-state {
  text-align: center;
  padding: 60px;
  color: var(--text-muted);
}

.loader {
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: var(--bg-input);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--border-color);
  color: var(--text-muted);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

.btn-back {
  background: var(--primary);
  color: #fff;
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  margin-top: 20px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-back:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* АДАПТИВНОСТЬ */
@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: 1fr; /* Одна колонка на мобильном */
    gap: 15px;
  }

  .category-card {
    flex-direction: row;
    align-items: center;
    padding: 15px;
    min-height: auto;
  }

  .card-header {
    flex: 1;
    margin-bottom: 0;
    align-items: center;
  }
  
  .card-header h3 {
    font-size: 1.1rem;
    margin-right: 10px;
  }

  .category-card img {
    width: 50px;
    height: 50px;
    order: 2; /* Картинка справа */
  }

  .card-body {
    display: none; /* Скрываем список подкатегорий на мобиле для компактности */
  }
}
</style>