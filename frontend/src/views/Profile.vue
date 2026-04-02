<template>
  <div class="profile-container">
    <!-- 1. ШАПКА ПРОФИЛЯ -->
    <section v-if="user" class="profile-header">
      <div class="profile-user-info">
        <img :src="user.avatar_url || '/assets/images/avatars/1.png'" class="profile-avatar" />
        <div>
          <h1 class="profile-title">Личный кабинет</h1>
          <p class="profile-welcome">Добро пожаловать, <strong>{{ user.first_name }}</strong>!</p>
        </div>
      </div>
      <div class="profile-since-badge">
        📅 На сайте с 01.03.2024
      </div>
    </section>
    <div v-else class="profile-loading">Загрузка данных профиля...</div>

    <hr class="profile-divider" />

    <!-- 2. БЛОК СТАТИСТИКИ -->
    <section class="stats-grid">
      <div class="stat-card">
        <small class="stat-label">ЗАКАЗОВ</small>
        <h2 class="stat-value">{{ Array.isArray(orders) ? orders.length : 0 }}</h2>
      </div>
      <div class="stat-card">
        <small class="stat-label">ТРАТЫ</small>
        <h2 class="stat-value">{{ totalSpent }} ₽</h2>
      </div>
      <div class="stat-card">
        <small class="stat-label">ИЗБРАННОЕ</small>
        <h2 class="stat-value">{{ wishlistCount }}</h2>
        <router-link to="/wishlist" class="stat-link">Перейти →</router-link>
      </div>
    </section>

    <!-- 3. КНОПКИ ДЕЙСТВИЙ -->
    <section class="action-buttons">
      <router-link to="/settings" class="action-btn settings-btn">⚙️ Настройки</router-link>
      <router-link to="/catalog" class="action-btn catalog-btn">🛒 В каталог</router-link>
    </section>

    <!-- 4. СОХРАНЕННЫЕ КАРТЫ -->
    <section class="cards-section">
      <div class="cards-header">
        <h3 class="cards-title">💳 Мои способы оплаты</h3>
        <button @click="isAddCardModalOpen = true" class="add-card-btn">+ Добавить карту</button>
      </div>

      <div v-if="loadingCards" class="cards-loading">Загрузка карт...</div>
      <div v-else-if="cards.length > 0" class="cards-grid">
        <div v-for="card in cards" :key="card.id" class="card-item">
          <div class="card-header">
            <span class="card-brand">{{ card.brand }}</span>
            <button @click="removeCard(card.id)" class="card-remove-btn">&times;</button>
          </div>
          <div class="card-number">{{ card.card_number_masked }}</div>
          <div class="card-footer">
            <span>{{ card.card_holder }}</span>
            <span>{{ card.expiry_date }}</span>
          </div>
          <div v-if="card.is_default" class="card-default-badge">● ИСПОЛЬЗУЕТСЯ ПО УМОЛЧАНИЮ</div>
        </div>
      </div>
      <div v-else class="cards-empty">У вас нет сохраненных карт.</div>
    </section>

    <!-- 5. ОСНОВНОЙ КОНТЕНТ: ЗАКАЗЫ + НЕДАВНО ПРОСМОТРЕННЫЕ -->
    <div class="profile-content">
      <!-- ЗАКАЗЫ -->
      <div class="orders-section">
        <div class="orders-header">
          <h3 class="orders-title">📦 Последние заказы</h3>
          <router-link to="/orders" class="orders-link">Все заказы →</router-link>
        </div>

        <div v-if="loadingOrders" class="orders-loading">Загрузка заказов...</div>
        <div v-else-if="Array.isArray(orders) && orders.length > 0" class="orders-list">
          <div v-for="o in orders.slice(0, 6)" :key="o.id" class="order-card">
            <div class="order-header">
              <div class="order-info">
                <strong class="order-number">Заказ №{{ o.id }}</strong>
                <div class="order-date">от {{ formatDate(o.created_at) }}</div>
                <div class="order-address">
                  <span>📍</span>
                  <span>{{ o.delivery_address || 'Адрес не указан' }}</span>
                </div>
              </div>
              <div class="order-statuses">
                <span :style="getDeliveryStatusStyle(o.delivery_status)" class="status-badge">
                  {{ translateDelivery(o.delivery_status) }}
                </span>
                <span :style="getPaymentStatusStyle(o.payment_status)" class="payment-badge">
                  {{ translatePayment(o.payment_status) }}
                </span>
              </div>
            </div>

            <div class="order-items">
              <div v-for="item in o.order_items" :key="item.id" class="order-item">
                <router-link :to="'/product/' + item.product_id" class="order-item-img-link">
                  <img :src="item.products?.image_url" class="order-item-img" />
                  <span v-if="item.quantity > 1" class="order-item-qty">x{{ item.quantity }}</span>
                </router-link>
                <div class="order-item-details">
                  <router-link :to="'/product/' + item.product_id" class="order-item-name">
                    {{ item.products?.name || 'Товар недоступен' }}
                  </router-link>
                  <div class="order-item-price">{{ item.quantity }} шт. × {{ item.unit_price }} ₽</div>
                </div>
              </div>
            </div>

            <div class="order-total">
              Итого: {{ o.total_price }} ₽
            </div>
          </div>
        </div>
        <div v-else class="orders-empty">Заказов пока нет</div>
      </div>

      <!-- НЕДАВНО ПРОСМОТРЕННЫЕ -->
      <div class="recent-section">
        <h3 class="recent-title">👁️ Недавно смотрели ({{ recentProducts.length }})</h3>
        <div class="recent-list">
          <div v-if="recentProducts.length > 0">
            <div v-for="p in recentProducts" :key="p.id" class="recent-item">
              <img :src="p.image_url" class="recent-img" />
              <div class="recent-info">
                <router-link :to="'/product/' + p.id" class="recent-name">
                  {{ p.name }}
                </router-link>
                <div class="recent-price">{{ p.discount_price || p.price }} ₽</div>
              </div>
              <button @click="removeFromRecent(p.id)" class="recent-remove">&times;</button>
            </div>
          </div>
          <div v-else class="recent-empty">История пуста</div>
        </div>
      </div>
    </div>

    <!-- МОДАЛКА ДОБАВЛЕНИЯ КАРТЫ -->
    <div v-if="isAddCardModalOpen" class="modal-overlay" @click.self="isAddCardModalOpen = false">
      <div class="modal-container">
        <h3 class="modal-title">Добавить новую карту</h3>
        <div class="modal-form">
          <input v-model="newCard.number" placeholder="Номер карты" maxlength="16" class="modal-input" />
          <input v-model="newCard.holder" placeholder="Имя владельца (IVAN IVANOV)" class="modal-input" style="text-transform: uppercase;" />
          <input v-model="newCard.expiry" placeholder="ММ/ГГ" maxlength="5" class="modal-input" />
        </div>
        <div class="modal-actions">
          <button @click="saveCard" class="modal-save-btn">Сохранить</button>
          <button @click="isAddCardModalOpen = false" class="modal-cancel-btn">Отмена</button>
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
const getDeliveryStatusStyle = (s) => ({ 
  'created': { backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' },
  'shipping': { backgroundColor: 'var(--warning-light)', color: 'var(--warning)' },
  'awaiting': { backgroundColor: 'var(--primary-light)', color: 'var(--primary)' },
  'delivered': { backgroundColor: 'var(--success-light)', color: 'var(--success)' }
}[s] || { backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' });

const translatePayment = (s) => ({ 'paid': 'Оплачен', 'awaiting_payment': 'При получении', 'unpaid': 'Не оплачен' }[s] || 'Неизвестно');
const getPaymentStatusStyle = (s) => ({ 
  'paid': { color: 'var(--success)', borderColor: 'var(--success-light)' },
  'awaiting_payment': { color: 'var(--primary)', borderColor: 'var(--primary-light)' },
  'unpaid': { color: 'var(--danger)', borderColor: 'var(--danger-light)' }
}[s] || { color: 'var(--text-muted)' });

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

.profile-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 24px;
  animation: fadeSlideUp 0.6s ease-out;
}

/* ШАПКА ПРОФИЛЯ */
.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  background: var(--bg-card);
  backdrop-filter: blur(4px);
  padding: 24px 32px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  margin-bottom: 30px;
  transition: var(--transition);
}

.profile-user-info {
  display: flex;
  align-items: center;
  gap: 24px;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--primary);
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s;
}

.profile-avatar:hover {
  transform: scale(1.02);
}

.profile-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.profile-welcome {
  font-size: 1.1rem;
  margin: 0;
  color: var(--text-muted);
}

.profile-since-badge {
  background: var(--warning-light);
  padding: 12px 24px;
  border-radius: var(--radius-md);
  border: 1px solid var(--warning-light);
  font-weight: 600;
  color: var(--warning);
  font-size: 0.9rem;
}

.profile-divider {
  margin: 30px 0;
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), var(--accent), transparent);
}

.profile-loading {
  text-align: center;
  padding: 60px;
  color: var(--text-muted);
  font-size: 1.1rem;
}

/* СТАТИСТИКА */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 40px;
}

.stat-card {
  background: var(--bg-card);
  backdrop-filter: blur(4px);
  padding: 24px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  text-align: center;
  transition: var(--transition-bounce);
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-light);
}

.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 800;
  color: var(--text-muted);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 12px 0 8px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-link {
  font-size: 0.85rem;
  color: var(--primary);
  text-decoration: none;
  transition: var(--transition);
}

.stat-link:hover {
  text-decoration: underline;
  transform: translateX(3px);
}

/* КНОПКИ ДЕЙСТВИЙ */
.action-buttons {
  display: flex;
  gap: 16px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 28px;
  border-radius: var(--radius-md);
  font-weight: 700;
  text-decoration: none;
  transition: var(--transition-bounce);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.settings-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-main);
}

.settings-btn:hover {
  background: var(--primary-light);
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.catalog-btn {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  box-shadow: 0 8px 16px rgba(230, 57, 70, 0.25);
}

.catalog-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(230, 57, 70, 0.35);
}

/* КАРТЫ ОПЛАТЫ */
.cards-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  padding: 28px;
  margin-bottom: 40px;
  transition: var(--transition);
}

.cards-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.cards-title {
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0;
  color: var(--text-main);
}

.add-card-btn {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-bounce);
}

.add-card-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--primary-glow);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.card-item {
  background: linear-gradient(135deg, var(--bg-card), var(--bg-input));
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
  transition: var(--transition-bounce);
  position: relative;
  backdrop-filter: blur(4px);
}

.card-item:hover {
  transform: translateY(-4px);
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-brand {
  font-weight: 800;
  text-transform: uppercase;
  color: var(--primary);
  letter-spacing: 1px;
}

.card-remove-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--text-muted);
  transition: var(--transition);
}

.card-remove-btn:hover {
  color: var(--danger);
  transform: scale(1.1);
}

.card-number {
  font-family: 'Monaco', monospace;
  font-size: 1.1rem;
  letter-spacing: 2px;
  margin-bottom: 16px;
  font-weight: 600;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.card-default-badge {
  margin-top: 12px;
  font-size: 0.7rem;
  color: var(--success);
  font-weight: 800;
  letter-spacing: 0.5px;
}

.cards-loading, .cards-empty {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

/* ОСНОВНОЙ КОНТЕНТ (ЗАКАЗЫ + ИСТОРИЯ) */
.profile-content {
  display: flex;
  gap: 30px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.orders-section {
  flex: 2;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  padding: 24px;
  transition: var(--transition);
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.orders-title {
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0;
}

.orders-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  transition: var(--transition);
}

.orders-link:hover {
  text-decoration: underline;
  transform: translateX(3px);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.order-card {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 20px;
}

.order-card:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.order-number {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--primary);
}

.order-date {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 4px 0;
}

.order-address {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.order-statuses {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status-badge, .payment-badge {
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.payment-badge {
  border: 1px solid;
  background: transparent;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.order-item-img-link {
  position: relative;
  display: block;
}

.order-item-img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: #fff;
  padding: 4px;
  transition: transform 0.2s;
}

.order-item-img:hover {
  transform: scale(1.05);
}

.order-item-qty {
  position: absolute;
  bottom: -6px;
  right: -6px;
  background: var(--primary);
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 20px;
  font-weight: 800;
}

.order-item-details {
  flex: 1;
}

.order-item-name {
  font-weight: 600;
  text-decoration: none;
  color: var(--text-main);
  transition: color 0.2s;
}

.order-item-name:hover {
  color: var(--primary);
}

.order-item-price {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.order-total {
  text-align: right;
  font-weight: 800;
  font-size: 1.1rem;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);
}

.orders-loading, .orders-empty {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

/* НЕДАВНО ПРОСМОТРЕННЫЕ */
.recent-section {
  flex: 1;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  padding: 24px;
  position: sticky;
  top: 100px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.recent-title {
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0 0 20px 0;
  color: var(--text-main);
}

.recent-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  scrollbar-width: thin;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  transition: var(--transition);
}

.recent-item:hover {
  transform: translateX(4px);
}

.recent-img {
  width: 45px;
  height: 45px;
  object-fit: contain;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: #fff;
  padding: 3px;
}

.recent-info {
  flex: 1;
}

.recent-name {
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  color: var(--text-main);
  display: block;
  margin-bottom: 4px;
}

.recent-name:hover {
  color: var(--primary);
}

.recent-price {
  font-weight: 800;
  color: var(--primary);
  font-size: 0.9rem;
}

.recent-remove {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-muted);
  transition: var(--transition);
}

.recent-remove:hover {
  color: var(--danger);
  transform: scale(1.1);
}

.recent-empty {
  text-align: center;
  padding: 30px;
  color: var(--text-muted);
}

/* МОДАЛЬНОЕ ОКНО */
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

.modal-container {
  background: var(--bg-card);
  padding: 32px;
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 450px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 24px;
  color: var(--text-main);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 28px;
}

.modal-input {
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  transition: var(--transition);
  font-size: 1rem;
}

.modal-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
  outline: none;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-save-btn {
  flex: 2;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  padding: 12px;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-bounce);
}

.modal-save-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--primary-glow);
}

.modal-cancel-btn {
  flex: 1;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  padding: 12px;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.modal-cancel-btn:hover {
  background: var(--danger-light);
  border-color: var(--danger);
  color: var(--danger);
}

/* АДАПТИВНОСТЬ */
@media (max-width: 1024px) {
  .profile-content {
    flex-direction: column;
  }
  .recent-section {
    position: static;
    max-height: none;
  }
  .stats-grid {
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .profile-container {
    padding: 24px 16px;
  }
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  .profile-user-info {
    flex-direction: column;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .cards-grid {
    grid-template-columns: 1fr;
  }
  .order-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .order-statuses {
    align-items: flex-start;
  }
  .action-buttons {
    flex-direction: column;
  }
  .action-btn {
    justify-content: center;
  }
  .cards-header {
    flex-direction: column;
    align-items: stretch;
  }
  .add-card-btn {
    width: 100%;
  }
}
</style>