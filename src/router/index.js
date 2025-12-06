/**
 * Configuración del Router
 * Maneja las rutas de la aplicación SPA
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/modules/auth'

// Layouts
import MainLayout from '@/layouts/MainLayout.vue'

// Auth Views
import { LoginView } from '@/modules/auth'

// Rutas de la aplicación
const routes = [
  // ============ RUTAS PÚBLICAS ============
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false, hideLayout: true }
  },

  // ============ RUTAS PROTEGIDAS ============
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/modules/dashboard/views/DashboardView.vue'),
        meta: { title: 'Dashboard' }
      },
      
      // === VENTAS ===
      {
        path: 'ventas',
        name: 'Ventas',
        component: () => import('@/modules/ventas/views/VentasView.vue'),
        meta: { title: 'Ventas' }
      },

      // === INVENTARIOS ===
      {
        path: 'inventarios',
        name: 'Inventarios',
        component: () => import('@/modules/inventarios/views/InventariosView.vue'),
        meta: { title: 'Inventarios' }
      },

      // === USUARIOS ===
      {
        path: 'usuarios',
        name: 'Usuarios',
        component: () => import('@/modules/usuarios/views/UsuariosView.vue'),
        meta: { title: 'Usuarios' }
      },
      {
        path: 'usuarios/lista',
        name: 'UsuariosLista',
        component: () => import('@/modules/usuarios/views/UsuariosView.vue'),
        meta: { title: 'Lista de Usuarios' }
      },
      {
        path: 'usuarios/roles',
        name: 'Roles',
        component: () => import('@/modules/roles/views/RolesView.vue'),
        meta: { title: 'Roles' }
      },
      {
        path: 'usuarios/permisos',
        name: 'Permisos',
        component: () => import('@/modules/permisos/views/PermisosView.vue'),
        meta: { title: 'Permisos' }
      },
    ]
  },

  // Ruta 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

// Crear instancia del router
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard de navegación - Proteger rutas
router.beforeEach((to, from, next) => {
  const { isAuthenticated } = useAuth()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !isAuthenticated.value) {
    // Redirigir al login si no está autenticado
    next({ name: 'Login' })
  } else if (to.name === 'Login' && isAuthenticated.value) {
    // Si ya está logueado y trata de ir al login, redirigir al dashboard
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router

