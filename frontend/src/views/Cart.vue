<template>
  <div class="cart-container">
    <h1>🛒 Ваша корзина</h1>

    <div v-if="cartStore.items.length > 0" class="cart-content">
      
      <!-- ТАБЛИЦА ТОВАРОВ -->
      <div class="cart-table-wrapper">
        <table class="cart-table">
          <thead>
            <tr>
              <th class="col-product">ТОВАР</th>
              <th class="col-price">ЦЕНА</th>
              <th class="col-qty">КОЛИЧЕСТВО</th>
              <th class="col-total">ИТОГО</th>
              <th class="col-action"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in cartStore.items" :key="item.id">
              <td class="col-product">
                <div class="product-info">
                  <div class="img-wrap">
                    <img :src="item.image_url" :alt="item.name" loading="lazy" />
                  </div>
                  <div>
                    <strong class="product-name">{{ item.name }}</strong>
                    <small class="product-sku">Арт: {{ item.sku }}</small>
                  </div>
                </div>
              </td>

              <td class="col-price">
                <div v-if="item.discount_price" class="price-discount">
                  <span class="discount-tag">-{{ calculatePercent(item) }}%</span>
                  <strong class="new-price">{{ item.discount_price }} ₽</strong>
                  <s class="old-price">{{ item.price }} ₽</s>
                </div>
                <div v-else>
                  <strong class="regular-price">{{ item.price }} ₽</strong>
                </div>
              </td>

              <td class="col-qty">
                <div class="qty-control">
                  <button @click="cartStore.updateQuantity(item.id, -1)" class="qty-btn" aria-label="Уменьшить">-</button>
                  <span class="qty-value">{{ item.quantity }}</span>
                  <button @click="cartStore.updateQuantity(item.id, 1)" class="qty-btn" aria-label="Увеличить">+</button>
                </div>
                <div class="stock-info" :class="{ 'local': getSourcingInfo(item).includes(appStore.city) }">
                   {{ getSourcingInfo(item) }}
                </div>
              </td>

              <td class="col-total">
                <strong class="total-price">{{ (item.discount_price || item.price) * item.quantity }} ₽</strong>
              </td>

              <td class="col-action">
                <button @click="cartStore.removeFromCart(item.id)" class="remove-btn" title="Удалить">&times;</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- БЛОК ИТОГО -->
      <div class="cart-summary">
        <div class="summary-details">
          <h4>Состав заказа:</h4>
          <div class="summary-list">
            <div v-for="item in cartStore.items" :key="item.id" class="summary-item">
               <span class="s-name">{{ item.name }} <span class="s-qty">x{{ item.quantity }}</span></span>
               <span class="s-price">{{ (item.discount_price || item.price) * item.quantity }} ₽</span>
            </div>
          </div>
          <div class="total-weight">
            Общий вес: <b>{{ cartStore.totalWeight }} кг</b>
          </div>
        </div>

        <div class="summary-total">
          <div class="price-row">
            <span>Товары:</span> 
            <strong>{{ cartStore.totalPriceOriginal }} ₽</strong>
          </div>

          <div v-if="cartStore.totalDiscount > 0" class="price-row discount-row">
            <span>Скидка:</span>
            <strong>- {{ cartStore.totalDiscount }} ₽</strong>
          </div>

          <hr class="divider" />

          <div class="final-total">
             <span>Итого:</span>
             <h1>{{ cartStore.totalPriceFinal }} ₽</h1>
          </div>
          
          <div class="summary-actions">
            <button @click="cartStore.clearCart()" class="btn-clear">Очистить</button>
            <router-link to="/checkout" class="btn-checkout">Оформить заказ</router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- ПУСТАЯ КОРЗИНА -->
    <div v-else class="empty-cart">
      <div class="empty-icon">🛒</div>
      <h2>Ваша корзина пуста</h2>
      <p>Перейдите в каталог, чтобы найти нужные детали для вашего авто.</p>
      <router-link to="/catalog" class="btn-catalog">Перейти в каталог</router-link>
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

const getSourcingInfo = (item) => {
    if (!item || !item.product_stocks) return "Наличие уточняется";
    
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

<style scoped>
.cart-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  animation: fadeIn 0.4s ease-out;
}

h1 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 40px;
  color: var(--text-main);
  font-weight: 800;
}

/* ТАБЛИЦА */
.cart-table-wrapper {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  margin-bottom: 30px;
}

.cart-table {
  width: 100%;
  border-collapse: collapse;
}

.cart-table th {
  background: var(--bg-input);
  padding: 15px 20px;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-color);
}

.cart-table td {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.cart-table tr:last-child td {
  border-bottom: none;
}

/* Колонки */
.col-product { width: 45%; }
.col-price, .col-qty, .col-total { width: 15%; text-align: center; }
.col-action { width: 10%; text-align: center; }

/* Товар */
.product-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.img-wrap {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  background: #fff;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
}

.img-wrap img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.product-name {
  font-size: 1rem;
  color: var(--text-main);
  display: block;
  line-height: 1.3;
  margin-bottom: 5px;
}

.product-sku {
  color: var(--text-muted);
  font-size: 0.85rem;
}

/* Цена */
.price-discount {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.discount-tag {
  background: var(--danger);
  color: white;
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  margin-bottom: 4px;
}

.new-price {
  color: var(--danger);
  font-size: 1.1rem;
  font-weight: 700;
}

.old-price {
  text-decoration: line-through;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.regular-price {
  font-size: 1.1rem;
  color: var(--text-main);
  font-weight: 700;
}

/* Количество */
.qty-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: var(--bg-input);
  padding: 5px;
  border-radius: var(--radius-sm);
  width: fit-content;
  margin: 0 auto;
}

.qty-btn {
  width: 28px;
  height: 28px;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  color: var(--text-main);
  transition: all 0.2s;
}

.qty-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.qty-value {
  font-weight: 700;
  min-width: 20px;
  text-align: center;
}

.stock-info {
  margin-top: 8px;
  font-size: 0.75rem;
  color: var(--warning); /* По умолчанию межгород - оранжевый */
}

.stock-info.local {
  color: var(--success); /* В наличии - зеленый */
}

/* Итого в строке */
.total-price {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-main);
}

/* Удалить */
.remove-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s;
  padding: 5px;
}

.remove-btn:hover {
  color: var(--danger);
}

/* СВОДКА (SUMMARY) */
.cart-summary {
  display: flex;
  gap: 30px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: var(--shadow-md);
}

.summary-details {
  flex: 1;
  padding-right: 30px;
  border-right: 1px dashed var(--border-color);
}

.summary-details h4 {
  margin: 0 0 15px 0;
  color: var(--text-muted);
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.summary-list {
  max-height: 200px;
  overflow-y: auto;
  padding-right: 10px;
}

.summary-list::-webkit-scrollbar { width: 4px; }
.summary-list::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: var(--text-main);
}

.s-qty { color: var(--text-muted); margin-left: 5px; }

.total-weight {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: 0.9rem;
}

.summary-total {
  width: 350px;
  display: flex;
  flex-direction: column;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 1.1rem;
  color: var(--text-main);
}

.discount-row { color: var(--danger); }

.divider {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 15px 0;
}

.final-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.final-total span { font-size: 1.2rem; font-weight: 700; color: var(--text-muted); }
.final-total h1 { margin: 0; font-size: 2.2rem; color: var(--success); }

.summary-actions {
  display: flex;
  gap: 15px;
  margin-top: auto;
}

.btn-clear {
  padding: 14px 20px;
  background: var(--bg-input);
  color: var(--text-muted);
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: var(--danger-light);
  color: var(--danger);
}

.btn-checkout {
  flex: 1;
  text-align: center;
  padding: 14px;
  background: var(--success);
  color: white;
  border-radius: var(--radius-md);
  font-weight: 700;
  text-decoration: none;
  font-size: 1.1rem;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  transition: all 0.2s;
}

.btn-checkout:hover {
  background: var(--success-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

/* ПУСТАЯ КОРЗИНА */
.empty-cart {
  text-align: center;
  padding: 80px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--border-color);
}

.empty-icon { font-size: 4rem; margin-bottom: 20px; }
.empty-cart h2 { margin-bottom: 10px; color: var(--text-main); }
.empty-cart p { color: var(--text-muted); margin-bottom: 30px; }

.btn-catalog {
  display: inline-block;
  padding: 12px 30px;
  background: var(--primary);
  color: white;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 700;
  transition: all 0.2s;
}

.btn-catalog:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

/* АДАПТИВНОСТЬ */
@media (max-width: 900px) {
  .cart-summary {
    flex-direction: column;
  }
  .summary-details {
    border-right: none;
    border-bottom: 1px dashed var(--border-color);
    padding-right: 0;
    padding-bottom: 20px;
  }
  .summary-total {
    width: 100%;
  }
}

@media (max-width: 768px) {
  /* Мобильная таблица (превращение в карточки) */
  .cart-table thead { display: none; }
  .cart-table tbody tr {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 15px;
    margin-bottom: 20px;
    position: relative;
    background: var(--bg-card);
  }

  .cart-table td {
    padding: 10px 0;
    border: none;
    width: 100%;
    text-align: left;
  }

  .col-product {
    padding-bottom: 15px !important;
    border-bottom: 1px solid var(--border-color) !important;
  }

  .col-price, .col-qty, .col-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Добавляем заголовки для мобильной версии через CSS */
  .col-price::before { content: 'Цена:'; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; }
  .col-qty::before { content: 'Количество:'; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; }
  .col-total::before { content: 'Итого:'; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; }

  .col-action {
    position: absolute;
    top: 10px;
    right: 10px;
    width: auto;
    padding: 0;
  }

  .qty-control { margin: 0; }
  .price-discount { align-items: flex-end; }
  
  .img-wrap { width: 60px; height: 60px; }
  
  .summary-actions { flex-direction: column-reverse; }
  .btn-clear { width: 100%; }
}
</style>