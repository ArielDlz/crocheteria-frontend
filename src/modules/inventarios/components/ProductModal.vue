<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { productsService } from '../services/productsService'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  productId: {
    type: String,
    default: null
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'success'])

// Determinar si es modo edición
const isEditMode = computed(() => !!props.productId)

// Formulario
const form = ref({
  name: '',
  description: '',
  comision: '',
  sell_price: '',
  categories: []
})

// Valores originales (para comparar cambios en edición)
const originalValues = ref({})

// Estado
const isLoading = ref(false)
const isSubmitting = ref(false)
const errors = ref({})

// Estado para el dropdown de categorías
const categorySearchQuery = ref('')
const isDropdownOpen = ref(false)
const filteredCategories = ref([])

// Extraer IDs de categorías (pueden venir como objetos o como strings)
const extractCategoryIds = (categories) => {
  if (!categories || !Array.isArray(categories)) return []
  return categories.map(cat => {
    // Si es un objeto con _id, extraer el _id
    if (typeof cat === 'object' && cat._id) {
      return cat._id
    }
    // Si ya es un string (ID), devolverlo tal cual
    return cat
  })
}

// Cargar datos del producto para edición
const loadProductData = async () => {
  if (!props.productId) return

  isLoading.value = true
  errors.value = {}

  try {
    const product = await productsService.getProductById(props.productId)
    
    // Extraer solo los IDs de las categorías
    const categoryIds = extractCategoryIds(product.categories)
    
    form.value = {
      name: product.name || '',
      description: product.description || '',
      comision: product.comision || '',
      sell_price: product.sell_price || '',
      categories: categoryIds
    }

    // Guardar valores originales para comparar
    originalValues.value = {
      name: form.value.name,
      description: form.value.description,
      comision: form.value.comision,
      sell_price: form.value.sell_price,
      categories: [...categoryIds]
    }
    
    // Filtrar categorías después de cargar
    nextTick(() => {
      filterCategories()
    })
  } catch (error) {
    console.error('Error al cargar producto:', error)
    errors.value.load = 'Error al cargar los datos del producto'
  } finally {
    isLoading.value = false
  }
}

// Filtrar categorías según la búsqueda
const filterCategories = () => {
  if (!categorySearchQuery.value.trim()) {
    filteredCategories.value = props.categories.filter(cat => 
      !form.value.categories.includes(cat._id)
    )
  } else {
    const query = categorySearchQuery.value.toLowerCase().trim()
    filteredCategories.value = props.categories.filter(cat => 
      !form.value.categories.includes(cat._id) &&
      cat.name.toLowerCase().includes(query)
    )
  }
}

// Añadir categoría seleccionada
const addCategory = (categoryId) => {
  if (!form.value.categories.includes(categoryId)) {
    form.value.categories.push(categoryId)
    categorySearchQuery.value = ''
    isDropdownOpen.value = false
    filterCategories()
  }
}

// Eliminar categoría (desde chip)
const removeCategory = (categoryId) => {
  const index = form.value.categories.indexOf(categoryId)
  if (index > -1) {
    form.value.categories.splice(index, 1)
    filterCategories()
    
    // Si se elimina la categoría con comisión por producto, limpiar el campo comisión
    const category = getCategoryById(categoryId)
    if (category && 
        category.comision === true && 
        (category.comision_type === 'Producto' || category.comision_type === 'Por producto')) {
      // Verificar si aún hay otra categoría con comisión por producto
      if (!hasComisionPorProducto.value) {
        form.value.comision = ''
        if (errors.value.comision) {
          delete errors.value.comision
        }
      }
    }
  }
}

// Obtener objeto de categoría por ID
const getCategoryById = (categoryId) => {
  return props.categories.find(cat => cat._id === categoryId)
}

// Verificar si alguna categoría seleccionada tiene comisión por producto
const hasComisionPorProducto = computed(() => {
  return form.value.categories.some(categoryId => {
    const category = getCategoryById(categoryId)
    return category && 
           category.comision === true && 
           (category.comision_type === 'Producto' || category.comision_type === 'Por producto')
  })
})

// Manejar búsqueda
const handleSearch = () => {
  filterCategories()
  isDropdownOpen.value = true
}

// Cerrar dropdown al hacer click fuera
const handleClickOutside = (event) => {
  const dropdown = event.target.closest('.category-dropdown-wrapper')
  if (!dropdown) {
    isDropdownOpen.value = false
  }
}

// Validación
const validate = () => {
  errors.value = {}
  let isValid = true

  // Nombre
  if (!form.value.name.trim()) {
    errors.value.name = 'El nombre es obligatorio'
    isValid = false
  }

  // Comisión (obligatorio solo si hay categoría con comisión por producto)
  if (hasComisionPorProducto.value) {
    if (!form.value.comision || form.value.comision <= 0) {
      errors.value.comision = 'Ingresa un monto de comisión válido'
      isValid = false
    }
  }

  // Precio de venta
  if (!form.value.sell_price || form.value.sell_price <= 0) {
    errors.value.sell_price = 'Ingresa un precio de venta válido'
    isValid = false
  }

  return isValid
}

// Detectar qué campos han cambiado (para edición)
const getChangedFields = () => {
  const changed = {}

  if (form.value.name !== originalValues.value.name) {
    changed.name = form.value.name.trim()
  }

  if (form.value.description !== originalValues.value.description) {
    changed.description = form.value.description.trim()
  }

  // Comisión: solo incluir si hay categoría con comisión por producto
  if (hasComisionPorProducto.value) {
    const currentComision = Number(form.value.comision || 0)
    const originalComision = Number(originalValues.value.comision || 0)
    if (currentComision !== originalComision) {
      changed.comision = currentComision
    }
  } else {
    // Si no hay categoría con comisión por producto, no enviar comisión
    // (o enviar null si antes tenía valor)
    if (originalValues.value.comision) {
      changed.comision = null
    }
  }

  if (Number(form.value.sell_price) !== Number(originalValues.value.sell_price)) {
    changed.sell_price = Number(form.value.sell_price)
  }

  // Comparar categorías
  const currentCategories = [...form.value.categories].sort().join(',')
  const originalCategories = [...originalValues.value.categories].sort().join(',')
  
  if (currentCategories !== originalCategories) {
    changed.categories = form.value.categories
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

      await productsService.updateProduct(props.productId, changedFields)
      emit('success', { type: 'update', productId: props.productId, data: changedFields })
    } else {
      // Modo creación: enviar todos los campos
      const productData = {
        name: form.value.name.trim(),
        description: form.value.description.trim(),
        sell_price: Number(form.value.sell_price),
        categories: form.value.categories
      }

      // Solo incluir comisión si hay categoría con comisión por producto
      if (hasComisionPorProducto.value && form.value.comision) {
        productData.comision = Number(form.value.comision)
      }

      await productsService.createProduct(productData)
      emit('success', { type: 'create', data: productData })
    }

    handleClose()
  } catch (error) {
    console.error(`Error al ${isEditMode.value ? 'actualizar' : 'crear'} producto:`, error)
    errors.value.submit = error.message || `Error al ${isEditMode.value ? 'actualizar' : 'crear'} el producto`
  } finally {
    isSubmitting.value = false
  }
}

// Cerrar modal
const handleClose = () => {
  form.value = {
    name: '',
    description: '',
    comision: '',
    sell_price: '',
    categories: []
  }
  originalValues.value = {}
  errors.value = {}
  categorySearchQuery.value = ''
  isDropdownOpen.value = false
  document.removeEventListener('click', handleClickOutside)
  emit('close')
}

// Limpiar listener al desmontar
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Cargar datos cuando se abre el modal
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (isEditMode.value) {
      loadProductData()
    } else {
      // Resetear formulario para creación
      form.value = {
        name: '',
        description: '',
        comision: '',
        sell_price: '',
        categories: []
      }
      errors.value = {}
    }
    // Inicializar filtrado de categorías
    categorySearchQuery.value = ''
    isDropdownOpen.value = false
    filterCategories()
    
    // Añadir listener para cerrar dropdown al hacer click fuera
    if (newVal) {
      nextTick(() => {
        document.addEventListener('click', handleClickOutside)
      })
    }
  } else {
    // Remover listener cuando se cierra el modal
    document.removeEventListener('click', handleClickOutside)
  }
})

// Filtrar cuando cambian las categorías disponibles o las seleccionadas
watch(() => [props.categories, form.value.categories], () => {
  filterCategories()
}, { deep: true })

// Filtrar cuando cambia la búsqueda
watch(() => categorySearchQuery.value, () => {
  filterCategories()
})

// Computed para verificar si el formulario es válido
const isFormValid = computed(() => {
  const baseValid = form.value.name.trim() !== '' && 
                    form.value.sell_price && 
                    Number(form.value.sell_price) > 0
  
  // Si hay categoría con comisión por producto, también validar comisión
  if (hasComisionPorProducto.value) {
    return baseValid && 
           form.value.comision && 
           Number(form.value.comision) > 0
  }
  
  return baseValid
})

// Título del modal
const modalTitle = computed(() => {
  return isEditMode.value ? 'Editar Producto' : 'Nuevo Producto'
})
</script>

<template>
  <Modal 
    :is-open="isOpen" 
    :title="modalTitle"
    size="medium"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="product-form">
      <!-- Loading de producto -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner-small"></div>
        <span>Cargando datos del producto...</span>
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

      <!-- Campo Nombre -->
      <div class="form-group">
        <label for="name">
          Nombre del producto <span class="required">*</span>
        </label>
        <input
          type="text"
          id="name"
          v-model="form.name"
          placeholder="Ej: Amigurumi de conejo"
          :class="{ 'error': errors.name }"
          :disabled="isLoading"
        />
        <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
      </div>

      <!-- Campo Descripción -->
      <div class="form-group">
        <label for="description">
          Descripción
        </label>
        <textarea
          id="description"
          v-model="form.description"
          placeholder="Describe el producto (opcional)"
          rows="3"
          :disabled="isLoading"
        ></textarea>
      </div>

      <!-- Categorías -->
      <div class="form-group">
        <label>Categorías</label>
        <p class="field-hint">Busca y selecciona las categorías a las que pertenece este producto</p>
        
        <div v-if="categories.length === 0" class="no-categories">
          <span>No hay categorías disponibles</span>
        </div>
        
        <div v-else class="category-dropdown-wrapper">
          <!-- Input de búsqueda -->
          <div class="category-search-input">
            <input
              type="text"
              v-model="categorySearchQuery"
              @input="handleSearch"
              @focus="isDropdownOpen = true"
              placeholder="Buscar categoría..."
              :disabled="isLoading"
              class="search-input"
            />
            <svg 
              v-if="!isDropdownOpen" 
              class="search-icon" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <svg 
              v-else 
              class="search-icon close-icon" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2"
              @click="isDropdownOpen = false; categorySearchQuery = ''"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>

          <!-- Dropdown de resultados -->
          <div v-if="isDropdownOpen && filteredCategories.length > 0" class="category-dropdown">
            <div
              v-for="category in filteredCategories"
              :key="category._id"
              class="dropdown-item"
              @click="addCategory(category._id)"
            >
              {{ category.name }}
            </div>
          </div>

          <!-- Mensaje cuando no hay resultados -->
          <div v-if="isDropdownOpen && filteredCategories.length === 0 && categorySearchQuery.trim()" class="no-results">
            No se encontraron categorías que coincidan con "{{ categorySearchQuery }}"
          </div>

          <!-- Chips de categorías seleccionadas -->
          <div v-if="form.categories.length > 0" class="category-chips">
            <div
              v-for="categoryId in form.categories"
              :key="categoryId"
              class="category-chip"
            >
              <span class="chip-label">{{ getCategoryById(categoryId)?.name || 'Categoría' }}</span>
              <button
                type="button"
                class="chip-remove"
                @click="removeCategory(categoryId)"
                :disabled="isLoading"
                title="Eliminar categoría"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Campo Comisión (solo si hay categoría con comisión por producto) -->
      <div v-if="hasComisionPorProducto" class="form-group">
        <label for="comision">
          Comisión <span class="required">*</span>
        </label>
        <div class="input-with-prefix">
          <span class="input-prefix">$</span>
          <input
            type="number"
            id="comision"
            v-model="form.comision"
            placeholder="0.00"
            min="0"
            step="0.01"
            :class="{ 'error': errors.comision }"
            :disabled="isLoading"
          />
          <span class="input-suffix">MXN</span>
        </div>
        <span v-if="errors.comision" class="field-error">{{ errors.comision }}</span>
      </div>

      <!-- Campo Precio de Venta -->
      <div class="form-group">
        <label for="sell_price">
          Precio de venta <span class="required">*</span>
        </label>
        <div class="input-with-prefix">
          <span class="input-prefix">$</span>
          <input
            type="number"
            id="sell_price"
            v-model="form.sell_price"
            placeholder="0.00"
            min="0"
            step="0.01"
            :class="{ 'error': errors.sell_price }"
            :disabled="isLoading"
          />
          <span class="input-suffix">MXN</span>
        </div>
        <span v-if="errors.sell_price" class="field-error">{{ errors.sell_price }}</span>
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
        <span v-else>{{ isEditMode ? 'Guardar Cambios' : 'Crear Producto' }}</span>
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.product-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-group label {
  font-weight: 600;
  color: var(--color-text-primary);
}

.required {
  color: var(--color-error);
}

.field-hint {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color var(--transition-fast);
}

.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(107, 76, 154, 0.1);
}

.form-group input.error,
.form-group textarea.error {
  border-color: var(--color-error);
}

.form-group input:disabled,
.form-group textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-background);
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

.input-with-prefix input:focus {
  box-shadow: none;
}

.input-with-prefix:focus-within {
  .input-prefix,
  input,
  .input-suffix {
    border-color: var(--color-primary);
  }
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

/* Category Dropdown */
.category-dropdown-wrapper {
  position: relative;
  margin-top: var(--spacing-sm);
}

.category-search-input {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 0.875rem 2.5rem 0.875rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(107, 76, 154, 0.1);
}

.search-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-background);
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  color: var(--color-text-muted);
  pointer-events: none;
}

.close-icon {
  pointer-events: all;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.close-icon:hover {
  color: var(--color-error);
}

.category-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background: var(--color-white);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color var(--transition-fast);
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.dropdown-item:hover {
  background: rgba(107, 76, 154, 0.05);
}

.dropdown-item:first-child {
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.dropdown-item:last-child {
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.no-results {
  padding: 0.75rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
  margin-top: 0.25rem;
}

/* Category Chips */
.category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.category-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0.5rem 0.75rem;
  background: rgba(107, 76, 154, 0.1);
  border: 1px solid rgba(107, 76, 154, 0.2);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
}

.chip-label {
  color: var(--color-primary);
  font-weight: 500;
}

.chip-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  border-radius: 50%;
  transition: all var(--transition-fast);
  padding: 0;
  flex-shrink: 0;
}

.chip-remove:hover {
  background: rgba(107, 76, 154, 0.2);
  color: var(--color-error);
}

.chip-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chip-remove svg {
  width: 14px;
  height: 14px;
}

.no-categories {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--color-text-muted);
  background: var(--color-background);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

