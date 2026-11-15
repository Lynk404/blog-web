import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import AppLayout from '../layouts/AppLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** 需要登录才能访问 */
    requiresAuth?: boolean
    /** 仅未登录用户可访问（登录、注册页） */
    guestOnly?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 主站：带顶部导航栏
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue'),
        },
        {
          path: 'articles/:id',
          name: 'article-detail',
          component: () => import('../views/ArticleDetailView.vue'),
        },
        {
          path: 'columns',
          name: 'columns',
          component: () => import('../views/ColumnListView.vue'),
        },
        {
          path: 'columns/:id',
          name: 'column-detail',
          component: () => import('../views/ColumnDetailView.vue'),
        },
        {
          path: 'me',
          name: 'profile',
          component: () => import('../views/ProfileView.vue'),
          meta: { requiresAuth: true },
        },
      ],
    },
    // 认证页：独立布局，不显示顶部导航栏，仅保留左上角 logo
    {
      path: '/',
      component: AuthLayout,
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('../views/LoginView.vue'),
          meta: { guestOnly: true },
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('../views/RegisterView.vue'),
          meta: { guestOnly: true },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const user = useUserStore()
  if (to.meta.requiresAuth && !user.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && user.isLoggedIn) {
    return { name: 'home' }
  }
  return true
})

export default router
