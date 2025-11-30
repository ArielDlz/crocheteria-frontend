import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { vPermission } from './directives/permission'

const app = createApp(App)

// Registrar directiva de permisos
app.directive('permission', vPermission)

app.use(router)

app.mount('#app')
