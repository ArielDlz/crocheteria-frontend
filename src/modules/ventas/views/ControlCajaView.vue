<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { cashRegisterService } from '../services/cashRegisterService'

const router = useRouter()

// Estado
const cashRegisters = ref([])
const isLoading = ref(true)
const error = ref(null)

// Cargar cajas
const loadCashRegisters = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    cashRegisters.value = await cashRegisterService.getCashRegisters()
  } catch (err) {
    console.error('Error al cargar cajas:', err)
    error.value = err.message || 'Error al cargar las cajas registradoras'
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
    month: 'short',
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

// Ver detalles de la caja
const viewDetails = (cashRegister) => {
  router.push(`/ventas/control-caja/${cashRegister._id}`)
}

// Cargar datos al montar
onMounted(() => {
  loadCashRegisters()
})
</script>

<template>
  <div class="control-caja-page">
    <header class="page-header">
      <div>
        <h1>Control de Caja</h1>
        <p>Resumen de todas las cajas registradoras</p>
      </div>
      <button class="btn-primary" @click="loadCashRegisters" :disabled="isLoading">
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
      <p>Cargando cajas registradoras...</p>
    </div>

    <!-- Estado de error -->
    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadCashRegisters">Reintentar</button>
    </div>

    <!-- Tabla de cajas -->
    <div v-else class="table-container">
      <table class="cash-registers-table">
        <thead>
          <tr>
            <th>Fecha de Apertura</th>
            <th>Fecha de Cierre</th>
            <th>Estado</th>
            <th>Balance Inicial</th>
            <th>Balance Actual</th>
            <th>Abierta por</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cashRegisters.length === 0">
            <td colspan="7" class="empty-row">
              <span class="empty-icon">📦</span>
              <p>No hay cajas registradoras</p>
            </td>
          </tr>
          <tr v-for="cashRegister in cashRegisters" :key="cashRegister._id">
            <td>{{ formatDate(cashRegister.opened_at) }}</td>
            <td>{{ formatDate(cashRegister.closed_at) }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(cashRegister.status)">
                {{ getStatusText(cashRegister.status) }}
              </span>
            </td>
            <td class="amount-cell">{{ formatPrice(cashRegister.initial_balance) }}</td>
            <td class="amount-cell">{{ formatPrice(cashRegister.current_balance) }}</td>
            <td>{{ getUserName(cashRegister.opened_by) }}</td>
            <td>
              <button class="btn-view-details" @click="viewDetails(cashRegister)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Ver Detalles
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.control-caja-page {
  animation: fadeIn 0.5s ease-out;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
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

.page-header button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
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

/* Tabla */
.table-container {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.cash-registers-table {
  width: 100%;
  border-collapse: collapse;
}

.cash-registers-table thead {
  background: var(--color-background);
  border-bottom: 2px solid var(--color-border);
}

.cash-registers-table th {
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cash-registers-table tbody tr {
  border-bottom: 1px solid var(--color-border);
  transition: background-color var(--transition-fast);
}

.cash-registers-table tbody tr:hover {
  background: var(--color-background);
}

.cash-registers-table tbody tr:last-child {
  border-bottom: none;
}

.cash-registers-table td {
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.empty-row {
  text-align: center;
  padding: var(--spacing-2xl) !important;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.amount-cell {
  font-weight: 600;
  color: var(--color-text-primary);
}

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

/* Botón ver detalles */
.btn-view-details {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-view-details:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-view-details:active {
  transform: translateY(0);
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
  .cash-registers-table {
    font-size: 0.875rem;
  }
  
  .cash-registers-table th,
  .cash-registers-table td {
    padding: var(--spacing-sm) var(--spacing-md);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  .cash-registers-table {
    min-width: 800px;
  }
}
</style>


