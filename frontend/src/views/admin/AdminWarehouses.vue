<template>
  <div class="admin-warehouses">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>📍 Склады и ПВЗ</h1>
        <p class="subtitle">Управление логистической сетью: пункты выдачи и региональные хранилища</p>
      </div>
      <div class="stats-badge">
        <span class="stats-icon">🏙️</span>
        Всего точек: <b>{{ warehouses.length }}</b>
      </div>
    </div>

    <!-- 1. ФОРМА СОЗДАНИЯ (Компактная и стильная) -->
    <section class="admin-card create-card">
      <div class="card-header">
        <h3 class="card-title">✨ Добавить новый объект</h3>
        <div class="card-decoration"></div>
      </div>
      <form @submit.prevent="createWarehouse" class="admin-form">
        <div class="input-grid">
          <div class="input-group">
            <label>🏙️ Город</label>
            <input v-model="newWarehouse.city_name" placeholder="Напр. Москва" required />
          </div>
          <div class="input-group" style="grid-column: span 2;">
            <label>🏠 Точный адрес</label>
            <input v-model="newWarehouse.address" placeholder="Улица, дом, строение..." required />
          </div>
          <div class="input-group">
            <label>📞 Контактный телефон</label>
            <input v-model="newWarehouse.phone" placeholder="+7 (___) ___-__-__" />
          </div>
        </div>

        <div class="form-footer">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="newWarehouse.is_pickup_point" />
            <span class="checkmark"></span>
            <span>⭐ Разрешить выдачу заказов (ПВЗ)</span>
          </label>
          <button type="submit" class="btn-primary">
            <span class="btn-icon">➕</span> Добавить в базу
          </button>
        </div>
      </form>
    </section>

    <!-- 2. ПРОДВИНУТЫЕ ФИЛЬТРЫ -->
    <section class="admin-card filter-section">
      <div class="filter-header">
        <h3 class="card-title">🔍 Продвинутый поиск и фильтрация</h3>
        <button @click="resetFilters" class="btn-text-link">Сбросить всё</button>
      </div>
      
      <div class="filter-grid">
        <div class="input-group search-group">
          <label>🔎 Поиск (Город, Адрес, Тел, ID)</label>
          <input 
            v-model="filters.search" 
            placeholder="Начните вводить данные для поиска..." 
            class="search-input"
          />
        </div>

        <div class="input-group">
          <label>🏢 Тип объекта</label>
          <select v-model="filters.type">
            <option value="all">Все объекты</option>
            <option value="pickup">Только ПВЗ</option>
            <option value="warehouse">Только Склады</option>
          </select>
        </div>

        <div class="input-group">
          <label>📊 Сортировка</label>
          <select v-model="filters.sort">
            <option value="id-desc">Сначала новые (ID ↓)</option>
            <option value="id-asc">Старые (ID ↑)</option>
            <option value="city">По алфавиту (Город)</option>
          </select>
        </div>
      </div>
    </section>

    <!-- 3. ТАБЛИЦА С РЕДАКТИРОВАНИЕМ -->
    <div class="table-container">
      <div class="table-meta">
        <span class="meta-icon">📄</span>
        Найдено: <b>{{ filteredWarehouses.length }}</b> из {{ warehouses.length }}
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-id">ID</th>
              <th>🏙️ Город</th>
              <th>🏠 Адрес (редактируемый)</th>
              <th>📞 Телефон</th>
              <th class="text-center">⚙️ Статус</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in filteredWarehouses" :key="w.id" class="warehouse-row">
              <td class="col-id">
                <span class="id-badge">#{{ w.id }}</span>
               </td>

              <td style="width: 200px;">
                <input v-model="w.city_name" @change="updateWarehouse(w)" class="inline-edit bold-city" title="Нажмите для редактирования" />
              </td>

              <td>
                <input v-model="w.address" @change="updateWarehouse(w)" class="inline-edit addr-input" placeholder="Введите адрес..." />
              </td>

              <td style="width: 180px;">
                <input v-model="w.phone" @change="updateWarehouse(w)" class="inline-edit phone-input" placeholder="Нет телефона" />
              </td>

              <td class="text-center" style="width: 150px;">
                <div class="status-cell">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="w.is_pickup_point" @change="updateWarehouse(w)" />
                    <span class="toggle-slider"></span>
                  </label>
                  <span class="status-tag" :class="w.is_pickup_point ? 'tag-pickup' : 'tag-storage'">
                    {{ w.is_pickup_point ? 'ПВЗ' : 'СКЛАД' }}
                  </span>
                </div>
              </td>

              <td class="text-right">
                <button @click="deleteWarehouse(w.id)" class="btn-delete-small">
                  🗑️ Удалить
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Состояние "Пусто" -->
      <div v-if="filteredWarehouses.length === 0" class="empty-state">
        <div class="empty-icon">🏜️</div>
        <h3>Ничего не найдено</h3>
        <p>Попробуйте изменить параметры поиска или фильтры.</p>
        <button @click="resetFilters" class="btn-primary-small">Сбросить всё</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import axios from 'axios';

const ADMIN_KEY = 'my_super_secret_admin_123';
const config = { headers: { 'x-admin-key': ADMIN_KEY } };

const warehouses = ref([]);

const filters = reactive({
  search: '',
  type: 'all',
  sort: 'id-desc'
});

const newWarehouse = reactive({
  city_name: '',
  address: '',
  phone: '',
  is_pickup_point: true
});

const fetchWarehouses = async () => {
  try {
    const res = await axios.get('/api/admin/warehouses', config);
    warehouses.value = res.data;
  } catch (e) { console.error('Ошибка загрузки'); }
};

const resetFilters = () => {
  filters.search = '';
  filters.type = 'all';
  filters.sort = 'id-desc';
};

const filteredWarehouses = computed(() => {
  let result = [...warehouses.value];

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(w => 
      w.city_name.toLowerCase().includes(q) || 
      w.address.toLowerCase().includes(q) ||
      (w.phone && w.phone.includes(q)) ||
      w.id.toString() === q
    );
  }

  if (filters.type === 'pickup') {
    result = result.filter(w => w.is_pickup_point);
  } else if (filters.type === 'warehouse') {
    result = result.filter(w => !w.is_pickup_point);
  }

  if (filters.sort === 'city') {
    result.sort((a, b) => a.city_name.localeCompare(b.city_name));
  } else if (filters.sort === 'id-asc') {
    result.sort((a, b) => a.id - b.id);
  } else {
    result.sort((a, b) => b.id - a.id);
  }

  return result;
});

const createWarehouse = async () => {
  try {
    const res = await axios.post('/api/admin/warehouses', newWarehouse, config);
    warehouses.value.unshift(res.data);
    Object.assign(newWarehouse, { city_name: '', address: '', phone: '', is_pickup_point: true });
    alert('Объект успешно добавлен');
  } catch (e) { alert('Ошибка при создании'); }
};

const updateWarehouse = async (w) => {
  try {
    await axios.put(`/api/admin/warehouses/${w.id}`, w, config);
  } catch (e) { alert('Ошибка сохранения данных'); }
};

const deleteWarehouse = async (id) => {
  if (!confirm('ВНИМАНИЕ! Удаление склада удалит все связанные данные об остатках. Вы уверены?')) return;
  try {
    await axios.delete(`/api/admin/warehouses/${id}`, config);
    warehouses.value = warehouses.value.filter(item => item.id !== id);
  } catch (e) { alert('Ошибка при удалении'); }
};

onMounted(fetchWarehouses);
</script>

<style scoped>
/* ==========================================================================
   АДМИНКА: УПРАВЛЕНИЕ СКЛАДАМИ И ПВЗ – СОВРЕМЕННЫЙ СТИЛЬ (БЕЗ КРАСНЫХ ВЫДЕЛЕНИЙ)
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

.admin-warehouses {
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

/* ФОРМА */
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

.form-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: var(--radius-md);
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(230, 57, 70, 0.4);
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

.filter-grid {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.2fr;
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

/* ТАБЛИЦА */
.table-container {
  margin-top: 16px;
}

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
  min-width: 800px;
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

/* Убираем красное выделение при наведении на строку */
.warehouse-row:hover td {
  background: transparent;
}

.col-id {
  width: 80px;
  font-weight: 700;
}

.id-badge {
  display: inline-block;
  font-weight: 800;
  color: var(--primary);
  font-family: monospace;
}

/* Редактируемые поля */
.inline-edit {
  background: transparent;
  border: 1px solid transparent;
  padding: 6px 8px;
  border-radius: 8px;
  color: var(--text-main);
  width: 100%;
  transition: all 0.2s;
}

.inline-edit:hover {
  background: var(--bg-input);
  border-color: var(--border-color);
}

.inline-edit:focus {
  background: var(--bg-card);
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-light);
}

.bold-city {
  font-weight: 700;
  font-size: 0.95rem;
}

.addr-input {
  min-width: 220px;
}

.phone-input {
  font-family: monospace;
}

/* Переключатель статуса (toggle) */
.status-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--success);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.status-tag {
  padding: 4px 10px;
  border-radius: 30px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.tag-pickup {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.tag-storage {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Кнопка удаления (нейтральная, без красного фона) */
.btn-delete-small {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  padding: 8px 14px;
  border-radius: 30px;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-delete-small:hover {
  background: var(--danger-light);
  color: var(--danger);
  border-color: var(--danger);
  transform: translateY(-2px);
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

/* Чекбоксы */
.custom-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  font-size: 0.85rem;
}

.custom-checkbox input {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 6px;
  display: inline-block;
  position: relative;
  transition: all 0.2s;
}

.custom-checkbox input:checked + .checkmark {
  background: var(--primary);
  border-color: var(--primary);
}

.custom-checkbox input:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
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

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.3rem;
  margin-bottom: 8px;
}

.empty-state p {
  color: var(--text-muted);
  margin-bottom: 20px;
}

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
@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .admin-warehouses {
    padding: 24px 16px;
  }
  .header-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .filter-grid {
    grid-template-columns: 1fr;
  }
  .input-grid {
    grid-template-columns: 1fr;
  }
  .form-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .form-footer button {
    width: 100%;
    justify-content: center;
  }
  .admin-table th,
  .admin-table td {
    padding: 12px;
  }
  .status-cell {
    flex-direction: column;
    gap: 8px;
  }
}

/* ТЁМНАЯ ТЕМА */
body.dark-theme .admin-card {
  background: rgba(30, 41, 59, 0.95);
}
</style>