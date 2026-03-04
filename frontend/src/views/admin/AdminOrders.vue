<template>
  <div class="admin-orders">
    <h1>📦 Управление заказами</h1>

    <!-- 1. ФОРМА СОЗДАНИЯ ЗАКАЗА -->
    <section style="border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 30px; background: #fff; border-radius: 12px; box-shadow: var(--shadow-sm);">
      <h3 style="margin-top: 0;">Добавить новый заказ вручную</h3>
      <form @submit.prevent="createOrder" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        <input v-model="newOrder.user_id" type="number" placeholder="ID пользователя" style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;" />
        <input v-model="newOrder.total_price" type="number" placeholder="Сумма (₽)" required style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;" />
        <input v-model="newOrder.delivery_address" type="text" placeholder="Адрес доставки/ПВЗ" required style="padding: 10px; border-radius: 8px; border: 1px solid #ddd;" />
        
        <select v-model="newOrder.payment_method" style="padding: 10px; border-radius: 8px;">
          <option value="card">Карта</option>
          <option value="cash">Наличные</option>
          <option value="sbp">СБП</option>
        </select>

        <select v-model="newOrder.payment_status" style="padding: 10px; border-radius: 8px;">
          <option value="unpaid">Не оплачен</option>
          <option value="paid">Оплачен</option>
        </select>

        <select v-model="newOrder.delivery_status" style="padding: 10px; border-radius: 8px;">
          <option value="created">Обработка</option>
          <option value="shipping">Доставляется</option>
          <option value="awaiting">В ПВЗ</option>
        </select>

        <button type="submit" style="background: #4f46e5; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer;">
          Создать заказ
        </button>
      </form>
    </section>

    <hr />

    <!-- 2. УМНАЯ ФИЛЬТРАЦИЯ И ПОИСК -->
    <section style="background: #f8fafc; padding: 25px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; display: flex; align-items: center; gap: 10px;">🔍 Поиск и фильтры</h3>
      
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; align-items: flex-end;">
        <!-- Текстовый поиск -->
        <div>
          <label style="font-size: 0.8rem; font-weight: bold; color: #64748b;">Поиск (ID, User ID, Адрес):</label>
          <input v-model="searchQuery" placeholder="Начните вводить..." style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; margin-top: 5px;" />
        </div>

        <!-- Доставка -->
        <div>
          <label style="font-size: 0.8rem; font-weight: bold; color: #64748b;">Статус доставки:</label>
          <select v-model="filters.deliveryStatus" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; margin-top: 5px;">
            <option value="all">Все статусы</option>
            <option value="created">Новые</option>
            <option value="shipping">Доставляются</option>
            <option value="awaiting">В ПВЗ</option>
            <option value="delivered">Завершены</option>
            <option value="cancelled">Отменены</option>
          </select>
        </div>

        <!-- Оплата -->
        <div>
          <label style="font-size: 0.8rem; font-weight: bold; color: #64748b;">Статус оплаты:</label>
          <select v-model="filters.paymentStatus" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; margin-top: 5px;">
            <option value="all">Любая оплата</option>
            <option value="paid">Оплачено</option>
            <option value="unpaid">Не оплачено</option>
            <option value="awaiting_payment">Ожидает оплаты</option>
          </select>
        </div>

        <button @click="resetFilters" style="padding: 12px; background: white; border: 1px solid #cbd5e1; border-radius: 10px; cursor: pointer; font-weight: 600;">
          Сбросить всё
        </button>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА ЗАКАЗОВ -->
    <section>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0;">Всего найдено: {{ filteredOrders.length }}</h3>
      </div>

      <table border="1" style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <thead style="background: #f1f5f9;">
          <tr style="text-align: left;">
            <th style="padding: 15px;">ID / Дата</th>
            <th>Клиент</th>
            <th>Сумма (₽)</th>
            <th>Доставка</th>
            <th>Оплата</th>
            <th>Адрес</th>
            <th style="text-align: center;">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in paginatedOrders" :key="order.id" style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 15px;">
              <div style="font-weight: bold; color: #4f46e5;">#{{ order.id }}</div>
              <small style="color: #94a3b8;">{{ formatDate(order.created_at) }}</small>
            </td>
            
            <td>
              <div v-if="order.user_id">
                <span style="font-weight: 600;">User ID: {{ order.user_id }}</span>
              </div>
              <span v-else style="color: #94a3b8; font-style: italic;">Гость</span>
            </td>

            <td>
              <input v-model.number="order.total_price" type="number" @change="updateOrder(order)" style="width: 100px; padding: 8px; border-radius: 6px; border: 1px solid #ddd; font-weight: bold;" />
            </td>
            
            <td>
              <select v-model="order.delivery_status" @change="updateOrder(order)" 
                      :style="getDeliveryColor(order.delivery_status)"
                      style="padding: 8px; border-radius: 6px; border: 1px solid #ddd; font-weight: 600;">
                <option value="created">Обработка</option>
                <option value="shipping">Доставляется</option>
                <option value="awaiting">В ПВЗ</option>
                <option value="delivered">Завершен</option>
                <option value="cancelled">Отменен</option>
              </select>
            </td>

            <td>
              <select v-model="order.payment_status" @change="updateOrder(order)"
                      :style="{ color: order.payment_status === 'paid' ? '#10b981' : '#f43f5e' }"
                      style="padding: 8px; border-radius: 6px; border: 1px solid #ddd; font-weight: 600;">
                <option value="unpaid">Не оплачен</option>
                <option value="awaiting_payment">Ждет оплаты</option>
                <option value="paid">Оплачен</option>
              </select>
            </td>

            <td>
              <input v-model="order.delivery_address" type="text" @change="updateOrder(order)" style="width: 200px; padding: 8px; border-radius: 6px; border: 1px solid #ddd;" />
            </td>

            <td style="text-align: center;">
              <button @click="deleteOrder(order.id)" style="background: #fff1f2; color: #ef4444; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold;">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 4. ПАГИНАЦИЯ -->
      <div v-if="totalPages > 1" style="margin-top: 30px; display: flex; justify-content: center; align-items: center; gap: 10px;">
        <button @click="currentPage--" :disabled="currentPage === 1" style="padding: 10px 15px; border-radius: 8px; border: 1px solid #ddd; background: white; cursor: pointer;">← Пред.</button>
        
        <div style="display: flex; gap: 5px;">
          <button v-for="page in totalPages" :key="page" 
                  @click="currentPage = page"
                  :style="currentPage === page ? { background: '#4f46e5', color: 'white', borderColor: '#4f46e5' } : {}"
                  style="width: 40px; height: 40px; border-radius: 8px; border: 1px solid #ddd; background: white; cursor: pointer; font-weight: bold;">
            {{ page }}
          </button>
        </div>

        <button @click="currentPage++" :disabled="currentPage === totalPages" style="padding: 10px 15px; border-radius: 8px; border: 1px solid #ddd; background: white; cursor: pointer;">След. →</button>
      </div>
      
      <div v-if="filteredOrders.length === 0" style="text-align: center; padding: 50px; color: #94a3b8;">
        Заказов не найдено.
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import axios from 'axios';

const ADMIN_KEY = 'my_super_secret_admin_123';
const config = { headers: { 'x-admin-key': ADMIN_KEY } };

const orders = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 20;

// ОБЪЕКТ ФИЛЬТРОВ
const filters = reactive({
  deliveryStatus: 'all',
  paymentStatus: 'all'
});

const loadOrders = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/admin/orders', config);
    orders.value = res.data;
  } catch (e) {
    alert('Ошибка загрузки');
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  filters.deliveryStatus = 'all';
  filters.paymentStatus = 'all';
  currentPage.value = 1;
};

// --- УМНАЯ ФИЛЬТРАЦИЯ ---
const filteredOrders = computed(() => {
  let res = [...orders.value];

  // 1. Текстовый поиск (ID заказа, ID пользователя, Адрес)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(o => 
      o.id.toString() === q ||
      (o.user_id && o.user_id.toString() === q) ||
      o.delivery_address.toLowerCase().includes(q)
    );
  }

  // 2. Фильтр по статусу доставки
  if (filters.deliveryStatus !== 'all') {
    res = res.filter(o => o.delivery_status === filters.deliveryStatus);
  }

  // 3. Фильтр по статусу оплаты
  if (filters.paymentStatus !== 'all') {
    res = res.filter(o => o.payment_status === filters.paymentStatus);
  }

  return res;
});

// --- ПАГИНАЦИЯ ---
const totalPages = computed(() => Math.ceil(filteredOrders.value.length / itemsPerPage));

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredOrders.value.slice(start, end);
});

// Сброс страницы при изменении фильтров
watch([searchQuery, filters], () => {
  currentPage.value = 1;
});

// --- CRUD ОПЕРАЦИИ ---
const newOrder = reactive({ user_id: null, total_price: 0, delivery_address: '', payment_method: 'card', payment_status: 'unpaid', delivery_status: 'created' });

const createOrder = async () => {
  try {
    const res = await axios.post('/api/admin/orders', newOrder, config);
    orders.value.unshift(res.data);
    alert('Заказ создан');
  } catch (e) { alert('Ошибка'); }
};

const updateOrder = async (order) => {
  try { await axios.put(`/api/admin/orders/${order.id}`, order, config); } 
  catch (e) { alert('Ошибка обновления'); }
};

const deleteOrder = async (id) => {
  if (!confirm('Удалить заказ?')) return;
  try {
    await axios.delete(`/api/admin/orders/${id}`, config);
    orders.value = orders.value.filter(o => o.id !== id);
  } catch (e) { alert('Ошибка удаления'); }
};

// Хелперы
const formatDate = (d) => new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

const getDeliveryColor = (status) => {
    if (status === 'cancelled') return { color: '#ef4444' };
    if (status === 'delivered') return { color: '#10b981' };
    if (status === 'shipping') return { color: '#f59e0b' };
    return { color: '#4f46e5' };
};

onMounted(loadOrders);
</script>