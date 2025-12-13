<script setup>
import { ref, computed, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { permissionsService } from '../services/permissionsService'
import api from '@/services/api'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'success'])

// Formulario
const form = ref({
  module: '',
  action: '',
  description: ''
})

// Estado
const isSubmitting = ref(false)
const isLoadingOptions = ref(false)
const errors = ref({})

// Opciones de módulos y acciones (cargadas desde el backend)
const moduleOptions = ref([])
const actionOptions = ref([])

// Cargar opciones de selects desde el backend
const loadSelectOptions = async () => {
  isLoadingOptions.value = true
  errors.value.options = null
  
  try {
    const response = await api.get('/templates/permissions_selects')
    
    if (response && response.data) {
      moduleOptions.value = response.data.modules || []
      actionOptions.value = response.data.actions || []
    }
  } catch (error) {
    console.error('Error al cargar opciones:', error)
    errors.value.options = 'Error al cargar las opciones de módulos y acciones'
  } finally {
    isLoadingOptions.value = false
  }
}

// Vista previa del código que se generará
const generatedCode = computed(() => {
  if (form.value.module && form.value.action) {
    return `${form.value.module}:${form.value.action}`
  }
  return ''
})

// Validación
const validate = () => {
  errors.value = {}
  let isValid = true

  // Módulo
  if (!form.value.module.trim()) {
    errors.value.module = 'El módulo es obligatorio'
    isValid = false
  }

  // Acción
  if (!form.value.action.trim()) {
    errors.value.action = 'La acción es obligatoria'
    isValid = false
  }

  // Descripción
  if (!form.value.description.trim()) {
    errors.value.description = 'La descripción es obligatoria'
    isValid = false
  } else if (form.value.description.trim().length < 5) {
    errors.value.description = 'La descripción debe tener al menos 5 caracteres'
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
    const permissionData = {
      module: form.value.module.trim(),
      action: form.value.action.trim(),
      description: form.value.description.trim()
    }

    await permissionsService.createPermission(permissionData)
    emit('success', { type: 'create', data: permissionData })
    handleClose()
  } catch (error) {
    console.error('Error al crear permiso:', error)
    errors.value.submit = error.message || 'Error al crear el permiso'
  } finally {
    isSubmitting.value = false
  }
}

// Cerrar modal
const handleClose = () => {
  form.value = {
    module: '',
    action: '',
    description: ''
  }
  errors.value = {}
  emit('close')
}

// Resetear formulario y cargar opciones cuando se abre el modal
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.value = {
      module: '',
      action: '',
      description: ''
    }
    errors.value = {}
    
    // Cargar opciones si no están cargadas
    if (moduleOptions.value.length === 0 || actionOptions.value.length === 0) {
      loadSelectOptions()
    }
  }
})

// Computed para verificar si el formulario es válido
const isFormValid = computed(() => {
  return form.value.module.trim() !== '' && 
         form.value.action.trim() !== '' &&
         form.value.description.trim().length >= 5
})
</script>

<template>
  <Modal 
    :is-open="isOpen" 
    title="Crear Nuevo Permiso"
    size="medium"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="permission-form">
      <!-- Error general -->
      <div v-if="errors.submit" class="form-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ errors.submit }}</span>
      </div>

      <!-- Error al cargar opciones -->
      <div v-if="errors.options" class="form-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ errors.options }}</span>
        <button type="button" class="btn-retry" @click="loadSelectOptions">Reintentar</button>
      </div>

      <!-- Loading de opciones -->
      <div v-if="isLoadingOptions" class="loading-options">
        <div class="spinner-small"></div>
        <span>Cargando opciones...</span>
      </div>

      <!-- Campo Módulo -->
      <div class="form-group">
        <label for="module">
          Módulo <span class="required">*</span>
        </label>
        <select
          id="module"
          v-model="form.module"
          :class="{ 'error': errors.module }"
          :disabled="isLoadingOptions"
        >
          <option value="" disabled>{{ isLoadingOptions ? 'Cargando...' : 'Selecciona un módulo' }}</option>
          <option 
            v-for="option in moduleOptions" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <span v-if="errors.module" class="field-error">{{ errors.module }}</span>
      </div>

      <!-- Campo Acción -->
      <div class="form-group">
        <label for="action">
          Acción <span class="required">*</span>
        </label>
        <select
          id="action"
          v-model="form.action"
          :class="{ 'error': errors.action }"
          :disabled="isLoadingOptions"
        >
          <option value="" disabled>{{ isLoadingOptions ? 'Cargando...' : 'Selecciona una acción' }}</option>
          <option 
            v-for="option in actionOptions" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <span v-if="errors.action" class="field-error">{{ errors.action }}</span>
      </div>

      <!-- Vista previa del código -->
      <div v-if="generatedCode" class="code-preview">
        <label>Código del permiso:</label>
        <code class="permission-code-preview">{{ generatedCode }}</code>
      </div>

      <!-- Campo Descripción -->
      <div class="form-group">
        <label for="description">
          Descripción <span class="required">*</span>
        </label>
        <textarea
          id="description"
          v-model="form.description"
          placeholder="Describe qué permite hacer este permiso"
          rows="3"
          :class="{ 'error': errors.description }"
        ></textarea>
        <span v-if="errors.description" class="field-error">{{ errors.description }}</span>
        <span class="field-hint">Ej: "Crear nuevas ventas en el sistema"</span>
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
        :disabled="!isFormValid || isSubmitting || isLoadingOptions"
      >
        <span v-if="isSubmitting" class="spinner-small"></span>
        <span v-else>Crear Permiso</span>
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.permission-form {
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

.form-group select,
.form-group textarea {
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color var(--transition-fast);
  background: var(--color-white);
}

.form-group select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b6b6b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(107, 76, 154, 0.1);
}

.form-group select.error,
.form-group textarea.error {
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
  flex-wrap: wrap;
}

.btn-retry {
  margin-left: auto;
  padding: 0.25rem 0.75rem;
  background: transparent;
  border: 1px solid var(--color-error);
  border-radius: var(--radius-sm);
  color: var(--color-error);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-retry:hover {
  background: var(--color-error);
  color: white;
}

.loading-options {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-background);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.form-group select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--color-background);
}

.code-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--color-background);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.code-preview label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.permission-code-preview {
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-primary);
  padding: 0.5rem 0.75rem;
  background: var(--color-white);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
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

