<template>
  <div v-if="product" class="product-detail-page">
    
    <h1>{{ product.name }}</h1>

    <div style="display: flex; gap: 40px; align-items: flex-start;">
      
      <!-- ФОТО -->
      <div style="flex: 1; border: 1px solid #eee; padding: 20px; text-align: center; position: relative; background: white; border-radius: 12px;">
        <button @click="toggleWishlist" style="position: absolute; top: 15px; right: 15px; background: white; border: 1px solid #ddd; border-radius: 50%; width: 45px; height: 45px; cursor: pointer; font-size: 22px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
          <span :style="{ color: isFavorite ? 'red' : '#ccc' }">❤</span>
        </button>
        <img :src="product.image_url" style="max-width: 100%; max-height: 450px; object-fit: contain;" />
      </div>

      <!-- ХАРАКТЕРИСТИКИ И НАЛИЧИЕ -->
      <div style="flex: 1.5;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <p>Артикул: <b>{{ product.sku }}</b></p>
          <img :src="product.brands?.logo_url" width="80" v-if="product.brands?.logo_url" />
        </div>
        
        <hr />
        <h3>Характеристики</h3>
        <ul style="list-style: none; padding: 20px; background: #f9f9f9; border-radius: 8px; line-height: 2;">
          <li>📦 <b>Вес:</b> {{ product.weight_kg }} кг</li>
          <li>🛡️ <b>Гарантия:</b> {{ product.warranty_months }} месяцев</li>
          <li>🌍 <b>Страна бренда:</b> {{ product.brands?.country }}</li>
          <li v-for="(spec, idx) in formattedSpecs" :key="idx">
             <b>{{ spec.key }}:</b> {{ spec.value }}
          </li>
        </ul>

        <!-- БЛОК НАЛИЧИЯ -->
        <h3 style="margin-top: 30px;">Наличие в магазинах ApexDrive</h3>
        
        <div v-if="localStocks.length > 0" style="margin-bottom: 20px; border: 2px solid #27ae60; border-radius: 8px; overflow: hidden;">
          <div style="background: #e9f7ef; padding: 10px 15px; border-bottom: 1px solid #27ae60; font-weight: bold; color: #1e8449;">
             📍 В вашем городе ({{ appStore.city }}): {{ totalLocalStock }} шт.
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              <tr v-for="stock in localStocks" :key="stock.id" style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px;"><b>{{ stock.warehouses?.address }}</b></td>
                <td style="padding: 12px; text-align: right; color: #27ae60;"><b>{{ stock.quantity }} шт.</b></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; border: 1px solid #ffeeba; margin-bottom: 20px;">
           ⚠️ В вашем городе ({{ appStore.city }}) товара нет в наличии.
           <br>
           Но вы можете заказать доставку из других городов (Межгород).
        </div>

        <div v-if="groupedOtherCityStocks.length > 0">
           <button @click="showOtherCities = !showOtherCities" style="background: none; border: 1px solid #ccc; padding: 8px 15px; border-radius: 20px; cursor: pointer; color: #555; font-size: 0.9em;">
             {{ showOtherCities ? 'Скрыть другие города' : `Показать наличие в других городах (${groupedOtherCityStocks.length})` }}
           </button>

           <div v-if="showOtherCities" style="margin-top: 15px; border: 1px solid #eee; border-radius: 8px; max-height: 200px; overflow-y: auto;">
             <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f9f9f9; font-size: 0.85em; color: #666;">
                    <tr>
                        <th style="padding: 8px; text-align: left;">Город</th>
                        <th style="padding: 8px; text-align: right;">Общее количество</th>
                    </tr>
                </thead>
                <tbody>
                  <tr v-for="cityInfo in groupedOtherCityStocks" :key="cityInfo.city" style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">{{ cityInfo.city }}</td>
                    <td style="padding: 10px; text-align: right;"><b>{{ cityInfo.total }} шт.</b></td>
                  </tr>
                </tbody>
             </table>
           </div>
        </div>
      </div>

      <!-- БЛОК ЗАКАЗА -->
      <div style="flex: 1; border: 2px solid #eee; padding: 25px; border-radius: 12px; background: white; position: sticky; top: 20px;">
        <div v-if="product.discount_price">
          <s style="color: #999;">{{ product.price }} ₽</s>
          <h2 style="color: #e74c3c; margin: 5px 0; font-size: 2.5em;">{{ product.discount_price }} ₽</h2>
        </div>
        <h2 v-else style="margin: 5px 0; font-size: 2.5em;">{{ product.price }} ₽</h2>

        <div style="margin: 20px 0;">
            <p v-if="totalLocalStock > 0" style="color: #27ae60; font-weight: bold; font-size: 1.1em;">
                ✅ В наличии в г. {{ appStore.city }}
            </p>
            <p v-else style="color: #e67e22; font-weight: bold; font-size: 1.1em;">
                🚢 Под заказ (Межгород)
            </p>
        </div>

        <button 
          @click="handleAddToCart" 
          :disabled="totalStockCount === 0" 
          :style="{ background: totalStockCount > 0 ? '#27ae60' : '#ccc', cursor: totalStockCount > 0 ? 'pointer' : 'not-allowed' }"
          style="width: 100%; padding: 18px; color: white; border: none; font-weight: bold; border-radius: 8px; font-size: 1.2em;"
        >
          {{ totalStockCount > 0 ? 'В корзину' : 'Нет в наличии' }}
        </button>

        <div style="margin-top: 25px; font-size: 0.85em; color: #555;">
          <p>📍 Получение: <b>Только ПВЗ</b></p>
          <p>💰 Доставка: <b>{{ totalLocalStock > 0 ? 'Бесплатно между ПВЗ в вашем городе' : 'От 800₽ (Межгород)' }}</b></p>
        </div>
      </div>
    </div>

    <!-- ОТЗЫВЫ -->
    <section style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 40px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <h2>Отзывы покупателей ({{ reviews.length }})</h2>
        
        <!-- Кнопка оставить отзыв (если купил и еще не оставлял) -->
        <button v-if="canUserLeaveReview && !userExistingReview && !showReviewForm" 
                @click="prepareCreate" 
                style="padding: 12px 25px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">
          Написать отзыв
        </button>
      </div>

      <!-- ФОРМА ОТЗЫВА -->
      <div v-if="showReviewForm" style="background: #f8fafc; padding: 25px; border-radius: 16px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0;">{{ isEditing ? 'Редактирование вашего отзыва' : 'Новый отзыв о товаре' }}</h3>
        
        <div style="margin: 20px 0;">
            <label style="font-weight: bold; display: block; margin-bottom: 10px;">Ваша оценка:</label>
            <div style="display: flex; gap: 8px;">
                <button v-for="n in 5" :key="n" @click="newReview.rating = n" 
                        :style="{ color: n <= newReview.rating ? '#f1c40f' : '#cbd5e1' }"
                        style="background: none; border: none; font-size: 32px; cursor: pointer; padding: 0;">
                    {{ n <= newReview.rating ? '★' : '☆' }}
                </button>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <input v-model="newReview.pros" placeholder="Достоинства" style="padding: 12px; border-radius: 8px; border: 1px solid #ddd;" />
            <input v-model="newReview.cons" placeholder="Недостатки" style="padding: 12px; border-radius: 8px; border: 1px solid #ddd;" />
        </div>

        <textarea v-model="newReview.comment" placeholder="Ваш комментарий..." rows="4" 
                  style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;"></textarea>
        
        <div style="display: flex; gap: 10px;">
            <button @click="submitReview" :disabled="submittingReview" 
                    style="padding: 12px 30px; background: #27ae60; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
                {{ submittingReview ? 'Сохранение...' : 'Сохранить' }}
            </button>
            <button @click="showReviewForm = false" style="padding: 12px 30px; background: #eee; border: none; border-radius: 10px; cursor: pointer;">Отмена</button>
        </div>
      </div>

      <!-- СПИСОК ОТЗЫВОВ -->
      <div v-if="reviews.length > 0">
        <div v-for="review in reviews" :key="review.id" 
             :style="review.user_id == currentUserId ? { border: '2px solid #4f46e5' } : {}"
             style="background: white; border: 1px solid #f1f5f9; border-radius: 16px; padding: 25px; margin-bottom: 20px; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          
          <!-- Редактирование своего отзыва -->
          <button v-if="review.user_id == currentUserId" 
                  @click="prepareEdit(review)" 
                  style="position: absolute; top: 20px; right: 20px; color: #4f46e5; background: #eef2ff; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">
            ✎ Редактировать
          </button>

          <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
             <img :src="review.users?.avatar_url || '/assets/images/avatars/1.png'" @error="$event.target.src = '/assets/images/avatars/1.png'" width="45" height="45" style="border-radius: 50%; object-fit: cover;" />
             <div>
               <strong style="font-size: 1.1rem; color: #1e293b;">{{ review.users?.first_name || 'Покупатель' }} {{ review.user_id == currentUserId ? '(Вы)' : '' }}</strong>
               <div style="color: #f1c40f; font-size: 0.9rem;">
                 {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
               </div>
             </div>
             <span style="color: #94a3b8; font-size: 0.85rem; margin-left: auto;">
                {{ review.created_at ? new Date(review.created_at).toLocaleDateString('ru-RU') : 'Недавно' }}
             </span>
          </div>
          
          <div style="margin-bottom: 15px; color: #334155; line-height: 1.6;">{{ review.comment }}</div>
          <div v-if="review.pros" style="font-size: 0.9rem; margin-bottom: 5px;"><b style="color: #10b981;">+</b> {{ review.pros }}</div>
          <div v-if="review.cons" style="font-size: 0.9rem;"><b style="color: #ef4444;">−</b> {{ review.cons }}</div>
        </div>
      </div>
      <div v-else style="text-align: center; color: #94a3b8; padding: 40px 0;">Отзывов еще нет. Будьте первым!</div>
    </section>
  </div>
  <div v-else style="text-align: center; padding: 100px;">
    <h2>Загрузка товара...</h2>
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

// Состояние отзывов
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

// МЕТОДЫ ОТЗЫВОВ
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