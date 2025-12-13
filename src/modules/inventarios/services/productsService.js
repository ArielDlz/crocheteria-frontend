/**
 * Servicio de Productos
 * Maneja las operaciones CRUD de productos
 */

import api from '@/services/api'

export const productsService = {
  /**
   * Obtener lista de productos
   * @returns {Promise<Array>} Lista de productos
   */
  async getProducts() {
    const response = await api.get('/products')
    return response.products || []
  },

  /**
   * Obtener un producto por ID
   * @param {string} id - ID del producto
   * @returns {Promise<Object>} Producto
   */
  async getProductById(id) {
    const response = await api.get(`/products/${id}`)
    return response.product || response
  },

  /**
   * Crear un nuevo producto
   * @param {Object} productData - Datos del producto
   * @returns {Promise<Object>} Producto creado
   */
  async createProduct(productData) {
    const response = await api.post('/products', productData)
    return response
  },

  /**
   * Actualizar un producto
   * @param {string} id - ID del producto
   * @param {Object} productData - Datos a actualizar
   * @returns {Promise<Object>} Producto actualizado
   */
  async updateProduct(id, productData) {
    const response = await api.patch(`/products/${id}`, productData)
    return response
  },

  /**
   * Eliminar un producto
   * @param {string} id - ID del producto
   * @returns {Promise<Object>} Respuesta
   */
  async deleteProduct(id) {
    const response = await api.delete(`/products/${id}`)
    return response
  },
}

export default productsService

