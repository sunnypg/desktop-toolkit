import { myLocalStorage } from '@renderer/utils/storage'
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
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
          path: '/main/personal',
          component: () => import('../views/Main/Personal/Personal.vue')
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
          path: '/main/control',
          component: () => import('../views/Main/Control/Local.vue')
        }
      ]
    },
    {
      path: '/cut',
      component: () => import('../views/Main/Screen/Cut.vue'),
      meta: {
        hideMainController: true
      }
    },
    {
      path: '/recording',
      component: () => import('../views/Main/Screen/Recording.vue'),
      meta: {
        hideMainController: true
      }
    },
    {
      path: '/remote',
      component: () => import('../views/Main/Control/Remote.vue')
    },
    {
      path: '/tray',
      component: () => import('../views/Main/Tray/Tray.vue'),
      meta: {
        hideMainController: true
      }
    }
  ]
})

router.beforeEach((to, _form, next) => {
  const token = myLocalStorage.getStorage('token')
  const visitor = myLocalStorage.getStorage('visitor')
  const isBrowser = !window.electron

  // 浏览器本地调试
  if (isBrowser && to.path !== '/remote') {
    next('/remote')
    return
  }
  // 访客模式
  if (visitor) {
    next()
    return
  }
  // 登录守卫
  if (to.path.startsWith('/main') && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
