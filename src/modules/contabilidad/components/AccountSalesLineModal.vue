<script setup>
import { ref, watch, computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { contabilidadService } from '../services/contabilidadService'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  salesLine: {
    type: Object,
    default: null
  },
  saleIndex: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close', 'success'])

// Formulario
const form = ref({
  profit: 0,
  rent: 0,
  investment: 0,
  startup: {
    id: null,
    amount: 0
  }
})

// Estado
const isSubmitting = ref(false)
const errors = ref({})

// Inicializar formulario cuando se abre el modal o cambia la línea
watch(() => [props.isOpen, props.salesLine], ([isOpen, line]) => {
  if (isOpen && line) {
    // Valores por defecto desde la línea
    form.value = {
      profit: line.potential_profit || 0,
      rent: line.rent_amount || 0,
      investment: line.line_total_cost || 0,
      startup: {
        id: line.startup_id || null,
        amount: line.startup_comission || 0
      }
    }
    errors.value = {}
  }
}, { immediate: true })

// Calcular total ingresado
const totalEntered = computed(() => {
  let total = (form.value.profit || 0) + (form.value.rent || 0) + (form.value.investment || 0)
  if (props.salesLine?.startup && form.value.startup.amount) {
    total += (form.value.startup.amount || 0)
  }
  return total
})

// Obtener total de ingreso esperado
const expectedTotal = computed(() => {
  return props.salesLine?.line_total || 0
})

// Verificar si el total es válido
const isTotalValid = computed(() => {
  return Math.abs(totalEntered.value - expectedTotal.value) <= 0.01
})

// Validación
const validate = () => {
  errors.value = {}
  let isValid = true

  // Profit
  if (form.value.profit < 0) {
    errors.value.profit = 'La ganancia no puede ser negativa'
    isValid = false
  }

  // Rent
  if (form.value.rent < 0) {
    errors.value.rent = 'La renta no puede ser negativa'
    isValid = false
  }

  // Investment
  if (form.value.investment < 0) {
    errors.value.investment = 'La inversión no puede ser negativa'
    isValid = false
  }

  // Startup (solo si es startup)
  if (props.salesLine?.startup) {
    if (!form.value.startup.id) {
      errors.value.startupId = 'El ID del startup es requerido'
      isValid = false
    }
    if (form.value.startup.amount < 0) {
      errors.value.startupAmount = 'El monto del startup no puede ser negativo'
      isValid = false
    }
  }

  // Validar que la suma sea igual al ingreso total
  const total = totalEntered.value
  const expected = expectedTotal.value
  if (Math.abs(total - expected) > 0.01) { // Usar 0.01 para manejar errores de punto flotante
    errors.value.total = `La suma de las cantidades (${formatPrice(total)}) debe ser igual al ingreso total (${formatPrice(expected)})`
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
    const accountsData = {
      profit: form.value.profit,
      rent: form.value.rent,
      investment: form.value.investment
    }

    // Solo incluir startup si la línea es startup
    if (props.salesLine?.startup && form.value.startup.id) {
      accountsData.startup = {
        id: form.value.startup.id,
        amount: form.value.startup.amount
      }
    }

    await contabilidadService.accountSalesLine(
      props.salesLine.sale_id,
      props.saleIndex,
      { accounts: accountsData }
    )
    
    emit('success')
  } catch (err) {
    console.error('Error al contabilizar línea:', err)
    errors.value.submit = err.message || 'Error al contabilizar la línea. Por favor, intenta nuevamente.'
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

// Formatear precio
const formatPrice = (price) => {
  if (price === undefined || price === null) return '$0.00'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price)
}

// Información de referencia
const referenceInfo = computed(() => {
  if (!props.salesLine) return null
  return {
    product: props.salesLine.product,
    lineTotal: props.salesLine.line_total,
    lineTotalCost: props.salesLine.line_total_cost,
    potentialProfit: props.salesLine.potential_profit,
    remainingProfit: props.salesLine.remaining_profit_after_rent
  }
})
</script>

<template>
  <Modal 
    :is-open="isOpen" 
    title="Contabilizar Línea de Venta"
    size="medium"
    @close="handleClose"
  >
    <div class="account-form">
      <!-- Información de referencia -->
      <div v-if="referenceInfo" class="reference-info">
        <div class="info-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <h3>Información de la Línea</h3>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Producto:</span>
            <span class="info-value">{{ referenceInfo.product }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Ingreso Total:</span>
            <span class="info-value">{{ formatPrice(referenceInfo.lineTotal) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Inversión (referencia):</span>
            <span class="info-value">{{ formatPrice(referenceInfo.lineTotalCost) }}</span>
          </div>
        </div>
      </div>

      <!-- Error general -->
      <div v-if="errors.submit" class="error-message">
        <span class="error-icon">⚠️</span>
        <span>{{ errors.submit }}</span>
      </div>

      <!-- Formulario -->
      <div class="form-section">
        <h4 class="section-title">Valores a Contabilizar</h4>
        
        <div class="form-table">
          <div class="form-row">
            <div class="form-label-cell">
              <label for="investment">Inversión <span class="required">*</span></label>
              <span class="field-hint">Ref: {{ formatPrice(referenceInfo?.lineTotalCost || 0) }}</span>
            </div>
            <div class="form-input-cell">
              <div class="input-wrapper">
                <span class="currency-symbol">$</span>
                <input
                  id="investment"
                  v-model.number="form.investment"
                  type="number"
                  step="0.01"
                  min="0"
                  class="form-input"
                  :class="{ 'error': errors.investment }"
                  placeholder="0.00"
                  :disabled="isSubmitting"
                />
              </div>
              <span v-if="errors.investment" class="error-text">{{ errors.investment }}</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-label-cell">
              <label for="profit">Ganancia <span class="required">*</span></label>
              <span class="field-hint">Ref: {{ formatPrice(referenceInfo?.potentialProfit || 0) }}</span>
            </div>
            <div class="form-input-cell">
              <div class="input-wrapper">
                <span class="currency-symbol">$</span>
                <input
                  id="profit"
                  v-model.number="form.profit"
                  type="number"
                  step="0.01"
                  min="0"
                  class="form-input"
                  :class="{ 'error': errors.profit }"
                  placeholder="0.00"
                  :disabled="isSubmitting"
                />
              </div>
              <span v-if="errors.profit" class="error-text">{{ errors.profit }}</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-label-cell">
              <label for="rent">Renta</label>
              <span class="field-hint">Renta asociada</span>
            </div>
            <div class="form-input-cell">
              <div class="input-wrapper">
                <span class="currency-symbol">$</span>
                <input
                  id="rent"
                  v-model.number="form.rent"
                  type="number"
                  step="0.01"
                  min="0"
                  class="form-input"
                  :class="{ 'error': errors.rent }"
                  placeholder="0.00"
                  :disabled="isSubmitting"
                />
              </div>
              <span v-if="errors.rent" class="error-text">{{ errors.rent }}</span>
            </div>
          </div>

          <!-- Campos de Startup (solo si es startup) -->
          <template v-if="salesLine?.startup">
            <div class="form-divider"></div>
            
            <div class="form-row">
              <div class="form-label-cell">
                <label for="startupId">ID del Startup <span class="required">*</span></label>
              </div>
              <div class="form-input-cell">
                <input
                  id="startupId"
                  v-model="form.startup.id"
                  type="text"
                  class="form-input"
                  :class="{ 'error': errors.startupId }"
                  placeholder="507f1f77bcf86cd799439011"
                  :disabled="isSubmitting"
                />
                <span v-if="errors.startupId" class="error-text">{{ errors.startupId }}</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-label-cell">
                <label for="startupAmount">Monto del Startup <span class="required">*</span></label>
                <span class="field-hint">Ref: {{ formatPrice(salesLine?.startup_comission || 0) }}</span>
              </div>
              <div class="form-input-cell">
                <div class="input-wrapper">
                  <span class="currency-symbol">$</span>
                  <input
                    id="startupAmount"
                    v-model.number="form.startup.amount"
                    type="number"
                    step="0.01"
                    min="0"
                    class="form-input"
                    :class="{ 'error': errors.startupAmount }"
                    placeholder="0.00"
                    :disabled="isSubmitting"
                  />
                </div>
                <span v-if="errors.startupAmount" class="error-text">{{ errors.startupAmount }}</span>
              </div>
            </div>
          </template>

          <!-- Resumen de totales -->
          <div class="form-divider"></div>
          
          <div class="form-row total-row">
            <div class="form-label-cell">
              <label class="total-label">Total Ingresado</label>
            </div>
            <div class="form-input-cell">
              <div class="total-amount" :class="{ 'error': errors.total, 'success': !errors.total && Math.abs(totalEntered - expectedTotal) < 0.01 }">
                {{ formatPrice(totalEntered) }}
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-label-cell">
              <label class="total-label">Ingreso Total (Esperado)</label>
            </div>
            <div class="form-input-cell">
              <div class="expected-amount">
                {{ formatPrice(expectedTotal) }}
              </div>
            </div>
          </div>

          <!-- Error de validación de total -->
          <div v-if="errors.total" class="error-total">
            <span class="error-icon">⚠️</span>
            <span>{{ errors.total }}</span>
          </div>
        </div>
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
        :disabled="isSubmitting || !isTotalValid"
        @click="handleSubmit"
      >
        <span v-if="isSubmitting" class="btn-loading">
          <div class="spinner-small"></div>
          Contabilizando...
        </span>
        <span v-else>Contabilizar</span>
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.account-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.reference-info {
  padding: var(--spacing-md);
  background: rgba(107, 76, 154, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(107, 76, 154, 0.2);
}

.info-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.info-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.info-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-primary);
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

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  padding-bottom: var(--spacing-xs);
  border-bottom: 2px solid var(--color-border);
}

.form-table {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  align-items: flex-start;
  padding: var(--spacing-sm) 0;
}

.form-label-cell {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-label-cell label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.required {
  color: var(--color-error);
}

.field-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.form-input-cell {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
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
  font-size: 1rem;
  font-weight: 500;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-white);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
  text-align: right;
}

.form-input[type="text"] {
  padding-left: var(--spacing-md);
  padding-right: var(--spacing-md);
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

.error-text {
  font-size: 0.85rem;
  color: var(--color-error);
}

.form-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--spacing-sm) 0;
  grid-column: 1 / -1;
}

.total-row {
  padding-top: var(--spacing-sm);
  border-top: 2px solid var(--color-border);
  margin-top: var(--spacing-xs);
}

.total-label {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.total-amount {
  font-size: 1.1rem;
  font-weight: 700;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  text-align: right;
  color: var(--color-text-primary);
}

.total-amount.success {
  background: rgba(45, 143, 92, 0.1);
  color: var(--color-secondary);
}

.total-amount.error {
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
}

.expected-amount {
  font-size: 1rem;
  font-weight: 600;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  text-align: right;
  color: var(--color-text-secondary);
  background: var(--color-background);
}

.error-total {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  border: 1px solid rgba(229, 62, 62, 0.3);
  margin-top: var(--spacing-xs);
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

