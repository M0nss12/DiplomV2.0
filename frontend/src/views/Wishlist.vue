<template>
  <div class="wishlist-page">
    <div class="wishlist-container">
      <header class="wishlist-header">
        <div class="header-left">
          <h1>❤ Избранные товары</h1>
          <p class="region-info">Ваш регион: <b>{{ appStore.city }}</b></p>
        </div>
        <router-link to="/profile" class="back-link">
          <span class="icon">←</span> Вернуться в кабинет
        </router-link>
      </header>

      <hr class="section-divider" />

      <!-- ЗАГРУЗКА -->
      <div v-if="loading" class="loading-state">
        <div class="loader"></div>
        <h2>Загрузка данных...</h2>
      </div>

      <!-- СПИСОК ТОВАРОВ -->
      <div v-else-if="products.length > 0" class="wishlist-grid">
        <div v-for="p in products" :key="p.id" class="product-card card-shadow">
          
          <!-- Удаление -->
          <button @click="removeFromWishlist(p.wishlist_record_id)" class="btn-remove" title="Удалить из избранного">
            &times;
          </button>

          <router-link :to="'/product/' + p.id" class="card-content-link">
            <div class="image-wrapper">
              <img :src="p.image_url" :alt="p.name" class="product-img" />
            </div>
            
            <h3 class="product-name">{{ p.name }}</h3>
            
            <div class="price-box">
              <strong class="price-main">{{ p.discount_price || p.price }} ₽</strong>
              <s v-if="p.discount_price" class="price-old">{{ p.price }} ₽</s>
            </div>

            <!-- БЛОК НАЛИЧИЯ -->
            <div class="stock-status-box">
               <div v-if="getStockInCity(p) > 0" class="status-badge local">
                  ✅ В наличии: {{ getStockInCity(p) }} шт.
               </div>
               <div v-else-if="getTotalStock(p) > 0" class="status-badge intercity">
                  🚛 Доставка из Хаба
               </div>
               <div v-else class="status-badge out">
                  ❌ Нет в наличии
               </div>
            </div>
          </router-link>

          <button @click="addToCart(p)" class="btn-add-to-cart" :disabled="getTotalStock(p) === 0">
            В корзину
          </button>
        </div>
      </div>

      <!-- ПУСТОЕ СОСТОЯНИЕ -->
      <div v-else class="empty-state">
        <div class="empty-icon">📂</div>
        <h2>В избранном пока пусто</h2>
        <p>Добавляйте товары, которые вам понравились, чтобы не потерять их.</p>
        <router-link to="/catalog">
          <button class="btn-primary">Перейти в каталог</button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAppStore } from '@/stores/appStore';
import { useCartStore } from '@/stores/cartStore';

const appStore = useAppStore();
const cartStore = useCartStore();

const products = ref([]); 
const loading = ref(true);

const loadWishlist = async () => {
  const userId = localStorage.getItem('user_id');
  if (!userId) { loading.value = false; return; }

  try {
    const res = await axios.get(`/api/wishlist/${userId}`);
    products.value = (res.data || []).map(row => {
        const p = row.products || row.product;
        return {
            ...p,
            wishlist_record_id: row.id 
        };
    }).filter(p => p.id);
  } catch (e) {
    console.error("Ошибка загрузки:", e);
  } finally {
    loading.value = false;
  }
};

const getStockInCity = (p) => {
    if (!p || !p.product_stocks || !appStore.city) return 0;
    const searchCity = appStore.city.trim().toLowerCase();
    return p.product_stocks.reduce((total, stockRecord) => {
        let wh = stockRecord.warehouses || stockRecord.warehouse;
        if (Array.isArray(wh)) wh = wh[0];
        if (wh && wh.city_name && wh.city_name.trim().toLowerCase() === searchCity) {
            return total + (Number(stockRecord.quantity) || 0);
        }
        return total;
    }, 0);
};

const getTotalStock = (p) => {
    if (!p || !p.product_stocks) return 0;
    return p.product_stocks.reduce((total, s) => total + (Number(s.quantity) || 0), 0);
};

const removeFromWishlist = async (wishlistId) => {
  try {
    await axios.delete(`/api/wishlist/${wishlistId}`);
    products.value = products.value.filter(p => p.wishlist_record_id !== wishlistId);
  } catch (e) {
    alert("Ошибка при удалении");
  }
};

const addToCart = (p) => {
  cartStore.addToCart({ ...p, stock_quantity: getTotalStock(p) });
  alert("Товар добавлен в корзину!");
};

onMounted(loadWishlist);
</script>

<style scoped>
.wishlist-page {
    padding-top: 40px;
    padding-bottom: 80px;
    animation: fadeIn 0.5s ease-out;
}

.wishlist-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* ШАПКА */
.wishlist-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 20px;
}

.wishlist-header h1 {
    font-size: 2.2rem;
    font-weight: 800;
    margin: 0 0 5px 0;
    color: var(--text-main);
}

.region-info {
    color: var(--text-muted);
    font-size: 0.95rem;
}

.back-link {
    font-weight: 600;
    color: var(--primary);
    text-decoration: none;
    transition: var(--transition);
}

.back-link:hover {
    transform: translateX(-5px);
}

.section-divider {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 20px 0 40px;
}

/* ГРИД КАРТОЧЕК */
.wishlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 30px;
}

.product-card {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    padding: 25px;
    position: relative;
    transition: var(--transition);
    display: flex;
    flex-direction: column;
}

.product-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-light);
}

/* Кнопка удаления */
.btn-remove {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--bg-input);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    cursor: pointer;
    z-index: 10;
    border: none;
    transition: var(--transition);
}

.btn-remove:hover {
    background: var(--danger-light);
    color: var(--danger);
    transform: rotate(90deg);
}

/* Контент карточки */
.card-content-link {
    text-decoration: none;
    color: inherit;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.image-wrapper {
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    background: white;
    border-radius: var(--radius-md);
}

.product-img {
    max-width: 90%;
    max-height: 160px;
    object-fit: contain;
    transition: transform 0.4s ease;
}

.product-card:hover .product-img {
    transform: scale(1.08);
}

.product-name {
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.3;
    height: 2.6em;
    overflow: hidden;
    margin-bottom: 12px;
    color: var(--text-main);
}

.price-box {
    margin-bottom: 15px;
}

.price-main {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--danger);
    margin-right: 10px;
}

.price-old {
    color: var(--text-muted);
    text-decoration: line-through;
    font-size: 0.95rem;
}

/* Статусы */
.stock-status-box {
    margin-bottom: 20px;
}

.status-badge {
    display: inline-block;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    font-weight: 700;
}

.status-badge.local { background: var(--success-light); color: var(--success); }
.status-badge.intercity { background: var(--warning-light); color: var(--warning); }
.status-badge.out { background: var(--bg-input); color: var(--text-muted); }

/* Кнопка в корзину */
.btn-add-to-cart {
    width: 100%;
    padding: 14px;
    background: var(--success);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    transition: var(--transition);
}

.btn-add-to-cart:hover:not(:disabled) {
    background: var(--success-hover);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

.btn-add-to-cart:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
    box-shadow: none;
}

/* ПУСТОЕ СОСТОЯНИЕ */
.empty-state {
    text-align: center;
    padding: 100px 20px;
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 2px dashed var(--border-color);
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 20px;
    opacity: 0.3;
}

.empty-state h2 {
    color: var(--text-muted);
    margin-bottom: 10px;
}

.empty-state p {
    margin-bottom: 30px;
    color: var(--text-muted);
}

.btn-primary {
    padding: 12px 40px;
    background: var(--primary);
    color: white;
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: 1rem;
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.2);
}

/* ЛОАДЕР */
.loading-state {
    text-align: center;
    padding: 100px 0;
}

.loader {
    width: 50px;
    height: 50px;
    border: 5px solid var(--primary-light);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* АДАПТИВНОСТЬ */
@media (max-width: 768px) {
    .wishlist-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 20px;
    }
    .wishlist-header h1 { font-size: 1.8rem; }
}

@media (max-width: 480px) {
    .wishlist-grid {
        grid-template-columns: 1fr;
    }
}
</style>