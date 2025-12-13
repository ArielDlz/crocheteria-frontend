<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePermissions } from '@/modules/auth'
import { startupSupplyService } from '../services/startupSupplyService'
import StartupSupplyModal from '../components/StartupSupplyModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

// Permisos
const { canCreate, canUpdate, canDelete } = usePermissions()

// Estado
const supplies = ref([])
const isLoading = ref(true)
const error = ref(null)
const isModalOpen = ref(false)
const editingSupplyId = ref(null)
const isDeleteDialogOpen = ref(false)
const supplyToDelete = ref(null)
const isDeleting = ref(false)

// Filtros
const searchQuery = ref('')

// Cargar surtidos
const loadSupplies = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    supplies.value = await startupSupplyService.getSupplies()
  } catch (err) {
    console.error('Error al cargar surtidos:', err)
    error.value = err.message || 'Error al cargar los surtidos'
  } finally {
    isLoading.value = false
  }
}

// Surtidos filtrados
const filteredSupplies = computed(() => {
  let result = supplies.value

  // Filtrar por búsqueda (nombre del producto)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(supply => 
      supply.product?.name?.toLowerCase().includes(query)
    )
  }

  return result
})

// Calcular totales
const totalItems = computed(() => {
  return filteredSupplies.value.reduce((sum, s) => sum + (s.quantity || 0), 0)
})

// Obtener el nombre del emprendimiento desde las categorías del producto
const getStartupName = (product) => {
  if (!product?.categories || !Array.isArray(product.categories)) return 'Emprendimiento'
  const startupCategory = product.categories.find(cat => cat.startup === true)
  return startupCategory?.startup_name || 'Emprendimiento'
}

// Acciones
const handleAddSupply = () => {
  editingSupplyId.value = null
  isModalOpen.value = true
}

const handleEditSupply = (supply) => {
  editingSupplyId.value = supply._id
  isModalOpen.value = true
}

const handleModalSuccess = async () => {
  await loadSupplies()
}

const handleCloseModal = () => {
  isModalOpen.value = false
  editingSupplyId.value = null
}

const handleDeleteSupply = (supply) => {
  supplyToDelete.value = supply
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!supplyToDelete.value) return

  isDeleting.value = true
  
  try {
    await startupSupplyService.deleteSupply(supplyToDelete.value._id)
    await loadSupplies()
    isDeleteDialogOpen.value = false
    supplyToDelete.value = null
  } catch (err) {
    console.error('Error al eliminar surtido:', err)
    error.value = err.message || 'Error al eliminar el surtido'
    isDeleteDialogOpen.value = false
    supplyToDelete.value = null
  } finally {
    isDeleting.value = false
  }
}

const closeDeleteDialog = () => {
  isDeleteDialogOpen.value = false
  supplyToDelete.value = null
}

// Limpiar filtros
const clearFilters = () => {
  searchQuery.value = ''
}

// Cargar datos al montar
onMounted(() => {
  loadSupplies()
})
</script>

<template>
  <div class="supplies-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-info">
        <h1>🚀 Surtir Emprendimientos</h1>
        <p>Registro de surtido de productos de emprendimientos asociados</p>
      </div>
      
      <!-- Botón Agregar -->
      <button 
        v-if="canCreate('inventory')"
        class="btn-primary"
        @click="handleAddSupply"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Nuevo Surtido
      </button>
    </header>

    <!-- Resumen -->
    <div class="summary-cards">
      <div class="summary-card">
        <span class="summary-label">Unidades Surtidas</span>
        <span class="summary-value">{{ totalItems }}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Registros</span>
        <span class="summary-value">{{ filteredSupplies.length }}</span>
      </div>
      <div class="summary-card info">
        <span class="summary-label">Tipo</span>
        <span class="summary-value-text">Sin costo (Emprendimiento)</span>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <div class="search-box">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Buscar por producto..."
        />
      </div>

      <button 
        v-if="searchQuery"
        class="btn-outline btn-sm"
        @click="clearFilters"
      >
        Limpiar filtros
      </button>
    </div>

    <!-- Contenido -->
    <div class="page-content">
      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando surtidos...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <div class="error-actions">
          <button class="btn-secondary" @click="loadSupplies">Reintentar</button>
          <button class="btn-outline" @click="error = null">Cerrar</button>
        </div>
      </div>

      <!-- Tabla de surtidos -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Emprendimiento</th>
              <th>Cantidad</th>
              <th>Costo</th>
              <th class="actions-column">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredSupplies.length === 0">
              <td colspan="5" class="empty-row">
                <div class="empty-state-inline">
                  <span>📭</span>
                  <p v-if="searchQuery">No se encontraron surtidos con los filtros aplicados</p>
                  <p v-else>No hay surtidos registrados</p>
                </div>
              </td>
            </tr>
            <tr v-for="supply in filteredSupplies" :key="supply._id">
              <!-- Producto -->
              <td>
                <div class="product-info">
                  <span class="product-name">{{ supply.product?.name || 'Producto eliminado' }}</span>
                  <span class="product-description">{{ supply.product?.description || '' }}</span>
                </div>
              </td>

              <!-- Emprendimiento -->
              <td>
                <span class="startup-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  {{ getStartupName(supply.product) }}
                </span>
              </td>

              <!-- Cantidad -->
              <td>
                <span class="quantity-badge">{{ supply.quantity }} unidades</span>
              </td>

              <!-- Costo -->
              <td>
                <span class="cost-free">$0.00 MXN</span>
              </td>

              <!-- Acciones -->
              <td class="actions-cell">
                <div class="actions-wrapper">
                  <!-- Botón Editar -->
                  <button 
                    v-if="canUpdate('inventory')"
                    class="action-btn edit"
                    @click="handleEditSupply(supply)"
                    title="Editar surtido"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>

                  <!-- Botón Eliminar -->
                  <button 
                    v-if="canDelete('inventory')"
                    class="action-btn delete"
                    @click="handleDeleteSupply(supply)"
                    title="Eliminar surtido"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>

                  <!-- Sin acciones disponibles -->
                  <span 
                    v-if="!canUpdate('inventory') && !canDelete('inventory')"
                    class="no-actions"
                  >
                    -
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Crear/Editar -->
    <StartupSupplyModal
      :is-open="isModalOpen"
      :supply-id="editingSupplyId"
      @close="handleCloseModal"
      @success="handleModalSuccess"
    />

    <!-- Diálogo de Confirmación para Eliminar -->
    <ConfirmDialog
      :is-open="isDeleteDialogOpen"
      title="Eliminar Surtido"
      :message="`¿Estás seguro de que deseas eliminar el surtido de '${supplyToDelete?.product?.name}'? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      type="danger"
      :is-loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="closeDeleteDialog"
    />
  </div>
</template>

<style scoped>
.supplies-page {
  animation: fadeIn 0.4s ease-out;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.header-info h1 {
  font-size: 1.75rem;
  margin-bottom: var(--spacing-xs);
}

.header-info p {
  color: var(--color-text-secondary);
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.summary-card {
  background: var(--color-white);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.summary-card.info {
  background: linear-gradient(135deg, rgba(107, 76, 154, 0.05), rgba(107, 76, 154, 0.1));
  border: 1px solid rgba(107, 76, 154, 0.2);
}

.summary-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.summary-value-text {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-secondary);
}

/* Filters Bar */
.filters-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.5rem 1rem;
  background: var(--color-white);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  flex: 1;
  min-width: 200px;
  max-width: 350px;
}

.search-box svg {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.search-box input {
  border: none;
  outline: none;
  font-size: 0.95rem;
  width: 100%;
  background: transparent;
}

.search-box:focus-within {
  border-color: var(--color-primary);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

/* Content */
.page-content {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-md);
  text-align: center;
}

.error-icon {
  font-size: 3rem;
}

.error-state p {
  color: var(--color-error);
  max-width: 500px;
}

.error-actions {
  display: flex;
  gap: var(--spacing-md);
}

/* Table */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.data-table th {
  background: var(--color-background);
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.data-table tbody tr:hover {
  background: rgba(107, 76, 154, 0.02);
}

/* Product Info */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.product-description {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Startup Badge */
.startup-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background: rgba(45, 143, 92, 0.1);
  color: var(--color-secondary);
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 500;
}

/* Quantity Badge */
.quantity-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(107, 76, 154, 0.1);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 500;
}

/* Cost Free */
.cost-free {
  font-weight: 600;
  color: var(--color-secondary);
  font-size: 0.95rem;
}

/* Actions Column */
.actions-column {
  width: 120px;
  text-align: center !important;
}

.actions-cell {
  text-align: center !important;
}

.actions-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
  flex-shrink: 0;
  background: transparent;
}

.action-btn svg {
  display: block;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.action-btn.edit {
  background: rgba(107, 76, 154, 0.1);
  color: var(--color-primary);
}

.action-btn.edit:hover {
  background: var(--color-primary);
  color: white;
}

.action-btn.delete {
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
}

.action-btn.delete:hover {
  background: var(--color-error);
  color: white;
}

.no-actions {
  color: var(--color-text-muted);
}

/* Empty State */
.empty-row {
  text-align: center;
}

.empty-state-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xl);
  gap: var(--spacing-sm);
}

.empty-state-inline span {
  font-size: 2rem;
}

.empty-state-inline p {
  color: var(--color-text-muted);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }

  .product-description {
    max-width: 150px;
  }
}
</style>

