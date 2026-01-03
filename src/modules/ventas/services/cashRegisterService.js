/**
 * Servicio de Control de Efectivo
 * Maneja las operaciones relacionadas con la caja registradora
 */

import api from '@/services/api'

export const cashRegisterService = {
  /**
   * Obtener el estado de la caja registradora
   * @returns {Promise<Object>} Estado de la caja { isOpen: boolean }
   */
  async getStatus() {
    const response = await api.get('/cash-register/status')
    return response.status || { isOpen: false }
  },

  /**
   * Obtener lista de cajas registradoras
   * @returns {Promise<Array>} Lista de cajas
   */
  async getCashRegisters() {
    const response = await api.get('/cash-register')
    return response.cashRegisters || []
  },

  /**
   * Obtener detalles de una caja registradora por ID
   * @param {string} id - ID de la caja
   * @returns {Promise<Object>} Detalles de la caja con pagos
   */
  async getCashRegisterById(id) {
    const response = await api.get(`/cash-register/${id}`)
    return response
  },

  /**
   * Abrir la caja registradora
   * @param {Object} data - Datos para abrir la caja
   * @param {number} data.initial_balance - Balance inicial
   * @param {string} data.opened_by - ID del usuario que abre la caja
   * @param {string} data.opening_notes - Notas de apertura
   * @returns {Promise<Object>} Respuesta de la apertura
   */
  async openCashRegister(data) {
    const response = await api.post('/cash-register/open', data)
    return response
  },
}

export default cashRegisterService

