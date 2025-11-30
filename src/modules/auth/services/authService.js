/**
 * Servicio de Autenticación
 * Maneja login, logout, tokens y permisos
 */

import api from '@/services/api'

const AUTH_TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'
const PERMISSIONS_KEY = 'auth_permissions'

export const authService = {
  /**
   * Iniciar sesión
   * @param {string} email - Correo electrónico
   * @param {string} password - Contraseña
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password })
    
    // Guardar token (soporta tanto "token" como "access_token")
    const token = response.access_token || response.token
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token)
    }
    
    // Guardar usuario (incluye rol)
    if (response.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(response.user))
    }
    
    // Guardar permisos
    if (response.permissions) {
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(response.permissions))
    }
    
    return response
  },

  /**
   * Cerrar sesión
   */
  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(PERMISSIONS_KEY)
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated() {
    return !!localStorage.getItem(AUTH_TOKEN_KEY)
  },

  /**
   * Obtener el token actual
   */
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  },

  /**
   * Obtener el usuario actual
   */
  getCurrentUser() {
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
  },

  /**
   * Obtener los permisos del usuario
   */
  getPermissions() {
    const permissions = localStorage.getItem(PERMISSIONS_KEY)
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
   * Verificar token con el backend (opcional)
   */
  async verifyToken() {
    try {
      const response = await api.get('/auth/verify')
      return response
    } catch (error) {
      // Si el token es inválido, limpiar storage
      this.logout()
      throw error
    }
  },
}

export default authService
