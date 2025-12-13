/**
 * Servicio de Compras
 * Maneja las operaciones CRUD de compras de productos
 */

import api from '@/services/api'

export const purchasesService = {
  /**
   * Obtener lista de compras
   * @returns {Promise<Array>} Lista de compras
   */
  async getPurchases() {
    const response = await api.get('/purchases?startup=false')
    return response.purchases || []
  },

  /**
   * Obtener una compra por ID
   * @param {string} id - ID de la compra
   * @returns {Promise<Object>} Compra
   */
  async getPurchaseById(id) {
    const response = await api.get(`/purchases/${id}`)
    return response.purchase || response
  },

  /**
   * Crear una nueva compra
   * @param {Object} purchaseData - Datos de la compra
   * @returns {Promise<Object>} Compra creada
   */
  async createPurchase(purchaseData) {
    const response = await api.post('/purchases', purchaseData)
    return response
  },

  /**
   * Actualizar una compra
   * @param {string} id - ID de la compra
   * @param {Object} purchaseData - Datos a actualizar
   * @returns {Promise<Object>} Compra actualizada
   */
  async updatePurchase(id, purchaseData) {
    const response = await api.patch(`/purchases/${id}`, purchaseData)
    return response
  },

  /**
   * Eliminar una compra permanentemente
   * @param {string} id - ID de la compra
   * @returns {Promise<Object>} Respuesta
   */
  async deletePurchase(id) {
    const response = await api.delete(`/purchases/${id}/permanent`)
    return response
  },
}

export default purchasesService

