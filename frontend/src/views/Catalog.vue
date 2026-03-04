<template>
  <div class="catalog-page" style="padding: 20px; max-width: 1200px; margin: 0 auto;">
    
    <!-- ХЛЕБНЫЕ КРОШКИ -->
    <nav class="breadcrumbs" style="margin-bottom: 20px; color: #888;">
      <router-link to="/catalog" style="text-decoration:none; color:#007bff;">Каталог</router-link>
      <span v-for="crumb in breadcrumbs" :key="crumb.id">
        <span> > </span>
        <router-link :to="'/catalog/' + crumb.id" style="text-decoration:none; color:#007bff;">{{ crumb.name }}</router-link>
      </span>
    </nav>

    <h1 style="margin-bottom: 20px;">{{ currentCategoryName }}</h1>
    <hr style="margin-bottom: 30px; border: 0; border-top: 1px solid #eee;" />

    <div v-if="loading" style="text-align: center; padding: 50px;">Загрузка категорий...</div>

    <div v-else-if="visibleCategories.length > 0" 
         style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
      
      <div v-for="cat in visibleCategories" :key="cat.id" @click="goToCategory(cat)"
           style="border: 1px solid #eee; padding: 20px; cursor: pointer; background: white; border-radius: 12px; display: flex; flex-direction: column;">
        
        <div style="font-weight: bold; font-size: 1.2em; margin-bottom: 15px;">{{ cat.name }}</div>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.85em; color: #777; flex: 1;">
            <li v-for="child in getChildCategories(cat.id).slice(0, 4)" :key="child.id" style="margin-bottom: 4px;">
              {{ child.name }}
            </li>
          </ul>
          <img :src="cat.image_url" style="width: 80px; height: 80px; object-fit: contain;" />
        </div>
      </div>
    </div>

    <div v-else style="text-align: center; padding: 100px;">
      <h3>В этой категории пока пусто</h3>
      <button @click="$router.push('/catalog')">Вернуться в начало</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const allCategories = ref([]);
const loading = ref(true);

const loadCategories = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/categories');
    allCategories.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const currentParentId = computed(() => route.params.id ? Number(route.params.id) : null);

const currentCategoryName = computed(() => {
  if (!currentParentId.value) return 'Каталог запчастей';
  const cat = allCategories.value.find(c => Number(c.id) === currentParentId.value);
  return cat ? cat.name : 'Каталог';
});

const getChildCategories = (parentId) => {
  return allCategories.value.filter(c => {
    const pId = c.parent_id ? Number(c.parent_id) : null;
    return pId === parentId;
  });
};

const visibleCategories = computed(() => getChildCategories(currentParentId.value));

const goToCategory = (cat) => {
  // Если у категории есть "дети", идем глубже в каталог. Если нет - к товарам.
  const children = getChildCategories(cat.id);
  if (children.length > 0) {
    router.push(`/catalog/${cat.id}`);
  } else {
    router.push(`/category/${cat.id}`);
  }
};

const breadcrumbs = computed(() => {
  const crumbs = [];
  let currentId = currentParentId.value;
  while (currentId) {
    const cat = allCategories.value.find(c => Number(c.id) === currentId);
    if (cat) {
      crumbs.unshift(cat);
      currentId = cat.parent_id ? Number(cat.parent_id) : null;
    } else break;
  }
  return crumbs;
});

onMounted(loadCategories);
watch(() => route.params.id, () => window.scrollTo(0, 0));
</script>