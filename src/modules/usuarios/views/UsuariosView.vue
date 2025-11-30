<script setup>
import { ref, onMounted } from 'vue'
import { usePermissions } from '@/modules/auth'
import { usersService } from '../services/usersService'
import CreateUserModal from '../components/CreateUserModal.vue'

// Permisos
const { canCreate, canUpdate, canDelete } = usePermissions()

// Estado
const users = ref([])
const isLoading = ref(true)
const error = ref(null)
const isCreateModalOpen = ref(false)

// Cargar usuarios
const loadUsers = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    users.value = await usersService.getUsers()
  } catch (err) {
    console.error('Error al cargar usuarios:', err)
    error.value = err.message || 'Error al cargar los usuarios'
  } finally {
    isLoading.value = false
  }
}

// Formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Acciones
const handleAddUser = () => {
  isCreateModalOpen.value = true
}

const handleCreateSuccess = async (userData) => {
  // Recargar lista de usuarios
  await loadUsers()
}

const handleCloseModal = () => {
  isCreateModalOpen.value = false
}

const handleEditUser = (user) => {
  console.log('Editar usuario:', user)
  // TODO: Implementar
}

const handleDeleteUser = (user) => {
  console.log('Eliminar usuario:', user)
  // TODO: Implementar
}

// Cargar datos al montar
onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="users-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-info">
        <h1>👥 Usuarios</h1>
        <p>Gestiona los usuarios del sistema</p>
      </div>
      
      <!-- Botón Agregar (solo si tiene permiso) -->
      <button 
        v-if="canCreate('users')"
        class="btn-primary"
        @click="handleAddUser"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Nuevo Usuario
      </button>
    </header>

    <!-- Contenido -->
    <div class="page-content">
      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando usuarios...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button class="btn-secondary" @click="loadUsers">Reintentar</button>
      </div>

      <!-- Tabla de usuarios -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha de creación</th>
              <th class="actions-column">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="users.length === 0">
              <td colspan="5" class="empty-row">
                <span class="empty-icon">📭</span>
                <p>No hay usuarios registrados</p>
              </td>
            </tr>
            <tr v-for="user in users" :key="user._id">
              <!-- Usuario (Email + Avatar) -->
              <td>
                <div class="user-cell">
                  <div class="user-avatar">
                    {{ user.email?.charAt(0).toUpperCase() || 'U' }}
                  </div>
                  <div class="user-info">
                    <span class="user-email">{{ user.email }}</span>
                    <span class="user-id">ID: {{ user._id.slice(-6) }}</span>
                  </div>
                </div>
              </td>

              <!-- Rol -->
              <td>
                <span 
                  class="role-badge"
                  :class="{ 'super-admin': user.role?.isSuperAdmin }"
                >
                  {{ user.role?.name || 'Sin rol' }}
                </span>
              </td>

              <!-- Estado -->
              <td>
                <span 
                  class="status-badge"
                  :class="user.isActive ? 'active' : 'inactive'"
                >
                  {{ user.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>

              <!-- Fecha de creación -->
              <td>
                <span class="date-text">{{ formatDate(user.createdAt) }}</span>
              </td>

              <!-- Acciones -->
              <td class="actions-cell">
                <!-- Botón Editar -->
                <button 
                  v-if="canUpdate('users')"
                  class="action-btn edit"
                  @click="handleEditUser(user)"
                  title="Editar usuario"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>

                <!-- Botón Eliminar -->
                <button 
                  v-if="canDelete('users')"
                  class="action-btn delete"
                  @click="handleDeleteUser(user)"
                  title="Eliminar usuario"
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
                  v-if="!canUpdate('users') && !canDelete('users')"
                  class="no-actions"
                >
                  -
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Info de permisos (para debug, puedes quitarlo después) -->
      <div class="permissions-debug">
        <small>
          Permisos: 
          <span :class="canCreate('users') ? 'has' : 'no'">crear</span> |
          <span :class="canUpdate('users') ? 'has' : 'no'">editar</span> |
          <span :class="canDelete('users') ? 'has' : 'no'">eliminar</span>
        </small>
      </div>
    </div>

    <!-- Modal de Crear Usuario -->
    <CreateUserModal
      :is-open="isCreateModalOpen"
      @close="handleCloseModal"
      @success="handleCreateSuccess"
    />
  </div>
</template>

<style scoped>
.users-page {
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

/* User Cell */
.user-cell {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-email {
  font-weight: 500;
  color: var(--color-text-primary);
}

.user-id {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-family: monospace;
}

/* Role Badge */
.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 500;
  background: var(--color-background);
  color: var(--color-text-secondary);
}

.role-badge.super-admin {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
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

/* Date */
.date-text {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

/* Actions Column */
.actions-column {
  width: 120px;
  text-align: center !important;
}

.actions-cell {
  text-align: center !important;
}

.actions-cell {
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

.action-btn.edit {
  background: rgba(107, 76, 154, 0.1);
  color: var(--color-primary);
}

.action-btn.edit:hover {
  background: var(--color-primary);
  color: white;
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

  .user-info {
    display: none;
  }

  .user-cell {
    gap: 0;
  }
}
</style>
