/**
 * Servicio base para llamadas al API
 * Centraliza la configuración de fetch y manejo de errores
 */

import { config } from '@/config'

class ApiService {
  constructor() {
    this.baseUrl = config.apiBaseUrl
  }

  /**
   * Obtiene los headers por defecto para las peticiones
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    }

    // Agregar token de autenticación si existe
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Maneja la respuesta del servidor
   */
  async handleResponse(response) {
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const error = {
        status: response.status,
        message: data?.message || 'Error en la petición',
        data: data,
      }
      throw error
    }

    return data
  }

  /**
   * Petición GET
   */
  async get(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  /**
   * Petición POST
   */
  async post(endpoint, body) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    return this.handleResponse(response)
  }

  /**
   * Petición PUT
   */
  async put(endpoint, body) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    return this.handleResponse(response)
  }

  /**
   * Petición PATCH
   */
  async patch(endpoint, body) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    return this.handleResponse(response)
  }

  /**
   * Petición DELETE
   */
  async delete(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }
}

// Exportar instancia única (Singleton)
export const api = new ApiService()
export default api

