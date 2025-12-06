/**
 * Servicio de Usuarios
 * Maneja las operaciones CRUD de usuarios
 */

import api from '@/services/api'

export const usersService = {
  /**
   * Obtener lista de usuarios
   * @returns {Promise<Array>} Lista de usuarios
   */
  async getUsers() {
    const response = await api.get('/users')
    return response.users || []
  },

  /**
   * Obtener un usuario por ID
   * @param {string} id - ID del usuario
   * @returns {Promise<Object>} Usuario
   */
  async getUserById(id) {
    const response = await api.get(`/users/${id}`)
    // El backend puede devolver { user: {...} } o directamente el usuario
    const user = response.user || response
    return user
  },

  /**
   * Crear un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado
   */
  async createUser(userData) {
    const response = await api.post('/users', userData)
    return response
  },

  /**
   * Actualizar un usuario
   * @param {string} id - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  async updateUser(id, userData) {
    const response = await api.patch(`/users/${id}`, userData)
    return response
  },

  /**
   * Eliminar un usuario
   * @param {string} id - ID del usuario
   * @returns {Promise<Object>} Respuesta
   */
  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`)
    return response
  },
}

export default usersService

