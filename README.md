# 🧶 Crochetería - Sistema de Administración

Aplicación frontend para la administración del negocio Crochetería.

## 🚀 Tecnologías

- **Vue.js 3** - Framework progresivo de JavaScript
- **Vite** - Herramienta de construcción ultrarrápida
- **CSS3** - Estilos modernos con variables CSS

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno (ver sección de configuración)
cp .env.example .env.local

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview
```

## ⚙️ Configuración de Variables de Entorno

### Desarrollo Local

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env.local
```

2. Edita `.env.local` con tus valores:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Crochetería
```

### Producción en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las siguientes variables:

| Variable | Valor | Ambiente |
|----------|-------|----------|
| `VITE_API_BASE_URL` | `https://api.crocheteria.mx/api` | Production, Preview |
| `VITE_APP_NAME` | `Crochetería` | Production, Preview (opcional) |

**Nota:** Las variables que empiezan con `VITE_` son expuestas al cliente. No incluyas secretos aquí.

### Dominios

- **Frontend (Vercel):** `crocheteria.mx`
- **Backend (Railway):** `api.crocheteria.mx`

### Importante para httpOnly Cookies

Asegúrate de que tu backend en Railway esté configurado para:
- Permitir CORS desde `https://crocheteria.mx`
- Configurar cookies con `SameSite=None; Secure` si los dominios son diferentes
- O `SameSite=Lax; Secure` si están en el mismo dominio base

## 📁 Estructura del Proyecto

```
crocheteria-frontend/
├── public/                    # Archivos estáticos
├── src/
│   ├── modules/               # Módulos de la aplicación
│   │   └── auth/              # Módulo de autenticación
│   │       ├── components/    # Componentes del módulo
│   │       │   └── LoginForm.vue
│   │       ├── views/         # Vistas del módulo
│   │       │   └── LoginView.vue
│   │       └── index.js       # Exportaciones del módulo
│   ├── assets/                # Recursos (imágenes, iconos)
│   ├── App.vue                # Componente raíz
│   ├── main.js                # Punto de entrada
│   └── style.css              # Estilos globales
├── index.html                 # HTML principal
├── vite.config.js             # Configuración de Vite
└── package.json               # Dependencias y scripts
```

## 🎨 Paleta de Colores

| Color | Variable | Hex | Uso |
|-------|----------|-----|-----|
| Morado | `--color-primary` | `#6B4C9A` | Color principal, botones primarios |
| Verde | `--color-secondary` | `#2D8F5C` | Color secundario, éxito |
| Rojo | `--color-accent` | `#C94C4C` | Acentos, alertas |
| Blanco | `--color-white` | `#FFFFFF` | Fondos, superficies |

## 📋 Módulos

### Auth (Autenticación)
- `LoginView.vue` - Vista de inicio de sesión
- `LoginForm.vue` - Formulario de login

## 🔜 Por implementar

- [ ] Conexión con backend para autenticación
- [ ] Gestión de sesiones
- [ ] Dashboard principal
- [ ] Gestión de productos
- [ ] Gestión de clientes
- [ ] Reportes y estadísticas
