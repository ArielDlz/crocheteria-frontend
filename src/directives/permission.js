/**
 * Directiva v-permission
 * Muestra/oculta elementos basados en permisos
 * 
 * Uso:
 * v-permission="'users:read'"           - Requiere permiso específico
 * v-permission="['users:read', 'users:create']"  - Requiere TODOS los permisos
 * v-permission:any="['users:read', 'sales:read']" - Requiere AL MENOS UNO
 */

import { usePermissions } from '@/modules/auth/composables/usePermissions'

export const vPermission = {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  updated(el, binding) {
    checkPermission(el, binding)
  }
}

function checkPermission(el, binding) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions()
  
  const { value, arg } = binding
  let hasAccess = false

  if (!value) {
    hasAccess = true
  } else if (typeof value === 'string') {
    // Un solo permiso
    hasAccess = hasPermission(value)
  } else if (Array.isArray(value)) {
    if (arg === 'any') {
      // Requiere al menos uno
      hasAccess = hasAnyPermission(value)
    } else {
      // Requiere todos (por defecto)
      hasAccess = hasAllPermissions(value)
    }
  }

  if (!hasAccess) {
    // Ocultar el elemento
    el.style.display = 'none'
  } else {
    // Mostrar el elemento (restaurar display original)
    el.style.display = ''
  }
}

export default vPermission

