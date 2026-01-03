/**
 * Composable de Permisos
 * Maneja la verificación de permisos del usuario
 */

import { ref, computed, readonly } from 'vue'
import { authService } from '../services/authService'

// Estado global reactivo
const permissions = ref([])
const userRole = ref(null)

// Inicializar desde sessionStorage (usuario y permisos se almacenan ahí para uso en frontend)
const initializePermissions = () => {
  permissions.value = authService.getPermissions()
  const user = authService.getCurrentUser()
  userRole.value = user?.role || null
}

// Ejecutar al cargar
initializePermissions()

export function usePermissions() {
  /**
   * Verificar si es Super Admin (tiene todos los permisos)
   */
  const isSuperAdmin = computed(() => {
    return userRole.value?.isSuperAdmin === true
  })

  /**
   * Obtener el nombre del rol
   */
  const roleName = computed(() => {
    return userRole.value?.name || 'Sin rol'
  })

  /**
   * Verificar si tiene UN permiso específico
   * @param {string} permission - Permiso a verificar (ej: "users:read")
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    // Super Admin tiene todos los permisos
    if (isSuperAdmin.value) return true
    return permissions.value.includes(permission)
  }

  /**
   * Verificar si tiene TODOS los permisos especificados
   * @param {string[]} requiredPermissions - Array de permisos requeridos
   * @returns {boolean}
   */
  const hasAllPermissions = (requiredPermissions) => {
    if (isSuperAdmin.value) return true
    return requiredPermissions.every(p => permissions.value.includes(p))
  }

  /**
   * Verificar si tiene AL MENOS UNO de los permisos especificados
   * @param {string[]} requiredPermissions - Array de permisos
   * @returns {boolean}
   */
  const hasAnyPermission = (requiredPermissions) => {
    if (isSuperAdmin.value) return true
    return requiredPermissions.some(p => permissions.value.includes(p))
  }

  /**
   * Verificar permiso por módulo y acción
   * @param {string} module - Módulo (ej: "users", "sales")
   * @param {string} action - Acción (ej: "read", "create", "update", "delete")
   * @returns {boolean}
   */
  const can = (module, action) => {
    return hasPermission(`${module}:${action}`)
  }

  /**
   * Verificadores rápidos por acción
   */
  const canRead = (module) => can(module, 'read')
  const canCreate = (module) => can(module, 'create')
  const canUpdate = (module) => can(module, 'update')
  const canDelete = (module) => can(module, 'delete')

  /**
   * Actualizar permisos (llamar después del login)
   */
  const refreshPermissions = () => {
    permissions.value = authService.getPermissions()
    const user = authService.getCurrentUser()
    userRole.value = user?.role || null
  }

  /**
   * Limpiar permisos (llamar en logout)
   */
  const clearPermissions = () => {
    permissions.value = []
    userRole.value = null
  }

  return {
    // Estado
    permissions: readonly(permissions),
    userRole: readonly(userRole),
    isSuperAdmin,
    roleName,

    // Verificadores
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    can,
    canRead,
    canCreate,
    canUpdate,
    canDelete,

    // Acciones
    refreshPermissions,
    clearPermissions,
  }
}

export default usePermissions

