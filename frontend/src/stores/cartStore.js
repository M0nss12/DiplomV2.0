import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({
    // Загружаем корзину из памяти браузера или создаем пустую
    items: JSON.parse(localStorage.getItem('cart_items')) || []
  }),

  getters: {
    // Общее количество товаров (для иконки в шапке)
    totalItems: (state) => state.items.reduce((sum, i) => sum + Number(i.quantity), 0),
    
    // Общий вес
    totalWeight: (state) => {
      const weight = state.items.reduce((sum, i) => sum + (Number(i.weight_kg || 0) * i.quantity), 0);
      return parseFloat(weight.toFixed(2));
    },

    // Сумма без скидок (зачеркнутая цена)
    totalPriceOriginal: (state) => state.items.reduce((sum, i) => sum + (Number(i.price) * i.quantity), 0),

    // Общая скидка
    totalDiscount: (state) => state.items.reduce((sum, i) => {
        const discount = i.discount_price ? (Number(i.price) - Number(i.discount_price)) : 0;
        return sum + (discount * i.quantity);
    }, 0),

    // Итоговая сумма к оплате
    totalPriceFinal: (state) => state.items.reduce((sum, i) => {
        const actualPrice = i.discount_price ? Number(i.discount_price) : Number(i.price);
        return sum + (actualPrice * i.quantity);
    }, 0)
  },

  actions: {
    addToCart(product) {
      // 1. ЖЕСТКИЙ РАСЧЕТ ОСТАТКА
      // Если товар пришел с массивом product_stocks - суммируем его
      // Если пришел уже с полем stock_quantity - берем его (защита от разных мест вызова)
      let availableStock = 0;
      if (product.product_stocks && Array.isArray(product.product_stocks)) {
          availableStock = product.product_stocks.reduce((sum, s) => sum + Number(s.quantity), 0);
      } else if (product.stock_quantity !== undefined) {
          availableStock = Number(product.stock_quantity);
      }

      // Если товара нет - блокируем
      if (availableStock <= 0) {
          alert("Товара нет в наличии ни на одном складе.");
          return;
      }

      const existing = this.items.find(i => Number(i.id) === Number(product.id));
      
      if (existing) {
        // Проверяем, не превышает ли количество остаток
        if (existing.quantity < availableStock) {
            existing.quantity++;
            // На всякий случай обновляем макс. остаток (вдруг на сервере он изменился)
            existing.max_stock = availableStock; 
        } else {
            alert(`Доступно всего ${availableStock} шт. Вы не можете добавить больше.`);
        }
      } else {
        // ДОБАВЛЯЕМ НОВЫЙ
        this.items.push({
          id: Number(product.id),
          name: product.name,
          sku: product.sku,
          image_url: product.image_url,
          price: Number(product.price),
          discount_price: product.discount_price ? Number(product.discount_price) : null,
          weight_kg: Number(product.weight_kg || 0),
          
          // СОХРАНЯЕМ ВАЖНЫЕ ПОЛЯ ДЛЯ КОРЗИНЫ
          max_stock: availableStock, // Это поле будет отвечать за предел плюсика!
          product_stocks: product.product_stocks || [], // Для разбивки по городам
          quantity: 1
        });
      }
      this.save();
    },

    updateQuantity(productId, step) {
      const item = this.items.find(i => Number(i.id) === Number(productId));
      
      if (item) {
        const newQty = item.quantity + step;
        
        // ВАЖНО: Используем поле max_stock, которое мы жестко записали при добавлении
        const maxAvailable = Number(item.max_stock);

        if (newQty >= 1 && newQty <= maxAvailable) {
          item.quantity = newQty;
        } else if (newQty > maxAvailable) {
          alert(`Превышен доступный остаток. Максимум можно заказать: ${maxAvailable} шт.`);
        } else if (newQty < 1) {
          // Если нажали минус при 1 шт. - ничего не делаем (или можно удалить товар)
          // this.removeFromCart(productId);
        }
      }
      this.save();
    },

    removeFromCart(productId) {
      this.items = this.items.filter(i => Number(i.id) !== Number(productId));
      this.save();
    },

    clearCart() {
      this.items = [];
      this.save();
    },

    save() {
      localStorage.setItem('cart_items', JSON.stringify(this.items));
    }
  }
});