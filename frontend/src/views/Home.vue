<template>
  <div class="home-page">
    
    <!-- 1. ЛЕНТА БРЕНДОВ -->
    <section class="brands-section">
      <h2>Наши партнеры</h2>
      <div class="brands-ribbon">
        <div v-for="brand in brands" :key="brand.id" class="brand-item">
          <!-- Можно также добавить ссылку на фильтр по бренду в будущем -->
          <img :src="brand.logo_url" :title="brand.name" />
        </div>
      </div>
    </section>

    <hr />

    <!-- 2. ВЫГОДНЫЕ ПРЕДЛОЖЕНИЯ -->
    <section v-if="hotDeals.length > 0" class="carousel-section">
      <div class="carousel-header">
        <h2 style="color: #e44d26;">🔥 Выгодные предложения</h2>
        <div class="carousel-controls">
          <button @click="scroll('hotDeals', -1)">←</button>
          <button @click="scroll('hotDeals', 1)">→</button>
        </div>
      </div>
      
      <div class="scroll-container" ref="hotDealsRef" @mouseenter="pauseAuto('hotDeals')" @mouseleave="resumeAuto('hotDeals')">
        <div v-for="p in hotDeals" :key="p.id" class="product-card">
          <button @click.stop="toggleWishlist(p.id)" class="wishlist-btn">
            <span :style="{ color: wishlistIds.includes(p.id) ? 'red' : '#ccc' }">❤</span>
          </button>

          <router-link :to="'/product/' + p.id" class="card-link">
            <img :src="p.brands?.logo_url" class="brand-logo" v-if="p.brands?.logo_url" />
            <div class="img-wrapper"><img :src="p.image_url" class="product-img" /></div>
            <h4 class="product-title">{{ p.name }}</h4>
            
            <div class="price-block">
              <span class="old-price">{{ p.price }} ₽</span>
              <strong class="new-price">{{ p.discount_price }} ₽</strong>
            </div>

            <div class="stock-status">
              <small v-if="getStockInCity(p) > 0" style="color: #27ae60; font-weight: bold;">
                ✅ В г. {{ appStore.city }}: {{ getStockInCity(p) }} шт.
              </small>
              <small v-else style="color: #888;">🚢 Под заказ (Межгород)</small>
            </div>
          </router-link>
          <button @click="handleAddToCart(p)" class="cart-btn">В корзину</button>
        </div>
      </div>
    </section>

    <hr />

    <!-- 3. ПОПУЛЯРНЫЕ КАТЕГОРИИ (ТЕПЕРЬ КЛИКАБЕЛЬНЫЕ) -->
    <section v-if="popularCategories.length > 0">
      <h2>Популярные категории</h2>
      <div class="categories-grid">
        <!-- Оборачиваем в router-link. Ведем в /catalog/ID -->
        <router-link 
          v-for="cat in popularCategories" 
          :key="cat.id" 
          :to="'/catalog/' + cat.id" 
          class="category-card-link"
        >
          <div class="category-card">
            <img :src="cat.image_url || '/assets/images/no-cat.png'" />
            <p><b>{{ cat.name }}</b></p>
          </div>
        </router-link>
      </div>
    </section>

    <hr />

    <!-- 4. НЕДАВНО ПРОСМОТРЕННЫЕ -->
    <section v-if="recentProducts.length > 0" class="carousel-section">
      <div class="carousel-header">
        <h2>🕒 Вы недавно смотрели</h2>
        <div class="carousel-controls">
          <button @click="scroll('recent', -1)">←</button>
          <button @click="scroll('recent', 1)">→</button>
        </div>
      </div>
      
      <div class="scroll-container" ref="recentRef" @mouseenter="pauseAuto('recent')" @mouseleave="resumeAuto('recent')">
        <div v-for="p in recentProducts" :key="p.id" class="product-card">
          <button @click.stop="toggleWishlist(p.id)" class="wishlist-btn">
            <span :style="{ color: wishlistIds.includes(p.id) ? 'red' : '#ccc' }">❤</span>
          </button>
          <router-link :to="'/product/' + p.id" class="card-link">
            <img :src="p.brands?.logo_url" class="brand-logo" v-if="p.brands?.logo_url" />
            <div class="img-wrapper"><img :src="p.image_url" class="product-img" /></div>
            <h4 class="product-title">{{ p.name }}</h4>
            <div class="price-block">
              <strong class="new-price">{{ p.discount_price || p.price }} ₽</strong>
            </div>
            <div class="stock-status">
               <small v-if="getStockInCity(p) > 0" style="color: #27ae60; font-weight: bold;">✅ В наличии</small>
               <small v-else style="color: #888;">🚢 Под заказ</small>
            </div>
          </router-link>
          <button @click="handleAddToCart(p)" class="cart-btn">В корзину</button>
        </div>
      </div>
    </section>

    <footer class="company-desc">
      <h3>ApexDrive — инновации в каждой детали</h3>
      <p>Мы предлагаем более 100 000 запчастей. Наша 100% нормализованная база данных обеспечивает точность остатков в вашем городе.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import axios from 'axios';
import { useAppStore } from '@/stores/appStore';
import { useCartStore } from '@/stores/cartStore';

const appStore = useAppStore();
const cartStore = useCartStore();

const brands = ref([]);
const hotDeals = ref([]);
const popularCategories = ref([]);
const recentProducts = ref([]);
const wishlistIds = ref([]);

const hotDealsRef = ref(null);
const recentRef = ref(null);
const timers = { hotDeals: null, recent: null };

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

        const ids = JSON.parse(localStorage.getItem('recent_views') || '[]');
        if (ids.length) {
            const r = await axios.post('/api/products/recent', { ids: ids.slice(0, 15) });
            recentProducts.value = r.data;
        }
    } catch (e) { console.error("Load error"); }
};

// Исправленная логика остатков (совместимость с 3НФ JOIN)
const getStockInCity = (p) => {
    if (!p.product_stocks || !appStore.city) return 0;
    const myCity = appStore.city.trim().toLowerCase();
    
    return p.product_stocks
        .filter(s => {
            const warehouse = s.warehouses || s.warehouse;
            return warehouse?.city_name?.trim().toLowerCase() === myCity;
        })
        .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
};

const getTotalStock = (p) => {
  return p.product_stocks?.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0) || 0;
};

// Прокрутка каруселей
const scroll = (name, dir) => {
    const el = name === 'hotDeals' ? hotDealsRef.value : recentRef.value;
    if (el) el.scrollBy({ left: 300 * dir, behavior: 'smooth' });
};

const startAuto = (name) => {
    timers[name] = setInterval(() => {
        const el = name === 'hotDeals' ? hotDealsRef.value : recentRef.value;
        if (!el) return;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
            el.scrollTo({left: 0, behavior: 'smooth'});
        } else {
            el.scrollBy({ left: 260, behavior: 'smooth' });
        }
    }, 5000);
};

const pauseAuto = (name) => clearInterval(timers[name]);
const resumeAuto = (name) => startAuto(name);

const toggleWishlist = async (id) => {
    const uid = localStorage.getItem('user_id');
    if (!uid) return alert("Войдите в аккаунт!");
    
    if (wishlistIds.value.includes(id)) {
        await axios.delete(`/api/wishlist/${uid}/${id}`);
        wishlistIds.value = wishlistIds.value.filter(i => i !== id);
    } else {
        await axios.post('/api/wishlist', { user_id: uid, product_id: id });
        wishlistIds.value.push(id);
    }
};

const handleAddToCart = (p) => {
    cartStore.addToCart({
        ...p,
        stock_quantity: getTotalStock(p)
    });
    alert('Товар добавлен в корзину!');
};

onMounted(() => {
    loadData();
    startAuto('hotDeals');
    startAuto('recent');
});

onUnmounted(() => {
    pauseAuto('hotDeals');
    pauseAuto('recent');
});

watch(() => appStore.city, loadData);
</script>
