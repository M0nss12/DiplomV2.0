<template>
  <div class="cart-container" style="padding: 20px; max-width: 1200px; margin: 0 auto;">
    <h1>🛒 Ваша корзина</h1>

    <div v-if="cartStore.items.length > 0">
      
      <!-- ТАБЛИЦА ТОВАРОВ -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
        <thead style="background: #f8f9fa; border-bottom: 2px solid #eee;">
          <tr>
            <th style="padding: 15px; text-align: left;">ТОВАР</th>
            <th>ЦЕНА</th>
            <th>КОЛИЧЕСТВО</th>
            <th>ИТОГО</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cartStore.items" :key="item.id" style="border-bottom: 1px solid #eee;">
            <td style="padding: 15px; display: flex; gap: 15px; align-items: center;">
              <img :src="item.image_url" width="70" height="70" style="object-fit: contain; border: 1px solid #eee; border-radius: 6px;" />
              <div>
                <strong style="display: block; max-width: 300px; line-height: 1.2;">{{ item.name }}</strong>
                <small style="color: gray; display: block; margin-top: 5px;">Арт: {{ item.sku }}</small>
              </div>
            </td>

            <td style="text-align: center;">
              <div v-if="item.discount_price">
                <span style="background: #e74c3c; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; font-weight: bold;">
                  -{{ calculatePercent(item) }}%
                </span><br />
                <strong style="color: #e44d26; font-size: 1.1em;">{{ item.discount_price }} ₽</strong><br />
                <s style="color: gray; font-size: 0.85em;">{{ item.price }} ₽</s>
              </div>
              <div v-else>
                <strong style="font-size: 1.1em;">{{ item.price }} ₽</strong>
              </div>
            </td>

            <td style="text-align: center; padding: 10px;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 8px;">
                <button @click="cartStore.updateQuantity(item.id, -1)" style="width: 25px; height: 25px; cursor: pointer; border-radius: 4px; border: 1px solid #ddd; background: #fff;">-</button>
                <b style="font-size: 1.2em;">{{ item.quantity }}</b>
                <button @click="cartStore.updateQuantity(item.id, 1)" style="width: 25px; height: 25px; cursor: pointer; border-radius: 4px; border: 1px solid #ddd; background: #fff;">+</button>
              </div>
              <div style="font-size: 0.75em; text-align: center; color: #888;">
                 {{ getSourcingInfo(item) }}
              </div>
            </td>

            <td style="text-align: center;">
              <strong style="font-size: 1.2em; color: #2c3e50;">{{ (item.discount_price || item.price) * item.quantity }} ₽</strong>
            </td>

            <td style="text-align: center;">
              <button @click="cartStore.removeFromCart(item.id)" style="border: none; background: none; cursor: pointer; color: #ccc; font-size: 1.5em; transition: 0.2s;" onmouseover="this.style.color='red'" onmouseout="this.style.color='#ccc'">&times;</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- БЛОК ИТОГО -->
      <div style="border: 1px solid #ddd; padding: 25px; border-radius: 12px; background: white; display: flex; justify-content: space-between; align-items: flex-start; gap: 30px;">
        <div style="flex: 1; border-right: 1px solid #eee; padding-right: 20px;">
          <h4 style="margin-top: 0; color: #666;">Состав чека:</h4>
          <div v-for="item in cartStore.items" :key="item.id" style="margin-bottom: 10px; font-size: 0.9em; display: flex; justify-content: space-between;">
             <span>{{ item.name }} (x{{ item.quantity }})</span>
             <span>{{ item.price * item.quantity }} ₽</span>
          </div>
          <div style="margin-top: 15px; font-size: 0.85em; color: #888;">
            Общий вес: <b>{{ cartStore.totalWeight }} кг</b>
          </div>
        </div>

        <div style="width: 320px; text-align: right;">
          <div style="margin-bottom: 10px; font-size: 1.1em;">
            <span style="color: #666;">Сумма без скидок:</span> 
            <strong style="margin-left: 10px;">{{ cartStore.totalPriceOriginal }} ₽</strong>
          </div>

          <div v-if="cartStore.totalDiscount > 0" style="margin-bottom: 15px; color: #e74c3c;">
            <span>Скидка:</span>
            <strong style="margin-left: 10px;">- {{ cartStore.totalDiscount }} ₽</strong>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;" />

          <div style="margin: 20px 0;">
             <span style="font-size: 1.1em; color: #888;">Итого к оплате:</span><br>
             <h1 style="color: #27ae60; margin: 5px 0; font-size: 2.5em;">{{ cartStore.totalPriceFinal }} ₽</h1>
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button @click="cartStore.clearCart()" style="padding: 12px 20px; background: white; border: 1px solid #ddd; cursor: pointer; border-radius: 6px; color: #666; font-weight: bold;">
              Очистить
            </button>
            <router-link to="/checkout">
              <button style="padding: 12px 35px; background: #27ae60; color: white; border: none; font-weight: bold; cursor: pointer; border-radius: 6px; font-size: 1.1em;">
                Оформить
              </button>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- ПУСТАЯ КОРЗИНА -->
    <div v-else style="text-align: center; padding: 100px; background: #f9f9f9; border-radius: 12px;">
      <div style="font-size: 4em; margin-bottom: 20px;">🛒</div>
      <h2 style="color: #333;">Ваша корзина пуста</h2>
      <p style="color: #888; margin-bottom: 20px;">Перейдите в каталог, чтобы найти нужные детали.</p>
      <router-link to="/catalog"><button style="padding: 12px 30px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 1.1em;">В каталог</button></router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCartStore } from '@/stores/cartStore';
import { useAppStore } from '@/stores/appStore';

const cartStore = useCartStore();
const appStore = useAppStore();

const calculatePercent = (item) => {
    if (!item.discount_price) return 0;
    return Math.round(((item.price - item.discount_price) / item.price) * 100);
};

const isSameCity = (city1, city2) => {
    if (!city1 || !city2) return false;
    return city1.trim().toLowerCase() === city2.trim().toLowerCase();
};

// Упрощенная логика: просто показываем, откуда едет товар
const getSourcingInfo = (item) => {
    if (!item || !item.product_stocks) return "Уточняется";
    
    const localStock = item.product_stocks
        .filter(s => s.warehouses && isSameCity(s.warehouses.city_name, appStore.city))
        .reduce((sum, s) => sum + s.quantity, 0);

    if (localStock >= item.quantity) {
        return `В г. ${appStore.city}`;
    } else {
        return "Межгород";
    }
};
</script>