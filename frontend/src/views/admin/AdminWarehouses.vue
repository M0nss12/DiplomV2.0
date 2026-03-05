<template>
  <div class="admin-warehouses">
    <!-- ЗАГОЛОВОК -->
    <div class="header-row">
      <div class="header-left">
        <h1>📍 Склады и ПВЗ</h1>
        <p class="subtitle">Управление логистическими точками и пунктами выдачи заказов</p>
      </div>
      <div class="stats-badge">
        Всего объектов: <b>{{ warehouses.length }}</b>
      </div>
    </div>

    <!-- 1. ФОРМА СОЗДАНИЯ -->
    <section class="admin-card create-card">
      <h3 class="card-title">Добавить новую точку</h3>
      <form @submit.prevent="createWarehouse" class="admin-form">
        <div class="input-grid">
          <div class="input-group">
            <label>Город</label>
            <input v-model="newWarehouse.city_name" placeholder="Напр. Иркутск" required />
          </div>
          <div class="input-group">
            <label>Полный адрес</label>
            <input v-model="newWarehouse.address" placeholder="Улица, дом, офис..." required />
          </div>
          <div class="input-group">
            <label>Телефон точки</label>
            <input v-model="newWarehouse.phone" placeholder="+7 (___) ___-__-__" />
          </div>
        </div>

        <div class="form-footer">
          <label class="custom-checkbox">
            <input type="checkbox" v-model="newWarehouse.is_pickup_point" />
            <span class="checkmark"></span>
            Доступен как ПВЗ (выдача клиентам)
          </label>
          <button type="submit" class="btn-primary">✨ Добавить объект</button>
        </div>
      </form>
    </section>

    <!-- 2. ТАБЛИЦА ОБЪЕКТОВ -->
    <div class="table-container">
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-id">ID</th>
              <th>Город</th>
              <th>Адрес</th>
              <th>Телефон</th>
              <th class="text-center">Статус ПВЗ</th>
              <th class="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in warehouses" :key="w.id">
              <td class="col-id">#{{ w.id }}</td>

              <td>
                <input v-model="w.city_name" @change="updateWarehouse(w)" class="inline-edit bold" />
              </td>

              <td>
                <input v-model="w.address" @change="updateWarehouse(w)" class="inline-edit addr-input" />
              </td>

              <td>
                <input v-model="w.phone" @change="updateWarehouse(w)" class="inline-edit mini" placeholder="Нет телефона" />
              </td>

              <td class="text-center">
                <label class="custom-checkbox no-text" title="Переключить статус ПВЗ">
                  <input type="checkbox" v-model="w.is_pickup_point" @change="updateWarehouse(w)" />
                  <span class="checkmark"></span>
                </label>
                <div class="status-label" :class="{ 'is-active': w.is_pickup_point }">
                    {{ w.is_pickup_point ? 'АКТИВЕН' : 'СКЛАД' }}
                </div>
              </td>

              <td class="text-right">
                <button @click="deleteWarehouse(w.id)" class="btn-delete">Удалить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="warehouses.length === 0" class="empty-state">
        <div class="empty-icon">📍</div>
        <h3>Список пуст</h3>
        <p>Добавьте первый склад или пункт выдачи выше.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import axios from 'axios';

const ADMIN_KEY = 'my_super_secret_admin_123';
const config = { headers: { 'x-admin-key': ADMIN_KEY } };

const warehouses = ref([]);

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

const createWarehouse = async () => {
  try {
    const res = await axios.post('/api/admin/warehouses', newWarehouse, config);
    warehouses.value.unshift(res.data);
    newWarehouse.city_name = '';
    newWarehouse.address = '';
    newWarehouse.phone = '';
    newWarehouse.is_pickup_point = true;
    alert('Точка успешно добавлена');
  } catch (e) { alert('Ошибка при создании'); }
};

const updateWarehouse = async (w) => {
  try {
    await axios.put(`/api/admin/warehouses/${w.id}`, w, config);
  } catch (e) { alert('Ошибка сохранения'); }
};

const deleteWarehouse = async (id) => {
  if (!confirm('Внимание! Удаление склада удалит все данные об остатках товаров на нём. Продолжить?')) return;
  try {
    await axios.delete(`/api/admin/warehouses/${id}`, config);
    warehouses.value = warehouses.value.filter(item => item.id !== id);
  } catch (e) { alert('Ошибка при удалении'); }
};

onMounted(fetchWarehouses);
</script>

<style scoped>
.admin-warehouses {
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

.card-title { margin-top: 0; margin-bottom: 25px; font-size: 1.25rem; font-weight: 700; }

/* ФОРМЫ И ИНПУТЫ */
.admin-form input {
  width: 100%; padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color);
  background-color: var(--bg-input) !important; color: var(--text-main) !important; transition: all 0.2s;
}

.input-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 25px; }
.input-group label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted) !important; margin-bottom: 8px; text-transform: uppercase; }

/* КНОПКИ */
.btn-primary { background-color: var(--primary); color: #fff !important; padding: 14px 30px; border-radius: var(--radius-md); font-weight: 700; border: none; cursor: pointer; }
.btn-delete { background-color: var(--danger-light); color: var(--danger) !important; border: none; padding: 8px 16px; border-radius: var(--radius-sm); font-weight: 700; cursor: pointer; }

.form-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px dashed var(--border-color); }

/* ТАБЛИЦА */
.admin-table-wrapper { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { background-color: var(--bg-input) !important; padding: 18px 20px; text-align: left; font-size: 0.75rem; color: var(--text-muted) !important; border-bottom: 2px solid var(--border-color); text-transform: uppercase; }
.admin-table td { padding: 15px 20px; border-bottom: 1px solid var(--border-color); color: var(--text-main) !important; vertical-align: middle; }

/* РЕДАКТИРОВАНИЕ В ТАБЛИЦЕ */
.col-id { color: var(--text-muted) !important; font-size: 0.75rem; font-family: monospace; width: 80px; }
.inline-edit { background: transparent; border: 1px solid transparent; padding: 6px 10px; border-radius: 6px; color: var(--text-main) !important; width: 100%; }
.inline-edit:hover { background: var(--bg-input); border-color: var(--border-color); }
.bold { font-weight: 700; }
.mini { font-size: 0.85rem; }
.addr-input { min-width: 250px; }

/* СТАТУС ПВЗ */
.status-label { font-size: 0.65rem; font-weight: 900; color: var(--text-muted); margin-top: 4px; }
.is-active { color: var(--success) !important; }

/* ЧЕКБОКСЫ */
.custom-checkbox { display: flex; align-items: center; gap: 10px; cursor: pointer; position: relative; }
.custom-checkbox input { position: absolute; opacity: 0; }
.checkmark { height: 20px; width: 20px; background-color: var(--bg-input); border: 2px solid var(--border-color); border-radius: 4px; position: relative; }
.custom-checkbox input:checked ~ .checkmark { background-color: var(--primary); border-color: var(--primary); }
.checkmark:after { content: ""; position: absolute; display: none; left: 6px; top: 2px; width: 5px; height: 10px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.custom-checkbox input:checked ~ .checkmark:after { display: block; }
.no-text { padding: 0; margin: 0 auto; width: 20px; }

/* ПУСТОЕ СОСТОЯНИЕ */
.empty-state { text-align: center; padding: 80px 20px; background-color: var(--bg-input); border-radius: var(--radius-lg); border: 2px dashed var(--border-color); color: var(--text-muted); }
.empty-icon { font-size: 3rem; margin-bottom: 15px; opacity: 0.5; }

/* ТЕМНАЯ ТЕМА ФОРС */
:deep(body.dark-theme) .admin-card { background-color: #1e293b !important; }
:deep(body.dark-theme) .inline-edit { color: var(--text-main) !important; }
</style>