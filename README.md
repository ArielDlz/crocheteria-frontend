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

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview
```

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
