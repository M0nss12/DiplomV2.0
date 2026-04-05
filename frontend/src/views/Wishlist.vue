<template>
  <div class="wishlist-page">
    <div class="wishlist-container">
      <header class="wishlist-header">
        <div class="header-left">
          <h1>❤ Избранные товары</h1>
          <p class="region-info">Ваш город: <b>{{ appStore.city }}</b></p>
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
                  🚛 Доставка
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
    window.dispatchEvent(new Event('wishlist-updated'));
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


@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulseGlow {
  0% {
    box-shadow: 0 0 0 0 var(--primary-light);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(230, 57, 70, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(230, 57, 70, 0);
  }
}

.wishlist-page {
  padding: 40px 0 80px;
  background: var(--bg-body);
  animation: fadeIn 0.5s ease-out;
}

.wishlist-container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ШАПКА */
.wishlist-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 24px;
}

.header-left h1 {
  font-size: 2.4rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.region-info {
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 500;
}

.region-info b {
  color: var(--primary);
  font-weight: 700;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: var(--primary);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  padding: 8px 0;
}

.back-link:hover {
  transform: translateX(-6px);
  text-shadow: 0 0 2px var(--primary-light);
}

.section-divider {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), var(--accent), transparent);
  margin: 20px 0 40px;
}

/* ГРИД КАРТОЧЕК */
.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 32px;
}

.product-card {
  background: var(--bg-card);
  backdrop-filter: blur(4px);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  padding: 24px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-light);
}

/* КНОПКА УДАЛЕНИЯ */
.btn-remove {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-card);
  backdrop-filter: blur(8px);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 400;
  cursor: pointer;
  z-index: 10;
  border: 1px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}

.btn-remove:hover {
  background: var(--danger-light);
  color: var(--danger);
  transform: rotate(90deg) scale(1.1);
  border-color: var(--danger);
}

/* ССЫЛКА-КОНТЕНТ */
.card-content-link {
  text-decoration: none;
  color: inherit;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* ИЗОБРАЖЕНИЕ */
.image-wrapper {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  background: #fff;
  border-radius: var(--radius-md);
  padding: 12px;
  transition: all 0.3s;
}

.product-img {
  max-width: 100%;
  max-height: 170px;
  object-fit: contain;
  transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}

.product-card:hover .product-img {
  transform: scale(1.05);
}

/* НАЗВАНИЕ */
.product-name {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  margin-bottom: 12px;
  color: var(--text-main);
  transition: color 0.2s;
}

.card-content-link:hover .product-name {
  color: var(--primary);
}

/* ЦЕНЫ */
.price-box {
  margin-bottom: 16px;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

.price-main {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--danger);
  letter-spacing: -0.5px;
}

.price-old {
  color: var(--text-muted);
  text-decoration: line-through;
  font-size: 0.9rem;
  font-weight: 500;
}

/* СТАТУС НАЛИЧИЯ */
.stock-status-box {
  margin-bottom: 20px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 40px;
  font-size: 0.8rem;
  font-weight: 700;
  backdrop-filter: blur(4px);
}

.status-badge.local {
  background: var(--success-light);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-badge.intercity {
  background: var(--warning-light);
  color: var(--warning);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.status-badge.out {
  background: var(--bg-input);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

/* КНОПКА В КОРЗИНУ */
.btn-add-to-cart {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--success), var(--success-hover));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

.btn-add-to-cart:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(16, 185, 129, 0.35);
}

.btn-add-to-cart:disabled {
  background: var(--border-color);
  color: var(--text-muted);
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

/* ПУСТОЕ СОСТОЯНИЕ */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: var(--bg-card);
  backdrop-filter: blur(4px);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--border-color);
  margin: 40px 0;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 24px;
  opacity: 0.4;
}

.empty-state h2 {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 12px;
  color: var(--text-muted);
}

.empty-state p {
  color: var(--text-muted);
  margin-bottom: 32px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.btn-primary {
  display: inline-block;
  padding: 14px 40px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(79, 70, 229, 0.35);
}

/* ЛОАДЕР */
.loading-state {
  text-align: center;
  padding: 100px 0;
}

.loader {
  width: 60px;
  height: 60px;
  border: 4px solid var(--primary-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 24px;
}

.loading-state h2 {
  font-size: 1.3rem;
  color: var(--text-muted);
  font-weight: 600;
}

/* АДАПТИВНОСТЬ */
@media (max-width: 1024px) {
  .wishlist-grid {
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .wishlist-page {
    padding: 24px 0 60px;
  }
  
  .wishlist-container {
    padding: 0 16px;
  }
  
  .header-left h1 {
    font-size: 1.8rem;
  }
  
  .wishlist-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }
  
  .product-card {
    padding: 20px;
  }
  
  .image-wrapper {
    height: 160px;
  }
  
  .product-img {
    max-height: 130px;
  }
  
  .price-main {
    font-size: 1.3rem;
  }
  
  .empty-state h2 {
    font-size: 1.4rem;
  }
}

@media (max-width: 480px) {
  .wishlist-grid {
    grid-template-columns: 1fr;
  }
  
  .wishlist-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .back-link {
    margin-top: 8px;
  }
}
</style>