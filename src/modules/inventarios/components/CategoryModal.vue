<script setup>
import { ref, computed, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { categoriesService } from '../services/categoriesService'
import api from '@/services/api'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  categoryId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'success'])

// Determinar si es modo edición
const isEditMode = computed(() => !!props.categoryId)

// Formulario
const form = ref({
  name: '',
  description: '',
  comission: false,
  comision_type: '',
  comision_ammount: '',
  startup: false,
  startup_name: ''
})

// Valores originales (para comparar cambios en edición)
const originalValues = ref({})

// Estado
const isLoading = ref(false)
const isLoadingOptions = ref(false)
const isSubmitting = ref(false)
const errors = ref({})

// Opciones de tipo de comisión (cargadas desde el backend)
const comissionOptions = ref([])

// Cargar opciones de comisión desde el backend
const loadComissionOptions = async () => {
  if (comissionOptions.value.length > 0) return // Ya están cargadas
  
  isLoadingOptions.value = true
  
  try {
    const response = await api.get('/templates/comission_options')
    if (response && response.data && response.data.options) {
      comissionOptions.value = response.data.options
    }
  } catch (error) {
    console.error('Error al cargar opciones de comisión:', error)
    errors.value.options = 'Error al cargar las opciones de comisión'
  } finally {
    isLoadingOptions.value = false
  }
}

// Obtener el label del tipo de comisión seleccionado
const selectedComissionLabel = computed(() => {
  const selected = comissionOptions.value.find(opt => opt.value === form.value.comision_type)
  return selected ? selected.label : ''
})

// Cargar datos de la categoría para edición
const loadCategoryData = async () => {
  if (!props.categoryId) return

  isLoading.value = true
  errors.value = {}

  try {
    const category = await categoriesService.getCategoryById(props.categoryId)
    
    form.value = {
      name: category.name || '',
      description: category.description || '',
      comission: category.comission || false,
      comision_type: category.comision_type || '',
      comision_ammount: category.comision_ammount || '',
      startup: category.startup || false,
      startup_name: category.startup_name || ''
    }

    // Guardar valores originales para comparar
    originalValues.value = {
      name: form.value.name,
      description: form.value.description,
      comission: form.value.comission,
      comision_type: form.value.comision_type,
      comision_ammount: form.value.comision_ammount,
      startup: form.value.startup,
      startup_name: form.value.startup_name
    }
  } catch (error) {
    console.error('Error al cargar categoría:', error)
    errors.value.load = 'Error al cargar los datos de la categoría'
  } finally {
    isLoading.value = false
  }
}

// Validación
const validate = () => {
  errors.value = {}
  let isValid = true

  // Nombre
  if (!form.value.name.trim()) {
    errors.value.name = 'El nombre es obligatorio'
    isValid = false
  }

  // Descripción
  if (!form.value.description.trim()) {
    errors.value.description = 'La descripción es obligatoria'
    isValid = false
  }

  // Campos de comisión (requeridos si comission está activo)
  if (form.value.comission) {
    if (!form.value.comision_type) {
      errors.value.comision_type = 'Selecciona un tipo de comisión'
      isValid = false
    }
    if (!form.value.comision_ammount || form.value.comision_ammount <= 0) {
      errors.value.comision_ammount = 'Ingresa un monto de comisión válido'
      isValid = false
    }
  }

  // Startup name (requerido si startup está activo)
  if (form.value.startup && !form.value.startup_name.trim()) {
    errors.value.startup_name = 'El nombre de startup es obligatorio cuando startup está activo'
    isValid = false
  }

  return isValid
}

// Detectar qué campos han cambiado (para edición)
const getChangedFields = () => {
  const changed = {}

  if (form.value.name !== originalValues.value.name) {
    changed.name = form.value.name.trim()
  }

  if (form.value.description !== originalValues.value.description) {
    changed.description = form.value.description.trim()
  }

  if (form.value.comission !== originalValues.value.comission) {
    changed.comission = form.value.comission
  }

  if (form.value.comision_type !== originalValues.value.comision_type) {
    changed.comision_type = form.value.comission ? form.value.comision_type : ''
  }

  if (form.value.comision_ammount !== originalValues.value.comision_ammount) {
    changed.comision_ammount = form.value.comission ? Number(form.value.comision_ammount) : 0
  }

  if (form.value.startup !== originalValues.value.startup) {
    changed.startup = form.value.startup
  }

  if (form.value.startup_name !== originalValues.value.startup_name) {
    changed.startup_name = form.value.startup ? form.value.startup_name.trim() : ''
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

      await categoriesService.updateCategory(props.categoryId, changedFields)
      emit('success', { type: 'update', categoryId: props.categoryId, data: changedFields })
    } else {
      // Modo creación: enviar todos los campos
      const categoryData = {
        name: form.value.name.trim(),
        description: form.value.description.trim(),
        comission: form.value.comission,
        comision_type: form.value.comission ? form.value.comision_type : '',
        comision_ammount: form.value.comission ? Number(form.value.comision_ammount) : 0,
        startup: form.value.startup,
        startup_name: form.value.startup ? form.value.startup_name.trim() : ''
      }

      await categoriesService.createCategory(categoryData)
      emit('success', { type: 'create', data: categoryData })
    }

    handleClose()
  } catch (error) {
    console.error(`Error al ${isEditMode.value ? 'actualizar' : 'crear'} categoría:`, error)
    errors.value.submit = error.message || `Error al ${isEditMode.value ? 'actualizar' : 'crear'} la categoría`
  } finally {
    isSubmitting.value = false
  }
}

// Cerrar modal
const handleClose = () => {
  form.value = {
    name: '',
    description: '',
    comission: false,
    comision_type: '',
    comision_ammount: '',
    startup: false,
    startup_name: ''
  }
  originalValues.value = {}
  errors.value = {}
  emit('close')
}

// Cargar datos cuando se abre el modal
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    // Cargar opciones de comisión
    loadComissionOptions()
    
    if (isEditMode.value) {
      loadCategoryData()
    } else {
      // Resetear formulario para creación
      form.value = {
        name: '',
        description: '',
        comission: false,
        comision_type: '',
        comision_ammount: '',
        startup: false,
        startup_name: ''
      }
      errors.value = {}
    }
  }
})

// Limpiar campos de comisión cuando comission se desactiva
watch(() => form.value.comission, (newVal) => {
  if (!newVal) {
    form.value.comision_type = ''
    form.value.comision_ammount = ''
    // Limpiar errores si existían
    if (errors.value.comision_type) delete errors.value.comision_type
    if (errors.value.comision_ammount) delete errors.value.comision_ammount
  }
})

// Limpiar startup_name cuando startup se desactiva
watch(() => form.value.startup, (newVal) => {
  if (!newVal) {
    form.value.startup_name = ''
    // Limpiar error si existía
    if (errors.value.startup_name) {
      delete errors.value.startup_name
    }
  }
})

// Computed para verificar si el formulario es válido
const isFormValid = computed(() => {
  const baseValid = form.value.name.trim() !== '' && 
                    form.value.description.trim() !== ''
  
  // Validar campos de comisión si está activo
  if (form.value.comission) {
    if (!form.value.comision_type || !form.value.comision_ammount || form.value.comision_ammount <= 0) {
      return false
    }
  }
  
  // Validar startup
  if (form.value.startup) {
    return baseValid && form.value.startup_name.trim() !== ''
  }
  
  return baseValid
})

// Título del modal
const modalTitle = computed(() => {
  return isEditMode.value ? 'Editar Categoría' : 'Nueva Categoría'
})
</script>

<template>
  <Modal 
    :is-open="isOpen" 
    :title="modalTitle"
    size="medium"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="category-form">
      <!-- Loading de categoría -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner-small"></div>
        <span>Cargando datos de la categoría...</span>
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
          placeholder="Ej: Amigurumis, Accesorios"
          :class="{ 'error': errors.name }"
          :disabled="isLoading"
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
          placeholder="Describe la categoría de productos"
          rows="3"
          :class="{ 'error': errors.description }"
          :disabled="isLoading"
        ></textarea>
        <span v-if="errors.description" class="field-error">{{ errors.description }}</span>
      </div>

      <!-- Toggle Comisión -->
      <div class="form-group toggle-group">
        <label class="toggle-label">
          <span class="toggle-wrapper">
            <input
              type="checkbox"
              v-model="form.comission"
              class="toggle-input"
              :disabled="isLoading"
            />
            <span class="toggle-slider"></span>
          </span>
          <span class="toggle-text">
            <strong>Comisión</strong>
            <small>Indica si los ingresos para la crochetería serán solo de comisión por venta</small>
          </span>
        </label>
      </div>

      <!-- Campos de Comisión (condicionales) -->
      <transition name="slide-fade">
        <div v-if="form.comission" class="comission-fields">
          <!-- Tipo de Comisión (Radio buttons) -->
          <div class="form-group">
            <label>
              Tipo de comisión <span class="required">*</span>
            </label>
            
            <div v-if="isLoadingOptions" class="loading-options">
              <div class="spinner-small"></div>
              <span>Cargando opciones...</span>
            </div>
            
            <div v-else class="radio-group">
              <label 
                v-for="option in comissionOptions" 
                :key="option.value"
                class="radio-label"
                :class="{ 'selected': form.comision_type === option.value }"
              >
                <input
                  type="radio"
                  v-model="form.comision_type"
                  :value="option.value"
                  :disabled="isLoading"
                  class="radio-input"
                />
                <span class="radio-custom"></span>
                <span class="radio-text">{{ option.value }}</span>
              </label>
            </div>
            <span v-if="errors.comision_type" class="field-error">{{ errors.comision_type }}</span>
          </div>

          <!-- Monto de Comisión -->
          <div class="form-group">
            <label for="comision_ammount">
              Monto de comisión <span class="required">*</span>
            </label>
            <div class="input-with-suffix">
              <input
                type="number"
                id="comision_ammount"
                v-model="form.comision_ammount"
                placeholder="Ej: 10"
                min="0"
                step="0.01"
                :class="{ 'error': errors.comision_ammount }"
                :disabled="isLoading"
              />
              <span class="input-suffix">{{ selectedComissionLabel }}</span>
            </div>
            <span v-if="errors.comision_ammount" class="field-error">{{ errors.comision_ammount }}</span>
          </div>
        </div>
      </transition>

      <!-- Toggle Startup -->
      <div class="form-group toggle-group">
        <label class="toggle-label">
          <span class="toggle-wrapper">
            <input
              type="checkbox"
              v-model="form.startup"
              class="toggle-input"
              :disabled="isLoading"
            />
            <span class="toggle-slider"></span>
          </span>
          <span class="toggle-text">
            <strong>Emprendimiento</strong>
            <small>Indica si en esta categoría registraremos un emprendimiento o marca asociada</small>
          </span>
        </label>
      </div>

      <!-- Campo Nombre de Startup (condicional) -->
      <transition name="slide-fade">
        <div v-if="form.startup" class="form-group startup-name-field">
          <label for="startup_name">
            Nombre del emprendimiento <span class="required">*</span>
          </label>
          <input
            type="text"
            id="startup_name"
            v-model="form.startup_name"
            placeholder="Ej: Fuller, Avon, Tupperware"
            :class="{ 'error': errors.startup_name }"
            :disabled="isLoading"
          />
          <span v-if="errors.startup_name" class="field-error">{{ errors.startup_name }}</span>
        </div>
      </transition>
    </form>

    <template #footer>
      <button 
        type="button" 
        class="btn-outline" 
        @click="handleClose"
        :disabled="isSubmitting || isLoading"
      >
        Cancelar
      </button>
      <button 
        type="submit" 
        class="btn-primary" 
        @click="handleSubmit"
        :disabled="!isFormValid || isSubmitting || isLoading"
      >
        <span v-if="isSubmitting" class="spinner-small"></span>
        <span v-else>{{ isEditMode ? 'Guardar Cambios' : 'Crear Categoría' }}</span>
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.category-form {
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

.form-group input:disabled,
.form-group textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-background);
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

.loading-state {
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

/* Toggle Styles */
.toggle-group {
  padding: var(--spacing-md);
  background: var(--color-background);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.toggle-label {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  cursor: pointer;
  font-weight: normal;
}

.toggle-wrapper {
  position: relative;
  width: 50px;
  height: 26px;
  flex-shrink: 0;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border);
  transition: all var(--transition-fast);
  border-radius: 26px;
}

.toggle-slider::before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: all var(--transition-fast);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-input:checked + .toggle-slider {
  background-color: var(--color-secondary);
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(24px);
}

.toggle-input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-text strong {
  color: var(--color-text-primary);
  font-size: 1rem;
}

.toggle-text small {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  line-height: 1.4;
}

/* Comission Fields */
.comission-fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-left: var(--spacing-md);
  padding-left: var(--spacing-md);
  border-left: 3px solid var(--color-secondary);
}

/* Radio Group */
.radio-group {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.75rem 1rem;
  background: var(--color-white);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-weight: 500;
}

.radio-label:hover {
  border-color: var(--color-primary);
  background: rgba(107, 76, 154, 0.02);
}

.radio-label.selected {
  border-color: var(--color-primary);
  background: rgba(107, 76, 154, 0.05);
}

.radio-input {
  display: none;
}

.radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  position: relative;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.radio-label.selected .radio-custom {
  border-color: var(--color-primary);
}

.radio-label.selected .radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: var(--color-primary);
  border-radius: 50%;
}

.radio-text {
  color: var(--color-text-primary);
}

/* Input with Suffix */
.input-with-suffix {
  display: flex;
  align-items: stretch;
}

.input-with-suffix input {
  flex: 1;
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-border);
  border-right: none;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color var(--transition-fast);
}

.input-with-suffix input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(107, 76, 154, 0.1);
}

.input-with-suffix input.error {
  border-color: var(--color-error);
}

.input-suffix {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-left: none;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  font-weight: 600;
  color: var(--color-text-secondary);
  min-width: 50px;
  justify-content: center;
}

.input-with-suffix input:focus + .input-suffix {
  border-color: var(--color-primary);
}

/* Loading Options */
.loading-options {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

/* Startup Name Field */
.startup-name-field {
  margin-left: var(--spacing-md);
  padding-left: var(--spacing-md);
  border-left: 3px solid var(--color-primary);
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

