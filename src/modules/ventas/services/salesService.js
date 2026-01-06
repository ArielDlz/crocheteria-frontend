/**
 * Servicio de Ventas
 * Maneja las operaciones relacionadas con ventas
 */

import api from '@/services/api'

export const salesService = {
  /**
   * Crear una nueva venta
   * @param {Object} saleData - Datos de la venta
   * @returns {Promise<Object>} Venta creada
   */
  async createSale(saleData) {
    const response = await api.post('/sales', saleData)
    return response
  },

  /**
   * Obtener lista de ventas
   * @returns {Promise<Array>} Lista de ventas
   */
  async getSales() {
    const response = await api.get('/sales')
    return response.sales || []
  },

  /**
   * Obtener una venta por ID
   * @param {string} id - ID de la venta
   * @returns {Promise<Object>} Venta
   */
  async getSaleById(id) {
    const response = await api.get(`/sales/${id}`)
    return response.sale || response
  },

  /**
   * Obtener el balance de ventas del mes actual
   * @returns {Promise<Object>} Objeto con month y month_sales
   */
  async getMonthBalance() {
    const response = await api.get('/sales/month-balance')
    return response
  },
}

export default salesService

