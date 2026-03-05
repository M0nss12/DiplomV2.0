<script setup>
import Navbar from './components/Navbar.vue';
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="app-container">
    <!-- ПАНЕЛЬ НАВИГАЦИИ -->
    <Navbar />

    <!-- ОСНОВНОЙ КОНТЕНТ -->
    <main class="main-content">
      <RouterView />
    </main>

    <!-- ОБЩИЙ ПОДВАЛ (FOOTER) -->
    <footer class="main-footer">
      <div class="footer-container">
        
        <!-- Секция 1: Брендинг -->
        <div class="footer-section about">
          <router-link to="/" class="footer-logo">
            <strong>Apex</strong>Drive
          </router-link>
          <p class="footer-desc">
            Ваш надежный партнер в мире автозапчастей. Интеллектуальная логистика, 
            прямые поставки и гарантия качества для каждого автомобиля.
          </p>
          <div class="social-links">
            <a href="https://t.me/M0nss" target="_blank" title="Telegram">TG</a>
            <a href="https://vk.com/mr.monss" target="_blank" title="VK">VK</a>
          </div>
        </div>

        <!-- Секция 2: Навигация -->
        <div class="footer-section links">
          <h4>Магазин</h4>
          <router-link to="/catalog">Каталог товаров</router-link>
          <router-link to="/catalog">Популярные бренды</router-link>
          <router-link to="/about">Акции и скидки</router-link>
        </div>

        <!-- Секция 3: Инфо -->
        <div class="footer-section links">
          <h4>Информация</h4>
          <router-link to="/about">О компании</router-link>
          <router-link to="/contacts">Доставка и оплата</router-link>
          <router-link to="/contacts">Пункты выдачи</router-link>
        </div>

        <!-- Секция 4: Контакты -->
        <div class="footer-section contacts">
          <h4>Поддержка</h4>
          <a href="tel:+79991234567" class="footer-phone">+7 (999) 123-45-67</a>
          <a href="mailto:monsschogath@gmail.com" class="footer-email">support@apexdrive.ru</a>
          <p class="work-time">Ежедневно: 09:00 — 21:00</p>
        </div>

      </div>

      <!-- Нижняя плашка -->
      <div class="footer-bottom">
        <div class="bottom-content">
          <p>&copy; 2026 ApexDrive. Все права защищены.</p>
          <div class="legal-links">
            <router-link to="/about">Политика конфиденциальности</router-link>
            <router-link to="/about">Публичная оферта</router-link>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Глобальные контейнеры */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1; /* Чтобы футер всегда был внизу страницы */
}

/* Стили ФУТЕРА */
.main-footer {
  background-color: var(--bg-card);
  border-top: 1px solid var(--border-color);
  padding-top: 60px;
  margin-top: 80px;
  transition: var(--transition);
}

.footer-container {
  max-width: 1440px;
  margin: 0 auto;
  width: 95%;
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
  gap: 40px;
  padding-bottom: 50px;
}

.footer-section h4 {
  color: var(--text-main);
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 25px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* О компании */
.footer-logo {
  font-size: 1.8rem;
  text-decoration: none;
  color: var(--text-main);
  display: block;
  margin-bottom: 20px;
}
.footer-logo strong {
  color: var(--primary);
  font-weight: 800;
}
.footer-desc {
  color: var(--text-muted);
  line-height: 1.6;
  font-size: 0.95rem;
  margin-bottom: 25px;
}

/* Ссылки */
.footer-section.links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.footer-section.links a {
  text-decoration: none;
  color: var(--text-muted);
  font-size: 0.95rem;
  transition: var(--transition);
}
.footer-section.links a:hover {
  color: var(--primary);
  transform: translateX(5px);
}

/* Контакты */
.footer-section.contacts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.footer-phone {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-main);
  text-decoration: none;
}
.footer-email {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}
.work-time {
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Соцсети */
.social-links {
  display: flex;
  gap: 15px;
}
.social-links a {
  width: 40px;
  height: 40px;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  text-decoration: none;
  color: var(--text-main);
  font-weight: 800;
  font-size: 0.8rem;
  transition: var(--transition);
  border: 1px solid var(--border-color);
}
.social-links a:hover {
  background: var(--primary);
  color: #fff;
  transform: translateY(-3px);
  border-color: var(--primary);
}

/* НИЖНЯЯ ЧАСТЬ */
.footer-bottom {
  border-top: 1px solid var(--border-color);
  padding: 30px 0;
  background-color: var(--bg-input);
}
.bottom-content {
  max-width: 1440px;
  margin: 0 auto;
  width: 95%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-muted);
  font-size: 0.85rem;
}
.legal-links {
  display: flex;
  gap: 25px;
}
.legal-links a {
  text-decoration: none;
  color: var(--text-muted);
}
.legal-links a:hover {
  text-decoration: underline;
}

/* АДАПТИВНОСТЬ */
@media (max-width: 1024px) {
  .footer-container {
    grid-template-columns: 1fr 1fr;
    gap: 50px;
  }
}

@media (max-width: 600px) {
  .footer-container {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .social-links {
    justify-content: center;
  }
  .footer-section.links a:hover {
    transform: none;
  }
  .bottom-content {
    flex-direction: column;
    gap: 15px;
  }
}
</style>