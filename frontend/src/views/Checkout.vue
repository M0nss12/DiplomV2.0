<template>
  <div class="checkout-page">
    <h1 class="page-title">Оформление заказа</h1>

    <!-- СОСТОЯНИЕ ПУСТОЙ КОРЗИНЫ -->
    <div v-if="cartStore.items.length === 0" class="empty-cart-state">
      <div class="empty-icon">🛒</div>
      <h2>Ваша корзина пуста</h2>
      <router-link to="/catalog">
        <button class="btn-primary">В каталог</button>
      </router-link>
    </div>

    <div v-else class="checkout-layout">
      
      <div class="checkout-main">
        <!-- 1. КОНТАКТЫ И ГОРОД -->
        <section class="checkout-section">
          <h3><span class="section-icon">👤</span> Контактные данные</h3>
          
          <!-- ВЫБОР ГОРОДА ПРЯМО ТУТ -->
          <div class="input-group full-width-group">
             <label>📍 Ваш Город (населенный пункт) *</label>
             <div class="city-input-wrap">
               <input 
                 v-model="checkoutCity" 
                 @blur="updateGlobalCity"
                 @keyup.enter="updateGlobalCity"
                 placeholder="Введите ваш город для обновления списка ПВЗ..." 
               />
               <span class="city-hint">Нажмите Enter или кликните вне поля для обновления</span>
             </div>
          </div>

          <div class="form-grid">
            <div class="input-group">
              <label>Имя *</label>
              <input v-model="form.name" placeholder="Имя Фамилия" required />
            </div>
            <div class="input-group">
              <label>Телефон *</label>
              <input v-model="form.phone" type="tel" placeholder="+7..." required />
            </div>
            <div class="input-group">
              <label>Email *</label>
              <input v-model="form.email" type="email" placeholder="mail@example.com" required />
            </div>
          </div>
        </section>

        <!-- 2. ПВЗ -->
        <section class="checkout-section">
          <h3><span class="section-icon">📍</span> Пункт выдачи в г. {{ appStore.city }}</h3>
          
          <div v-if="localWarehouses.length > 0">
            <select v-model="selectedWarehouseId" class="warehouse-select">
              <option :value="null">-- Выберите адрес --</option>
              <option v-for="w in localWarehouses" :key="w.id" :value="w.id">
                {{ w.address }}
              </option>
            </select>
          </div>
          <div v-else class="no-warehouses-alert">
            <p>В г. <b>{{ appStore.city }}</b> нет доступных ПВЗ. Укажите другой город.</p>
          </div>
        </section>

        <!-- 3. СПОСОБ ОПЛАТЫ -->
        <section class="checkout-section">
          <h3><span class="section-icon">💳</span> Способ оплаты</h3>
          <div class="payment-methods-grid">
            <label v-for="m in paymentMethods" :key="m.id" 
                   class="payment-method-card"
                   :class="{ active: form.payment_method === m.id }">
              <input type="radio" :value="m.id" v-model="form.payment_method" />
              <div class="method-icon">{{ m.icon }}</div>
              <strong>{{ m.label }}</strong>
            </label>
          </div>

          <!-- ВЫБОР СОХРАНЕННОЙ КАРТЫ -->
          <transition name="fade">
            <div v-if="form.payment_method === 'card'" class="saved-cards-section">
              <h4>Выберите карту для оплаты:</h4>
              <div class="cards-list">
                <div v-for="card in savedCards" :key="card.id" 
                     @click="selectedCardId = card.id"
                     class="bank-card-item"
                     :class="{ selected: selectedCardId === card.id }">
                  <div class="card-brand">{{ card.brand }}</div>
                  <div class="card-mask">{{ card.card_number_masked }}</div>
                  <div class="card-check" v-if="selectedCardId === card.id">✔</div>
                </div>
                
                <div @click="selectedCardId = 'new'"
                     class="bank-card-item new-card-btn"
                     :class="{ selected: selectedCardId === 'new' }">
                  <span>+ Новая карта</span>
                </div>
              </div>
            </div>
          </transition>
        </section>

        <!-- КНОПКИ ДЕЙСТВИЯ -->
        <div class="action-footer">
          <button @click="cancelOrder" class="btn-cancel">ОТМЕНИТЬ</button>
          <button @click="handleOrderProcess" 
                  :disabled="loading || !selectedWarehouseId || (form.payment_method === 'card' && !selectedCardId)" 
                  class="btn-submit"
                  :style="{ opacity: (loading || !selectedWarehouseId) ? 0.5 : 1 }">
            {{ loading ? 'ОБРАБОТКА...' : '✔ ПОДТВЕРДИТЬ И ОПЛАТИТЬ' }}
          </button>
        </div>
      </div>

      <!-- ПРАВАЯ ПАНЕЛЬ: ИТОГО -->
      <aside class="checkout-sidebar">
        <div class="summary-card">
          <h3>Ваш заказ</h3>
          <div class="summary-items">
            <div v-for="item in cartStore.items" :key="item?.id" class="summary-item">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <small>{{ item.quantity }} шт. × {{ item.discount_price || item.price }} ₽</small>
              </div>
              <span class="item-total-price">{{ (item.discount_price || item.price) * item.quantity }} ₽</span>
            </div>
          </div>

          <div class="summary-totals">
            <div class="total-row">
              <span>Сумма товаров:</span>
              <span>{{ cartStore.totalPriceFinal }} ₽</span>
            </div>

            <!-- ДЕТАЛИЗАЦИЯ ДОСТАВКИ -->
            <div class="delivery-breakdown">
              <div class="total-row delivery-title">
                <span>Доставка:</span>
                <span :class="{ free: shippingBreakdown.cost === 0 }">
                  {{ shippingBreakdown.cost === 0 ? 'Бесплатно' : shippingBreakdown.cost + ' ₽' }}
                </span>
              </div>

              <!-- Если есть Межгород -->
              <div v-if="shippingBreakdown.intercityItems.length > 0" class="intercity-alert">
                <div class="alert-title">📦 Межгород (доставка из другого региона):</div>
                <ul class="intercity-list">
                  <li v-for="i in shippingBreakdown.intercityItems" :key="i.id">
                    {{ i.name }} — <b>{{ i.qty }} шт.</b>
                  </li>
                </ul>
              </div>

              <div v-if="shippingBreakdown.weightSurcharge > 0" class="weight-alert">
                <span>⚖️ Перевес: <b>{{ shippingBreakdown.totalWeight }} кг</b></span>
                <span class="surcharge">+{{ shippingBreakdown.weightSurcharge }} ₽</span>
              </div>
            </div>

            <div class="final-price">
              <span>Итого:</span>
              <span class="price-val">{{ cartStore.totalPriceFinal + shippingBreakdown.cost }} ₽</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО ОПЛАТЫ -->
    <div v-if="showPaymentModal" class="modal-overlay" @click.self="showPaymentModal = false">
      <div class="modal-content">
        <div v-if="paymentStep === 'loading'" class="payment-loading">
          <div class="payment-spinner"></div>
          <h3>Связь с банком...</h3>
          <p>Пожалуйста, не закрывайте страницу</p>
        </div>

        <div v-if="paymentStep === 'form'" class="payment-form">
          <h2 class="bank-title">ApexDrive <span class="accent-pay">Pay</span></h2>
          <div class="amount-badge">К оплате: {{ cartStore.totalPriceFinal + shippingBreakdown.cost }} ₽</div>
          
          <div v-if="selectedCardId === 'new'" class="card-inputs">
            <label>НОМЕР КАРТЫ</label>
            <input v-model="newCardData.number" placeholder="0000 0000 0000 0000" maxlength="16" class="long-input" />
            <div class="card-row">
              <input v-model="newCardData.expiry" placeholder="ММ/ГГ" maxlength="5" />
              <input type="password" placeholder="CVC" maxlength="3" />
            </div>
          </div>

          <div v-else class="card-preview">
            <div class="preview-label">ОПЛАТА СОХРАНЕННОЙ КАРТОЙ</div>
            <div class="preview-number">{{ getSelectedCardMask() }}</div>
            <div class="preview-footer">ApexDrive Secure</div>
          </div>

          <button @click="processPayment" class="btn-confirm-pay">ПОДТВЕРДИТЬ ОПЛАТУ</button>
          <button @click="showPaymentModal = false" class="btn-text">Отмена</button>
        </div>

        <div v-if="paymentStep === 'success'" class="payment-success">
          <div class="success-icon">✔</div>
          <h3>Оплата успешна!</h3>
          <p>Ваш заказ №{{ lastOrderId }} принят.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '@/stores/cartStore';
import { useAppStore } from '@/stores/appStore';

const router = useRouter();
const cartStore = useCartStore();
const appStore = useAppStore();

const loading = ref(false);
const warehouses = ref([]);
const savedCards = ref([]);
const selectedWarehouseId = ref(null);
const selectedCardId = ref(null);

const checkoutCity = ref(''); // Локальная модель для инпута города
const form = ref({ name: '', phone: '', email: '', payment_method: 'card' });

const showPaymentModal = ref(false);
const paymentStep = ref('form');
const lastOrderId = ref(null);
const newCardData = reactive({ number: '', expiry: '', holder: 'CARD HOLDER' });

const paymentMethods = [
  { id: 'card', label: 'Онлайн', icon: '💳' },
  { id: 'card_pickup', label: 'Картой в ПВЗ', icon: '📲' },
  { id: 'cash', label: 'Наличными', icon: '💵' }
];

const isSameCity = (c1, c2) => c1?.trim().toLowerCase() === c2?.trim().toLowerCase();

// --- 1. ЛОГИКА ОБНОВЛЕНИЯ ГОРОДА ---
const updateGlobalCity = async () => {
    if (!checkoutCity.value.trim()) return;
    
    const newCity = checkoutCity.value.trim();
    appStore.setCity(newCity); // Обновляем в Pinia (меняется шапка и расчеты)
    
    // Если пользователь авторизован, сохраняем в БД навсегда
    const uid = localStorage.getItem('user_id');
    if (uid) {
        try {
            await axios.put(`/api/users/profile/${uid}`, { saved_address: newCity });
        } catch (e) { console.error("Ошибка сохранения города в БД"); }
    }

    // Сбрасываем выбранный ПВЗ, так как город изменился
    selectedWarehouseId.value = null;
};

// Фильтруем ПВЗ для выбранного города
const localWarehouses = computed(() => {
    return warehouses.value.filter(w => isSameCity(w.city_name, appStore.city) && w.is_pickup_point);
});

// --- 2. ИСПРАВЛЕННАЯ ЛОГИКА ОСТАТКОВ (МЕЖГОРОД) ---
const getStockInCity = (item) => {
    if (!item?.product_stocks) return 0;
    
    let totalInCity = 0;
    item.product_stocks.forEach(stockRecord => {
        // Ищем склад из ОБЩЕГО списка складов, чтобы узнать его город
        const wh = warehouses.value.find(hw => hw.id === stockRecord.warehouse_id);
        
        // Если город склада совпадает с выбранным городом
        if (wh && isSameCity(wh.city_name, appStore.city)) {
            totalInCity += Number(stockRecord.quantity) || 0;
        }
    });
    return totalInCity;
};

const shippingBreakdown = computed(() => {
    if (!selectedWarehouseId.value) return { cost: 0, intercityItems: [], weightSurcharge: 0, totalWeight: 0 };
    if (cartStore.totalPriceFinal > 50000) return { cost: 0, intercityItems: [], weightSurcharge: 0, totalWeight: 0 };
    
    let intercityItems = [];
    
    cartStore.items.forEach(item => { 
      const cityStock = getStockInCity(item); // Сколько есть в ЭТОМ городе
      
      // Если хотят купить больше, чем есть во ВСЕМ городе - остаток едет межгородом
      if (item.quantity > cityStock) {
        intercityItems.push({ 
            name: item.name, 
            id: item.id, 
            qty: item.quantity - cityStock
        });
      }
    });
    
    const totalWeight = Math.ceil(cartStore.totalWeight || 0);
    const weightSurcharge = totalWeight > 10 ? (totalWeight - 10) * 50 : 0;
    
    if (intercityItems.length === 0 && weightSurcharge === 0) {
      return { cost: 0, intercityItems: [], weightSurcharge: 0, totalWeight };
    }

    // Если есть хотя бы 1 товар из другого города - базовая цена 800
    const baseCost = intercityItems.length > 0 ? 800 : 0;
    const finalCost = baseCost + weightSurcharge;

    return { cost: finalCost, intercityItems, weightSurcharge, totalWeight };
});

const getSelectedCardMask = () => {
    const card = savedCards.value.find(c => c.id === selectedCardId.value);
    return card ? card.card_number_masked : '**** **** **** ****';
};

onMounted(async () => {
    checkoutCity.value = appStore.city; // Инициализируем инпут текущим городом

    const uid = localStorage.getItem('user_id');
    try {
        const [wRes, cRes] = await Promise.all([
            axios.get('/api/admin/warehouses', { headers: {'x-admin-key': 'my_super_secret_admin_123'} }),
            uid ? axios.get(`/api/cards/${uid}`) : { data: [] }
        ]);
        warehouses.value = wRes.data;
        savedCards.value = cRes.data;
        
        if (savedCards.value.length > 0) selectedCardId.value = savedCards.value[0].id;
        else selectedCardId.value = 'new';

        if (uid) {
            const u = await axios.get(`/api/users/profile/${uid}`);
            form.value.name = `${u.data.first_name || ''} ${u.data.last_name || ''}`.trim();
            form.value.phone = u.data.phone_number || '';
            form.value.email = u.data.email || '';
        }
    } catch (e) { console.error(e); }
});

const handleOrderProcess = () => {
    if (form.value.payment_method === 'card') {
        showPaymentModal.value = true;
        paymentStep.value = 'form';
    } else {
        submitOrder('awaiting');
    }
};

const processPayment = async () => {
    if (selectedCardId.value === 'new' && newCardData.number.length < 16) return alert("Введите карту полностью");
    paymentStep.value = 'loading';
    
    setTimeout(async () => {
        await submitOrder('paid');
        if (selectedCardId.value === 'new') {
            const uid = localStorage.getItem('user_id');
            if (uid) {
              await axios.post('/api/cards', { 
                  user_id: uid, number: newCardData.number, holder: 'CUSTOMER', expiry: newCardData.expiry 
              });
            }
        }
        paymentStep.value = 'success';
        setTimeout(() => { router.push('/profile'); cartStore.clearCart(); }, 2000);
    }, 2000);
};

const submitOrder = async (payStatus) => {
    loading.value = true;
    try {
        const res = await axios.post('/api/orders', {
            ...form.value, 
            customer_name: form.value.name, 
            customer_phone: form.value.phone,
            customer_email: form.value.email, 
            customer_city: appStore.city,
            warehouse_id: selectedWarehouseId.value,
            payment_status: payStatus,
            shipping_cost: shippingBreakdown.value.cost, 
            items: cartStore.items.map(i => ({ product_id: i.id, quantity: i.quantity }))
        });
        lastOrderId.value = res.data.orderId;
        if (payStatus !== 'paid') {
            alert("Заказ оформлен!");
            cartStore.clearCart();
            router.push('/profile');
        }
    } catch (e) { alert(e.response?.data?.error || "Ошибка заказа"); } 
    finally { loading.value = false; }
};

const cancelOrder = () => router.push('/cart');
</script>

<style scoped>
.checkout-page {
    padding: 40px 20px;
    animation: fadeIn 0.5s ease-out;
}

.page-title {
    text-align: center;
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 40px;
}

.checkout-layout {
    display: flex;
    gap: 40px;
    align-items: flex-start;
}

.checkout-main {
    flex: 2;
}

.checkout-section {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 30px;
    margin-bottom: 25px;
    box-shadow: var(--shadow-sm);
    transition: var(--transition);
}

.checkout-section:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
}

.checkout-section h3 {
    margin-top: 0;
    font-size: 1.25rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 25px;
}

.section-icon {
    font-size: 1.5rem;
}

/* ФОРМА И ГОРОД */
.full-width-group {
    margin-bottom: 25px;
    background: var(--bg-input);
    padding: 15px;
    border-radius: var(--radius-md);
    border: 1px dashed var(--border-color);
}

.city-input-wrap {
    position: relative;
}

.city-input-wrap input {
    width: 100%;
    padding: 14px;
    font-size: 1.1rem;
    font-weight: bold;
    border-radius: var(--radius-sm);
    border: 2px solid var(--primary);
}

.city-hint {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 5px;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

.input-group label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 6px;
}

.warehouse-select {
    width: 100%;
    padding: 15px;
    border-radius: var(--radius-sm);
    border: 2px solid var(--primary);
    background: var(--bg-card);
    font-size: 1.1rem;
    cursor: pointer;
}

.no-warehouses-alert {
    background: var(--warning-light);
    color: var(--warning);
    padding: 20px;
    border-radius: var(--radius-md);
    text-align: center;
    font-weight: 600;
}

/* ОПЛАТА */
.payment-methods-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
}

.payment-method-card {
    background: var(--bg-input);
    border: 2px solid transparent;
    padding: 20px;
    border-radius: var(--radius-md);
    cursor: pointer;
    text-align: center;
    transition: var(--transition);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.payment-method-card input {
    display: none;
}

.payment-method-card.active {
    background: var(--primary-light);
    border-color: var(--primary);
}

.method-icon {
    font-size: 2rem;
    margin-bottom: 10px;
}

.saved-cards-section {
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
}

.cards-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 15px;
}

.bank-card-item {
    background: var(--bg-card);
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 15px 20px;
    cursor: pointer;
    min-width: 200px;
    position: relative;
    transition: var(--transition);
}

.bank-card-item.selected {
    border-color: var(--primary);
    background: var(--primary-light);
}

.card-brand {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: uppercase;
    font-weight: 800;
}

.card-mask {
    font-family: monospace;
    font-weight: 700;
    font-size: 1.1rem;
    margin-top: 5px;
}

.card-check {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--primary);
}

.new-card-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    border-style: dashed;
}

/* ПРАВАЯ ПАНЕЛЬ */
.checkout-sidebar {
    flex: 1;
    position: sticky;
    top: 100px;
}

.summary-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 30px;
    box-shadow: var(--shadow-lg);
}

.summary-items {
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 20px;
    padding-right: 10px;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--bg-input);
}

.item-info {
    display: flex;
    flex-direction: column;
    max-width: 70%;
}

.item-name {
    font-size: 0.9rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.summary-totals {
    border-top: 1px solid var(--border-color);
    padding-top: 20px;
}

.total-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    color: var(--text-muted);
}

.delivery-title {
    font-weight: 700;
    color: var(--text-main);
}

.free {
    color: var(--success);
}

.intercity-alert {
    background: var(--danger-light);
    border: 1px solid rgba(244, 63, 94, 0.2);
    padding: 12px;
    border-radius: var(--radius-sm);
    margin-bottom: 15px;
    font-size: 0.85rem;
}

.alert-title {
    color: var(--danger);
    font-weight: 700;
    margin-bottom: 8px;
}

.intercity-list {
    list-style: none;
    padding: 0;
}

.weight-alert {
    background: var(--bg-input);
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    margin-bottom: 15px;
}

.surcharge {
    color: var(--danger);
    font-weight: 700;
}

.final-price {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 2px dashed var(--border-color);
    font-size: 1.5rem;
    font-weight: 800;
}

.price-val {
    color: var(--primary);
}

/* КНОПКИ */
.action-footer {
    display: flex;
    gap: 15px;
    margin-top: 30px;
}

.btn-cancel {
    flex: 1;
    background: var(--bg-card);
    color: var(--danger);
    border: 2px solid var(--danger);
    padding: 18px;
    border-radius: var(--radius-md);
    font-weight: 700;
}

.btn-cancel:hover {
    background: var(--danger-light);
}

.btn-submit {
    flex: 2;
    background: var(--success);
    color: white;
    padding: 18px;
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: 1.1rem;
    box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
}

/* ПЛАТЕЖНАЯ МОДАЛКА */
.modal-overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: var(--bg-overlay);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.modal-content {
    background: var(--bg-card);
    width: 90%;
    max-width: 420px;
    padding: 40px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    text-align: center;
    border: 1px solid var(--border-color);
}

.bank-title {
    font-weight: 800;
    margin-bottom: 10px;
}

.accent-pay { color: var(--primary); }

.amount-badge {
    background: var(--primary-light);
    color: var(--primary);
    padding: 10px;
    border-radius: 50px;
    font-weight: 700;
    margin-bottom: 30px;
}

.card-inputs {
    text-align: left;
    margin-bottom: 25px;
}

.card-row {
    display: flex;
    gap: 10px;
    margin-top: 10px;
}

.card-preview {
    background: linear-gradient(135deg, #1e293b, #0f172a);
    color: white;
    padding: 30px;
    border-radius: var(--radius-md);
    text-align: left;
    margin-bottom: 30px;
    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
}

.preview-number {
    font-family: monospace;
    font-size: 1.4rem;
    letter-spacing: 2px;
    margin: 15px 0;
}

.btn-confirm-pay {
    width: 100%;
    padding: 16px;
    background: var(--primary);
    color: white;
    border-radius: var(--radius-md);
    font-weight: 700;
    margin-bottom: 15px;
}

.btn-text {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-weight: 600;
}

.payment-spinner {
    width: 50px; height: 50px;
    border: 4px solid var(--bg-input);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* АДАПТИВНОСТЬ */
@media (max-width: 992px) {
    .checkout-layout { flex-direction: column; }
    .checkout-sidebar { width: 100%; position: static; }
}

@media (max-width: 768px) {
    .form-grid { grid-template-columns: 1fr; }
    .payment-methods-grid { grid-template-columns: 1fr; }
    .action-footer { flex-direction: column; }
    .page-title { font-size: 1.8rem; }
}
</style>