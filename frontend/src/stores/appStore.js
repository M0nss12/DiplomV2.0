import { defineStore } from 'pinia';
import axios from 'axios';

export const useAppStore = defineStore('app', {
  state: () => ({
    city: localStorage.getItem('user_city') || 'Москва',
    isCityConfirmed: !!localStorage.getItem('user_city')
  }),
  actions: {
    // 1. Установка города вручную
    setCity(newCity) {
      this.city = newCity;
      this.isCityConfirmed = true;
      localStorage.setItem('user_city', newCity);
      // В базу ничего не пишем, так как город - это часть адреса
    },

    // 2. Синхронизация при входе (Умное извлечение)
    async syncCity() {
      const userId = localStorage.getItem('user_id');
      
      if (userId) {
        try {
          const res = await axios.get(`/api/users/profile/${userId}`);
          const address = res.data.saved_delivery_address;
          
          if (address) {
            // Пытаемся вытащить город из строки адреса
            // Пример: "г. Москва, ул. Ленина" -> "Москва"
            let extractedCity = address.split(',')[0].replace('г.', '').trim();
            
            if (extractedCity && extractedCity.length > 2) {
                this.city = extractedCity;
                this.isCityConfirmed = true;
                localStorage.setItem('user_city', extractedCity);
                return;
            }
          }
        } catch (e) { console.error('Ошибка профиля'); }
      }
      
      // Если профиля нет или адрес пустой - по IP
      if (!this.isCityConfirmed) {
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          if (data.city) this.city = data.city;
        } catch (e) {}
      }
    }
  }
});