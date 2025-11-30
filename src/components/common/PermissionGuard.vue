<script setup>
/**
 * Componente PermissionGuard
 * Renderiza contenido condicionalmente basado en permisos
 * 
 * Props:
 * - permission: string | string[] - Permiso(s) requerido(s)
 * - any: boolean - Si true, requiere al menos uno de los permisos
 * - fallback: boolean - Si true, muestra el slot "fallback" cuando no tiene permiso
 * 
 * Uso:
 * <PermissionGuard permission="users:create">
 *   <button>Crear Usuario</button>
 * </PermissionGuard>
 * 
 * <PermissionGuard :permission="['users:read', 'sales:read']" any>
 *   <p>Tienes acceso a usuarios o ventas</p>
 * </PermissionGuard>
 * 
 * <PermissionGuard permission="admin:access" fallback>
 *   <AdminPanel />
 *   <template #fallback>
 *     <p>No tienes acceso a esta sección</p>
 *   </template>
 * </PermissionGuard>
 */

import { computed } from 'vue'
import { usePermissions } from '@/modules/auth/composables/usePermissions'

const props = defineProps({
  permission: {
    type: [String, Array],
    required: true
  },
  any: {
    type: Boolean,
    default: false
  },
  fallback: {
    type: Boolean,
    default: false
  }
})

const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions()

const hasAccess = computed(() => {
  if (typeof props.permission === 'string') {
    return hasPermission(props.permission)
  }
  
  if (Array.isArray(props.permission)) {
    return props.any 
      ? hasAnyPermission(props.permission)
      : hasAllPermissions(props.permission)
  }
  
  return false
})
</script>

<template>
  <template v-if="hasAccess">
    <slot />
  </template>
  <template v-else-if="fallback">
    <slot name="fallback" />
  </template>
</template>

