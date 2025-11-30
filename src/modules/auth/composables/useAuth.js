/**
 * Composable de Autenticación
 * Maneja el estado reactivo de la sesión del usuario
 */

import { ref, computed, readonly } from 'vue'
import { authService } from '../services/authService'
import { usePermissions } from './usePermissions'

// Estado global reactivo (fuera del composable para compartir entre componentes)
const user = ref(null)
const token = ref(null)
const permissions = ref([])
const isLoading = ref(true)

// Inicializar estado desde localStorage
const initializeAuth = () => {
  token.value = authService.getToken()
  user.value = authService.getCurrentUser()
  permissions.value = authService.getPermissions()
  isLoading.value = false
}

// Ejecutar al cargar el módulo
initializeAuth()

export function useAuth() {
  const { refreshPermissions, clearPermissions } = usePermissions()

  // Computed para verificar si está autenticado
  const isAuthenticated = computed(() => !!token.value)

  // Computed para verificar si es super admin
  const isSuperAdmin = computed(() => user.value?.role?.isSuperAdmin === true)

  // Nombre del rol
  const roleName = computed(() => user.value?.role?.name || 'Sin rol')

  /**
   * Iniciar sesión
   */
  const login = async (email, password) => {
    const response = await authService.login(email, password)
    
    // Actualizar estado reactivo
    token.value = response.access_token || response.token || authService.getToken()
    user.value = response.user || authService.getCurrentUser()
    permissions.value = response.permissions || authService.getPermissions()
    
    // Actualizar el composable de permisos
    refreshPermissions()
    
    return response
  }

  /**
   * Cerrar sesión
   */
  const logout = () => {
    authService.logout()
    
    // Limpiar estado reactivo
    token.value = null
    user.value = null
    permissions.value = []
    
    // Limpiar permisos del composable
    clearPermissions()
  }

  /**
   * Verificar y refrescar sesión (útil al cargar la app)
   */
  const checkAuth = async () => {
    if (!token.value) {
      isLoading.value = false
      return false
    }

    try {
      // Opcional: verificar token con el backend
      // await authService.verifyToken()
      isLoading.value = false
      return true
    } catch (error) {
      // Token inválido, limpiar sesión
      logout()
      isLoading.value = false
      return false
    }
  }

  return {
    // Estado (readonly para evitar modificaciones directas)
    user: readonly(user),
    token: readonly(token),
    permissions: readonly(permissions),
    isLoading: readonly(isLoading),
    isAuthenticated,
    isSuperAdmin,
    roleName,

    // Acciones
    login,
    logout,
    checkAuth,
  }
}

export default useAuth
