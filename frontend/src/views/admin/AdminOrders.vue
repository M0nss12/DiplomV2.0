<template>
  <div class="admin-orders">
    <!-- ШАПКА -->
    <div class="header-row">
      <div class="header-left">
        <h1>📦 Управление заказами</h1>
        <p class="subtitle">Конструктор заказов: авторасчет логистики (база 800 ₽ + перевес > 10кг).</p>
      </div>
      <div class="stats-badge">
        <span class="stats-icon">📊</span>
        Всего: <b>{{ orders.length }}</b>
      </div>
    </div>

    <!-- 1. КОНСТРУКТОР НОВОГО ЗАКАЗА -->
    <section class="admin-card create-card">
      <div class="card-header">
        <h3 class="card-title">✨ Конструктор нового заказа</h3>
        <div class="card-decoration"></div>
      </div>
      <form @submit.prevent="createOrder" class="admin-form">
        <div class="input-grid">
          <div class="input-group">
            <label>👤 Выберите клиента</label>
            <select v-model="newOrder.user_id">
              <option :value="null">-- Оформить как гостя --</option>
              <option v-for="u in users" :key="u.id" :value="u.id">
                {{ u.last_name || '' }} {{ u.first_name }} ({{ u.email || u.phone_number || u.id }})
              </option>
            </select>
          </div>

          <div class="input-group">
            <label>📍 Пункт выдачи (ПВЗ)</label>
            <select v-model="newOrder.delivery_address" required>
              <option value="">-- Выберите адрес из списка --</option>
              <option v-for="w in warehouses" :key="w.id" :value="`${w.city_name}, ${w.address}`">
                {{ w.city_name }} — {{ w.address }}
              </option>
            </select>
          </div>

          <div class="input-group">
            <label>💳 Способ оплаты</label>
            <select v-model="newOrder.payment_method">
              <option value="card">Банковская карта</option>
              <option value="cash">Наличные / QR</option>
              <option value="sbp">СБП</option>
            </select>
          </div>
        </div>

        <!-- ТОВАРЫ В КОНСТРУКТОРЕ -->
        <div class="products-selector-section">
          <h4>🛒 Выбор товаров:</h4>
          <div v-for="(item, index) in selectedProducts" :key="index" class="selector-row-advanced">
            <div class="sel-main">
                <select v-model="item.product_id" @change="updateItemData(index)" class="prod-select">
                    <option :value="null">-- Выберите запчасть или аксессуар --</option>
                    <option v-for="p in products" :key="p.id" :value="p.id">
                        {{ p.name }} | Арт: {{ p.sku }} | ({{ p.weight_kg }} кг)
                    </option>
                </select>
                <div class="item-sub-info" v-if="item.product_id">
                    <span>Вес ед.: <b>{{ item.weight }} кг</b></span>
                    <span>Цена ед.: <b>{{ item.price.toLocaleString() }} ₽</b></span>
                </div>
            </div>
            
            <div class="sel-qty">
                <label>Кол-во:</label>
                <input v-model.number="item.quantity" type="number" min="1" @input="autoCalcShipping" class="qty-input" />
            </div>

            <div class="sel-total">
                <div class="st-price">{{ (item.price * item.quantity).toLocaleString() }} ₽</div>
                <div class="st-weight">{{ (item.weight * item.quantity).toFixed(1) }} кг</div>
            </div>

            <button type="button" @click="removeProductFromNewOrder(index)" class="btn-remove">✕</button>
          </div>
          
          <button type="button" @click="addProductToNewOrder" class="btn-add-prod">
            ➕ Добавить позицию в чек
          </button>
        </div>

        <!-- ИТОГИ -->
        <div class="constructor-footer">
          <div class="summary-pills">
            <div class="pill">Общий вес: <strong>{{ totals.weight.toFixed(1) }} кг</strong></div>
            <div class="pill">Товаров на: <strong>{{ totals.itemsPrice.toLocaleString() }} ₽</strong></div>
          </div>

          <div class="shipping-adjustment">
            <label>🚚 Доставка (можно править):</label>
            <div class="ship-input-wrap">
                <input v-model.number="newOrder.shipping_cost" type="number" class="shipping-input-main" />
                <span class="currency">₽</span>
            </div>
            <small v-if="totals.weight > 10" class="weight-warning">
                ⚠️ Перевес {{ (totals.weight - 10).toFixed(1) }} кг (+{{ Math.ceil(totals.weight - 10) * 50 }} ₽)
            </small>
          </div>

          <div class="grand-total">
            <label>ИТОГО К ОПЛАТЕ</label>
            <div class="total-val">{{ (totals.itemsPrice + newOrder.shipping_cost).toLocaleString() }} ₽</div>
          </div>
          
          <button type="submit" class="btn-primary-lg" :disabled="selectedProducts.length === 0 || !newOrder.delivery_address">
            ✅ Создать и отправить в работу
          </button>
        </div>
      </form>
    </section>

    <!-- 2. МОЩНЫЕ ФИЛЬТРЫ -->
    <section class="admin-card filter-section">
      <div class="filter-header">
        <h3 class="card-title">🔍 Поиск и фильтрация</h3>
        <button @click="resetFilters" class="btn-text-link">Сбросить всё</button>
      </div>
      <div class="filter-grid-pro">
        <div class="input-group search">
          <label>🔎 Поиск по всем полям</label>
          <input v-model="filters.query" placeholder="ФИО, № заказа, Почта, Город..." />
        </div>
        
        <div class="input-group">
          <label>🚚 Доставка</label>
          <select v-model="filters.deliveryStatus">
            <option value="all">Все статусы</option>
            <option value="created">Обработка</option>
            <option value="shipping">В пути</option>
            <option value="delivered">Выдан</option>
            <option value="cancelled">Отменен</option>
          </select>
        </div>

        <div class="input-group">
          <label>💰 Оплата</label>
          <select v-model="filters.paymentStatus">
            <option value="all">Все</option>
            <option value="paid">Оплачен</option>
            <option value="unpaid">Не оплачен</option>
          </select>
        </div>

        <div class="input-group">
          <label>📊 Сортировка</label>
          <select v-model="filters.sort">
            <option value="new">Сначала новые</option>
            <option value="old">Сначала старые</option>
            <option value="price-desc">Дорогие сверху</option>
            <option value="price-asc">Дешевые сверху</option>
          </select>
        </div>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА (исправлена структура) -->
    <div class="table-container">
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-id">Заказ / Дата</th>
              <th>Клиент</th>
              <th>Финансы</th>
              <th>Логистика</th>
              <th>Оплата</th>
              <th>Адрес назначения (ПВЗ)</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="order in paginatedOrders" :key="order.id">
              <tr class="order-row-main">
                <td class="col-id">
                  <div class="order-id-badge">#{{ order.id }}</div>
                  <div class="date-sub">{{ formatDate(order.created_at) }}</div>
                </td>
                
                <td>
                  <div class="user-cell">
                    <strong>{{ getUserName(order.user_id) }}</strong>
                    <small>{{ getUserContacts(order.user_id) }}</small>
                  </div>
                </td>
                
                <td>
                  <div class="price-edit-group">
                    <div class="edit-row"><span>📦 Товары:</span> <input v-model.number="order.total_price" type="number" @change="updateOrder(order)" /></div>
                    <div class="edit-row shipping"><span>🚚 Дост:</span> <input v-model.number="order.shipping_cost" type="number" @change="updateOrder(order)" /></div>
                  </div>
                </td>

                <td>
                  <select v-model="order.delivery_status" @change="updateOrder(order)" class="status-select" :class="order.delivery_status">
                    <option value="created">Обработка</option>
                    <option value="shipping">В пути</option>
                    <option value="awaiting">В ПВЗ</option>
                    <option value="delivered">Выдан</option>
                    <option value="cancelled">Отменен</option>
                  </select>
                </td>

                <td>
                  <select v-model="order.payment_status" @change="updateOrder(order)" class="status-select" :class="order.payment_status">
                    <option value="unpaid">Не оплачен</option>
                    <option value="paid">Оплачен</option>
                    <option value="awaiting_payment">Ждет</option>
                  </select>
                  <div class="pay-method-small">{{ order.payment_method }}</div>
                </td>

                <td>
                  <select v-model="order.delivery_address" @change="updateOrder(order)" class="inline-select-addr">
                    <option v-for="w in warehouses" :key="w.id" :value="`${w.city_name}, ${w.address}`">
                      {{ w.city_name }}, {{ w.address }}
                    </option>
                  </select>
                </td>

                <td class="text-right">
                  <div class="btn-group-row">
                    <button @click="toggleItems(order.id)" class="btn-view-items" :class="{ 'active': expandedOrder === order.id }">
                      🛒 Состав
                    </button>
                    <button @click="deleteOrder(order.id)" class="btn-del">🗑️</button>
                  </div>
                </td>
              </tr>

              <!-- РАСКРЫВАЮЩАЯСЯ СТРОКА С СОСТАВОМ ЗАКАЗА -->
              <tr v-if="expandedOrder === order.id" class="expand-row">
                <td colspan="7">
                  <div class="order-items-detail">
                    <h4>🛒 Перечень товаров в заказе #{{ order.id }}:</h4>
                    <div class="items-grid-pro">
                      <div v-for="item in getOrderItems(order.id)" :key="item.id" class="item-row-pro">
                        <img :src="getProductData(item.product_id).image_url || '/assets/images/no-photo.png'" class="ipro-img" />
                        <div class="ipro-info">
                          <div class="ipro-name">{{ getProductData(item.product_id).name }}</div>
                          <div class="ipro-meta">
                            <span class="qty-badge">{{ item.quantity }} шт.</span>
                            <span class="price-tag">× {{ item.unit_price }} ₽</span>
                            <span class="weight-tag">({{ getProductData(item.product_id).weight_kg || 0 }} кг/ед)</span>
                          </div>
                        </div>
                        <div class="ipro-sum">{{ (item.quantity * item.unit_price).toLocaleString() }} ₽</div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ПАГИНАЦИЯ -->
    <div v-if="totalPages > 1" class="pagination-wrapper">
        <button @click="currentPage--" :disabled="currentPage === 1" class="p-btn">←</button>
        <div class="p-numbers">
          <button v-for="page in totalPages" :key="page" @click="currentPage = page" :class="{ active: currentPage === page }">{{ page }}</button>
        </div>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-btn">→</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue';
import axios from 'axios';

const ADMIN_KEY = 'my_super_secret_admin_123';
const config = { headers: { 'x-admin-key': ADMIN_KEY } };

const orders = ref([]);
const users = ref([]);
const products = ref([]);
const warehouses = ref([]);
const orderItems = ref([]);

const expandedOrder = ref(null);
const currentPage = ref(1);
const itemsPerPage = 15;

const filters = reactive({
    query: '',
    deliveryStatus: 'all',
    paymentStatus: 'all',
    sort: 'new'
});

const selectedProducts = ref([]);
const newOrder = reactive({ user_id: null, delivery_address: '', payment_method: 'card', shipping_cost: 800 });

// КОНСТРУКТОР ЛОГИКА
const addProductToNewOrder = () => selectedProducts.value.push({ product_id: null, quantity: 1, price: 0, weight: 0 });
const removeProductFromNewOrder = (index) => { selectedProducts.value.splice(index, 1); autoCalcShipping(); };
const updateItemData = (index) => {
    const item = selectedProducts.value[index];
    const prod = products.value.find(p => p.id === item.product_id);
    if (prod) {
        item.price = prod.discount_price || prod.price;
        item.weight = prod.weight_kg || 0;
    }
    autoCalcShipping();
};

const autoCalcShipping = () => {
    let w = 0;
    selectedProducts.value.forEach(i => w += (i.weight * i.quantity));
    let cost = 800;
    if (w > 10) cost += Math.ceil(w - 10) * 50;
    newOrder.shipping_cost = cost;
};

const totals = computed(() => {
    let itemsPrice = 0; let weight = 0;
    selectedProducts.value.forEach(item => { itemsPrice += item.price * item.quantity; weight += item.weight * item.quantity; });
    return { itemsPrice, weight };
});

// ЗАГРУЗКА
const loadData = async () => {
  try {
    const [oRes, uRes, pRes, iRes, wRes] = await Promise.all([
      axios.get('/api/admin/orders', config), axios.get('/api/admin/users', config),
      axios.get('/api/admin/products', config), axios.get('/api/admin/order_items', config),
      axios.get('/api/admin/warehouses', config)
    ]);
    orders.value = oRes.data; users.value = uRes.data; products.value = pRes.data;
    orderItems.value = iRes.data; warehouses.value = wRes.data;
  } catch (e) { console.error(e); }
};

// ХЕЛПЕРЫ
const getUserName = (id) => {
    const u = users.value.find(user => user.id === id);
    return u ? `${u.last_name || ''} ${u.first_name}` : 'Гость';
};
const getUserContacts = (id) => {
    const u = users.value.find(user => user.id === id);
    return u ? (u.email || u.phone_number || '') : '';
};
const getProductData = (id) => products.value.find(p => p.id === id) || {};
const getOrderItems = (orderId) => orderItems.value.filter(item => item.order_id === orderId);

// API ДЕЙСТВИЯ
const createOrder = async () => {
  try {
    const payload = { ...newOrder, total_price: totals.value.itemsPrice + newOrder.shipping_cost, payment_status: 'unpaid', delivery_status: 'created', created_at: new Date().toISOString() };
    const res = await axios.post('/api/admin/orders', payload, config);
    for (const item of selectedProducts.value) {
        await axios.post('/api/admin/order_items', { order_id: res.data.id, product_id: item.product_id, quantity: item.quantity, unit_price: item.price }, config);
    }
    alert('Заказ успешно создан'); location.reload();
  } catch (e) { alert('Ошибка'); }
};

const updateOrder = async (order) => await axios.put(`/api/admin/orders/${order.id}`, order, config);
const deleteOrder = async (id) => {
  if (confirm('Удалить заказ?')) {
    await axios.delete(`/api/admin/orders/${id}`, config);
    orders.value = orders.value.filter(o => o.id !== id);
  }
};

const formatDate = (d) => new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const toggleItems = (id) => expandedOrder.value = expandedOrder.value === id ? null : id;
const resetFilters = () => { filters.query = ''; filters.deliveryStatus = 'all'; filters.paymentStatus = 'all'; filters.sort = 'new'; };

// УМНАЯ ФИЛЬТРАЦИЯ
const filteredOrders = computed(() => {
    let res = [...orders.value];
    if (filters.query) {
        const q = filters.query.toLowerCase();
        res = res.filter(o => {
            const u = users.value.find(user => user.id === o.user_id) || {};
            return o.id.toString() === q || o.delivery_address.toLowerCase().includes(q) || 
                   (u.first_name || '').toLowerCase().includes(q) || (u.last_name || '').toLowerCase().includes(q) ||
                   (u.email || '').toLowerCase().includes(q);
        });
    }
    if (filters.deliveryStatus !== 'all') res = res.filter(o => o.delivery_status === filters.deliveryStatus);
    if (filters.paymentStatus !== 'all') res = res.filter(o => o.payment_status === filters.paymentStatus);
    
    if (filters.sort === 'new') res.sort((a, b) => b.id - a.id);
    else if (filters.sort === 'old') res.sort((a, b) => a.id - b.id);
    else if (filters.sort === 'price-desc') res.sort((a, b) => (b.total_price + b.shipping_cost) - (a.total_price + a.shipping_cost));
    else if (filters.sort === 'price-asc') res.sort((a, b) => (a.total_price + a.shipping_cost) - (b.total_price + b.shipping_cost));
    return res;
});

const totalPages = computed(() => Math.ceil(filteredOrders.value.length / itemsPerPage));
const paginatedOrders = computed(() => filteredOrders.value.slice((currentPage.value - 1) * itemsPerPage, currentPage.value * itemsPerPage));

onMounted(loadData);
</script>

<style scoped>
/* ==========================================================================
   АДМИНКА: УПРАВЛЕНИЕ ЗАКАЗАМИ – СОВРЕМЕННЫЙ СТИЛЬ (БЕЗ КРАСНЫХ ВЫДЕЛЕНИЙ)
   ========================================================================== */

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulseGlow {
  0% { box-shadow: 0 0 0 0 var(--primary-light); }
  70% { box-shadow: 0 0 0 8px rgba(230, 57, 70, 0); }
  100% { box-shadow: 0 0 0 0 rgba(230, 57, 70, 0); }
}

.admin-orders {
  padding: 40px 24px;
  animation: fadeSlideUp 0.5s ease-out;
  color: var(--text-main);
}

/* ШАПКА */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 32px;
}

.header-left h1 {
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0 0 6px 0;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--text-muted);
  margin: 0;
  font-size: 0.95rem;
}

.stats-badge {
  background: var(--bg-card);
  backdrop-filter: blur(4px);
  border: 1px solid var(--border-color);
  padding: 10px 20px;
  border-radius: 60px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-sm);
}

.stats-icon {
  font-size: 1.2rem;
}

/* КАРТОЧКИ */
.admin-card {
  background: var(--bg-card);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 28px;
  margin-bottom: 32px;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  box-shadow: var(--shadow-sm);
}

.admin-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.card-title {
  font-size: 1.35rem;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-decoration {
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  border-radius: 3px;
}

/* ФОРМА СОЗДАНИЯ */
.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
  margin-bottom: 28px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-main);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.input-group input:focus,
.input-group select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
  outline: none;
  transform: scale(1.01);
}

/* Секция выбора товаров */
.products-selector-section {
  background: var(--bg-input);
  padding: 20px;
  border-radius: var(--radius-md);
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
}

.selector-row-advanced {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 15px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  border: 1px solid var(--border-color);
}

.sel-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.item-sub-info {
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  gap: 15px;
}

.sel-qty {
  width: 90px;
}

.sel-qty input {
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
}

.sel-total {
  width: 120px;
  text-align: right;
}

.st-price {
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--primary);
}

.st-weight {
  font-size: 11px;
  color: var(--text-muted);
}

.btn-remove {
  background: var(--danger-light);
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: var(--danger);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: var(--danger);
  color: white;
  transform: scale(1.05);
}

.btn-add-prod {
  background: var(--primary-light);
  border: 1px dashed var(--primary);
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.btn-add-prod:hover {
  background: var(--primary);
  color: white;
  transform: translateY(-2px);
}

/* Итоговая панель конструктора */
.constructor-footer {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr auto;
  gap: 30px;
  align-items: center;
  background: var(--bg-input);
  padding: 25px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.summary-pills {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pill {
  padding: 6px 12px;
  background: var(--bg-card);
  border-radius: 8px;
  font-size: 13px;
  border: 1px solid var(--border-color);
}

.shipping-adjustment {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ship-input-wrap {
  position: relative;
  width: 140px;
}

.shipping-input-main {
  width: 100%;
  padding: 10px 30px 10px 10px;
  font-size: 1.2rem;
  font-weight: 800;
  border-radius: 8px;
  border: 2px solid var(--primary);
  background: var(--bg-card);
  color: var(--text-main);
}

.ship-input-wrap .currency {
  position: absolute;
  right: 10px;
  top: 10px;
  font-weight: bold;
  color: var(--primary);
}

.weight-warning {
  color: var(--danger);
  font-weight: bold;
  font-size: 10px;
}

.grand-total {
  text-align: right;
}

.grand-total label {
  font-size: 10px;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.total-val {
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--primary);
}

.btn-primary-lg {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: var(--radius-md);
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
}

.btn-primary-lg:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(230, 57, 70, 0.4);
}

.btn-primary-lg:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ФИЛЬТРЫ */
.filter-section {
  background: var(--bg-input);
  border-style: solid;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-grid-pro {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 24px;
  align-items: flex-end;
}

.btn-text-link {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: underline;
}

.btn-text-link:hover {
  transform: translateX(-3px);
  text-decoration: none;
}

/* ТАБЛИЦА ЗАКАЗОВ */
.table-container {
  margin-top: 16px;
}

.admin-table-wrapper {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  box-shadow: var(--shadow-sm);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
}

.admin-table th {
  background: linear-gradient(135deg, var(--primary-light), transparent);
  padding: 16px 20px;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  border-bottom: 2px solid var(--border-color);
}

.admin-table td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
  transition: background 0.2s;
}

.order-row-main:hover td {
  background: var(--primary-light);
}

.col-id {
  width: 100px;
}

.order-id-badge {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  padding: 4px 10px;
  border-radius: 30px;
  font-weight: 800;
  font-size: 0.85rem;
  display: inline-block;
}

.date-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 6px;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-cell strong {
  font-size: 0.9rem;
}

.user-cell small {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.price-edit-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-row {
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-row span {
  color: var(--text-muted);
}

.edit-row input {
  width: 80px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  font-weight: 700;
  color: var(--text-main);
}

.edit-row.shipping {
  color: var(--success);
}

/* Селекты статусов */
.status-select {
  padding: 8px 12px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 0.75rem;
  border: 1px solid transparent;
  cursor: pointer;
  width: auto;
  background: var(--bg-input);
  transition: all 0.2s;
}

.status-select:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* Цвета статусов доставки */
.status-select.created {
  background: var(--primary-light);
  color: var(--primary);
}
.status-select.shipping {
  background: var(--warning-light);
  color: var(--warning);
}
.status-select.awaiting {
  background: #e0f2fe;
  color: #0369a1;
}
.status-select.delivered {
  background: var(--success-light);
  color: var(--success);
}
.status-select.cancelled {
  background: var(--danger-light);
  color: var(--danger);
}

/* Цвета статусов оплаты */
.status-select.paid {
  background: var(--success-light);
  color: var(--success);
}
.status-select.unpaid {
  background: var(--danger-light);
  color: var(--danger);
}
.status-select.awaiting_payment {
  background: var(--warning-light);
  color: var(--warning);
}

.pay-method-small {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 4px;
  text-align: center;
}

.inline-select-addr {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-group-row {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-view-items {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 30px;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view-items:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}

.btn-view-items.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.btn-del {
  background: var(--danger-light);
  border: none;
  padding: 6px 12px;
  border-radius: 30px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-del:hover {
  background: var(--danger);
  color: white;
  transform: scale(1.05);
}

.text-right {
  text-align: right;
}

/* Раскрывающаяся строка с составом заказа */
.expand-row td {
  background: var(--bg-input);
  padding: 20px;
}

.order-items-detail {
  padding: 20px;
  background: var(--bg-card);
  border-left: 4px solid var(--primary);
  border-radius: var(--radius-md);
}

.order-items-detail h4 {
  margin: 0 0 16px 0;
  font-size: 1rem;
}

.items-grid-pro {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row-pro {
  display: flex;
  align-items: center;
  gap: 15px;
  background: var(--bg-input);
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.ipro-img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  background: #fff;
  border-radius: 8px;
  padding: 4px;
}

.ipro-info {
  flex: 1;
}

.ipro-name {
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.ipro-meta {
  display: flex;
  gap: 10px;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.qty-badge {
  background: var(--primary-light);
  padding: 2px 6px;
  border-radius: 20px;
  font-weight: 700;
}

.ipro-sum {
  font-weight: 800;
  color: var(--primary);
  font-size: 1rem;
}

/* ПАГИНАЦИЯ */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
  flex-wrap: wrap;
}

.p-btn {
  padding: 10px 20px;
  border-radius: 40px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-main);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.p-btn:hover:not(:disabled) {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  transform: translateY(-2px);
}

.p-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.p-numbers {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.p-numbers button {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-main);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.p-numbers button:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}

.p-numbers button.active {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
}

/* АДАПТИВНОСТЬ */
@media (max-width: 1200px) {
  .filter-grid-pro {
    grid-template-columns: 1fr 1fr;
  }
  .constructor-footer {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .admin-orders {
    padding: 24px 16px;
  }
  .header-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .filter-grid-pro {
    grid-template-columns: 1fr;
  }
  .admin-table th,
  .admin-table td {
    padding: 12px;
  }
  .pagination-wrapper {
    flex-direction: column;
  }
  .selector-row-advanced {
    flex-wrap: wrap;
  }
}

/* ТЁМНАЯ ТЕМА – ДОПОЛНИТЕЛЬНЫЕ ПРАВКИ */
body.dark-theme .admin-card {
  background: rgba(30, 41, 59, 0.95);
}
body.dark-theme .status-select option {
  background: var(--bg-card);
  color: var(--text-main);
}
body.dark-theme .ipro-img {
  background: #1e293b;
}
</style>