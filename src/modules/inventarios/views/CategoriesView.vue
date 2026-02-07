<script setup>
import { ref, onMounted } from 'vue'
import { usePermissions } from '@/modules/auth'
import { categoriesService } from '../services/categoriesService'
import CategoryModal from '../components/CategoryModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

// Permisos
const { canCreate, canUpdate, canDelete } = usePermissions()

// Estado
const categories = ref([])
const isLoading = ref(true)
const error = ref(null)
const isModalOpen = ref(false)
const editingCategoryId = ref(null)
const isDeleteDialogOpen = ref(false)
const categoryToDelete = ref(null)
const isDeleting = ref(false)

// Cargar categorías
const loadCategories = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    categories.value = await categoriesService.getCategories()
  } catch (err) {
    console.error('Error al cargar categorías:', err)
    error.value = err.message || 'Error al cargar las categorías'
  } finally {
    isLoading.value = false
  }
}

// Acciones
const handleAddCategory = () => {
  editingCategoryId.value = null
  isModalOpen.value = true
}

const handleEditCategory = (category) => {
  editingCategoryId.value = category._id
  isModalOpen.value = true
}

const handleModalSuccess = async () => {
  await loadCategories()
}

const handleCloseModal = () => {
  isModalOpen.value = false
  editingCategoryId.value = null
}

const handleDeleteCategory = (category) => {
  categoryToDelete.value = category
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!categoryToDelete.value) return

  isDeleting.value = true
  
  try {
    await categoriesService.deleteCategory(categoryToDelete.value._id)
    await loadCategories()
    isDeleteDialogOpen.value = false
    categoryToDelete.value = null
  } catch (err) {
    console.error('Error al eliminar categoría:', err)
    error.value = err.message || 'Error al eliminar la categoría'
    isDeleteDialogOpen.value = false
    categoryToDelete.value = null
  } finally {
    isDeleting.value = false
  }
}

const closeDeleteDialog = () => {
  isDeleteDialogOpen.value = false
  categoryToDelete.value = null
}

// Cargar datos al montar
onMounted(() => {
  loadCategories()
})
</script>

<template>
  <div class="categories-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-info">
        <h1>🏷️ Categorías de Productos</h1>
        <p>Gestiona las categorías para organizar tus productos</p>
      </div>
      
      <!-- Botón Agregar -->
      <button 
        v-if="canCreate('inventory')"
        class="btn-primary"
        @click="handleAddCategory"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Nueva Categoría
      </button>
    </header>

    <!-- Contenido -->
    <div class="page-content">
      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando categorías...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button class="btn-secondary" @click="loadCategories">Reintentar</button>
      </div>

      <!-- Tabla de categorías -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Comisión</th>
              <th>Monto de la comisión</th>
              <th>Emprendimiento</th>
              <th>Nombre del emprendimiento</th>
              <th class="actions-column">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="categories.length === 0">
              <td colspan="7" class="empty-row">
                <div class="empty-state-inline">
                  <span>📭</span>
                  <p>No hay categorías registradas</p>
                </div>
              </td>
            </tr>
            <tr v-for="category in categories" :key="category._id">
              <!-- Nombre -->
              <td>
                <span class="category-name">{{ category.name }}</span>
              </td>

              <!-- Descripción -->
              <td>
                <span class="description-text">{{ category.description || '-' }}</span>
              </td>

              <!-- Comisión -->
              <td>
                <span 
                  class="toggle-badge"
                  :class="category.comision ? 'active' : 'inactive'"
                >
                  {{ category.comision ? 'Sí' : 'No' }}
                </span>
              </td>

              <!-- Monto de la comisión -->
              <td>
                <template v-if="category.comision">
                  <!-- Si el tipo es Producto, mostrar mensaje especial -->
                  <template v-if="category.comision_type === 'Producto' || category.comision_type === 'Por producto'">
                    <span class="product-commission-text">Definido por producto</span>
                  </template>
                  <!-- Si tiene monto, mostrar monto y tipo -->
                  <template v-else-if="category.comision_ammount">
                    <span class="amount-text">{{ category.comision_ammount }}</span>
                    <span class="currency-text">{{ category.comision_type === 'Porcentaje' ? ' %' : ' MXN' }}</span>
                  </template>
                  <!-- Si no tiene monto pero tiene comisión activa -->
                  <span v-else class="text-muted">-</span>
                </template>
                <span v-else class="text-muted">-</span>
              </td>

              <!-- Startup -->
              <td>
                <span 
                  class="toggle-badge"
                  :class="category.startup ? 'active' : 'inactive'"
                >
                  {{ category.startup ? 'Sí' : 'No' }}
                </span>
              </td>

              <!-- Nombre Startup -->
              <td>
                <span v-if="category.startup" class="startup-name">
                  {{ category.startup_name || '-' }}
                </span>
                <span v-else class="text-muted">-</span>
              </td>

              <!-- Acciones -->
              <td class="actions-cell">
                <div class="actions-wrapper">
                  <!-- Botón Editar -->
                  <button 
                    v-if="canUpdate('inventory')"
                    class="action-btn edit"
                    @click="handleEditCategory(category)"
                    title="Editar categoría"
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
                    @click="handleDeleteCategory(category)"
                    title="Eliminar categoría"
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
    <CategoryModal
      :is-open="isModalOpen"
      :category-id="editingCategoryId"
      @close="handleCloseModal"
      @success="handleModalSuccess"
    />

    <!-- Diálogo de Confirmación para Eliminar -->
    <ConfirmDialog
      :is-open="isDeleteDialogOpen"
      title="Eliminar Categoría"
      :message="`¿Estás seguro de que deseas eliminar la categoría '${categoryToDelete?.name}'? Esta acción no se puede deshacer.`"
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
.categories-page {
  animation: fadeIn 0.4s ease-out;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
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

/* Category Name */
.category-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

/* Description */
.description-text {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  max-width: 250px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Toggle Badge */
.toggle-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 500;
}

.toggle-badge.active {
  background: rgba(45, 143, 92, 0.1);
  color: var(--color-secondary);
}

.toggle-badge.inactive {
  background: rgba(107, 114, 128, 0.1);
  color: var(--color-text-muted);
}

/* Startup Name */
.startup-name {
  font-weight: 500;
  color: var(--color-primary);
}

.text-muted {
  color: var(--color-text-muted);
}

/* Product Commission Text */
.product-commission-text {
  font-style: italic;
  color: var(--color-primary);
  font-size: 0.9rem;
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

  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }

  .description-text {
    max-width: 150px;
  }
}
</style>

