<template>
  <div class="category-products-page">
    
    <!-- ХЛЕБНЫЕ КРОШКИ -->
    <nav v-if="allCategories.length">
      <router-link to="/catalog">Каталог</router-link>
      <span v-for="crumb in breadcrumbs" :key="crumb.id">
        > <router-link :to="'/catalog/' + crumb.id">{{ crumb.name }}</router-link>
      </span>
      > <span>{{ currentCategory?.name || 'Загрузка...' }}</span>
    </nav>

    <h1>{{ currentCategory?.name }}</h1>

    <div v-if="loading" style="padding: 50px; text-align: center;">
      <h3>Загрузка товаров...</h3>
    </div>

    <div v-else style="display: flex; gap: 20px;">
      
      <!-- БОКОВАЯ ПАНЕЛЬ ФИЛЬТРОВ -->
      <aside style="width: 250px;">
        <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
          <h3>Фильтры</h3>
          
          <div>
            <label>Цена до:</label><br>
            <input v-model.number="filterPriceMax" type="number" placeholder="Макс. цена" />
          </div>

          <div style="margin-top: 15px;">
            <label style="cursor:pointer; color: green;">
              <input type="checkbox" v-model="filterOnlyInMyCity" /> 
              В наличии в {{ appStore.city }}
            </label>
          </div>

          <div v-for="spec in availableSpecs" :key="spec.name" style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
            <b>{{ spec.name }}</b>
            <div v-for="val in spec.values" :key="val">
              <label>
                <input type="checkbox" :value="val" v-model="activeSpecFilters[spec.name]" /> {{ val }}
              </label>
            </div>
          </div>
          
          <button @click="resetFilters" style="margin-top: 20px;">Сбросить</button>
        </div>
      </aside>

      <!-- СПИСОК ТОВАРОВ -->
      <main style="flex: 1;">
        <div style="margin-bottom: 15px; display: flex; justify-content: space-between;">
          <select v-model="sortOrder">
            <option value="cheap">Сначала дешевые</option>
            <option value="expensive">Сначала дорогие</option>
          </select>
          <span>Найдено: {{ filteredProducts.length }}</span>
        </div>

        <div v-if="filteredProducts.length > 0">
          <div v-for="p in filteredProducts" :key="p.id" style="display: flex; border: 1px solid #eee; padding: 15px; margin-bottom: 15px; gap: 20px;">
            
            <img :src="p.image_url" style="width: 120px; height: 120px; object-fit: contain;" />
            
            <div style="flex: 1;">
              <router-link :to="'/product/' + p.id" style="font-size: 1.2em; font-weight: bold; text-decoration: none; color: #333;">
                {{ p.name }}
              </router-link>
              <div style="color: #666; font-size: 0.9em; margin: 5px 0;">Артикул: {{ p.sku }} | Бренд: {{ p.brands?.name }}</div>
              <p style="font-size: 0.85em; color: #777;">{{ p.description }}</p>
              
              <div style="font-weight: bold;">
                <span v-if="getStockInCity(p) > 0" style="color: green;">✅ В наличии в г. {{ appStore.city }}</span>
                <span v-else style="color: orange;">🚚 Доставка (Межгород)</span>
              </div>
            </div>

            <div style="width: 150px; text-align: right;">
              <div v-if="p.discount_price">
                <s style="color: #999;">{{ p.price }} ₽</s>
                <h2 style="color: red; margin: 0;">{{ p.discount_price }} ₽</h2>
              </div>
              <h2 v-else style="margin: 0;">{{ p.price }} ₽</h2>
              
              <button @click="handleAddToCart(p)" :disabled="getTotalStock(p) === 0" style="margin-top: 10px; padding: 10px; width: 100%; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">
                {{ getTotalStock(p) > 0 ? 'В корзину' : 'Нет в наличии' }}
              </button>
            </div>
          </div>
        </div>

        <div v-else style="text-align: center; padding: 50px;">
          <h3>В этой категории товаров пока нет.</h3>
          <p>Попробуйте сбросить фильтры или выбрать другой город.</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '@/stores/cartStore';
import { useAppStore } from '@/stores/appStore';

const route = useRoute();
const cartStore = useCartStore();
const appStore = useAppStore();

const loading = ref(true);
const products = ref([]);
const allCategories = ref([]);
const userWishlist = ref([]);

const filterPriceMin = ref(null);
const filterPriceMax = ref(null);
const filterOnlyDiscount = ref(false);
const filterOnlyInMyCity = ref(false);
const sortOrder = ref('cheap');
const activeSpecFilters = reactive({});

const loadData = async () => {
  loading.value = true;
  const categoryId = route.params.id; // Это ID "65"

  try {
    const [pRes, cRes] = await Promise.all([
      axios.get(`/api/products?category_id=${categoryId}`), 
      axios.get('/api/categories')
    ]);
    
    console.log("Товары категории " + categoryId + ":", pRes.data);
    products.value = pRes.data;
    allCategories.value = cRes.data;

    // Сброс и инициализация фильтров характеристик
    availableSpecs.value.forEach(s => {
      if (!activeSpecFilters[s.name]) activeSpecFilters[s.name] = [];
    });

  } catch (e) {
    console.error("Ошибка загрузки:", e);
  } finally {
    loading.value = false;
  }
};

const currentCategory = computed(() => {
    return allCategories.value.find(c => Number(c.id) === Number(route.params.id));
});

const breadcrumbs = computed(() => {
  const crumbs = [];
  let parentId = currentCategory.value?.parent_id;
  while (parentId) {
    const cat = allCategories.value.find(c => Number(c.id) === Number(parentId));
    if (cat) {
      crumbs.unshift(cat);
      parentId = cat.parent_id;
    } else break;
  }
  return crumbs;
});

const getStockInCity = (p) => {
    if (!p.product_stocks || !appStore.city) return 0;
    const city = appStore.city.trim().toLowerCase();
    return p.product_stocks
        .filter(s => {
            const wh = s.warehouses || s.warehouse;
            return wh?.city_name?.trim().toLowerCase() === city;
        })
        .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
};

const getTotalStock = (p) => {
  return p.product_stocks?.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0) || 0;
};

const filteredProducts = computed(() => {
  let res = [...products.value];

  if (filterOnlyInMyCity.value) res = res.filter(p => getStockInCity(p) > 0);
  if (filterPriceMax.value) res = res.filter(p => (p.discount_price || p.price) <= filterPriceMax.value);
  if (filterOnlyDiscount.value) res = res.filter(p => p.discount_price);

  Object.keys(activeSpecFilters).forEach(name => {
    const vals = activeSpecFilters[name];
    if (vals?.length) res = res.filter(p => vals.some(v => p.description?.includes(`${name}: ${v}`)));
  });

  res.sort((a, b) => {
    const p1 = a.discount_price || a.price; 
    const p2 = b.discount_price || b.price;
    return sortOrder.value === 'cheap' ? p1 - p2 : p2 - p1;
  });

  return res;
});

const availableSpecs = computed(() => {
  const specsMap = {};
  products.value.forEach(p => {
    if (!p.description) return;
    const lines = p.description.split(/\.(?!\d)/);
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, val] = line.split(':').map(s => s.trim());
        if (key && val) {
          if (!specsMap[key]) specsMap[key] = new Set();
          specsMap[key].add(val);
        }
      }
    });
  });
  return Object.keys(specsMap).map(key => ({ name: key, values: Array.from(specsMap[key]).sort() }));
});

const resetFilters = () => {
    filterPriceMax.value = null;
    filterOnlyDiscount.value = false;
    filterOnlyInMyCity.value = false;
    Object.keys(activeSpecFilters).forEach(k => activeSpecFilters[k] = []);
};

const handleAddToCart = (p) => {
    cartStore.addToCart({ ...p, stock_quantity: getTotalStock(p) });
    alert("Товар добавлен в корзину");
};

onMounted(loadData);
watch(() => route.params.id, loadData);
</script>