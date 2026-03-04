<template>
  <div class="wishlist-page" style="padding: 20px; max-width: 1200px; margin: 0 auto;">
    <h1>❤ Избранные товары</h1>
    <p>Регион: <b>{{ appStore.city }}</b></p>
    <router-link to="/profile" style="color: #007bff; text-decoration: none;">← Вернуться в кабинет</router-link>

    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />

    <div v-if="loading" style="text-align: center; padding: 50px;">
      <h2>Загрузка данных...</h2>
    </div>

    <div v-else-if="products.length > 0">
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px;">
        
        <div v-for="p in products" :key="p.id" style="border: 1px solid #eee; padding: 20px; border-radius: 12px; background: white; position: relative;">
          
          <!-- Удаление (используем id записи из таблицы wishlists) -->
          <button @click="removeFromWishlist(p.wishlist_record_id)" style="position: absolute; top: 10px; right: 10px; cursor: pointer; background: #eee; border: none; border-radius: 50%; width: 25px; height: 25px;">×</button>

          <router-link :to="'/product/' + p.id" style="text-decoration: none; color: inherit;">
            <div style="height: 180px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
              <img :src="p.image_url" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
            </div>
            
            <h3 style="margin: 0 0 10px 0; height: 2.4em; overflow: hidden; line-height: 1.2;">{{ p.name }}</h3>
            
            <div style="margin: 10px 0;">
              <strong style="font-size: 1.4em; color: #e74c3c;">{{ p.discount_price || p.price }} ₽</strong>
            </div>

            <!-- БЛОК НАЛИЧИЯ (ТОЧНАЯ КОПИЯ ЛОГИКИ ИЗ PRODUCTDETAIL) -->
            <div style="font-size: 0.95em; font-weight: bold; margin-bottom: 15px;">
               <div v-if="getStockInCity(p) > 0" style="color: #27ae60;">
                  ✅ В наличии в г. {{ appStore.city }} ({{ getStockInCity(p) }} шт.)
               </div>
               <div v-else-if="getTotalStock(p) > 0" style="color: #e67e22;">
                  🚛 Под заказ (Межгород)
               </div>
               <div v-else style="color: #999;">
                  ❌ Нет в наличии
               </div>
            </div>
          </router-link>

          <button @click="addToCart(p)" style="width: 100%; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
            В корзину
          </button>
        </div>
      </div>
    </div>

    <div v-else style="text-align: center; padding: 100px;">
      <h2>В избранном пока пусто</h2>
      <router-link to="/catalog"><button style="padding: 10px 20px; cursor: pointer;">В каталог</button></router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAppStore } from '@/stores/appStore';
import { useCartStore } from '@/stores/cartStore';

const appStore = useAppStore();
const cartStore = useCartStore();

const products = ref([]); 
const loading = ref(true);

const loadWishlist = async () => {
  const userId = localStorage.getItem('user_id');
  if (!userId) { loading.value = false; return; }

  try {
    const res = await axios.get(`/api/wishlist/${userId}`);
    
    // ПРЕВРАЩАЕМ В ПЛОСКИЙ МАССИВ (вытаскиваем товары из обертки wishlists)
    products.value = (res.data || []).map(row => {
        const p = row.products || row.product;
        return {
            ...p,
            wishlist_record_id: row.id // сохраняем ID строки избранного для удаления
        };
    }).filter(p => p.id);

    // ОТЛАДОЧНЫЙ ЛОГ: Если всё равно не работает, посмотри этот лог в консоли (F12)
    console.log("ТОВАРЫ В ИЗБРАННОМ С ОСТАТКАМИ:", products.value);

  } catch (e) {
    console.error("Ошибка загрузки:", e);
  } finally {
    loading.value = false;
  }
};

// --- ФУНКЦИИ НАЛИЧИЯ (САМАЯ НАДЕЖНАЯ ВЕРСИЯ) ---

const getStockInCity = (p) => {
    if (!p || !p.product_stocks || !appStore.city) return 0;
    
    const searchCity = appStore.city.trim().toLowerCase();

    return p.product_stocks.reduce((total, stockRecord) => {
        // Проверяем объект склада (учитываем, что Supabase может вернуть его как объект или массив)
        let wh = stockRecord.warehouses || stockRecord.warehouse;
        if (Array.isArray(wh)) wh = wh[0]; // Если вдруг пришел массив - берем первый элемент

        if (wh && wh.city_name) {
            const cityName = wh.city_name.trim().toLowerCase();
            if (cityName === searchCity) {
                return total + (Number(stockRecord.quantity) || 0);
            }
        }
        return total;
    }, 0);
};

const getTotalStock = (p) => {
    if (!p || !p.product_stocks) return 0;
    return p.product_stocks.reduce((total, s) => total + (Number(s.quantity) || 0), 0);
};

// --- ДЕЙСТВИЯ ---

const removeFromWishlist = async (wishlistId) => {
  try {
    await axios.delete(`/api/wishlist/${wishlistId}`);
    products.value = products.value.filter(p => p.wishlist_record_id !== wishlistId);
  } catch (e) {
    alert("Ошибка при удалении");
  }
};

const addToCart = (p) => {
  // Добавляем в корзину с учетом общего остатка
  cartStore.addToCart({ ...p, stock_quantity: getTotalStock(p) });
  alert("Товар добавлен в корзину!");
};

onMounted(loadWishlist);
</script>