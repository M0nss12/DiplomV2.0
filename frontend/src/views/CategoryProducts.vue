<template>
  <div class="category-products-page">
    
    <!-- ХЛЕБНЫЕ КРОШКИ -->
    <nav v-if="allCategories.length" class="breadcrumbs">
      <router-link to="/catalog">Каталог</router-link>
      <span v-for="crumb in breadcrumbs" :key="crumb.id" class="crumb-item">
        <span class="separator">/</span>
        <router-link :to="'/catalog/' + crumb.id">{{ crumb.name }}</router-link>
      </span>
      <span class="separator">/</span>
      <span class="current">{{ currentCategory?.name || 'Загрузка...' }}</span>
    </nav>

    <h1>{{ currentCategory?.name }}</h1>

    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Загрузка товаров...</p>
    </div>

    <div v-else class="content-wrapper">
      
      <!-- БОКОВАЯ ПАНЕЛЬ ФИЛЬТРОВ -->
      <aside class="filters-sidebar">
        <div class="filters-box">
          <h3>Фильтры</h3>
          
          <div class="filter-group">
            <label>Цена до:</label>
            <div class="price-input-wrap">
               <input v-model.number="filterPriceMax" type="number" placeholder="Макс. цена" />
               <span class="currency">₽</span>
            </div>
          </div>

          <div class="filter-group checkbox-group">
            <label class="custom-checkbox">
              <input type="checkbox" v-model="filterOnlyInMyCity" /> 
              <span class="checkmark"></span>
              В наличии в {{ appStore.city }}
            </label>
          </div>

          <!-- Характеристики -->
          <div v-for="spec in availableSpecs" :key="spec.name" class="filter-group spec-group">
            <b>{{ spec.name }}</b>
            <div v-for="val in spec.values" :key="val" class="checkbox-item">
              <label class="custom-checkbox small">
                <input type="checkbox" :value="val" v-model="activeSpecFilters[spec.name]" /> 
                <span class="checkmark"></span>
                {{ val }}
              </label>
            </div>
          </div>
          
          <button @click="resetFilters" class="btn-reset">Сбросить</button>
        </div>
      </aside>

      <!-- СПИСОК ТОВАРОВ -->
      <main class="products-list">
        <div class="list-header">
          <span class="found-count">Найдено: <b>{{ filteredProducts.length }}</b></span>
          <select v-model="sortOrder" class="sort-select">
            <option value="cheap">Сначала дешевые</option>
            <option value="expensive">Сначала дорогие</option>
          </select>
        </div>

        <div v-if="filteredProducts.length > 0" class="products-grid">
          <div v-for="p in filteredProducts" :key="p.id" class="product-item">
            
            <div class="product-img-wrap">
               <img :src="p.image_url" :alt="p.name" loading="lazy" />
               <!-- КНОПКА ИЗБРАННОГО -->
               <button 
                @click.stop="toggleWishlist(p.id)" 
                class="wishlist-btn" 
                :class="{ 'active': wishlistIds.includes(p.id) }"
               >
                ❤
               </button>
            </div>
            
            <div class="product-info">
              <router-link :to="'/product/' + p.id" class="product-link">
                {{ p.name }}
              </router-link>
              <div class="product-meta">
                 <span>Артикул: {{ p.sku }}</span>
                 <span v-if="p.brands?.name"> | Бренд: {{ p.brands.name }}</span>
              </div>
              <p class="product-desc">{{ p.description }}</p>
              
              <div class="stock-status">
                <span v-if="getStockInCity(p) > 0" class="in-stock">✅ В наличии в г. {{ appStore.city }}</span>
                <span v-else class="out-stock">🚚 Доставка (Межгород)</span>
              </div>
            </div>

            <div class="product-actions">
              <div v-if="p.discount_price" class="price-box">
                <s class="old-price">{{ p.price }} ₽</s>
                <h2 class="new-price">{{ p.discount_price }} ₽</h2>
              </div>
              <h2 v-else class="regular-price">{{ p.price }} ₽</h2>
              
              <button @click="handleAddToCart(p)" :disabled="getTotalStock(p) === 0" class="add-btn">
                {{ getTotalStock(p) > 0 ? 'В корзину' : 'Нет в наличии' }}
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-results">
          <h3>В этой категории товаров пока нет.</h3>
          <p>Попробуйте сбросить фильтры или выбрать другой город.</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '@/stores/cartStore';
import { useAppStore } from '@/stores/appStore';

const route = useRoute();
const cartStore = useCartStore();
const appStore = useAppStore();

const loading = ref(true);
const products = ref([]);
const allCategories = ref([]);
const wishlistIds = ref([]); // Список ID товаров в избранном

const filterPriceMax = ref(null);
const filterOnlyDiscount = ref(false);
const filterOnlyInMyCity = ref(false);
const sortOrder = ref('cheap');
const activeSpecFilters = reactive({});

const loadData = async () => {
  loading.value = true;
  const categoryId = route.params.id; 
  const uid = localStorage.getItem('user_id');

  try {
    const [pRes, cRes] = await Promise.all([
      axios.get(`/api/products?category_id=${categoryId}`), 
      axios.get('/api/categories')
    ]);
    
    products.value = pRes.data;
    allCategories.value = cRes.data;

    // Загрузка избранного
    if (uid) {
      const wRes = await axios.get(`/api/wishlist/${uid}`);
      wishlistIds.value = wRes.data.map(i => i.product_id);
    }

    // Сброс фильтров хар-к
    availableSpecs.value.forEach(s => {
      if (!activeSpecFilters[s.name]) activeSpecFilters[s.name] = [];
    });

  } catch (e) { console.error(e); } 
  finally { loading.value = false; }
};

// Метод для кнопки избранного
const toggleWishlist = async (id) => {
    const uid = localStorage.getItem('user_id');
    if (!uid) return alert("Войдите в аккаунт!");
    
    try {
        if (wishlistIds.value.includes(id)) {
            await axios.delete(`/api/wishlist/${uid}/${id}`);
            wishlistIds.value = wishlistIds.value.filter(i => i !== id);
        } else {
            await axios.post('/api/wishlist', { user_id: uid, product_id: id });
            wishlistIds.value.push(id);
        }
    } catch (e) { console.error(e); }
};

const currentCategory = computed(() => {
    return allCategories.value.find(c => Number(c.id) === Number(route.params.id));
});

const breadcrumbs = computed(() => {
  const crumbs = [];
  let parentId = currentCategory.value?.parent_id;
  while (parentId) {
    const cat = allCategories.value.find(c => Number(c.id) === Number(parentId));
    if (cat) {
      crumbs.unshift(cat);
      parentId = cat.parent_id;
    } else break;
  }
  return crumbs;
});

const getStockInCity = (p) => {
    if (!p.product_stocks || !appStore.city) return 0;
    const city = appStore.city.trim().toLowerCase();
    return p.product_stocks
        .filter(s => {
            const wh = s.warehouses || s.warehouse;
            return wh?.city_name?.trim().toLowerCase() === city;
        })
        .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
};

const getTotalStock = (p) => {
  return p.product_stocks?.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0) || 0;
};

const filteredProducts = computed(() => {
  let res = [...products.value];

  if (filterOnlyInMyCity.value) res = res.filter(p => getStockInCity(p) > 0);
  if (filterPriceMax.value) res = res.filter(p => (p.discount_price || p.price) <= filterPriceMax.value);
  if (filterOnlyDiscount.value) res = res.filter(p => p.discount_price);

  Object.keys(activeSpecFilters).forEach(name => {
    const vals = activeSpecFilters[name];
    if (vals?.length) res = res.filter(p => vals.some(v => p.description?.includes(`${name}: ${v}`)));
  });

  res.sort((a, b) => {
    const p1 = a.discount_price || a.price; 
    const p2 = b.discount_price || b.price;
    return sortOrder.value === 'cheap' ? p1 - p2 : p2 - p1;
  });

  return res;
});

const availableSpecs = computed(() => {
  const specsMap = {};
  products.value.forEach(p => {
    if (!p.description) return;
    const lines = p.description.split(/\.(?!\d)/);
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, val] = line.split(':').map(s => s.trim());
        if (key && val) {
          if (!specsMap[key]) specsMap[key] = new Set();
          specsMap[key].add(val);
        }
      }
    });
  });
  return Object.keys(specsMap).map(key => ({ name: key, values: Array.from(specsMap[key]).sort() }));
});

const resetFilters = () => {
    filterPriceMax.value = null;
    filterOnlyDiscount.value = false;
    filterOnlyInMyCity.value = false;
    Object.keys(activeSpecFilters).forEach(k => activeSpecFilters[k] = []);
};

const handleAddToCart = (p) => {
    cartStore.addToCart({ ...p, stock_quantity: getTotalStock(p) });
    alert("Товар добавлен в корзину");
};

onMounted(loadData);
watch(() => route.params.id, loadData);
</script>

<style scoped>
.category-products-page {
  padding: 40px 20px;
  max-width: 1300px;
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

.breadcrumbs a:hover { text-decoration: underline; }
.separator { color: var(--border-color); margin: 0 4px; }
.current { color: var(--text-main); font-weight: 600; }

h1 { font-size: 2rem; font-weight: 800; color: var(--text-main); margin-bottom: 30px; }

/* МАКЕТ */
.content-wrapper {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

/* САЙДБАР ФИЛЬТРОВ */
.filters-sidebar {
  width: 280px;
  flex-shrink: 0;
}

.filters-box {
  background: var(--bg-card);
  padding: 25px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 100px;
}

.filters-box h3 { margin-top: 0; font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 15px; margin-bottom: 20px; }

.filter-group { margin-bottom: 20px; }
.filter-group label { display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 8px; color: var(--text-main); }

.price-input-wrap { position: relative; }
.price-input-wrap input { width: 100%; padding-right: 30px; }
.currency { position: absolute; right: 10px; top: 12px; color: var(--text-muted); }

/* --- ИСПРАВЛЕННЫЕ ЧЕКБОКСЫ --- */
.custom-checkbox {
  position: relative;
  display: flex;
  align-items: flex-start; /* Выравнивание по верху для многострочного текста */
  padding-left: 30px; /* Место под квадратик */
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1.4;
  user-select: none;
  margin-bottom: 8px;
  color: var(--text-main);
}

.custom-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

/* Квадратик */
.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: var(--bg-input);
  border: 2px solid var(--border-color);
  border-radius: 4px;
  transition: all 0.2s;
}

/* При наведении */
.custom-checkbox:hover input ~ .checkmark {
  border-color: var(--primary);
}

/* Выбранный */
.custom-checkbox input:checked ~ .checkmark {
  background-color: var(--primary);
  border-color: var(--primary);
}

/* Галочка */
.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.custom-checkbox input:checked ~ .checkmark:after {
  display: block;
}
/* -------------------------------- */

.spec-group { border-top: 1px solid var(--border-color); padding-top: 15px; }
.checkbox-item { margin-bottom: 8px; }
.small { font-weight: 400 !important; font-size: 0.85rem !important; }

.btn-reset {
  width: 100%; padding: 10px; background: var(--bg-input); border: 1px solid var(--border-color);
  border-radius: var(--radius-sm); font-weight: 600; color: var(--text-muted); transition: 0.2s;
}
.btn-reset:hover { background: var(--danger-light); color: var(--danger); border-color: var(--danger); }

/* СПИСОК ТОВАРОВ */
.products-list { flex: 1; }

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: var(--bg-card);
  padding: 15px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.sort-select { padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-input); cursor: pointer; }

/* Карточка товара */
.product-item {
  display: flex;
  gap: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.product-item:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--primary-light); }

.product-img-wrap {
  width: 140px; height: 140px; flex-shrink: 0;
  background: #fff; border-radius: var(--radius-sm); border: 1px solid var(--border-color);
  display: flex; align-items: center; justify-content: center; padding: 5px;
  position: relative;
}
.product-img-wrap img { max-width: 100%; max-height: 100%; object-fit: contain; }

/* КНОПКА ИЗБРАННОГО */
.wishlist-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #ccc;
  font-size: 1.1rem;
  z-index: 5;
}
.wishlist-btn:hover {
  transform: scale(1.1);
  color: var(--danger);
}
.wishlist-btn.active {
  color: var(--danger);
  border-color: var(--danger-light);
}

.product-info { flex: 1; }
.product-link { font-size: 1.2rem; font-weight: 700; color: var(--text-main); text-decoration: none; display: block; margin-bottom: 8px; line-height: 1.3; }
.product-link:hover { color: var(--primary); }

.product-meta { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px; }
.product-desc { font-size: 0.9rem; color: var(--text-main); margin-bottom: 15px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.stock-status { font-size: 0.85rem; font-weight: 600; }
.in-stock { color: var(--success); }
.out-stock { color: var(--warning); }

.product-actions { width: 160px; text-align: right; display: flex; flex-direction: column; justify-content: space-between; }
.price-box { display: flex; flex-direction: column; align-items: flex-end; }
.old-price { color: var(--text-muted); font-size: 0.9rem; text-decoration: line-through; }
.new-price { color: var(--danger); font-size: 1.4rem; font-weight: 800; }
.regular-price { font-size: 1.4rem; font-weight: 800; color: var(--text-main); }

.add-btn {
  width: 100%; padding: 12px; background: var(--primary); color: white; border-radius: var(--radius-sm); font-weight: 600; transition: 0.2s;
}
.add-btn:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-2px); }
.add-btn:disabled { background: var(--bg-input); color: var(--text-muted); cursor: not-allowed; }

/* Пустое состояние */
.empty-results { text-align: center; padding: 60px; background: var(--bg-input); border-radius: var(--radius-lg); border: 2px dashed var(--border-color); color: var(--text-muted); }

/* АДАПТИВНОСТЬ */
@media (max-width: 900px) {
  .content-wrapper { flex-direction: column; }
  .filters-sidebar { width: 100%; }
  .filters-box { position: static; }
}

@media (max-width: 600px) {
  .product-item { flex-direction: column; align-items: center; text-align: center; }
  .product-actions { width: 100%; text-align: center; margin-top: 15px; }
  .price-box { align-items: center; }
  .product-meta { justify-content: center; }
}
</style>