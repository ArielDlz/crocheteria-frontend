<script setup>
import { ref, computed, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { purchasesService } from '../services/purchasesService'
import { productsService } from '../services/productsService'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  purchaseId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'success'])

// Determinar si es modo edición
const isEditMode = computed(() => !!props.purchaseId)

// Formulario
const form = ref({
  product: null, // Objeto del producto seleccionado
  purchase_price: '',
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

// Cargar lista de productos
const loadProducts = async () => {
  isLoadingProducts.value = true
  try {
    products.value = await productsService.getProducts()
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
    product.description?.toLowerCase().includes(query)
  ).slice(0, 10) // Limitar a 10 resultados
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
  
  // Si el texto no coincide con el producto seleccionado, limpiar selección
  if (form.value.product && searchQuery.value !== form.value.product.name) {
    form.value.product = null
  }
}

// Manejar blur del input
const handleSearchBlur = () => {
  // Delay para permitir click en dropdown
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

// Costo total calculado
const totalCost = computed(() => {
  const price = Number(form.value.purchase_price) || 0
  const qty = Number(form.value.quantity) || 0
  return price * qty
})

// Cargar datos de la compra para edición
const loadPurchaseData = async () => {
  if (!props.purchaseId) return

  isLoading.value = true
  errors.value = {}

  try {
    const purchase = await purchasesService.getPurchaseById(props.purchaseId)
    
    // Buscar el producto completo
    const product = purchase.product
    
    form.value = {
      product: product || null,
      purchase_price: purchase.purchase_price || '',
      quantity: purchase.quantity || 1
    }
    
    // Actualizar el campo de búsqueda con el nombre del producto
    if (product) {
      searchQuery.value = product.name
    }

    // Guardar valores originales para comparar
    originalValues.value = {
      product_id: product?._id || null,
      purchase_price: form.value.purchase_price,
      quantity: form.value.quantity
    }
  } catch (error) {
    console.error('Error al cargar compra:', error)
    errors.value.load = 'Error al cargar los datos de la compra'
  } finally {
    isLoading.value = false
  }
}

// Validación
const validate = () => {
  errors.value = {}
  let isValid = true

  // Producto
  if (!form.value.product) {
    errors.value.product = 'Selecciona un producto'
    isValid = false
  }

  // Precio de compra
  if (!form.value.purchase_price || form.value.purchase_price <= 0) {
    errors.value.purchase_price = 'Ingresa un precio de compra válido'
    isValid = false
  }

  // Cantidad
  if (!form.value.quantity || form.value.quantity < 1) {
    errors.value.quantity = 'Ingresa una cantidad válida (mínimo 1)'
    isValid = false
  }

  return isValid
}

// Detectar qué campos han cambiado (para edición)
// Nota: El producto no se puede cambiar una vez creada la compra
const getChangedFields = () => {
  const changed = {}

  if (Number(form.value.purchase_price) !== Number(originalValues.value.purchase_price)) {
    changed.purchase_price = Number(form.value.purchase_price)
  }

  if (Number(form.value.quantity) !== Number(originalValues.value.quantity)) {
    changed.quantity = Number(form.value.quantity)
  }

  // Siempre recalcular el total si cambia precio o cantidad
  if (changed.purchase_price !== undefined || changed.quantity !== undefined) {
    changed.total_cost = totalCost.value
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
      // Modo edición: solo enviar campos modificados
      const changedFields = getChangedFields()

      if (Object.keys(changedFields).length === 0) {
        errors.value.submit = 'No hay cambios para guardar'
        isSubmitting.value = false
        return
      }

      await purchasesService.updatePurchase(props.purchaseId, changedFields)
      emit('success', { type: 'update', purchaseId: props.purchaseId, data: changedFields })
    } else {
      // Modo creación: enviar todos los campos
      const purchaseData = {
        product: form.value.product._id,
        purchase_price: Number(form.value.purchase_price),
        quantity: Number(form.value.quantity),
        total_cost: totalCost.value
      }

      await purchasesService.createPurchase(purchaseData)
      emit('success', { type: 'create', data: purchaseData })
    }

    handleClose()
  } catch (error) {
    console.error(`Error al ${isEditMode.value ? 'actualizar' : 'crear'} compra:`, error)
    errors.value.submit = error.message || `Error al ${isEditMode.value ? 'actualizar' : 'crear'} la compra`
  } finally {
    isSubmitting.value = false
  }
}

// Cerrar modal
const handleClose = () => {
  form.value = {
    product: null,
    purchase_price: '',
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
      loadPurchaseData()
    } else {
      // Resetear formulario para creación
      form.value = {
        product: null,
        purchase_price: '',
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
         form.value.purchase_price && 
         Number(form.value.purchase_price) > 0 &&
         form.value.quantity && 
         Number(form.value.quantity) >= 1
})

// Título del modal
const modalTitle = computed(() => {
  return isEditMode.value ? 'Editar Compra' : 'Nueva Compra'
})

// Formatear precio
const formatPrice = (price) => {
  if (price === undefined || price === null) return '$0.00'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price)
}
</script>

<template>
  <Modal 
    :is-open="isOpen" 
    :title="modalTitle"
    size="medium"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="purchase-form">
      <!-- Loading de compra -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner-small"></div>
        <span>Cargando datos de la compra...</span>
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

      <!-- Buscador de Producto (Autocomplete) - Solo en modo creación -->
      <div class="form-group">
        <label for="product">
          Producto <span class="required">*</span>
        </label>
        
        <!-- Modo Edición: Mostrar producto estático (no editable) -->
        <div v-if="isEditMode && form.product" class="static-product">
          <div class="static-product-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
          </div>
          <div class="static-product-info">
            <span class="static-product-name">{{ form.product.name }}</span>
            <span class="static-product-desc">{{ form.product.description || 'Sin descripción' }}</span>
            <span class="static-product-price">Precio venta: {{ formatPrice(form.product.sell_price) }}</span>
          </div>
          <div class="static-product-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Bloqueado</span>
          </div>
        </div>
        
        <!-- Modo Creación: Autocomplete de productos -->
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
              placeholder="Buscar producto por nombre..."
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
            v-if="showDropdown && (filteredProducts.length > 0 || isLoadingProducts)"
            class="autocomplete-dropdown"
          >
            <div v-if="isLoadingProducts" class="dropdown-loading">
              <div class="spinner-small"></div>
              <span>Cargando productos...</span>
            </div>
            <div 
              v-else
              v-for="product in filteredProducts"
              :key="product._id"
              class="dropdown-item"
              @mousedown="selectProduct(product)"
            >
              <div class="dropdown-item-info">
                <span class="dropdown-item-name">{{ product.name }}</span>
                <span class="dropdown-item-desc">{{ product.description || 'Sin descripción' }}</span>
              </div>
              <span class="dropdown-item-price">{{ formatPrice(product.sell_price) }}</span>
            </div>
            <div v-if="!isLoadingProducts && filteredProducts.length === 0 && searchQuery" class="dropdown-empty">
              No se encontraron productos
            </div>
          </div>
        </div>
        
        <!-- Producto seleccionado (solo en modo creación) -->
        <div v-if="form.product && !isEditMode" class="selected-product">
          <div class="selected-product-info">
            <span class="selected-label">Producto seleccionado:</span>
            <span class="selected-name">{{ form.product.name }}</span>
            <span class="selected-price">Precio venta: {{ formatPrice(form.product.sell_price) }}</span>
          </div>
        </div>
        
        <span v-if="errors.product" class="field-error">{{ errors.product }}</span>
      </div>

      <!-- Precio de Compra -->
      <div class="form-group">
        <label for="purchase_price">
          Precio de compra <span class="required">*</span>
        </label>
        <div class="input-with-prefix">
          <span class="input-prefix">$</span>
          <input
            type="number"
            id="purchase_price"
            v-model="form.purchase_price"
            placeholder="0.00"
            min="0"
            step="0.01"
            :class="{ 'error': errors.purchase_price }"
            :disabled="isLoading"
          />
          <span class="input-suffix">MXN</span>
        </div>
        <span v-if="errors.purchase_price" class="field-error">{{ errors.purchase_price }}</span>
      </div>

      <!-- Cantidad -->
      <div class="form-group">
        <label for="quantity">
          Cantidad <span class="required">*</span>
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

      <!-- Costo Total (calculado) -->
      <div class="total-section">
        <div class="total-row">
          <span class="total-label">Costo Total:</span>
          <span class="total-value">{{ formatPrice(totalCost) }}</span>
        </div>
        <span class="total-hint">{{ form.quantity || 0 }} unidades × {{ formatPrice(form.purchase_price || 0) }}</span>
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
        <span v-else>{{ isEditMode ? 'Guardar Cambios' : 'Registrar Compra' }}</span>
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.purchase-form {
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

.form-group input[type="text"],
.form-group input[type="number"] {
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color var(--transition-fast);
}

.form-group input[type="text"]:focus,
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

/* Autocomplete Container */
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

/* Static Product (Modo Edición - Producto bloqueado) */
.static-product {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: linear-gradient(135deg, rgba(107, 76, 154, 0.05), rgba(107, 76, 154, 0.1));
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.static-product-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--color-primary);
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

.static-product-desc {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.static-product-price {
  font-size: 0.85rem;
  color: var(--color-secondary);
  font-weight: 500;
}

.static-product-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background: rgba(107, 76, 154, 0.1);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  flex-shrink: 0;
}

.static-product-badge svg {
  width: 14px;
  height: 14px;
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
  background: rgba(107, 76, 154, 0.05);
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

.dropdown-item-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-item-price {
  font-weight: 600;
  color: var(--color-secondary);
  font-size: 0.9rem;
  flex-shrink: 0;
}

.dropdown-empty {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
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

.selected-price {
  font-size: 0.85rem;
  color: var(--color-secondary);
}

/* Input with Prefix/Suffix */
.input-with-prefix {
  display: flex;
  align-items: stretch;
}

.input-with-prefix .input-prefix {
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-right: none;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.input-with-prefix input {
  flex: 1;
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.input-with-prefix .input-suffix {
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-left: none;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  font-weight: 500;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

/* Total Section */
.total-section {
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(107, 76, 154, 0.05), rgba(45, 143, 92, 0.05));
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.total-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.total-hint {
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

