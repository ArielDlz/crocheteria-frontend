/**
 * Servicio de Roles
 * Maneja las operaciones CRUD de roles
 */

import api from '@/services/api'

export const rolesService = {
  /**
   * Obtener lista de roles
   * @returns {Promise<Array>} Lista de roles
   */
  async getRoles() {
    const response = await api.get('/roles')
    return response.roles || []
  },

  /**
   * Obtener un rol por ID
   * @param {string} id - ID del rol
   * @returns {Promise<Object>} Rol
   */
  async getRoleById(id) {
    const response = await api.get(`/roles/${id}`)
    return response.role || response
  },

  /**
   * Crear un nuevo rol
   * @param {Object} roleData - Datos del rol
   * @returns {Promise<Object>} Rol creado
   */
  async createRole(roleData) {
    const response = await api.post('/roles', roleData)
    return response
  },

  /**
   * Actualizar un rol
   * @param {string} id - ID del rol
   * @param {Object} roleData - Datos a actualizar
   * @returns {Promise<Object>} Rol actualizado
   */
  async updateRole(id, roleData) {
    const response = await api.patch(`/roles/${id}`, roleData)
    return response
  },

  /**
   * Eliminar un rol
   * @param {string} id - ID del rol
   * @returns {Promise<Object>} Respuesta
   */
  async deleteRole(id) {
    const response = await api.delete(`/roles/${id}`)
    return response
  },
}

export default rolesService

