<script setup>
import { ref, computed, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { rolesService } from '@/modules/roles/services/rolesService'
import { usersService } from '../services/usersService'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'success'])

// Determinar si es modo edición
const isEditMode = computed(() => !!props.userId)

// Formulario
const form = ref({
  name: '',
  familyName: '',
  email: '',
  password: '',
  roleId: ''
})

// Valores originales (para comparar cambios)
const originalValues = ref({})

// Estado
const roles = ref([])
const isLoadingRoles = ref(false)
const isLoadingUser = ref(false)
const isSubmitting = ref(false)
const errors = ref({})

// Cargar roles
const loadRoles = async () => {
  isLoadingRoles.value = true
  try {
    roles.value = await rolesService.getRoles()
    // Filtrar solo roles activos
    roles.value = roles.value.filter(role => role.isActive)
  } catch (error) {
    console.error('Error al cargar roles:', error)
    errors.value.roles = 'Error al cargar los roles'
  } finally {
    isLoadingRoles.value = false
  }
}

// Cargar datos del usuario para edición
const loadUserData = async () => {
  if (!props.userId) return

  isLoadingUser.value = true
  errors.value = {}

  try {
    const user = await usersService.getUserById(props.userId)
    
    // Poblar formulario con datos del usuario
    form.value = {
      name: user.name || '',
      familyName: user.family_name || user.familyName || '',
      email: user.email || '',
      password: '', // No cargar contraseña
      roleId: user.role?._id || user.roleId || ''
    }

    // Guardar valores originales para comparar
    originalValues.value = {
      name: form.value.name,
      familyName: form.value.familyName,
      roleId: form.value.roleId
    }
  } catch (error) {
    console.error('Error al cargar usuario:', error)
    errors.value.load = 'Error al cargar los datos del usuario'
  } finally {
    isLoadingUser.value = false
  }
}

// Validación
const validate = () => {
  errors.value = {}
  let isValid = true

  // Email (solo en creación)
  if (!isEditMode.value) {
    if (!form.value.email.trim()) {
      errors.value.email = 'El correo electrónico es obligatorio'
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
      errors.value.email = 'El correo electrónico no es válido'
      isValid = false
    }
  }

  // Contraseña (obligatoria en creación, opcional en edición)
  if (!isEditMode.value) {
    if (!form.value.password) {
      errors.value.password = 'La contraseña es obligatoria'
      isValid = false
    } else if (form.value.password.length < 6) {
      errors.value.password = 'La contraseña debe tener al menos 6 caracteres'
      isValid = false
    }
  } else {
    // En edición, si se proporciona contraseña, debe tener al menos 6 caracteres
    if (form.value.password && form.value.password.length < 6) {
      errors.value.password = 'La contraseña debe tener al menos 6 caracteres'
      isValid = false
    }
  }

  // Nombre
  if (!form.value.name.trim()) {
    errors.value.name = 'El nombre es obligatorio'
    isValid = false
  }

  // Apellido
  if (!form.value.familyName.trim()) {
    errors.value.familyName = 'El apellido es obligatorio'
    isValid = false
  }

  // Rol
  if (!form.value.roleId) {
    errors.value.roleId = 'El rol es obligatorio'
    isValid = false
  }

  return isValid
}

// Detectar qué campos han cambiado
const getChangedFields = () => {
  const changed = {}

  if (form.value.name !== originalValues.value.name) {
    changed.name = form.value.name.trim()
  }

  if (form.value.familyName !== originalValues.value.familyName) {
    changed.familyName = form.value.familyName.trim()
  }

  if (form.value.roleId !== originalValues.value.roleId) {
    changed.roleId = form.value.roleId
  }

  // Contraseña solo si se proporcionó
  if (form.value.password && form.value.password.trim() !== '') {
    changed.password = form.value.password
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

      // El backend espera familyName (ya está en el formato correcto)
      await usersService.updateUser(props.userId, changedFields)
      emit('success', { type: 'update', userId: props.userId, data: changedFields })
    } else {
      // Modo creación: enviar todos los campos
      const userData = {
        name: form.value.name.trim(),
        familyName: form.value.familyName.trim(),
        email: form.value.email.trim(),
        password: form.value.password,
        roleId: form.value.roleId
      }

      await usersService.createUser(userData)
      emit('success', { type: 'create', data: userData })
    }

    // Cerrar y limpiar
    handleClose()
  } catch (error) {
    console.error(`Error al ${isEditMode.value ? 'actualizar' : 'crear'} usuario:`, error)
    errors.value.submit = error.message || `Error al ${isEditMode.value ? 'actualizar' : 'crear'} el usuario`
  } finally {
    isSubmitting.value = false
  }
}

// Cerrar modal
const handleClose = () => {
  // Resetear formulario
  form.value = {
    name: '',
    familyName: '',
    email: '',
    password: '',
    roleId: ''
  }
  originalValues.value = {}
  errors.value = {}
  emit('close')
}

// Cargar datos cuando se abre el modal
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadRoles()
    if (isEditMode.value) {
      loadUserData()
    }
  }
})

// Computed para verificar si el formulario es válido
const isFormValid = computed(() => {
  const baseValid = form.value.name.trim() !== '' && 
                   form.value.familyName.trim() !== '' && 
                   form.value.roleId !== ''

  if (isEditMode.value) {
    // En edición, password es opcional
    return baseValid && (!form.value.password || form.value.password.length >= 6)
  } else {
    // En creación, email y password son obligatorios
    return baseValid && 
           form.value.email.trim() !== '' && 
           form.value.password.length >= 6
  }
})

// Título del modal
const modalTitle = computed(() => {
  return isEditMode.value ? 'Editar Usuario' : 'Crear Nuevo Usuario'
})
</script>

<template>
  <Modal 
    :is-open="isOpen" 
    :title="modalTitle"
    size="medium"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="user-form">
      <!-- Loading de usuario -->
      <div v-if="isLoadingUser" class="loading-state">
        <div class="spinner-small"></div>
        <span>Cargando datos del usuario...</span>
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

      <!-- Campo Nombre -->
      <div class="form-group">
        <label for="name">
          Nombre <span class="required">*</span>
        </label>
        <input
          type="text"
          id="name"
          v-model="form.name"
          placeholder="Juan"
          autocomplete="given-name"
          :class="{ 'error': errors.name }"
        />
        <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
      </div>

      <!-- Campo Apellido -->
      <div class="form-group">
        <label for="familyName">
          Apellido <span class="required">*</span>
        </label>
        <input
          type="text"
          id="familyName"
          v-model="form.familyName"
          placeholder="Pérez"
          autocomplete="family-name"
          :class="{ 'error': errors.familyName }"
        />
        <span v-if="errors.familyName" class="field-error">{{ errors.familyName }}</span>
      </div>

      <!-- Campo Email -->
      <div class="form-group">
        <label for="email">
          Correo electrónico <span class="required">*</span>
        </label>
        <input
          type="email"
          id="email"
          v-model="form.email"
          placeholder="usuario@ejemplo.com"
          autocomplete="email"
          :readonly="isEditMode"
          :class="{ 'error': errors.email, 'readonly': isEditMode }"
        />
        <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
        <span v-if="isEditMode" class="field-hint">El correo electrónico no se puede modificar</span>
      </div>

      <!-- Campo Contraseña -->
      <div class="form-group">
        <label for="password">
          Contraseña 
          <span v-if="!isEditMode" class="required">*</span>
          <span v-else class="optional">(opcional)</span>
        </label>
        <input
          type="password"
          id="password"
          v-model="form.password"
          :placeholder="isEditMode ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'"
          autocomplete="new-password"
          :class="{ 'error': errors.password }"
        />
        <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        <span v-if="isEditMode" class="field-hint">Dejar vacío si no deseas cambiar la contraseña</span>
      </div>

      <!-- Campo Rol -->
      <div class="form-group">
        <label for="roleId">
          Rol <span class="required">*</span>
        </label>
        <div v-if="isLoadingRoles" class="loading-select">
          <div class="spinner-small"></div>
          <span>Cargando roles...</span>
        </div>
        <select
          v-else
          id="roleId"
          v-model="form.roleId"
          :class="{ 'error': errors.roleId }"
        >
          <option value="">Selecciona un rol</option>
          <option 
            v-for="role in roles" 
            :key="role._id" 
            :value="role._id"
          >
            {{ role.name }} - {{ role.description }}
          </option>
        </select>
        <span v-if="errors.roleId" class="field-error">{{ errors.roleId }}</span>
        <span v-if="errors.roles" class="field-error">{{ errors.roles }}</span>
      </div>
    </form>

    <template #footer>
      <button 
        type="button" 
        class="btn-outline" 
        @click="handleClose"
        :disabled="isSubmitting || isLoadingUser"
      >
        Cancelar
      </button>
      <button 
        type="submit" 
        class="btn-primary" 
        @click="handleSubmit"
        :disabled="!isFormValid || isSubmitting || isLoadingUser"
      >
        <span v-if="isSubmitting" class="spinner-small"></span>
        <span v-else>{{ isEditMode ? 'Guardar Cambios' : 'Crear Usuario' }}</span>
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.user-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
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

.optional {
  color: var(--color-text-muted);
  font-weight: normal;
  font-size: 0.85em;
}

.form-group input,
.form-group select {
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: border-color var(--transition-fast);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(107, 76, 154, 0.1);
}

.form-group input.readonly {
  background: var(--color-background);
  cursor: not-allowed;
  color: var(--color-text-secondary);
}

.form-group input.error,
.form-group select.error {
  border-color: var(--color-error);
}

.field-error {
  font-size: 0.875rem;
  color: var(--color-error);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.field-hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-style: italic;
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

.loading-state {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.loading-select {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.875rem 1rem;
  color: var(--color-text-muted);
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

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

