<template>
  <nav class="main-navbar">
    <div class="nav-container">
      
      <!-- ЛЕВАЯ ЧАСТЬ: ЛОГО, ГОРОД, МЕНЮ -->
      <div class="nav-section left-section">
        <router-link to="/" class="logo">
          <strong>ApexDrive</strong>
        </router-link>
        
        <div class="city-selector-container" ref="cityMenu">
          <button @click="toggleCityDropdown" class="city-btn glass-btn">
            <span class="city-icon">📍</span>
            {{ appStore.city || 'Выберите город' }}
            <span class="dropdown-arrow" :class="{ rotate: isCityDropdownOpen }">▼</span>
          </button>
          <transition name="fade">
            <div v-if="isCityDropdownOpen" class="dropdown-menu city-menu glass-card">
              <div class="city-search">
                <input v-model="citySearch" placeholder="Поиск города..." @keyup.enter="selectCustomCity" @click.stop />
              </div>
              <div class="city-list">
                <button v-if="citySearch && !exactMatch" @click="selectCustomCity" class="dropdown-item custom-option">
                  ✨ Использовать: <b>"{{ citySearch }}"</b>
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

      <!-- ЦЕНТРАЛЬНАЯ ЧАСТЬ: ПОИСК -->
      <div class="search-bar-container" ref="searchRef">
        <div class="search-input-wrapper glass-card">
          <span class="search-icon">🔍</span>
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
          <div v-if="isSearchOpen && searchQuery.length >= 2" class="search-dropdown glass-card">
            <div v-if="filteredPages.length" class="s-group">
              <div class="s-label">Разделы</div>
              <router-link v-for="p in filteredPages" :key="p.path" :to="p.path" class="s-item" @click="closeSearch">
                <span class="s-icon">{{ p.icon }}</span> {{ p.name }}
              </router-link>
            </div>
            <div v-if="searchResults.categories.length" class="s-group">
              <div class="s-label">Категории</div>
              <router-link v-for="c in searchResults.categories" :key="c.id" :to="`/category/${c.id}`" class="s-item" @click="closeSearch">
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
      <div class="nav-section right-section">
        
        <!-- ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ -->
        <label class="theme-switch">
          <input type="checkbox" v-model="isDark" @change="applyTheme" />
          <span class="slider">
            <span class="sun">☀️</span>
            <span class="moon">🌙</span>
          </span>
        </label>

        <!-- ИЗБРАННОЕ (УВЕЛИЧЕННОЕ СЕРДЕЧКО) -->
        <router-link to="/wishlist" class="nav-icon-link wishlist-link" title="Избранное">
          <div class="icon-with-badge">
            <span class="heart-icon">❤️</span>
            <span v-if="wishlistCount > 0" class="badge wishlist-badge">{{ wishlistCount }}</span>
          </div>
        </router-link>

        <div class="divider"></div>

        <!-- ПРОФИЛЬ / АВТОРИЗАЦИЯ -->
        <div v-if="!userId" class="auth-links">
          <router-link to="/login" class="auth-link">Войти</router-link>
          <router-link to="/register" class="auth-link reg-btn">Регистрация</router-link>
        </div>

        <div v-else class="user-profile-container" ref="profileMenu">
          <div class="profile-trigger" @click="toggleProfileDropdown">
            <img :src="userAvatar || '/assets/images/avatars/1.png'" class="nav-avatar" />
            <span class="user-display-name">{{ userName }}</span>
            <span class="dropdown-arrow" :class="{ rotate: isProfileDropdownOpen }">▼</span>
          </div>
          
          <transition name="fade">
            <div v-if="isProfileDropdownOpen" class="dropdown-menu profile-menu glass-card">
              <router-link v-if="userRole === 'admin'" to="/admin" class="dropdown-item admin-item">
                <span class="menu-icon">🛡️</span> <b>Админ-панель</b>
              </router-link>
              <hr v-if="userRole === 'admin'" class="dropdown-divider" />
              <router-link to="/profile" class="dropdown-item"><span class="menu-icon">👤</span> Профиль</router-link>
              <router-link to="/orders" class="dropdown-item"><span class="menu-icon">📦</span> Заказы</router-link>
              <router-link to="/wishlist" class="dropdown-item"><span class="menu-icon">❤️</span> Избранное</router-link>
              <router-link to="/settings" class="dropdown-item"><span class="menu-icon">⚙️</span> Настройки</router-link>
              <hr class="dropdown-divider" />
              <button @click="handleLogout" class="dropdown-item logout-item"><span class="menu-icon">🚪</span> Выйти</button>
            </div>
          </transition>
        </div>

        <!-- КОРЗИНА (СТИЛИЗОВАННАЯ КАРТОЧКА) -->
        <div class="cart-card" @click="router.push('/cart')">
          <div class="cart-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" height="22" width="22" viewBox="0 0 576 512">
              <path fill="currentColor" d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
            </svg>
            <span v-if="cartItemsCount > 0" class="badge cart-badge">{{ cartItemsCount }}</span>
          </div>
          <div class="cart-info">
            <div class="cart-title">Корзина</div>
            <div class="cart-total">{{ cartStore.totalPriceFinal || 0 }} ₽</div>
          </div>
          <div class="cart-arrow">→</div>
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

// Настройка заголовков axios
const storedId = localStorage.getItem('user_id');
const storedName = localStorage.getItem('user_name');
const storedRole = localStorage.getItem('role');
if (storedId) axios.defaults.headers.common['x-user-id'] = storedId;
if (storedName) axios.defaults.headers.common['x-user-name'] = encodeURIComponent(storedName);
if (storedRole) axios.defaults.headers.common['x-user-role'] = storedRole;

const router = useRouter();
const cartStore = useCartStore();
const appStore = useAppStore();

// Пользовательские данные
const userId = ref(storedId);
const userName = ref(storedName || '');
const userAvatar = ref(localStorage.getItem('user_avatar') || '');
const userRole = ref(storedRole || '');

// Счётчики
const wishlistCount = ref(0);
const cartItemsCount = computed(() => {
  if (!cartStore.items?.length) return 0;
  return cartStore.items.reduce((total, item) => total + (item.quantity || 1), 0);
});

// Загрузка количества избранного
const loadWishlistCount = async () => {
  if (userId.value) {
    try {
      const res = await axios.get(`/api/wishlist/${userId.value}`);
      wishlistCount.value = res.data.length;
    } catch (e) { console.error("Ошибка загрузки избранного", e); }
  }
};

// Тема
const isDark = ref(false);
const applyTheme = () => {
  if (isDark.value) {
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  }
};

// Поиск
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

const noResults = computed(() => !filteredPages.value.length && !searchResults.value.products.length && !searchResults.value.categories.length);

const handleGlobalSearch = () => {
  clearTimeout(searchTimer);
  if (searchQuery.value.length < 2) return;
  searchTimer = setTimeout(async () => {
    try {
      const res = await axios.get(`/api/global-search?q=${searchQuery.value}`);
      searchResults.value = res.data;
    } catch (e) { console.error("Search error:", e); }
  }, 300);
};

const clearSearch = () => { searchQuery.value = ''; isSearchOpen.value = false; };
const closeSearch = () => isSearchOpen.value = false;

// Город
const isCityDropdownOpen = ref(false);
const cityMenu = ref(null);
const availableCities = ref([]);
const citySearch = ref('');

const loadCities = async () => {
  try {
    const res = await axios.get('/api/admin/warehouses', { headers: { 'x-admin-key': 'my_super_secret_admin_123' } });
    availableCities.value = Array.from(new Set(res.data.map(w => w.city_name))).sort();
  } catch (e) { availableCities.value = ['Москва', 'Санкт-Петербург', 'Иркутск', 'Ангарск']; }
};

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

// Профиль
const isProfileDropdownOpen = ref(false);
const profileMenu = ref(null);
const toggleProfileDropdown = () => { isProfileDropdownOpen.value = !isProfileDropdownOpen.value; isCityDropdownOpen.value = false; };
const toggleCityDropdown = () => { isCityDropdownOpen.value = !isCityDropdownOpen.value; isProfileDropdownOpen.value = false; };

// Закрытие кликом вне
const handleClickOutside = (event) => {
  if (profileMenu.value && !profileMenu.value.contains(event.target)) isProfileDropdownOpen.value = false;
  if (cityMenu.value && !cityMenu.value.contains(event.target)) isCityDropdownOpen.value = false;
  if (searchRef.value && !searchRef.value.contains(event.target)) isSearchOpen.value = false;
};

// Выход
const handleLogout = () => {
  if (confirm('Выйти из системы?')) {
    localStorage.clear();
    router.push('/');
    setTimeout(() => window.location.reload(), 100);
  }
};

onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    isDark.value = true;
    document.body.classList.add('dark-theme');
  }
  loadCities();
  loadWishlistCount();
  window.addEventListener('wishlist-updated', loadWishlistCount);
  window.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
  window.removeEventListener('wishlist-updated', loadWishlistCount);
});
</script>

<style scoped>
/* ==========================================================================
   ГЛАВНАЯ НАВИГАЦИЯ – СТИЛЬ В ЕДИНОЙ СТЕКЛЯННОЙ ЭСТЕТИКЕ
   ========================================================================== */

.main-navbar {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-color);
  height: 80px;
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}
body.dark-theme .main-navbar {
  background: rgba(20, 30, 45, 0.9);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  width: 94%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

/* ЛЕВАЯ СЕКЦИЯ */
.left-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo {
  text-decoration: none;
  font-size: 1.7rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: transform 0.3s;
}
.logo:hover {
  transform: scale(1.02);
}

/* КНОПКА ГОРОДА */
.city-selector-container {
  position: relative;
}
.city-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 40px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: var(--transition-bounce);
  backdrop-filter: blur(4px);
}
.city-btn:hover {
  border-color: var(--primary);
  background: var(--primary-light);
  transform: translateY(-2px);
}
.dropdown-arrow {
  font-size: 0.7rem;
  transition: transform 0.3s;
}
.dropdown-arrow.rotate {
  transform: rotate(180deg);
}

/* МЕНЮ ССЫЛКИ */
.menu-links {
  display: flex;
  gap: 28px;
}
.menu-links a {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.95rem;
  position: relative;
  padding: 6px 0;
}
.menu-links a::after {
  content: '';
  position: absolute;
  width: 0;
  height: 3px;
  bottom: 0;
  left: 0;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  transition: width 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
  border-radius: 3px;
}
.menu-links a:hover::after,
.menu-links a.router-link-active::after {
  width: 100%;
}
.menu-links a:hover {
  color: var(--primary);
}

/* ПОИСК */
.search-bar-container {
  flex: 1;
  max-width: 500px;
  position: relative;
}
.search-input-wrapper {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 60px;
  padding: 0 16px;
  height: 48px;
  transition: var(--transition);
}
.search-input-wrapper:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
  transform: scale(1.01);
}
.search-icon {
  font-size: 1.2rem;
  color: var(--text-muted);
  margin-right: 12px;
}
.search-input-wrapper input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  color: var(--text-main);
  outline: none;
}
.search-clear-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--text-muted);
  transition: transform 0.2s;
}
.search-clear-btn:hover {
  color: var(--danger);
  transform: rotate(90deg);
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  right: 0;
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  z-index: 1100;
  max-height: 480px;
  overflow-y: auto;
}
.s-group {
  margin-bottom: 8px;
}
.s-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 800;
  color: var(--text-muted);
  padding: 8px 20px;
  background: var(--bg-input);
}
.s-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 20px;
  text-decoration: none;
  color: var(--text-main);
  transition: var(--transition);
}
.s-item:hover {
  background: var(--primary-light);
  transform: translateX(6px);
}
.s-img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  background: #fff;
  border-radius: var(--radius-sm);
  padding: 4px;
}
.s-price {
  color: var(--success);
  font-weight: 700;
}
.s-none {
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
}

/* ПРАВАЯ СЕКЦИЯ */
.right-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ (упрощённый, но в стиле) */
.theme-switch {
  position: relative;
  display: inline-block;
  width: 64px;
  height: 32px;
}
.theme-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(145deg, #3a3a3a, #2a2a2a);
  border-radius: 34px;
  transition: 0.4s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
}
.slider .sun,
.slider .moon {
  font-size: 1rem;
  z-index: 1;
  transition: 0.3s;
}
.slider .sun {
  opacity: 1;
}
.slider .moon {
  opacity: 0.4;
}
.theme-switch input:checked + .slider {
  background: linear-gradient(145deg, #62cff0, #4a9fcf);
}
.theme-switch input:checked + .slider .sun {
  opacity: 0.4;
}
.theme-switch input:checked + .slider .moon {
  opacity: 1;
}
.slider::before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.theme-switch input:checked + .slider::before {
  transform: translateX(32px);
}

/* ИЗБРАННОЕ – УВЕЛИЧЕННОЕ СЕРДЕЧКО */
.wishlist-link {
  font-size: 1.9rem !important;
  line-height: 1;
}
.heart-icon {
  font-size: 1.9rem;
  transition: transform 0.3s;
  display: inline-block;
}
.wishlist-link:hover .heart-icon {
  transform: scale(1.15);
}
.icon-with-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.badge {
  position: absolute;
  top: -8px;
  right: -12px;
  background: var(--danger);
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 30px;
  border: 2px solid var(--bg-card);
  min-width: 20px;
  text-align: center;
}
body.dark-theme .badge {
  border-color: #0f172a;
}
.wishlist-badge {
  background: #ef4444;
}

/* РАЗДЕЛИТЕЛЬ */
.divider {
  width: 1px;
  height: 36px;
  background: var(--border-color);
}

/* АВТОРИЗАЦИЯ */
.auth-links {
  display: flex;
  gap: 12px;
}
.auth-link {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-main);
  text-decoration: none;
  transition: var(--transition);
}
.auth-link:hover {
  color: var(--primary);
}
.reg-btn {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white !important;
  padding: 6px 16px;
  border-radius: 40px;
  box-shadow: 0 4px 8px rgba(230, 57, 70, 0.2);
}
.reg-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(230, 57, 70, 0.3);
}

/* ПРОФИЛЬ */
.user-profile-container {
  position: relative;
}
.profile-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 40px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  transition: var(--transition);
}
.profile-trigger:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}
.nav-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}
.user-display-name {
  font-weight: 600;
  font-size: 0.85rem;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 8px;
  min-width: 220px;
  z-index: 1200;
  animation: slideDown 0.2s ease-out;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  text-decoration: none;
  color: var(--text-main);
  font-size: 0.9rem;
  border-radius: var(--radius-sm);
  transition: var(--transition);
  cursor: pointer;
  width: 100%;
  background: transparent;
  border: none;
  text-align: left;
}
.dropdown-item:hover {
  background: var(--primary-light);
  color: var(--primary);
  transform: translateX(4px);
}
.admin-item {
  color: var(--warning);
  background: var(--warning-light);
}
.logout-item {
  color: var(--danger);
}
.logout-item:hover {
  background: var(--danger-light);
  color: var(--danger-hover);
}
.dropdown-divider {
  margin: 8px 0;
  border: none;
  height: 1px;
  background: var(--border-color);
}
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* КОРЗИНА – СТИЛЬНАЯ КАРТОЧКА */
.cart-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 6px 16px;
  cursor: pointer;
  transition: var(--transition-bounce);
  backdrop-filter: blur(4px);
}
.cart-card:hover {
  border-color: var(--success);
  transform: translateY(-3px);
  box-shadow: 0 12px 20px rgba(42, 157, 143, 0.2);
}
.cart-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cart-icon-wrapper svg {
  color: var(--text-main);
  transition: color 0.2s;
}
.cart-card:hover .cart-icon-wrapper svg {
  color: var(--success);
}
.cart-badge {
  top: -10px;
  right: -12px;
  background: var(--success);
}
.cart-info {
  text-align: right;
}
.cart-title {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}
.cart-total {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-main);
}
.cart-arrow {
  font-size: 1.2rem;
  color: var(--text-muted);
  transition: transform 0.2s;
}
.cart-card:hover .cart-arrow {
  transform: translateX(4px);
  color: var(--success);
}

/* СТЕКЛЯННЫЕ КАРТОЧКИ ДЛЯ ВЫПАДАЮЩИХ МЕНЮ */
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(12px);
}

/* АНИМАЦИИ */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* АДАПТИВНОСТЬ */
@media (max-width: 1200px) {
  .menu-links {
    display: none;
  }
}
@media (max-width: 950px) {
  .user-display-name {
    display: none;
  }
  .cart-info {
    display: none;
  }
  .cart-card {
    padding: 6px 12px;
    gap: 6px;
  }
  .cart-arrow {
    display: none;
  }
  .wishlist-link {
    font-size: 1.6rem !important;
  }
  .heart-icon {
    font-size: 1.6rem;
  }
}
@media (max-width: 768px) {
  .main-navbar {
    height: auto;
    padding: 12px 0;
  }
  .nav-container {
    flex-wrap: wrap;
    gap: 12px;
  }
  .search-bar-container {
    order: 3;
    width: 100%;
    max-width: 100%;
  }
  .city-btn {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
  .right-section {
    gap: 12px;
  }
  .theme-switch {
    width: 54px;
    height: 28px;
  }
  .slider::before {
    height: 22px;
    width: 22px;
  }
  .theme-switch input:checked + .slider::before {
    transform: translateX(26px);
  }
}
</style>