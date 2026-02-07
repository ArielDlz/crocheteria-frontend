/**
 * Configuración del Router
 * Maneja las rutas de la aplicación SPA
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuth, waitForAuthInit } from '@/modules/auth'

// Layouts - Lazy loading
const MainLayout = () => import('@/layouts/MainLayout.vue')

// Auth Views - Lazy loading
const LoginView = () => import('@/modules/auth/views/LoginView.vue')

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
      {
        path: 'ventas/nueva',
        name: 'NuevaVenta',
        component: () => import('@/modules/ventas/views/VentasView.vue'),
        meta: { title: 'Nueva Venta' }
      },
      {
        path: 'ventas/control-caja',
        name: 'ControlCaja',
        component: () => import('@/modules/ventas/views/ControlCajaView.vue'),
        meta: { title: 'Control de Caja' }
      },
      {
        path: 'ventas/control-caja/:id',
        name: 'CashRegisterDetails',
        component: () => import('@/modules/ventas/views/CashRegisterDetailsView.vue'),
        meta: { title: 'Detalles de Caja' }
      },

      // === INVENTARIOS ===
      {
        path: 'inventarios',
        name: 'Inventarios',
        component: () => import('@/modules/inventarios/views/InventariosView.vue'),
        meta: { title: 'Inventarios' }
      },
      {
        path: 'inventarios/categorias',
        name: 'Categorias',
        component: () => import('@/modules/inventarios/views/CategoriesView.vue'),
        meta: { title: 'Categorías de Productos' }
      },
      {
        path: 'inventarios/productos',
        name: 'Productos',
        component: () => import('@/modules/inventarios/views/ProductsView.vue'),
        meta: { title: 'Productos' }
      },
      {
        path: 'inventarios/compras',
        name: 'Compras',
        component: () => import('@/modules/inventarios/views/PurchasesView.vue'),
        meta: { title: 'Compras' }
      },
      {
        path: 'inventarios/surtir',
        name: 'SurtirEmprendimientos',
        component: () => import('@/modules/inventarios/views/StartupSupplyView.vue'),
        meta: { title: 'Surtir Emprendimientos' }
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

      // === CONTABILIDAD ===
      {
        path: 'contabilidad',
        name: 'Contabilidad',
        component: () => import('@/modules/contabilidad/views/ContabilidadView.vue'),
        meta: { title: 'Contabilidad' }
      },
      {
        path: 'contabilidad/saldos',
        name: 'Saldos',
        component: () => import('@/modules/contabilidad/views/SaldosView.vue'),
        meta: { title: 'Saldos' }
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
router.beforeEach(async (to, from, next) => {
  // Esperar a que la inicialización de autenticación termine antes de continuar
  await waitForAuthInit()
  
  const { isAuthenticated, checkAuth } = useAuth()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // Si la ruta requiere autenticación
  if (requiresAuth) {
    if (!isAuthenticated.value) {
      // Redirigir al login si no está autenticado
      next({ 
        name: 'Login',
        query: { redirect: to.fullPath } // Guardar la ruta destino para redirigir después del login
      })
      return
    }

    // Verificar token válido (opcional pero recomendado)
    try {
      const isValid = await checkAuth()
      if (!isValid) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
        return
      }
    } catch (error) {
      // Si hay error al verificar, redirigir al login
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }

  // Si ya está logueado y trata de ir al login, redirigir al dashboard
  if (to.name === 'Login' && isAuthenticated.value) {
    const redirect = to.query.redirect || '/dashboard'
    next(typeof redirect === 'string' ? redirect : '/dashboard')
    return
  }

  next()
})

// Manejar errores de navegación
router.onError((error) => {
  console.error('Error de navegación:', error)
  // Si es un error 404 o de carga de módulo, redirigir al dashboard
  if (error.message && error.message.includes('Failed to fetch dynamically imported module')) {
    window.location.href = '/dashboard'
  }
})

export default router

