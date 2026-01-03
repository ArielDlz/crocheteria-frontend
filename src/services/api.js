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
   * Nota: Con httpOnly cookies, el token se envía automáticamente por el navegador
   * No es necesario agregar el header Authorization manualmente
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
    }
  }

  /**
   * Maneja la respuesta del servidor
   */
  async handleResponse(response) {
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      // Si es un error 401 (No autorizado), redirigir al login
      // La cookie httpOnly se maneja automáticamente por el navegador
      if (response.status === 401) {
        // Limpiar datos del usuario en sessionStorage (si existen)
        sessionStorage.removeItem('auth_user')
        sessionStorage.removeItem('auth_permissions')
        
        // Redirigir al login si no estamos ya ahí
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }

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
   * credentials: 'include' es necesario para enviar cookies httpOnly
   */
  async get(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include', // Incluir cookies httpOnly
    })
    return this.handleResponse(response)
  }

  /**
   * Petición POST
   * credentials: 'include' es necesario para enviar cookies httpOnly
   */
  async post(endpoint, body) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      credentials: 'include', // Incluir cookies httpOnly
    })
    return this.handleResponse(response)
  }

  /**
   * Petición PUT
   * credentials: 'include' es necesario para enviar cookies httpOnly
   */
  async put(endpoint, body) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      credentials: 'include', // Incluir cookies httpOnly
    })
    return this.handleResponse(response)
  }

  /**
   * Petición PATCH
   * credentials: 'include' es necesario para enviar cookies httpOnly
   */
  async patch(endpoint, body) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      credentials: 'include', // Incluir cookies httpOnly
    })
    return this.handleResponse(response)
  }

  /**
   * Petición DELETE
   * credentials: 'include' es necesario para enviar cookies httpOnly
   */
  async delete(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include', // Incluir cookies httpOnly
    })
    return this.handleResponse(response)
  }
}

// Exportar instancia única (Singleton)
export const api = new ApiService()
export default api

