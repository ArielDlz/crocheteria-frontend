/**
 * Configuración global de la aplicación
 * Lee las variables de entorno de Vite
 * 
 * Variables de entorno requeridas:
 * - VITE_API_BASE_URL: URL base del API backend
 *   Desarrollo: http://localhost:3000/api
 *   Producción: https://api.crocheteria.mx/api
 * 
 * - VITE_APP_NAME: Nombre de la aplicación (opcional)
 */

// Detectar el entorno automáticamente
const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD

// URL base del API - usar variable de entorno o valor por defecto según el entorno
const getApiBaseUrl = () => {
  // Si hay una variable de entorno definida, usarla
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // Valores por defecto según el entorno
  if (isDevelopment) {
    return 'http://localhost:3000/api'
  }
  
  // En producción, usar el dominio de producción
  return 'https://api.crocheteria.mx/api'
}

export const config = {
  // URL base del API backend
  apiBaseUrl: getApiBaseUrl(),
  
  // Nombre de la aplicación
  appName: import.meta.env.VITE_APP_NAME || 'Crochetería',
  
  // Modo de desarrollo
  isDev: isDevelopment,
  
  // Modo de producción
  isProd: isProduction,
  
  // URL del backend (sin /api) para referencia
  backendUrl: getApiBaseUrl().replace('/api', ''),
}

export default config

