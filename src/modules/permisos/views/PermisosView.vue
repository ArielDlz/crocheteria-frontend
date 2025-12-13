<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePermissions } from '@/modules/auth'
import { permissionsService } from '../services/permissionsService'
import PermissionModal from '../components/PermissionModal.vue'

// Permisos
const { canCreate, canDelete } = usePermissions()

// Estado
const groupedPermissions = ref({})
const isLoading = ref(true)
const error = ref(null)
const expandedModules = ref([])

// Modal de creación
const showCreateModal = ref(false)

// Cargar permisos agrupados
const loadPermissions = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const grouped = await permissionsService.getGroupedPermissions()
    groupedPermissions.value = grouped
    
    // Expandir todos los módulos por defecto
    expandedModules.value = Object.keys(grouped)
  } catch (err) {
    console.error('Error al cargar permisos:', err)
    error.value = err.message || 'Error al cargar los permisos'
  } finally {
    isLoading.value = false
  }
}

// Toggle de expansión de módulo
const toggleModule = (module) => {
  const index = expandedModules.value.indexOf(module)
  if (index > -1) {
    expandedModules.value.splice(index, 1)
  } else {
    expandedModules.value.push(module)
  }
}

// Verificar si un módulo está expandido
const isModuleExpanded = (module) => {
  return expandedModules.value.includes(module)
}

// Expandir/colapsar todos
const toggleAllModules = () => {
  if (expandedModules.value.length === Object.keys(groupedPermissions.value).length) {
    expandedModules.value = []
  } else {
    expandedModules.value = Object.keys(groupedPermissions.value)
  }
}

// Formatear módulo (capitalizar primera letra)
const formatModule = (module) => {
  if (!module) return 'Sin módulo'
  const moduleMap = {
    users: 'Usuarios',
    roles: 'Roles',
    permissions: 'Permisos',
    sales: 'Ventas',
    audit: 'Auditoría',
    products: 'Productos',
  }
  return moduleMap[module] || module.charAt(0).toUpperCase() + module.slice(1)
}

// Formatear acción (capitalizar primera letra)
const formatAction = (action) => {
  if (!action) return 'Sin acción'
  const actionMap = {
    read: 'Ver',
    create: 'Crear',
    update: 'Editar',
    delete: 'Eliminar',
    manage: 'Gestionar',
    cancel: 'Cancelar'
  }
  return actionMap[action] || action.charAt(0).toUpperCase() + action.slice(1)
}

// Contar total de permisos
const totalPermissions = computed(() => {
  return Object.values(groupedPermissions.value).reduce((total, perms) => {
    return total + (Array.isArray(perms) ? perms.length : 0)
  }, 0)
})

// Contar módulos
const modulesCount = computed(() => {
  return Object.keys(groupedPermissions.value).length
})

// Abrir modal de creación
const openCreateModal = () => {
  showCreateModal.value = true
}

// Cerrar modal de creación
const closeCreateModal = () => {
  showCreateModal.value = false
}

// Manejar éxito al crear permiso
const handleCreateSuccess = () => {
  loadPermissions()
}

// Cargar datos al montar
onMounted(() => {
  loadPermissions()
})
</script>

<template>
  <div class="permissions-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-info">
        <h1>🔐 Permisos</h1>
        <p>Gestiona los permisos del sistema agrupados por módulo</p>
      </div>
      
      <div class="header-actions">
        <!-- Botón Agregar (solo si tiene permiso) -->
        <button 
          v-if="canCreate('permissions')"
          class="btn-primary"
          @click="openCreateModal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo Permiso
        </button>
        
        <!-- Botón expandir/colapsar todos -->
        <button 
          class="btn-outline"
          @click="toggleAllModules"
          v-if="modulesCount > 0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline v-if="expandedModules.length === modulesCount" points="18 15 12 9 6 15"></polyline>
            <polyline v-else points="6 9 12 15 18 9"></polyline>
          </svg>
          {{ expandedModules.length === modulesCount ? 'Colapsar Todo' : 'Expandir Todo' }}
        </button>
      </div>
    </header>

    <!-- Contenido -->
    <div class="page-content">
      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando permisos...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button class="btn-secondary" @click="loadPermissions">Reintentar</button>
      </div>

      <!-- Permisos agrupados por módulo -->
      <div v-else class="permissions-groups">
        <!-- Resumen -->
        <div class="summary-card">
          <div class="summary-item">
            <span class="summary-label">Módulos</span>
            <span class="summary-value">{{ modulesCount }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Permisos</span>
            <span class="summary-value">{{ totalPermissions }}</span>
          </div>
        </div>

        <!-- Sin permisos -->
        <div v-if="modulesCount === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p>No hay permisos registrados</p>
        </div>

        <!-- Módulos -->
        <div 
          v-for="(permissions, module) in groupedPermissions" 
          :key="module"
          class="module-section"
        >
          <!-- Header del módulo -->
          <button 
            class="module-header"
            @click="toggleModule(module)"
          >
            <div class="module-header-left">
              <span class="module-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
              </span>
              <div class="module-info">
                <h3 class="module-name">{{ formatModule(module) }}</h3>
                <span class="module-count">{{ permissions.length }} permiso{{ permissions.length !== 1 ? 's' : '' }}</span>
              </div>
            </div>
            <svg 
              class="module-arrow"
              :class="{ rotated: isModuleExpanded(module) }"
              width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <!-- Contenido del módulo (tabla de permisos) -->
          <div 
            v-if="isModuleExpanded(module)"
            class="module-content"
          >
            <table class="permissions-table">
              <thead>
                <tr>
                  <th>Acción</th>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th class="actions-column">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="permission in permissions" :key="permission._id">
                  <!-- Acción -->
                  <td>
                    <span class="action-badge">
                      {{ formatAction(permission.action) }}
                    </span>
                  </td>

                  <!-- Código -->
                  <td>
                    <code class="permission-code">{{ permission.code }}</code>
                  </td>

                  <!-- Descripción -->
                  <td>
                    <span class="description-text">{{ permission.description || '-' }}</span>
                  </td>

                  <!-- Estado -->
                  <td>
                    <span 
                      class="status-badge"
                      :class="permission.isActive ? 'active' : 'inactive'"
                    >
                      {{ permission.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>

                  <!-- Acciones -->
                  <td class="actions-cell">
                    <div class="actions-wrapper">
                      <!-- Botón Eliminar -->
                      <button 
                        v-if="canDelete('permissions')"
                        class="action-btn delete"
                        @click="() => {}"
                        title="Eliminar permiso"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>

                      <!-- Sin acciones disponibles -->
                      <span 
                        v-if="!canDelete('permissions')"
                        class="no-actions"
                      >
                        -
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Creación -->
    <PermissionModal
      :is-open="showCreateModal"
      @close="closeCreateModal"
      @success="handleCreateSuccess"
    />
  </div>
</template>

<style scoped>
.permissions-page {
  animation: fadeIn 0.4s ease-out;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.header-info h1 {
  font-size: 1.75rem;
  margin-bottom: var(--spacing-xs);
}

.header-info p {
  color: var(--color-text-secondary);
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

/* Content */
.page-content {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-md);
  text-align: center;
}

.error-icon {
  font-size: 3rem;
}

.error-state p {
  color: var(--color-error);
}

/* Summary Card */
.summary-card {
  display: flex;
  gap: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.summary-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

/* Permissions Groups */
.permissions-groups {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
}

/* Module Section */
.module-section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-white);
  transition: box-shadow var(--transition-fast);
}

.module-section:hover {
  box-shadow: var(--shadow-md);
}

/* Module Header */
.module-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--color-background);
  border: none;
  cursor: pointer;
  transition: background var(--transition-fast);
  text-align: left;
}

.module-header:hover {
  background: rgba(107, 76, 154, 0.05);
}

.module-header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.module-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.module-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.module-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.module-count {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.module-arrow {
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);
  flex-shrink: 0;
}

.module-arrow.rotated {
  transform: rotate(180deg);
}

/* Module Content */
.module-content {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  background: var(--color-white);
}

/* Permissions Table */
.permissions-table {
  width: 100%;
  border-collapse: collapse;
}

.permissions-table th,
.permissions-table td {
  padding: 0.875rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.permissions-table th {
  background: transparent;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  padding-bottom: var(--spacing-sm);
}

.permissions-table tbody tr:hover {
  background: rgba(107, 76, 154, 0.02);
}

.permissions-table tbody tr:last-child td {
  border-bottom: none;
}

/* Action Badge */
.action-badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 500;
  background: var(--color-background);
  color: var(--color-text-primary);
}

/* Permission Code */
.permission-code {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-background);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  font-weight: 500;
}

/* Description */
.description-text {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(45, 143, 92, 0.1);
  color: var(--color-secondary);
}

.status-badge.inactive {
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
}

/* Actions Column */
.actions-column {
  width: 120px;
  text-align: center !important;
}

.actions-cell {
  text-align: center !important;
  padding: 0.875rem 1rem !important;
  vertical-align: middle;
}

.actions-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
  flex-shrink: 0;
}

.action-btn svg {
  display: block;
  width: 18px;
  height: 18px;
}

.action-btn.delete {
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
}

.action-btn.delete:hover {
  background: var(--color-error);
  color: white;
}

.no-actions {
  color: var(--color-text-muted);
  display: inline-block;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
}

.empty-state p {
  color: var(--color-text-muted);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .summary-card {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .permissions-table th,
  .permissions-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }

  .permission-code {
    font-size: 0.75rem;
  }
}
</style>
