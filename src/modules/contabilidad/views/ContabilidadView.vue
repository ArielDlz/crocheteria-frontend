<script setup>
import { ref, onMounted, computed } from 'vue'
import { contabilidadService } from '../services/contabilidadService'
import AccountSalesLineModal from '../components/AccountSalesLineModal.vue'

// Estado
const salesLines = ref([])
const isLoading = ref(true)
const error = ref(null)
const isAccountModalOpen = ref(false)
const selectedLine = ref(null)
const selectedLineIndex = ref(0)

// Cargar líneas de venta
const loadSalesLines = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    salesLines.value = await contabilidadService.getSalesLines()
  } catch (err) {
    console.error('Error al cargar líneas de venta:', err)
    error.value = err.message || 'Error al cargar las líneas de venta'
  } finally {
    isLoading.value = false
  }
}

// No filtrar, mostrar todas las líneas
// const unaccountedLines = computed(() => {
//   return salesLines.value.filter(line => !line.accounted)
// })

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

// Obtener ganancia según si es startup o no
const getProfit = (line) => {
  if (line.startup) {
    return line.startup_comission !== null && line.startup_comission !== undefined 
      ? line.startup_comission 
      : 0
  }
  return line.potential_profit || 0
}

// Abrir modal para contabilizar línea
const openAccountModal = (line) => {
  if (line.accounted) return
  
  selectedLine.value = line
  selectedLineIndex.value = line.index // Usar el campo index de la línea
  isAccountModalOpen.value = true
}

// Cerrar modal
const closeAccountModal = () => {
  isAccountModalOpen.value = false
  selectedLine.value = null
  selectedLineIndex.value = 0
}

// Manejar éxito de contabilización
const handleAccountSuccess = async () => {
  closeAccountModal()
  // Recargar las líneas después de contabilizar
  await loadSalesLines()
}

// Cargar datos al montar
onMounted(() => {
  loadSalesLines()
})
</script>

<template>
  <div class="contabilidad-page">
    <header class="page-header">
      <div>
        <h1>Contabilidad</h1>
        <p>Gestión de líneas de venta para contabilización</p>
      </div>
      <button class="btn-primary" @click="loadSalesLines" :disabled="isLoading">
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
      <p>Cargando líneas de venta...</p>
    </div>

    <!-- Estado de error -->
    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadSalesLines">Reintentar</button>
    </div>

    <!-- Tabla de líneas -->
    <div v-else class="table-container">
      <div class="table-header">
        <div class="table-summary">
          <span class="summary-label">Líneas pendientes de contabilizar:</span>
          <span class="summary-value">{{ salesLines.filter(line => !line.accounted).length }}</span>
        </div>
      </div>
      <table class="sales-lines-table">
        <thead>
          <tr>
            <th>Fecha de Venta</th>
            <th>Producto</th>
            <th>Piezas</th>
            <th>Ingreso Total</th>
            <th>Inversión</th>
            <th>Ganancia</th>
            <th>Renta</th>
            <th>Ganancia Real</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="salesLines.length === 0">
            <td colspan="9" class="empty-row">
              <span class="empty-icon">📦</span>
              <p>No hay líneas de venta</p>
            </td>
          </tr>
          <tr v-for="line in salesLines" :key="`${line.sale_id}-${line.product}`">
            <td>{{ formatDate(line.date) }}</td>
            <td class="product-name">{{ line.product }}</td>
            <td class="quantity-cell">{{ line.quantity }}</td>
            <td class="amount-cell">{{ formatPrice(line.line_total) }}</td>
            <td class="amount-cell">{{ formatPrice(line.line_total_cost) }}</td>
            <td class="amount-cell profit">{{ formatPrice(getProfit(line)) }}</td>
            <td class="amount-cell">{{ formatPrice(line.rent_amount) }}</td>
            <td class="amount-cell profit-real">{{ formatPrice(line.remaining_profit_after_rent) }}</td>
            <td>
              <button 
                v-if="!line.accounted"
                class="btn-account"
                @click="openAccountModal(line)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Contabilizar
              </button>
              <span v-else class="accounted-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Contabilizado
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de Contabilización -->
    <AccountSalesLineModal
      :is-open="isAccountModalOpen"
      :sales-line="selectedLine"
      :sale-index="selectedLineIndex"
      @close="closeAccountModal"
      @success="handleAccountSuccess"
    />
  </div>
</template>

<style scoped>
.contabilidad-page {
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

.table-header {
  padding: var(--spacing-lg);
  border-bottom: 2px solid var(--color-border);
  background: var(--color-background);
}

.table-summary {
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

.sales-lines-table {
  width: 100%;
  border-collapse: collapse;
}

.sales-lines-table thead {
  background: var(--color-background);
  border-bottom: 2px solid var(--color-border);
}

.sales-lines-table th {
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sales-lines-table tbody tr {
  border-bottom: 1px solid var(--color-border);
  transition: background-color var(--transition-fast);
}

.sales-lines-table tbody tr:hover {
  background: var(--color-background);
}

.sales-lines-table tbody tr:last-child {
  border-bottom: none;
}

.sales-lines-table td {
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

.product-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.quantity-cell {
  text-align: center;
  font-weight: 600;
  color: var(--color-text-primary);
}

.amount-cell {
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: right;
}

.amount-cell.profit {
  color: var(--color-secondary);
}

.amount-cell.profit-real {
  color: var(--color-secondary);
  font-weight: 700;
}

/* Botón contabilizar */
.btn-account {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-secondary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 120px;
}

.btn-account:hover {
  background: var(--color-secondary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-account:active {
  transform: translateY(0);
}

/* Badge contabilizado */
.accounted-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: rgba(45, 143, 92, 0.1);
  color: var(--color-secondary);
  border: 1px solid rgba(45, 143, 92, 0.2);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 120px;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  justify-content: center;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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
  .sales-lines-table {
    font-size: 0.875rem;
  }
  
  .sales-lines-table th,
  .sales-lines-table td {
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
  
  .sales-lines-table {
    min-width: 1000px;
  }
}
</style>

