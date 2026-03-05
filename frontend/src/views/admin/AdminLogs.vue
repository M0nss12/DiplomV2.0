<template>
  <div class="admin-logs">
    <!-- ШАПКА ЖУРНАЛА -->
    <div class="header-row">
      <div class="header-left">
        <h1>🖥️ Системный журнал</h1>
        <p class="subtitle">Мониторинг активности пользователей и ошибок сервера</p>
      </div>
      <div class="stats-badge">
        Записей: <b>{{ logs.length }}</b>
      </div>
    </div>

    <!-- ПАНЕЛЬ УПРАВЛЕНИЯ -->
    <section class="admin-card control-panel">
      <div class="filter-grid">
        <div class="input-group search-group">
          <label>🔍 Поиск</label>
          <input v-model="searchQuery" placeholder="IP, User ID или сообщение..." />
        </div>

        <div class="input-group">
          <label>Тип логов</label>
          <div class="tab-switcher">
            <button :class="{ active: logType === 'actions' }" @click="setLogType('actions')">🚀 Действия</button>
            <button :class="{ active: logType === 'errors' }" @click="setLogType('errors')">❌ Ошибки</button>
          </div>
        </div>

        <div class="refresh-group">
          <label class="custom-checkbox live-check">
            <input type="checkbox" v-model="autoRefresh" />
            <span class="checkmark"></span>
            <span class="live-label">LIVE</span>
          </label>
          <button @click="fetchLogs" class="btn-refresh" :disabled="loading" :title="loading ? 'Загрузка...' : 'Обновить'">
            <span :class="{ 'spinning': loading }">🔄</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ТАБЛИЦА ДЕЙСТВИЙ -->
    <div v-if="logType === 'actions'" class="table-container">
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-time">Время</th>
              <th>Пользователь</th>
              <th class="col-method">Метод</th>
              <th>Описание действия</th>
              <th>IP адрес</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in paginatedLogs" :key="log.id">
              <td class="col-time">{{ formatTime(log.timestamp) }}</td>
              <td>
                <div class="user-info">
                  <span class="badge" :class="log.user?.role">{{ log.user?.role }}</span>
                  <span class="user-name">{{ log.user?.name }}</span>
                </div>
              </td>
              <td>
                <span class="method-badge" :class="getMethodClass(log.action)">{{ log.action }}</span>
              </td>
              <td class="cell-msg">{{ log.message }}</td>
              <td><code>{{ log.ip }}</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ТАБЛИЦА ОШИБОК -->
    <div v-if="logType === 'errors'" class="table-container">
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="col-time">Время</th>
              <th>Сообщение</th>
              <th>Локация (Стек)</th>
              <th>Запрос</th>
              <th class="text-right">Анализ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in paginatedLogs" :key="log.id" class="row-error">
              <td class="col-time">{{ formatTime(log.timestamp) }}</td>
              <td class="error-msg"><b>{{ log.message }}</b></td>
              <td><code class="stack-preview">{{ log.stack }}</code></td>
              <td>
                 <span class="method-badge small">{{ log.method }}</span>
                 <code class="url-text">{{ log.url }}</code>
              </td>
              <td class="text-right">
                <button @click="openErrorDetail(log)" class="btn-detail">🔍 Детали</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ПАГИНАЦИЯ -->
    <div v-if="totalPages > 1" class="pagination-wrapper">
      <button @click="currentPage--" :disabled="currentPage === 1" class="p-btn">←</button>
      <div class="p-numbers">
        <button v-for="p in totalPages" :key="p" @click="currentPage = p" :class="{ active: currentPage === p }">
          {{ p }}
        </button>
      </div>
      <button @click="currentPage++" :disabled="currentPage === totalPages" class="p-btn">→</button>
    </div>

    <!-- МОДАЛКА ДЕТАЛЕЙ ОШИБКИ -->
    <div v-if="selectedError" class="modal-overlay" @click="selectedError = null">
      <div class="modal-content log-modal" @click.stop>
        <div class="modal-header">
          <h3>🚨 Технический отчет об ошибке</h3>
          <button @click="selectedError = null" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="tech-info">
                <strong>URL:</strong> <code>{{ selectedError.method }} {{ selectedError.url }}</code>
            </div>
            <p class="label">Stack Trace:</p>
            <pre class="terminal-box">{{ selectedError.stack }}</pre>
            
            <div v-if="selectedError.body">
                <p class="label">Request Body (JSON):</p>
                <pre class="terminal-box json">{{ JSON.stringify(selectedError.body, null, 2) }}</pre>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* КОД СКРИПТА ОСТАВЛЯЕМ ТВОЙ ОРИГИНАЛЬНЫЙ (логика не меняется) */
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import axios from 'axios';

const logs = ref([]);
const logType = ref('actions'); 
const selectedError = ref(null);
const loading = ref(false);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 20;
const autoRefresh = ref(false);
let refreshInterval = null;

const setLogType = (type) => { logType.value = type; currentPage.value = 1; fetchLogs(); };

const fetchLogs = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`http://localhost:3000/api/admin/system/logs?type=${logType.value}`, {
      headers: { 'x-admin-key': 'my_super_secret_admin_123' }
    });
    logs.value = res.data;
  } catch (e) { console.error('Ошибка загрузки логов'); } 
  finally { loading.value = false; }
};

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

const totalPages = computed(() => Math.ceil(filteredLogs.value.length / itemsPerPage));
const paginatedLogs = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredLogs.value.slice(start, start + itemsPerPage);
});

watch(searchQuery, () => currentPage.value = 1);
watch(autoRefresh, (newVal) => {
    if (newVal) refreshInterval = setInterval(fetchLogs, 10000);
    else clearInterval(refreshInterval);
});

const getMethodClass = (action) => {
    if (action.includes('DELETE')) return 'm-delete';
    if (action.includes('POST')) return 'm-post';
    if (action.includes('PATCH') || action.includes('PUT')) return 'm-update';
    return 'm-get';
};

const formatTime = (ts) => ts && ts.includes(', ') ? ts.split(', ')[1] : ts;
const openErrorDetail = (log) => { selectedError.value = log; };

onMounted(fetchLogs);
onUnmounted(() => clearInterval(refreshInterval));
</script>

<style scoped>
.admin-logs {
  padding: 40px 20px;
  animation: fadeIn 0.4s ease-out;
  color: var(--text-main);
}

/* ШАПКА */
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
h1 { font-size: 2.2rem; font-weight: 800; margin: 0; }
.subtitle { color: var(--text-muted); margin-top: 5px; }
.stats-badge { background: var(--primary-light); color: var(--primary); padding: 10px 20px; border-radius: 50px; font-weight: 700; }

/* КАРТОЧКА УПРАВЛЕНИЯ */
.admin-card {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-lg);
  padding: 25px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 30px;
}

.filter-grid { display: grid; grid-template-columns: 2fr 1.5fr auto; gap: 20px; align-items: flex-end; }
.input-group label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted) !important; margin-bottom: 8px; text-transform: uppercase; }

input {
  width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border-color);
  background-color: var(--bg-input) !important; color: var(--text-main) !important;
}

/* Переключатель вкладок */
.tab-switcher { background: var(--bg-input); padding: 4px; border-radius: 12px; display: flex; gap: 4px; }
.tab-switcher button {
  flex: 1; padding: 10px; border: none; background: transparent; color: var(--text-muted);
  font-weight: 700; cursor: pointer; border-radius: 8px; transition: 0.2s;
}
.tab-switcher button.active { background: var(--bg-card); color: var(--primary); box-shadow: var(--shadow-sm); }

/* LIVE кнопка и обновление */
.refresh-group { display: flex; align-items: center; gap: 20px; height: 46px; }
.live-check { color: var(--success) !important; font-weight: 800; display: flex; align-items: center; gap: 8px; cursor: pointer; }
.live-label { font-size: 0.8rem; letter-spacing: 1px; }

.btn-refresh {
  width: 46px; height: 46px; border-radius: 50%; border: 1px solid var(--border-color);
  background: var(--bg-card); color: var(--text-main); font-size: 1.2rem; cursor: pointer;
}
.spinning { display: inline-block; animation: spin 1s linear infinite; }

/* ТАБЛИЦА */
.admin-table-wrapper { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { background-color: var(--bg-input) !important; padding: 15px 20px; text-align: left; font-size: 0.75rem; color: var(--text-muted) !important; border-bottom: 2px solid var(--border-color); text-transform: uppercase; }
.admin-table td { padding: 12px 20px; border-bottom: 1px solid var(--border-color); color: var(--text-main) !important; vertical-align: middle; font-size: 0.9rem; }

.col-time { font-family: monospace; font-weight: 700; color: var(--primary); width: 100px; }
code { background: var(--bg-input); padding: 3px 6px; border-radius: 6px; font-family: monospace; color: var(--text-muted); }

/* Методы (Badges) */
.method-badge { padding: 4px 8px; border-radius: 6px; font-weight: 800; font-family: monospace; font-size: 0.75rem; }
.m-get { background: #dcfce7 !important; color: #15803d !important; }
.m-post { background: #e0e7ff !important; color: #4338ca !important; }
.m-update { background: #fef3c7 !important; color: #b45309 !important; }
.m-delete { background: #fee2e2 !important; color: #b91c1c !important; }

/* Роли */
.badge { padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-right: 8px; }
.admin { background: var(--warning-light); color: var(--warning); }
.user { background: var(--primary-light); color: var(--primary); }

/* ОШИБКИ */
.row-error { background-color: rgba(244, 63, 94, 0.02); }
.error-msg { color: var(--danger); }
.stack-preview { opacity: 0.6; font-size: 0.8rem; white-space: nowrap; max-width: 200px; overflow: hidden; display: block; text-overflow: ellipsis; }

.btn-detail { background: var(--bg-input); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: 6px; cursor: pointer; color: var(--text-main); font-weight: 600; }

/* МОДАЛКА ЛОГОВ */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 9999; }
.log-modal { width: 90%; max-width: 900px; padding: 35px; border-radius: 20px; background: var(--bg-card); border: 1px solid var(--border-color); }

.terminal-box {
    background: #0f172a; color: #e2e8f0; padding: 20px; border-radius: 12px;
    font-family: 'Fira Code', monospace; font-size: 0.85rem; overflow-x: auto;
    margin: 10px 0 20px; line-height: 1.5; border: 1px solid rgba(255,255,255,0.1);
}
.json { color: #60a5fa; }
.label { font-weight: 800; font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); }

/* ПАГИНАЦИЯ */
.pagination-wrapper { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 30px; }
.p-btn { padding: 10px 15px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-main); cursor: pointer; }
.p-numbers { display: flex; gap: 8px; }
.p-numbers button { width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--bg-card); color: var(--text-main); cursor: pointer; font-weight: 700; }
.p-numbers button.active { background-color: var(--primary); color: #fff; border-color: var(--primary); }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.text-right { text-align: right; }

/* АДАПТИВНОСТЬ */
@media (max-width: 900px) {
  .filter-grid { grid-template-columns: 1fr; }
  .refresh-group { justify-content: space-between; }
}

/* ТЕМНАЯ ТЕМА ФОРС */
:deep(body.dark-theme) .admin-card { background-color: #1e293b !important; }
:deep(body.dark-theme) .terminal-box { background-color: #020617; }
</style>