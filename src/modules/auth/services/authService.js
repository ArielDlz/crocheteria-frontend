/**
 * Servicio de Autenticación
 * Maneja login, logout, tokens y permisos
 * 
 * Nota: Con httpOnly cookies, el token se maneja automáticamente por el navegador
 * Solo almacenamos usuario y permisos en sessionStorage para uso en el frontend
 */

import api from '@/services/api'

const USER_KEY = 'auth_user'
const PERMISSIONS_KEY = 'auth_permissions'

// Usar sessionStorage solo para datos del usuario (no para el token)
const storage = sessionStorage

export const authService = {
  /**
   * Iniciar sesión
   * @param {string} email - Correo electrónico
   * @param {string} password - Contraseña
   * 
   * Nota: El token se guarda automáticamente como httpOnly cookie por el backend
   * Solo almacenamos usuario y permisos en sessionStorage para uso en el frontend
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    
    // El token se guarda automáticamente como httpOnly cookie por el backend
    // No necesitamos almacenarlo manualmente
    
    // Guardar usuario (incluye rol) en sessionStorage para uso en el frontend
    if (response.user) {
      storage.setItem(USER_KEY, JSON.stringify(response.user))
    }
    
    // Guardar permisos en sessionStorage para uso en el frontend
    if (response.permissions) {
      storage.setItem(PERMISSIONS_KEY, JSON.stringify(response.permissions))
    }
    
    return response
  },

  /**
   * Cerrar sesión
   * Llama al endpoint del backend para limpiar la cookie httpOnly
   */
  async logout() {
    try {
      // Llamar al endpoint de logout del backend para limpiar la cookie httpOnly
      await api.post('/auth/logout')
    } catch (error) {
      // Si falla, continuar limpiando el frontend
      console.error('Error al cerrar sesión en el backend:', error)
    } finally {
      // Limpiar datos del usuario en sessionStorage
      storage.removeItem(USER_KEY)
      storage.removeItem(PERMISSIONS_KEY)
    }
  },

  /**
   * Verificar si el usuario está autenticado
   * Con httpOnly cookies, verificamos con el backend
   */
  async isAuthenticated() {
    try {
      // Verificar con el backend si hay una sesión válida
      await api.get('/auth/verify')
      return true
    } catch (error) {
      return false
    }
  },

  /**
   * Obtener el usuario actual
   */
  getCurrentUser() {
    const user = storage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
  },

  /**
   * Obtener los permisos del usuario
   */
  getPermissions() {
    const permissions = storage.getItem(PERMISSIONS_KEY)
    return permissions ? JSON.parse(permissions) : []
  },

  /**
   * Verificar si el usuario es Super Admin
   */
  isSuperAdmin() {
    const user = this.getCurrentUser()
    return user?.role?.isSuperAdmin === true
  },

  /**
   * Verificar sesión con el backend
   * Retorna el usuario y permisos si la sesión es válida
   */
  async verifyToken() {
    try {
      const response = await api.get('/auth/verify')
      
      // Actualizar usuario y permisos si el backend los retorna
      if (response.user) {
        storage.setItem(USER_KEY, JSON.stringify(response.user))
      }
      if (response.permissions) {
        storage.setItem(PERMISSIONS_KEY, JSON.stringify(response.permissions))
      }
      
      return response
    } catch (error) {
      // Si la sesión es inválida, limpiar storage
      storage.removeItem(USER_KEY)
      storage.removeItem(PERMISSIONS_KEY)
      throw error
    }
  },
}

export default authService
