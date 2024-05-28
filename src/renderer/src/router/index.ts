import { myLocalStorage } from '@renderer/utils/storage'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/main'
    },
    {
      path: '/login',
      component: () => import('../views/Login/Login.vue')
    },
    {
      path: '/main',
      component: () => import('../views/Main/Main.vue'),
      children: [
        {
          path: '/main',
          redirect: '/main/home'
        },
        {
          path: '/main/home',
          component: () => import('../views/Main/Home/Home.vue')
        },
        {
          path: '/main/weather',
          component: () => import('../views/Main/Weather/Weather.vue')
        },
        {
          path: '/main/crawler',
          component: () => import('../views/Main/Crawler/Crawler.vue')
        },
        {
          path: '/main/browser',
          component: () => import('../views/Main/Browser/Browser.vue')
        },
        {
          path: '/main/screen',
          component: () => import('../views/Main/Screen/Screen.vue')
        },
        {
          path: '/main/setting',
          component: () => import('../views/Main/Setting/Setting.vue')
        }
      ]
    },
    {
      path: '/cut',
      component: () => import('../views/Main/Screen/Cut.vue')
    }
  ]
})

// 导航守卫
router.beforeEach((to, _form, next) => {
  const token = myLocalStorage.getStorage('token')
  if (to.path.startsWith('/main') && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
