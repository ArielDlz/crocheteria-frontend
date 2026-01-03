/**
 * Composable de Autenticación
 * Maneja el estado reactivo de la sesión del usuario
 * 
 * Nota: Con httpOnly cookies, el token se maneja automáticamente por el navegador
 * Verificamos la autenticación con el backend en lugar de leer del storage
 */

import { ref, computed, readonly } from 'vue'
import { authService } from '../services/authService'
import { usePermissions } from './usePermissions'

// Estado global reactivo (fuera del composable para compartir entre componentes)
const user = ref(null)
const permissions = ref([])
const isLoading = ref(true)
const isAuthenticatedState = ref(false)

// Inicializar estado verificando con el backend
const initializeAuth = async () => {
  try {
    // Verificar sesión con el backend
    const response = await authService.verifyToken()
    
    // Si hay respuesta, el usuario está autenticado
    if (response) {
      isAuthenticatedState.value = true
      user.value = authService.getCurrentUser()
      permissions.value = authService.getPermissions()
    } else {
      isAuthenticatedState.value = false
    }
  } catch (error) {
    // Si falla la verificación, el usuario no está autenticado
    isAuthenticatedState.value = false
    user.value = null
    permissions.value = []
  } finally {
    isLoading.value = false
  }
}

// Ejecutar al cargar el módulo
initializeAuth()

export function useAuth() {
  const { refreshPermissions, clearPermissions } = usePermissions()

  // Computed para verificar si está autenticado
  const isAuthenticated = computed(() => isAuthenticatedState.value)

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
    // El token se maneja automáticamente por la cookie httpOnly
    isAuthenticatedState.value = true
    user.value = response.user || authService.getCurrentUser()
    permissions.value = response.permissions || authService.getPermissions()
    
    // Actualizar el composable de permisos
    refreshPermissions()
    
    return response
  }

  /**
   * Cerrar sesión
   */
  const logout = async () => {
    await authService.logout()
    
    // Limpiar estado reactivo
    isAuthenticatedState.value = false
    user.value = null
    permissions.value = []
    
    // Limpiar permisos del composable
    clearPermissions()
  }

  /**
   * Verificar y refrescar sesión (útil al cargar la app)
   */
  const checkAuth = async () => {
    isLoading.value = true
    
    try {
      // Verificar sesión con el backend
      const response = await authService.verifyToken()
      
      if (response) {
        isAuthenticatedState.value = true
        user.value = authService.getCurrentUser()
        permissions.value = authService.getPermissions()
        refreshPermissions()
        isLoading.value = false
        return true
      } else {
        isAuthenticatedState.value = false
        user.value = null
        permissions.value = []
        isLoading.value = false
        return false
      }
    } catch (error) {
      // Sesión inválida, limpiar estado
      isAuthenticatedState.value = false
      user.value = null
      permissions.value = []
      clearPermissions()
      isLoading.value = false
      return false
    }
  }

  return {
    // Estado (readonly para evitar modificaciones directas)
    user: readonly(user),
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
