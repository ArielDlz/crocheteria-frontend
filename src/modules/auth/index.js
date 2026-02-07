// Módulo de Autenticación
// Exporta las vistas, componentes, servicios y composables del módulo auth

// Vistas
export { default as LoginView } from './views/LoginView.vue'

// Componentes
export { default as LoginForm } from './components/LoginForm.vue'

// Servicios
export { authService } from './services/authService'

// Composables
export { useAuth, waitForAuthInit } from './composables/useAuth'
export { usePermissions } from './composables/usePermissions'

