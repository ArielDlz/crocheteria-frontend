# 🔧 Configuración de Variables de Entorno

Esta guía explica cómo configurar las variables de entorno para el proyecto Crochetería Frontend.

## 📋 Variables Disponibles

| Variable | Descripción | Valor por Defecto | Requerida |
|----------|-------------|-------------------|-----------|
| `VITE_API_BASE_URL` | URL base del API backend | `http://localhost:3000/api` (dev) | ✅ Sí |
| `VITE_APP_NAME` | Nombre de la aplicación | `Crochetería` | ❌ No |

## 🏠 Desarrollo Local

### 1. Crear archivo `.env.local`

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Desarrollo local
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Crochetería
```

### 2. Verificar que funciona

```bash
npm run dev
```

La aplicación debería conectarse a `http://localhost:3000/api`

## 🚀 Producción en Vercel

### Configuración en Vercel Dashboard

1. Ve a tu proyecto en [Vercel](https://vercel.com)
2. Navega a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

#### Para Production:
```
VITE_API_BASE_URL = https://api.crocheteria.mx/api
VITE_APP_NAME = Crochetería
```

#### Para Preview (opcional, puede usar las mismas):
```
VITE_API_BASE_URL = https://api.crocheteria.mx/api
VITE_APP_NAME = Crochetería
```

### Configuración mediante CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Agregar variable de entorno
vercel env add VITE_API_BASE_URL production
# Cuando pregunte, ingresa: https://api.crocheteria.mx/api

vercel env add VITE_APP_NAME production
# Cuando pregunte, ingresa: Crochetería
```

## 🌐 Configuración de Dominios

### Estructura de Dominios

- **Frontend (Vercel):** `https://crocheteria.mx`
- **Backend (Railway):** `https://api.crocheteria.mx`

### Configuración del Backend (Railway)

Asegúrate de que tu backend esté configurado para:

1. **CORS:**
   ```javascript
   // Permitir requests desde el frontend
   origin: ['https://crocheteria.mx', 'http://localhost:5173']
   credentials: true
   ```

2. **Cookies httpOnly:**
   ```javascript
   // Configuración de cookies
   httpOnly: true
   secure: true // Solo en producción (HTTPS)
   sameSite: 'none' // Si los dominios son diferentes
   // O 'lax' si están en el mismo dominio base
   ```

3. **Variables de entorno en Railway:**
   - `FRONTEND_URL=https://crocheteria.mx`
   - `NODE_ENV=production`

## 🔍 Verificar Configuración

### En Desarrollo

Abre la consola del navegador y ejecuta:
```javascript
console.log(import.meta.env.VITE_API_BASE_URL)
```

Debería mostrar: `http://localhost:3000/api`

### En Producción

Después del despliegue, verifica en la consola del navegador que la URL sea:
```
https://api.crocheteria.mx/api
```

## ⚠️ Notas Importantes

1. **Variables `VITE_`**: Solo las variables que empiezan con `VITE_` son expuestas al cliente. No uses secretos aquí.

2. **Reconstrucción**: Después de cambiar variables de entorno en Vercel, necesitas hacer un nuevo deploy.

3. **Cookies httpOnly**: Con dominios diferentes (`crocheteria.mx` y `api.crocheteria.mx`), asegúrate de:
   - Usar `SameSite=None` y `Secure=true`
   - Configurar CORS correctamente en el backend

4. **HTTPS**: En producción, siempre usa HTTPS. Las cookies `Secure` solo funcionan sobre HTTPS.

## 🐛 Troubleshooting

### La app no se conecta al backend

1. Verifica que `VITE_API_BASE_URL` esté configurada correctamente
2. Revisa la consola del navegador para errores de CORS
3. Verifica que el backend esté corriendo y accesible

### Las cookies no se envían

1. Verifica que `credentials: 'include'` esté en todas las peticiones (ya está configurado)
2. Revisa la configuración de CORS en el backend
3. Verifica que las cookies tengan `SameSite` y `Secure` configurados correctamente

### Error 401 después del login

1. Verifica que el backend esté configurado para enviar cookies httpOnly
2. Revisa que el dominio del backend esté correcto
3. Verifica la configuración de CORS

