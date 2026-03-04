<script setup>
// Импортируем компонент навигации
import Navbar from './components/Navbar.vue';
// Импортируем встроенный компонент для работы ссылок
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="app-container">
    <!-- ПАНЕЛЬ НАВИГАЦИИ (Будет отображаться на всех страницах) -->
    <Navbar />

    <!-- ОСНОВНОЙ КОНТЕНТ (Здесь будут открываться Главная, Каталог и т.д.) -->
    <main class="main-content">
      <RouterView />
    </main>

    <!-- ОБЩИЙ ПОДВАЛ (FOOTER) -->
    <footer style="margin-top: 50px; padding: 20px; border-top: 1px solid #ccc; text-align: center;">
      <p>&copy; 2026 ApexDrive — Интернет-магазин автотоваров</p>
      <small>Все права защищены. Доставка по всей России.</small>
    </footer>
  </div>
</template>
