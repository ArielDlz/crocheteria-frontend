/**
 * Servicio de Surtido de Emprendimientos
 * Usa los mismos endpoints de /purchases pero con el parámetro startup=true
 */

import api from '@/services/api'

export const startupSupplyService = {
  /**
   * Obtener lista de surtidos de emprendimientos
   * @returns {Promise<Array>} Lista de surtidos (compras con startup=true)
   */
  async getSupplies() {
    const response = await api.get('/purchases?startup=true')
    return response.purchases || []
  },

  /**
   * Obtener un surtido por ID
   * @param {string} id - ID del surtido
   * @returns {Promise<Object>} Surtido
   */
  async getSupplyById(id) {
    const response = await api.get(`/purchases/${id}`)
    return response.purchase || response
  },

  /**
   * Crear un nuevo surtido de emprendimiento
   * @param {Object} supplyData - Datos del surtido
   * @returns {Promise<Object>} Surtido creado
   */
  async createSupply(supplyData) {
    // Asegurar que se envía startup: true
    const data = { ...supplyData, startup: true }
    const response = await api.post('/purchases', data)
    return response
  },

  /**
   * Actualizar un surtido
   * @param {string} id - ID del surtido
   * @param {Object} supplyData - Datos a actualizar
   * @returns {Promise<Object>} Surtido actualizado
   */
  async updateSupply(id, supplyData) {
    const response = await api.patch(`/purchases/${id}`, supplyData)
    return response
  },

  /**
   * Eliminar un surtido permanentemente
   * @param {string} id - ID del surtido
   * @returns {Promise<Object>} Respuesta
   */
  async deleteSupply(id) {
    const response = await api.delete(`/purchases/${id}/permanent`)
    return response
  },
}

export default startupSupplyService

