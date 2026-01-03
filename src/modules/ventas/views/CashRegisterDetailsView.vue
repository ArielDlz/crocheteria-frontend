<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { cashRegisterService } from '../services/cashRegisterService'

const route = useRoute()
const router = useRouter()

// Estado
const cashRegister = ref(null)
const payments = ref([])
const isLoading = ref(true)
const error = ref(null)

const cashRegisterId = computed(() => route.params.id)

// Cargar detalles de la caja
const loadCashRegisterDetails = async () => {
  if (!cashRegisterId.value) {
    error.value = 'ID de caja no válido'
    isLoading.value = false
    return
  }

  isLoading.value = true
  error.value = null
  
  try {
    const response = await cashRegisterService.getCashRegisterById(cashRegisterId.value)
    cashRegister.value = response.cashRegister
    payments.value = response.payments || []
  } catch (err) {
    console.error('Error al cargar detalles de la caja:', err)
    error.value = err.message || 'Error al cargar los detalles de la caja'
  } finally {
    isLoading.value = false
  }
}

// Formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Formatear precio
const formatPrice = (price) => {
  if (price === undefined || price === null) return '-'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price)
}

// Obtener nombre del usuario
const getUserName = (user) => {
  if (!user) return 'N/A'
  return `${user.name || ''} ${user.family_name || user.familyName || ''}`.trim() || user.email || 'Usuario'
}

// Obtener texto del estado
const getStatusText = (status) => {
  switch (status) {
    case 'open':
      return 'Abierta'
    case 'closed':
      return 'Cerrada'
    default:
      return status || 'N/A'
  }
}

// Obtener clase del estado
const getStatusClass = (status) => {
  switch (status) {
    case 'open':
      return 'status-open'
    case 'closed':
      return 'status-closed'
    default:
      return 'status-unknown'
  }
}

// Obtener nombre del método de pago
const getPaymentMethodName = (method) => {
  const methodNames = {
    'cash': 'Efectivo',
    'card': 'Tarjeta',
    'transfer': 'Transferencia',
    'other': 'Otro'
  }
  return methodNames[method] || method || 'N/A'
}

// Calcular total de pagos
const totalPayments = computed(() => {
  return payments.value.reduce((sum, payment) => sum + (payment.ammount || 0), 0)
})

// Volver a la lista
const goBack = () => {
  router.push('/ventas/control-caja')
}

// Cargar datos al montar
onMounted(() => {
  loadCashRegisterDetails()
})
</script>

<template>
  <div class="cash-register-details-page">
    <header class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Volver
        </button>
        <div>
          <h1>Detalles de Caja</h1>
          <p>Información completa y pagos registrados</p>
        </div>
      </div>
      <button class="btn-primary" @click="loadCashRegisterDetails" :disabled="isLoading">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
        </svg>
        Actualizar
      </button>
    </header>

    <!-- Estado de carga -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando detalles de la caja...</p>
    </div>

    <!-- Estado de error -->
    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadCashRegisterDetails">Reintentar</button>
    </div>

    <!-- Contenido -->
    <div v-else-if="cashRegister" class="details-content">
      <!-- Información de la caja -->
      <div class="info-card">
        <h2 class="card-title">Información de la Caja</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Estado</span>
            <span class="status-badge" :class="getStatusClass(cashRegister.status)">
              {{ getStatusText(cashRegister.status) }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Balance Inicial</span>
            <span class="info-value amount">{{ formatPrice(cashRegister.initial_balance) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Balance Actual</span>
            <span class="info-value amount">{{ formatPrice(cashRegister.current_balance) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Diferencia</span>
            <span class="info-value amount" :class="{
              'positive': (cashRegister.current_balance - cashRegister.initial_balance) > 0,
              'negative': (cashRegister.current_balance - cashRegister.initial_balance) < 0
            }">
              {{ formatPrice(cashRegister.current_balance - cashRegister.initial_balance) }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Fecha de Apertura</span>
            <span class="info-value">{{ formatDate(cashRegister.opened_at) }}</span>
          </div>
          <div class="info-item" v-if="cashRegister.closed_at">
            <span class="info-label">Fecha de Cierre</span>
            <span class="info-value">{{ formatDate(cashRegister.closed_at) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Abierta por</span>
            <span class="info-value">{{ getUserName(cashRegister.opened_by) }}</span>
          </div>
          <div class="info-item" v-if="cashRegister.opening_notes">
            <span class="info-label">Notas de Apertura</span>
            <span class="info-value">{{ cashRegister.opening_notes }}</span>
          </div>
        </div>
      </div>

      <!-- Pagos registrados -->
      <div class="payments-card">
        <div class="card-header">
          <h2 class="card-title">Pagos Registrados</h2>
          <div class="payments-summary">
            <span class="summary-label">Total de pagos:</span>
            <span class="summary-value">{{ formatPrice(totalPayments) }}</span>
            <span class="summary-count">({{ payments.length }} pago{{ payments.length !== 1 ? 's' : '' }})</span>
          </div>
        </div>

        <div v-if="payments.length === 0" class="empty-state">
          <span class="empty-icon">💳</span>
          <p>No hay pagos registrados en esta caja</p>
        </div>

        <div v-else class="payments-table-container">
          <table class="payments-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Venta ID</th>
                <th>Monto de Venta</th>
                <th>Método de Pago</th>
                <th>Monto Pagado</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in payments" :key="payment._id">
                <td>{{ formatDate(payment.payment_date) }}</td>
                <td>
                  <span class="sale-id">{{ payment.sale?._id?.substring(0, 8) || 'N/A' }}</span>
                </td>
                <td class="amount-cell">{{ formatPrice(payment.sale?.total_ammount) }}</td>
                <td>
                  <span class="payment-method-badge">{{ getPaymentMethodName(payment.payment_method) }}</span>
                </td>
                <td class="amount-cell">{{ formatPrice(payment.ammount) }}</td>
                <td>{{ getUserName(payment.user) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cash-register-details-page {
  animation: fadeIn 0.5s ease-out;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
  flex: 1;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.btn-back:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.page-header h1 {
  font-size: 1.75rem;
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
}

.page-header p {
  color: var(--color-text-secondary);
  margin: 0;
}

.page-header button.btn-primary {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

/* Estados de carga y error */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  text-align: center;
  color: var(--color-text-muted);
}

.loading-state .spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state .error-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.error-state button {
  margin-top: var(--spacing-md);
}

/* Contenido */
.details-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.info-card,
.payments-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-xl);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-lg) 0;
}

/* Información de la caja */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
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
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1rem;
  color: var(--color-text-primary);
}

.info-value.amount {
  font-weight: 600;
  font-size: 1.1rem;
}

.info-value.amount.positive {
  color: var(--color-secondary);
}

.info-value.amount.negative {
  color: var(--color-error);
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: fit-content;
}

.status-open {
  background: rgba(45, 143, 92, 0.1);
  color: var(--color-secondary);
}

.status-closed {
  background: rgba(107, 114, 128, 0.1);
  color: #6B7280;
}

.status-unknown {
  background: rgba(245, 158, 11, 0.1);
  color: #D97706;
}

/* Pagos */
.payments-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.payments-summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.summary-label {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
}

.summary-count {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.payments-table-container {
  overflow-x: auto;
}

.payments-table {
  width: 100%;
  border-collapse: collapse;
}

.payments-table thead {
  background: var(--color-background);
  border-bottom: 2px solid var(--color-border);
}

.payments-table th {
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.payments-table tbody tr {
  border-bottom: 1px solid var(--color-border);
  transition: background-color var(--transition-fast);
}

.payments-table tbody tr:hover {
  background: var(--color-background);
}

.payments-table tbody tr:last-child {
  border-bottom: none;
}

.payments-table td {
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.sale-id {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  background: var(--color-background);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
}

.amount-cell {
  font-weight: 600;
  color: var(--color-text-primary);
}

.payment-method-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 500;
  background: rgba(107, 76, 154, 0.1);
  color: var(--color-primary);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .payments-card .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
  
  .header-left {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .payments-table {
    font-size: 0.875rem;
    min-width: 700px;
  }
  
  .payments-table th,
  .payments-table td {
    padding: var(--spacing-sm) var(--spacing-md);
  }
}
</style>

