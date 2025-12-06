/**
 * Servicio de Permisos
 * Maneja las operaciones CRUD de permisos
 */

import api from '@/services/api'

export const permissionsService = {
  /**
   * Obtener lista de permisos
   * @returns {Promise<Array>} Lista de permisos
   */
  async getPermissions() {
    const response = await api.get('/permissions')
    return response.permissions || []
  },

  /**
   * Obtener permisos agrupados por módulo
   * @returns {Promise<Object>} Permisos agrupados por módulo
   */
  async getGroupedPermissions() {
    try {
      // Intentar obtener desde endpoint agrupado
      const response = await api.get('/permissions/grouped')
      if (response && response.permissions && Object.keys(response.permissions).length > 0) {
        return response.permissions
      }
    } catch (error) {
      // Si no existe el endpoint o falla, agrupar localmente
      console.log('Endpoint /permissions/grouped no disponible, agrupando localmente')
    }
    
    // Agrupar permisos localmente
    const permissions = await this.getPermissions()
    
    if (!permissions || permissions.length === 0) {
      console.warn('No se encontraron permisos para agrupar')
      return {}
    }
    
    const grouped = {}
    
    permissions.forEach(permission => {
      if (!permission || !permission.module) {
        console.warn('Permiso sin módulo:', permission)
        return
      }
      
      const module = permission.module
      if (!grouped[module]) {
        grouped[module] = []
      }
      grouped[module].push(permission)
    })
    
    // Ordenar permisos dentro de cada módulo por código
    Object.keys(grouped).forEach(module => {
      grouped[module].sort((a, b) => {
        if (!a.code || !b.code) return 0
        return a.code.localeCompare(b.code)
      })
    })
    
    console.log('Permisos agrupados:', grouped)
    return grouped
  },

  /**
   * Obtener un permiso por ID
   * @param {string} id - ID del permiso
   * @returns {Promise<Object>} Permiso
   */
  async getPermissionById(id) {
    const response = await api.get(`/permissions/${id}`)
    return response.permission || response
  },

  /**
   * Crear un nuevo permiso
   * @param {Object} permissionData - Datos del permiso
   * @returns {Promise<Object>} Permiso creado
   */
  async createPermission(permissionData) {
    const response = await api.post('/permissions', permissionData)
    return response
  },

  /**
   * Actualizar un permiso
   * @param {string} id - ID del permiso
   * @param {Object} permissionData - Datos a actualizar
   * @returns {Promise<Object>} Permiso actualizado
   */
  async updatePermission(id, permissionData) {
    const response = await api.patch(`/permissions/${id}`, permissionData)
    return response
  },

  /**
   * Eliminar un permiso
   * @param {string} id - ID del permiso
   * @returns {Promise<Object>} Respuesta
   */
  async deletePermission(id) {
    const response = await api.delete(`/permissions/${id}`)
    return response
  },
}

export default permissionsService

