<script setup>
import { ref, computed, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { startupSupplyService } from '../services/startupSupplyService'
import { productsService } from '../services/productsService'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  supplyId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'success'])

// Determinar si es modo edición
const isEditMode = computed(() => !!props.supplyId)

// Formulario (precio siempre es 0 para emprendimientos)
const form = ref({
  product: null,
  quantity: 1
})

// Valores originales (para comparar cambios en edición)
const originalValues = ref({})

// Estado
const isLoading = ref(false)
const isSubmitting = ref(false)
const errors = ref({})

// Autocomplete de productos
const products = ref([])
const isLoadingProducts = ref(false)
const searchQuery = ref('')
const showDropdown = ref(false)
const filteredProducts = ref([])

// Verificar si un producto tiene alguna categoría con startup: true
const hasStartupCategory = (product) => {
  if (!product.categories || !Array.isArray(product.categories)) return false
  return product.categories.some(category => category.startup === true)
}

// Obtener el nombre del emprendimiento de un producto
const getStartupName = (product) => {
  if (!product.categories || !Array.isArray(product.categories)) return 'Emprendimiento'
  const startupCategory = product.categories.find(cat => cat.startup === true)
  return startupCategory?.startup_name || 'Emprendimiento'
}

// Cargar lista de productos (solo los que tienen categoría con startup: true)
const loadProducts = async () => {
  isLoadingProducts.value = true
  try {
    const allProducts = await productsService.getProducts()
    // Filtrar solo productos que tengan al menos una categoría con startup: true
    products.value = allProducts.filter(product => hasStartupCategory(product))
  } catch (error) {
    console.error('Error al cargar productos:', error)
  } finally {
    isLoadingProducts.value = false
  }
}

// Filtrar productos según búsqueda
const filterProducts = () => {
  if (!searchQuery.value.trim()) {
    filteredProducts.value = []
    return
  }
  
  const query = searchQuery.value.toLowerCase()
  filteredProducts.value = products.value.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.description?.toLowerCase().includes(query) ||
    getStartupName(product).toLowerCase().includes(query)
  ).slice(0, 10)
}

// Seleccionar producto del dropdown
const selectProduct = (product) => {
  form.value.product = product
  searchQuery.value = product.name
  showDropdown.value = false
  filteredProducts.value = []
}

// Limpiar selección de producto
const clearProduct = () => {
  form.value.product = null
  searchQuery.value = ''
  showDropdown.value = false
}

// Manejar input de búsqueda
const handleSearchInput = () => {
  showDropdown.value = true
  filterProducts()
  
  if (form.value.product && searchQuery.value !== form.value.product.name) {
    form.value.product = null
  }
}

// Manejar blur del input
const handleSearchBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

// Cargar datos del surtido para edición
const loadSupplyData = async () => {
  if (!props.supplyId) return

  isLoading.value = true
  errors.value = {}

  try {
    const supply = await startupSupplyService.getSupplyById(props.supplyId)
    
    const product = supply.product
    
    form.value = {
      product: product || null,
      quantity: supply.quantity || 1
    }
    
    if (product) {
      searchQuery.value = product.name
    }

    originalValues.value = {
      product_id: product?._id || null,
      quantity: form.value.quantity
    }
  } catch (error) {
    console.error('Error al cargar surtido:', error)
    errors.value.load = 'Error al cargar los datos del surtido'
  } finally {
    isLoading.value = false
  }
}

// Validación
const validate = () => {
  errors.value = {}
  let isValid = true

  if (!form.value.product) {
    errors.value.product = 'Selecciona un producto de emprendimiento'
    isValid = false
  }

  if (!form.value.quantity || form.value.quantity < 1) {
    errors.value.quantity = 'Ingresa una cantidad válida (mínimo 1)'
    isValid = false
  }

  return isValid
}

// Detectar qué campos han cambiado (para edición)
// Nota: El producto no se puede cambiar una vez creado el surtido
const getChangedFields = () => {
  const changed = {}

  if (Number(form.value.quantity) !== Number(originalValues.value.quantity)) {
    changed.quantity = Number(form.value.quantity)
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
      const changedFields = getChangedFields()

      if (Object.keys(changedFields).length === 0) {
        errors.value.submit = 'No hay cambios para guardar'
        isSubmitting.value = false
        return
      }

      await startupSupplyService.updateSupply(props.supplyId, changedFields)
      emit('success', { type: 'update', supplyId: props.supplyId, data: changedFields })
    } else {
      // Modo creación: precio siempre es 0 para emprendimientos
      const supplyData = {
        product: form.value.product._id,
        purchase_price: 0,
        quantity: Number(form.value.quantity),
        total_cost: 0
      }

      await startupSupplyService.createSupply(supplyData)
      emit('success', { type: 'create', data: supplyData })
    }

    handleClose()
  } catch (error) {
    console.error(`Error al ${isEditMode.value ? 'actualizar' : 'crear'} surtido:`, error)
    errors.value.submit = error.message || `Error al ${isEditMode.value ? 'actualizar' : 'crear'} el surtido`
  } finally {
    isSubmitting.value = false
  }
}

// Cerrar modal
const handleClose = () => {
  form.value = {
    product: null,
    quantity: 1
  }
  searchQuery.value = ''
  showDropdown.value = false
  filteredProducts.value = []
  originalValues.value = {}
  errors.value = {}
  emit('close')
}

// Cargar datos cuando se abre el modal
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadProducts()
    
    if (isEditMode.value) {
      loadSupplyData()
    } else {
      form.value = {
        product: null,
        quantity: 1
      }
      searchQuery.value = ''
      errors.value = {}
    }
  }
})

// Computed para verificar si el formulario es válido
const isFormValid = computed(() => {
  return form.value.product !== null && 
         form.value.quantity && 
         Number(form.value.quantity) >= 1
})

// Título del modal
const modalTitle = computed(() => {
  return isEditMode.value ? 'Editar Surtido' : 'Nuevo Surtido de Emprendimiento'
})
</script>

<template>
  <Modal 
    :is-open="isOpen" 
    :title="modalTitle"
    size="medium"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="supply-form">
      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner-small"></div>
        <span>Cargando datos del surtido...</span>
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

      <!-- Info de emprendimiento -->
      <div class="info-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>Los productos de emprendimientos se surten sin costo (precio $0)</span>
      </div>

      <!-- Buscador de Producto - Solo en modo creación -->
      <div class="form-group">
        <label for="product">
          Producto de Emprendimiento <span class="required">*</span>
        </label>
        
        <!-- Modo Edición: Mostrar producto estático -->
        <div v-if="isEditMode && form.product" class="static-product">
          <div class="static-product-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="static-product-info">
            <span class="static-product-name">{{ form.product.name }}</span>
            <span class="static-product-startup">🚀 {{ getStartupName(form.product) }}</span>
          </div>
          <div class="static-product-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Bloqueado</span>
          </div>
        </div>
        
        <!-- Modo Creación: Autocomplete -->
        <div v-else class="autocomplete-container">
          <div class="search-input-wrapper" :class="{ 'has-selection': form.product }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              id="product"
              v-model="searchQuery"
              @input="handleSearchInput"
              @focus="handleSearchInput"
              @blur="handleSearchBlur"
              placeholder="Buscar producto de emprendimiento..."
              :class="{ 'error': errors.product }"
              :disabled="isLoading"
              autocomplete="off"
            />
            <button 
              v-if="form.product"
              type="button"
              class="clear-btn"
              @click="clearProduct"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <!-- Dropdown de resultados -->
          <div 
            v-if="showDropdown && (filteredProducts.length > 0 || isLoadingProducts || (searchQuery && filteredProducts.length === 0))"
            class="autocomplete-dropdown"
          >
            <div v-if="isLoadingProducts" class="dropdown-loading">
              <div class="spinner-small"></div>
              <span>Cargando productos...</span>
            </div>
            <template v-else>
              <div 
                v-for="product in filteredProducts"
                :key="product._id"
                class="dropdown-item"
                @mousedown="selectProduct(product)"
              >
                <div class="dropdown-item-info">
                  <span class="dropdown-item-name">{{ product.name }}</span>
                  <span class="dropdown-item-startup">🚀 {{ getStartupName(product) }}</span>
                </div>
              </div>
              <div v-if="filteredProducts.length === 0 && searchQuery" class="dropdown-empty">
                <span>No se encontraron productos de emprendimiento</span>
                <small>Solo se muestran productos con emprendimiento activo</small>
              </div>
            </template>
          </div>
        </div>
        
        <!-- Producto seleccionado -->
        <div v-if="form.product && !isEditMode" class="selected-product">
          <div class="selected-product-info">
            <span class="selected-label">Producto seleccionado:</span>
            <span class="selected-name">{{ form.product.name }}</span>
            <span class="selected-startup">🚀 {{ getStartupName(form.product) }}</span>
          </div>
        </div>
        
        <span v-if="errors.product" class="field-error">{{ errors.product }}</span>
      </div>

      <!-- Cantidad -->
      <div class="form-group">
        <label for="quantity">
          Cantidad a surtir <span class="required">*</span>
        </label>
        <input
          type="number"
          id="quantity"
          v-model="form.quantity"
          placeholder="1"
          min="1"
          :class="{ 'error': errors.quantity }"
          :disabled="isLoading"
        />
        <span v-if="errors.quantity" class="field-error">{{ errors.quantity }}</span>
      </div>

      <!-- Resumen (costo siempre 0) -->
      <div class="summary-section">
        <div class="summary-row">
          <span class="summary-label">Costo Total:</span>
          <span class="summary-value free">$0.00 MXN</span>
        </div>
        <span class="summary-hint">{{ form.quantity || 0 }} unidades × $0.00 (Sin costo)</span>
      </div>
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
        <span v-else>{{ isEditMode ? 'Guardar Cambios' : 'Registrar Surtido' }}</span>
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.supply-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-group > label {
  font-weight: 600;
  color: var(--color-text-primary);
}

.required {
  color: var(--color-error);
}

.form-group input[type="number"] {
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color var(--transition-fast);
}

.form-group input[type="number"]:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(107, 76, 154, 0.1);
}

.form-group input.error {
  border-color: var(--color-error);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-background);
}

/* Info Banner */
.info-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: rgba(45, 143, 92, 0.1);
  border: 1px solid rgba(45, 143, 92, 0.2);
  border-radius: var(--radius-md);
  color: var(--color-secondary);
  font-size: 0.9rem;
}

.info-banner svg {
  flex-shrink: 0;
}

/* Autocomplete */
.autocomplete-container {
  position: relative;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0 1rem;
  background: var(--color-white);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.search-input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(107, 76, 154, 0.1);
}

.search-input-wrapper.has-selection {
  border-color: var(--color-secondary);
  background: rgba(45, 143, 92, 0.02);
}

.search-input-wrapper svg {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.search-input-wrapper input {
  flex: 1;
  border: none;
  padding: 0.875rem 0;
  font-size: 1rem;
  outline: none;
  background: transparent;
}

.clear-btn {
  padding: 0.25rem;
  background: var(--color-background);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  background: var(--color-error);
  color: white;
}

/* Static Product (Modo Edición) */
.static-product {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: linear-gradient(135deg, rgba(45, 143, 92, 0.05), rgba(45, 143, 92, 0.1));
  border: 2px solid var(--color-secondary);
  border-radius: var(--radius-md);
}

.static-product-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--color-secondary);
  color: white;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.static-product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.static-product-name {
  font-weight: 700;
  color: var(--color-text-primary);
  font-size: 1.05rem;
}

.static-product-startup {
  font-size: 0.85rem;
  color: var(--color-secondary);
}

.static-product-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background: rgba(45, 143, 92, 0.1);
  color: var(--color-secondary);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}

/* Autocomplete Dropdown */
.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-white);
  border: 2px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  box-shadow: var(--shadow-md);
  max-height: 250px;
  overflow-y: auto;
  z-index: 100;
}

.dropdown-loading {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.dropdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background var(--transition-fast);
  border-bottom: 1px solid var(--color-border);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: rgba(45, 143, 92, 0.05);
}

.dropdown-item-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.dropdown-item-name {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.dropdown-item-startup {
  font-size: 0.8rem;
  color: var(--color-secondary);
}

.dropdown-empty {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--color-text-muted);
}

.dropdown-empty span {
  display: block;
  font-size: 0.9rem;
}

.dropdown-empty small {
  display: block;
  margin-top: var(--spacing-xs);
  font-size: 0.8rem;
  opacity: 0.7;
}

/* Selected Product */
.selected-product {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-md);
  background: rgba(45, 143, 92, 0.05);
  border: 1px solid rgba(45, 143, 92, 0.2);
  border-radius: var(--radius-md);
}

.selected-product-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.selected-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.selected-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.selected-startup {
  font-size: 0.85rem;
  color: var(--color-secondary);
}

/* Summary Section */
.summary-section {
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(45, 143, 92, 0.05), rgba(45, 143, 92, 0.1));
  border-radius: var(--radius-md);
  border: 1px solid rgba(45, 143, 92, 0.2);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.summary-value.free {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-secondary);
}

.summary-hint {
  display: block;
  margin-top: var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--color-text-muted);
  text-align: right;
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

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

