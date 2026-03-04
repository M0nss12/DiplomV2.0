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