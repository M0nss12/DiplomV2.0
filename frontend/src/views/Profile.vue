<template>
  <div class="profile-container">
    
    <!-- 1. ШАПКА -->
    <section v-if="user" style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 20px;">
        <img :src="user.avatar_url || '/assets/images/avatars/1.png'" width="100" height="100" style="border-radius: 50%; object-fit: cover; border: 2px solid #ddd;" />
        <div>
          <h1>Личный кабинет</h1>
          <p style="font-size: 1.3em; margin: 0;">Добро пожаловать, <strong>{{ user.first_name }}</strong>!</p>
        </div>
      </div>
      <div style="background: #fff8e1; padding: 10px 20px; border-radius: 8px; border: 1px solid #ffe082;">
        📅 На сайте с 01.03.2024
      </div>
    </section>
    <div v-else style="padding: 20px; text-align: center;">Загрузка данных профиля...</div>

    <hr />

    <!-- 2. БЛОК СТАТИСТИКИ -->
    <section style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
      <div style="border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <small style="color: #888;">ЗАКАЗОВ</small>
        <h2>{{ Array.isArray(orders) ? orders.length : 0 }}</h2>
      </div>
      <div style="border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <small style="color: #888;">ТРАТЫ</small>
        <h2>{{ totalSpent }} ₽</h2>
      </div>
      <div style="border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <small style="color: #888;">ИЗБРАННОЕ</small>
        <h2>{{ wishlistCount }}</h2>
        <router-link to="/wishlist" style="font-size: 0.8em; color: blue;">Перейти →</router-link>
      </div>
    </section>

    <br />

    <!-- 3. КНОПКИ -->
    <section style="display: flex; gap: 10px;">
      <router-link to="/settings"><button style="padding: 10px 20px; cursor: pointer;">⚙️ Настройки</button></router-link>
      <router-link to="/catalog"><button style="padding: 10px 20px; cursor: pointer;">🛒 В каталог</button></router-link>
    </section>

    <br />

    <!-- БЛОК: СОХРАНЕННЫЕ КАРТЫ -->
    <section style="border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0;">💳 Мои способы оплаты</h3>
        <button @click="isAddCardModalOpen = true" style="padding: 5px 15px; background: #475be8; color: white; border: none; border-radius: 5px; cursor: pointer;">
          + Добавить карту
        </button>
      </div>
      
      <div v-if="loadingCards">Загрузка карт...</div>
      <div v-else-if="cards.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
        <div v-for="card in cards" :key="card.id" style="border: 2px solid #f1f5f9; padding: 20px; border-radius: 15px; position: relative; background: #fff;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <span style="font-weight: 800; text-transform: uppercase; color: #475be8;">{{ card.brand }}</span>
            <button @click="removeCard(card.id)" style="background: none; border: none; color: #ccc; cursor: pointer; font-size: 1.2rem;">&times;</button>
          </div>
          <div style="font-family: monospace; font-size: 1.2rem; letter-spacing: 2px; margin-bottom: 10px;">
            {{ card.card_number_masked }}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8;">
            <span>{{ card.card_holder }}</span>
            <span>{{ card.expiry_date }}</span>
          </div>
          <div v-if="card.is_default" style="margin-top: 10px; font-size: 10px; color: green; font-weight: bold;">● ИСПОЛЬЗУЕТСЯ ПО УМОЛЧАНИЮ</div>
        </div>
      </div>
      <div v-else style="color: #999; padding: 10px 0;">У вас нет сохраненных карт.</div>
    </section>

    <br />

    <!-- 4. НИЖНИЕ БЛОКИ -->
    <div style="display: flex; gap: 30px; align-items: flex-start;">
      
      <!-- ЗАКАЗЫ (Левая часть) -->
      <div style="flex: 2; border: 1px solid #eee; padding: 20px; border-radius: 10px; min-height: 400px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0;">📦 Последние заказы</h3>
          <router-link to="/orders" style="color: blue; font-size: 0.9em;">Все заказы →</router-link>
        </div>

        <div v-if="loadingOrders">Загрузка заказов...</div>
        <div v-else-if="Array.isArray(orders) && orders.length > 0">
          <!-- ОГРАНИЧЕНИЕ: .slice(0, 6) для показа только последних 6 заказов -->
          <div v-for="o in orders.slice(0, 6)" :key="o.id" style="padding: 20px 0; border-bottom: 1px solid #f5f5f5;">
             <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                    <strong style="font-size: 1.1em;">Заказ №{{ o.id }}</strong>
                    <div style="color: #888; font-size: 0.85em; margin-top: 4px;">от {{ formatDate(o.created_at) }}</div>
                    <div style="margin-top: 8px; font-size: 0.9em; color: #444; display: flex; align-items: flex-start; gap: 5px;">
                        <span>📍</span>
                        <span>{{ o.delivery_address || 'Адрес не указан' }}</span>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                    <span :style="getDeliveryStatusStyle(o.delivery_status)" style="padding: 4px 10px; border-radius: 4px; font-size: 0.85em; font-weight: bold;">
                        {{ translateDelivery(o.delivery_status) }}
                    </span>
                    <span :style="getPaymentStatusStyle(o.payment_status)" style="padding: 2px 8px; border-radius: 4px; font-size: 0.75em; border: 1px solid transparent;">
                        {{ translatePayment(o.payment_status) }}
                    </span>
                </div>
             </div>

             <!-- СПИСОК ТОВАРОВ В ЗАКАЗЕ -->
             <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
                <div v-for="item in o.order_items" :key="item.id" style="display: flex; align-items: center; gap: 15px;">
                    <!-- Переход к детальному просмотру через картинку -->
                    <router-link :to="'/product/' + item.product_id" style="position: relative; display: block;">
                        <img :src="item.products?.image_url" width="50" height="50" style="object-fit: contain; border: 1px solid #eee; border-radius: 6px; padding: 2px; background: white;" />
                        <span v-if="item.quantity > 1" style="position: absolute; bottom: -5px; right: -5px; background: #333; color: white; font-size: 10px; padding: 2px 5px; border-radius: 10px;">
                            x{{ item.quantity }}
                        </span>
                    </router-link>
                    
                    <div style="flex: 1;">
                        <!-- Название товара кликабельно -->
                        <router-link :to="'/product/' + item.product_id" style="text-decoration: none; color: #1e293b; font-weight: 500; font-size: 0.95em;">
                            {{ item.products?.name || 'Товар недоступен' }}
                        </router-link>
                        <div style="color: #888; font-size: 0.85em;">{{ item.quantity }} шт. × {{ item.unit_price }} ₽</div>
                    </div>
                </div>
             </div>

             <div style="margin-top: 15px; text-align: right; font-weight: bold; font-size: 1.1em; color: #1e293b; border-top: 1px dashed #eee; padding-top: 10px;">
                Итого: {{ o.total_price }} ₽
             </div>
          </div>
        </div>
        <div v-else style="padding: 20px; color: #999;">Заказов пока нет</div>
      </div>

      <!-- НЕДАВНО ПРОСМОТРЕННОЕ -->
      <div style="flex: 1; border: 1px solid #eee; padding: 20px; border-radius: 10px; max-height: 550px; display: flex; flex-direction: column;">
        <h3 style="margin: 0 0 15px 0;">👁️ Недавно смотрели ({{ recentProducts.length }})</h3>
        <div style="flex: 1; overflow-y: auto; padding-right: 10px;">
          <div v-if="recentProducts.length > 0">
            <div v-for="p in recentProducts" :key="p.id" style="display: flex; gap: 10px; margin-bottom: 15px; align-items: center; position: relative; border-bottom: 1px solid #fafafa; padding-bottom: 10px;">
              <img :src="p.image_url" width="45" height="45" style="object-fit: contain; border: 1px solid #eee; border-radius: 5px;" />
              <div style="font-size: 0.85em; flex: 1;">
                <router-link :to="'/product/' + p.id" style="text-decoration: none; color: black; font-weight: 500; display: block;">
                   {{ p.name }}
                </router-link>
                <div style="color: #e44d26; font-weight: bold;">{{ p.discount_price || p.price }} ₽</div>
              </div>
              <button @click="removeFromRecent(p.id)" style="border:none; background:none; cursor:pointer; color:#ccc; font-size: 1.2em;">&times;</button>
            </div>
          </div>
          <div v-else style="text-align: center; color: #999; padding: 20px;">История пуста</div>
        </div>
      </div>
    </div>

    <!-- МОДАЛКА ДОБАВЛЕНИЯ КАРТЫ -->
    <div v-if="isAddCardModalOpen" style="position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000;">
      <div style="background: white; padding: 30px; border-radius: 20px; width: 400px;">
        <h3>Добавить новую карту</h3>
        <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
          <input v-model="newCard.number" placeholder="Номер карты" maxlength="16" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
          <input v-model="newCard.holder" placeholder="Имя владельца (IVAN IVANOV)" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px; text-transform: uppercase;" />
          <input v-model="newCard.expiry" placeholder="ММ/ГГ" maxlength="5" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        </div>
        <div style="display: flex; gap: 10px; margin-top: 25px;">
          <button @click="saveCard" style="flex: 2; padding: 12px; background: #475be8; color: white; border: none; border-radius: 8px; cursor: pointer;">Сохранить</button>
          <button @click="isAddCardModalOpen = false" style="flex: 1; padding: 12px; background: #eee; border: none; border-radius: 8px; cursor: pointer;">Отмена</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import axios from 'axios';
import { supabase } from '@/supabase';

const user = ref(null);
const orders = ref([]);
const cards = ref([]);
const recentProducts = ref([]);
const wishlistCount = ref(0);
const loadingOrders = ref(true);
const loadingCards = ref(true);

const isAddCardModalOpen = ref(false);
const newCard = reactive({ number: '', holder: '', expiry: '' });

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
const translateDelivery = (s) => ({ 'created': 'Обработка', 'shipping': 'Доставляется', 'awaiting': 'Готов к выдаче', 'delivered': 'Получен' }[s] || 'В обработке');
const getDeliveryStatusStyle = (s) => ({ 'created': { backgroundColor: '#f0f0f0' }, 'shipping': { backgroundColor: '#fff3cd' }, 'awaiting': { backgroundColor: '#d1ecf1' }, 'delivered': { backgroundColor: '#d4edda' } }[s]);
const translatePayment = (s) => ({ 'paid': 'Оплачен', 'awaiting_payment': 'При получении', 'unpaid': 'Не оплачен' }[s] || 'Неизвестно');
const getPaymentStatusStyle = (s) => ({ 'paid': { color: '#27ae60' }, 'awaiting_payment': { color: '#2980b9' }, 'unpaid': { color: '#e74c3c' } }[s]);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '---';
const totalSpent = computed(() => Array.isArray(orders.value) ? orders.value.reduce((sum, o) => sum + Number(o.total_price || 0), 0) : 0);

// --- ЗАГРУЗКА ДАННЫХ ---
const loadData = async () => {
  const userId = localStorage.getItem('user_id');
  if (!userId) return;

  try {
    const uRes = await axios.get(`/api/users/profile/${userId}`);
    user.value = uRes.data;
  } catch (e) { console.error("Ошибка профиля"); }

  axios.get(`/api/orders/${userId}`).then(res => { orders.value = res.data; loadingOrders.value = false; });
  axios.get(`/api/cards/${userId}`).then(res => { cards.value = res.data; loadingCards.value = false; });
  axios.get(`/api/wishlist/${userId}`).then(res => wishlistCount.value = res.data.length);

  const savedIds = JSON.parse(localStorage.getItem('recent_views') || '[]');
  if (savedIds.length) {
    axios.post('/api/products/recent', { ids: savedIds.slice(0, 25) }).then(res => {
      const productsMap = new Map(res.data.map(p => [p.id, p]));
      recentProducts.value = savedIds.map(id => productsMap.get(id)).filter(p => p);
    });
  }
};

// --- ДЕЙСТВИЯ ---
const saveCard = async () => {
    if (newCard.number.length < 16) return alert("Введите номер карты");
    try {
        const userId = localStorage.getItem('user_id');
        const res = await axios.post('/api/cards', { user_id: userId, ...newCard });
        cards.value.push(res.data);
        isAddCardModalOpen.value = false;
        Object.assign(newCard, { number: '', holder: '', expiry: '' });
    } catch (e) { alert("Ошибка сохранения"); }
};

const removeCard = async (id) => {
    if (!confirm("Удалить?")) return;
    try {
        await axios.delete(`/api/cards/${id}`);
        cards.value = cards.value.filter(c => c.id !== id);
    } catch (e) { alert("Ошибка"); }
};

const removeFromRecent = (id) => {
  let ids = JSON.parse(localStorage.getItem('recent_views') || '[]');
  ids = ids.filter(i => i !== id);
  localStorage.setItem('recent_views', JSON.stringify(ids));
  recentProducts.value = recentProducts.value.filter(p => p.id !== id);
};

onMounted(async () => {
  // Логика синхронизации сессии Google
  const { data: { session } } = await supabase.auth.getSession();
  if (session && !localStorage.getItem('user_id')) {
    const sbUser = session.user;
    localStorage.setItem('user_id', sbUser.id);
    localStorage.setItem('user_name', sbUser.user_metadata.full_name || sbUser.email);
    localStorage.setItem('user_avatar', sbUser.user_metadata.avatar_url || '/assets/images/avatars/1.png');
    localStorage.setItem('role', 'user');
    window.location.reload();
  }
  loadData();
});
</script>