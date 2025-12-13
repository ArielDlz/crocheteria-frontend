<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { rolesService } from '../services/rolesService'
import { permissionsService } from '@/modules/permisos/services/permissionsService'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  roleId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'success'])

// Determinar si es modo edición
const isEditMode = computed(() => !!props.roleId)

// Formulario
const form = ref({
  name: '',
  description: '',
  permissions: [],
  isActive: true
})

// Valores originales (para comparar cambios)
const originalValues = ref({})

// Estado
const groupedPermissions = ref({})
const isLoadingPermissions = ref(false)
const isLoadingRole = ref(false)
const isSubmitting = ref(false)
const errors = ref({})
const expandedModules = ref({}) // Controlar qué módulos están expandidos

// Cargar permisos agrupados
const loadPermissions = async () => {
  isLoadingPermissions.value = true
  errors.value.permissions = null
  try {
    const grouped = await permissionsService.getGroupedPermissions()
    groupedPermissions.value = grouped || {}
    
    // Inicializar todos los módulos como expandidos por defecto
    Object.keys(groupedPermissions.value).forEach(module => {
      expandedModules.value[module] = true
    })
    
    // Verificar si se cargaron permisos
    if (Object.keys(groupedPermissions.value).length === 0) {
      errors.value.permissions = 'No se encontraron permisos disponibles'
    }
  } catch (error) {
    console.error('Error al cargar permisos:', error)
    errors.value.permissions = error.message || 'Error al cargar los permisos'
    groupedPermissions.value = {}
  } finally {
    isLoadingPermissions.value = false
    // Actualizar estado indeterminado después de cargar
    updateModuleCheckboxIndeterminate()
  }
}

// Cargar datos del rol para edición
const loadRoleData = async () => {
  if (!props.roleId) return

  isLoadingRole.value = true
  errors.value = {}

  try {
    const role = await rolesService.getRoleById(props.roleId)
    
    // Poblar formulario con datos del rol
    form.value = {
      name: role.name || '',
      description: role.description || '',
      permissions: role.permissions || [],
      isActive: role.isActive !== undefined ? role.isActive : true
    }

    // Guardar valores originales para comparar
    originalValues.value = {
      name: form.value.name,
      description: form.value.description,
      permissions: [...form.value.permissions].sort(),
      isActive: form.value.isActive
    }
  } catch (error) {
    console.error('Error al cargar rol:', error)
    errors.value.load = 'Error al cargar los datos del rol'
  } finally {
    isLoadingRole.value = false
  }
}

// Toggle de permiso
const togglePermission = (permissionCode) => {
  const index = form.value.permissions.indexOf(permissionCode)
  if (index > -1) {
    form.value.permissions.splice(index, 1)
  } else {
    form.value.permissions.push(permissionCode)
  }
}

// Verificar si un permiso está seleccionado
const isPermissionSelected = (permissionCode) => {
  return form.value.permissions.includes(permissionCode)
}

// Toggle de expansión de módulo
const toggleModuleExpansion = (module) => {
  expandedModules.value[module] = !expandedModules.value[module]
}

// Verificar si un módulo está expandido
const isModuleExpanded = (module) => {
  return expandedModules.value[module] === true
}

// Seleccionar todos los permisos de un módulo
const selectAllInModule = (module) => {
  const modulePermissions = groupedPermissions.value[module] || []
  const allSelected = modulePermissions.every(p => isPermissionSelected(p.code))
  
  if (allSelected) {
    // Deseleccionar todos
    modulePermissions.forEach(p => {
      const index = form.value.permissions.indexOf(p.code)
      if (index > -1) {
        form.value.permissions.splice(index, 1)
      }
    })
  } else {
    // Seleccionar todos
    modulePermissions.forEach(p => {
      if (!isPermissionSelected(p.code)) {
        form.value.permissions.push(p.code)
      }
    })
  }
  
  // Actualizar estado indeterminado después de cambiar
  nextTick(() => {
    updateModuleCheckboxIndeterminate()
  })
}

// Verificar si todos los permisos de un módulo están seleccionados
const areAllSelectedInModule = (module) => {
  const modulePermissions = groupedPermissions.value[module] || []
  if (modulePermissions.length === 0) return false
  return modulePermissions.every(p => isPermissionSelected(p.code))
}

// Verificar si algunos permisos de un módulo están seleccionados
const areSomeSelectedInModule = (module) => {
  const modulePermissions = groupedPermissions.value[module] || []
  return modulePermissions.some(p => isPermissionSelected(p.code)) && !areAllSelectedInModule(module)
}

// Refs para los checkboxes de módulos (para establecer estado indeterminado)
const moduleCheckboxRefs = ref({})

// Establecer estado indeterminado en los checkboxes de módulos
const updateModuleCheckboxIndeterminate = () => {
  nextTick(() => {
    Object.keys(groupedPermissions.value).forEach(module => {
      const checkbox = moduleCheckboxRefs.value[module]
      if (checkbox) {
        checkbox.indeterminate = areSomeSelectedInModule(module)
      }
    })
  })
}

// Watch para actualizar estado indeterminado cuando cambian los permisos
watch(() => form.value.permissions, () => {
  updateModuleCheckboxIndeterminate()
}, { deep: true })

// Formatear módulo
const formatModule = (module) => {
  const moduleMap = {
    users: 'Usuarios',
    roles: 'Roles',
    permissions: 'Permisos',
    sales: 'Ventas',
    audit: 'Auditoría'
  }
  return moduleMap[module] || module.charAt(0).toUpperCase() + module.slice(1)
}

// Formatear acción
const formatAction = (action) => {
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

// Validación
const validate = () => {
  errors.value = {}
  let isValid = true

  // Nombre
  if (!form.value.name.trim()) {
    errors.value.name = 'El nombre del rol es obligatorio'
    isValid = false
  }

  // Descripción
  if (!form.value.description.trim()) {
    errors.value.description = 'La descripción es obligatoria'
    isValid = false
  }

  // Permisos (opcional, pero recomendado)
  if (form.value.permissions.length === 0) {
    errors.value.permissions = 'Se recomienda asignar al menos un permiso'
    // No marcamos como inválido, solo mostramos advertencia
  }

  return isValid
}

// Detectar qué campos han cambiado
const getChangedFields = () => {
  const changed = {}

  if (form.value.name !== originalValues.value.name) {
    changed.name = form.value.name.trim()
  }

  if (form.value.description !== originalValues.value.description) {
    changed.description = form.value.description.trim()
  }

  // Comparar permisos (ordenados)
  const currentPerms = [...form.value.permissions].sort().join(',')
  const originalPerms = [...(originalValues.value.permissions || [])].sort().join(',')
  
  if (currentPerms !== originalPerms) {
    changed.permissions = form.value.permissions
  }

  if (form.value.isActive !== originalValues.value.isActive) {
    changed.isActive = form.value.isActive
  }

  return changed
}

// Enviar formulario
const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true
  errors.value = {}

  try {
    if (isEditMode.value) {
      // Modo edición: solo enviar campos modificados
      const changedFields = getChangedFields()

      if (Object.keys(changedFields).length === 0) {
        errors.value.submit = 'No hay cambios para guardar'
        isSubmitting.value = false
        return
      }

      await rolesService.updateRole(props.roleId, changedFields)
      emit('success', { type: 'update', roleId: props.roleId, data: changedFields })
    } else {
      // Modo creación: enviar todos los campos
      const roleData = {
        name: form.value.name.trim(),
        description: form.value.description.trim(),
        permissions: form.value.permissions,
        isActive: form.value.isActive
      }

      await rolesService.createRole(roleData)
      emit('success', { type: 'create', data: roleData })
    }

    // Cerrar y limpiar
    handleClose()
  } catch (error) {
    console.error(`Error al ${isEditMode.value ? 'actualizar' : 'crear'} rol:`, error)
    errors.value.submit = error.message || `Error al ${isEditMode.value ? 'actualizar' : 'crear'} el rol`
  } finally {
    isSubmitting.value = false
  }
}

// Cerrar modal
const handleClose = () => {
  // Resetear formulario
  form.value = {
    name: '',
    description: '',
    permissions: [],
    isActive: true
  }
  originalValues.value = {}
  errors.value = {}
  expandedModules.value = {}
  emit('close')
}

// Cargar datos cuando se abre el modal
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadPermissions().then(() => {
      updateModuleCheckboxIndeterminate()
    })
    if (isEditMode.value) {
      loadRoleData().then(() => {
        updateModuleCheckboxIndeterminate()
      })
    }
  }
})

// Actualizar estado indeterminado cuando se cargan los permisos
watch(() => groupedPermissions.value, () => {
  updateModuleCheckboxIndeterminate()
}, { deep: true })

// Computed para verificar si el formulario es válido
const isFormValid = computed(() => {
  return form.value.name.trim() !== '' && 
         form.value.description.trim() !== ''
})

// Título del modal
const modalTitle = computed(() => {
  return isEditMode.value ? 'Editar Rol' : 'Crear Nuevo Rol'
})
</script>

<template>
  <Modal 
    :is-open="isOpen" 
    :title="modalTitle"
    size="large"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="role-form">
      <!-- Loading de rol -->
      <div v-if="isLoadingRole" class="loading-state">
        <div class="spinner-small"></div>
        <span>Cargando datos del rol...</span>
      </div>

      <!-- Error general -->
      <div v-if="errors.submit" class="form-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ errors.submit }}</span>
      </div>

      <div v-if="errors.load" class="form-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ errors.load }}</span>
      </div>

      <!-- Campos básicos -->
      <div class="form-section">
        <h3 class="section-title">Información Básica</h3>
        
        <!-- Campo Nombre -->
        <div class="form-group">
          <label for="name">
            Nombre del rol <span class="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            v-model="form.name"
            placeholder="Ej: vendedor, administrador"
            :class="{ 'error': errors.name }"
          />
          <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
        </div>

        <!-- Campo Descripción -->
        <div class="form-group">
          <label for="description">
            Descripción <span class="required">*</span>
          </label>
          <textarea
            id="description"
            v-model="form.description"
            placeholder="Describe las funciones y responsabilidades de este rol"
            rows="3"
            :class="{ 'error': errors.description }"
          ></textarea>
          <span v-if="errors.description" class="field-error">{{ errors.description }}</span>
        </div>

        <!-- Campo Estado -->
        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="form.isActive"
            />
            <span>Rol activo</span>
          </label>
        </div>
      </div>

      <!-- Selección de Permisos -->
      <div class="form-section">
        <div class="section-header">
          <h3 class="section-title">Permisos</h3>
          <span class="permissions-count">
            {{ form.permissions.length }} permiso{{ form.permissions.length !== 1 ? 's' : '' }} seleccionado{{ form.permissions.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <div v-if="isLoadingPermissions" class="loading-permissions">
          <div class="spinner-small"></div>
          <span>Cargando permisos...</span>
        </div>

        <div v-else-if="errors.permissions" class="form-error">
          {{ errors.permissions }}
        </div>

        <div v-else class="permissions-groups">
          <!-- Debug: mostrar si hay permisos -->
          <div v-if="Object.keys(groupedPermissions).length === 0" class="no-permissions">
            No hay permisos disponibles
          </div>
          
          <div 
            v-for="(permissions, module) in groupedPermissions" 
            :key="module"
            class="permission-module"
          >
            <!-- Header del módulo -->
            <div class="module-header">
              <div class="module-header-content">
                <!-- Checkbox para seleccionar/deseleccionar todos -->
                <label class="module-checkbox-label">
                  <input
                    :ref="el => { if (el) moduleCheckboxRefs[module] = el }"
                    type="checkbox"
                    :checked="areAllSelectedInModule(module)"
                    @change="selectAllInModule(module)"
                    @click.stop
                  />
                </label>
                
                <!-- Nombre del módulo (clickeable para expandir/contraer) -->
                <div 
                  class="module-name-wrapper"
                  @click="toggleModuleExpansion(module)"
                >
                  <svg 
                    class="expand-icon"
                    :class="{ expanded: isModuleExpanded(module) }"
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                  <span class="module-name">{{ formatModule(module) }}</span>
                  <span class="module-count">({{ permissions.length }})</span>
                </div>
              </div>
            </div>

            <!-- Lista de permisos del módulo -->
            <div 
              v-show="isModuleExpanded(module)"
              class="permissions-list"
            >
              <div v-if="!permissions || permissions.length === 0" class="no-permissions-in-module">
                No hay permisos en este módulo
              </div>
              <label
                v-for="permission in permissions"
                :key="permission._id || permission.code"
                class="permission-item"
                :class="{ disabled: !permission.isActive }"
              >
                <input
                  type="checkbox"
                  :checked="isPermissionSelected(permission.code)"
                  @change="togglePermission(permission.code)"
                  :disabled="!permission.isActive"
                />
                <div class="permission-info">
                  <span class="permission-code">{{ permission.code }}</span>
                  <span class="permission-description">{{ permission.description }}</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <span v-if="errors.permissions" class="field-error">{{ errors.permissions }}</span>
      </div>
    </form>

    <template #footer>
      <button 
        type="button" 
        class="btn-outline" 
        @click="handleClose"
        :disabled="isSubmitting || isLoadingRole"
      >
        Cancelar
      </button>
      <button 
        type="submit" 
        class="btn-primary" 
        @click="handleSubmit"
        :disabled="!isFormValid || isSubmitting || isLoadingRole"
      >
        <span v-if="isSubmitting" class="spinner-small"></span>
        <span v-else>{{ isEditMode ? 'Guardar Cambios' : 'Crear Rol' }}</span>
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.role-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  max-height: 70vh;
  overflow-y: auto;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.permissions-count {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-group label {
  font-weight: 600;
  color: var(--color-text-primary);
}

.required {
  color: var(--color-error);
}

.form-group input[type="text"],
.form-group textarea {
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color var(--transition-fast);
}

.form-group input[type="text"]:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(107, 76, 154, 0.1);
}

.form-group input.error,
.form-group textarea.error {
  border-color: var(--color-error);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-weight: 500;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.field-error {
  font-size: 0.875rem;
  color: var(--color-error);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.form-error {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.75rem 1rem;
  background: rgba(229, 62, 62, 0.1);
  border: 1px solid rgba(229, 62, 62, 0.3);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: 0.875rem;
}

.loading-state,
.loading-permissions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Permissions Groups */
.permissions-groups {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-height: 400px;
  overflow-y: auto;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
}

.permission-module {
  background: var(--color-white);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.no-permissions,
.no-permissions-in-module {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-style: italic;
}

.module-header {
  padding: var(--spacing-md);
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}

.module-header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.module-checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}

.module-checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.module-name-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  cursor: pointer;
  user-select: none;
  padding: var(--spacing-xs) 0;
  transition: color var(--transition-fast);
}

.module-name-wrapper:hover {
  color: var(--color-primary);
}

.expand-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  transition: transform var(--transition-fast);
  color: var(--color-text-muted);
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.module-name {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.module-count {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-weight: normal;
}

.permissions-list {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-sm);
  gap: var(--spacing-xs);
}

.permission-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.permission-item:hover:not(.disabled) {
  background: rgba(107, 76, 154, 0.05);
}

.permission-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.permission-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.permission-item.disabled input[type="checkbox"] {
  cursor: not-allowed;
}

.permission-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
}

.permission-code {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary);
}

.permission-description {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

