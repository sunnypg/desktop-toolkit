import 'normalize.css'
import './assets/css/index.less'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import '@renderer/assets/iconfont/iconfont.js'
import SvgIcon from '@renderer/components/icons/SvgIcon.vue'

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.component('SvgIcon', SvgIcon)
app.use(router)
app.mount('#app')
