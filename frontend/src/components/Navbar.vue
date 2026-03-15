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
      <div class="nav-section user-actions">
        
        <!-- 🌓 АНИМИРОВАННЫЙ ПЕРЕКЛЮЧАТЕЛЬ ТЕМЫ -->
        <label class="switch">
          <input type="checkbox" v-model="isDark" @change="applyTheme" />
          <span class="slider">
            <div class="moons-hole">
              <div class="moon-hole"></div>
              <div class="moon-hole"></div>
              <div class="moon-hole"></div>
            </div>
            <div class="black-clouds">
              <div class="black-cloud"></div>
              <div class="black-cloud"></div>
              <div class="black-cloud"></div>
            </div>
            <div class="clouds">
              <div class="cloud"></div>
              <div class="cloud"></div>
              <div class="cloud"></div>
              <div class="cloud"></div>
              <div class="cloud"></div>
              <div class="cloud"></div>
              <div class="cloud"></div>
            </div>
            <div class="stars">
              <svg v-for="n in 5" :key="n" class="star" viewBox="0 0 20 20">
                <path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10 , 10 10 , 10 0 C 10 10,10 10 ,0 10 Z"></path>
              </svg>
            </div>
          </span>
        </label>

        <router-link to="/wishlist" class="nav-icon-link" title="Избранное">
          <span class="icon">❤</span>
        </router-link>

        <div class="divider"></div>

        <!-- ПРОФИЛЬ / АВТОРИЗАЦИЯ -->
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

        <!-- КОРЗИНА (Компактная версия для NavBar) -->
        <div class="card">
          <div class="card-wrapper">
            <!-- ИКОНКА СЛЕВА -->
            <div class="card-icon">
              <div class="icon-cart-box">
                <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 576 512">
                  <path fill="currentColor" d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"></path>
                </svg>
              </div>
            </div>

            <!-- СОДЕРЖИМОЕ СПРАВА -->
            <div class="card-content">
              <!-- Верхняя строка: Корзина + Количество товаров -->
              <div class="card-top">
                <span class="card-title">Корзина</span>
              </div>
              
              <!-- Нижняя строка: Сумма + Кнопка Перейти -->
              <div class="card-bottom">
                <span class="product-price">{{ cartStore.totalPriceFinal || 0 }} ₽</span>
                <button class="button" @click="router.push('/cart')">
                  Перейти
                  <svg class="icon-btn" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clip-rule="evenodd"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
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

const applyTheme = () => {
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
   ОСНОВНЫЕ СТИЛИ NAVBAR
   ========================================================================== */
.main-navbar {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-color);
    height: 85px; 
    position: sticky;
    top: 0;
    z-index: 1000;
    transition: var(--transition);
}

body.dark-theme .main-navbar { background: rgba(15, 23, 42, 0.85); }

.nav-container {
    max-width: 100%; /* НА ВСЮ ШИРИНУ СТРАНИЦЫ */
    width: 100%;
    padding: 0 30px; /* Отступы по краям */
    box-sizing: border-box;
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

.nav-section { display: flex; align-items: center; gap: 15px; }
.logo { text-decoration: none; font-size: 1.6rem; }
.logo strong { font-weight: 900; background: linear-gradient(135deg, var(--primary) 0%, #818cf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

.city-btn {
    background: var(--bg-input); border: 1px solid var(--border-color);
    padding: 8px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; color: var(--text-main); cursor: pointer;
}

.menu-links { display: flex; gap: 20px; margin-left: 10px; }
.menu-links a { color: var(--text-muted); font-weight: 600; font-size: 0.95rem; text-decoration: none; transition: 0.3s; }
.menu-links a:hover, .menu-links a.router-link-active { color: var(--primary); }

.search-bar-container { flex: 1; max-width: 500px; position: relative; }
.search-input-wrapper { display: flex; align-items: center; background: var(--bg-input); padding: 0 16px; border-radius: 30px; height: 44px; }
.search-input-wrapper input { border: none !important; background: transparent !important; width: 100%; color: var(--text-main); outline: none; }

.search-dropdown { position: absolute; top: 55px; left: 0; right: 0; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-lg); z-index: 1100; overflow: hidden; }
.s-label { background: var(--bg-input); padding: 6px 16px; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
.s-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; text-decoration: none; color: var(--text-main); }
.s-item:hover { background: var(--primary-light); }
.s-img { width: 44px; height: 44px; object-fit: contain; background: #fff; border-radius: 6px; border: 1px solid var(--border-color); }

.user-actions { gap: 15px; }
.nav-icon-link { font-size: 1.2rem; text-decoration: none; color: var(--text-muted); display: flex; align-items: center; }
.divider { width: 1px; height: 40px; background: var(--border-color); }

.auth-links a { font-weight: 700; font-size: 0.9rem; color: var(--text-main); text-decoration: none; }
.reg-btn { background: var(--primary); color: #fff !important; padding: 8px 18px; border-radius: 8px; }

.profile-trigger { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.nav-avatar { width: 35px; height: 35px; border-radius: 50%; object-fit: cover; }
.user-display-name { font-size: 0.85rem; font-weight: 700; }

.dropdown-menu { position: absolute; top: 60px; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px; box-shadow: var(--shadow-lg); min-width: 200px; }
.dropdown-item { display: block; padding: 10px; text-decoration: none; color: var(--text-main); border-radius: 8px; border: none; background: transparent; cursor: pointer; width: 100%; text-align: left; }
.dropdown-item:hover { background: var(--bg-input); }


/* ==========================================================================
   ОБНОВЛЕННЫЕ И КОМПАКТНЫЕ СТИЛИ КОРЗИНЫ
   ========================================================================== */
.card {
    width: 270px;
    height: 64px; /* Идеально вписывается в 85px NavBar */
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    padding: 6px 12px;
    backdrop-filter: blur(10px);
    z-index: 1000;
    border: 1px solid var(--border-color);
}

body.dark-theme .card { background: rgba(30, 41, 59, 0.7); }

.card-wrapper {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
}

.card-icon {
    flex-shrink: 0;
    margin-right: 12px;
}

.card-icon .icon-cart-box {
    background-color: #1a1a1a2f;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-main);
}

body.dark-theme .icon-cart-box { background-color: var(--primary); color: white; }

.card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
}

.card-top, .card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-main);
}

.product-name {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
}

.product-price {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--success);
}

/* Кнопка сохранила все ваши анимации и стили, но стала компактной по высоте */
.button {
    position: relative;
    transition: all 0.3s ease-in-out;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.15);
    padding: 0 12px;
    background-color: var(--primary); 
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    gap: 6px;
    font-weight: bold;
    border: 2px solid #ffffff4d;
    outline: none;
    overflow: hidden;
    font-size: 11px;
    cursor: pointer;
    height: 26px;
}

.icon-btn { width: 14px; height: 14px; transition: all 0.3s ease-in-out; }
.button:hover { transform: scale(1.05); border-color: #fff9; }
.button:hover .icon-btn { transform: translate(3px); }
.button:hover::before { animation: shine 1.5s ease-out infinite; }
.button::before {
    content: ""; position: absolute; width: 100px; height: 100%;
    background-image: linear-gradient(120deg, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0) 70%);
    top: 0; left: -100px; opacity: 0.6;
}

@keyframes shine { 0% { left: -100px; } 60% { left: 100%; } to { left: 100%; } }

/* ==========================================================================
   СТИЛИ ТЕМО-ПЕРЕКЛЮЧАТЕЛЯ
   ========================================================================== */
.switch { position: relative; display: inline-block; width: 90px; height: 40px; border: 1px solid rgb(58, 58, 58); border-radius: 22px; flex-shrink: 0; cursor: pointer; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: black; border-radius: 20px; transition: 0.4s; overflow: hidden; z-index: 2; }
.slider:before { position: absolute; content: ""; height: 30px; width: 30px; left: 4px; bottom: 5px; background-color: white; transition: 1s; border-radius: 50%; overflow: hidden; }
.moons-hole { position: absolute; opacity: 1; transition: 1s; }
.moon-hole { position: absolute; border-radius: 50%; }
.moon-hole:nth-child(1) { background-color: rgb(85, 85, 85); height: 5px; width: 5px; top: 26px; left: 20px; }
.moon-hole:nth-child(2) { background-color: rgb(85, 85, 85); height: 10px; width: 10px; top: 16px; left: 7px; }
.moon-hole:nth-child(3) { background-color: rgb(85, 85, 85); height: 4px; width: 4px; top: 12px; left: 21px; }

input:checked + .slider { background-color: #62cff0; }
input:checked + .slider:before { transform: translateX(52px); background-color: orange; }
input:checked + .slider .moons-hole { transform: translateX(52px); opacity: 0; }
.stars { right: 6px; top: 0; bottom: 0; transition: 1s; transform: translateY(0px); position: absolute; }
.star { position: absolute; fill: white; animation: star-twinkle 2s infinite; opacity: 1; }
.star:nth-child(1) { top: 5px; right: 29px; width: 20px; animation-delay: 0.3s; }
.star:nth-child(2) { top: 18px; right: 9px; width: 15px; }
.star:nth-child(3) { top: 5px; right: 15px; width: 10px; animation-delay: 0.6s; }
.star:nth-child(4) { top: 26px; right: 28px; width: 12px; animation-delay: 0.9s; }
.star:nth-child(5) { top: 2px; right: 50px; width: 8px; animation-delay: 1.2s; }
input:checked + .slider .stars { transform: translateY(-32px); opacity: 0; }
@keyframes star-twinkle { 0% { transform: scale(1); } 40% { transform: scale(1.2); } 80% { transform: scale(0.8); } 100% { transform: scale(1); } }
.clouds { position: absolute; left: 6px; top: 0; bottom: 0; width: 20px; transition: 1s; transform: translateX(-55px); }
.black-clouds { position: absolute; left: 6px; top: 0; bottom: 0; width: 20px; transition: 1s; transform: translateX(-55px); opacity: 0; z-index: 0; }
.black-cloud { position: absolute; width: 20px; height: 20px; background-color: #555; opacity: 60%; border-radius: 50%; animation: cloud-move 6s infinite; }
input:checked + .slider .clouds, input:checked + .slider .black-clouds { transform: translateX(32px); opacity: 1; }
.cloud { position: absolute; width: 20px; height: 20px; background-color: white; border-radius: 50%; z-index: 1; animation: cloud-move 6s infinite; }
@keyframes cloud-move { 0% { transform: translateX(-32px); } 40% { transform: translateX(-36px); } 80% { transform: translateX(-28px); } 100% { transform: translateX(-32px); } }

.fade-enter-active, .fade-leave-active { transition: all 0.2s ease-out; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(10px); }

@media (max-width: 1200px) { .menu-links { display: none; } }
@media (max-width: 950px) { .user-display-name { display: none; } .card { width: 60px; padding: 6px; } .card-content { display: none; } .card-icon { margin: 0; } }
</style>