import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useUserStore } from '../stores/user'
import AppLayout from '../layouts/AppLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'

// 顶部进度条：每次路由跳转开始时显示，完成或出错时结束（无转圈图标）
NProgress.configure({ showSpinner: false, minimum: 0.1, trickleSpeed: 120, speed: 220 })

// 延迟启动，避免瞬时导航和 /search 弹窗路由闪一下进度条
let progressTimer: number | undefined

function startProgress() {
  window.clearTimeout(progressTimer)
  progressTimer = window.setTimeout(() => NProgress.start(), 150)
}

function doneProgress() {
  window.clearTimeout(progressTimer)
  progressTimer = undefined
  NProgress.done()
}

declare module 'vue-router' {
  interface RouteMeta {
    /** 需要登录才能访问 */
    requiresAuth?: boolean
    /** 仅未登录用户可访问（登录、注册页） */
    guestOnly?: boolean
    /** 认证布局中内容上下左右居中（仅登录、注册） */
    centered?: boolean
    /** 主区域使用更宽的容器（首页三栏） */
    wide?: boolean
    /** 覆盖在当前页面上的弹窗路由（搜索、发布/编辑），不改变底层滚动位置 */
    overlay?: boolean
    /** 蒙版关闭后返回的父路由 name，用于保持底层页面滚动位置 */
    overlayParent?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // 蒙版路由（搜索、发布/编辑）打开与关闭都不改变底层页面的滚动位置
    if (to.meta.overlay) return false
    if (from.meta.overlay && to.name === from.meta.overlayParent) return false
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
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
          meta: { wide: true },
          // 搜索页作为首页子路由：HomeView 保持挂载，搜索弹窗以蒙版覆盖在主页上
          children: [
            {
              path: 'search',
              name: 'search',
              component: () => import('../views/SearchView.vue'),
              meta: { overlay: true, overlayParent: 'home' },
            },
          ],
        },
        {
          path: 'articles/:id',
          name: 'article-detail',
          component: () => import('../views/ArticleDetailView.vue'),
          meta: { wide: true },
          // 编辑作为详情页的子路由：详情页保持挂载，编辑器以蒙版覆盖
          children: [
            {
              path: 'edit',
              name: 'article-edit',
              component: () => import('../components/ArticleEditorDialog.vue'),
              meta: { requiresAuth: true, overlay: true, overlayParent: 'article-detail' },
            },
          ],
        },
        {
          path: 'users/:id',
          name: 'user-profile',
          component: () => import('../views/UserProfileView.vue'),
        },
        {
          path: 'columns',
          name: 'columns',
          component: () => import('../views/ColumnListView.vue'),
          meta: { wide: true },
          // 无专栏参数时的发布入口：覆盖在全部专栏页上
          children: [
            {
              path: 'new',
              name: 'article-create-bare',
              component: () => import('../components/ArticleEditorDialog.vue'),
              meta: { requiresAuth: true, overlay: true, overlayParent: 'columns' },
            },
          ],
        },
        {
          path: 'columns/:id',
          name: 'column-detail',
          component: () => import('../views/ColumnDetailView.vue'),
          meta: { wide: true },
          // 发布作为专栏详情页的子路由：专栏页保持挂载，编辑器以蒙版覆盖
          children: [
            {
              path: 'articles/new',
              name: 'article-create',
              component: () => import('../components/ArticleEditorDialog.vue'),
              meta: { requiresAuth: true, overlay: true, overlayParent: 'column-detail' },
            },
          ],
        },
      ],
    },
    // 独立页面：不显示顶部导航栏，仅保留左上角 logo（登录、注册、个人主页）
    {
      path: '/',
      component: AuthLayout,
      children: [
        {
          path: 'me',
          name: 'profile',
          component: () => import('../views/ProfileView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'login',
          name: 'login',
          component: () => import('../views/LoginView.vue'),
          meta: { guestOnly: true, centered: true },
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('../views/RegisterView.vue'),
          meta: { guestOnly: true, centered: true },
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

router.beforeEach((to, from) => {
  // 首屏由 index.html 的 splash 负责，避免双加载指示
  if (from !== START_LOCATION) startProgress()

  const user = useUserStore()
  if (to.meta.requiresAuth && !user.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && user.isLoggedIn) {
    return { name: 'home' }
  }
  return true
})

router.afterEach(() => {
  doneProgress()
})

router.onError(() => {
  doneProgress()
})

export default router
