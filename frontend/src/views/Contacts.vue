<template>
  <div>
    <h1>Контакты и поддержка ApexDrive</h1>

    <!-- 1. ОСНОВНАЯ КОНТАКТНАЯ ИНФОРМАЦИЯ -->
    <section>
      <div style="display: flex; gap: 40px;">
        <div style="flex: 1;">
          <h3>📍 Главный офис (Хаб)</h3>
          <p>г. Москва, ул. Тверская, д. 1</p>
          
          <h3>📞 Горячая линия</h3>
          <p><a href="tel:+79991234567" style="font-weight: bold; font-size: 1.2em;">+7 (999) 123-45-67</a></p>
          
          <h3>✉️ Email для связи</h3>
          <p>monsschogath@gmail.com</p>
        </div>

        <div style="flex: 1;">
          <h3>🕒 Режим работы</h3>
          <p>Ежедневно: 09:00 — 21:00 (МСК)</p>
          <p :style="{ color: isStoreOpen ? 'green' : 'red', fontWeight: 'bold' }">
            {{ isStoreOpen ? '● Сейчас мы работаем' : '○ Сейчас мы закрыты' }}
          </p>
        </div>
      </div>
    </section>

    <hr />

    <!-- 2. ФОРМА ОБРАТНОЙ СВЯЗИ -->
    <section>
      <h2>Написать нам письмо</h2>
      <p>Оставьте заявку, и дежурный менеджер ответит вам в течение 15 минут.</p>
      
      <form @submit.prevent="submitFeedback" style="max-width: 500px;">
        <input v-model="feedback.name" placeholder="Ваше имя" required style="width: 100%; padding: 10px; margin-bottom: 10px;" />
        <input v-model="feedback.contact" type="email" placeholder="Ваш Email для ответа" required style="width: 100%; padding: 10px; margin-bottom: 10px;" />
        <textarea v-model="feedback.message" placeholder="Текст вашего обращения..." rows="4" required style="width: 100%; padding: 10px; margin-bottom: 10px;"></textarea>
        
        <button type="submit" :disabled="loading" style="padding: 10px 25px; background: #2c3e50; color: white; border: none; cursor: pointer;">
          {{ loading ? 'Отправка...' : 'Отправить обращение' }}
        </button>
      </form>
    </section>

    <hr />

    <!-- 3. ИНТЕЛЛЕКТУАЛЬНЫЙ ЧАТ-ПОМОЩНИК -->
    <section>
      <h2>Автоматический ассистент</h2>
      <p>Быстрые ответы на популярные вопросы без ожидания оператора.</p>

      <div id="chat-box" style="height: 350px; overflow-y: auto; border: 1px solid #ccc; padding: 20px; background: #fdfdfd; margin-bottom: 20px;">
        <div v-for="(msg, i) in chatHistory" :key="i" style="margin-bottom: 15px;">
          <div :style="{ textAlign: msg.type === 'user' ? 'right' : 'left' }">
            <span :style="{ 
              display: 'inline-block', 
              padding: '10px', 
              borderRadius: '8px', 
              background: msg.type === 'user' ? '#e3f2fd' : '#eee' 
            }">
              <strong>{{ msg.type === 'bot' ? 'Бот:' : 'Вы:' }}</strong> {{ msg.text }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="currentOptions.length > 0" style="display: flex; flex-direction: column; gap: 10px; max-width: 400px;">
        <button 
          v-for="opt in currentOptions" 
          :key="opt.text" 
          @click="handleChatChoice(opt)"
          style="text-align: left; padding: 10px; cursor: pointer; border: 1px solid #007bff; background: white; color: #007bff; border-radius: 5px;"
        >
          {{ opt.text }}
        </button>
      </div>

      <button @click="resetChat" style="margin-top: 20px; border: none; background: none; color: gray; cursor: pointer; text-decoration: underline;">
        🔄 Начать диалог сначала
      </button>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import axios from 'axios';

const feedback = ref({ name: '', contact: '', message: '' });
const loading = ref(false);

const isStoreOpen = computed(() => {
  const h = new Date().getHours();
  return h >= 9 && h < 21;
});

const submitFeedback = async () => {
  loading.value = true;
  try {
    await axios.post('/api/feedback/send', feedback.value);
    alert("✅ Сообщение успешно доставлено на почту monsschogath@gmail.com!");
    feedback.value = { name: '', contact: '', message: '' };
  } catch (e) {
    alert('❌ Ошибка отправки.');
  } finally {
    loading.value = false;
  }
};

// --- ЛОГИКА БОТА ---
const chatHistory = ref([
  { type: 'bot', text: 'Здравствуйте! Я — система автоматической поддержки ApexDrive. Выберите тему вопроса:' }
]);

const currentStep = ref('start');

const chatData = {
  start: [
    { text: '🔎 Как работает подбор запчастей?', answer: 'У нас работает 3НФ-система: добавьте авто в "Гараж", и сайт сам найдет совместимые детали на ближайшем складе.', next: 'parts_help' },
    { text: '🚚 Условия новой доставки', answer: 'Внутри вашего города — бесплатно до ПВЗ. Межгород считается по Яндекс.Картам. Курьер до двери — 300₽.', next: 'start' },
    { text: '📦 Где найти список складов?', answer: 'Полный список наших региональных складов доступен на странице "О нас".', next: 'start' },
    { text: '🔄 Гарантия на детали', answer: 'Мы работаем напрямую с брендами (Bosch, Motul и др.), поэтому даем официальную гарантию до 24 месяцев.', next: 'start' }
  ],
  parts_help: [
    { text: 'Как добавить авто?', answer: 'Перейдите в Личный кабинет -> Мой гараж и введите данные вашего автомобиля.', next: 'start' },
    { text: '⬅️ Назад в меню', answer: 'Слушаю вас.', next: 'start' }
  ]
};

// ИСПРАВЛЕНО: используем .value для получения текущего шага
const currentOptions = computed(() => chatData[currentStep.value] || chatData.start);

const handleChatChoice = (opt) => {
  chatHistory.value.push({ type: 'user', text: opt.text });
  setTimeout(() => {
    chatHistory.value.push({ type: 'bot', text: opt.answer });
    currentStep.value = opt.next || 'start';
    scrollToBottom();
  }, 400);
};

const resetChat = () => {
  currentStep.value = 'start';
  chatHistory.value = [{ type: 'bot', text: 'Диалог сброшен. Чем я могу помочь?' }];
};

const scrollToBottom = () => {
  nextTick(() => {
    const box = document.getElementById('chat-box');
    if (box) box.scrollTop = box.scrollHeight;
  });
};
</script>