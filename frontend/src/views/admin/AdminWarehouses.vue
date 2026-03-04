<template>
  <div class="admin-warehouses">
    <h1>Управление складами и ПВЗ (📍)</h1>

    <!-- 1. ФОРМА СОЗДАНИЯ (CREATE) -->
    <section style="border: 1px solid #000; padding: 15px; margin-bottom: 30px;">
      <h3>Добавить новую точку (Склад/ПВЗ)</h3>
      <form @submit.prevent="createWarehouse">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
          <input v-model="newWarehouse.city_name" placeholder="Город (напр. Иркутск)" required />
          <input v-model="newWarehouse.address" placeholder="Полный адрес" required />
          <input v-model="newWarehouse.phone" placeholder="Телефон точки" />
          
          <label style="cursor: pointer;">
            <input type="checkbox" v-model="newWarehouse.is_pickup_point" />
            Доступен как ПВЗ (выдача клиентам)
          </label>
        </div>
        <button type="submit" style="margin-top: 10px; background: green; color: white;">Добавить точку</button>
      </form>
    </section>

    <hr />

    <!-- 2. ТАБЛИЦА СКЛАДОВ (READ / UPDATE / DELETE) -->
    <section>
      <h3>Список всех объектов ({{ warehouses.length }})</h3>
      <table border="1" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>ID</th>
            <th>Город</th>
            <th>Адрес</th>
            <th>Телефон</th>
            <th>ПВЗ?</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="w in warehouses" :key="w.id">
            <td>{{ w.id }}</td>

            <!-- Редактирование города -->
            <td>
              <input v-model="w.city_name" @change="updateWarehouse(w)" style="width: 120px;" />
            </td>

            <!-- Редактирование адреса -->
            <td>
              <input v-model="w.address" @change="updateWarehouse(w)" style="width: 250px;" />
            </td>

            <!-- Редактирование телефона -->
            <td>
              <input v-model="w.phone" @change="updateWarehouse(w)" />
            </td>

            <!-- Переключение статуса ПВЗ -->
            <td style="text-align: center;">
              <input type="checkbox" v-model="w.is_pickup_point" @change="updateWarehouse(w)" />
            </td>

            <td>
              <button @click="deleteWarehouse(w.id)" style="color: red;">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="warehouses.length === 0">Точки не созданы</div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import axios from 'axios';

const ADMIN_KEY = 'my_super_secret_admin_123';
const config = { headers: { 'x-admin-key': ADMIN_KEY } };

const warehouses = ref([]);

// Состояние для новой точки
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
  } catch (e) {
    alert('Ошибка загрузки складов');
  }
};

// CREATE
const createWarehouse = async () => {
  try {
    const res = await axios.post('/api/admin/warehouses', newWarehouse, config);
    warehouses.value.unshift(res.data);
    alert('Точка успешно добавлена');
    // Очистка формы
    newWarehouse.city_name = '';
    newWarehouse.address = '';
    newWarehouse.phone = '';
    newWarehouse.is_pickup_point = true;
  } catch (e) {
    alert('Ошибка при создании точки');
  }
};

// UPDATE
const updateWarehouse = async (w) => {
  try {
    await axios.put(`/api/admin/warehouses/${w.id}`, w, config);
    console.log(`Склад ${w.id} обновлен`);
  } catch (e) {
    alert('Ошибка сохранения');
  }
};

// DELETE
const deleteWarehouse = async (id) => {
  if (!confirm('Вы уверены? Удаление склада может привести к удалению всех записей о его остатках (Cascade)!')) return;
  try {
    await axios.delete(`/api/admin/warehouses/${id}`, config);
    warehouses.value = warehouses.value.filter(item => item.id !== id);
  } catch (e) {
    alert('Ошибка при удалении');
  }
};

onMounted(fetchWarehouses);
</script>