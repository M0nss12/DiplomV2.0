<template>
  <div class="about-page">
    
    <!-- 1. HERO-СЕКЦИЯ -->
    <section class="hero-about">
      <div class="hero-content">
        <h1>О компании <span class="highlight">ApexDrive</span></h1>
        <p class="hero-subtitle">
          Инновационный маркетплейс автозапчастей с интеллектуальной системой логистики. 
          Мы создали 100% нормализованную экосистему, которая объединяет десятки складов по всей России, 
          чтобы вы получали детали максимально быстро и по честной цене.
        </p>
        <router-link to="/catalog" class="btn-primary-large">Перейти в каталог</router-link>
      </div>
      <div class="hero-image">
        <!-- Декоративные элементы для фона -->
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
      </div>
    </section>

    <!-- 2. СТАТИСТИКА ПЛАТФОРМЫ (Из БД) -->
    <section class="stats-section">
      <div class="stat-card">
        <div class="stat-value">12+</div>
        <div class="stat-label">лет опыта</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalProducts }}+</div>
        <div class="stat-label">товаров в базе</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalBrands }}</div>
        <div class="stat-label">официальных брендов</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">24/7</div>
        <div class="stat-label">поддержка клиентов</div>
      </div>
    </section>

    <!-- 3. УМНАЯ ЛОГИСТИКА -->
    <section class="logistics-section">
      <div class="logistics-info">
        <h2>📦 Умная логистика ApexDrive</h2>
        <p class="section-subtitle">Мы оптимизировали доставку так, чтобы она зависела от реального наличия товара в вашем регионе:</p>
        
        <div class="logistics-grid">
          <div class="logistics-item">
            <span class="logistics-icon">🏙️</span>
            <div>
              <strong>Внутри вашего города</strong>
              <p>Если товар есть на складе в вашем городе, перемещение в выбранный ПВЗ абсолютно <b>бесплатно</b>.</p>
            </div>
          </div>
          
          <div class="logistics-item">
            <span class="logistics-icon">🚚</span>
            <div>
              <strong>Межгород (до ПВЗ)</strong>
              <p>Если товара нет в вашем регионе, мы привезем его с центрального хаба по фиксированному тарифу (800 ₽).</p>
            </div>
          </div>
          
          <div class="logistics-item">
            <span class="logistics-icon">⚖️</span>
            <div>
              <strong>Тяжёлые грузы</strong>
              <p>При весе заказа более 10 кг добавляется символическая плата: 50 ₽ за каждый килограмм перевеса.</p>
            </div>
          </div>
        </div>

        <div class="logistics-cta">
          <router-link to="/catalog"><button class="btn-primary-large">🛒 Начать покупки</button></router-link>
          <p class="city-note">Наличие в <b>г. {{ appStore.city }}</b> обновляется в реальном времени.</p>
        </div>
      </div>
    </section>

    <!-- 4. ИНТЕГРАЦИЯ API: ФИНАНСОВЫЙ РАДАР -->
    <section class="currency-radar-section">
      <div class="currency-content">
        <h2>Финансовый радар закупок</h2>
        <p>Поскольку 80% автокомпонентов импортируются, мы мониторим курсы валют в реальном времени, чтобы удерживать цены на складах максимально долго.</p>
        
        <div v-if="loadingCurrency" class="loading-state">
          Получение данных с биржи...
        </div>

        <div v-else-if="currencyData" class="currency-dashboard">
          
          <!-- Карточки валют -->
          <div class="currency-metrics">
            <div class="c-metric">
              <span class="c-flag">🇺🇸</span>
              <div class="c-val">{{ currencyData.usd }} ₽</div>
              <div class="c-lbl">USD (ЦБ РФ)</div>
            </div>
            <div class="c-metric">
              <span class="c-flag">🇪🇺</span>
              <div class="c-val">{{ currencyData.eur }} ₽</div>
              <div class="c-lbl">EUR (ЦБ РФ)</div>
            </div>
            <div class="c-metric">
              <span class="c-flag">🇨🇳</span>
              <div class="c-val">{{ currencyData.cny }} ₽</div>
              <div class="c-lbl">CNY (Китай)</div>
            </div>
          </div>

          <!-- Индекс цен -->
          <div class="price-index-box" :class="priceIndex.status">
            <div class="i-icon">{{ priceIndex.icon }}</div>
            <div>
              <strong>Индекс цен ApexDrive: {{ priceIndex.title }}</strong>
              <p>{{ priceIndex.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. НАШИ ПАРТНЕРЫ -->
    <section v-if="stats.brandsList && stats.brandsList.length" class="brands-section">
      <h2>С нами работают</h2>
      <div class="brands-grid">
        <div v-for="brand in stats.brandsList" :key="brand.name" class="brand-card">
          <img :src="brand.logo_url" :alt="brand.name" v-if="brand.logo_url" loading="lazy" />
          <div v-else class="brand-letter">{{ brand.name.charAt(0) }}</div>
          <div class="brand-name">{{ brand.name }}</div>
        </div>
      </div>
    </section>

    <!-- 6. ЧАСТЫЕ ВОПРОСЫ (FAQ) -->
    <section class="faq-section">
      <div class="section-header">
        <h2>❓ Ответы на частые вопросы</h2>
      </div>
      
      <div class="faq-accordion">
        <div v-for="(faq, index) in faqs" :key="index" class="faq-item" :class="{ 'active': activeFaq === index }">
          <button class="faq-question" @click="toggleFaq(index)">
            {{ faq.question }}
            <span class="faq-icon">{{ activeFaq === index ? '−' : '+' }}</span>
          </button>
          <div class="faq-answer" v-show="activeFaq === index">
            <p>{{ faq.answer }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. КАРТА -->
    <section class="map-section">
      <h2>Наш главный распределительный центр</h2>
      <p style="color: var(--text-muted); margin-bottom: 20px;">Центральный хаб: г. Москва, ул. Тверская, д. 1. Отсюда осуществляются все межрегиональные отправки.</p>
      <div id="map" class="map-container"></div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useAppStore } from '@/stores/appStore';

const appStore = useAppStore();
const stats = ref({
  totalProducts: 0,
  totalBrands: 0,
  brandsList: []
});

// Состояние для API Валют
const currencyData = ref(null);
const loadingCurrency = ref(true);

// FAQ
const faqs = ref([
  { 
    question: 'Что делать, если деталь мне не подошла?', 
    answer: 'Мы понимаем, что подбор автозапчастей — сложный процесс. Если деталь не подошла к вашему авто, вы можете вернуть ее в любой из наших ПВЗ в течение 14 дней без объяснения причин. Средства вернутся на вашу карту.' 
  },
  { 
    question: 'Как работает гарантия на запчасти?', 
    answer: 'Мы предоставляем официальную гарантию от 6 до 24 месяцев (в зависимости от производителя). При выявлении заводского брака мы бесплатно обменяем деталь или вернем деньги.' 
  },
  { 
    question: 'Как рассчитывается стоимость доставки из другого города?', 
    answer: 'Если товара нет в вашем городе, стоимость доставки составит 800 рублей. Однако, если общий вес вашего заказа превышает 10 кг, система автоматически добавит по 50 рублей за каждый килограмм перевеса.' 
  },
  { 
    question: 'Могу ли я оплатить заказ при получении?', 
    answer: 'Да. При оформлении заказа выберите способ "Наличными" или "Картой в ПВЗ". Вы сможете осмотреть товар перед оплатой.' 
  }
]);

const activeFaq = ref(null);
const toggleFaq = (index) => { activeFaq.value = activeFaq.value === index ? null : index; };

const loadAboutData = async () => {
  try {
    const res = await axios.get('/api/marketing/about-info');
    stats.value = res.data;
  } catch (e) { console.error('Ошибка БД', e); }
};

// ИНТЕГРАЦИЯ С API ВАЛЮТ ЦБ РФ
const fetchCurrency = async () => {
  loadingCurrency.value = true;
  try {
    // Обращаемся к нашему серверу, который уже проксирует запрос к ЦБ
    const res = await axios.get('/api/marketing/currency');
    currencyData.value = res.data;
  } catch (e) {
    console.error("Ошибка получения валют", e);
    // Фолбэк на случай ошибки
    currencyData.value = { usd: '90.00', eur: '98.00', cny: '12.50' };
  } finally {
    loadingCurrency.value = false;
  }
};

// Анализатор цен на основе курса
const priceIndex = computed(() => {
    if (!currencyData.value) return { status: 'normal', icon: '✅', title: 'Стабильно', desc: 'Нет данных' };
    
    const usd = Number(currencyData.value.usd);
    
    if (usd > 105) {
        return { status: 'danger', icon: '📈', title: 'Ожидается повышение', desc: 'В связи с высоким курсом закупки, новые партии деталей (Bosch, Brembo) могут подорожать. Рекомендуем покупать из наличия.' };
    } else if (usd < 85) {
        return { status: 'success', icon: '📉', title: 'Благоприятный фон', desc: 'Курс валют снижается. Мы ожидаем падение цен на азиатские и европейские аналоги в ближайшие недели.' };
    }
    
    return { status: 'normal', icon: '🛡️', title: 'Цены заморожены', desc: 'Мы зафиксировали цены на складские остатки. Текущий курс не влияет на детали в наличии.' };
});

const initMap = () => {
  if (window.ymaps) {
    window.ymaps.ready(() => {
      const map = new window.ymaps.Map('map', { center: [55.7558, 37.6173], zoom: 13, controls: ['zoomControl'] });
      map.geoObjects.add(new window.ymaps.Placemark([55.7558, 37.6173], { balloonContent: 'Главный склад ApexDrive' }));
    });
  } else {
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=ваш_ключ&lang=ru_RU';
    script.onload = () => {
      window.ymaps.ready(() => {
        const map = new window.ymaps.Map('map', { center: [55.7558, 37.6173], zoom: 13, controls: ['zoomControl'] });
        map.geoObjects.add(new window.ymaps.Placemark([55.7558, 37.6173], { balloonContent: 'ApexDrive Hub' }));
      });
    };
    document.head.appendChild(script);
  }
};

onMounted(() => {
  loadAboutData();
  fetchCurrency();
  initMap();
});
</script>

<style scoped>
.about-page {
  animation: fadeIn 0.5s ease-out;
  padding-bottom: 50px;
}

/* 1. HERO СЕКЦИЯ */
.hero-about {
  display: flex;
  align-items: center;
  gap: 3rem;
  margin-bottom: 4rem;
  background: linear-gradient(135deg, var(--bg-card) 0%, var(--primary-light) 100%);
  border-radius: var(--radius-lg);
  padding: 4rem 3rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.hero-content {
  flex: 1.5;
  z-index: 2;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.highlight {
  background: linear-gradient(120deg, var(--primary) 0%, #818cf8 80%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-image {
  flex: 1;
  position: relative;
  height: 250px;
}

.shape { position: absolute; border-radius: 50%; opacity: 0.1; }
.shape-1 { width: 300px; height: 300px; background: var(--primary); top: -50px; right: -50px; }
.shape-2 { width: 150px; height: 150px; background: var(--danger); bottom: 0; left: 0; }

.btn-primary-large {
  display: inline-block;
  padding: 1rem 2.5rem;
  background: var(--primary);
  color: white !important;
  border-radius: var(--radius-sm);
  font-size: 1.1rem;
  font-weight: 700;
  text-decoration: none;
  transition: var(--transition);
  box-shadow: 0 8px 15px rgba(79, 70, 229, 0.3);
}

.btn-primary-large:hover {
  background: var(--primary-hover);
  transform: translateY(-3px);
  box-shadow: 0 12px 20px rgba(79, 70, 229, 0.4);
}

/* 2. СТАТИСТИКА */
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  margin: 4rem 0;
}

.stat-card {
  text-align: center;
  background: var(--bg-card);
  padding: 30px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: var(--primary);
  box-shadow: var(--shadow-md);
}

.stat-value {
  font-size: 2.8rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

/* 3. ЛОГИСТИКА */
.logistics-section {
  margin: 4rem 0;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 3rem;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
}

.logistics-info h2 { font-size: 2.2rem; margin-bottom: 0.5rem; }
.section-subtitle { font-size: 1.1rem; color: var(--text-muted); margin-bottom: 2rem; }

.logistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.logistics-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: var(--bg-input);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  transition: var(--transition);
}

.logistics-item:hover {
  transform: translateY(-3px);
  background: var(--bg-card);
  border-color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.logistics-icon { font-size: 2rem; line-height: 1; }
.logistics-item strong { display: block; margin-bottom: 0.5rem; color: var(--text-main); font-size: 1.1rem; }
.logistics-item p { margin: 0; color: var(--text-muted); font-size: 0.9rem; }

.city-note { margin-top: 10px; font-size: 0.85rem; color: var(--text-muted); }

/* 4. ВАЛЮТНЫЙ РАДАР (НОВОЕ) */
.currency-radar-section {
    margin: 4rem 0;
    padding: 3rem;
    background: #1e293b; /* Строгий финансовый стиль */
    color: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
}

.currency-content h2 { color: white !important; margin-bottom: 10px; font-size: 2rem; }
.currency-content p { color: #94a3b8; margin-bottom: 30px; font-size: 1.1rem; }

.currency-dashboard {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.currency-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

.c-metric {
    background: rgba(255,255,255,0.05);
    padding: 20px;
    border-radius: var(--radius-md);
    text-align: center;
    border: 1px solid rgba(255,255,255,0.1);
    transition: var(--transition);
}

.c-metric:hover {
    background: rgba(255,255,255,0.1);
    transform: translateY(-3px);
}

.c-flag { font-size: 2rem; display: block; margin-bottom: 10px; }
.c-val { font-size: 1.6rem; font-weight: 800; color: white; }
.c-lbl { font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; margin-top: 5px; font-weight: 600; }

.price-index-box {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 20px;
    border-radius: var(--radius-md);
    margin-top: 10px;
}

.price-index-box.normal { background: rgba(59, 130, 246, 0.1); border: 1px solid var(--primary); }
.price-index-box.normal strong { color: #60a5fa; }

.price-index-box.danger { background: rgba(244, 63, 94, 0.1); border: 1px solid var(--danger); }
.price-index-box.danger strong { color: #fb7185; }

.price-index-box.success { background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); }
.price-index-box.success strong { color: #34d399; }

.i-icon { font-size: 2.2rem; }
.price-index-box p { margin: 5px 0 0 0; font-size: 0.95rem; color: #cbd5e1; }

/* 5. БРЕНДЫ */
.brands-section { margin: 4rem 0; text-align: center; }
.brands-section h2 { margin-bottom: 30px; }

.brands-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
}

.brand-card {
  width: 140px;
  height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: var(--transition);
  padding: 10px;
  box-shadow: var(--shadow-sm);
}

.brand-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary);
  transform: translateY(-3px);
}

.brand-card img {
  max-width: 90%;
  max-height: 50px;
  object-fit: contain;
  margin-bottom: 8px;
  filter: grayscale(1);
  transition: var(--transition);
}

.brand-card:hover img { filter: grayscale(0); }

.brand-letter {
  font-size: 2rem;
  font-weight: 800;
  color: var(--primary);
  margin-bottom: 5px;
}

.brand-name { font-weight: 600; font-size: 0.85rem; color: var(--text-muted); }

/* 6. FAQ АККОРДЕОН */
.faq-section {
    margin: 4rem 0;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}

.faq-accordion {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.faq-item {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-card);
    overflow: hidden;
    transition: var(--transition);
}

.faq-item.active {
    border-color: var(--primary);
    box-shadow: var(--shadow-sm);
}

.faq-question {
    width: 100%;
    padding: 20px;
    background: transparent;
    border: none;
    text-align: left;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-main);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.faq-icon {
    font-size: 1.5rem;
    color: var(--primary);
    font-weight: 400;
}

.faq-answer {
    padding: 0 20px 20px 20px;
    color: var(--text-muted);
    font-size: 0.95rem;
    line-height: 1.6;
}

/* 7. КАРТА */
.map-section { margin: 4rem 0; }
.map-container {
  width: 100%;
  height: 450px;
  background: var(--bg-input);
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  filter: grayscale(0.2);
  transition: var(--transition);
}
.map-container:hover { filter: grayscale(0); box-shadow: var(--shadow-md); }

/* АДАПТИВНОСТЬ */
@media (max-width: 768px) {
  .hero-about { flex-direction: column; padding: 2rem; text-align: center; }
  .shape { display: none; }
  .stats-section { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
  .currency-metrics { grid-template-columns: 1fr; }
}
</style>