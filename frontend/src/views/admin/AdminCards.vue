<template>
  <div class="admin-cards">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>💳 Карты пользователей</h1>
        <p class="subtitle">Безопасное управление способами оплаты. Поиск по клиентам и картам.</p>
      </div>
      <div class="stats-badge">
        <span class="stats-icon">📊</span>
        Всего: <b>{{ filteredCards.length }}</b>
      </div>
    </div>

    <!-- 1. ФИЛЬТРАЦИЯ И УМНЫЙ ПОИСК -->
    <section class="admin-card filter-section">
      <div class="filter-header">
        <h3 class="card-title">🔍 Фильтры и умный поиск</h3>
        <button @click="resetFilters" class="btn-text-link">Сбросить всё</button>
      </div>
      <div class="filter-grid">
        <div class="input-group search-group" style="grid-column: span 2;">
          <label>🔎 Поиск (ID карты, ID юзера, ФИО, Email или Телефон)</label>
          <input 
            v-model="searchQuery" 
            placeholder="Напр: 15 (ID), Иванов, user@mail.ru, +7911..." 
          />
        </div>
        <div class="input-group">
          <label>💳 Платежная система</label>
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
            <span>⭐ Только основные</span>
          </label>
        </div>
      </div>
    </section>

    <!-- 2. ТАБЛИЦА КАРТ -->
    <div class="table-container">
      <div class="table-meta">
        <span class="meta-icon">📄</span>
        Страница {{ currentPage }} из {{ totalPages || 1 }}
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка данных...</p>
      </div>
      
      <div v-else-if="filteredCards.length === 0" class="empty-state">
        <div class="empty-icon">💳</div>
        <h3>Карты не найдены</h3>
        <p>Попробуйте изменить параметры поиска или фильтры</p>
        <button @click="resetFilters" class="btn-primary-small">Сбросить фильтры</button>
      </div>
      
      <div v-else class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-id">ID Карты</th>
              <th>Владелец (Данные аккаунта)</th>
              <th class="col-brand">Система</th>
              <th>Номер (маска)</th>
              <th>Имя на карте</th>
              <th>Срок</th>
              <th>Статус</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="card in paginatedCards" :key="card.id" class="card-row">
              
              <!-- ID КАРТЫ -->
              <td class="col-id">
                <span class="id-badge">#{{ card.id }}</span>
                <small class="date-tag">{{ formatDate(card.created_at) }}</small>
              </td>
              
              <!-- ДАННЫЕ ВЛАДЕЛЬЦА -->
              <td>
                <div class="user-details-box">
                  <strong class="user-full-name">{{ getUserDetails(card.user_id).fullName }}</strong>
                  <div class="user-contacts">
                    <span class="contact-item">📧 {{ getUserDetails(card.user_id).email || '---' }}</span>
                    <span class="contact-item">📱 {{ getUserDetails(card.user_id).phone || '---' }}</span>
                    <span class="contact-item uid">UID: {{ card.user_id }}</span>
                  </div>
                </div>
              </td>

              <!-- СИСТЕМА (без цветных точек, только текст) -->
              <td class="col-brand">
                <span class="brand-badge" :class="card.brand?.toLowerCase()">
                  {{ (card.brand || 'CARD').toUpperCase() }}
                </span>
              </td>

              <!-- МАСКА -->
              <td class="card-number">
                <code>{{ card.card_number_masked }}</code>
              </td>

              <!-- ИМЯ НА КАРТЕ -->
              <td class="card-holder">
                <span class="mono-text">{{ card.card_holder || '---' }}</span>
              </td>

              <!-- СРОК -->
              <td class="expiry">
                <span class="bold-text">{{ card.expiry_date }}</span>
              </td>

              <!-- СТАТУС (переключатель) -->
              <td>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="card.is_default" @change="updateCardStatus(card)" />
                  <span class="toggle-slider"></span>
                </label>
                <span class="status-label" :class="{ 'active': card.is_default }">
                  {{ card.is_default ? 'ОСНОВНАЯ' : 'ОБЫЧНАЯ' }}
                </span>
              </td>

              <!-- ДЕЙСТВИЯ -->
              <td class="text-right actions-cell">
                <button @click="deleteCard(card.id)" class="btn-delete" title="Отвязать карту">🗑️ Отвязать</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 3. ПАГИНАЦИЯ -->
      <div v-if="totalPages > 1" class="pagination-wrapper">
        <button @click="currentPage--" :disabled="currentPage === 1" class="p-btn">←</button>
        <div class="p-numbers">
          <button v-for="page in totalPages" :key="page" @click="currentPage = page" :class="{ active: currentPage === page }">{{ page }}</button>
        </div>
        <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-btn">→</button>
      </div>
    </div>
  </div>
</template>

<script setup>
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

const filters = reactive({ brand: 'all', onlyDefault: false });

const formatDate = (date) => date ? new Date(date).toLocaleDateString('ru-RU') : '';

const getUserDetails = (userId) => {
  const user = users.value.find(u => u.id === userId);
  if (!user) return { fullName: 'Неизвестный', email: '', phone: '', id: userId };
  return {
    fullName: [user.last_name, user.first_name, user.otchestvo].filter(Boolean).join(' ') || 'Пользователь',
    email: user.email,
    phone: user.phone_number,
    id: user.id
  };
};

// Убрали цветные точки – оставили только текст
const getCardIcon = (brand) => ''; // не используется

const fetchCards = async () => {
  loading.value = true;
  try {
    const [cRes, uRes] = await Promise.all([
      axios.get('/api/admin/user_cards', config),
      axios.get('/api/admin/users', config)
    ]);
    cards.value = cRes.data;
    users.value = uRes.data;
  } catch (e) { console.error(e); } 
  finally { loading.value = false; }
};

const resetFilters = () => { searchQuery.value = ''; filters.brand = 'all'; filters.onlyDefault = false; currentPage.value = 1; };

const updateCardStatus = async (card) => {
  try {
    await axios.put(`/api/admin/user_cards/${card.id}`, { is_default: card.is_default }, config);
  } catch (e) { alert('Ошибка обновления статуса'); }
};

const deleteCard = async (id) => {
  if (!confirm('Отвязать карту от пользователя? Это действие нельзя отменить.')) return;
  try {
    await axios.delete(`/api/admin/user_cards/${id}`, config);
    cards.value = cards.value.filter(c => c.id !== id);
  } catch (e) { alert('Ошибка при удалении'); }
};

// Умный поиск
const filteredCards = computed(() => {
  let res = [...cards.value];
  
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    
    res = res.filter(c => {
      const user = users.value.find(u => u.id === c.user_id) || {};
      const fullName = `${user.last_name || ''} ${user.first_name || ''} ${user.otchestvo || ''}`.toLowerCase();
      
      const isCardId = c.id.toString() === q;
      const isUserId = c.user_id.toString().toLowerCase().includes(q);
      const isUserData = fullName.includes(q) || 
                         (user.email && user.email.toLowerCase().includes(q)) || 
                         (user.phone_number && user.phone_number.includes(q));
      const isCardData = c.card_number_masked.toLowerCase().includes(q) || 
                         (c.card_holder && c.card_holder.toLowerCase().includes(q));

      return isCardId || isUserId || isUserData || isCardData;
    });
  }

  if (filters.brand !== 'all') res = res.filter(c => c.brand?.toLowerCase() === filters.brand);
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
/* ==========================================================================
   АДМИНКА: КАРТЫ ПОЛЬЗОВАТЕЛЕЙ – БЕЗ КРАСНЫХ ВЫДЕЛЕНИЙ И ТОЧЕК
   ========================================================================== */

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes spin { to { transform: rotate(360deg); } }

.admin-cards {
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
.stats-icon { font-size: 1.2rem; }

/* КАРТОЧКИ ФИЛЬТРОВ */
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
.admin-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.filter-header {
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
.filter-section { background: var(--bg-input); border-style: solid; }
.filter-grid {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.5fr;
  gap: 24px;
  align-items: flex-end;
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
.checkbox-group { display: flex; align-items: center; height: 100%; }
.btn-text-link {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: underline;
}
.btn-text-link:hover { transform: translateX(-3px); text-decoration: none; }

/* ТАБЛИЦА – УБРАНО КРАСНОЕ ВЫДЕЛЕНИЕ ПРИ НАВЕДЕНИИ */
.table-container { margin-top: 16px; }
.table-meta {
  margin-bottom: 16px;
  font-size: 0.85rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
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
/* Убираем красный фон при наведении на строку */
.card-row:hover td {
  background: transparent;
}
.col-id { width: 80px; font-weight: 700; }
.id-badge {
  display: inline-block;
  font-weight: 800;
  color: var(--primary);
  font-family: monospace;
}
.date-tag {
  display: block;
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Данные владельца */
.user-details-box {
  max-width: 260px;
}
.user-full-name {
  display: block;
  font-size: 0.95rem;
  margin-bottom: 4px;
}
.user-contacts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.contact-item {
  font-size: 0.7rem;
  color: var(--text-muted);
}
.contact-item.uid {
  font-family: monospace;
  font-size: 0.65rem;
}

/* Бейдж платёжной системы – без точек, только текст */
.col-brand {
  width: 140px;
}
.brand-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 40px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.brand-badge.visa {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}
.brand-badge.mastercard {
  background: rgba(234, 88, 12, 0.15);
  color: #ea580c;
  border: 1px solid rgba(234, 88, 12, 0.3);
}
.brand-badge.mir {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* Номер карты */
.card-number code {
  font-family: 'Monaco', monospace;
  font-weight: 700;
  font-size: 0.9rem;
  background: var(--bg-input);
  padding: 4px 8px;
  border-radius: 8px;
  letter-spacing: 1px;
}
.mono-text {
  font-family: monospace;
  font-weight: 600;
  text-transform: uppercase;
}
.bold-text {
  font-weight: 700;
}

/* Переключатель статуса */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  margin-right: 8px;
  vertical-align: middle;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--border-color);
  transition: 0.3s;
  border-radius: 34px;
}
.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}
.toggle-switch input:checked + .toggle-slider { background-color: var(--success); }
.toggle-switch input:checked + .toggle-slider:before { transform: translateX(20px); }
.status-label {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--text-muted);
  margin-left: 4px;
}
.status-label.active { color: var(--success); }

/* Кнопка удаления – убираем агрессивное красное выделение */
.btn-delete {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  padding: 8px 14px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}
.btn-delete:hover {
  background: var(--danger-light);
  color: var(--danger);
  border-color: var(--danger);
  transform: translateY(-2px);
}
.text-right { text-align: right; }
.actions-cell { white-space: nowrap; }

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
.p-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.p-numbers { display: flex; gap: 8px; flex-wrap: wrap; }
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
.p-numbers button:hover { background: var(--primary-light); border-color: var(--primary); }
.p-numbers button.active {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
}

/* Лоадер */
.loading-state {
  text-align: center;
  padding: 60px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
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

/* Пустое состояние */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--border-color);
  margin-top: 20px;
}
.empty-icon { font-size: 4rem; margin-bottom: 20px; opacity: 0.5; }
.empty-state h3 { font-size: 1.3rem; margin-bottom: 8px; }
.empty-state p { color: var(--text-muted); margin-bottom: 20px; }
.btn-primary-small {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 40px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary-small:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
}

/* АДАПТИВНОСТЬ */
@media (max-width: 1200px) { .filter-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) {
  .admin-cards { padding: 24px 16px; }
  .header-row { flex-direction: column; align-items: flex-start; }
  .filter-grid { grid-template-columns: 1fr; }
  .admin-table th, .admin-table td { padding: 12px; }
  .pagination-wrapper { flex-direction: column; }
  .actions-cell { display: flex; gap: 8px; justify-content: flex-end; }
  .toggle-switch { width: 36px; height: 20px; }
  .toggle-slider:before { height: 14px; width: 14px; }
  .toggle-switch input:checked + .toggle-slider:before { transform: translateX(16px); }
}

/* ТЁМНАЯ ТЕМА */
body.dark-theme .admin-card { background: rgba(30, 41, 59, 0.95); }
body.dark-theme .brand-select { background: rgba(30, 41, 59, 0.9); }
</style>