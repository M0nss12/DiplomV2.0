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

.checkout-page {
  padding: 40px 20px;
  animation: fadeSlideUp 0.6s ease-out;
}

.page-title {
  text-align: center;
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 40px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.checkout-layout {
  display: flex;
  gap: 40px;
  align-items: flex-start;
  max-width: 1400px;
  margin: 0 auto;
}

.checkout-main {
  flex: 2;
}

.checkout-section {
  background: var(--bg-card);
  backdrop-filter: blur(4px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 30px;
  margin-bottom: 28px;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
}

.checkout-section:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.checkout-section h3 {
  margin-top: 0;
  font-size: 1.4rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 25px;
  color: var(--text-main);
}

.section-icon {
  font-size: 1.8rem;
}

/* Форма */
.full-width-group {
  margin-bottom: 25px;
  background: linear-gradient(145deg, var(--bg-input), transparent);
  padding: 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.city-input-wrap {
  position: relative;
}

.city-input-wrap input {
  width: 100%;
  padding: 14px 18px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border-color);
  background: var(--bg-card);
  transition: all 0.3s;
}

.city-input-wrap input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
  outline: none;
}

.city-hint {
  display: block;
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 8px;
  letter-spacing: 0.3px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.input-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.input-group input {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  transition: all 0.3s;
}

.input-group input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
  transform: scale(1.01);
}

/* ПВЗ */
.warehouse-select {
  width: 100%;
  padding: 14px 18px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border-color);
  background: var(--bg-card);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.warehouse-select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
  outline: none;
}

.no-warehouses-alert {
  background: var(--warning-light);
  border-left: 4px solid var(--warning);
  padding: 18px;
  border-radius: var(--radius-md);
  text-align: center;
  font-weight: 600;
  color: var(--warning);
}

/* Способы оплаты */
.payment-methods-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.payment-method-card {
  background: var(--bg-input);
  border: 2px solid transparent;
  padding: 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.payment-method-card input {
  display: none;
}

.payment-method-card.active {
  background: linear-gradient(145deg, var(--primary-light), transparent);
  border-color: var(--primary);
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(230, 57, 70, 0.15);
}

.method-icon {
  font-size: 2.2rem;
  transition: transform 0.3s;
}

.payment-method-card:hover .method-icon {
  transform: scale(1.1);
}

/* Сохранённые карты */
.saved-cards-section {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 2px dashed var(--border-color);
}

.saved-cards-section h4 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text-main);
}

.cards-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 15px;
}

.bank-card-item {
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 14px 20px;
  cursor: pointer;
  min-width: 210px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  backdrop-filter: blur(4px);
}

.bank-card-item:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-sm);
}

.bank-card-item.selected {
  border-color: var(--primary);
  background: linear-gradient(145deg, var(--primary-light), var(--bg-card));
}

.card-brand {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: 1px;
}

.card-mask {
  font-family: 'Monaco', monospace;
  font-weight: 700;
  font-size: 1rem;
  margin-top: 6px;
  letter-spacing: 1px;
}

.card-check {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--success);
  font-weight: 800;
  font-size: 1.2rem;
}

.new-card-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border-style: dashed;
  background: var(--bg-input);
}

/* Кнопки действий */
.action-footer {
  display: flex;
  gap: 20px;
  margin-top: 30px;
}

.btn-cancel {
  flex: 1;
  background: transparent;
  color: var(--danger);
  border: 2px solid var(--danger);
  padding: 16px;
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel:hover {
  background: var(--danger-light);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(231, 111, 81, 0.2);
}

.btn-submit {
  flex: 2;
  background: linear-gradient(135deg, var(--success), var(--success-hover));
  color: white;
  padding: 16px;
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 1px;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(16, 185, 129, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Правая панель */
.checkout-sidebar {
  flex: 1;
  position: sticky;
  top: 100px;
}

.summary-card {
  background: var(--bg-card);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-lg);
  transition: transform 0.3s;
}

.summary-card:hover {
  transform: translateY(-3px);
}

.summary-card h3 {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 20px;
  text-align: center;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.summary-items {
  max-height: 320px;
  overflow-y: auto;
  margin-bottom: 20px;
  padding-right: 8px;
  scrollbar-width: thin;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.item-info {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.item-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-info small {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.item-total-price {
  font-weight: 700;
  color: var(--primary);
}

.summary-totals {
  border-top: 2px dashed var(--border-color);
  padding-top: 20px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.delivery-title {
  font-weight: 800;
  color: var(--text-main);
  font-size: 1rem;
}

.free {
  color: var(--success);
  font-weight: 700;
}

.intercity-alert {
  background: linear-gradient(145deg, var(--danger-light), transparent);
  border-left: 4px solid var(--danger);
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  margin: 15px 0;
  font-size: 0.85rem;
}

.alert-title {
  color: var(--danger);
  font-weight: 800;
  margin-bottom: 8px;
  font-size: 0.85rem;
}

.intercity-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.intercity-list li {
  padding: 4px 0;
  font-size: 0.8rem;
}

.weight-alert {
  background: var(--bg-input);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 15px;
  border: 1px solid var(--border-color);
}

.surcharge {
  color: var(--danger);
  font-weight: 800;
}

.final-price {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid var(--border-color);
  font-size: 1.5rem;
  font-weight: 800;
}

.price-val {
  font-size: 1.8rem;
  color: var(--primary);
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Модальное окно */
.modal-overlay {
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
  z-index: 9999;
  animation: fadeSlideUp 0.2s ease-out;
}

.modal-content {
  background: var(--bg-card);
  width: 90%;
  max-width: 450px;
  padding: 40px 35px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  text-align: center;
  border: 1px solid var(--border-color);
  animation: fadeSlideUp 0.3s ease-out;
}

.bank-title {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 15px;
}

.accent-pay {
  color: var(--primary);
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.amount-badge {
  background: linear-gradient(145deg, var(--primary-light), transparent);
  color: var(--primary);
  padding: 12px;
  border-radius: 60px;
  font-weight: 800;
  margin-bottom: 30px;
  font-size: 1.1rem;
  border: 1px solid var(--primary-light);
}

.card-inputs {
  text-align: left;
  margin-bottom: 30px;
}

.card-inputs label {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--text-muted);
  display: block;
  margin-bottom: 6px;
}

.card-inputs input {
  width: 100%;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  margin-bottom: 12px;
  transition: all 0.3s;
}

.card-inputs input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.card-row {
  display: flex;
  gap: 12px;
}

.card-row input {
  flex: 1;
}

.card-preview {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  color: white;
  padding: 25px;
  border-radius: var(--radius-md);
  text-align: left;
  margin-bottom: 30px;
  box-shadow: 0 15px 25px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.card-preview::after {
  content: '💳';
  position: absolute;
  bottom: 15px;
  right: 20px;
  font-size: 2rem;
  opacity: 0.3;
}

.preview-label {
  font-size: 0.65rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #94a3b8;
}

.preview-number {
  font-family: 'Monaco', monospace;
  font-size: 1.2rem;
  letter-spacing: 2px;
  margin: 12px 0;
  font-weight: 600;
}

.preview-footer {
  font-size: 0.7rem;
  color: #94a3b8;
}

.btn-confirm-pay {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 15px;
}

.btn-confirm-pay:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(230, 57, 70, 0.4);
}

.btn-text {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-text:hover {
  color: var(--danger);
}

.payment-loading {
  text-align: center;
  padding: 20px;
}

.payment-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--bg-input);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.payment-success {
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
  animation: pulseGlow 0.8s ease-out;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Пустая корзина */
.empty-cart-state {
  text-align: center;
  padding: 80px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  max-width: 500px;
  margin: 0 auto;
  border: 2px dashed var(--border-color);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  padding: 14px 32px;
  border-radius: var(--radius-md);
  font-weight: 700;
  border: none;
  margin-top: 20px;
  cursor: pointer;
}

/* Адаптивность */
@media (max-width: 1024px) {
  .checkout-layout {
    gap: 30px;
  }
}

@media (max-width: 992px) {
  .checkout-layout {
    flex-direction: column;
  }
  .checkout-sidebar {
    width: 100%;
    position: static;
  }
}

@media (max-width: 768px) {
  .checkout-page {
    padding: 20px 15px;
  }
  .page-title {
    font-size: 2rem;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .payment-methods-grid {
    grid-template-columns: 1fr;
  }
  .action-footer {
    flex-direction: column;
  }
  .btn-cancel,
  .btn-submit {
    width: 100%;
  }
  .checkout-section {
    padding: 20px;
  }
}
</style>