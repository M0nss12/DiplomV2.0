<template>
  <div v-if="product" class="product-detail-page">
    
    <h1 class="product-main-title">{{ product.name }}</h1>

    <div class="product-core-grid">
      
      <!-- ЛЕВАЯ КОЛОНКА: ФОТО (увеличенное сердечко) -->
      <div class="product-gallery">
        <div class="image-card glass-card">
          <button @click="toggleWishlist" class="wishlist-float-btn" :class="{ 'is-active': isFavorite }">
            <span>❤️</span>
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
        
        <div class="specs-section glass-card">
          <h3>Характеристики</h3>
          <ul class="specs-list">
            <li><span>📦 Вес</span> <b>{{ product.weight_kg }} кг</b></li>
            <li><span>🛡️ Гарантия</span> <b>{{ product.warranty_months }} мес.</b></li>
            <li v-for="(spec, idx) in formattedSpecs" :key="idx">
               <span>{{ spec.key }}</span> <b>{{ spec.value }}</b>
            </li>
          </ul>
        </div>

        <div class="stock-section glass-card">
          <h3>Наличие в магазинах</h3>
          
          <div v-if="localStocks.length > 0" class="city-stock-card">
            <div class="city-header">
               📍 В г. {{ appStore.city }}: <b>{{ totalLocalStock }} шт.</b>
            </div>
            <table class="stock-table">
              <tbody>
                <tr v-for="stock in localStocks" :key="stock.id">
                  <td>{{ stock.warehouses?.address }}</td>
                  <td class="qty-cell">{{ stock.quantity }} шт.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="stock-alert">
             ⚠️ В г. {{ appStore.city }} нет в наличии. Доступно под заказ.
          </div>

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

      <!-- ПРАВАЯ КОЛОНКА: ЦЕНА И КУПИТЬ -->
      <aside class="product-buy-card glass-card">
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
          <div class="t-item">💳 Оплата: <b>Онлайн или при получении</b></div>
          <div class="t-item">🚚 Быстрая доставка по всей России</div>
        </div>
      </aside>
    </div>

    <!-- ==============================================
         СЕКЦИЯ ОТЗЫВОВ 
         ============================================== -->
    <section class="reviews-section">
      <div class="reviews-header">
        <h2>Отзывы покупателей <span class="reviews-count-badge">{{ reviews.length }}</span></h2>
        
        <button v-if="canUserLeaveReview && !userExistingReview && !showReviewForm" 
                @click="prepareCreate" class="btn-write-review glass-btn">
          Написать отзыв
        </button>
      </div>

      <!-- ФОРМА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ ОТЗЫВА -->
      <transition name="fade">
        <div v-if="showReviewForm" class="review-form-card glass-card">
          <h3>{{ isEditing ? 'Редактирование отзыва' : 'Ваше мнение о товаре' }}</h3>
          
          <div class="rating-picker">
              <span>Ваша оценка:</span>
              <div class="stars">
                  <button v-for="n in 5" :key="n" @click="newReview.rating = n" 
                          :class="{ 'active': n <= newReview.rating }">★</button>
              </div>
          </div>

          <div class="review-inputs-grid">
              <input v-model="newReview.pros" placeholder="➕ Достоинства" class="form-input" />
              <input v-model="newReview.cons" placeholder="➖ Недостатки" class="form-input" />
          </div>

          <textarea v-model="newReview.comment" placeholder="Напишите подробнее о качестве детали..." rows="4" class="form-textarea"></textarea>
          
          <!-- ЗОНА ЗАГРУЗКИ ФОТО -->
          <div class="client-photo-upload-zone">
            <p class="upload-label">Прикрепить фото (макс. 5 шт):</p>
            <div class="images-preview-grid">
              <div v-for="(img, idx) in newReview.images" :key="idx" class="client-img-item">
                <img :src="img" class="client-preview-img" @click="previewImage(img)"/>
                <button type="button" @click="removePhotoFromForm(idx)" class="client-remove-img-btn">✕</button>
              </div>
              
              <label v-if="newReview.images.length < 5" class="client-upload-btn" :class="{'is-uploading': isUploadingPhoto}">
                <input type="file" @change="handlePhotoUpload" accept="image/*" hidden />
                <span v-if="!isUploadingPhoto">+</span>
                <span v-else class="loader-mini"></span>
              </label>
            </div>
          </div>

          <div class="form-actions">
              <button @click="submitReview" :disabled="submittingReview || isUploadingPhoto" class="btn-submit-review">
                  {{ submittingReview ? 'Сохранение...' : 'Опубликовать' }}
              </button>
              <button @click="cancelReviewForm" class="btn-cancel">Отмена</button>
          </div>
        </div>
      </transition>

      <!-- СПИСОК ОТЗЫВОВ -->
      <div v-if="reviews.length > 0" class="reviews-list">
        <div v-for="review in reviews" :key="review.id" 
             class="review-item glass-card"
             :class="{ 'is-mine': review.user_id == currentUserId }">
          
          <div v-if="review.user_id == currentUserId && !showReviewForm" class="my-review-actions">
            <button @click="prepareEdit(review)" class="btn-action edit">✎ Редактировать</button>
            <button @click="deleteMyReview(review)" class="btn-action delete">🗑️ Удалить</button>
          </div>

          <div class="review-user-info">
             <img :src="review.users?.avatar_url || '/assets/images/avatars/1.png'" @error="$event.target.src = '/assets/images/avatars/1.png'" />
             <div class="u-meta">
               <strong>{{ review.users?.first_name || 'Покупатель' }} <span v-if="review.user_id == currentUserId" class="you-tag">(Вы)</span></strong>
               <div class="user-stars">{{ '★'.repeat(review.rating) }}<span class="empty-star">{{ '★'.repeat(5 - review.rating) }}</span></div>
             </div>
             <span class="review-date">{{ review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Недавно' }}</span>
          </div>
          
          <div class="review-text">{{ review.comment }}</div>
          
          <div class="pros-cons" v-if="review.pros || review.cons">
            <div v-if="review.pros" class="pros"><b>+</b> {{ review.pros }}</div>
            <div v-if="review.cons" class="cons"><b>−</b> {{ review.cons }}</div>
          </div>

          <!-- ГАЛЕРЕЯ ФОТОГРАФИЙ ОТЗЫВА -->
          <div v-if="review.images && review.images.length > 0" class="review-gallery">
            <img v-for="(img, i) in review.images" :key="i" :src="img" @click="previewImage(img)" class="gallery-thumb" />
          </div>

        </div>
      </div>
      <div v-else class="no-reviews glass-card">
        <p>На этот товар еще нет отзывов. Купите товар и станьте первым!</p>
      </div>
    </section>
  </div>

  <div v-else class="product-loader">
    <div class="spinner"></div>
    <h2>Загрузка запчасти...</h2>
  </div>

  <!-- ФУЛЛСКРИН ПРОСМОТР ФОТО -->
  <div v-if="fullscreenImage" class="fullscreen-overlay" @click="fullscreenImage = null">
    <img :src="fullscreenImage" class="fullscreen-img" />
    <button class="fullscreen-close">✕</button>
  </div>

</template>

<script setup>
import { ref, onMounted, computed, watch, reactive } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '@/stores/cartStore';
import { useAppStore } from '@/stores/appStore';

const ADMIN_KEY = 'my_super_secret_admin_123';
const uploadConfig = { headers: { 'x-admin-key': ADMIN_KEY } };

const route = useRoute();
const cartStore = useCartStore();
const appStore = useAppStore();

const product = ref(null);
const reviews = ref([]);
const wishlistId = ref(null);
const showOtherCities = ref(false);
const currentUserId = ref(localStorage.getItem('user_id'));
const fullscreenImage = ref(null);

const canUserLeaveReview = ref(false);
const userExistingReview = ref(null);
const showReviewForm = ref(false);
const isEditing = ref(false);
const submittingReview = ref(false);
const isUploadingPhoto = ref(false);

const newReview = reactive({ 
    id: null, 
    rating: 5, 
    comment: '', 
    pros: '', 
    cons: '',
    images: []
});

const getFilenameFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  return parts.pop();
};
const previewImage = (url) => { if (url) fullscreenImage.value = url; };

const isSameCity = (city1) => {
    if (!city1 || !appStore.city) return false;
    return city1.trim().toLowerCase() === appStore.city.trim().toLowerCase();
};

const formattedSpecs = computed(() => {
  if (!product.value?.description) return [];
  return product.value.description.split(/\.(?!\d)/)
    .map(s => s.trim()).filter(s => s.includes(':'))
    .map(s => { const [key, val] = s.split(':'); return { key: key.trim(), value: val.trim() }; });
});

const localStocks = computed(() => {
    if (!product.value?.product_stocks) return [];
    return product.value.product_stocks.filter(s => isSameCity(s.warehouses?.city_name) && s.quantity > 0);
});

const totalLocalStock = computed(() => localStocks.value.reduce((sum, s) => sum + s.quantity, 0));

const groupedOtherCityStocks = computed(() => {
    if (!product.value?.product_stocks) return [];
    const rawStocks = product.value.product_stocks.filter(s => !isSameCity(s.warehouses?.city_name) && s.quantity > 0);
    const groups = {};
    rawStocks.forEach(s => {
        const c = s.warehouses?.city_name || 'Неизвестный город';
        groups[c] = (groups[c] || 0) + s.quantity;
    });
    return Object.keys(groups).map(city => ({ city, total: groups[city] })).sort((a, b) => b.total - a.total);
});

const totalStockCount = computed(() => product.value?.product_stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0);
const isFavorite = computed(() => wishlistId.value !== null);

const loadData = async () => {
  const pId = route.params.id;
  const uId = currentUserId.value;

  try {
    const pRes = await axios.get(`/api/products/${pId}`);
    product.value = pRes.data;
    saveToHistory(pId);

    const rRes = await axios.get(`/api/reviews/${pId}`);
    reviews.value = rRes.data.map(r => ({ ...r, images: Array.isArray(r.images) ? r.images : [] }));

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
      window.dispatchEvent(new Event('wishlist-updated'));
  } catch (e) { console.error(e); }
};

const prepareCreate = () => {
    isEditing.value = false;
    Object.assign(newReview, { id: null, rating: 5, comment: '', pros: '', cons: '', images: [] });
    showReviewForm.value = true;
};

const prepareEdit = (review) => {
    isEditing.value = true;
    Object.assign(newReview, { 
        id: review.id, 
        rating: review.rating, 
        comment: review.comment, 
        pros: review.pros, 
        cons: review.cons,
        images: [...(review.images || [])] 
    });
    showReviewForm.value = true;
};

const cancelReviewForm = () => {
    showReviewForm.value = false;
};

const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    isUploadingPhoto.value = true;

    try {
        const res = await axios.post('/api/upload/reviews', formData, uploadConfig);
        newReview.images.push(res.data.url);
    } catch (e) {
        alert('Ошибка при загрузке фото');
    } finally {
        isUploadingPhoto.value = false;
    }
};

const removePhotoFromForm = async (index) => {
    const url = newReview.images[index];
    if (!confirm('Удалить это фото?')) return;
    
    newReview.images.splice(index, 1);
    
    const filename = getFilenameFromUrl(url);
    if (filename) {
        await axios.delete(`/api/storage/reviews/${filename}`, uploadConfig).catch(()=>{});
    }
};

const submitReview = async () => {
    if (!newReview.comment.trim()) return alert("Напишите комментарий");
    submittingReview.value = true;
    
    try {
        // Собираем только те данные, которые есть в колонках таблицы
        const reviewData = {
            product_id: product.value.id,
            user_id: currentUserId.value,
            rating: newReview.rating,
            comment: newReview.comment,
            pros: newReview.pros,
            cons: newReview.cons,
            images: newReview.images
        };

        if (isEditing.value) {
            // Если редактируем — отправляем PATCH по ID
            await axios.patch(`/api/reviews/${newReview.id}`, reviewData);
            alert("Отзыв обновлен!");
        } else {
            // Если новый — отправляем POST БЕЗ поля ID
            await axios.post('/api/reviews', reviewData);
            alert("Спасибо за отзыв!");
        }
        
        showReviewForm.value = false;
        await loadData(); // Обновляем список отзывов
    } catch (e) { 
        console.error("Ошибка при отправке:", e.response?.data || e.message);
        alert("Ошибка: " + (e.response?.data?.error || "не удалось сохранить отзыв")); 
    } finally { 
        submittingReview.value = false; 
    }
};

const deleteMyReview = async (review) => {
    if (!confirm('Вы уверены, что хотите удалить свой отзыв навсегда?')) return;

    try {
        if (review.images && review.images.length > 0) {
            for (const url of review.images) {
                const fname = getFilenameFromUrl(url);
                await axios.delete(`/api/storage/reviews/${fname}`, uploadConfig).catch(()=>{});
            }
        }
        await axios.delete(`/api/admin/reviews/${review.id}`, uploadConfig);
        reviews.value = reviews.value.filter(r => r.id !== review.id);
        userExistingReview.value = null;
        alert('Отзыв удален');
    } catch (e) {
        alert('Ошибка при удалении отзыва');
    }
};

onMounted(loadData);
watch(() => route.params.id, (newId) => { if(newId) loadData(); });
</script>

<style scoped>


@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(25px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.product-detail-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 24px;
  animation: fadeSlideUp 0.6s ease-out;
  color: var(--text-main);
}

.product-main-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 32px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.product-core-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr 0.8fr;
  gap: 32px;
  align-items: flex-start;
}

/* ОБЩИЙ СТЕКЛЯННЫЙ СТИЛЬ ДЛЯ КАРТОЧЕК */
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s, box-shadow 0.3s;
}

.glass-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* ГАЛЕРЕЯ (ЛЕВАЯ КОЛОНКА) */
.product-gallery .image-card {
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  position: relative;
}

.main-image {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}

.image-card:hover .main-image {
  transform: scale(1.05);
}

/* УВЕЛИЧЕННОЕ СЕРДЕЧКО ИЗБРАННОГО */
.wishlist-float-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-card);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-bounce);
  color: var(--text-muted);
  z-index: 10;
  box-shadow: var(--shadow-sm);
}

.wishlist-float-btn:hover {
  transform: scale(1.15) rotate(5deg);
  background: var(--danger-light);
  color: var(--danger);
}

.wishlist-float-btn.is-active {
  color: var(--danger);
  border-color: var(--danger);
  background: var(--danger-light);
}

/* БЛОК ХАРАКТЕРИСТИК */
.brand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.sku-badge {
  background: var(--bg-input);
  padding: 6px 14px;
  border-radius: 40px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.brand-mini-logo {
  height: 40px;
  object-fit: contain;
  background: #fff;
  padding: 4px 8px;
  border-radius: 8px;
}

.specs-section,
.stock-section {
  padding: 24px;
  margin-bottom: 28px;
}

.specs-section h3,
.stock-section h3 {
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 16px;
}

.specs-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.specs-list li {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
}

.specs-list li:last-child {
  border-bottom: none;
}

.specs-list span {
  color: var(--text-muted);
  font-weight: 500;
}

/* НАЛИЧИЕ */
.city-stock-card {
  background: var(--success-light);
  border: 1px solid var(--success);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-top: 16px;
}

.city-header {
  padding: 12px 16px;
  background: rgba(16, 185, 129, 0.1);
  font-weight: 800;
  color: var(--success);
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
}

.stock-table td {
  padding: 12px 16px;
  border-top: 1px solid rgba(16, 185, 129, 0.15);
  font-size: 0.9rem;
}

.qty-cell {
  text-align: right;
  font-weight: 700;
  color: var(--success);
}

.stock-alert {
  padding: 14px;
  background: var(--warning-light);
  border-radius: var(--radius-md);
  color: var(--warning);
  font-weight: 600;
  margin-top: 16px;
}

.btn-outline-small {
  margin-top: 16px;
  padding: 8px 18px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 40px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition);
}

.btn-outline-small:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
  transform: translateY(-2px);
}

.other-cities-list {
  margin-top: 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* ПРАВАЯ КОЛОНКА – ПОКУПКА */
.product-buy-card {
  padding: 28px;
  position: sticky;
  top: 100px;
}

.price-container {
  margin-bottom: 20px;
}

.new-price {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary);
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.old-price {
  font-size: 1rem;
  text-decoration: line-through;
  color: var(--text-muted);
  margin-right: 12px;
}

.delivery-hint {
  margin: 20px 0;
  font-weight: 700;
}

.status-ok {
  color: var(--success);
}

.status-wait {
  color: var(--warning);
}

.main-cart-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--success), var(--success-hover));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  transition: var(--transition-bounce);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

.main-cart-btn:hover:not(.disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(16, 185, 129, 0.4);
}

.main-cart-btn.disabled {
  background: var(--border-color);
  color: var(--text-muted);
  cursor: not-allowed;
  box-shadow: none;
}

.trust-icons {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* СЕКЦИЯ ОТЗЫВОВ */
.reviews-section {
  margin-top: 60px;
  border-top: 2px solid var(--border-color);
  padding-top: 48px;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 32px;
}

.reviews-header h2 {
  font-size: 1.8rem;
  font-weight: 800;
}

.reviews-count-badge {
  background: var(--primary-light);
  color: var(--primary);
  padding: 4px 12px;
  border-radius: 40px;
  font-size: 1rem;
  font-weight: 800;
  margin-left: 12px;
}

.btn-write-review {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 40px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-bounce);
  box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
}

.btn-write-review:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(230, 57, 70, 0.4);
}

/* ФОРМА ОТЗЫВА */
.review-form-card {
  padding: 28px;
  margin-bottom: 40px;
}

.review-form-card h3 {
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 20px;
}

.rating-picker {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.stars button {
  font-size: 2rem;
  background: none;
  border: none;
  color: #e2e8f0;
  cursor: pointer;
  transition: transform 0.2s;
}

.stars button.active {
  color: #f1c40f;
}

.stars button:hover {
  transform: scale(1.1);
}

.review-inputs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  font-family: inherit;
  transition: var(--transition);
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
  outline: none;
}

.client-photo-upload-zone {
  margin-top: 20px;
  padding: 16px;
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-input);
}

.upload-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.images-preview-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.client-img-item {
  position: relative;
  width: 70px;
  height: 70px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: #fff;
}

.client-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;
}

.client-preview-img:hover {
  transform: scale(1.05);
}

.client-remove-img-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
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
}

.client-upload-btn {
  width: 70px;
  height: 70px;
  border: 2px dashed var(--border-color);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-card);
}

.client-upload-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}

.loader-mini {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}

.btn-submit-review {
  background: linear-gradient(135deg, var(--success), var(--success-hover));
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 40px;
  font-weight: 800;
  cursor: pointer;
  transition: var(--transition-bounce);
}

.btn-submit-review:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--border-color);
  padding: 12px 28px;
  border-radius: 40px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
}

.btn-cancel:hover {
  background: var(--danger-light);
  color: var(--danger);
  border-color: var(--danger);
}

/* СПИСОК ОТЗЫВОВ */
.review-item {
  padding: 24px;
  margin-bottom: 24px;
  position: relative;
}

.review-item.is-mine {
  border-left: 4px solid var(--primary);
  background: linear-gradient(145deg, var(--bg-card), var(--bg-input));
}

.my-review-actions {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 5;
}

.btn-action {
  background: none;
  border: none;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 30px;
  transition: all 0.2s;
}

.btn-action.edit {
  color: var(--primary);
}

.btn-action.edit:hover {
  background: var(--primary-light);
  transform: translateY(-2px);
}

.btn-action.delete {
  color: var(--danger);
}

.btn-action.delete:hover {
  background: var(--danger-light);
  transform: translateY(-2px);
}

.review-user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.review-user-info img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-light);
}

.u-meta strong {
  font-size: 1rem;
  display: block;
}

.you-tag {
  color: var(--primary);
  font-size: 0.7rem;
  font-weight: 700;
  margin-left: 6px;
}

.user-stars {
  color: #f1c40f;
  font-size: 0.9rem;
}

.empty-star {
  color: #e2e8f0;
}

.review-date {
  color: var(--text-muted);
  font-size: 0.75rem;
  margin-left: auto;
}

.review-text {
  line-height: 1.6;
  margin-bottom: 12px;
}

.pros-cons {
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.pros {
  color: var(--success);
  margin-bottom: 4px;
}

.cons {
  color: var(--danger);
}

.review-gallery {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.gallery-thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.gallery-thumb:hover {
  transform: scale(1.05);
  border-color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.no-reviews {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}

/* ЛОАДЕР */
.product-loader {
  text-align: center;
  padding: 100px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid var(--primary-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20px;
}

/* ФУЛЛСКРИН ПРОСМОТР ФОТО */
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg-overlay);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  cursor: zoom-out;
}

.fullscreen-img {
  max-width: 90%;
  max-height: 90vh;
  border-radius: var(--radius-lg);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  border: 3px solid white;
}

.fullscreen-close {
  position: absolute;
  top: 20px;
  right: 30px;
  background: none;
  border: none;
  color: white;
  font-size: 2.5rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.fullscreen-close:hover {
  transform: scale(1.1);
  color: var(--danger);
}

/* АНИМАЦИИ */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s;
  overflow: hidden;
}
.slide-enter-from, .slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* АДАПТИВНОСТЬ */
@media (max-width: 1200px) {
  .product-core-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 992px) {
  .product-core-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .product-buy-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .product-detail-page {
    padding: 24px 16px;
  }
  .product-main-title {
    font-size: 1.8rem;
  }
  .review-inputs-grid {
    grid-template-columns: 1fr;
  }
  .my-review-actions {
    position: static;
    justify-content: flex-end;
    margin-bottom: 16px;
  }
  .review-user-info {
    flex-wrap: wrap;
  }
  .review-date {
    margin-left: 0;
  }
  .wishlist-float-btn {
    width: 48px;
    height: 48px;
    font-size: 1.6rem;
  }
}

/* ТЁМНАЯ ТЕМА – ДОПОЛНИТЕЛЬНЫЕ ПРАВКИ */
body.dark-theme .glass-card {
  background: rgba(30, 41, 59, 0.95);
}
body.dark-theme .client-img-item {
  background: #1e293b;
}
body.dark-theme .brand-mini-logo {
  background: #1e293b;
}
</style>