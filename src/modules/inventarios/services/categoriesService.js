/**
 * Servicio de Categorías de Productos
 * Maneja las operaciones CRUD de categorías
 */

import api from '@/services/api'

export const categoriesService = {
  /**
   * Obtener lista de categorías
   * @returns {Promise<Array>} Lista de categorías
   */
  async getCategories() {
    const response = await api.get('/product-categories')
    return response.categories || []
  },

  /**
   * Obtener una categoría por ID
   * @param {string} id - ID de la categoría
   * @returns {Promise<Object>} Categoría
   */
  async getCategoryById(id) {
    const response = await api.get(`/product-categories/${id}`)
    return response.category || response
  },

  /**
   * Crear una nueva categoría
   * @param {Object} categoryData - Datos de la categoría
   * @returns {Promise<Object>} Categoría creada
   */
  async createCategory(categoryData) {
    const response = await api.post('/product-categories', categoryData)
    return response
  },

  /**
   * Actualizar una categoría
   * @param {string} id - ID de la categoría
   * @param {Object} categoryData - Datos a actualizar
   * @returns {Promise<Object>} Categoría actualizada
   */
  async updateCategory(id, categoryData) {
    const response = await api.patch(`/product-categories/${id}`, categoryData)
    return response
  },

  /**
   * Eliminar una categoría
   * @param {string} id - ID de la categoría
   * @returns {Promise<Object>} Respuesta
   */
  async deleteCategory(id) {
    const response = await api.delete(`/product-categories/${id}`)
    return response
  },
}

export default categoriesService

