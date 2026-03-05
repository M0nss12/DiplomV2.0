<template>
  <div v-if="product" class="product-detail-page">
    
    <h1 class="product-main-title">{{ product.name }}</h1>

    <div class="product-core-grid">
      
      <!-- ЛЕВАЯ КОЛОНКА: ФОТО -->
      <div class="product-gallery">
        <div class="image-card">
          <button @click="toggleWishlist" class="wishlist-float-btn" :class="{ 'is-active': isFavorite }">
            <span>❤</span>
          </button>
          <img :src="product.image_url" class="main-image" />
        </div>
      </div>

      <!-- ЦЕНТРАЛЬНАЯ КОЛОНКА: ИНФО -->
      <div class="product-info-column">
        <div class="brand-header">
          <div class="sku-badge">Артикул: <b>{{ product.sku }}</b></div>
          <img :src="product.brands?.logo_url" class="brand-mini-logo" v-if="product.brands?.logo_url" />
        </div>
        
        <div class="specs-section">
          <h3>Характеристики</h3>
          <ul class="specs-list">
            <li><span>📦 Вес</span> <b>{{ product.weight_kg }} кг</b></li>
            <li><span>🛡️ Гарантия</span> <b>{{ product.warranty_months }} мес.</b></li>
            <li><span>🌍 Страна</span> <b>{{ product.brands?.country || 'Германия' }}</b></li>
            <li v-for="(spec, idx) in formattedSpecs" :key="idx">
               <span>{{ spec.key }}</span> <b>{{ spec.value }}</b>
            </li>
          </ul>
        </div>

        <div class="stock-section">
          <h3>Наличие в магазинах</h3>
          
          <!-- В ТЕКУЩЕМ ГОРОДЕ -->
          <div v-if="localStocks.length > 0" class="city-stock-card">
            <div class="city-header">
               📍 В г. {{ appStore.city }}: <b>{{ totalLocalStock }} шт.</b>
            </div>
            <table class="stock-table">
              <tr v-for="stock in localStocks" :key="stock.id">
                <td>{{ stock.warehouses?.address }}</td>
                <td class="qty-cell">{{ stock.quantity }} шт.</td>
              </tr>
            </table>
          </div>

          <div v-else class="stock-alert">
             ⚠️ В г. {{ appStore.city }} нет в наличии. Доступно под заказ.
          </div>

          <!-- В ДРУГИХ ГОРОДАХ -->
          <div v-if="groupedOtherCityStocks.length > 0" class="other-cities-wrap">
             <button @click="showOtherCities = !showOtherCities" class="btn-outline-small">
               {{ showOtherCities ? 'Скрыть города' : `Наличие в других городах (${groupedOtherCityStocks.length})` }}
             </button>

             <transition name="slide">
               <div v-if="showOtherCities" class="other-cities-list">
                 <table class="stock-table">
                    <tbody>
                      <tr v-for="cityInfo in groupedOtherCityStocks" :key="cityInfo.city">
                        <td>{{ cityInfo.city }}</td>
                        <td class="qty-cell"><b>{{ cityInfo.total }} шт.</b></td>
                      </tr>
                    </tbody>
                 </table>
               </div>
             </transition>
          </div>
        </div>
      </div>

      <!-- ПРАВАЯ КОЛОНКА: ЦЕНА И КУПИТЬ (STICKY) -->
      <aside class="product-buy-card">
        <div class="price-container">
          <div v-if="product.discount_price" class="price-discount-wrap">
            <s class="old-price">{{ product.price }} ₽</s>
            <div class="new-price">{{ product.discount_price }} ₽</div>
          </div>
          <div v-else class="new-price">{{ product.price }} ₽</div>
        </div>

        <div class="delivery-hint">
            <div v-if="totalLocalStock > 0" class="status-ok">✅ В наличии сегодня</div>
            <div v-else class="status-wait">🚢 Доставка 2-3 дня</div>
        </div>

        <button 
          @click="handleAddToCart" 
          :disabled="totalStockCount === 0" 
          class="main-cart-btn"
          :class="{ 'disabled': totalStockCount === 0 }"
        >
          {{ totalStockCount > 0 ? 'В корзину' : 'Нет в наличии' }}
        </button>

        <div class="trust-icons">
          <div class="t-item">📍 Самовывоз: <b>Бесплатно</b></div>
          <div class="t-item">💳 Оплата: <b>Картой или наличными</b></div>
        </div>
      </aside>
    </div>

    <!-- ОТЗЫВЫ -->
    <section class="reviews-section">
      <div class="reviews-header">
        <h2>Отзывы покупателей <span>{{ reviews.length }}</span></h2>
        
        <button v-if="canUserLeaveReview && !userExistingReview && !showReviewForm" 
                @click="prepareCreate" class="btn-write-review">
          Написать отзыв
        </button>
      </div>

      <!-- ФОРМА ОТЗЫВА -->
      <transition name="fade">
        <div v-if="showReviewForm" class="review-form-card">
          <h3>{{ isEditing ? 'Редактирование отзыва' : 'Ваше мнение о товаре' }}</h3>
          
          <div class="rating-picker">
              <span>Ваша оценка:</span>
              <div class="stars">
                  <button v-for="n in 5" :key="n" @click="newReview.rating = n" 
                          :class="{ 'active': n <= newReview.rating }">★</button>
              </div>
          </div>

          <div class="review-inputs-grid">
              <input v-model="newReview.pros" placeholder="Достоинства" />
              <input v-model="newReview.cons" placeholder="Недостатки" />
          </div>

          <textarea v-model="newReview.comment" placeholder="Напишите подробнее о качестве детали..." rows="4"></textarea>
          
          <div class="form-actions">
              <button @click="submitReview" :disabled="submittingReview" class="btn-submit-review">
                  {{ submittingReview ? 'Сохранение...' : 'Опубликовать' }}
              </button>
              <button @click="showReviewForm = false" class="btn-cancel">Отмена</button>
          </div>
        </div>
      </transition>

      <!-- СПИСОК ОТЗЫВОВ -->
      <div v-if="reviews.length > 0" class="reviews-list">
        <div v-for="review in reviews" :key="review.id" 
             class="review-item"
             :class="{ 'is-mine': review.user_id == currentUserId }">
          
          <button v-if="review.user_id == currentUserId" 
                  @click="prepareEdit(review)" class="edit-review-btn">
            ✎ Редактировать
          </button>

          <div class="review-user-info">
             <img :src="review.users?.avatar_url || '/assets/images/avatars/1.png'" @error="$event.target.src = '/assets/images/avatars/1.png'" />
             <div class="u-meta">
               <strong>{{ review.users?.first_name || 'Покупатель' }} <span v-if="review.user_id == currentUserId">(Вы)</span></strong>
               <div class="user-stars">{{ '★'.repeat(review.rating) }}<span>{{ '★'.repeat(5 - review.rating) }}</span></div>
             </div>
             <span class="review-date">{{ review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Недавно' }}</span>
          </div>
          
          <div class="review-text">{{ review.comment }}</div>
          
          <div class="pros-cons">
            <div v-if="review.pros" class="pros"><b>+</b> {{ review.pros }}</div>
            <div v-if="review.cons" class="cons"><b>−</b> {{ review.cons }}</div>
          </div>
        </div>
      </div>
      <div v-else class="no-reviews">
        <p>На этот товар еще нет отзывов. Купите товар и станьте первым!</p>
      </div>
    </section>
  </div>

  <div v-else class="product-loader">
    <div class="spinner"></div>
    <h2>Загрузка запчасти...</h2>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, reactive } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '@/stores/cartStore';
import { useAppStore } from '@/stores/appStore';

const route = useRoute();
const cartStore = useCartStore();
const appStore = useAppStore();

const product = ref(null);
const reviews = ref([]);
const wishlistId = ref(null);
const showOtherCities = ref(false);
const currentUserId = ref(localStorage.getItem('user_id'));

const canUserLeaveReview = ref(false);
const userExistingReview = ref(null);
const showReviewForm = ref(false);
const isEditing = ref(false);
const submittingReview = ref(false);
const newReview = reactive({ id: null, rating: 5, comment: '', pros: '', cons: '' });

const isSameCity = (city1) => {
    if (!city1 || !appStore.city) return false;
    return city1.trim().toLowerCase() === appStore.city.trim().toLowerCase();
};

const formattedSpecs = computed(() => {
  if (!product.value?.description) return [];
  return product.value.description.split(/\.(?!\d)/)
    .map(s => s.trim())
    .filter(s => s.includes(':'))
    .map(s => {
        const [key, val] = s.split(':');
        return { key: key.trim(), value: val.trim() };
    });
});

const localStocks = computed(() => {
    if (!product.value?.product_stocks) return [];
    return product.value.product_stocks.filter(s => isSameCity(s.warehouses?.city_name) && s.quantity > 0);
});

const totalLocalStock = computed(() => {
    return localStocks.value.reduce((sum, s) => sum + s.quantity, 0);
});

const groupedOtherCityStocks = computed(() => {
    if (!product.value?.product_stocks) return [];
    const rawStocks = product.value.product_stocks.filter(s => !isSameCity(s.warehouses?.city_name) && s.quantity > 0);
    const groups = {};
    rawStocks.forEach(stock => {
        const cityName = stock.warehouses?.city_name || 'Неизвестный город';
        groups[cityName] = (groups[cityName] || 0) + stock.quantity;
    });
    return Object.keys(groups).map(city => ({ city, total: groups[city] })).sort((a, b) => b.total - a.total);
});

const totalStockCount = computed(() => {
    return product.value?.product_stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0;
});

const isFavorite = computed(() => wishlistId.value !== null);

const loadData = async () => {
  const pId = route.params.id;
  const uId = currentUserId.value;

  try {
    const pRes = await axios.get(`/api/products/${pId}`);
    product.value = pRes.data;
    saveToHistory(pId);

    const rRes = await axios.get(`/api/reviews/${pId}`);
    reviews.value = rRes.data;

    if (uId) {
      userExistingReview.value = reviews.value.find(r => r.user_id == uId) || null;

      const wRes = await axios.get(`/api/wishlist/${uId}`);
      const found = wRes.data.find(item => item.product_id == pId);
      wishlistId.value = found ? found.id : null;

      const orderRes = await axios.get(`/api/orders/${uId}`);
      canUserLeaveReview.value = orderRes.data.some(order => 
        order.delivery_status === 'delivered' && 
        order.order_items.some(item => Number(item.product_id) === Number(pId))
      );
    }
  } catch (e) { console.error("Load error:", e); }
};

const saveToHistory = (id) => {
    let viewed = JSON.parse(localStorage.getItem('recent_views') || '[]');
    viewed = viewed.filter(vId => Number(vId) !== Number(id));
    viewed.unshift(Number(id));
    if (viewed.length > 25) viewed = viewed.slice(0, 25);
    localStorage.setItem('recent_views', JSON.stringify(viewed));
};

const handleAddToCart = () => {
    if (!product.value) return;
    cartStore.addToCart({ ...product.value, stock_quantity: totalStockCount.value });
    alert("Товар добавлен в корзину!");
};

const toggleWishlist = async () => {
  const uId = currentUserId.value;
  if (!uId) return alert("Войдите в аккаунт!");
  try {
      if (isFavorite.value) {
        await axios.delete(`/api/wishlist/${uId}/${product.value.id}`);
        wishlistId.value = null;
      } else {
        const res = await axios.post('/api/wishlist', { user_id: uId, product_id: product.value.id });
        wishlistId.value = res.data.id;
      }
  } catch (e) { console.error(e); }
};

const prepareCreate = () => {
    isEditing.value = false;
    Object.assign(newReview, { id: null, rating: 5, comment: '', pros: '', cons: '' });
    showReviewForm.value = true;
};

const prepareEdit = (review) => {
    isEditing.value = true;
    Object.assign(newReview, { id: review.id, rating: review.rating, comment: review.comment, pros: review.pros, cons: review.cons });
    showReviewForm.value = true;
};

const submitReview = async () => {
    if (!newReview.comment.trim()) return alert("Напишите комментарий");
    submittingReview.value = true;
    try {
        if (isEditing.value) {
            await axios.patch(`/api/reviews/${newReview.id}`, newReview);
            alert("Отзыв обновлен!");
        } else {
            await axios.post('/api/reviews', { product_id: product.value.id, user_id: currentUserId.value, ...newReview });
            alert("Спасибо за отзыв!");
        }
        showReviewForm.value = false;
        loadData();
    } catch (e) { alert("Ошибка сохранения"); } 
    finally { submittingReview.value = false; }
};

onMounted(loadData);
watch(() => route.params.id, (newId) => { if(newId) loadData(); });
</script>

<style scoped>
.product-detail-page {
    padding: 40px 20px;
    animation: fadeIn 0.5s ease-out;
}

.product-main-title {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 30px;
    color: var(--text-main);
}

.product-core-grid {
    display: grid;
    grid-template-columns: 1fr 1.2fr 0.8fr;
    gap: 40px;
    align-items: flex-start;
}

/* ГАЛЕРЕЯ */
.image-card {
    background: white;
    border-radius: var(--radius-lg);
    padding: 40px;
    position: relative;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-md);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
}

.main-image {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
    transition: transform 0.3s ease;
}

.image-card:hover .main-image {
    transform: scale(1.05);
}

.wishlist-float-btn {
    position: absolute;
    top: 20px; right: 20px;
    width: 50px; height: 50px;
    border-radius: 50%;
    background: white;
    border: 1px solid var(--border-color);
    font-size: 1.5rem;
    color: #cbd5e1;
    z-index: 10;
    box-shadow: var(--shadow-sm);
}

.wishlist-float-btn.is-active {
    color: var(--danger);
    border-color: var(--danger-light);
    background: var(--danger-light);
}

/* ИНФОРМАЦИЯ */
.brand-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

.sku-badge {
    background: var(--bg-input);
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.9rem;
    color: var(--text-muted);
}

.brand-mini-logo {
    height: 35px;
    object-fit: contain;
}

.specs-list {
    list-style: none;
    background: var(--bg-input);
    padding: 20px;
    border-radius: var(--radius-md);
}

.specs-list li {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid rgba(0,0,0,0.05);
}

.specs-list li:last-child { border-bottom: none; }

.specs-list span { color: var(--text-muted); }

/* НАЛИЧИЕ */
.city-stock-card {
    background: var(--success-light);
    border: 1px solid var(--success);
    border-radius: var(--radius-md);
    overflow: hidden;
    margin-top: 15px;
}

.city-header {
    padding: 12px 15px;
    background: rgba(16, 185, 129, 0.1);
    font-weight: 700;
    color: var(--success);
}

.stock-table {
    width: 100%;
    border-collapse: collapse;
}

.stock-table td {
    padding: 12px 15px;
    border-top: 1px solid rgba(16, 185, 129, 0.1);
    font-size: 0.9rem;
}

.qty-cell { text-align: right; color: var(--success); font-weight: 700; }

.stock-alert {
    padding: 15px;
    background: var(--warning-light);
    border-radius: var(--radius-md);
    color: #92400e;
    font-weight: 600;
}

.btn-outline-small {
    margin-top: 15px;
    padding: 8px 16px;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    font-size: 0.85rem;
    color: var(--text-muted);
}

/* КАРТОЧКА КУПИТЬ */
.product-buy-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 30px;
    box-shadow: var(--shadow-lg);
    position: sticky;
    top: 100px;
}

.new-price {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--text-main);
}

.old-price {
    color: var(--text-muted);
    font-size: 1.1rem;
    text-decoration: line-through;
}

.delivery-hint { margin: 20px 0; font-weight: 700; }
.status-ok { color: var(--success); }
.status-wait { color: var(--warning); }

.main-cart-btn {
    width: 100%;
    padding: 20px;
    background: var(--primary);
    color: white;
    border-radius: var(--radius-md);
    font-size: 1.1rem;
    font-weight: 800;
    box-shadow: 0 10px 20px var(--primary-light);
}

.main-cart-btn.disabled {
    background: #cbd5e1;
    box-shadow: none;
}

.trust-icons {
    margin-top: 25px;
    font-size: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* ОТЗЫВЫ */
.reviews-section {
    margin-top: 80px;
    border-top: 1px solid var(--border-color);
    padding-top: 40px;
}

.reviews-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
}

.reviews-header span {
    background: var(--primary-light);
    color: var(--primary);
    padding: 4px 12px;
    border-radius: 10px;
    font-size: 1rem;
    margin-left: 10px;
}

.btn-write-review {
    background: var(--primary);
    color: white;
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 700;
}

/* ФОРМА ОТЗЫВА */
.review-form-card {
    background: var(--bg-card);
    padding: 30px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--primary);
    margin-bottom: 40px;
}

.stars button {
    font-size: 2rem;
    background: none;
    color: #e2e8f0;
}

.stars button.active { color: #f1c40f; }

.review-inputs-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 20px 0;
}

.review-form-card input, .review-form-card textarea {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-input);
}

.btn-submit-review {
    background: var(--success);
    color: white;
    padding: 12px 30px;
    border-radius: 10px;
    font-weight: 700;
}

/* СПИСОК ОТЗЫВОВ */
.review-item {
    background: var(--bg-card);
    padding: 25px;
    border-radius: var(--radius-md);
    margin-bottom: 20px;
    border: 1px solid var(--border-color);
}

.review-item.is-mine { border-color: var(--primary); background: var(--primary-light); }

.review-user-info {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
}

.review-user-info img {
    width: 45px; height: 45px;
    border-radius: 50%;
    object-fit: cover;
}

.user-stars { color: #f1c40f; }
.user-stars span { color: #e2e8f0; }

.review-text {
    line-height: 1.6;
    margin-bottom: 15px;
}

.pros-cons { font-size: 0.9rem; }
.pros { color: var(--success); margin-bottom: 5px; }
.cons { color: var(--danger); }

/* АДАПТИВНОСТЬ */
@media (max-width: 1024px) {
    .product-core-grid { grid-template-columns: 1fr; }
    .product-buy-card { position: static; width: 100%; }
}

@media (max-width: 768px) {
    .product-main-title { font-size: 1.8rem; }
    .review-inputs-grid { grid-template-columns: 1fr; }
}
</style>