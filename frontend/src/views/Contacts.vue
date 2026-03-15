<template>
  <div class="contacts-page">
    
    <!-- ЗАГОЛОВОК -->
    <div class="contacts-page-header">
      <h1>Связь с поддержкой</h1>
      <p>Мы всегда на связи, чтобы помочь вам с выбором или решить любую проблему.</p>
    </div>

    <!-- 1. ОСНОВНЫЕ КОНТАКТЫ (СЕТКА) -->
    <section class="contacts-info-grid">
      <!-- ОФИС -->
      <div class="contact-item">
        <h3>📍 Центральный офис</h3>
        <p>г. Москва, ул. Тверская, д. 1</p>
        <a href="https://yandex.ru/maps/-/CCUZZM~6~A" target="_blank">Показать на карте →</a>
      </div>

      <!-- ТЕЛЕФОН -->
      <div class="contact-item">
        <h3>📞 Горячая линия</h3>
        <p class="copy-trigger" @click="copyToClipboard('+79991234567')">
          +7 (999) 123-45-67
          <span class="tooltip">Скопировать</span>
        </p>
        <small>Ежедневно с 09:00 до 21:00</small>
      </div>

      <!-- ПОЧТА -->
      <div class="contact-item">
        <h3>✉️ Общая почта</h3>
        <p class="copy-trigger" @click="copyToClipboard('monsschogath@gmail.com')">
          monsschogath@gmail.com
          <span class="tooltip">Скопировать</span>
        </p>
        <small>Отвечаем в течение 15 минут</small>
      </div>

      <!-- СТАТУС -->
      <div class="contact-item status-box">
        <h3>🕒 Статус работы</h3>
        <div class="status-indicator" :class="isStoreOpen ? 'status-open' : 'status-closed'">
          <span class="dot"></span>
          {{ isStoreOpen ? 'Сейчас мы работаем' : 'Сейчас мы закрыты' }}
        </div>
        <small>Менеджеры онлайн</small>
      </div>
    </section>

    <!-- 2. НОВЫЙ ФУНКЦИОНАЛ: СПРАВОЧНИК ОТДЕЛОВ -->
    <section class="departments-section">
      <h2 style="text-align: center; margin-bottom: 30px;">Выберите нужный отдел</h2>
      
      <div class="dept-tabs">
        <button 
          v-for="dept in departments" 
          :key="dept.id" 
          @click="activeDept = dept"
          :class="{ active: activeDept.id === dept.id }"
        >
          <span class="dept-icon">{{ dept.icon }}</span> {{ dept.name }}
        </button>
      </div>

      <transition name="fade" mode="out-in">
        <div class="dept-info-card" :key="activeDept.id">
          <div class="dept-details">
            <h3>{{ activeDept.name }}</h3>
            <p>{{ activeDept.desc }}</p>
            <div class="dept-contacts">
              <div class="dc-item">
                <span>Прямой телефон:</span>
                <b>{{ activeDept.phone }}</b>
              </div>
              <div class="dc-item">
                <span>Email отдела:</span>
                <b>{{ activeDept.email }}</b>
              </div>
            </div>
          </div>
          <div class="dept-hours">
            <span>Режим работы:</span>
            <div class="hours-badge">{{ activeDept.hours }}</div>
          </div>
        </div>
      </transition>
    </section>

    <hr class="section-divider" />

    <!-- 3. БЛОК С ФОРМОЙ И СОЦСЕТЯМИ -->
    <div class="support-split-section">
      
      <!-- ЛЕВАЯ: ФОРМА -->
      <section class="feedback-form-container">
        <h2>Написать письмо</h2>
        <p>Для сложных вопросов, требующих детального разбора.</p>
        
        <form @submit.prevent="submitFeedback" class="feedback-form">
          <label>Ваше имя</label>
          <input v-model="feedback.name" placeholder="Иван Иванов" required />
          
          <label>Email для ответа</label>
          <input v-model="feedback.contact" type="email" placeholder="ivan@example.com" required />
          
          <label>Сообщение</label>
          <textarea v-model="feedback.message" placeholder="Опишите вашу проблему..." rows="5" required></textarea>
          
          <button type="submit" :disabled="loading">
            {{ loading ? 'Отправка...' : 'Отправить сообщение' }}
          </button>
        </form>
      </section>

      <!-- ПРАВАЯ: СОЦСЕТИ (БЕЗ YOUTUBE) -->
      <section class="social-links-container">
        <h2>Мы в соцсетях</h2>
        <p>Подпишитесь, чтобы следить за новостями, или напишите нам в личные сообщения.</p>

        <div class="social-grid">
            <!-- VK -->
            <a href="https://vk.com/mr.monss" target="_blank" class="social-card vk">
                <div class="social-icon">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/21/VK.com-logo.svg" alt="VK">
                </div>
                <div class="social-info">
                    <strong>ВКонтакте</strong>
                    <span>Новости и акции</span>
                </div>
                <div class="social-arrow">↗</div>
            </a>

            <!-- TELEGRAM -->
            <a href="https://t.me/M0nss" target="_blank" class="social-card tg">
                <div class="social-icon">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="TG">
                </div>
                <div class="social-info">
                    <strong>Telegram</strong>
                    <span>Быстрая поддержка</span>
                </div>
                <div class="social-arrow">↗</div>
            </a>
        </div>

        <div class="support-hint">
            <span class="hint-icon">💡</span>
            <span>Самый быстрый ответ — в <b>Telegram</b>. Время ожидания: ~2 минуты.</span>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';

const feedback = ref({ name: '', contact: '', message: '' });
const loading = ref(false);

const isStoreOpen = computed(() => {
  const h = new Date().getHours();
  return h >= 9 && h < 21;
});

// Данные для справочника отделов
const departments = [
  { 
    id: 'sales', 
    name: 'Отдел продаж', 
    icon: '🛒', 
    desc: 'Консультации по подбору запчастей, оформление заказов и вопросы оплаты.',
    phone: '+7 (999) 123-45-67 (доб. 1)',
    email: 'sales@apexdrive.ru',
    hours: '09:00 — 21:00'
  },
  { 
    id: 'warranty', 
    name: 'Возврат и Гарантия', 
    icon: '🛡️', 
    desc: 'Вопросы по возврату товаров, гарантийным случаям и претензиям.',
    phone: '+7 (999) 123-45-67 (доб. 2)',
    email: 'warranty@apexdrive.ru',
    hours: '10:00 — 19:00 (Пн-Пт)'
  },
  { 
    id: 'b2b', 
    name: 'Оптовый отдел (B2B)', 
    icon: '🤝', 
    desc: 'Сотрудничество с СТО, таксопарками и магазинами. Оптовые прайс-листы.',
    phone: '+7 (999) 123-45-67 (доб. 3)',
    email: 'b2b@apexdrive.ru',
    hours: '09:00 — 18:00 (Пн-Пт)'
  }
];

const activeDept = ref(departments[0]);

const submitFeedback = async () => {
  loading.value = true;
  try {
    await axios.post('/api/feedback/send', feedback.value);
    alert("✅ Сообщение успешно отправлено! Мы ответим вам на почту.");
    feedback.value = { name: '', contact: '', message: '' };
  } catch (e) {
    alert('❌ Ошибка отправки. Попробуйте позже.');
  } finally {
    loading.value = false;
  }
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  alert(`Скопировано: ${text}`);
};
</script>

<style scoped>
.contacts-page {
    padding-top: 40px;
    padding-bottom: 60px;
    animation: fadeIn 0.5s ease-out;
}

.contacts-page-header {
    text-align: center;
    margin-bottom: 50px;
}

.contacts-page-header h1 {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 10px;
}

.contacts-page-header p {
    color: var(--text-muted);
    font-size: 1.1rem;
}

/* 1. СЕТКА КОНТАКТОВ */
.contacts-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 25px;
    margin-bottom: 40px;
}

.contact-item {
    background: var(--bg-card);
    padding: 30px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    transition: var(--transition);
    text-align: center;
    position: relative;
}

.contact-item:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary);
}

.contact-item h3 {
    font-size: 1.1rem;
    margin-bottom: 10px;
    color: var(--text-muted);
    font-weight: 600;
}

.contact-item p {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 5px;
    cursor: pointer;
}

/* Тултип для копирования */
.copy-trigger:hover { color: var(--primary); }
.tooltip {
    visibility: hidden;
    background-color: #333;
    color: #fff;
    text-align: center;
    padding: 5px 10px;
    border-radius: 6px;
    position: absolute;
    z-index: 1;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    opacity: 0;
    transition: opacity 0.3s;
}
.copy-trigger:hover .tooltip { visibility: visible; opacity: 1; }

.phone-link {
    font-size: 1.3rem;
    color: var(--primary);
}

.contact-item small {
    display: block;
    margin-top: 10px;
    color: var(--text-muted);
    font-size: 0.85rem;
}

/* Индикатор статуса */
.status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.9rem;
    margin: 10px 0;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    display: inline-block;
}

.status-open { background: var(--success-light); color: var(--success); }
.status-closed { background: var(--danger-light); color: var(--danger); }


/* 2. НОВЫЙ БЛОК: ОТДЕЛЫ */
.departments-section {
    margin-bottom: 60px;
    padding: 0 20px;
}

.dept-tabs {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 25px;
    flex-wrap: wrap;
}

.dept-tabs button {
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    padding: 12px 24px;
    border-radius: var(--radius-full);
    font-weight: 600;
    color: var(--text-muted);
    font-size: 0.95rem;
    transition: var(--transition);
}

.dept-tabs button:hover {
    background: var(--bg-card);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
}

.dept-tabs button.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
    box-shadow: var(--shadow-md);
}

.dept-info-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: var(--shadow-md);
    max-width: 900px;
    margin: 0 auto;
}

.dept-details h3 { font-size: 1.5rem; margin-bottom: 10px; color: var(--text-main); }
.dept-details p { color: var(--text-muted); margin-bottom: 20px; max-width: 500px; }

.dept-contacts {
    display: flex;
    gap: 30px;
}

.dc-item {
    display: flex;
    flex-direction: column;
}

.dc-item span { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
.dc-item b { font-size: 1.1rem; color: var(--primary); margin-top: 5px; }

.hours-badge {
    background: var(--bg-input);
    padding: 10px 20px;
    border-radius: var(--radius-md);
    font-weight: 700;
    color: var(--text-main);
    border: 1px solid var(--border-color);
    margin-top: 5px;
    display: inline-block;
}

/* 3. РАЗДЕЛИТЕЛЬНАЯ СЕКЦИЯ (ФОРМА + СОЦСЕТИ) */
.support-split-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 50px;
}

.section-divider {
    border: 0;
    border-top: 1px solid var(--border-color);
    margin: 40px 0;
}

/* ФОРМА */
.feedback-form-container h2, .social-links-container h2 {
    font-size: 1.8rem;
    margin-bottom: 5px;
}

.feedback-form {
    background: var(--bg-card);
    padding: 30px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    margin-top: 20px;
}

.feedback-form label {
    display: block;
    font-weight: 700;
    margin-bottom: 8px;
    font-size: 0.9rem;
    color: var(--text-main);
}

.feedback-form input, .feedback-form textarea {
    margin-bottom: 20px;
    width: 100%;
}

.feedback-form button {
    width: 100%;
    background: var(--text-main);
    color: white;
    padding: 14px;
    border-radius: var(--radius-md);
    font-weight: 600;
}

.feedback-form button:hover {
    background: var(--primary);
}

/* СОЦСЕТИ */
.social-links-container {
    display: flex;
    flex-direction: column;
}

.social-grid {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-top: 25px;
}

.social-card {
    display: flex;
    align-items: center;
    background: var(--bg-card);
    padding: 15px 20px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    text-decoration: none;
    transition: var(--transition);
    color: var(--text-main);
}

.social-card:hover {
    transform: translateX(5px);
    box-shadow: var(--shadow-md);
    border-color: currentColor; 
}

.social-icon img {
    width: 40px;
    height: 40px;
    object-fit: contain;
}

.social-info {
    flex: 1;
    margin-left: 20px;
    display: flex;
    flex-direction: column;
}

.social-info strong { font-size: 1.1rem; }
.social-info span { font-size: 0.85rem; color: var(--text-muted); }

.social-arrow {
    font-size: 1.2rem;
    color: var(--text-muted);
}

/* Цвета брендов при наведении */
.vk:hover { color: #0077FF; border-color: #0077FF !important; }
.tg:hover { color: #24A1DE; border-color: #24A1DE !important; }

/* Подсказка */
.support-hint {
    margin-top: 30px;
    background: var(--primary-light);
    color: var(--primary);
    padding: 15px 20px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 0.9rem;
    border: 1px solid rgba(79, 70, 229, 0.2);
}

.hint-icon { font-size: 1.5rem; }

/* АДАПТИВНОСТЬ */
@media (max-width: 900px) {
    .support-split-section {
        grid-template-columns: 1fr;
        gap: 60px;
    }
    
    .dept-info-card {
        flex-direction: column;
        text-align: center;
        gap: 20px;
    }
    
    .dept-contacts {
        flex-direction: column;
        gap: 15px;
        align-items: center;
    }
}
</style>