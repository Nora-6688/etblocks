// 项目自动生成
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
// 接入ElementPlus组件配置
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 引入中文语言
import zhCn from 'element-plus/es/locale/lang/zh-cn'
// 引入ElementPlus的icon组件
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
// 注册ElementPlus的icon组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
// 使用本地中文语言
app.use(ElementPlus, {
  locale: zhCn,
})
// 应用 Pinia router 组件
app.use(createPinia())
app.use(router)

app.mount('#app')
