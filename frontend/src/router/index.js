import { createRouter, createWebHistory } from 'vue-router'

// Импортируем основные страницы
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'
import Contacts from '@/views/Contacts.vue'
import Catalog from '@/views/Catalog.vue' // Добавили каталог!

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      // Также проверь роут для каталога (папок), он должен поддерживать вложенность
      path: '/catalog/:id?', 
      name: 'catalog',
      component: () => import('@/views/Catalog.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: About
    },
    {
      path: '/contacts',
      name: 'contacts',
      component: Contacts
    },
    {
      path: '/product/:id',
      name: 'product-detail',
      component: () => import('@/views/ProductDetail.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/Register.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/Profile.vue')
    },
        {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings.vue')
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('@/views/Cart.vue')
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('@/views/Checkout.vue')
    },
    {
      path: '/wishlist',
      name: 'wishlist',
      component: () => import('@/views/Wishlist.vue')
    },
    {
      // Добавляем :id, чтобы можно было заходить на /category/65, /category/70 и т.д.
      path: '/category/:id', 
      name: 'categoryproducts',
      component: () => import('@/views/CategoryProducts.vue')
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('@/views/Orders.vue')
    },
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      beforeEnter: (to, from, next) => {
        // ИСПРАВЛЕНО: Читаем ключ 'role', а не 'user_role'
        const role = localStorage.getItem('role'); 
        if (role === 'admin') {
          next();
        } else {
          alert('Доступ запрещен. Требуются права администратора.');
          next('/login');
        }
      },
      children: [
        { path: '', redirect: '/admin/orders' },
        { path: 'users', component: () => import('@/views/admin/AdminUsers.vue') },
        { path: 'cards', component: () => import('@/views/admin/AdminCards.vue') },
        { path: 'products', component: () => import('@/views/admin/AdminProducts.vue') },
        { path: 'orders', component: () => import('@/views/admin/AdminOrders.vue') },
        { path: 'stocks', component: () => import('@/views/admin/AdminStocks.vue') },
        { path: 'categories', component: () => import('@/views/admin/AdminCategories.vue') },
        { path: 'brands', component: () => import('@/views/admin/AdminBrands.vue') },
        { path: 'warehouses', component: () => import('@/views/admin/AdminWarehouses.vue') },
        { path: 'reviews', component: () => import('@/views/admin/AdminReviews.vue') },
        { path: 'logs', component: () => import('@/views/admin/AdminLogs.vue') },  
      ]
    },
  ]
})

export default router