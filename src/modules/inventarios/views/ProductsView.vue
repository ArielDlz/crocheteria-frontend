<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePermissions } from '@/modules/auth'
import { productsService } from '../services/productsService'
import { categoriesService } from '../services/categoriesService'
import ProductModal from '../components/ProductModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

// Permisos
const { canCreate, canUpdate, canDelete } = usePermissions()

// Estado
const products = ref([])
const categories = ref([])
const isLoading = ref(true)
const error = ref(null)
const isModalOpen = ref(false)
const editingProductId = ref(null)
const isDeleteDialogOpen = ref(false)
const productToDelete = ref(null)
const isDeleting = ref(false)

// Filtros
const searchQuery = ref('')
const selectedCategory = ref('')

// Cargar productos
const loadProducts = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    products.value = await productsService.getProducts()
  } catch (err) {
    console.error('Error al cargar productos:', err)
    error.value = err.message || 'Error al cargar los productos'
  } finally {
    isLoading.value = false
  }
}

// Cargar categorías para filtros y referencias
const loadCategories = async () => {
  try {
    categories.value = await categoriesService.getCategories()
  } catch (err) {
    console.error('Error al cargar categorías:', err)
  }
}

// Productos filtrados
const filteredProducts = computed(() => {
  let result = products.value

  // Filtrar por búsqueda
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    )
  }

  // Filtrar por categoría (las categorías ahora son objetos con _id)
  if (selectedCategory.value) {
    result = result.filter(product => 
      product.categories?.some(cat => cat._id === selectedCategory.value)
    )
  }

  return result
})

// Formatear precio
const formatPrice = (price) => {
  if (price === undefined || price === null) return '-'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price)
}

// Acciones
const handleAddProduct = () => {
  editingProductId.value = null
  isModalOpen.value = true
}

const handleEditProduct = (product) => {
  editingProductId.value = product._id
  isModalOpen.value = true
}

const handleModalSuccess = async () => {
  await loadProducts()
}

const handleCloseModal = () => {
  isModalOpen.value = false
  editingProductId.value = null
}

const handleDeleteProduct = (product) => {
  // Validar que el producto no tenga stock antes de permitir eliminar
  const stock = product.stock || 0
  
  if (stock > 0) {
    error.value = `No es posible eliminar el producto "${product.name}" porque tiene ${stock} unidades en stock. Primero debes reducir el stock a cero.`
    return
  }
  
  productToDelete.value = product
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!productToDelete.value) return

  isDeleting.value = true
  
  try {
    await productsService.deleteProduct(productToDelete.value._id)
    await loadProducts()
    isDeleteDialogOpen.value = false
    productToDelete.value = null
  } catch (err) {
    console.error('Error al eliminar producto:', err)
    error.value = err.message || 'Error al eliminar el producto'
    isDeleteDialogOpen.value = false
    productToDelete.value = null
  } finally {
    isDeleting.value = false
  }
}

const closeDeleteDialog = () => {
  isDeleteDialogOpen.value = false
  productToDelete.value = null
}

// Limpiar filtros
const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
}

// Cargar datos al montar
onMounted(() => {
  loadProducts()
  loadCategories()
})
</script>

<template>
  <div class="products-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-info">
        <h1>📦 Productos</h1>
        <p>Gestiona el catálogo de productos</p>
      </div>
      
      <!-- Botón Agregar -->
      <button 
        v-if="canCreate('inventory')"
        class="btn-primary"
        @click="handleAddProduct"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Nuevo Producto
      </button>
    </header>

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
          placeholder="Buscar productos..."
        />
      </div>

      <select v-model="selectedCategory" class="filter-select">
        <option value="">Todas las categorías</option>
        <option 
          v-for="category in categories" 
          :key="category._id" 
          :value="category._id"
        >
          {{ category.name }}
        </option>
      </select>

      <button 
        v-if="searchQuery || selectedCategory"
        class="btn-outline btn-sm"
        @click="clearFilters"
      >
        Limpiar filtros
      </button>

      <span class="results-count">
        {{ filteredProducts.length }} producto{{ filteredProducts.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Contenido -->
    <div class="page-content">
      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando productos...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <div class="error-actions">
          <button class="btn-secondary" @click="loadProducts">Reintentar</button>
          <button class="btn-outline" @click="error = null">Cerrar</button>
        </div>
      </div>

      <!-- Tabla de productos -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categorías</th>
              <th>Existencias disponibles</th>
              <th>Precio de Venta</th>
              <th class="actions-column">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredProducts.length === 0">
              <td colspan="4" class="empty-row">
                <div class="empty-state-inline">
                  <span>📭</span>
                  <p v-if="searchQuery || selectedCategory">No se encontraron productos con los filtros aplicados</p>
                  <p v-else>No hay productos registrados</p>
                </div>
              </td>
            </tr>
            <tr v-for="product in filteredProducts" :key="product._id">
              <!-- Producto (nombre y descripción) -->
              <td>
                <div class="product-info">
                  <span class="product-name">{{ product.name }}</span>
                  <span class="product-description">{{ product.description || 'Sin descripción' }}</span>
                </div>
              </td>

              <!-- Categorías -->
              <td>
                <div class="categories-list">
                  <span 
                    v-if="product.categories && product.categories.length > 0"
                    v-for="category in product.categories" 
                    :key="category._id"
                    class="category-tag"
                  >
                    {{ category.name }}
                  </span>
                  <span v-else class="text-muted">Sin categoría</span>
                </div>
              </td>
              <!-- Existencias disponibles -->
              <td>
                <span class="stock-text">{{ product.stock }}</span>
              </td> 
              <!-- Precio de Venta -->
              <td>
                <span class="price-text">{{ formatPrice(product.sell_price) }}</span>
              </td>

              <!-- Acciones -->
              <td class="actions-cell">
                <div class="actions-wrapper">
                  <!-- Botón Editar -->
                  <button 
                    v-if="canUpdate('inventory')"
                    class="action-btn edit"
                    @click="handleEditProduct(product)"
                    title="Editar producto"
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
                    @click="handleDeleteProduct(product)"
                    title="Eliminar producto"
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
    <ProductModal
      :is-open="isModalOpen"
      :product-id="editingProductId"
      :categories="categories"
      @close="handleCloseModal"
      @success="handleModalSuccess"
    />

    <!-- Diálogo de Confirmación para Eliminar -->
    <ConfirmDialog
      :is-open="isDeleteDialogOpen"
      title="Eliminar Producto"
      :message="`¿Estás seguro de que deseas eliminar el producto '${productToDelete?.name}'? Esta acción no se puede deshacer.`"
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
.products-page {
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

.filter-select {
  padding: 0.6rem 2rem 0.6rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  background: var(--color-white);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b6b6b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.results-count {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-left: auto;
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
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Categories */
.categories-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.category-tag {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: rgba(107, 76, 154, 0.1);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
}

.text-muted {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

/* Price */
.price-text {
  font-weight: 600;
  color: var(--color-secondary);
  font-size: 1rem;
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

  .results-count {
    margin-left: 0;
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

