<template>
  <div class="orders-page" style="max-width: 1000px; margin: 0 auto; padding: 20px;">
    <div class="header-section" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
      <h1 style="margin: 0;">📦 Мои заказы</h1>
      <router-link to="/profile" class="back-link" style="text-decoration: none; color: #475be8; font-weight: 600;">← В профиль</router-link>
    </div>

    <!-- ТАБЫ (ФИЛЬТРЫ) -->
    <div class="status-tabs" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 25px; background: #f1f5f9; padding: 5px; border-radius: 12px;">
      <button v-for="tab in tabs" :key="tab.id" 
              @click="activeTab = tab.id" 
              :style="activeTab === tab.id ? { background: '#fff', color: '#475be8', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' } : { color: '#64748b' }"
              style="border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.2s;">
        {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" style="text-align: center; padding: 50px;"><div class="loader"></div></div>

    <div v-else class="orders-list">
      <div v-if="filteredOrders.length === 0" style="text-align: center; color: #94a3b8; padding: 40px;">
        Заказов не найдено.
      </div>

      <div v-for="order in filteredOrders" :key="order.id" class="order-card" 
           style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
        
        <!-- Верхняя часть: Номер и Статусы -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
          <div>
            <span style="font-weight: 800; font-size: 1.1rem; color: #1e293b;">Заказ №{{ order.id }}</span>
            <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 4px;">от {{ formatDate(order.created_at) }}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <span :style="getDeliveryStatusStyle(order.delivery_status)" style="padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">
              {{ translateDelivery(order.delivery_status) }}
            </span>
            <span :style="getPaymentStatusStyle(order.payment_status)" style="padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; border: 1px solid #e2e8f0;">
              {{ translatePaymentStatus(order.payment_status) }}
            </span>
          </div>
        </div>

        <div style="font-size: 0.9rem; color: #475569; margin-bottom: 20px; padding: 12px; background: #f8fafc; border-radius: 10px; border: 1px solid #edf2f7;">
            📍 <b>Пункт выдачи:</b> {{ order.delivery_address }}
        </div>

        <!-- БЛОК УПРАВЛЕНИЯ ОПЛАТОЙ -->
        <div v-if="order.payment_status !== 'paid' && order.delivery_status !== 'cancelled'" 
             style="background: #fffbeb; border: 1px solid #fef3c7; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
              <label style="font-size: 0.85rem; color: #92400e; font-weight: bold; display: block; margin-bottom: 5px;">Способ оплаты:</label>
              <!-- ВАЖНО: Выбор метода не пропадает даже если окно закрыто -->
              <select :value="order.payment_method" @change="changePaymentMethod(order, $event.target.value)" 
                      style="padding: 8px; border-radius: 6px; border: 1px solid #fcd34d; background: white; cursor: pointer;">
                <option value="card_pickup">Картой при получении</option>
                <option value="cash">Наличными</option>
                <option value="card">Картой онлайн (Скидка 2%)</option>
              </select>
            </div>
            
            <!-- Кнопка оплаты видна, если метод выбран card и заказ еще не оплачен -->
            <button v-if="order.payment_method === 'card'" @click="openPaymentModal(order)"
                    style="background: #475be8; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 700;">
              💳 Оплатить {{ order.total_price }} ₽
            </button>
          </div>
        </div>

        <!-- Состав заказа (С ВОЗМОЖНОСТЬЮ ПЕРЕХОДА) -->
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
            <div v-for="item in order.order_items" :key="item.id" style="display: flex; align-items: center; gap: 15px;">
                
                <router-link :to="'/product/' + item.product_id" style="display: block; position: relative;">
                  <img :src="item.products?.image_url || '/assets/images/no-photo.png'" 
                       @error="$event.target.src = '/assets/images/no-photo.png'"
                       style="width: 50px; height: 50px; object-fit: contain; border: 1px solid #eee; border-radius: 8px;" />
                </router-link>

                <div style="flex: 1;">
                    <router-link :to="'/product/' + item.product_id" style="text-decoration: none;">
                      <div style="font-weight: 600; font-size: 0.9rem; color: #1e293b; cursor: pointer;">
                        {{ item.products?.name || 'Товар удален' }}
                      </div>
                    </router-link>
                    <div style="font-size: 0.8rem; color: #64748b;">{{ item.quantity }} шт. × {{ item.unit_price }} ₽</div>
                </div>

                <div style="font-weight: 700; color: #1e293b;">{{ item.unit_price * item.quantity }} ₽</div>
            </div>
        </div>

        <!-- Футер карточки -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          <div style="font-size: 1.2rem; font-weight: 800;">{{ order.total_price }} ₽</div>
          
          <div style="display: flex; gap: 10px;">
              <button @click="reorder(order)" style="background: #f1f5f9; color: #475569; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600;">Повторить заказ</button>
              <button v-if="!['delivered', 'cancelled'].includes(order.delivery_status)" @click="cancelOrder(order)" style="background: #fff; color: #ef4444; border: 1px solid #fee2e2; padding: 10px 15px; border-radius: 8px; cursor: pointer;">Отменить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 💳 ОКНО ОПЛАТЫ (С подробной информацией) -->
    <div v-if="showPaymentModal" style="position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(15,23,42,0.9); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div style="background: white; width: 500px; padding: 30px; border-radius: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.4);">
        
        <div v-if="paymentStep === 'form'">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">Оплата заказа №{{ currentOrder.id }}</h2>
                <button @click="showPaymentModal = false" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
            </div>

            <!-- ИНФОРМАЦИЯ О ЗАКАЗЕ ВНУТРИ ОПЛАТЫ -->
            <div style="background: #f8fafc; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #edf2f7; max-height: 150px; overflow-y: auto;">
                <div v-for="item in currentOrder.order_items" :key="item.id" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <img :src="item.products?.image_url" @error="$event.target.src = '/assets/images/no-photo.png'" width="30" height="30" style="object-fit: contain; background: white; border-radius: 4px;" />
                    <span style="font-size: 0.8rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ item.products?.name }}</span>
                    <span style="font-weight: bold; font-size: 0.8rem;">x{{ item.quantity }}</span>
                </div>
            </div>

            <!-- ВЫБОР КАРТЫ -->
            <h4 style="margin-bottom: 10px;">Выберите карту:</h4>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                <div v-for="card in savedCards" :key="card.id" 
                     @click="selectedCardId = card.id"
                     :style="{ borderColor: selectedCardId === card.id ? '#475be8' : '#e2e8f0', background: selectedCardId === card.id ? '#f0f2ff' : '#fff' }"
                     style="border: 2px solid; padding: 12px; border-radius: 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 800;">{{ card.brand }}</div>
                        <div style="font-family: monospace; font-weight: bold;">{{ card.card_number_masked }}</div>
                    </div>
                    <div v-if="selectedCardId === card.id" style="color: #475be8;">✔</div>
                </div>

                <div @click="selectedCardId = 'new'"
                     :style="{ borderColor: selectedCardId === 'new' ? '#475be8' : '#e2e8f0', background: selectedCardId === 'new' ? '#f0f2ff' : '#fff' }"
                     style="border: 2px solid; padding: 12px; border-radius: 12px; cursor: pointer; text-align: center; font-weight: 600;">
                     + Ввести данные новой карты
                </div>
            </div>

            <!-- ВВОД НОВОЙ КАРТЫ (Если выбрано 'new') -->
            <div v-if="selectedCardId === 'new'" style="margin-bottom: 20px; padding: 15px; background: #f1f5f9; border-radius: 12px;">
                <input v-model="newCardData.number" placeholder="Номер карты (16 цифр)" maxlength="16" style="width: 100%; padding: 10px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #ddd;" />
                <div style="display: flex; gap: 10px;">
                    <input v-model="newCardData.expiry" placeholder="ММ/ГГ" maxlength="5" style="flex: 1; padding: 10px; border-radius: 6px; border: 1px solid #ddd;" />
                    <input type="password" placeholder="CVC" maxlength="3" style="flex: 1; padding: 10px; border-radius: 6px; border: 1px solid #ddd;" />
                </div>
            </div>

            <button @click="confirmPayment" style="width: 100%; padding: 18px; background: #27ae60; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 1.1rem; box-shadow: 0 10px 15px rgba(39, 174, 96, 0.2);">
                ОПЛАТИТЬ {{ currentOrder.total_price }} ₽
            </button>
        </div>

        <div v-if="paymentStep === 'loading'" style="text-align: center; padding: 40px 0;">
            <div class="spinner"></div>
            <h3>Авторизация...</h3>
        </div>

        <div v-if="paymentStep === 'success'" style="text-align: center; padding: 30px 0;">
            <div style="width: 80px; height: 80px; background: #f0fdf4; color: #27ae60; font-size: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">✔</div>
            <h2>Оплата прошла успешно!</h2>
            <p style="color: #666;">Статус заказа №{{ currentOrder.id }} изменен на "Оплачен".</p>
        </div>
      </div>
    </div>
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

// Оплата
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

// СМЕНА СПОСОБА ОПЛАТЫ (С ВЫЗОВОМ ОКНА)
const changePaymentMethod = async (order, newMethod) => {
    try {
        // Сохраняем в базу новый метод оплаты
        const res = await axios.patch(`/api/orders/${order.id}`, { payment_method: newMethod });
        order.payment_method = res.data.payment_method;
        
        // Если выбрали карту, сразу открываем окно оплаты.
        // Если окно закроют крестиком, метод все равно останется "card", 
        // и кнопка "Оплатить" будет ждать следующего нажатия.
        if (newMethod === 'card') {
            openPaymentModal(order);
        }
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
            // 1. Обновляем статус заказа
            await axios.patch(`/api/orders/${currentOrder.value.id}`, { payment_status: 'paid' });
            currentOrder.value.payment_status = 'paid';

            // 2. Если карта новая — сохраняем ее для будущих покупок
            if (selectedCardId.value === 'new') {
                await axios.post('/api/cards', {
                    user_id: userId,
                    number: newCardData.number,
                    holder: 'CUSTOMER',
                    expiry: newCardData.expiry
                });
            }

            paymentStep.value = 'success';
            setTimeout(() => {
                showPaymentModal.value = false;
            }, 2000);

        } catch (e) {
            alert("Ошибка при проведении платежа");
            paymentStep.value = 'form';
        }
    }, 1500);
};

// Исправленный Reorder (передаем stock_quantity: 999 для обхода блокировки)
const reorder = (order) => {
  if (!order || !order.order_items) return;
  order.order_items.forEach(item => {
    if (item.products) {
      cartStore.addToCart({ 
        ...item.products, 
        price: item.unit_price, 
        stock_quantity: 999 
      });
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

// Хелперы
const formatDate = (d) => new Date(d).toLocaleDateString('ru-RU');
const translateDelivery = (s) => ({ 'created': 'Обработка', 'shipping': 'В пути', 'awaiting': 'В пункте выдачи', 'delivered': 'Получен', 'cancelled': 'Отменен' }[s]);
const translatePaymentStatus = (s) => ({ 'paid': 'Оплачен ✅', 'awaiting_payment': 'Ждет оплаты', 'unpaid': 'Не оплачен' }[s] || 'Ожидание');
const getDeliveryStatusStyle = (s) => s === 'cancelled' ? { background: '#fee2e2', color: '#ef4444' } : s === 'delivered' ? { background: '#d1fae5', color: '#10b981' } : { background: '#eef2ff', color: '#4f46e5' };
const getPaymentStatusStyle = (s) => s === 'paid' ? { color: '#10b981' } : { color: '#f59e0b' };

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