<template>
  <div class="admin-cards">
    <h1>Управление картами пользователей (💳)</h1>

    <!-- 1. БЛОК ФИЛЬТРОВ И ПОИСКА -->
    <section style="background: #f8fafc; padding: 20px; border-radius: 16px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; font-size: 1rem; color: #64748b;">🔍 Поиск и фильтры</h3>
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; align-items: flex-end;">
        
        <!-- Текстовый поиск -->
        <div>
          <label style="font-size: 0.8rem; font-weight: bold; color: #475569;">Поиск (Номер, Владелец, ID):</label>
          <input 
            v-model="searchQuery" 
            placeholder="Напр. 4444 или Иван..." 
            style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; margin-top: 5px;" 
          />
        </div>

        <!-- Фильтр по бренду -->
        <div>
          <label style="font-size: 0.8rem; font-weight: bold; color: #475569;">Платежная система:</label>
          <select v-model="filters.brand" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; margin-top: 5px;">
            <option value="all">Все системы</option>
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="mir">Мир</option>
          </select>
        </div>

        <!-- Только основные -->
        <div style="padding-bottom: 12px;">
          <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 600;">
            <input type="checkbox" v-model="filters.onlyDefault" /> Только основные
          </label>
        </div>

        <button @click="resetFilters" style="padding: 12px; background: white; border: 1px solid #cbd5e1; border-radius: 10px; cursor: pointer; font-weight: 600;">
          Сбросить всё
        </button>
      </div>
    </section>

    <!-- 2. ТАБЛИЦА КАРТ -->
    <section>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0;">Найдено карт: {{ filteredCards.length }}</h3>
        <div style="color: #94a3b8; font-size: 0.9rem;">Страница {{ currentPage }} из {{ totalPages || 1 }}</div>
      </div>

      <div v-if="loading" style="padding: 40px; text-align: center;">Загрузка данных...</div>
      
      <table v-else border="1" style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background: #f1f5f9; text-align: left;">
            <th style="padding: 15px;">ID</th>
            <th>Пользователь</th>
            <th>Бренд</th>
            <th>Номер (маска)</th>
            <th>Владелец</th>
            <th>Срок</th>
            <th>Статус</th>
            <th style="text-align: center;">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="card in paginatedCards" :key="card.id" style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 15px; color: #94a3b8;">#{{ card.id }}</td>
            
            <td>
              <div style="font-weight: bold; color: #1e293b;">{{ getUserName(card.user_id) }}</div>
              <small style="color: #64748b;">User ID: {{ card.user_id }}</small>
            </td>

            <td>
              <span :class="card.brand" class="brand-badge">{{ card.brand }}</span>
            </td>

            <td style="font-family: monospace; font-weight: bold; letter-spacing: 1px; font-size: 1.1rem;">
              {{ card.card_number_masked }}
            </td>

            <td style="text-transform: uppercase; font-size: 0.85rem; font-weight: 600;">{{ card.card_holder }}</td>
            <td style="font-weight: 600;">{{ card.expiry_date }}</td>

            <td>
              <label style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" v-model="card.is_default" @change="updateCard(card)" />
                <span :style="{ color: card.is_default ? '#10b981' : '#94a3b8', fontWeight: 'bold', fontSize: '0.8rem' }">
                  {{ card.is_default ? 'ОСНОВНАЯ' : 'ОБЫЧНАЯ' }}
                </span>
              </label>
            </td>

            <td style="text-align: center;">
              <button @click="deleteCard(card.id)" style="color: #ef4444; border: none; background: #fff1f2; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s;">
                Удалить
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 3. ПАГИНАЦИЯ -->
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

      <div v-if="!loading && filteredCards.length === 0" style="padding: 60px; text-align: center; color: #94a3b8; background: white; border-radius: 12px; margin-top: 20px;">
        📭 Карты не найдены. Попробуйте изменить параметры поиска.
      </div>
    </section>
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

// ПАГИНАЦИЯ
const currentPage = ref(1);
const itemsPerPage = 20;

// ФИЛЬТРЫ
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
  } catch (e) {
    alert('Ошибка загрузки данных');
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  filters.brand = 'all';
  filters.onlyDefault = false;
  currentPage.value = 1;
};

const getUserName = (userId) => {
  const user = users.value.find(u => u.id === userId);
  return user ? `${user.first_name} ${user.last_name || ''}` : `Юзер #${userId}`;
};

const updateCard = async (card) => {
  try {
    await axios.put(`/api/admin/user_cards/${card.id}`, card, config);
  } catch (e) {
    alert('Ошибка обновления');
  }
};

const deleteCard = async (id) => {
  if (!confirm('Отвязать карту?')) return;
  try {
    await axios.delete(`/api/admin/user_cards/${id}`, config);
    cards.value = cards.value.filter(c => c.id !== id);
  } catch (e) {
    alert('Ошибка удаления');
  }
};

// --- ЛОГИКА ФИЛЬТРАЦИИ ---
const filteredCards = computed(() => {
  let res = [...cards.value];

  // Поиск по тексту
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    res = res.filter(c => 
      c.card_number_masked.includes(q) || 
      c.user_id.toString() === q ||
      c.card_holder.toLowerCase().includes(q)
    );
  }

  // По бренду
  if (filters.brand !== 'all') {
    res = res.filter(c => c.brand === filters.brand);
  }

  // Только основные
  if (filters.onlyDefault) {
    res = res.filter(c => c.is_default);
  }

  return res;
});

// --- ЛОГИКА ПАГИНАЦИИ ---
const totalPages = computed(() => Math.ceil(filteredCards.value.length / itemsPerPage));

const paginatedCards = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredCards.value.slice(start, end);
});

// Сброс страницы при поиске
watch([searchQuery, filters], () => {
  currentPage.value = 1;
});

onMounted(fetchCards);
</script>

<style scoped>
.brand-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  color: white;
  display: inline-block;
}
.visa { background: #1a1f71; }
.mastercard { background: #eb001b; }
.mir { background: #00a550; }
</style>