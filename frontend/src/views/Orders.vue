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
.orders-page {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    animation: fadeIn 0.5s ease-out;
}

.header-section h1 {
    font-size: 2.2rem;
    font-weight: 800;
}

.back-link {
    text-decoration: none;
    color: var(--primary);
    font-weight: 600;
    transition: var(--transition);
}

.back-link:hover {
    transform: translateX(-5px);
}

/* ТАБЫ */
.status-tabs {
    display: flex;
    gap: 8px;
    background: var(--bg-input);
    padding: 6px;
    border-radius: var(--radius-md);
    margin-bottom: 30px;
    overflow-x: auto;
    scrollbar-width: none;
}

.status-tabs::-webkit-scrollbar { display: none; }

.status-tabs button {
    white-space: nowrap;
    border: none;
    padding: 10px 18px;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
}

.status-tabs button.active {
    background: var(--bg-card);
    color: var(--primary);
    box-shadow: var(--shadow-sm);
}

/* КАРТОЧКА ЗАКАЗА */
.order-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 25px;
    margin-bottom: 25px;
    transition: var(--transition);
}

.order-card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--primary-light);
}

.order-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
}

.order-number {
    display: block;
    font-weight: 800;
    font-size: 1.2rem;
}

.order-date {
    font-size: 0.85rem;
    color: var(--text-muted);
}

.badge {
    padding: 6px 14px;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    margin-left: 10px;
}

.order-delivery-info {
    font-size: 0.95rem;
    padding: 12px 15px;
    background: var(--bg-input);
    border-radius: var(--radius-md);
    margin-bottom: 20px;
    color: var(--text-main);
}

/* УПРАВЛЕНИЕ ОПЛАТОЙ */
.management-box {
    background: var(--warning-light);
    padding: 20px;
    border-radius: var(--radius-md);
    margin-bottom: 20px;
    border: 1px solid rgba(245, 158, 11, 0.2);
}

body.dark-theme .management-box {
    background: rgba(245, 158, 11, 0.05);
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

.method-select-group label {
    display: block;
    font-size: 0.8rem;
    font-weight: 700;
    color: #92400e;
    margin-bottom: 5px;
}

.modern-select {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: white;
    cursor: pointer;
}

.pay-btn {
    background: var(--primary);
    color: white;
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

/* ТОВАРЫ */
.item-row {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px 0;
    border-bottom: 1px solid var(--border-color);
}

.item-row:last-child { border-bottom: none; }

.item-row img {
    width: 55px; height: 55px;
    object-fit: contain;
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 4px;
    transition: var(--transition);
}

.item-row img:hover { transform: scale(1.1); }

.item-name {
    display: block;
    font-weight: 600;
    color: var(--text-main);
    text-decoration: none;
    line-height: 1.3;
}

.item-name:hover { color: var(--primary); }

.item-details {
    font-size: 0.85rem;
    color: var(--text-muted);
}

.item-price {
    font-weight: 700;
    font-size: 1rem;
}

.order-footer {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.total-sum strong {
    font-size: 1.5rem;
    color: var(--text-main);
}

.footer-actions { display: flex; gap: 10px; }

.reorder-btn {
    background: var(--bg-input);
    color: var(--text-main);
    padding: 10px 18px;
    border-radius: 10px;
    font-weight: 600;
}

.cancel-order-btn {
    background: var(--danger-light);
    color: var(--danger);
    padding: 10px 18px;
    border-radius: 10px;
    font-weight: 600;
}

/* МОДАЛКА ОПЛАТЫ */
.modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: var(--bg-overlay);
    backdrop-filter: blur(10px);
    display: flex; justify-content: center; align-items: center;
    z-index: 9999;
}

.modal-content {
    background: var(--bg-card);
    width: 95%; max-width: 500px;
    border-radius: var(--radius-lg);
    padding: 30px;
}

.modal-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 25px;
}

.accent { color: var(--primary); }

.modal-order-summary {
    background: var(--bg-input);
    padding: 15px;
    border-radius: 12px;
    margin-bottom: 25px;
}

.summary-label { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); margin-bottom: 10px; }
.summary-scroll { max-height: 120px; overflow-y: auto; }

.summary-row {
    display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
}

.summary-row img { width: 30px; height: 30px; background: #fff; border-radius: 5px; }

.card-selection { margin-bottom: 25px; }
.cards-grid { display: flex; flex-direction: column; gap: 10px; }

.selectable-card {
    border: 2px solid var(--border-color);
    padding: 15px;
    border-radius: 12px;
    cursor: pointer;
    transition: var(--transition);
}

.selectable-card.active {
    border-color: var(--primary);
    background: var(--primary-light);
}

.new-card { border-style: dashed; text-align: center; font-weight: 700; }

.confirm-pay-btn {
    width: 100%;
    padding: 18px;
    background: var(--success);
    color: white;
    border-radius: 12px;
    font-weight: 800;
    box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
}

/* АНИМАЦИИ */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinner {
    width: 40px; height: 40px;
    border: 4px solid var(--border-color);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

/* АДАПТИВНОСТЬ */
@media (max-width: 768px) {
    .info-row { flex-direction: column; align-items: stretch; }
    .order-footer { flex-direction: column; align-items: flex-start; gap: 15px; }
    .footer-actions { width: 100%; }
    .footer-actions button { flex: 1; }
}
</style>