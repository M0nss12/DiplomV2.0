<template>
  <div class="about-page">
    <!-- БЛОК 1: КТО МЫ -->
    <section>
      <h1>О компании ApexDrive</h1>
      <p>
        ApexDrive — это инновационный маркетплейс автозапчастей с интеллектуальной системой логистики. 
        Мы создали 100% нормализованную экосистему (3НФ), которая объединяет десятки складов по всей России, 
        чтобы вы получали детали максимально быстро и по честной цене.
      </p>
    </section>

    <hr />

    <!-- БЛОК 2: ЦИФРЫ (ИЗ БД) -->
    <section style="display: flex; justify-content: space-around; text-align: center;">
      <div>
        <h2>12+</h2>
        <p>лет лидерства</p>
      </div>
      <div>
        <h2>{{ stats.totalProducts }}+</h2>
        <p>товаров в базе</p>
      </div>
      <div>
        <h2>{{ stats.totalBrands }}</h2>
        <p>мировых брендов</p>
      </div>
      <div>
        <h2>24/7</h2>
        <p>умный ассистент</p>
      </div>
    </section>

    <hr />

    <!-- БЛОК 3: ЛОГИКА ДОСТАВКИ (ОБНОВЛЕННАЯ) -->
    <section style="display: flex; justify-content: space-between; align-items: center; background: #f4f7f6; padding: 30px; border-radius: 12px;">
      <div style="flex: 1;">
        <h2>📦 Умная логистика ApexDrive</h2>
        <p>Мы оптимизировали доставку так, чтобы она зависела от реального наличия товара в вашем регионе:</p>
        <ul style="line-height: 1.8;">
          <li><strong>Внутри вашего города:</strong> Заберите заказ в любом ПВЗ абсолютно <b>бесплатно</b>.</li>
          <li><strong>Курьер до двери:</strong> В любом городе присутствия — фиксированно <b>300 ₽</b>.</li>
          <li><strong>Межгород (до ПВЗ):</strong> Базовая цена за доставку из другого региона. Если город находится слишком далеко, стоимость увеличивается (расчет через Яндекс.Карты).</li>
          <li><strong>Комбинированная доставка:</strong> Если вы живете в другом городе и хотите доставку до дома — стоимость межгорода суммируется с курьерским сбором 300 ₽.</li>
          <li><strong>Тяжелые грузы:</strong> При весе заказа более 10 кг добавляется 50 ₽ за каждый кг перевеса.</li>
        </ul>
      </div>

      <div style="margin-left: 50px; text-align: center;">
        <router-link to="/catalog">
          <button style="padding: 20px 40px; font-size: 1.3em; cursor: pointer; background: #e44d26; color: white; border: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 15px rgba(228, 77, 38, 0.3);">
            🛒 Перейти в каталог
          </button>
        </router-link>
        <p style="margin-top: 10px; font-size: 0.8em; color: #888;">Наличие в г. {{ appStore.city }} обновится автоматически</p>
      </div>
    </section>

    <hr />

    <!-- БЛОК 4: НАШИ ПАРТНЕРЫ (БРЕНДЫ ИЗ БД) -->
    <section v-if="stats.brandsList.length > 0">
      <h2>Прямые контракты с производителями</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px;">
        <div v-for="brand in stats.brandsList" :key="brand.name" style="border: 1px solid #eee; padding: 15px; text-align: center; width: 130px; border-radius: 8px; background: white;">
          <img :src="brand.logo" width="80" height="40" style="object-fit: contain; margin-bottom: 8px;" v-if="brand.logo" />
          <div style="font-size: 0.85em; font-weight: bold;">{{ brand.name }}</div>
        </div>
      </div>
    </section>

    <hr />

    <!-- БЛОК 5: КАРТА -->
    <section>
      <h2>Наш главный распределительный центр</h2>
      <p>Центральный хаб: г. Москва, ул. Тверская, д. 1. Отсюда осуществляются все межрегиональные отправки.</p>
      <div id="map" style="width: 100%; height: 400px; background: #eee; border-radius: 12px; overflow: hidden; border: 1px solid #ddd;"></div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAppStore } from '@/stores/appStore';

const appStore = useAppStore();
const stats = ref({
  totalProducts: 0,
  totalBrands: 0,
  brandsList: []
});

const loadAboutData = async () => {
  try {
    const res = await axios.get('/api/marketing/about-info');
    stats.value = res.data;
  } catch (e) {
    console.error("Ошибка загрузки данных для страницы О нас");
  }
};

onMounted(() => {
  loadAboutData();

  if (window.ymaps) {
    window.ymaps.ready(() => {
      const map = new window.ymaps.Map("map", {
        center: [55.7558, 37.6173], // Москва
        zoom: 13,
        controls: ['zoomControl']
      });
      map.geoObjects.add(new window.ymaps.Placemark([55.7558, 37.6173], {
        balloonContent: 'Главный склад ApexDrive'
      }));
    });
  }
});
</script>
