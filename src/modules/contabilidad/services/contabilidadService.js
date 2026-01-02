/**
 * Servicio de Contabilidad
 * Maneja las operaciones relacionadas con contabilidad
 */

import api from '@/services/api'

export const contabilidadService = {
  /**
   * Obtener líneas de venta
   * @returns {Promise<Array>} Lista de líneas de venta
   */
  async getSalesLines() {
    const response = await api.get('/sales/lines')
    return response.sales_lines || []
  },

  /**
   * Contabilizar una línea de venta
   * @param {string} saleId - ID de la venta
   * @param {number} index - Índice de la línea en la venta
   * @param {Object} accountsData - Datos de contabilidad
   * @param {number} accountsData.accounts.profit - Ganancia
   * @param {number} accountsData.accounts.rent - Renta
   * @param {number} accountsData.accounts.investment - Inversión
   * @param {Object} [accountsData.accounts.startup] - Datos de startup (opcional)
   * @param {string} accountsData.accounts.startup.id - ID del startup
   * @param {number} accountsData.accounts.startup.amount - Monto del startup
   * @returns {Promise<Object>} Respuesta de la contabilización
   */
  async accountSalesLine(saleId, index, accountsData) {
    const response = await api.post(`/sales/${saleId}/${index}`, accountsData)
    return response
  },

  /**
   * Obtener lista de cuentas
   * @returns {Promise<Array>} Lista de cuentas
   */
  async getAccounts() {
    const response = await api.get('/accounts')
    return response.accounts || []
  },
}

export default contabilidadService

