<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <h2>ApexDrive Admin</h2>
      <nav>
        <router-link v-for="link in menu" :key="link.path" :to="'/admin/' + link.path">
          {{ link.icon }} {{ link.name }}
        </router-link>
      </nav>
      <router-link to="/" class="exit-link">🏠 На сайт</router-link>
    </aside>

    <main class="admin-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
const menu = [
  { name: 'Заказы', path: 'orders', icon: '📦' },
  { name: 'Товары', path: 'products', icon: '🛒' },
  { name: 'Остатки', path: 'stocks', icon: '📊' },
  { name: 'Пользователи', path: 'users', icon: '👥' },
  { name: 'Карты', path: 'cards', icon: '💳' },
  { name: 'Категории', path: 'categories', icon: '📂' },
  { name: 'Бренды', path: 'brands', icon: '🏭' },
  { name: 'Склады', path: 'warehouses', icon: '📍' },
  { name: 'Отзывы', path: 'reviews', icon: '💬' },
  // ДОБАВЛЯЕМ СЮДА:
  { name: 'Логи системы', path: 'logs', icon: '📜' }, 
];
</script>

