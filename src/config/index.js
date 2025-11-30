/**
 * Configuración global de la aplicación
 * Lee las variables de entorno de Vite
 */

export const config = {
  // URL base del API backend
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  
  // Nombre de la aplicación
  appName: import.meta.env.VITE_APP_NAME || 'Crochetería',
  
  // Modo de desarrollo
  isDev: import.meta.env.DEV,
  
  // Modo de producción
  isProd: import.meta.env.PROD,
}

export default config

