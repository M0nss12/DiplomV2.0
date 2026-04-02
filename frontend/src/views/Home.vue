<template>
  <div class="home-page">
    <!-- ДЕКОРАТИВНЫЕ ЭЛЕМЕНТЫ -->
    <div class="gear gear-1"></div>
    <div class="gear gear-2"></div>
    <div class="sparkle-container" v-if="!isMobile">
      <div v-for="n in 30" :key="n" class="sparkle" :style="getRandomSparkleStyle()"></div>
    </div>

    <!-- 1. ГЕРОЙСКИЙ БЛОК (без параллакса) -->
    <section class="hero-section">
      <div class="hero-bg-gradient"></div>
      <div class="hero-particles"></div>
      <div class="hero-content">
        <h1 class="hero-title" data-aos="fade-up">
          Надёжные автозапчасти
          <span class="highlight">с доставкой по всей России</span>
        </h1>
        <p class="hero-subtitle" data-aos="fade-up" data-aos-delay="100">
          Более 100 000 оригинальных деталей и аналогов. Готовы отправить сегодня в <strong>{{ appStore.city }}</strong>.
        </p>

        <div class="hero-search-container" ref="heroSearchRef" data-aos="fade-up" data-aos-delay="200">
          <div class="hero-search-bar">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Название детали, артикул или бренд..."
              @input="handleHeroSearch"
              @focus="isHeroSearchOpen = true"
              @keyup.enter="goToSearchPage"
            />
            <button @click="goToSearchPage" class="pulse-on-hover">Найти запчасть</button>
          </div>

          <transition name="fade">
            <div v-if="isHeroSearchOpen && searchQuery.length >= 2" class="hero-search-dropdown">
              <div v-if="heroSearchResults.categories.length" class="hs-group">
                <div class="hs-label">Категории</div>
                <router-link
                  v-for="c in heroSearchResults.categories"
                  :key="c.id"
                  :to="`/category/${c.id}`"
                  class="hs-item"
                >
                  <span class="hs-icon">📂</span> {{ c.name }}
                </router-link>
              </div>

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

              <div v-if="noHeroResults" class="hs-none">Ничего не найдено 😔</div>
            </div>
          </transition>
        </div>

        <div class="hero-buttons" data-aos="fade-up" data-aos-delay="300">
          <router-link to="/catalog" class="btn-primary-large">
            <span>📦</span> Открыть каталог
          </router-link>
          <router-link to="/about" class="btn-secondary-large">
            <span>🚚</span> Условия доставки
          </router-link>
        </div>
      </div>
    </section>

    <!-- 2. БЛОК ПРЕИМУЩЕСТВ С АНИМИРОВАННЫМИ СЧЁТЧИКАМИ -->
    <section class="features-section">
      <div
        v-for="(feature, idx) in features"
        :key="feature.title"
        class="feature-card"
        :class="{ 'feature-visible': animatedFeatures[idx] }"
        ref="featureRefs"
      >
        <div class="feature-icon">{{ feature.icon }}</div>
        <h3>{{ feature.title }}</h3>
        <p>{{ feature.description }}</p>
        <div class="feature-stat">
          <span class="counter" :data-target="feature.countNum">{{ animatedFeatures[idx] ? animatedCounts[idx] : 0 }}</span>
          {{ feature.countUnit }}
        </div>
        <div class="feature-glow"></div>
      </div>
    </section>

    <!-- 3. ГОРЯЧИЕ ПРЕДЛОЖЕНИЯ (КАРУСЕЛЬ, без автопрокрутки) -->
    <section v-if="hotDeals.length" class="carousel-section">
      <div class="carousel-header">
        <h2>🔥 Горячие предложения</h2>
        <div class="carousel-controls">
          <button @click="scroll('hotDeals', -1)" class="ctrl-btn">←</button>
          <button @click="scroll('hotDeals', 1)" class="ctrl-btn">→</button>
        </div>
      </div>

      <div
        class="scroll-container"
        ref="hotDealsRef"
        @mousedown="startDrag"
        @mousemove="duringDrag"
        @mouseup="stopDrag"
      >
        <div
          v-for="p in hotDeals"
          :key="p.id"
          class="product-card"
          @mousemove="handle3DTilt($event, p.id)"
          @mouseleave="resetTilt(p.id)"
          :style="getTiltStyle(p.id)"
        >
          <div class="discount-badge" v-if="p.discount_price">-{{ calcDiscount(p.price, p.discount_price) }}%</div>
          <button @click.stop="toggleWishlist(p.id)" class="wishlist-btn" :class="{ active: wishlistIds.includes(p.id) }">❤</button>
          <button class="quick-view-btn" @click.stop="openQuickView(p)">🔍</button>

          <router-link :to="'/product/' + p.id" class="card-link">
            <img :src="p.brands?.logo_url" class="brand-logo" v-if="p.brands?.logo_url" loading="lazy" />
            <div class="img-wrapper">
              <img :src="p.image_url" class="product-img" :alt="p.name" loading="lazy" />
            </div>
            <div class="card-info-bottom">
              <h4 class="product-title">{{ p.name }}</h4>
              <div class="price-block">
                <span class="old-price">{{ p.price }} ₽</span>
                <strong class="new-price">{{ p.discount_price || p.price }} ₽</strong>
              </div>
              <div class="stock-status">
                <span v-if="getStockInCity(p) > 0" class="in-stock">✅ В {{ appStore.city }}: {{ getStockInCity(p) }} шт.</span>
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

    <!-- 4. ТОВАРЫ С РЕЙТИНГОМ 5 (КАРУСЕЛЬ, без автопрокрутки) -->
    <section v-if="topRatedProducts.length" class="carousel-section top-rated-carousel">
      <div class="carousel-header">
        <h2>⭐ Товары с рейтингом 5.0</h2>
        <div class="carousel-controls">
          <button @click="scrollTopRated(-1)" class="ctrl-btn">←</button>
          <button @click="scrollTopRated(1)" class="ctrl-btn">→</button>
        </div>
      </div>

      <div
        class="scroll-container"
        ref="topRatedRef"
        @mousedown="startDragTopRated"
        @mousemove="duringDragTopRated"
        @mouseup="stopDragTopRated"
      >
        <div
          v-for="p in topRatedProducts"
          :key="p.id"
          class="product-card top-rated-card"
          @mousemove="handle3DTilt($event, 't'+p.id)"
          @mouseleave="resetTilt('t'+p.id)"
          :style="getTiltStyle('t'+p.id)"
        >
          <div class="rating-badge">⭐⭐⭐⭐⭐ 5.0</div>
          <div class="discount-badge" v-if="p.discount_price" style="top: 45px;">-{{ calcDiscount(p.price, p.discount_price) }}%</div>
          
          <button @click.stop="toggleWishlist(p.id)" class="wishlist-btn" :class="{ active: wishlistIds.includes(p.id) }">❤</button>
          <button class="quick-view-btn" @click.stop="openQuickView(p)">🔍</button>

          <router-link :to="'/product/' + p.id" class="card-link">
            <img :src="p.brands?.logo_url" class="brand-logo" v-if="p.brands?.logo_url" loading="lazy" />
            <div class="img-wrapper">
              <img :src="p.image_url" class="product-img" :alt="p.name" loading="lazy" />
            </div>
            <div class="card-info-bottom">
              <h4 class="product-title">{{ p.name }}</h4>
              <div class="price-block">
                <span class="old-price" v-if="p.discount_price">{{ p.price }} ₽</span>
                <strong class="new-price">{{ p.discount_price || p.price }} ₽</strong>
              </div>
              <div class="stock-status">
                <span v-if="getStockInCity(p) > 0" class="in-stock">✅ В {{ appStore.city }}: {{ getStockInCity(p) }} шт.</span>
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
    <div v-else class="loading-placeholder">Загрузка товаров...</div>

    <!-- 5. БРЕНДЫ (ДВИЖУЩАЯСЯ ЛЕНТА) – ВОССТАНОВЛЕНО -->
    <section class="brands-section">
      <div class="section-header">
        <h2>Наши официальные партнёры</h2>
      </div>
      <div class="brands-ribbon">
        <div class="brands-track">
          <div v-for="brand in brands" :key="brand.id" class="brand-item">
            <img :src="brand.logo_url" :title="brand.name" loading="lazy" />
          </div>
          <!-- Дублируем для бесконечности -->
          <div v-for="brand in brands" :key="'dup-' + brand.id" class="brand-item">
            <img :src="brand.logo_url" :title="brand.name" loading="lazy" />
          </div>
        </div>
      </div>
      <div class="race-track">
        <div class="moving-dot"></div>
        <div class="moving-dot" style="animation-delay: -1s"></div>
        <div class="moving-dot" style="animation-delay: -2s"></div>
      </div>
    </section>

    <!-- 6. НЕДАВНО ПРОСМОТРЕННЫЕ (КАРУСЕЛЬ, без автопрокрутки) -->
    <section v-if="recentProducts.length" class="carousel-section">
      <div class="carousel-header">
        <h2>🕒 Вы недавно смотрели</h2>
        <div class="carousel-controls">
          <button @click="scroll('recent', -1)" class="ctrl-btn">←</button>
          <button @click="scroll('recent', 1)" class="ctrl-btn">→</button>
        </div>
      </div>

      <div class="scroll-container" ref="recentRef">
        <div
          v-for="p in recentProducts"
          :key="p.id"
          class="product-card"
          @mousemove="handle3DTilt($event, 'r'+p.id)"
          @mouseleave="resetTilt('r'+p.id)"
          :style="getTiltStyle('r'+p.id)"
        >
          <button @click.stop="toggleWishlist(p.id)" class="wishlist-btn" :class="{ active: wishlistIds.includes(p.id) }">❤</button>
          <button class="quick-view-btn" @click.stop="openQuickView(p)">🔍</button>

          <router-link :to="'/product/' + p.id" class="card-link">
            <div class="img-wrapper">
              <img :src="p.image_url" class="product-img" loading="lazy" />
            </div>
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
        Благодаря прямым контрактам с производителями и умной логистике, мы гарантируем низкие цены и быструю доставку в г.
        {{ appStore.city }}.
      </p>
    </section>

    <!-- МОДАЛЬНОЕ ОКНО БЫСТРОГО ПРОСМОТРА -->
    <div v-if="quickViewProduct" class="modal-overlay" @click.self="closeQuickView">
      <div class="modal-content">
        <button class="modal-close" @click="closeQuickView">&times;</button>
        <div class="modal-grid">
          <div class="modal-images">
            <img :src="quickViewProduct.image_url" :alt="quickViewProduct.name" />
          </div>
          <div class="modal-details">
            <h2>{{ quickViewProduct.name }}</h2>
            <p class="modal-sku">Артикул: <b>{{ quickViewProduct.sku }}</b></p>
            <p class="modal-desc">{{ quickViewProduct.description || 'Описание отсутствует.' }}</p>

            <div class="modal-price-block">
              <s v-if="quickViewProduct.discount_price">{{ quickViewProduct.price }} ₽</s>
              <strong>{{ quickViewProduct.discount_price || quickViewProduct.price }} ₽</strong>
            </div>

            <button @click="handleAddToCart(quickViewProduct)" class="btn-primary-large" style="width: 100%; margin-top: 20px">
              В корзину
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
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
const topRatedProducts = ref([]);
const recentProducts = ref([]);
const wishlistIds = ref([]);

// UI состояние
const searchQuery = ref('');
const quickViewProduct = ref(null);
const isMobile = ref(false);

// Умный поиск
const isHeroSearchOpen = ref(false);
const heroSearchRef = ref(null);
const heroSearchResults = ref({ products: [], categories: [] });
let heroSearchTimer = null;

// Refs для каруселей
const hotDealsRef = ref(null);
const recentRef = ref(null);
const topRatedRef = ref(null);

// Drag-to-scroll для обычных каруселей
let isDragging = false;
let startX = 0;
let scrollLeft = 0;

// Drag для топ-рейтинга
let isDraggingTopRated = false;
let startXTopRated = 0;
let scrollLeftTopRated = 0;

// 3D Tilt
const tiltStyles = ref({});

// Анимация счётчиков
const featureRefs = ref([]);
const animatedFeatures = ref([false, false, false]);
const animatedCounts = ref([0, 0, 0]);
let observer = null;

// Особенности с числами
const features = ref([
  { icon: '🚚', title: 'Умная логистика', description: 'Бесплатное перемещение товаров между складами вашего города.', countNum: 24, countUnit: 'часа', countText: 'Быстро' },
  { icon: '🛡️', title: '100% Оригинал', description: 'Прямые контракты с производителями. Гарантия до 24 месяцев.', countNum: 100, countUnit: '%', countText: 'Надежно' },
  { icon: '↩️', title: 'Легкий возврат', description: 'Не подошла деталь? Вернем деньги без лишних вопросов в течение 14 дней.', countNum: 14, countUnit: 'дней', countText: 'Безопасно' },
]);

// Вспомогательные функции
const calcDiscount = (oldP, newP) => Math.round(((oldP - newP) / oldP) * 100);
const isSameCity = (c1, c2) => c1?.trim().toLowerCase() === c2?.trim().toLowerCase();

const getStockInCity = (p) => {
  if (!p.product_stocks || !appStore.city) return 0;
  return p.product_stocks
    .filter(s => isSameCity(s.warehouses?.city_name || s.warehouse?.city_name, appStore.city))
    .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
};

const getTotalStock = (p) => p.product_stocks?.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0) || 0;

// Загрузка данных
const loadData = async () => {
  try {
    const [b, h, pRes] = await Promise.all([
      axios.get('/api/marketing/brands'),
      axios.get('/api/marketing/hot-deals'),
      axios.get('/api/products')
    ]);
    brands.value = b.data;
    hotDeals.value = h.data;
    topRatedProducts.value = pRes.data.slice(0, 12);

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
  } catch (e) {
    console.error('Ошибка загрузки данных', e);
  }
};

// Поиск
const handleHeroSearch = () => {
  clearTimeout(heroSearchTimer);
  if (searchQuery.value.length < 2) {
    heroSearchResults.value = { products: [], categories: [] };
    return;
  }
  heroSearchTimer = setTimeout(async () => {
    try {
      const res = await axios.get(`/api/global-search?q=${searchQuery.value}`);
      heroSearchResults.value = res.data;
    } catch (e) {
      console.error('Hero search error:', e);
    }
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
  } catch (e) {
    console.error(e);
  }
};

// Корзина
const handleAddToCart = (p) => {
  cartStore.addToCart({ ...p, stock_quantity: getTotalStock(p) });
  alert(`Товар "${p.name}" добавлен в корзину!`);
  closeQuickView();
};

// Карусели (общие)
const scroll = (name, dir) => {
  const el = name === 'hotDeals' ? hotDealsRef.value : recentRef.value;
  if (el) el.scrollBy({ left: 320 * dir, behavior: 'smooth' });
};

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
  const el = hotDealsRef.value || recentRef.value;
  if (el) el.classList.remove('dragging');
};

// Карусель для топ-рейтинга
const scrollTopRated = (dir) => {
  if (topRatedRef.value) {
    topRatedRef.value.scrollBy({ left: 320 * dir, behavior: 'smooth' });
  }
};

const startDragTopRated = (e) => {
  isDraggingTopRated = true;
  const el = e.currentTarget;
  startXTopRated = e.pageX - el.offsetLeft;
  scrollLeftTopRated = el.scrollLeft;
  el.classList.add('dragging');
};

const duringDragTopRated = (e) => {
  if (!isDraggingTopRated) return;
  e.preventDefault();
  const el = e.currentTarget;
  const x = e.pageX - el.offsetLeft;
  const walk = (x - startXTopRated) * 2;
  el.scrollLeft = scrollLeftTopRated - walk;
};

const stopDragTopRated = () => {
  isDraggingTopRated = false;
  if (topRatedRef.value) topRatedRef.value.classList.remove('dragging');
};

// 3D Tilt
const handle3DTilt = (e, id) => {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const rotateX = ((y - centerY) / centerY) * 10;
  const rotateY = ((x - centerX) / centerX) * 10;
  tiltStyles.value[id] = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
};

const resetTilt = (id) => {
  tiltStyles.value[id] = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
};

const getTiltStyle = (id) => tiltStyles.value[id] || '';

// Быстрый просмотр
const openQuickView = async (product) => {
  try {
    const res = await axios.get(`/api/products/${product.id}`);
    quickViewProduct.value = res.data;
  } catch (e) {
    console.error('Ошибка при загрузке данных быстрого просмотра', e);
    quickViewProduct.value = product;
  }
};
const closeQuickView = () => {
  quickViewProduct.value = null;
};

// Анимация счётчиков
const animateCounter = (el, target, index) => {
  let start = 0;
  const duration = 1500;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const value = Math.floor(progress * target);
    animatedCounts.value[index] = value;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      animatedCounts.value[index] = target;
    }
  };
  requestAnimationFrame(step);
};

// Intersection Observer для анимации счётчиков
const setupObservers = () => {
  const featureElements = document.querySelectorAll('.feature-card');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = Array.from(featureElements).indexOf(entry.target);
        if (!animatedFeatures.value[idx]) {
          animatedFeatures.value[idx] = true;
          const target = features.value[idx].countNum;
          animateCounter(entry.target, target, idx);
          countObserver.unobserve(entry.target);
        }
      }
    });
  }, { threshold: 0.5 });
  featureElements.forEach(el => countObserver.observe(el));
};

// Генерация случайных стилей для искр
const getRandomSparkleStyle = () => {
  return {
    left: Math.random() * 100 + '%',
    animationDelay: Math.random() * 10 + 's',
    width: Math.random() * 4 + 2 + 'px',
    height: Math.random() * 4 + 2 + 'px',
    opacity: Math.random() * 0.5 + 0.2,
  };
};

// Определение мобильного устройства
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  loadData();
  window.addEventListener('click', handleClickOutside);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  nextTick(() => {
    setupObservers();
  });
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', checkMobile);
});

watch(() => appStore.city, loadData);
</script>

<style scoped>

/* Базовые анимации */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes moveDot {
  0% { left: -10px; opacity: 1; }
  100% { left: 100%; opacity: 0; }
}

@keyframes pulseGlow {
  0% { box-shadow: 0 0 0 0 var(--primary-light); }
  70% { box-shadow: 0 0 0 15px rgba(230, 57, 70, 0); }
  100% { box-shadow: 0 0 0 0 rgba(230, 57, 70, 0); }
}

@keyframes sparkle {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
}

/* ========== ДЕКОРАТИВНЫЕ ЭЛЕМЕНТЫ ========== */
.gear {
  position: fixed;
  width: 80px;
  height: 80px;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.07.08A10 10 0 0 0 12 18a10 10 0 0 0 6.26-2.22z"/><path d="M5.52 10.5a10 10 0 0 1 12.96 0"/></svg>') center/contain no-repeat;
  opacity: 0.08;
  pointer-events: none;
  z-index: 1;
  animation: spin 20s linear infinite;
}
.gear-1 { top: 10%; left: 5%; width: 100px; height: 100px; animation-duration: 25s; }
.gear-2 { bottom: 10%; right: 5%; width: 70px; height: 70px; animation-duration: 18s; animation-direction: reverse; }

.sparkle-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.sparkle {
  position: absolute;
  background: radial-gradient(circle, var(--primary) 0%, transparent 80%);
  border-radius: 50%;
  animation: sparkle 8s linear infinite;
}

/* ========== ГЕРОЙСКИЙ БЛОК (без параллакса) ========== */
.hero-section {
  position: relative;
  border-radius: var(--radius-lg);
  margin-bottom: 60px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.hero-bg-gradient {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(125deg, var(--bg-card) 0%, var(--primary-light) 30%, var(--accent-light) 70%, var(--bg-card) 100%);
  background-size: 200% 200%;
  animation: gradientShift 12s ease infinite;
  z-index: 0;
}

.hero-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(circle at 20% 40%, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 30px 30px;
  pointer-events: none;
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  padding: 70px 40px;
}

.hero-title {
  font-size: 3.2rem;
  line-height: 1.2;
  font-weight: 800;
  margin-bottom: 20px;
  animation: fadeSlideUp 0.6s ease-out;
}

.highlight {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-muted);
  margin-bottom: 30px;
}

/* Поиск */
.hero-search-container {
  max-width: 650px;
  margin: 0 auto 40px;
  position: relative;
  z-index: 20;
}

.hero-search-bar {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border-radius: 60px;
  padding: 6px 6px 6px 20px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  transition: var(--transition);
}

.hero-search-bar:focus-within {
  box-shadow: 0 0 0 4px var(--primary-light), var(--shadow-lg);
  transform: scale(1.01);
}

.search-icon {
  font-size: 1.2rem;
  color: var(--text-muted);
  margin-right: 10px;
}

.hero-search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 14px 0;
  font-size: 1rem;
  outline: none;
  color: var(--text-main);
}

.hero-search-bar button {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  border: none;
  padding: 12px 32px;
  border-radius: 50px;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-bounce);
}

.pulse-on-hover:hover {
  animation: pulseGlow 0.8s infinite;
}

/* Выпадающий список */
.hero-search-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  right: 0;
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  max-height: 480px;
  overflow-y: auto;
  z-index: 30;
}

.hs-group {
  margin-bottom: 8px;
}
.hs-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 800;
  color: var(--text-muted);
  padding: 8px 20px;
}
.hs-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 20px;
  text-decoration: none;
  color: var(--text-main);
  transition: var(--transition);
}
.hs-item:hover {
  background: var(--primary-light);
  transform: translateX(5px);
}
.hs-img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  background: #fff;
  border-radius: var(--radius-sm);
  padding: 4px;
}
.hs-price {
  color: var(--success);
  font-weight: 700;
}

/* Кнопки героя */
.hero-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}
.btn-primary-large, .btn-secondary-large {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  border-radius: var(--radius-md);
  font-weight: 700;
  transition: var(--transition-bounce);
  text-decoration: none;
}
.btn-primary-large {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  box-shadow: 0 10px 20px rgba(230, 57, 70, 0.3);
}
.btn-primary-large:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(230, 57, 70, 0.5);
}
.btn-secondary-large {
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  color: var(--text-main);
}
.btn-secondary-large:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-3px);
}

/* ========== ПРЕИМУЩЕСТВА ========== */
.features-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  margin-bottom: 60px;
}
.feature-card {
  position: relative;
  background: var(--bg-card);
  backdrop-filter: blur(4px);
  padding: 30px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  text-align: center;
  transition: var(--transition-bounce);
  overflow: hidden;
  transform: translateY(20px);
  opacity: 0;
  animation: fadeSlideUp 0.6s forwards;
}
.feature-card:nth-child(1) { animation-delay: 0.1s; }
.feature-card:nth-child(2) { animation-delay: 0.2s; }
.feature-card:nth-child(3) { animation-delay: 0.3s; }
.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary);
}
.feature-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  transition: transform 0.3s;
}
.feature-card:hover .feature-icon {
  transform: scale(1.1) rotate(5deg);
}
.feature-stat {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--primary);
  margin-top: 12px;
}
.counter {
  font-size: 2rem;
  display: inline-block;
  min-width: 60px;
}
.feature-glow {
  position: absolute;
  bottom: -30px;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.feature-card:hover .feature-glow {
  opacity: 1;
}

/* ========== КАРУСЕЛИ И КАРТОЧКИ (БЕЗ SHINE) ========== */
.carousel-section {
  margin-bottom: 60px;
}
.carousel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}
.carousel-header h2 {
  font-size: 1.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.ctrl-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  font-size: 1.3rem;
  cursor: pointer;
  transition: var(--transition);
  margin-left: 12px;
}
.ctrl-btn:hover {
  background: var(--primary);
  color: white;
  transform: scale(1.05);
}
.scroll-container {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding-bottom: 20px;
  scrollbar-width: none;
  cursor: grab;
}
.scroll-container.dragging {
  cursor: grabbing;
}
.scroll-container::-webkit-scrollbar {
  display: none;
}

.product-card {
  min-width: 270px;
  max-width: 270px;
  background: var(--bg-card);
  backdrop-filter: blur(4px);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  padding: 20px;
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  transform-style: preserve-3d;
}
.product-card:hover {
  box-shadow: var(--shadow-hover);
  border-color: var(--primary);
}
.discount-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background: linear-gradient(135deg, var(--danger), var(--danger-hover));
  color: white;
  padding: 4px 12px;
  border-radius: 30px;
  font-weight: 800;
  font-size: 0.75rem;
  z-index: 3;
}
.wishlist-btn, .quick-view-btn {
  position: absolute;
  right: 15px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: var(--transition-bounce);
  z-index: 3;
  cursor: pointer;
}
.wishlist-btn { top: 15px; }
.quick-view-btn { top: 60px; }
.wishlist-btn:hover, .quick-view-btn:hover {
  transform: scale(1.15);
}
.wishlist-btn:hover { color: var(--danger); border-color: var(--danger); }
.quick-view-btn:hover { color: var(--primary); border-color: var(--primary); }
.wishlist-btn.active { color: var(--danger); border-color: var(--danger); }

.card-link {
  text-decoration: none;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.img-wrapper {
  height: 170px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}
.product-img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}
.product-card:hover .product-img {
  transform: scale(1.08);
}
.brand-logo {
  height: 24px;
  object-fit: contain;
  margin-bottom: 8px;
  opacity: 0.7;
}
.product-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-main);
  height: 44px;
  overflow: hidden;
  margin-bottom: 10px;
}
.price-block {
  margin-top: auto;
}
.old-price {
  text-decoration: line-through;
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-right: 6px;
}
.new-price {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--danger);
}
.stock-status {
  font-size: 0.75rem;
  margin-top: 8px;
}
.in-stock { color: var(--success); font-weight: 600; }
.out-stock { color: var(--warning); font-weight: 600; }
.cart-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 700;
  margin-top: 16px;
  transition: var(--transition);
  cursor: pointer;
}
.cart-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--primary-glow);
}
.cart-btn:disabled {
  background: var(--border-color);
  color: var(--text-muted);
  cursor: not-allowed;
}

/* ========== ТОВАРЫ С РЕЙТИНГОМ 5 ========== */
.top-rated-carousel {
  margin-bottom: 60px;
}
.rating-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
  padding: 4px 10px;
  border-radius: 30px;
  font-weight: 800;
  font-size: 0.75rem;
  z-index: 3;
  border: 1px solid rgba(255, 193, 7, 0.5);
  backdrop-filter: blur(4px);
}

/* ========== БРЕНДЫ (ДВИЖУЩАЯСЯ ЛЕНТА) – ВОССТАНОВЛЕНО ========== */
.brands-section {
  margin-bottom: 60px;
  position: relative;
}
.brands-ribbon {
  overflow: hidden;
  white-space: nowrap;
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 20px 0;
  mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
}
.brands-track {
  display: inline-flex;
  gap: 30px;
  animation: scrollBrands 20s linear infinite;
}
@keyframes scrollBrands {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.brand-item {
  min-width: 120px;
  height: 70px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  display: inline-flex;
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
.brand-item:hover {
  transform: translateY(-5px);
  border-color: var(--primary);
}
.brand-item:hover img {
  filter: grayscale(0);
  opacity: 1;
}
.race-track {
  position: relative;
  height: 4px;
  background: var(--border-color);
  margin-top: 20px;
  border-radius: 2px;
  overflow: hidden;
}
.moving-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--primary);
  border-radius: 50%;
  top: -2px;
  animation: moveDot 3s linear infinite;
}

/* ========== SEO-ТЕКСТ ========== */
.seo-description {
  background: var(--bg-card);
  padding: 40px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  margin-bottom: 40px;
  color: var(--text-muted);
  line-height: 1.6;
}
.seo-description h2 {
  color: var(--text-main);
  margin-bottom: 15px;
}

/* ========== МОДАЛЬНОЕ ОКНО ========== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg-overlay);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeSlideUp 0.2s ease-out;
}
.modal-content {
  background: var(--bg-card);
  width: 850px;
  max-width: 95%;
  border-radius: var(--radius-lg);
  padding: 30px;
  position: relative;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
}
.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-input);
  border: none;
  font-size: 24px;
  cursor: pointer;
  transition: var(--transition);
}
.modal-close:hover {
  background: var(--danger-light);
  color: var(--danger);
  transform: rotate(90deg);
}
.modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}
.modal-images img {
  width: 100%;
  height: 300px;
  object-fit: contain;
  background: #fff;
  border-radius: var(--radius-md);
  padding: 10px;
}
.modal-price-block {
  margin: 20px 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--danger);
}
.modal-price-block s {
  font-size: 1rem;
  color: var(--text-muted);
  margin-right: 10px;
}

/* ========== АДАПТИВНОСТЬ ========== */
@media (max-width: 1024px) {
  .hero-title { font-size: 2.5rem; }
  .features-section { gap: 20px; }
}
@media (max-width: 768px) {
  .hero-content { padding: 40px 20px; }
  .hero-title { font-size: 1.8rem; }
  .hero-search-bar { flex-direction: column; border-radius: 28px; padding: 15px; }
  .hero-search-bar button { width: 100%; margin-top: 10px; }
  .hero-buttons { flex-direction: column; gap: 12px; }
  .features-section { grid-template-columns: 1fr; }
  .modal-grid { grid-template-columns: 1fr; }
  .modal-images img { height: 200px; }
  .product-card { min-width: 220px; }
  .gear, .sparkle-container { display: none; }
}
</style>