<template>
  <div class="checkout-page" style="padding: 20px; max-width: 1200px; margin: 0 auto;">
    <h1 style="text-align: center; margin-bottom: 40px;">Оформление заказа</h1>

    <!-- СОСТОЯНИЕ ПУСТОЙ КОРЗИНЫ -->
    <div v-if="cartStore.items.length === 0" style="text-align: center; padding: 80px 0;">
      <h2>Ваша корзина пуста</h2>
      <router-link to="/catalog"><button style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px;">В каталог</button></router-link>
    </div>

    <div v-else style="display: flex; gap: 40px; align-items: flex-start;">
      
      <div style="flex: 2;">
        <!-- 1. КОНТАКТЫ -->
        <section style="border: 1px solid #eee; padding: 25px; border-radius: 12px; margin-bottom: 25px; background: white;">
          <h3 style="margin-top: 0; color: #2c3e50;">👤 Контактные данные</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
            <div>
              <label style="font-size: 0.9em; color: #666; font-weight: bold;">Имя *</label><br>
              <input v-model="form.name" placeholder="Имя Фамилия" required style="width: 100%; padding: 12px; margin-top:5px; border: 1px solid #ddd; border-radius: 6px;" />
            </div>
            <div>
              <label style="font-size: 0.9em; color: #666; font-weight: bold;">Телефон *</label><br>
              <input v-model="form.phone" type="tel" placeholder="+7..." required style="width: 100%; padding: 12px; margin-top:5px; border: 1px solid #ddd; border-radius: 6px;" />
            </div>
            <div>
              <label style="font-size: 0.9em; color: #666; font-weight: bold;">Email *</label><br>
              <input v-model="form.email" type="email" placeholder="mail@example.com" required style="width: 100%; padding: 12px; margin-top:5px; border: 1px solid #ddd; border-radius: 6px;" />
            </div>
          </div>
        </section>

        <!-- 2. ПВЗ -->
        <section style="border: 1px solid #eee; padding: 25px; border-radius: 12px; margin-bottom: 25px; background: white;">
          <h3 style="margin-top: 0; color: #2c3e50;">📍 Пункт выдачи в г. {{ appStore.city }}</h3>
          
          <div v-if="localWarehouses.length > 0">
            <select v-model="selectedWarehouseId" style="width: 100%; padding: 15px; border-radius: 8px; border: 2px solid #007bff; font-size: 1.1em; cursor: pointer; outline: none; margin-bottom: 20px;">
              <option :value="null">-- Выберите адрес --</option>
              <option v-for="w in localWarehouses" :key="w.id" :value="w.id">
                {{ w.address }}
              </option>
            </select>
          </div>
          <div v-else style="background: #fff3cd; color: #856404; padding: 20px; border-radius: 8px; border: 1px solid #ffeeba; text-align: center;">
            <h3>В г. {{ appStore.city }} нет ПВЗ</h3>
          </div>
        </section>

        <!-- 3. СПОСОБ ОПЛАТЫ -->
        <section style="border: 1px solid #eee; padding: 25px; border-radius: 12px; background: white;">
          <h3 style="margin-top: 0; color: #2c3e50;">💳 Способ оплаты</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <label v-for="m in paymentMethods" :key="m.id" 
                   :style="{ background: form.payment_method === m.id ? '#eef6ff' : '#f9f9f9', borderColor: form.payment_method === m.id ? '#475be8' : '#eee' }" 
                   style="border: 2px solid; padding: 15px; border-radius: 8px; cursor: pointer; text-align: center; transition: 0.2s;">
              <input type="radio" :value="m.id" v-model="form.payment_method" style="display: none;" />
              <div style="font-size: 1.5em; margin-bottom: 5px;">{{ m.icon }}</div>
              <strong>{{ m.label }}</strong>
            </label>
          </div>

          <!-- ВЫБОР СОХРАНЕННОЙ КАРТЫ -->
          <div v-if="form.payment_method === 'card'" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <h4 style="margin-bottom: 15px;">Выберите карту для оплаты:</h4>
            
            <div v-if="savedCards.length > 0" style="display: flex; flex-wrap: wrap; gap: 10px;">
              <div v-for="card in savedCards" :key="card.id" 
                   @click="selectedCardId = card.id"
                   :style="{ borderColor: selectedCardId === card.id ? '#475be8' : '#ddd', background: selectedCardId === card.id ? '#f0f2ff' : '#fff' }"
                   style="border: 2px solid; padding: 10px 15px; border-radius: 10px; cursor: pointer; min-width: 200px;">
                <div style="font-size: 0.7rem; color: #999; text-transform: uppercase;">{{ card.brand }}</div>
                <div style="font-family: monospace; font-weight: bold;">{{ card.card_number_masked }}</div>
              </div>
              
              <div @click="selectedCardId = 'new'"
                   :style="{ borderColor: selectedCardId === 'new' ? '#475be8' : '#ddd', background: selectedCardId === 'new' ? '#f0f2ff' : '#fff' }"
                   style="border: 2px solid; padding: 10px 15px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <span>+ Новая карта</span>
              </div>
            </div>

            <div v-else>
               <p style="color: #666; font-size: 0.9em;">У вас нет сохраненных карт. Вы сможете ввести данные на следующем шаге.</p>
               <button @click="selectedCardId = 'new'" v-if="selectedCardId !== 'new'" style="padding: 8px 15px; background: #eee; border: none; border-radius: 5px; cursor: pointer;">Оплатить новой картой</button>
            </div>
          </div>
        </section>

        <!-- КНОПКИ ДЕЙСТВИЯ -->
        <div style="margin-top: 30px; display: flex; gap: 15px;">
          <button @click="cancelOrder" style="width: 30%; padding: 18px; background: white; color: #e74c3c; border: 2px solid #e74c3c; border-radius: 8px; font-size: 1.1em; font-weight: bold; cursor: pointer;">
            ОТМЕНИТЬ
          </button>
          <button @click="handleOrderProcess" :disabled="loading || !selectedWarehouseId || (form.payment_method === 'card' && !selectedCardId)" 
                  :style="{ opacity: (loading || !selectedWarehouseId) ? 0.5 : 1 }"
                  style="width: 70%; padding: 18px; background: #27ae60; color: white; border: none; border-radius: 8px; font-size: 1.2em; font-weight: bold; cursor: pointer;">
            {{ loading ? 'ОБРАБОТКА...' : '✔ ПОДТВЕРДИТЬ И ОПЛАТИТЬ' }}
          </button>
        </div>
      </div>

      <!-- ПРАВАЯ ПАНЕЛЬ: ИТОГО С ДЕТАЛИЗАЦИЕЙ ДОСТАВКИ -->
      <div style="flex: 1; border: 1px solid #eee; padding: 25px; border-radius: 12px; background: white; position: sticky; top: 90px; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
        <h3 style="margin-top: 0;">Ваш заказ</h3>
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />
        
        <div v-for="item in cartStore.items" :key="item?.id" style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
           <div style="flex: 1; font-size: 0.9em; color: #444;">
             {{ item.name }} <br>
             <small style="color: #999;">{{ item.quantity }} шт. × {{ item.discount_price || item.price }} ₽</small>
           </div>
           <b>{{ (item.discount_price || item.price) * item.quantity }} ₽</b>
        </div>

        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        
        <div style="display: flex; justify-content: space-between; color: #666; margin-bottom: 10px;">
          <span>Сумма товаров:</span>
          <span>{{ cartStore.totalPriceFinal }} ₽</span>
        </div>

        <!-- ДЕТАЛИЗАЦИЯ ДОСТАВКИ -->
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; color: #333; margin-bottom: 5px;">
            <span>Доставка:</span>
            <span>{{ shippingBreakdown.cost === 0 ? 'Бесплатно' : shippingBreakdown.cost + ' ₽' }}</span>
          </div>

          <!-- Описание почему доставка платная (Межгород) -->
          <div v-if="shippingBreakdown.intercityItems.length > 0" style="background: #fff9f9; padding: 10px; border-radius: 8px; font-size: 0.85em; border: 1px solid #fde0e0; color: #555;">
             <div style="color: #e44d26; font-weight: bold; margin-bottom: 5px;">Едут из другого региона (Межгород):</div>
             <div v-for="i in shippingBreakdown.intercityItems" :key="i.id" style="display: flex; justify-content: space-between; margin-bottom: 3px;">
               <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">- {{ i.name }}</span>
               <span>({{ i.qty }} шт.)</span>
             </div>
             <div style="margin-top: 5px; border-top: 1px dashed #f5c6c6; padding-top: 5px; display: flex; justify-content: space-between;">
               <span>Базовый тариф:</span>
               <span>800 ₽</span>
             </div>
          </div>

          <!-- Описание надбавки за вес -->
          <div v-if="shippingBreakdown.weightSurcharge > 0" style="background: #f8f9fa; padding: 10px; border-radius: 8px; font-size: 0.85em; border: 1px solid #eee; color: #555; margin-top: 5px;">
             <div style="display: flex; justify-content: space-between; align-items: center;">
               <span>Перевес (Общий вес: {{ shippingBreakdown.totalWeight }} кг):</span>
               <span style="color: #e44d26; font-weight: bold;">+{{ shippingBreakdown.weightSurcharge }} ₽</span>
             </div>
             <div style="font-size: 0.75em; color: #999;">Более 10 кг (+50₽ за каждый кг)</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 20px; padding-top: 20px; border-top: 2px dashed #eee; font-size: 1.4em; font-weight: bold;">
          <span>Итого:</span>
          <span style="color: #e44d26;">{{ cartStore.totalPriceFinal + shippingBreakdown.cost }} ₽</span>
        </div>
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО ОПЛАТЫ (БЕЗ ИЗМЕНЕНИЙ) -->
    <div v-if="showPaymentModal" style="position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(15,23,42,0.8); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div style="background: white; width: 400px; padding: 35px; border-radius: 24px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.3);">
        
        <div v-if="paymentStep === 'loading'">
            <div class="payment-spinner" style="margin: 0 auto 20px; border: 4px solid #f3f3f3; border-top: 4px solid #475be8; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
            <h3>Связь с банком...</h3>
            <p style="color: #666;">Пожалуйста, не закрывайте страницу, идет авторизация транзакции.</p>
        </div>

        <div v-if="paymentStep === 'form'">
            <h2 style="margin-bottom: 5px;">ApexDrive <span style="color:#475be8">Pay</span></h2>
            <p style="margin-bottom: 20px; font-weight: bold;">Сумма к оплате: {{ cartStore.totalPriceFinal + shippingBreakdown.cost }} ₽</p>
            
            <div v-if="selectedCardId === 'new'" style="background: #f8fafc; padding: 20px; border-radius: 15px; text-align: left; margin-bottom: 20px; border: 1px solid #eee;">
                <label style="font-size: 10px; font-weight: bold; color: #999;">НОМЕР КАРТЫ</label>
                <input v-model="newCardData.number" placeholder="0000 0000 0000 0000" maxlength="16" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 8px;" />
                <div style="display: flex; gap: 10px;">
                    <input v-model="newCardData.expiry" placeholder="ММ/ГГ" maxlength="5" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
                    <input type="password" placeholder="CVC" maxlength="3" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
                </div>
            </div>

            <div v-else style="background: #1e293b; color: white; padding: 25px; border-radius: 15px; text-align: left; margin-bottom: 20px;">
                <div style="font-size: 12px; opacity: 0.7; margin-bottom: 10px;">ОПЛАТА СОХРАНЕННОЙ КАРТОЙ</div>
                <div style="font-size: 1.2rem; font-family: monospace; letter-spacing: 2px;">{{ getSelectedCardMask() }}</div>
                <div style="margin-top: 15px; font-size: 0.8rem;">ApexDrive Secure Transaction</div>
            </div>

            <button @click="processPayment" style="width: 100%; padding: 15px; background: #475be8; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 1.1rem;">
                ПОДТВЕРДИТЬ ОПЛАТУ
            </button>
            <button @click="showPaymentModal = false" style="margin-top: 15px; background: none; border: none; color: #999; cursor: pointer;">Отмена</button>
        </div>

        <div v-if="paymentStep === 'success'">
            <div style="width: 70px; height: 70px; background: #f0fdf4; color: #27ae60; font-size: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">✔</div>
            <h3>Оплата успешна!</h3>
            <p>Ваш заказ №{{ lastOrderId }} принят.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
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

// Фильтруем ПВЗ только для текущего города пользователя
const localWarehouses = computed(() => {
    return warehouses.value.filter(w => isSameCity(w.city_name, appStore.city) && w.is_pickup_point);
});

// 1. Остаток на конкретно ВЫБРАННОМ ПВЗ (Для зеленой галочки в интерфейсе)
const getStockAtSelected = (item) => {
    if (!selectedWarehouseId.value || !item?.product_stocks) return 0;
    const stock = item.product_stocks.find(s => s.warehouse_id === selectedWarehouseId.value);
    return stock ? stock.quantity : 0;
};

// 2. ИСПРАВЛЕНИЕ: Общий остаток во ВСЕМ ТЕКУЩЕМ ГОРОДЕ
const getStockInEntireCity = (item) => {
    if (!item?.product_stocks) return 0;
    
    let totalInCity = 0;
    item.product_stocks.forEach(stockRecord => {
        // Находим склад, к которому относится этот остаток
        const wh = warehouses.value.find(hw => hw.id === stockRecord.warehouse_id);
        // Если этот склад находится в городе пользователя, плюсуем остаток
        if (wh && isSameCity(wh.city_name, appStore.city)) {
            totalInCity += Number(stockRecord.quantity) || 0;
        }
    });
    
    return totalInCity;
};

// ОБНОВЛЕННАЯ И ТОЧНАЯ ЛОГИКА ДОСТАВКИ
const shippingBreakdown = computed(() => {
    if (!selectedWarehouseId.value) return { cost: 0, intercityItems: [], weightSurcharge: 0, totalWeight: 0 };
    if (cartStore.totalPriceFinal > 50000) return { cost: 0, intercityItems: [], weightSurcharge: 0, totalWeight: 0 };
    
    let intercityItems = [];
    
    // Проходим по всей корзине
    cartStore.items.forEach(item => { 
      // Считаем сумму этого товара на ВСЕХ складах ТЕКУЩЕГО города
      const cityStock = getStockInEntireCity(item);
      
      // Если клиент хочет больше, чем есть суммарно во всем городе,
      // то разницу (недостаток) мы повезем из другого города (Межгород)
      if (item.quantity > cityStock) {
        intercityItems.push({ 
            name: item.name, 
            id: item.id, 
            qty: item.quantity - cityStock // Вот это количество поедет Межгородом
        });
      }
    });
    
    // Считаем доплату за вес
    const totalWeight = Math.ceil(cartStore.totalWeight || 0);
    const weightSurcharge = totalWeight > 10 ? (totalWeight - 10) * 50 : 0;
    
    // Если ни один товар не едет межгородом и нет перевеса
    if (intercityItems.length === 0 && weightSurcharge === 0) {
      return { cost: 0, intercityItems: [], weightSurcharge: 0, totalWeight };
    }

    // Если есть хотя бы 1 товар межгород (из другого региона) — берем базовые 800 руб.
    const baseCost = intercityItems.length > 0 ? 800 : 0;
    const finalCost = baseCost + weightSurcharge;

    return { cost: finalCost, intercityItems, weightSurcharge, totalWeight };
});

const getSelectedCardMask = () => {
    const card = savedCards.value.find(c => c.id === selectedCardId.value);
    return card ? card.card_number_masked : '**** **** **** ****';
};

onMounted(async () => {
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
    if (selectedCardId.value === 'new' && newCardData.number.length < 16) return alert("Введите карту");
    paymentStep.value = 'loading';
    
    setTimeout(async () => {
        await submitOrder('paid');
        
        if (selectedCardId.value === 'new') {
            const uid = localStorage.getItem('user_id');
            if (uid) {
              await axios.post('/api/cards', { 
                  user_id: uid, 
                  number: newCardData.number, 
                  holder: 'CUSTOMER', 
                  expiry: newCardData.expiry 
              });
            }
        }
        
        paymentStep.value = 'success';
        setTimeout(() => { 
            router.push('/profile'); 
            cartStore.clearCart(); 
        }, 2000);
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
    } catch (e) { 
        alert(e.response?.data?.error || "Ошибка заказа"); 
    } finally { 
        loading.value = false; 
    }
};

const cancelOrder = () => router.push('/cart');
</script>