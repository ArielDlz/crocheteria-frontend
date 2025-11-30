<script setup>
import { ref, computed, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { rolesService } from '@/modules/roles/services/rolesService'
import { usersService } from '../services/usersService'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'success'])

// Formulario
const form = ref({
  email: '',
  password: '',
  roleId: ''
})

// Estado
const roles = ref([])
const isLoadingRoles = ref(false)
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

// Validación
const validate = () => {
  errors.value = {}
  let isValid = true

  // Email
  if (!form.value.email.trim()) {
    errors.value.email = 'El correo electrónico es obligatorio'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'El correo electrónico no es válido'
    isValid = false
  }

  // Contraseña
  if (!form.value.password) {
    errors.value.password = 'La contraseña es obligatoria'
    isValid = false
  } else if (form.value.password.length < 6) {
    errors.value.password = 'La contraseña debe tener al menos 6 caracteres'
    isValid = false
  }

  // Rol
  if (!form.value.roleId) {
    errors.value.roleId = 'El rol es obligatorio'
    isValid = false
  }

  return isValid
}

// Enviar formulario
const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true
  errors.value = {}

  try {
    // Preparar datos para enviar
    const userData = {
      email: form.value.email.trim(),
      password: form.value.password,
      roleId: form.value.roleId
    }
    
    // Llamar al servicio para crear usuario
    await usersService.createUser(userData)
    
    // Emitir éxito
    emit('success', userData)
    
    // Cerrar y limpiar
    handleClose()
  } catch (error) {
    console.error('Error al crear usuario:', error)
    errors.value.submit = error.message || 'Error al crear el usuario'
  } finally {
    isSubmitting.value = false
  }
}

// Cerrar modal
const handleClose = () => {
  // Resetear formulario
  form.value = {
    email: '',
    password: '',
    roleId: ''
  }
  errors.value = {}
  emit('close')
}

// Watcher para cargar roles cuando se abre el modal
watch(() => props.isOpen, (newVal) => {
  if (newVal && roles.value.length === 0) {
    loadRoles()
  }
})

// Computed para verificar si el formulario es válido
const isFormValid = computed(() => {
  return form.value.email.trim() !== '' && 
         form.value.password.length >= 6 && 
         form.value.roleId !== ''
})
</script>

<template>
  <Modal 
    :is-open="isOpen" 
    title="Crear Nuevo Usuario"
    size="medium"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="create-user-form">
      <!-- Error general -->
      <div v-if="errors.submit" class="form-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ errors.submit }}</span>
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
          :class="{ 'error': errors.email }"
        />
        <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
      </div>

      <!-- Campo Contraseña -->
      <div class="form-group">
        <label for="password">
          Contraseña <span class="required">*</span>
        </label>
        <input
          type="password"
          id="password"
          v-model="form.password"
          placeholder="Mínimo 6 caracteres"
          autocomplete="new-password"
          :class="{ 'error': errors.password }"
        />
        <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
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
        :disabled="isSubmitting"
      >
        Cancelar
      </button>
      <button 
        type="submit" 
        class="btn-primary" 
        @click="handleSubmit"
        :disabled="!isFormValid || isSubmitting"
      >
        <span v-if="isSubmitting" class="spinner-small"></span>
        <span v-else>Crear Usuario</span>
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.create-user-form {
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

