<script setup>
import { ref, onMounted } from 'vue'
import { usePermissions } from '@/modules/auth'
import { rolesService } from '../services/rolesService'

// Permisos
const { canCreate, canUpdate, canDelete } = usePermissions()

// Estado
const roles = ref([])
const isLoading = ref(true)
const error = ref(null)

// Cargar roles
const loadRoles = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    roles.value = await rolesService.getRoles()
  } catch (err) {
    console.error('Error al cargar roles:', err)
    error.value = err.message || 'Error al cargar los roles'
  } finally {
    isLoading.value = false
  }
}

// Acciones (por ahora solo logs)
const handleAddRole = () => {
  console.log('Agregar rol')
  // TODO: Implementar
}

const handleEditRole = (role) => {
  console.log('Editar rol:', role)
  // TODO: Implementar
}

const handleDeleteRole = (role) => {
  console.log('Eliminar rol:', role)
  // TODO: Implementar
}

// Cargar datos al montar
onMounted(() => {
  loadRoles()
})
</script>

<template>
  <div class="roles-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-info">
        <h1>🛡️ Roles</h1>
        <p>Gestiona los roles del sistema</p>
      </div>
      
      <!-- Botón Agregar (solo si tiene permiso) -->
      <button 
        v-if="canCreate('roles')"
        class="btn-primary"
        @click="handleAddRole"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Nuevo Rol
      </button>
    </header>

    <!-- Contenido -->
    <div class="page-content">
      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando roles...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button class="btn-secondary" @click="loadRoles">Reintentar</button>
      </div>

      <!-- Tabla de roles -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Rol</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th class="actions-column">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="roles.length === 0">
              <td colspan="5" class="empty-row">
                <span class="empty-icon">📭</span>
                <p>No hay roles registrados</p>
              </td>
            </tr>
            <tr v-for="role in roles" :key="role._id">
              <!-- Nombre del Rol -->
              <td>
                <div class="role-cell">
                  <span 
                    class="role-badge"
                    :class="{ 
                      'super-admin': role.isSuperAdmin,
                      'system': role.isSystem && !role.isSuperAdmin
                    }"
                  >
                    {{ role.name }}
                  </span>
                  <span v-if="role.isSuperAdmin" class="role-tag super">Super Admin</span>
                  <span v-else-if="role.isSystem" class="role-tag system">Sistema</span>
                </div>
              </td>

              <!-- Descripción -->
              <td>
                <span class="description-text">{{ role.description || '-' }}</span>
              </td>

              <!-- Tipo (cantidad de permisos) -->
              <td>
                <span class="permissions-count">
                  <template v-if="role.permissions?.includes('*')">
                    <span class="all-permissions">Todos los permisos</span>
                  </template>
                  <template v-else>
                    {{ role.permissions?.length || 0 }} permisos
                  </template>
                </span>
              </td>

              <!-- Estado -->
              <td>
                <span 
                  class="status-badge"
                  :class="role.isActive ? 'active' : 'inactive'"
                >
                  {{ role.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>

              <!-- Acciones -->
              <td class="actions-cell">
                <!-- Botón Editar -->
                <button 
                  v-if="canUpdate('roles')"
                  class="action-btn edit"
                  @click="handleEditRole(role)"
                  title="Editar rol"
                  :disabled="role.isSystem"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>

                <!-- Botón Eliminar -->
                <button 
                  v-if="canDelete('roles')"
                  class="action-btn delete"
                  @click="handleDeleteRole(role)"
                  title="Eliminar rol"
                  :disabled="role.isSystem"
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
                  v-if="!canUpdate('roles') && !canDelete('roles')"
                  class="no-actions"
                >
                  -
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Info de permisos (debug) -->
      <div class="permissions-debug">
        <small>
          Permisos: 
          <span :class="canCreate('roles') ? 'has' : 'no'">crear</span> |
          <span :class="canUpdate('roles') ? 'has' : 'no'">editar</span> |
          <span :class="canDelete('roles') ? 'has' : 'no'">eliminar</span>
        </small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.roles-page {
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

/* Table */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 1rem 1.25rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.data-table th {
  background: var(--color-background);
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.data-table tbody tr:hover {
  background: rgba(107, 76, 154, 0.03);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* Role Cell */
.role-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.role-badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  background: var(--color-background);
  color: var(--color-text-primary);
}

.role-badge.super-admin {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
}

.role-badge.system {
  background: linear-gradient(135deg, var(--color-secondary), var(--color-secondary-dark));
  color: white;
}

.role-tag {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.role-tag.super {
  background: rgba(107, 76, 154, 0.1);
  color: var(--color-primary);
}

.role-tag.system {
  background: rgba(45, 143, 92, 0.1);
  color: var(--color-secondary);
}

/* Description */
.description-text {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

/* Permissions Count */
.permissions-count {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.all-permissions {
  color: var(--color-primary);
  font-weight: 500;
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
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.edit {
  background: rgba(107, 76, 154, 0.1);
  color: var(--color-primary);
}

.action-btn.edit:hover:not(:disabled) {
  background: var(--color-primary);
  color: white;
}

.action-btn.delete {
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
}

.action-btn.delete:hover:not(:disabled) {
  background: var(--color-error);
  color: white;
}

.no-actions {
  color: var(--color-text-muted);
}

/* Empty Row */
.empty-row {
  text-align: center !important;
  padding: var(--spacing-2xl) !important;
}

.empty-row .empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
}

.empty-row p {
  color: var(--color-text-muted);
}

/* Permissions Debug */
.permissions-debug {
  padding: var(--spacing-md);
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.permissions-debug small {
  color: var(--color-text-muted);
}

.permissions-debug .has {
  color: var(--color-secondary);
  font-weight: 600;
}

.permissions-debug .no {
  color: var(--color-text-muted);
  text-decoration: line-through;
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

  .data-table th,
  .data-table td {
    padding: 0.75rem;
  }

  .role-tag {
    display: none;
  }
}
</style>

