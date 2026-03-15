<template>
  <div class="home-page">
    
    <!-- 1. ГЕРОЙСКИЙ БЛОК + УМНЫЙ ПОИСК -->
    <section class="hero-section">
      <div class="hero-content">
        <h1>Надёжные автозапчасти <br><span class="highlight">с доставкой по всей России</span></h1>
        <p class="hero-subtitle">
          Более 100 000 оригинальных деталей и аналогов. Готовы отправить сегодня в <b>{{ appStore.city }}</b>.
        </p>
        
        <!-- Умный поиск (Hero Search) -->
        <div class="hero-search-container" ref="heroSearchRef">
          <div class="hero-search-bar">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Название детали, артикул или бренд..." 
              @input="handleHeroSearch"
              @focus="isHeroSearchOpen = true"
              @keyup.enter="goToSearchPage"
            >
            <button @click="goToSearchPage">Найти запчасть</button>
          </div>

          <!-- Выпадающий список результатов -->
          <transition name="fade">
            <div v-if="isHeroSearchOpen && searchQuery.length >= 2" class="hero-search-dropdown">
              <!-- Категории -->
              <div v-if="heroSearchResults.categories.length" class="hs-group">
                <div class="hs-label">Категории</div>
                <router-link 
                  v-for="c in heroSearchResults.categories" 
                  :key="c.id" 
                  :to="`/catalog/${c.id}`" 
                  class="hs-item"
                >
                  <span class="hs-icon">📂</span> {{ c.name }}
                </router-link>
              </div>

              <!-- Товары -->
              <div v-if="heroSearchResults.products.length" class="hs-group">
                <div class="hs-label">Товары</div>
                <router-link 
                  v-for="prod in heroSearchResults.products" 
                  :key="prod.id" 
                  :to="`/product/${prod.id}`" 
                  class="hs-item hs-prod-item"
                >
                  <img :src="prod.image_url" class="hs-img" />
                  <div class="hs-info">
                    <div class="hs-name">{{ prod.name }}</div>
                    <div class="hs-price">{{ prod.discount_price || prod.price }} ₽</div>
                  </div>
                </router-link>
              </div>

              <div v-if="noHeroResults" class="hs-none">Ничего не найдено</div>
            </div>
          </transition>
        </div>

        <div class="hero-buttons">
          <router-link to="/catalog" class="btn-primary-large">Открыть каталог</router-link>
          <router-link to="/about" class="btn-secondary-large">Условия доставки</router-link>
        </div>
      </div>
    </section>

    <!-- 2. ГОРЯЧИЕ ПРЕДЛОЖЕНИЯ (Перемещено сюда) -->
    <section v-if="hotDeals.length" class="carousel-section">
      <div class="carousel-header">
        <h2>🔥 Горячие предложения</h2>
        <div class="carousel-controls">
          <button @click="scroll('hotDeals', -1)">←</button>
          <button @click="scroll('hotDeals', 1)">→</button>
        </div>
      </div>
      
      <div class="scroll-container" ref="hotDealsRef" @mouseenter="pauseAuto('hotDeals')" @mouseleave="resumeAuto('hotDeals')" @mousedown="startDrag" @mousemove="duringDrag" @mouseup="stopDrag">
        <div v-for="p in hotDeals" :key="p.id" class="product-card">
          <div class="discount-badge" v-if="p.discount_price">-{{ calcDiscount(p.price, p.discount_price) }}%</div>
          
          <button @click.stop="toggleWishlist(p.id)" class="wishlist-btn" :class="{ active: wishlistIds.includes(p.id) }">❤</button>
          <button class="quick-view-btn" @click.stop="openQuickView(p)">🔍</button>

          <router-link :to="'/product/' + p.id" class="card-link">
            <img :src="p.brands?.logo_url" class="brand-logo" v-if="p.brands?.logo_url" loading="lazy">
            <div class="img-wrapper">
              <img :src="p.image_url" class="product-img" :alt="p.name" loading="lazy">
            </div>
            
            <div class="card-info-bottom">
              <h4 class="product-title">{{ p.name }}</h4>
              <div class="price-block">
                <span class="old-price">{{ p.price }} ₽</span>
                <strong class="new-price">{{ p.discount_price || p.price }} ₽</strong>
              </div>
              <div class="stock-status">
                <span v-if="getStockInCity(p) > 0" class="in-stock">✅ В г. {{ appStore.city }}: {{ getStockInCity(p) }} шт.</span>
                <span v-else class="out-stock">🚢 Под заказ (Межгород)</span>
              </div>
            </div>
          </router-link>
          
          <button @click="handleAddToCart(p)" class="cart-btn" :disabled="getTotalStock(p) === 0">
            {{ getTotalStock(p) > 0 ? 'В корзину' : 'Нет в наличии' }}
          </button>
        </div>
      </div>
    </section>

    <!-- 3. БЛОК ПРЕИМУЩЕСТВ -->
    <section class="features-section">
      <div class="feature-card" v-for="feature in features" :key="feature.title">
        <div class="f-icon">{{ feature.icon }}</div>
        <h3>{{ feature.title }}</h3>
        <p>{{ feature.description }}</p>
        <div class="feature-stat">{{ feature.count }}</div>
      </div>
    </section>

    <!-- 4. ПОПУЛЯРНЫЕ КАТЕГОРИИ -->
    <section v-if="popularCategories.length" class="categories-section">
      <div class="section-header">
        <h2>Популярные категории</h2>
        <router-link to="/catalog" class="see-all">Все категории →</router-link>
      </div>
      <div class="categories-grid">
        <router-link v-for="cat in popularCategories" :key="cat.id" :to="'/catalog/' + cat.id" class="category-card-link">
          <div class="category-card">
            <img :src="cat.image_url || '/assets/images/no-cat.png'" :alt="cat.name" loading="lazy" />
            <p><b>{{ cat.name }}</b></p>
          </div>
        </router-link>
      </div>
    </section>
    <div v-else class="loading-placeholder">Загрузка категорий...</div>

    <!-- 5. БРЕНДЫ -->
    <section class="brands-section">
      <div class="section-header">
        <h2>Наши официальные партнёры</h2>
      </div>
      <div class="brands-ribbon">
        <div v-for="brand in brands" :key="brand.id" class="brand-item">
          <img :src="brand.logo_url" :title="brand.name" loading="lazy">
        </div>
      </div>
    </section>

    <!-- 6. НЕДАВНО ПРОСМОТРЕННЫЕ -->
    <section v-if="recentProducts.length" class="carousel-section">
      <div class="carousel-header">
        <h2>🕒 Вы недавно смотрели</h2>
        <div class="carousel-controls">
          <button @click="scroll('recent', -1)">←</button>
          <button @click="scroll('recent', 1)">→</button>
        </div>
      </div>
      
      <div class="scroll-container" ref="recentRef" @mouseenter="pauseAuto('recent')" @mouseleave="resumeAuto('recent')">
        <div v-for="p in recentProducts" :key="p.id" class="product-card">
          <button @click.stop="toggleWishlist(p.id)" class="wishlist-btn" :class="{ active: wishlistIds.includes(p.id) }">❤</button>
          <button class="quick-view-btn" @click.stop="openQuickView(p)">🔍</button>
          
          <router-link :to="'/product/' + p.id" class="card-link">
            <div class="img-wrapper"><img :src="p.image_url" class="product-img" loading="lazy"></div>
            <div class="card-info-bottom">
                <h4 class="product-title">{{ p.name }}</h4>
                <div class="price-block">
                  <strong class="new-price" style="color: var(--text-main);">{{ p.discount_price || p.price }} ₽</strong>
                </div>
                <div class="stock-status">
                   <span v-if="getStockInCity(p) > 0" class="in-stock">✅ В наличии</span>
                   <span v-else class="out-stock">🚢 Под заказ</span>
                </div>
            </div>
          </router-link>
          
          <button @click="handleAddToCart(p)" class="cart-btn" :disabled="getTotalStock(p) === 0">
            {{ getTotalStock(p) > 0 ? 'В корзину' : 'Нет в наличии' }}
          </button>
        </div>
      </div>
    </section>

    <!-- 7. SEO-ТЕКСТ -->
    <section class="seo-description">
      <h2>Интернет-магазин автозапчастей ApexDrive</h2>
      <p>
        Мы предлагаем более 100 000 наименований оригинальных запчастей и качественных аналогов для легковых автомобилей. 
        Благодаря прямым контрактам с производителями и умной логистике, мы гарантируем низкие цены и быструю доставку в г. {{ appStore.city }}.
      </p>
      <p>
        Покупая у нас, вы получаете официальную гарантию до 24 месяцев, возможность лёгкого возврата в течение 14 дней и 
        персональную поддержку. Подберите запчасти по каталогу или воспользуйтесь умным поиском – 
        ApexDrive сделает ремонт вашего автомобиля простым и выгодным.
      </p>
    </section>

    <!-- МОДАЛЬНОЕ ОКНО БЫСТРОГО ПРОСМОТРА -->
    <div v-if="quickViewProduct" class="modal-overlay" @click.self="closeQuickView">
      <div class="modal-content">
        <button class="modal-close" @click="closeQuickView">&times;</button>
        <div class="modal-grid">
          <div class="modal-images">
            <img :src="quickViewProduct.image_url" :alt="quickViewProduct.name">
          </div>
          <div class="modal-details">
            <h2>{{ quickViewProduct.name }}</h2>
            <p class="modal-sku">Артикул: <b>{{ quickViewProduct.sku }}</b></p>
            <p class="modal-desc">{{ quickViewProduct.description || 'Описание отсутствует.' }}</p>
            
            <div class="modal-price-block">
              <s v-if="quickViewProduct.discount_price">{{ quickViewProduct.price }} ₽</s>
              <strong>{{ quickViewProduct.discount_price || quickViewProduct.price }} ₽</strong>
            </div>

            <button @click="handleAddToCart(quickViewProduct)" class="btn-primary-large" style="width: 100%; margin-top: 20px;">
              В корзину
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAppStore } from '@/stores/appStore';
import { useCartStore } from '@/stores/cartStore';

const router = useRouter();
const appStore = useAppStore();
const cartStore = useCartStore();

// Данные
const brands = ref([]);
const hotDeals = ref([]);
const popularCategories = ref([]);
const recentProducts = ref([]);
const wishlistIds = ref([]);

// UI состояние
const searchQuery = ref('');
const quickViewProduct = ref(null);

// Умный поиск (Hero)
const isHeroSearchOpen = ref(false);
const heroSearchRef = ref(null);
const heroSearchResults = ref({ products: [], categories: [] });
let heroSearchTimer = null;

// Refs для каруселей
const hotDealsRef = ref(null);
const recentRef = ref(null);

// Drag-to-scroll
let isDragging = false;
let startX = 0;
let scrollLeft = 0;

const features = ref([
  { icon: '🚚', title: 'Умная логистика', description: 'Бесплатное перемещение товаров между складами вашего города.', count: 'Быстро' },
  { icon: '🛡️', title: '100% Оригинал', description: 'Прямые контракты с производителями. Гарантия до 24 месяцев.', count: 'Надежно' },
  { icon: '↩️', title: 'Легкий возврат', description: 'Не подошла деталь? Вернем деньги без лишних вопросов в течение 14 дней.', count: 'Безопасно' },
]);

const calcDiscount = (oldP, newP) => Math.round(((oldP - newP) / oldP) * 100);
const isSameCity = (c1, c2) => c1?.trim().toLowerCase() === c2?.trim().toLowerCase();

const getStockInCity = (p) => {
  if (!p.product_stocks || !appStore.city) return 0;
  return p.product_stocks
    .filter(s => isSameCity(s.warehouses?.city_name || s.warehouse?.city_name, appStore.city))
    .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
};

const getTotalStock = (p) => p.product_stocks?.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0) || 0;

const loadData = async () => {
  try {
    const [b, h, c] = await Promise.all([
      axios.get('/api/marketing/brands'),
      axios.get('/api/marketing/hot-deals'),
      axios.get('/api/marketing/popular-categories')
    ]);
    brands.value = b.data;
    hotDeals.value = h.data;
    popularCategories.value = c.data;

    const uid = localStorage.getItem('user_id');
    if (uid) {
      const w = await axios.get(`/api/wishlist/${uid}`);
      wishlistIds.value = w.data.map(i => i.product_id);
    }

    const recentIds = JSON.parse(localStorage.getItem('recent_views') || '[]');
    if (recentIds.length) {
      const recentRes = await axios.post('/api/products/recent', { ids: recentIds.slice(0, 15) });
      recentProducts.value = recentRes.data;
    }
  } catch (e) { console.error('Ошибка загрузки данных', e); }
};

// --- ЛОГИКА УМНОГО ПОИСКА В HERO ---
const handleHeroSearch = () => {
    clearTimeout(heroSearchTimer);
    if (searchQuery.value.length < 2) {
        heroSearchResults.value = { products: [], categories: [] };
        return;
    }
    
    heroSearchTimer = setTimeout(async () => {
        try {
            // Используем тот же эндпоинт глобального поиска
            const res = await axios.get(`http://localhost:3000/api/global-search?q=${searchQuery.value}`);
            heroSearchResults.value = res.data;
        } catch (e) { console.error("Hero search error:", e); }
    }, 300);
};

const goToSearchPage = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/catalog', query: { q: searchQuery.value } });
  }
};

const noHeroResults = computed(() => {
    return searchQuery.value.length >= 2 && 
           heroSearchResults.value.products.length === 0 && 
           heroSearchResults.value.categories.length === 0;
});

const handleClickOutside = (event) => {
  if (heroSearchRef.value && !heroSearchRef.value.contains(event.target)) {
    isHeroSearchOpen.value = false;
  }
};

// Избранное
const toggleWishlist = async (id) => {
  const uid = localStorage.getItem('user_id');
  if (!uid) return alert('Войдите в аккаунт.');
  
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

// Корзина
const handleAddToCart = (p) => {
  cartStore.addToCart({ ...p, stock_quantity: getTotalStock(p) });
  alert(`Товар "${p.name}" добавлен в корзину!`);
  closeQuickView();
};

// Карусели (скролл)
const scroll = (name, dir) => {
  const el = name === 'hotDeals' ? hotDealsRef.value : recentRef.value;
  if (el) el.scrollBy({ left: 320 * dir, behavior: 'smooth' });
};

// Drag-to-scroll
const startDrag = (e) => {
  isDragging = true;
  const el = e.currentTarget;
  startX = e.pageX - el.offsetLeft;
  scrollLeft = el.scrollLeft;
  el.classList.add('dragging');
};

const duringDrag = (e) => {
  if (!isDragging) return;
  e.preventDefault();
  const el = e.currentTarget;
  const x = e.pageX - el.offsetLeft;
  const walk = (x - startX) * 2;
  el.scrollLeft = scrollLeft - walk;
};

const stopDrag = () => {
  isDragging = false;
  hotDealsRef.value?.classList.remove('dragging');
  recentRef.value?.classList.remove('dragging');
};

// Автопрокрутка
const timers = { hotDeals: null, recent: null };
const startAuto = (name) => {
  timers[name] = setInterval(() => {
    const el = name === 'hotDeals' ? hotDealsRef.value : recentRef.value;
    if (!el || isDragging) return;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: 280, behavior: 'smooth' });
    }
  }, 4500);
};

const pauseAuto = (name) => clearInterval(timers[name]);
const resumeAuto = (name) => startAuto(name);

// Быстрый просмотр
const openQuickView = (product) => { quickViewProduct.value = product; };
const closeQuickView = () => { quickViewProduct.value = null; };

onMounted(() => {
  loadData();
  startAuto('hotDeals');
  startAuto('recent');
  window.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  pauseAuto('hotDeals');
  pauseAuto('recent');
  window.removeEventListener('click', handleClickOutside);
});

watch(() => appStore.city, loadData);
</script>

<style scoped>
/* ==========================================================================
   СТИЛИ ГЛАВНОЙ СТРАНИЦЫ
   ========================================================================== */

.home-page {
  animation: fadeIn 0.5s ease-out;
}

/* 1. ГЕРОЙСКИЙ БЛОК */
.hero-section {
  background: linear-gradient(135deg, var(--bg-card) 0%, var(--primary-light) 100%);
  border-radius: var(--radius-lg);
  padding: 60px 40px;
  margin-bottom: 50px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  text-align: center;
  position: relative; /* Для позиционирования dropdown */
}

.hero-content h1 {
  font-size: 3rem;
  line-height: 1.1;
  margin-bottom: 20px;
  font-weight: 800;
}

.highlight {
  background: linear-gradient(to right, var(--primary), var(--danger));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
  margin-bottom: 30px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* КОНТЕЙНЕР ПОИСКА В HERO */
.hero-search-container {
    max-width: 600px;
    margin: 0 auto 30px auto;
    position: relative;
    z-index: 10;
}

.hero-search-bar {
  display: flex;
  background: var(--bg-card);
  border-radius: 50px;
  padding: 5px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

.hero-search-bar input {
  flex: 1;
  border: none !important;
  background: transparent !important;
  padding: 15px 20px !important;
  font-size: 1rem;
  outline: none;
}

.hero-search-bar button {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0 30px;
  border-radius: 50px;
  font-weight: bold;
  cursor: pointer;
  transition: var(--transition);
}

.hero-search-bar button:hover {
  background: var(--primary-hover);
}

/* ВЫПАДАЮЩИЙ СПИСОК (HERO DROPDOWN) */
.hero-search-dropdown {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    right: 0;
    background: var(--bg-card);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-color);
    padding: 10px 0;
    text-align: left;
    max-height: 400px;
    overflow-y: auto;
}

.hs-group { margin-bottom: 10px; }
.hs-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; padding: 5px 20px; }

.hs-item {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    gap: 15px;
    text-decoration: none;
    color: var(--text-main);
    transition: var(--transition);
}

.hs-item:hover { background: var(--primary-light); color: var(--primary); }

.hs-prod-item { align-items: flex-start; }
.hs-img { width: 40px; height: 40px; object-fit: contain; background: #fff; border-radius: 6px; border: 1px solid var(--border-color); }
.hs-info { flex: 1; }
.hs-name { font-weight: 600; font-size: 0.9rem; line-height: 1.2; }
.hs-price { color: var(--success); font-weight: 700; font-size: 0.85rem; margin-top: 2px; }

.hs-none { padding: 20px; text-align: center; color: var(--text-muted); }


.hero-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.btn-primary-large {
  background: var(--primary);
  color: white;
  padding: 14px 30px;
  border-radius: var(--radius-md);
  font-weight: 700;
  box-shadow: 0 8px 15px rgba(79, 70, 229, 0.3);
  text-decoration: none;
  transition: var(--transition);
}

.btn-primary-large:hover {
  transform: translateY(-2px);
  background: var(--primary-hover);
}

.btn-secondary-large {
  background: var(--bg-card);
  color: var(--text-main);
  padding: 14px 30px;
  border-radius: var(--radius-md);
  font-weight: 700;
  border: 2px solid var(--border-color);
  text-decoration: none;
  transition: var(--transition);
}

.btn-secondary-large:hover {
  border-color: var(--primary);
  color: var(--primary);
}

/* 2. ПРЕИМУЩЕСТВА */
.features-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
  margin-bottom: 50px;
}

.feature-card {
  background: var(--bg-card);
  padding: 30px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  text-align: center;
  transition: var(--transition);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.f-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.feature-stat {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--primary);
  margin-top: 10px;
}

/* 3. КАТЕГОРИИ */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 25px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
}

.see-all {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
}

.see-all:hover {
  text-decoration: underline;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 50px;
}

.category-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  text-align: center;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  height: 100%;
}

.category-card img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 15px;
  transition: transform 0.3s ease;
}

.category-card:hover {
  transform: translateY(-5px);
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
}

.category-card:hover img {
  transform: scale(1.1) rotate(2deg);
}

.category-card p {
  color: var(--text-main);
}

/* 4. КАРУСЕЛИ И КАРТОЧКИ ТОВАРОВ */
.carousel-section {
  margin-bottom: 50px;
}

.carousel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.carousel-controls button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-main);
  font-size: 1.2rem;
  margin-left: 10px;
}

.carousel-controls button:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.scroll-container {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 20px;
  scrollbar-width: none;
  cursor: grab;
}

.scroll-container::-webkit-scrollbar {
  display: none;
}

.scroll-container.dragging {
  cursor: grabbing;
}

.product-card {
  min-width: 260px;
  max-width: 260px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  position: relative;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  user-select: none;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-light);
}

.discount-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background: var(--danger);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 800;
  font-size: 0.8rem;
  z-index: 2;
}

.wishlist-btn, .quick-view-btn {
  position: absolute;
  right: 15px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: var(--transition);
  color: var(--text-muted);
}

.wishlist-btn { top: 15px; }
.quick-view-btn { top: 55px; font-size: 0.9rem; }

.wishlist-btn:hover { color: var(--danger); border-color: var(--danger); transform: scale(1.1); }
.quick-view-btn:hover { color: var(--primary); border-color: var(--primary); transform: scale(1.1); }
.wishlist-btn.active { color: var(--danger); border-color: var(--danger); }

.card-link {
  text-decoration: none;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.img-wrapper {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.product-img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  transition: transform 0.3s;
  pointer-events: none;
}

.product-card:hover .product-img {
  transform: scale(1.05);
}

.brand-logo {
  height: 20px;
  object-fit: contain;
  margin-bottom: 5px;
  opacity: 0.7;
}

.product-title {
  font-size: 1rem;
  color: var(--text-main);
  height: 44px;
  overflow: hidden;
  margin-bottom: 10px;
}

.price-block { margin-top: auto; }
.old-price { text-decoration: line-through; color: var(--text-muted); font-size: 0.85rem; margin-right: 5px; }
.new-price { color: var(--danger); font-weight: 800; font-size: 1.2rem; }

.stock-status { font-size: 0.8rem; margin-top: 5px; }
.in-stock { color: var(--success); font-weight: bold; }
.out-stock { color: var(--warning); font-weight: bold; }

.cart-btn {
  width: 100%;
  padding: 12px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-sm);
  margin-top: 15px;
  font-weight: bold;
}
.cart-btn:hover:not(:disabled) { background: var(--primary-hover); }
.cart-btn:disabled { background: var(--border-color); color: var(--text-muted); }

/* 5. БРЕНДЫ */
.brands-ribbon {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 10px;
  scrollbar-width: none;
}

.brand-item {
  min-width: 130px;
  height: 70px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  transition: var(--transition);
}

.brand-item img {
  max-width: 80%;
  max-height: 80%;
  filter: grayscale(100%);
  opacity: 0.6;
  transition: var(--transition);
}

.brand-item:hover { border-color: var(--primary); transform: translateY(-3px); }
.brand-item:hover img { filter: none; opacity: 1; }

/* 6. SEO ТЕКСТ */
.seo-description {
  background: var(--bg-card);
  padding: 40px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  margin-bottom: 50px;
  color: var(--text-muted);
}
.seo-description h2 { color: var(--text-main); margin-bottom: 15px; }

/* 7. МОДАЛКА БЫСТРОГО ПРОСМОТРА */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(5px);
  display: flex; align-items: center; justify-content: center; z-index: 2000;
}

.modal-content {
  background: var(--bg-card);
  width: 800px; max-width: 95%;
  border-radius: var(--radius-lg);
  padding: 30px;
  position: relative;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
}

.modal-close {
  position: absolute; top: 15px; right: 15px;
  background: var(--bg-input); border: none;
  width: 35px; height: 35px; border-radius: 50%;
  font-size: 20px; color: var(--text-muted);
}
.modal-close:hover { color: var(--danger); background: var(--danger-light); }

.modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
.modal-images img { width: 100%; height: 300px; object-fit: contain; }
.modal-details h2 { margin-top: 0; font-size: 1.5rem; }
.modal-sku { color: var(--text-muted); font-size: 0.9rem; }
.modal-price-block { margin: 20px 0; font-size: 1.8rem; font-weight: bold; color: var(--danger); }
.modal-price-block s { font-size: 1.1rem; color: var(--text-muted); margin-right: 10px; }

/* АДАПТИВНОСТЬ */
@media (max-width: 768px) {
  .hero-section { padding: 40px 20px; }
  .hero-content h1 { font-size: 2rem; }
  .hero-search-bar { flex-direction: column; border-radius: 15px; }
  .hero-search-bar button { padding: 15px; border-radius: 10px; margin-top: 5px; }
  .features-section { grid-template-columns: 1fr; }
  .modal-grid { grid-template-columns: 1fr; }
  .modal-images img { height: 200px; }
}
</style>