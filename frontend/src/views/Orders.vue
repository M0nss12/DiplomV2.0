<template>
  <div class="orders-page">
    <div class="header-section">
      <h1>📦 Мои заказы</h1>
      <router-link to="/profile" class="back-link">
        <span class="back-icon">←</span> Вернуться в профиль
      </router-link>
    </div>

    <!-- ТАБЫ (ФИЛЬТРЫ) -->
    <div class="status-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id" 
        @click="activeTab = tab.id" 
        :class="{ active: activeTab === tab.id }"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="loader-container">
      <div class="loader"></div>
      <p>Загружаем историю...</p>
    </div>

    <div v-else class="orders-list">
      <div v-if="filteredOrders.length === 0" class="empty-orders">
        <div class="empty-icon">📂</div>
        <p>Заказов в этой категории не найдено.</p>
      </div>

      <div v-for="order in filteredOrders" :key="order.id" class="order-card" :class="{ 'cancelled-order': order.delivery_status === 'cancelled' }">
        
        <div class="order-header">
          <div class="order-meta">
            <span class="order-number">Заказ №{{ order.id }}</span>
            <span class="order-date">от {{ formatDate(order.created_at) }}</span>
          </div>
          <div class="order-statuses">
            <span :style="getDeliveryStatusStyle(order.delivery_status)" class="badge">
              {{ translateDelivery(order.delivery_status) }}
            </span>
            <span :style="getPaymentStatusStyle(order.payment_status)" class="badge payment-badge">
              {{ translatePaymentStatus(order.payment_status) }}
            </span>
          </div>
        </div>

        <div class="order-delivery-info">
          <span class="pin-icon">📍</span> <b>Пункт выдачи:</b> {{ order.delivery_address }}
        </div>

        <!-- БЛОК УПРАВЛЕНИЯ ОПЛАТОЙ -->
        <div v-if="order.payment_status !== 'paid' && order.delivery_status !== 'cancelled'" class="management-box">
          <div class="info-row">
            <div class="method-select-group">
              <label>Способ оплаты:</label>
              <select :value="order.payment_method" @change="changePaymentMethod(order, $event.target.value)" class="modern-select">
                <option value="card_pickup">Картой при получении</option>
                <option value="cash">Наличными</option>
                <option value="card">Картой онлайн</option>
              </select>
            </div>
            
            <button v-if="order.payment_method === 'card'" @click="openPaymentModal(order)" class="pay-btn">
              💳 Оплатить {{ order.total_price }} ₽
            </button>
          </div>
        </div>

        <!-- СПИСОК ТОВАРОВ -->
        <div class="order-items">
            <div v-for="item in order.order_items" :key="item.id" class="item-row">
                <router-link :to="'/product/' + item.product_id" class="item-img-link">
                  <img :src="item.products?.image_url || '/assets/images/no-photo.png'" @error="$event.target.src = '/assets/images/no-photo.png'" />
                </router-link>

                <div class="item-info">
                    <router-link :to="'/product/' + item.product_id" class="item-name">
                      {{ item.products?.name || 'Товар удален' }}
                    </router-link>
                    <div class="item-details">{{ item.quantity }} шт. × {{ item.unit_price }} ₽</div>
                </div>

                <div class="item-price">{{ item.unit_price * item.quantity }} ₽</div>
            </div>
        </div>

        <div class="order-footer">
          <div class="total-sum">Итого: <strong>{{ order.total_price }} ₽</strong></div>
          <div class="footer-actions">
            <button @click="reorder(order)" class="reorder-btn">Повторить заказ</button>
            <button v-if="!['delivered', 'cancelled'].includes(order.delivery_status)" @click="cancelOrder(order)" class="cancel-order-btn">Отменить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 💳 МОДАЛКА ОПЛАТЫ -->
    <transition name="fade">
      <div v-if="showPaymentModal" class="modal-overlay" @click.self="showPaymentModal = false">
        <div class="modal-content card-shadow">
          
          <div v-if="paymentStep === 'form'" class="payment-form">
              <div class="modal-header">
                  <h2>ApexDrive <span class="accent">Pay</span></h2>
                  <button @click="showPaymentModal = false" class="close-btn">&times;</button>
              </div>

              <!-- СОСТАВ ЗАКАЗА В МОДАЛКЕ -->
              <div class="modal-order-summary">
                  <div class="summary-label">ОПЛАТА ЗАКАЗА №{{ currentOrder.id }}</div>
                  <div class="summary-scroll">
                      <div v-for="item in currentOrder.order_items" :key="item.id" class="summary-row">
                          <img :src="item.products?.image_url" @error="$event.target.src = '/assets/images/no-photo.png'" />
                          <span class="s-name">{{ item.products?.name }}</span>
                          <span class="s-qty">x{{ item.quantity }}</span>
                      </div>
                  </div>
              </div>

              <!-- ВЫБОР КАРТЫ -->
              <div class="card-selection">
                  <p class="section-title">Выберите карту:</p>
                  <div class="cards-grid">
                      <div v-for="card in savedCards" :key="card.id" 
                           @click="selectedCardId = card.id"
                           class="selectable-card"
                           :class="{ active: selectedCardId === card.id }">
                          <div class="card-top">
                              <span class="brand">{{ card.brand }}</span>
                              <span class="check" v-if="selectedCardId === card.id">✔</span>
                          </div>
                          <div class="mask">{{ card.card_number_masked }}</div>
                      </div>

                      <div @click="selectedCardId = 'new'"
                           class="selectable-card new-card"
                           :class="{ active: selectedCardId === 'new' }">
                           + Другая карта
                      </div>
                  </div>
              </div>

              <!-- ВВОД НОВОЙ КАРТЫ -->
              <transition name="slide">
                <div v-if="selectedCardId === 'new'" class="new-card-inputs">
                    <input v-model="newCardData.number" placeholder="Номер карты (16 цифр)" maxlength="16" class="modern-input" />
                    <div class="input-row">
                        <input v-model="newCardData.expiry" placeholder="ММ/ГГ" maxlength="5" class="modern-input" />
                        <input type="password" placeholder="CVC" maxlength="3" class="modern-input" />
                    </div>
                </div>
              </transition>

              <button @click="confirmPayment" class="confirm-pay-btn">
                  ОПЛАТИТЬ {{ currentOrder.total_price }} ₽
              </button>
          </div>

          <div v-if="paymentStep === 'loading'" class="loading-state">
              <div class="spinner"></div>
              <h3>Авторизация...</h3>
              <p>Пожалуйста, не закрывайте страницу</p>
          </div>

          <div v-if="paymentStep === 'success'" class="success-state">
              <div class="success-icon">✔</div>
              <h2>Оплачено!</h2>
              <p>Ваш заказ №{{ currentOrder.id }} принят в работу.</p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import axios from 'axios';
import { useCartStore } from '@/stores/cartStore';

const cartStore = useCartStore();
const orders = ref([]);
const loading = ref(true);
const activeTab = ref('all');

// Состояния оплаты
const showPaymentModal = ref(false);
const paymentStep = ref('form');
const currentOrder = ref(null);
const savedCards = ref([]);
const selectedCardId = ref(null);
const newCardData = reactive({ number: '', expiry: '' });

const tabs = [
  { id: 'all', label: 'Все заказы' }, 
  { id: 'active', label: 'В работе' }, 
  { id: 'paid', label: 'Оплаченные' }, 
  { id: 'unpaid', label: 'Ждут оплаты' },
  { id: 'completed', label: 'Завершенные' },
  { id: 'cancelled', label: 'Отмененные' }
];

const loadOrders = async () => {
  const userId = localStorage.getItem('user_id');
  if (!userId) return;
  try {
    const res = await axios.get(`/api/orders/${userId}`);
    orders.value = res.data;
    
    const cardRes = await axios.get(`/api/cards/${userId}`);
    savedCards.value = cardRes.data;
    if (savedCards.value.length > 0) selectedCardId.value = savedCards.value[0].id;
    else selectedCardId.value = 'new';
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
};

const changePaymentMethod = async (order, newMethod) => {
    try {
        const res = await axios.patch(`/api/orders/${order.id}`, { payment_method: newMethod });
        order.payment_method = res.data.payment_method;
        if (newMethod === 'card') openPaymentModal(order);
    } catch (e) { alert("Ошибка изменения метода"); }
};

const openPaymentModal = (order) => {
    currentOrder.value = order;
    paymentStep.value = 'form';
    showPaymentModal.value = true;
};

const confirmPayment = async () => {
    if (selectedCardId.value === 'new' && newCardData.number.length < 16) return alert("Введите корректные данные карты");

    paymentStep.value = 'loading';
    const userId = localStorage.getItem('user_id');

    setTimeout(async () => {
        try {
            await axios.patch(`/api/orders/${currentOrder.value.id}`, { payment_status: 'paid' });
            currentOrder.value.payment_status = 'paid';

            if (selectedCardId.value === 'new') {
                await axios.post('/api/cards', {
                    user_id: userId,
                    number: newCardData.number,
                    holder: 'CUSTOMER',
                    expiry: newCardData.expiry
                });
            }

            paymentStep.value = 'success';
            setTimeout(() => { showPaymentModal.value = false; }, 1500);

        } catch (e) {
            alert("Ошибка платежа");
            paymentStep.value = 'form';
        }
    }, 2000);
};

const reorder = (order) => {
  if (!order || !order.order_items) return;
  order.order_items.forEach(item => {
    if (item.products) {
      cartStore.addToCart({ ...item.products, price: item.unit_price, stock_quantity: 999 });
    }
  });
  alert('Товары добавлены в корзину.');
};

const cancelOrder = async (order) => {
    if (!confirm("Вы уверены?")) return;
    try {
        await axios.patch(`/api/orders/${order.id}`, { delivery_status: 'cancelled' });
        order.delivery_status = 'cancelled';
    } catch (e) { alert("Ошибка"); }
};

const formatDate = (d) => new Date(d).toLocaleDateString('ru-RU');
const translateDelivery = (s) => ({ 'created': 'Обработка', 'shipping': 'В пути', 'awaiting': 'В пункте выдачи', 'delivered': 'Получен', 'cancelled': 'Отменен' }[s]);
const translatePaymentStatus = (s) => ({ 'paid': 'Оплачен ✅', 'awaiting_payment': 'Ждет оплаты', 'unpaid': 'Не оплачен' }[s] || 'Ожидание');
const getDeliveryStatusStyle = (s) => s === 'cancelled' ? { background: 'var(--danger-light)', color: 'var(--danger)' } : s === 'delivered' ? { background: 'var(--success-light)', color: 'var(--success)' } : { background: 'var(--primary-light)', color: 'var(--primary)' };
const getPaymentStatusStyle = (s) => s === 'paid' ? { color: 'var(--success)' } : { color: 'var(--warning)' };

const filteredOrders = computed(() => {
  if (activeTab.value === 'active') return orders.value.filter(o => !['delivered', 'cancelled'].includes(o.delivery_status));
  if (activeTab.value === 'completed') return orders.value.filter(o => o.delivery_status === 'delivered');
  if (activeTab.value === 'cancelled') return orders.value.filter(o => o.delivery_status === 'cancelled');
  if (activeTab.value === 'paid') return orders.value.filter(o => o.payment_status === 'paid');
  if (activeTab.value === 'unpaid') return orders.value.filter(o => o.payment_status !== 'paid');
  return orders.value;
});

onMounted(loadOrders);
</script>

<style scoped>
/* ==========================================================================
   СТРАНИЦА "МОИ ЗАКАЗЫ" – ПОЛНОСТЬЮ ОБНОВЛЁННЫЙ ДИЗАЙН
   ========================================================================== */

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(25px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulseGlow {
  0% { box-shadow: 0 0 0 0 var(--primary-light); }
  70% { box-shadow: 0 0 0 10px rgba(230, 57, 70, 0); }
  100% { box-shadow: 0 0 0 0 rgba(230, 57, 70, 0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.orders-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
  animation: fadeSlideUp 0.6s ease-out;
}

/* ШАПКА */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 32px;
}

.header-section h1 {
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-weight: 600;
  color: var(--primary);
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}

.back-link:hover {
  transform: translateX(-6px);
  text-shadow: 0 0 2px var(--primary-light);
}

/* ТАБЫ */
.status-tabs {
  display: flex;
  gap: 10px;
  background: var(--bg-card);
  backdrop-filter: blur(4px);
  padding: 8px;
  border-radius: var(--radius-lg);
  margin-bottom: 32px;
  overflow-x: auto;
  scrollbar-width: thin;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.status-tabs::-webkit-scrollbar {
  height: 4px;
}

.status-tabs button {
  white-space: nowrap;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}

.status-tabs button:hover {
  background: var(--primary-light);
  color: var(--primary);
  transform: translateY(-2px);
}

.status-tabs button.active {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  box-shadow: var(--shadow-sm);
}

/* ЛОАДЕР */
.loader-container {
  text-align: center;
  padding: 60px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
}

.loader {
  width: 50px;
  height: 50px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20px;
}

/* КАРТОЧКА ЗАКАЗА */
.order-card {
  background: var(--bg-card);
  backdrop-filter: blur(4px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 28px;
  margin-bottom: 28px;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-shadow: var(--shadow-sm);
}

.order-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-light);
}

.order-card.cancelled-order {
  opacity: 0.7;
  background: var(--danger-light);
  border-left: 4px solid var(--danger);
}

/* ЗАГОЛОВОК ЗАКАЗА */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}

.order-number {
  display: block;
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--primary);
  letter-spacing: -0.3px;
}

.order-date {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-left: 12px;
}

.order-statuses {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.badge {
  padding: 6px 14px;
  border-radius: 40px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(4px);
}

.payment-badge {
  border: 1px solid currentColor;
  background: transparent;
}

/* АДРЕС ДОСТАВКИ */
.order-delivery-info {
  font-size: 0.95rem;
  padding: 12px 18px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  margin-bottom: 24px;
  color: var(--text-main);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.pin-icon {
  font-size: 1.1rem;
}

/* БЛОК УПРАВЛЕНИЯ ОПЛАТОЙ */
.management-box {
  background: linear-gradient(145deg, var(--warning-light), transparent);
  padding: 20px;
  border-radius: var(--radius-md);
  margin-bottom: 24px;
  border: 1px solid rgba(245, 158, 11, 0.25);
  transition: all 0.3s;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.method-select-group label {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--warning);
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.modern-select {
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.modern-select:hover {
  border-color: var(--primary);
}

.pay-btn {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  padding: 10px 24px;
  border-radius: 40px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.pay-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
}

/* ТОВАРЫ В ЗАКАЗЕ */
.order-items {
  margin: 20px 0;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s;
}

.item-row:last-child {
  border-bottom: none;
}

.item-row:hover {
  background: var(--primary-light);
  margin: 0 -10px;
  padding: 16px 10px;
  border-radius: var(--radius-sm);
}

.item-img-link {
  position: relative;
  display: block;
  flex-shrink: 0;
}

.item-row img {
  width: 60px;
  height: 60px;
  object-fit: contain;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 6px;
  transition: all 0.3s;
}

.item-row img:hover {
  transform: scale(1.05);
  border-color: var(--primary);
}

.item-info {
  flex: 1;
}

.item-name {
  display: inline-block;
  font-weight: 700;
  color: var(--text-main);
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.2s;
}

.item-name:hover {
  color: var(--primary);
  text-decoration: underline;
}

.item-details {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.item-price {
  font-weight: 800;
  font-size: 1rem;
  color: var(--primary);
  white-space: nowrap;
}

/* ФУТЕР ЗАКАЗА */
.order-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px dashed var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.total-sum {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-muted);
}

.total-sum strong {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--primary);
  margin-left: 8px;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.reorder-btn,
.cancel-order-btn {
  padding: 10px 20px;
  border-radius: 40px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  border: none;
}

.reorder-btn {
  background: var(--bg-input);
  color: var(--text-main);
  border: 1px solid var(--border-color);
}

.reorder-btn:hover {
  background: var(--primary-light);
  color: var(--primary);
  transform: translateY(-2px);
}

.cancel-order-btn {
  background: var(--danger-light);
  color: var(--danger);
}

.cancel-order-btn:hover {
  background: var(--danger);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(231, 111, 81, 0.3);
}

/* ПУСТОЕ СОСТОЯНИЕ */
.empty-orders {
  text-align: center;
  padding: 80px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--border-color);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

/* МОДАЛЬНОЕ ОКНО ОПЛАТЫ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg-overlay);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: var(--bg-card);
  width: 95%;
  max-width: 500px;
  border-radius: var(--radius-lg);
  padding: 32px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  animation: fadeSlideUp 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h2 {
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
}

.accent {
  color: var(--primary);
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
}

.close-btn:hover {
  color: var(--danger);
  transform: rotate(90deg);
}

/* Сводка заказа в модалке */
.modal-order-summary {
  background: var(--bg-input);
  padding: 16px;
  border-radius: var(--radius-md);
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
}

.summary-label {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.summary-scroll {
  max-height: 140px;
  overflow-y: auto;
  padding-right: 6px;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 0.85rem;
}

.summary-row img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  background: white;
  border-radius: 6px;
  padding: 2px;
}

.s-name {
  flex: 1;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.s-qty {
  font-weight: 700;
  color: var(--primary);
}

/* Выбор карты */
.card-selection {
  margin-bottom: 24px;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  color: var(--text-muted);
}

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selectable-card {
  border: 2px solid var(--border-color);
  padding: 14px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  background: var(--bg-card);
}

.selectable-card:hover {
  transform: translateX(4px);
  border-color: var(--primary-light);
}

.selectable-card.active {
  border-color: var(--primary);
  background: linear-gradient(145deg, var(--primary-light), var(--bg-card));
  box-shadow: var(--shadow-sm);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.brand {
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.8rem;
  color: var(--primary);
}

.check {
  color: var(--success);
  font-weight: 800;
}

.mask {
  font-family: monospace;
  font-size: 0.9rem;
  letter-spacing: 1px;
}

.new-card {
  justify-content: center;
  font-weight: 700;
  color: var(--primary);
  border-style: dashed;
  text-align: center;
}

/* Поля для новой карты */
.new-card-inputs {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modern-input {
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  transition: all 0.2s;
  font-size: 0.9rem;
}

.modern-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
  outline: none;
}

.input-row {
  display: flex;
  gap: 12px;
}

.input-row .modern-input {
  flex: 1;
}

/* Кнопка подтверждения оплаты */
.confirm-pay-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--success), var(--success-hover));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  margin-top: 8px;
}

.confirm-pay-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(16, 185, 129, 0.4);
}

/* Состояния загрузки/успеха */
.loading-state {
  text-align: center;
  padding: 30px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20px;
}

.success-state {
  text-align: center;
  padding: 20px;
}

.success-icon {
  width: 70px;
  height: 70px;
  background: var(--success-light);
  color: var(--success);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto 20px;
  animation: pulseGlow 0.5s ease-out;
}

/* АНИМАЦИИ ДЛЯ ПЕРЕХОДОВ */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.slide-enter-from, .slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* АДАПТИВНОСТЬ */
@media (max-width: 768px) {
  .orders-page {
    padding: 24px 16px;
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-row {
    flex-direction: column;
    align-items: stretch;
  }

  .pay-btn {
    text-align: center;
  }

  .order-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .footer-actions {
    flex-direction: column;
  }

  .reorder-btn, .cancel-order-btn {
    width: 100%;
    text-align: center;
  }

  .item-row {
    flex-wrap: wrap;
  }

  .item-price {
    margin-left: auto;
  }

  .modal-content {
    padding: 24px;
  }
}
</style>