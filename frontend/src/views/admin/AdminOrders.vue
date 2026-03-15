<template>
  <div class="admin-orders">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>📦 Управление заказами</h1>
        <p class="subtitle">Мониторинг, создание и редактирование заказов в реальном времени</p>
      </div>
      <div class="stats-badge">
        Всего найдено: <b>{{ filteredOrders.length }}</b>
      </div>
    </div>

    <!-- 1. ФОРМА СОЗДАНИЯ -->
    <section class="admin-card create-card">
      <h3 class="card-title">Добавить новый заказ вручную</h3>
      <form @submit.prevent="createOrder" class="admin-form">
        <div class="input-grid">
          <div class="input-group">
            <label>ID Пользователя</label>
            <input v-model="newOrder.user_id" type="number" placeholder="Напр. 42" />
          </div>
          <div class="input-group">
            <label>Сумма (₽)</label>
            <input v-model.number="newOrder.total_price" type="number" placeholder="0" required />
          </div>
          <div class="input-group">
            <label>Адрес / ПВЗ</label>
            <input v-model="newOrder.delivery_address" placeholder="Город, улица, дом..." required />
          </div>
          <div class="input-group">
            <label>Оплата</label>
            <select v-model="newOrder.payment_method">
              <option value="card">Карта онлайн</option>
              <option value="cash">Наличные</option>
              <option value="sbp">СБП</option>
            </select>
          </div>
          <div class="input-group">
            <label>Статус оплаты</label>
            <select v-model="newOrder.payment_status">
              <option value="unpaid">Не оплачен</option>
              <option value="awaiting_payment">Ждет оплаты</option>
              <option value="paid">Оплачен</option>
            </select>
          </div>
          <div class="input-group">
            <label>Логистика</label>
            <select v-model="newOrder.delivery_status">
              <option value="created">Обработка</option>
              <option value="shipping">Доставляется</option>
              <option value="awaiting">В ПВЗ</option>
            </select>
          </div>
        </div>
        <div class="form-footer">
          <button type="submit" class="btn-primary">✨ Создать заказ</button>
        </div>
      </form>
    </section>

    <!-- 2. ФИЛЬТРАЦИЯ -->
    <section class="admin-card filter-section">
      <div class="filter-grid">
        <div class="input-group search-group">
          <label>🔍 Поиск</label>
          <input v-model="searchQuery" placeholder="ID заказа, User ID или адрес..." />
        </div>

        <div class="input-group">
          <label>Доставка</label>
          <select v-model="filters.deliveryStatus">
            <option value="all">Все статусы</option>
            <option value="created">Новые</option>
            <option value="shipping">В пути</option>
            <option value="awaiting">В пункте выдачи</option>
            <option value="delivered">Завершены</option>
            <option value="cancelled">Отменены</option>
          </select>
        </div>

        <div class="input-group">
          <label>Оплата</label>
          <select v-model="filters.paymentStatus">
            <option value="all">Любая оплата</option>
            <option value="paid">Оплачено</option>
            <option value="unpaid">Не оплачено</option>
            <option value="awaiting_payment">Ожидает</option>
          </select>
        </div>

        <button @click="resetFilters" class="btn-secondary">Сбросить</button>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА ЗАКАЗОВ -->
    <div class="table-container">
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-id">ID / Дата</th>
              <th>Клиент</th>
              <th class="col-price">Сумма</th>
              <th>Доставка</th>
              <th>Оплата</th>
              <th>Адрес</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in paginatedOrders" :key="order.id">
              <td class="col-id">
                <div class="order-number">#{{ order.id }}</div>
                <div class="order-date">{{ formatDate(order.created_at) }}</div>
              </td>
              
              <td>
                <div v-if="order.user_id" class="client-id">
                  ID: <code>{{ order.user_id }}</code>
                </div>
                <div v-else class="client-guest">Гость</div>
              </td>

              <td>
                <div class="table-input-wrap">
                  <input v-model.number="order.total_price" type="number" @change="updateOrder(order)" class="inline-edit" />
                  <span>₽</span>
                </div>
              </td>
              
              <td>
                <select v-model="order.delivery_status" 
                        @change="updateOrder(order)" 
                        class="status-select" 
                        :class="order.delivery_status">
                  <option value="created">Обработка</option>
                  <option value="shipping">Доставляется</option>
                  <option value="awaiting">В ПВЗ</option>
                  <option value="delivered">Завершен</option>
                  <option value="cancelled">Отменен</option>
                </select>
              </td>

              <td>
                <select v-model="order.payment_status" 
                        @change="updateOrder(order)"
                        class="status-select"
                        :class="order.payment_status">
                  <option value="unpaid">Не оплачен</option>
                  <option value="awaiting_payment">Ждет оплаты</option>
                  <option value="paid">Оплачен</option>
                </select>
              </td>

              <td>
                <input v-model="order.delivery_address" @change="updateOrder(order)" class="inline-edit addr-input" />
              </td>

              <td class="text-right">
                <button @click="deleteOrder(order.id)" class="btn-delete">Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 4. ПАГИНАЦИЯ -->
      <div v-if="totalPages > 1" class="pagination-wrapper">
        <button @click="currentPage--" :disabled="currentPage === 1" class="p-btn">← Пред.</button>
        <div class="p-numbers">
          <button v-for="page in totalPages" :key="page" 
                  @click="currentPage = page"
                  :class="{ active: currentPage === page }">
            {{ page }}
          </button>
        </div>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-btn">След. →</button>
      </div>
    </div>

    <div v-if="filteredOrders.length === 0 && !loading" class="empty-state">
      <div class="empty-icon">📦</div>
      <h3>Заказы не найдены</h3>
      <p>Попробуйте изменить параметры фильтрации</p>
    </div>
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

const filters = reactive({
  deliveryStatus: 'all',
  paymentStatus: 'all'
});

const loadOrders = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/admin/orders', config);
    orders.value = res.data;
  } catch (e) { console.error('Ошибка загрузки'); }
  finally { loading.value = false; }
};

const resetFilters = () => {
  searchQuery.value = '';
  filters.deliveryStatus = 'all';
  filters.paymentStatus = 'all';
  currentPage.value = 1;
};

const filteredOrders = computed(() => {
  let res = [...orders.value];
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(o => 
      o.id.toString() === q ||
      (o.user_id && o.user_id.toString().includes(q)) ||
      o.delivery_address.toLowerCase().includes(q)
    );
  }
  if (filters.deliveryStatus !== 'all') res = res.filter(o => o.delivery_status === filters.deliveryStatus);
  if (filters.paymentStatus !== 'all') res = res.filter(o => o.payment_status === filters.paymentStatus);
  return res;
});

const totalPages = computed(() => Math.ceil(filteredOrders.value.length / itemsPerPage));
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredOrders.value.slice(start, start + itemsPerPage);
});

watch([searchQuery, filters], () => currentPage.value = 1);

const newOrder = reactive({ user_id: null, total_price: 0, delivery_address: '', payment_method: 'card', payment_status: 'unpaid', delivery_status: 'created' });

const createOrder = async () => {
  try {
    const res = await axios.post('/api/admin/orders', newOrder, config);
    orders.value.unshift(res.data);
    Object.assign(newOrder, { user_id: null, total_price: 0, delivery_address: '', payment_method: 'card', payment_status: 'unpaid', delivery_status: 'created' });
    alert('Заказ успешно создан');
  } catch (e) { alert('Ошибка при создании заказа'); }
};

const updateOrder = async (order) => {
  try { await axios.put(`/api/admin/orders/${order.id}`, order, config); } 
  catch (e) { alert('Ошибка обновления'); }
};

const deleteOrder = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить заказ?')) return;
  try {
    await axios.delete(`/api/admin/orders/${id}`, config);
    orders.value = orders.value.filter(o => o.id !== id);
  } catch (e) { alert('Ошибка удаления'); }
};

const formatDate = (d) => new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

onMounted(loadOrders);
</script>

<style scoped>
/* ПРИНУДИТЕЛЬНОЕ ИСПОЛЬЗОВАНИЕ ПЕРЕМЕННЫХ ТЕМЫ */
.admin-orders {
  padding: 40px 20px;
  animation: fadeIn 0.4s ease-out;
  color: var(--text-main);
}

/* ШАПКА */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

h1 { font-size: 2.2rem; font-weight: 800; margin: 0; }
.subtitle { color: var(--text-muted); margin-top: 5px; }

.stats-badge {
  background: var(--primary-light);
  color: var(--primary);
  padding: 10px 20px;
  border-radius: var(--radius-full);
  font-size: 0.9rem;
}

/* КАРТОЧКИ */
.admin-card {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 30px;
}

.card-title { margin-top: 0; margin-bottom: 25px; font-size: 1.25rem; font-weight: 700; }

/* ФОРМЫ И ИНПУТЫ */
.admin-form input, .admin-form select, .filter-section input, .filter-section select {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background-color: var(--bg-input) !important;
  color: var(--text-main) !important;
  transition: all 0.2s;
}

/* Для темной темы явно указываем, что плейсхолдеры должны быть видны */
input::placeholder { color: var(--text-muted); opacity: 0.7; }

.admin-form input:focus, .filter-section input:focus {
  border-color: var(--primary);
  background-color: var(--bg-card) !important;
  box-shadow: 0 0 0 4px var(--primary-light);
}

.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.input-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted) !important;
  margin-bottom: 8px;
  text-transform: uppercase;
}

/* КНОПКИ */
.btn-primary {
  background-color: var(--primary);
  color: #fff !important;
  padding: 14px 30px;
  border-radius: var(--radius-md);
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}

.btn-primary:hover { transform: translateY(-2px); background-color: var(--primary-hover); }

.btn-secondary {
  padding: 12px 20px;
  background-color: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-main);
  font-weight: 600;
}

.btn-delete {
  background-color: var(--danger-light);
  color: var(--danger) !important;
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
}

.btn-delete:hover { background-color: var(--danger); color: #fff !important; }

/* ФИЛЬТРЫ */
.filter-section {
  background-color: var(--bg-input) !important;
  border-style: dashed !important;
}

.filter-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 20px;
  align-items: flex-end;
}

/* ТАБЛИЦА */
.admin-table-wrapper {
  background-color: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.admin-table { width: 100%; border-collapse: collapse; }

.admin-table th {
  background-color: var(--bg-input) !important;
  padding: 18px 20px;
  text-align: left;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-muted) !important;
  border-bottom: 2px solid var(--border-color);
  letter-spacing: 1px;
}

.admin-table td { padding: 15px 20px; border-bottom: 1px solid var(--border-color); vertical-align: middle; }

.col-id { width: 120px; }
.order-number { font-weight: 800; color: var(--primary); font-size: 1rem; }
.order-date { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }

.client-id code { background: var(--bg-input); padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; color: var(--text-main); }
.client-guest { font-style: italic; color: var(--text-muted); }

.table-input-wrap { display: flex; align-items: center; gap: 8px; }
.inline-edit {
  background: transparent;
  border: 1px solid transparent;
  padding: 6px 10px;
  border-radius: 6px;
  color: var(--text-main) !important;
  font-weight: 600;
  width: 100%;
}
.inline-edit:hover { background: var(--bg-input); border-color: var(--border-color); }
.inline-edit:focus { background: var(--bg-card); border-color: var(--primary); outline: none; }
.addr-input { font-weight: 400; font-size: 0.9rem; }

/* СТИЛИ СТАТУСОВ (СЕЛЕКТЫ В ТАБЛИЦЕ) */
.status-select {
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  border: 2px solid transparent;
  cursor: pointer;
  width: auto;
}

/* Цвета доставки */
.created { background-color: var(--primary-light) !important; color: var(--primary) !important; }
.shipping { background-color: var(--warning-light) !important; color: var(--warning) !important; }
.awaiting { background-color: #e0f2fe !important; color: #0369a1 !important; }
.delivered { background-color: var(--success-light) !important; color: var(--success) !important; }
.cancelled { background-color: var(--danger-light) !important; color: var(--danger) !important; }

/* Цвета оплаты */
.paid { background-color: var(--success-light) !important; color: var(--success) !important; }
.unpaid { background-color: var(--danger-light) !important; color: var(--danger) !important; }
.awaiting_payment { background-color: var(--warning-light) !important; color: var(--warning) !important; }

/* ПАГИНАЦИЯ */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 40px;
}

.p-btn {
  padding: 10px 15px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--bg-card);
  color: var(--text-main);
  cursor: pointer;
}

.p-numbers { display: flex; gap: 8px; }
.p-numbers button {
  width: 40px; height: 40px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--bg-card);
  color: var(--text-main);
  cursor: pointer;
  font-weight: 700;
}

.p-numbers button.active { background-color: var(--primary); color: #fff; border-color: var(--primary); }

/* ПУСТОЕ СОСТОЯНИЕ */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background-color: var(--bg-input);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--border-color);
  color: var(--text-muted);
}
.empty-icon { font-size: 3rem; margin-bottom: 15px; opacity: 0.5; }

/* ТЕМНАЯ ТЕМА - ХАК ДЛЯ ПРИНУДИТЕЛЬНОГО ЦВЕТА ТЕКСТА В SELECT */
:deep(body.dark-theme) .status-select option {
  background-color: var(--bg-card);
  color: var(--text-main);
}

:deep(body.dark-theme) .inline-edit {
  color: var(--text-main) !important;
}

/* АДАПТИВНОСТЬ */
@media (max-width: 1024px) {
  .filter-grid { grid-template-columns: 1fr 1fr; }
  .filter-grid button { grid-column: span 2; }
}

@media (max-width: 768px) {
  .header-row { flex-direction: column; align-items: flex-start; gap: 15px; }
  .filter-grid { grid-template-columns: 1fr; }
  .filter-grid button { grid-column: span 1; }
  .admin-table th:nth-child(2), .admin-table td:nth-child(2),
  .admin-table th:nth-child(6), .admin-table td:nth-child(6) { display: none; }
}
</style>