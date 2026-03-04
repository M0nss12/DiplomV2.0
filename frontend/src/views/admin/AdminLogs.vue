<template>
  <div class="admin-logs-page">
    <div class="header-panel">
      <div class="title-box">
        <h2>🖥️ Системный журнал</h2>
        <span class="log-stats">Всего в памяти: {{ logs.length }} записей</span>
      </div>
      
      <div class="controls">
        <!-- Поиск по логам -->
        <div class="search-box">
          <input v-model="searchQuery" placeholder="Поиск по IP, User ID или сообщению..." class="search-input" />
        </div>

        <div class="tab-switcher">
          <button :class="{ active: logType === 'actions' }" @click="setLogType('actions')">🚀 Действия</button>
          <button :class="{ active: logType === 'errors' }" @click="setLogType('errors')">❌ Ошибки</button>
        </div>

        <!-- Автообновление -->
        <label class="auto-refresh">
          <input type="checkbox" v-model="autoRefresh" /> Live
        </label>

        <button @click="fetchLogs" class="btn-refresh" :disabled="loading">
          {{ loading ? '...' : '🔄' }}
        </button>
      </div>
    </div>

    <!-- ТАБЛИЦА ДЕЙСТВИЙ -->
    <div v-if="logType === 'actions'" class="log-container shadow-v">
      <table class="log-table">
        <thead>
          <tr>
            <th>Время</th>
            <th>Пользователь</th>
            <th>Метод</th>
            <th>Описание действия</th>
            <th>IP адрес</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in paginatedLogs" :key="log.id" class="row-action">
            <td class="cell-time">{{ formatTime(log.timestamp) }}</td>
            <td class="cell-user">
              <span class="role-badge" :class="log.user?.role">{{ log.user?.role }}</span>
              <span class="user-name">{{ log.user?.name }}</span>
            </td>
            <td>
              <span class="method-badge" :class="getMethodClass(log.action)">{{ log.action }}</span>
            </td>
            <td class="cell-msg">{{ log.message }}</td>
            <td class="cell-ip"><code>{{ log.ip }}</code></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ТАБЛИЦА ОШИБОК -->
    <div v-if="logType === 'errors'" class="log-container shadow-v">
      <table class="log-table">
        <thead>
          <tr>
            <th>Время</th>
            <th>Тип ошибки</th>
            <th>Локация (Стек)</th>
            <th>Запрос</th>
            <th style="text-align: center;">Анализ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in paginatedLogs" :key="log.id" class="row-error">
            <td class="cell-time">{{ formatTime(log.timestamp) }}</td>
            <td class="cell-msg-err"><strong>{{ log.message }}</strong></td>
            <td class="cell-stack"><code>{{ log.stack }}</code></td>
            <td class="cell-url">
              <span class="method-badge small">{{ log.method }}</span>
              <code>{{ log.url }}</code>
            </td>
            <td style="text-align: center;">
              <button @click="openErrorDetail(log)" class="btn-more">🔍 Детали</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ПАГИНАЦИЯ -->
    <div v-if="totalPages > 1" class="pagination-box">
      <button @click="currentPage--" :disabled="currentPage === 1" class="p-btn">Пред.</button>
      <div class="p-numbers">
        <button v-for="p in totalPages" :key="p" @click="currentPage = p" 
                :class="{ active: currentPage === p }" class="p-num">{{ p }}</button>
      </div>
      <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-btn">След.</button>
    </div>

    <div v-if="filteredLogs.length === 0 && !loading" class="empty-state">По вашему запросу записей не найдено</div>

    <!-- МОДАЛКА ДЛЯ СТЕКА ОШИБКИ -->
    <div v-if="selectedError" class="modal-overlay" @click="selectedError = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>🚨 Технический отчет об ошибке</h3>
          <button @click="selectedError = null" class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="info-block">
                <strong>URL:</strong> <code>{{ selectedError.method }} {{ selectedError.url }}</code>
            </div>
            <div class="code-header">Полный Stack Trace:</div>
            <pre class="full-stack">{{ selectedError.fullStack }}</pre>
            
            <div v-if="selectedError.body" class="body-block">
                <strong>Данные запроса (Body):</strong>
                <pre class="json-block">{{ JSON.stringify(selectedError.body, null, 2) }}</pre>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import axios from 'axios';

const logs = ref([]);
const logType = ref('actions'); 
const selectedError = ref(null);
const loading = ref(false);
const searchQuery = ref('');

// Пагинация
const currentPage = ref(1);
const itemsPerPage = 20;

// Автообновление
const autoRefresh = ref(false);
let refreshInterval = null;

const setLogType = (type) => {
  logType.value = type;
  currentPage.value = 1;
  fetchLogs();
};

const fetchLogs = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`http://localhost:3000/api/admin/system/logs?type=${logType.value}`, {
      headers: { 'x-admin-key': 'my_super_secret_admin_123' }
    });
    logs.value = res.data;
  } catch (e) {
    console.error('Ошибка загрузки логов');
  } finally {
    loading.value = false;
  }
};

// --- УМНАЯ ФИЛЬТРАЦИЯ ---
const filteredLogs = computed(() => {
    if (!searchQuery.value.trim()) return logs.value;
    const q = searchQuery.value.toLowerCase().trim();
    return logs.value.filter(l => {
        return l.message?.toLowerCase().includes(q) || 
               l.ip?.includes(q) || 
               l.user?.name?.toLowerCase().includes(q) ||
               l.user?.id?.toString() === q;
    });
});

// --- ЛОГИКА ПАГИНАЦИИ ---
const totalPages = computed(() => Math.ceil(filteredLogs.value.length / itemsPerPage));
const paginatedLogs = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredLogs.value.slice(start, start + itemsPerPage);
});

// Сброс страницы при поиске
watch(searchQuery, () => currentPage.value = 1);

// Автообновление раз в 10 секунд
watch(autoRefresh, (newVal) => {
    if (newVal) {
        refreshInterval = setInterval(fetchLogs, 10000);
    } else {
        clearInterval(refreshInterval);
    }
});

const getMethodClass = (action) => {
    if (action.includes('DELETE')) return 'm-delete';
    if (action.includes('POST')) return 'm-post';
    if (action.includes('PATCH') || action.includes('PUT')) return 'm-update';
    return 'm-get';
};

const formatTime = (ts) => ts.split(', ')[1]; // Оставляем только время для компактности
const openErrorDetail = (log) => { selectedError.value = log; };

onMounted(fetchLogs);
onUnmounted(() => clearInterval(refreshInterval));
</script>

<style scoped>
.admin-logs-page { padding: 20px; background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
.header-panel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; gap: 20px; }
.log-stats { font-size: 0.8rem; color: #94a3b8; font-weight: 600; }

.controls { display: flex; align-items: center; gap: 15px; }
.search-input { padding: 10px 15px; border-radius: 10px; border: 1px solid #e2e8f0; width: 250px; outline: none; transition: 0.3s; }
.search-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }

.tab-switcher { display: flex; background: #e2e8f0; padding: 4px; border-radius: 10px; }
.tab-switcher button { border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.85rem; color: #64748b; transition: 0.2s; }
.tab-switcher button.active { background: white; color: #4f46e5; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.log-container { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
.log-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.log-table th { background: #f8fafc; padding: 12px 15px; text-align: left; color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
.log-table td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; }

.cell-time { color: #94a3b8; font-family: monospace; font-weight: bold; width: 100px; }
.cell-msg { color: #334155; font-weight: 500; }
.user-name { font-weight: 700; color: #1e293b; }

/* Badges */
.role-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; color: white; text-transform: uppercase; margin-right: 8px; vertical-align: middle; }
.admin { background: #ef4444; }
.user { background: #3b82f6; }
.guest { background: #94a3b8; }

.method-badge { font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px; color: white; }
.m-delete { background: #f43f5e; }
.m-post { background: #10b981; }
.m-update { background: #f59e0b; }
.m-get { background: #6366f1; }

/* Errors */
.row-error { background: #fff1f2; }
.cell-msg-err { color: #be123c; }
.cell-stack { font-family: monospace; color: #64748b; font-size: 11px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.btn-more { padding: 5px 10px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 700; }
.btn-more:hover { background: #f8fafc; border-color: #cbd5e1; }

/* Pagination */
.pagination-box { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 25px; }
.p-numbers { display: flex; gap: 5px; }
.p-num { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-weight: bold; font-size: 12px; }
.p-num.active { background: #4f46e5; color: white; border-color: #4f46e5; }
.p-btn { padding: 8px 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-weight: 600; font-size: 12px; }

/* Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15,23,42,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.modal-content { background: white; width: 800px; border-radius: 20px; box-shadow: 0 25px 50px rgba(0,0,0,0.2); overflow: hidden; }
.modal-header { padding: 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
.modal-body { padding: 25px; max-height: 70vh; overflow-y: auto; }
.full-stack { background: #1e293b; color: #fda4af; padding: 20px; border-radius: 12px; font-size: 12px; font-family: 'Fira Code', monospace; line-height: 1.6; overflow-x: auto; }
.json-block { background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 12px; }
.code-header { margin: 20px 0 10px; font-weight: 800; color: #64748b; font-size: 0.8rem; text-transform: uppercase; }

.empty-state { text-align: center; padding: 60px; color: #94a3b8; font-weight: 600; }
</style>