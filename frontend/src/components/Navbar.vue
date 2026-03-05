<template>
  <nav class="main-navbar">
    <div class="nav-container">
      
      <!-- ЛЕВАЯ ЧАСТЬ: ЛОГО, ГОРОД И МЕНЮ -->
      <div class="nav-section">
        <router-link to="/" class="logo"><strong>ApexDrive</strong></router-link>
        
        <!-- БЛОК ВЫБОРА ГОРОДА -->
        <div class="city-selector-container" ref="cityMenu">
          <button @click="toggleCityDropdown" class="city-btn">
            📍 {{ appStore.city || 'Выберите город' }}
          </button>
          
          <transition name="fade">
            <div v-if="isCityDropdownOpen" class="dropdown-menu city-menu">
              <div class="city-search">
                <input 
                  v-model="citySearch" 
                  placeholder="Поиск города..." 
                  @keyup.enter="selectCustomCity"
                  @click.stop 
                />
              </div>
              <div class="city-list">
                <button v-if="citySearch && !exactMatch" @click="selectCustomCity" class="dropdown-item custom-option">
                  ✨ Использовать: "<b>{{ citySearch }}</b>"
                </button>
                <button v-for="city in filteredCities" :key="city" @click="selectCity(city)" class="dropdown-item" :class="{ active: city === appStore.city }">
                  {{ city }}
                </button>
              </div>
            </div>
          </transition>
        </div>

        <div class="menu-links">
          <router-link to="/catalog">Каталог</router-link>
          <router-link to="/about">О нас</router-link>
          <router-link to="/contacts">Контакты</router-link>
        </div>
      </div>

      <!-- ЦЕНТРАЛЬНАЯ ЧАСТЬ: УМНЫЙ ПОИСК -->
      <div class="search-bar-container" ref="searchRef">
        <div class="search-input-wrapper">
          <span class="search-icon-inline">🔍</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Поиск деталей, категорий, страниц..." 
            @focus="isSearchOpen = true"
            @input="handleGlobalSearch"
          />
          <button v-if="searchQuery" @click="clearSearch" class="search-clear-btn">&times;</button>
        </div>

        <transition name="fade">
          <div v-if="isSearchOpen && searchQuery.length >= 2" class="search-dropdown">
            <div v-if="filteredPages.length" class="s-group">
              <div class="s-label">Разделы</div>
              <router-link v-for="p in filteredPages" :key="p.path" :to="p.path" class="s-item" @click="closeSearch">
                <span class="s-icon">{{ p.icon }}</span> {{ p.name }}
              </router-link>
            </div>
            <div v-if="searchResults.categories.length" class="s-group">
              <div class="s-label">Категории</div>
              <router-link v-for="c in searchResults.categories" :key="c.id" :to="`/catalog/${c.id}`" class="s-item" @click="closeSearch">
                <span class="s-icon">📂</span> {{ c.name }}
              </router-link>
            </div>
            <div v-if="searchResults.products.length" class="s-group">
              <div class="s-label">Товары</div>
              <router-link v-for="prod in searchResults.products" :key="prod.id" :to="`/product/${prod.id}`" class="s-item prod-flex" @click="closeSearch">
                <img :src="prod.image_url" class="s-img" />
                <div class="s-info">
                  <div class="s-name">{{ prod.name }}</div>
                  <div class="s-price">{{ prod.discount_price || prod.price }} ₽</div>
                </div>
              </router-link>
            </div>
            <div v-if="noResults" class="s-none">Ничего не найдено</div>
          </div>
        </transition>
      </div>

      <!-- ПРАВАЯ ЧАСТЬ -->
      <div class="nav-section user-actions">
        
        <!-- 🌓 ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ -->
        <button @click="toggleTheme" class="theme-toggle-btn" :title="isDark ? 'Включить светлую тему' : 'Включить темную тему'">
          <span v-if="isDark">☀️</span>
          <span v-else>🌙</span>
        </button>

        <router-link to="/wishlist" class="nav-icon-link" title="Избранное">
          <span class="icon">❤</span>
        </router-link>

        <router-link to="/cart" class="cart-button">
          <span class="cart-icon">🛒</span>
          <div class="cart-info">
            <span class="cart-count">{{ cartStore.totalCount }}</span>
            <span class="cart-sum">{{ cartStore.totalPriceFinal }} ₽</span>
          </div>
        </router-link>

        <div class="divider"></div>

        <div v-if="!userId" class="auth-links">
          <router-link to="/login">Войти</router-link>
          <router-link to="/register" class="reg-btn">Регистрация</router-link>
        </div>

        <div v-else class="user-profile-container" ref="profileMenu">
          <div class="profile-trigger" @click="toggleProfileDropdown">
            <img :src="userAvatar || '/assets/images/avatars/1.png'" class="nav-avatar" />
            <span class="user-display-name">{{ userName }}</span>
            <span class="arrow" :class="{ 'rotate': isProfileDropdownOpen }">▼</span>
          </div>
          
          <transition name="fade">
            <div v-if="isProfileDropdownOpen" class="dropdown-menu profile-menu">
              <router-link v-if="userRole === 'admin'" to="/admin" class="dropdown-item admin-btn">
                <span class="menu-icon">🛡️</span> <b>Админ-панель</b>
              </router-link>
              <hr v-if="userRole === 'admin'" />
              <router-link to="/profile" class="dropdown-item"><span class="menu-icon">👤</span> Профиль</router-link>
              <router-link to="/orders" class="dropdown-item"><span class="menu-icon">📦</span> Заказы</router-link>
              <router-link to="/wishlist" class="dropdown-item"><span class="menu-icon">❤</span> Избранное</router-link>
              <router-link to="/settings" class="dropdown-item"><span class="menu-icon">⚙️</span> Настройки</router-link>
              <hr />
              <button @click="handleLogout" class="dropdown-item logout"><span class="menu-icon">🚪</span> Выйти</button>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '@/stores/cartStore';
import { useAppStore } from '@/stores/appStore';

// --- НАСТРОЙКА AXIOS ---
const storedId = localStorage.getItem('user_id');
const storedName = localStorage.getItem('user_name');
const storedRole = localStorage.getItem('role');

if (storedId) axios.defaults.headers.common['x-user-id'] = storedId;
if (storedName) axios.defaults.headers.common['x-user-name'] = encodeURIComponent(storedName);
if (storedRole) axios.defaults.headers.common['x-user-role'] = storedRole;

const router = useRouter();
const cartStore = useCartStore();
const appStore = useAppStore();

const userId = ref(null);
const userName = ref('');
const userAvatar = ref('');
const userRole = ref(''); 

// --- ЛОГИКА ТЕМЫ ---
const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  }
};

// --- ЛОГИКА ПОИСКА ---
const searchQuery = ref('');
const isSearchOpen = ref(false);
const searchRef = ref(null);
const searchResults = ref({ products: [], categories: [] });
let searchTimer = null;

const staticPages = [
  { name: 'Каталог', path: '/catalog', icon: '🛒', tags: 'запчасти детали' },
  { name: 'О компании', path: '/about', icon: 'ℹ️', tags: 'инфо доставка' },
  { name: 'Контакты', path: '/contacts', icon: '📞', tags: 'адрес телефон' },
  { name: 'Личный кабинет', path: '/profile', icon: '👤', tags: 'профиль данные' },
];

const filteredPages = computed(() => {
  const q = searchQuery.value.toLowerCase();
  return staticPages.filter(p => p.name.toLowerCase().includes(q) || p.tags.toLowerCase().includes(q));
});

const handleGlobalSearch = () => {
  clearTimeout(searchTimer);
  if (searchQuery.value.length < 2) return;
  searchTimer = setTimeout(async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/global-search?q=${searchQuery.value}`);
      searchResults.value = res.data;
    } catch (e) { console.error("Search error:", e); }
  }, 300);
};

const clearSearch = () => { searchQuery.value = ''; isSearchOpen.value = false; };
const closeSearch = () => isSearchOpen.value = false;

// --- ЛОГИКА ГОРОДА ---
const isCityDropdownOpen = ref(false);
const cityMenu = ref(null);
const availableCities = ref([]);
const citySearch = ref('');

const updateCityInDB = async (newCity) => {
  if (userId.value) {
    try { await axios.put(`/api/users/profile/${userId.value}`, { saved_address: newCity }); } 
    catch (e) { console.error("DB Sync error:", e); }
  }
};

const selectCity = async (city) => {
  appStore.setCity(city);
  isCityDropdownOpen.value = false;
  citySearch.value = '';
  await updateCityInDB(city);
};

const selectCustomCity = async () => {
  if (citySearch.value.trim()) {
    const city = citySearch.value.trim();
    appStore.setCity(city);
    isCityDropdownOpen.value = false;
    citySearch.value = '';
    await updateCityInDB(city);
  }
};

const exactMatch = computed(() => availableCities.value.some(c => c.toLowerCase() === citySearch.value.toLowerCase().trim()));
const filteredCities = computed(() => citySearch.value ? availableCities.value.filter(c => c.toLowerCase().includes(citySearch.value.toLowerCase())) : availableCities.value);
const noResults = computed(() => !filteredPages.value.length && !searchResults.value.products.length && !searchResults.value.categories.length);

// --- КЛИКИ И ДРОПДАУНЫ ---
const isProfileDropdownOpen = ref(false);
const profileMenu = ref(null);

const toggleProfileDropdown = () => { isProfileDropdownOpen.value = !isProfileDropdownOpen.value; isCityDropdownOpen.value = false; };
const toggleCityDropdown = () => { isCityDropdownOpen.value = !isCityDropdownOpen.value; isProfileDropdownOpen.value = false; };

const handleClickOutside = (event) => {
  if (profileMenu.value && !profileMenu.value.contains(event.target)) isProfileDropdownOpen.value = false;
  if (cityMenu.value && !cityMenu.value.contains(event.target)) isCityDropdownOpen.value = false;
  if (searchRef.value && !searchRef.value.contains(event.target)) isSearchOpen.value = false;
};

const loadCities = async () => {
  try {
    const res = await axios.get('/api/admin/warehouses', { headers: { 'x-admin-key': 'my_super_secret_admin_123' }});
    availableCities.value = Array.from(new Set(res.data.map(w => w.city_name))).sort();
  } catch (e) { availableCities.value = ['Москва', 'Санкт-Петербург', 'Иркутск', 'Ангарск']; }
};

onMounted(() => {
  userId.value = localStorage.getItem('user_id');
  userName.value = localStorage.getItem('user_name');
  userAvatar.value = localStorage.getItem('user_avatar');
  userRole.value = localStorage.getItem('role'); 
  
  // Проверка сохраненной темы
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    isDark.value = true;
    document.body.classList.add('dark-theme');
  }

  loadCities();
  window.addEventListener('click', handleClickOutside);
});

onUnmounted(() => window.removeEventListener('click', handleClickOutside));

const handleLogout = () => {
  if (confirm('Выйти из системы?')) {
    localStorage.clear();
    router.push('/');
    setTimeout(() => window.location.reload(), 100);
  }
};
</script>

<style scoped>
/* ==========================================================================
   СТИЛИ NAVBAR
   ========================================================================== */

.main-navbar {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-color);
    height: 76px;
    position: sticky;
    top: 0;
    z-index: 1000;
    transition: var(--transition);
}

body.dark-theme .main-navbar {
    background: rgba(15, 23, 42, 0.85);
}

.nav-container {
    max-width: 1440px;
    margin: 0 auto;
    width: 95%;
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

/* --- СЕКЦИИ --- */
.nav-section {
    display: flex;
    align-items: center;
    gap: 15px;
}

/* --- ЛОГОТИП --- */
.logo {
    text-decoration: none;
    font-size: 1.6rem;
    margin-right: 10px;
}

.logo strong {
    font-weight: 900;
    letter-spacing: -1px;
    background: linear-gradient(135deg, var(--primary) 0%, #818cf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

/* --- ВЫБОР ГОРОДА --- */
.city-selector-container {
    position: relative;
}

.city-btn {
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    padding: 8px 14px;
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-main);
    cursor: pointer;
    white-space: nowrap;
    transition: var(--transition);
}

.city-btn:hover {
    border-color: var(--primary);
    background: var(--primary-light);
    color: var(--primary);
}

/* Меню выбора города */
.city-menu {
    width: 260px;
    padding: 10px;
}

.city-search {
    margin-bottom: 10px;
}

.city-search input {
    width: 100%;
    padding: 10px;
    font-size: 0.9rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-input);
}

.city-list {
    max-height: 250px;
    overflow-y: auto;
}

.custom-option {
    color: var(--primary) !important;
    background: var(--primary-light) !important;
    margin-bottom: 8px;
    font-weight: 600;
}

/* --- МЕНЮ ССЫЛКИ --- */
.menu-links {
    display: flex;
    gap: 20px;
    margin-left: 10px;
}

.menu-links a {
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.95rem;
    transition: var(--transition);
    text-decoration: none;
}

.menu-links a:hover, 
.menu-links a.router-link-active {
    color: var(--primary);
}

/* --- УМНЫЙ ПОИСК (ЦЕНТР) --- */
.search-bar-container {
    flex: 1;
    max-width: 500px;
    position: relative;
}

.search-input-wrapper {
    display: flex;
    align-items: center;
    background: var(--bg-input);
    padding: 0 16px;
    border-radius: var(--radius-full);
    border: 2px solid transparent;
    height: 44px;
    transition: var(--transition);
}

.search-input-wrapper:focus-within {
    background: var(--bg-card);
    border-color: var(--primary);
    box-shadow: 0 0 0 4px var(--primary-light);
}

.search-icon-inline {
    margin-right: 10px;
    font-size: 1rem;
    opacity: 0.5;
}

.search-input-wrapper input {
    border: none !important;
    background: transparent !important;
    width: 100%;
    color: var(--text-main);
    font-size: 0.95rem;
    outline: none;
    padding: 0;
}

.search-clear-btn {
    background: none;
    border: none;
    font-size: 1.4rem;
    color: var(--text-muted);
    cursor: pointer;
    line-height: 1;
}

/* Выпадающий список поиска */
.search-dropdown {
    position: absolute;
    top: calc(100% + 12px);
    left: 0;
    right: 0;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 1100;
    overflow: hidden;
    max-height: 500px;
    overflow-y: auto;
}

.s-group {
    border-bottom: 1px solid var(--border-color);
}

.s-group:last-child { border: none; }

.s-label {
    background: var(--bg-input);
    padding: 6px 16px;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 1px;
}

.s-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    text-decoration: none;
    color: var(--text-main);
    font-size: 0.9rem;
    transition: var(--transition);
}

.s-item:hover {
    background: var(--primary-light);
    color: var(--primary);
}

.prod-flex {
    align-items: flex-start;
}

.s-img {
    width: 44px;
    height: 44px;
    object-fit: contain;
    background: #fff;
    border-radius: 6px;
    border: 1px solid var(--border-color);
}

.s-info { flex: 1; }
.s-name { font-weight: 600; line-height: 1.2; margin-bottom: 2px; }
.s-price { color: var(--success); font-weight: 700; font-size: 0.85rem; }

.s-none {
    padding: 30px;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.9rem;
}

/* --- ПРАВАЯ ЧАСТЬ (USER ACTIONS) --- */
.user-actions {
    gap: 12px;
}

.nav-icon-link {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: var(--text-muted);
    font-size: 1.2rem;
    transition: var(--transition);
    text-decoration: none;
}

.nav-icon-link:hover {
    background: var(--danger-light);
    color: var(--danger);
    transform: translateY(-2px);
}

/* Корзина */
.cart-button {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--bg-input);
    padding: 6px 16px 6px 12px;
    border-radius: var(--radius-full);
    text-decoration: none;
    transition: var(--transition);
    border: 1px solid transparent;
}

.cart-button:hover {
    background: var(--success-light);
    border-color: var(--success);
}

.cart-icon { font-size: 1.3rem; }
.cart-info { display: flex; flex-direction: column; line-height: 1.1; }
.cart-count { font-size: 0.75rem; font-weight: 800; color: var(--success); }
.cart-sum { font-size: 0.85rem; font-weight: 700; color: var(--text-main); }

/* Авторизация */
.auth-links {
    display: flex;
    align-items: center;
    gap: 15px;
}

.auth-links a {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--text-main);
    text-decoration: none;
}

.reg-btn {
    background: var(--primary);
    color: #fff !important;
    padding: 8px 18px;
    border-radius: var(--radius-sm);
    box-shadow: 0 4px 12px var(--primary-light);
}

/* Профиль */
.profile-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 4px;
    padding-right: 12px;
    border-radius: var(--radius-full);
    background: var(--bg-input);
    transition: var(--transition);
}

.profile-trigger:hover {
    background: var(--border-color);
}

.nav-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #fff;
}

.user-display-name {
    font-size: 0.85rem;
    font-weight: 700;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.arrow {
    font-size: 0.6rem;
    transition: transform 0.3s;
    opacity: 0.5;
}

.arrow.rotate { transform: rotate(180deg); }

/* Выпадающее меню профиля */
.profile-menu {
    right: 0;
    min-width: 220px;
}

.dropdown-item.admin-btn {
    color: var(--warning);
    background: var(--warning-light);
    margin: 5px;
    border-radius: 8px;
}

.logout {
    color: var(--danger) !important;
}

.logout:hover {
    background: var(--danger-light) !important;
}

hr {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 5px 0;
}

/* --- ТРАНЗИЦИИ (VUE FADE) --- */
.fade-enter-active, .fade-leave-active {
    transition: all 0.2s ease-out;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

/* --- АДАПТИВНОСТЬ --- */
@media (max-width: 1100px) {
    .menu-links { display: none; }
}

@media (max-width: 850px) {
    .user-display-name, .cart-sum { display: none; }
    .cart-button { padding: 8px; border-radius: 50%; }
}

@media (max-width: 650px) {
    .main-navbar { height: auto; padding: 10px 0; }
    .nav-container { flex-direction: column; gap: 10px; }
    .nav-section { width: 100%; justify-content: space-between; }
    .search-bar-container { width: 100%; max-width: 100%; order: 3; }
}
</style>