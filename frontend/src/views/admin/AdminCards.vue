<template>
  <div class="admin-cards">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>💳 Карты пользователей</h1>
        <p class="subtitle">Управление привязанными способами оплаты клиентов</p>
      </div>
      <div class="stats-badge">
        Всего: <b>{{ filteredCards.length }}</b>
      </div>
    </div>

    <!-- 1. ФИЛЬТРАЦИЯ -->
    <section class="admin-card filter-section">
      <div class="filter-grid">
        <div class="input-group search-group">
          <label>🔍 Поиск</label>
          <input 
            v-model="searchQuery" 
            placeholder="Номер, владелец или ID..." 
          />
        </div>

        <div class="input-group">
          <label>Платежная система</label>
          <select v-model="filters.brand">
            <option value="all">Все системы</option>
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="mir">Мир</option>
          </select>
        </div>

        <div class="checkbox-group">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="filters.onlyDefault" />
            <span class="checkmark"></span>
            Только основные
          </label>
        </div>

        <button @click="resetFilters" class="btn-secondary">Сбросить</button>
      </div>
    </section>

    <!-- 2. ТАБЛИЦА КАРТ -->
    <div class="table-container">
      <div class="table-meta">
        Страница {{ currentPage }} из {{ totalPages || 1 }}
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка данных...</p>
      </div>
      
      <div v-else class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-id">ID</th>
              <th>Пользователь</th>
              <th>Система</th>
              <th>Номер (маска)</th>
              <th>Владелец</th>
              <th>Срок</th>
              <th>Статус</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="card in paginatedCards" :key="card.id">
              <td class="col-id">#{{ card.id }}</td>
              
              <td>
                <div class="user-info">
                  <span class="user-name">{{ getUserName(card.user_id) }}</span>
                  <small class="client-id">User ID: {{ card.user_id }}</small>
                </div>
              </td>

              <td>
                <span class="brand-badge" :class="card.brand.toLowerCase()">{{ card.brand }}</span>
              </td>

              <td class="card-number">
                <code>{{ card.card_number_masked }}</code>
              </td>

              <td class="card-holder">{{ card.card_holder }}</td>
              <td class="expiry">{{ card.expiry_date }}</td>

              <td>
                <label class="custom-checkbox no-text">
                  <input type="checkbox" v-model="card.is_default" @change="updateCard(card)" />
                  <span class="checkmark"></span>
                </label>
                <small class="status-text" :class="{ 'is-active': card.is_default }">
                  {{ card.is_default ? 'ОСНОВНАЯ' : 'ОБЫЧНАЯ' }}
                </small>
              </td>

              <td class="text-right">
                <button @click="deleteCard(card.id)" class="btn-delete">Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 3. ПАГИНАЦИЯ -->
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

      <!-- ПУСТОЕ СОСТОЯНИЕ -->
      <div v-if="!loading && filteredCards.length === 0" class="empty-state">
        <div class="empty-icon">💳</div>
        <h3>Карты не найдены</h3>
        <p>Попробуйте изменить параметры поиска или фильтры</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/* КОД СКРИПТА ОСТАВЛЯЕМ ТВОЙ ОРИГИНАЛЬНЫЙ (логика не меняется) */
import { ref, onMounted, computed, reactive, watch } from 'vue';
import axios from 'axios';

const ADMIN_KEY = 'my_super_secret_admin_123';
const config = { headers: { 'x-admin-key': ADMIN_KEY } };

const cards = ref([]);
const users = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 20;

const filters = reactive({
  brand: 'all',
  onlyDefault: false
});

const fetchCards = async () => {
  loading.value = true;
  try {
    const [cRes, uRes] = await Promise.all([
      axios.get('/api/admin/user_cards', config),
      axios.get('/api/admin/users', config)
    ]);
    cards.value = cRes.data;
    users.value = uRes.data;
  } catch (e) { console.error('Ошибка загрузки данных'); } 
  finally { loading.value = false; }
};

const resetFilters = () => {
  searchQuery.value = ''; filters.brand = 'all'; filters.onlyDefault = false; currentPage.value = 1;
};

const getUserName = (userId) => {
  const user = users.value.find(u => u.id === userId);
  return user ? `${user.first_name} ${user.last_name || ''}` : `Юзер #${userId}`;
};

const updateCard = async (card) => {
  try { await axios.put(`/api/admin/user_cards/${card.id}`, card, config); } 
  catch (e) { alert('Ошибка обновления'); }
};

const deleteCard = async (id) => {
  if (!confirm('Отвязать карту?')) return;
  try {
    await axios.delete(`/api/admin/user_cards/${id}`, config);
    cards.value = cards.value.filter(c => c.id !== id);
  } catch (e) { alert('Ошибка удаления'); }
};

const filteredCards = computed(() => {
  let res = [...cards.value];
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(c => 
      c.card_number_masked.includes(q) || 
      c.user_id.toString() === q ||
      c.card_holder.toLowerCase().includes(q)
    );
  }
  if (filters.brand !== 'all') res = res.filter(c => c.brand.toLowerCase() === filters.brand);
  if (filters.onlyDefault) res = res.filter(c => c.is_default);
  return res;
});

const totalPages = computed(() => Math.ceil(filteredCards.value.length / itemsPerPage));
const paginatedCards = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredCards.value.slice(start, start + itemsPerPage);
});

watch([searchQuery, filters], () => currentPage.value = 1);
onMounted(fetchCards);
</script>

<style scoped>
.admin-cards {
  padding: 40px 20px;
  animation: fadeIn 0.4s ease-out;
  color: var(--text-main);
}

/* ШАПКА */
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
h1 { font-size: 2.2rem; font-weight: 800; margin: 0; }
.subtitle { color: var(--text-muted); margin-top: 5px; }
.stats-badge { background: var(--primary-light); color: var(--primary); padding: 10px 20px; border-radius: 50px; font-weight: 700; }

/* КАРТОЧКИ */
.admin-card {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 30px;
}

/* ФИЛЬТРЫ */
.filter-section { background-color: var(--bg-input) !important; border-style: dashed !important; }
.filter-grid { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 20px; align-items: flex-end; }

.input-group label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted) !important; margin-bottom: 8px; text-transform: uppercase; }

input, select {
  width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border-color);
  background-color: var(--bg-input) !important; color: var(--text-main) !important; transition: all 0.2s;
}

.btn-secondary { padding: 12px 20px; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer; color: var(--text-main); font-weight: 600; }

/* ТАБЛИЦА */
.table-meta { margin-bottom: 10px; font-size: 0.85rem; color: var(--text-muted); }
.admin-table-wrapper { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { background-color: var(--bg-input) !important; padding: 18px 20px; text-align: left; font-size: 0.75rem; color: var(--text-muted) !important; border-bottom: 2px solid var(--border-color); text-transform: uppercase; }
.admin-table td { padding: 15px 20px; border-bottom: 1px solid var(--border-color); color: var(--text-main) !important; vertical-align: middle; }

/* ДАННЫЕ В ТАБЛИЦЕ */
.col-id { color: var(--text-muted) !important; font-family: monospace; width: 60px; }
.user-name { display: block; font-weight: 700; color: var(--text-main); }
.client-id { color: var(--text-muted) !important; font-size: 0.75rem; }

.card-number code { font-family: monospace; font-weight: 700; font-size: 1.1rem; color: var(--text-main); letter-spacing: 1px; }
.card-holder { text-transform: uppercase; font-weight: 600; font-size: 0.85rem; }
.expiry { font-weight: 700; }

/* БЕЙДЖИ СИСТЕМ */
.brand-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
.visa { background: #e0e7ff; color: #4338ca; }
.mastercard { background: #ffedd5; color: #9a3412; }
.mir { background: #dcfce7; color: #15803d; }

/* СТАТУС */
.status-text { font-size: 0.65rem; font-weight: 900; color: var(--text-muted); display: block; margin-top: 4px; }
.is-active { color: var(--success) !important; }

/* КНОПКИ */
.btn-delete { background-color: var(--danger-light); color: var(--danger) !important; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; }

/* ЧЕКБОКСЫ */
.custom-checkbox { display: flex; align-items: center; gap: 10px; cursor: pointer; position: relative; }
.custom-checkbox input { position: absolute; opacity: 0; }
.checkmark { height: 20px; width: 20px; background-color: var(--bg-input); border: 2px solid var(--border-color); border-radius: 4px; position: relative; }
.custom-checkbox input:checked ~ .checkmark { background-color: var(--primary); border-color: var(--primary); }
.checkmark:after { content: ""; position: absolute; display: none; left: 6px; top: 2px; width: 5px; height: 10px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.custom-checkbox input:checked ~ .checkmark:after { display: block; }
.no-text { justify-content: center; padding: 0; margin: 0 auto; width: 20px; }

/* ПАГИНАЦИЯ */
.pagination-wrapper { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 40px; }
.p-btn { padding: 10px 15px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-main); cursor: pointer; }
.p-numbers { display: flex; gap: 8px; }
.p-numbers button { width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-main); cursor: pointer; font-weight: 700; }
.p-numbers button.active { background-color: var(--primary); color: #fff; border-color: var(--primary); }

/* ПУСТОЕ СОСТОЯНИЕ */
.empty-state { text-align: center; padding: 80px 20px; background-color: var(--bg-input); border-radius: var(--radius-lg); border: 2px dashed var(--border-color); color: var(--text-muted); }
.empty-icon { font-size: 3rem; margin-bottom: 15px; opacity: 0.5; }

/* ТЕМНАЯ ТЕМА ФОРС */
:deep(body.dark-theme) .admin-card { background-color: #1e293b !important; }
:deep(body.dark-theme) .admin-table td code { color: var(--text-main); }

.text-right { text-align: right; }
</style>