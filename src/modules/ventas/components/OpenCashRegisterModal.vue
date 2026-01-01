<script setup>
import { ref, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { cashRegisterService } from '../services/cashRegisterService'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'success'])

// Formulario
const form = ref({
  initial_balance: 0,
  opening_notes: ''
})

// Estado
const isSubmitting = ref(false)
const errors = ref({})

// Resetear formulario cuando se abre el modal
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    form.value = {
      initial_balance: 0,
      opening_notes: ''
    }
    errors.value = {}
  }
})

// Validación
const validate = () => {
  errors.value = {}
  let isValid = true

  // Balance inicial
  if (!form.value.initial_balance || form.value.initial_balance < 0) {
    errors.value.initial_balance = 'El balance inicial debe ser mayor o igual a 0'
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
    await cashRegisterService.openCashRegister({
      initial_balance: form.value.initial_balance,
      opening_notes: form.value.opening_notes.trim() || '',
      opened_by: props.userId
    })
    
    emit('success')
  } catch (err) {
    console.error('Error al abrir la caja:', err)
    errors.value.submit = err.message || 'Error al abrir la caja. Por favor, intenta nuevamente.'
  } finally {
    isSubmitting.value = false
  }
}

// Cerrar modal
const handleClose = () => {
  if (!isSubmitting.value) {
    emit('close')
  }
}
</script>

<template>
  <Modal 
    :is-open="isOpen" 
    title="Abrir Caja Registradora"
    size="medium"
    @close="handleClose"
  >
    <div class="open-cash-register-form">
      <div class="form-info">
        <div class="info-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <p class="info-text">
          Para realizar ventas, es necesario tener una caja abierta. Por favor, ingresa el balance inicial y las notas de apertura.
        </p>
      </div>

      <!-- Error general -->
      <div v-if="errors.submit" class="error-message">
        <span class="error-icon">⚠️</span>
        <span>{{ errors.submit }}</span>
      </div>

      <!-- Formulario -->
      <div class="form-group">
        <label for="initial_balance" class="form-label">
          Balance Inicial <span class="required">*</span>
        </label>
        <div class="input-wrapper">
          <span class="currency-symbol">$</span>
          <input
            id="initial_balance"
            v-model.number="form.initial_balance"
            type="number"
            step="0.01"
            min="0"
            class="form-input"
            :class="{ 'error': errors.initial_balance }"
            placeholder="0.00"
            :disabled="isSubmitting"
          />
        </div>
        <span v-if="errors.initial_balance" class="error-text">{{ errors.initial_balance }}</span>
      </div>

      <div class="form-group">
        <label for="opening_notes" class="form-label">
          Notas de Apertura
        </label>
        <textarea
          id="opening_notes"
          v-model="form.opening_notes"
          class="form-textarea"
          rows="4"
          placeholder="Notas opcionales sobre la apertura de caja..."
          :disabled="isSubmitting"
        ></textarea>
      </div>
    </div>

    <template #footer>
      <button 
        type="button" 
        class="btn-outline" 
        :disabled="isSubmitting"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button 
        type="button" 
        class="btn-primary"
        :disabled="isSubmitting"
        @click="handleSubmit"
      >
        <span v-if="isSubmitting" class="btn-loading">
          <div class="spinner-small"></div>
          Abriendo...
        </span>
        <span v-else>Abrir Caja</span>
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.open-cash-register-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-info {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(107, 76, 154, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(107, 76, 154, 0.2);
}

.info-icon {
  display: flex;
  align-items: flex-start;
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.info-text {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  line-height: 1.5;
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  border: 1px solid rgba(229, 62, 62, 0.3);
}

.error-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.required {
  color: var(--color-error);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-symbol {
  position: absolute;
  left: var(--spacing-md);
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 1.1rem;
  z-index: 1;
}

.form-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) 2.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-white);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
  text-align: right;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(107, 76, 154, 0.1);
}

.form-input.error {
  border-color: var(--color-error);
}

.form-input:disabled {
  background: var(--color-background);
  cursor: not-allowed;
  opacity: 0.7;
}

.form-textarea {
  width: 100%;
  padding: var(--spacing-md);
  font-size: 0.95rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-white);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
  font-family: inherit;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(107, 76, 154, 0.1);
}

.form-textarea:disabled {
  background: var(--color-background);
  cursor: not-allowed;
  opacity: 0.7;
}

.error-text {
  font-size: 0.85rem;
  color: var(--color-error);
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  justify-content: center;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

