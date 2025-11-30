<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePermissions } from '@/modules/auth'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermissions()

// Menú con categorías, subcategorías y permisos requeridos
const menuConfig = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/dashboard',
    // Dashboard visible para todos los autenticados
    permissions: null
  },
  {
    id: 'ventas',
    label: 'Ventas',
    icon: 'shopping-cart',
    route: '/ventas',
    // Requiere al menos uno de estos permisos para ver el módulo
    permissions: ['sales:read', 'sales:create', 'sales:update'],
    children: [
      { label: 'Nueva Venta', route: '/ventas/nueva', permission: 'sales:create' },
      { label: 'Historial', route: '/ventas/historial', permission: 'sales:read' },
      { label: 'Reportes', route: '/ventas/reportes', permission: 'sales:read' }
    ]
  },
  {
    id: 'inventarios',
    label: 'Inventarios',
    icon: 'inventory',
    route: '/inventarios',
    // Por ahora sin permisos específicos (ajustar según tu backend)
    permissions: null,
    children: [
      { label: 'Productos', route: '/inventarios/productos' },
      { label: 'Categorías', route: '/inventarios/categorias' },
      { label: 'Stock', route: '/inventarios/stock' }
    ]
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    icon: 'users',
    route: '/usuarios',
    permissions: ['users:read', 'users:create', 'users:update', 'users:delete'],
    children: [
      { label: 'Lista', route: '/usuarios/lista', permission: 'users:read' },
      { label: 'Roles', route: '/usuarios/roles', permission: 'roles:read' },
      { label: 'Permisos', route: '/usuarios/permisos', permission: 'permissions:read' }
    ]
  }
]

// Filtrar menú según permisos
const menuItems = computed(() => {
  return menuConfig
    .filter(item => {
      // Si no tiene permisos definidos, mostrar siempre
      if (!item.permissions) return true
      // Super admin ve todo
      if (isSuperAdmin.value) return true
      // Verificar si tiene al menos uno de los permisos del módulo
      return hasAnyPermission(item.permissions)
    })
    .map(item => {
      // Filtrar hijos según permisos
      if (item.children) {
        const filteredChildren = item.children.filter(child => {
          if (!child.permission) return true
          if (isSuperAdmin.value) return true
          return hasPermission(child.permission)
        })
        return { ...item, children: filteredChildren.length > 0 ? filteredChildren : undefined }
      }
      return item
    })
})

const expandedMenus = ref([])

const toggleMenu = (menuId) => {
  const index = expandedMenus.value.indexOf(menuId)
  if (index > -1) {
    expandedMenus.value.splice(index, 1)
  } else {
    expandedMenus.value.push(menuId)
  }
}

const isMenuExpanded = (menuId) => expandedMenus.value.includes(menuId)

const isActive = (itemRoute) => {
  return route.path === itemRoute || route.path.startsWith(itemRoute + '/')
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <!-- Logo -->
    <div class="sidebar-header">
      <router-link to="/dashboard" class="logo">
        <span class="logo-icon">🧶</span>
        <span v-if="!collapsed" class="logo-text">Crochetería</span>
      </router-link>
    </div>

    <!-- Navegación -->
    <nav class="sidebar-nav">
      <ul class="nav-list">
        <li 
          v-for="item in menuItems" 
          :key="item.id"
          class="nav-item"
          :class="{ 
            active: isActive(item.route),
            expanded: isMenuExpanded(item.id) && item.children
          }"
        >
          <!-- Item principal sin hijos -->
          <router-link 
            v-if="!item.children"
            :to="item.route"
            class="nav-link"
          >
            <span class="nav-icon">
              <!-- Dashboard Icon -->
              <svg v-if="item.icon === 'dashboard'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </span>
            <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
          </router-link>

          <!-- Item con hijos (expandible) -->
          <button 
            v-else
            class="nav-link nav-toggle"
            @click="toggleMenu(item.id)"
          >
            <span class="nav-icon">
              <!-- Shopping Cart Icon -->
              <svg v-if="item.icon === 'shopping-cart'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <!-- Inventory Icon -->
              <svg v-if="item.icon === 'inventory'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <!-- Users Icon -->
              <svg v-if="item.icon === 'users'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </span>
            <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
            <span v-if="!collapsed" class="nav-arrow" :class="{ rotated: isMenuExpanded(item.id) }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </button>

          <!-- Submenú -->
          <ul v-if="item.children && isMenuExpanded(item.id) && !collapsed" class="nav-submenu">
            <li v-for="child in item.children" :key="child.route" class="nav-subitem">
              <router-link :to="child.route" class="nav-sublink">
                {{ child.label }}
              </router-link>
            </li>
          </ul>
        </li>
      </ul>
    </nav>

    <!-- Footer del sidebar -->
    <div class="sidebar-footer">
      <span v-if="!collapsed" class="version">v1.0.0</span>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 260px;
  background: linear-gradient(180deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-base);
  z-index: 100;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
}

.sidebar.collapsed {
  width: 70px;
}

/* Header / Logo */
.sidebar-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
}

.logo-icon {
  font-size: 2rem;
}

.logo-text {
  font-family: var(--font-display, serif);
  font-size: 1.4rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
}

/* Navegación */
.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md) 0;
  overflow-y: auto;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin: var(--spacing-xs) var(--spacing-sm);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  font-size: 0.95rem;
  font-family: inherit;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active > .nav-link {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  text-align: left;
  white-space: nowrap;
}

.nav-arrow {
  display: flex;
  transition: transform var(--transition-fast);
}

.nav-arrow.rotated {
  transform: rotate(180deg);
}

/* Submenú */
.nav-submenu {
  list-style: none;
  padding: var(--spacing-xs) 0 var(--spacing-xs) 2.5rem;
  margin: 0;
  overflow: hidden;
}

.nav-sublink {
  display: block;
  padding: 0.5rem 1rem;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 0.875rem;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.nav-sublink:hover,
.nav-sublink.router-link-active {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

/* Footer */
.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.version {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Collapsed state */
.sidebar.collapsed .logo-text,
.sidebar.collapsed .nav-label,
.sidebar.collapsed .nav-arrow,
.sidebar.collapsed .nav-submenu {
  display: none;
}

.sidebar.collapsed .nav-link {
  justify-content: center;
  padding: 0.75rem;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.collapsed {
    transform: translateX(0);
    width: 260px;
  }
}
</style>
