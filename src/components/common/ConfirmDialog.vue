<script setup>
import Modal from './Modal.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirmar acción'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirmar'
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  },
  variant: {
    type: String,
    default: 'danger', // danger, warning, info
    validator: (value) => ['danger', 'warning', 'info'].includes(value)
  }
})

const emit = defineEmits(['close', 'confirm'])

const handleConfirm = () => {
  emit('confirm')
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <Modal 
    :is-open="isOpen" 
    :title="title"
    size="small"
    @close="handleClose"
  >
    <div class="confirm-dialog">
      <div class="confirm-icon" :class="variant">
        <svg v-if="variant === 'danger'" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <svg v-else-if="variant === 'warning'" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <svg v-else width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </div>
      
      <p class="confirm-message">{{ message }}</p>
    </div>

    <template #footer>
      <button 
        type="button" 
        class="btn-outline" 
        @click="handleClose"
      >
        {{ cancelText }}
      </button>
      <button 
        type="button" 
        class="btn-primary"
        :class="{ 'btn-danger': variant === 'danger' }"
        @click="handleConfirm"
      >
        {{ confirmText }}
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.confirm-dialog {
  text-align: center;
  padding: var(--spacing-md) 0;
}

.confirm-icon {
  margin: 0 auto var(--spacing-lg);
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-icon.danger {
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
}

.confirm-icon.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}

.confirm-icon.info {
  background: rgba(107, 76, 154, 0.1);
  color: var(--color-primary);
}

.confirm-icon svg {
  display: block;
}

.confirm-message {
  font-size: 1rem;
  color: var(--color-text-primary);
  line-height: 1.6;
  margin: 0;
}

.btn-danger {
  background: linear-gradient(135deg, var(--color-error), #B91C1C) !important;
  border-color: var(--color-error) !important;
}

.btn-danger:hover {
  background: var(--color-error) !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(229, 62, 62, 0.35);
}
</style>

