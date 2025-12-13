<script setup>
import { ref, computed, watch } from 'vue'
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
  sell_price: '',
  categories: []
})

// Valores originales (para comparar cambios en edición)
const originalValues = ref({})

// Estado
const isLoading = ref(false)
const isSubmitting = ref(false)
const errors = ref({})

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
      sell_price: product.sell_price || '',
      categories: categoryIds
    }

    // Guardar valores originales para comparar
    originalValues.value = {
      name: form.value.name,
      description: form.value.description,
      sell_price: form.value.sell_price,
      categories: [...categoryIds]
    }
  } catch (error) {
    console.error('Error al cargar producto:', error)
    errors.value.load = 'Error al cargar los datos del producto'
  } finally {
    isLoading.value = false
  }
}

// Toggle de categoría
const toggleCategory = (categoryId) => {
  const index = form.value.categories.indexOf(categoryId)
  if (index > -1) {
    form.value.categories.splice(index, 1)
  } else {
    form.value.categories.push(categoryId)
  }
}

// Verificar si una categoría está seleccionada
const isCategorySelected = (categoryId) => {
  return form.value.categories.includes(categoryId)
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
    sell_price: '',
    categories: []
  }
  originalValues.value = {}
  errors.value = {}
  emit('close')
}

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
        sell_price: '',
        categories: []
      }
      errors.value = {}
    }
  }
})

// Computed para verificar si el formulario es válido
const isFormValid = computed(() => {
  return form.value.name.trim() !== '' && 
         form.value.sell_price && 
         Number(form.value.sell_price) > 0
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

      <!-- Categorías -->
      <div class="form-group">
        <label>Categorías</label>
        <p class="field-hint">Selecciona las categorías a las que pertenece este producto</p>
        
        <div v-if="categories.length === 0" class="no-categories">
          <span>No hay categorías disponibles</span>
        </div>
        
        <div v-else class="categories-grid">
          <label
            v-for="category in categories"
            :key="category._id"
            class="category-checkbox"
            :class="{ 'selected': isCategorySelected(category._id) }"
          >
            <input
              type="checkbox"
              :checked="isCategorySelected(category._id)"
              @change="toggleCategory(category._id)"
              :disabled="isLoading"
            />
            <span class="checkbox-custom">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <span class="category-name">{{ category.name }}</span>
          </label>
        </div>
        
        <span class="selected-count">
          {{ form.categories.length }} categoría{{ form.categories.length !== 1 ? 's' : '' }} seleccionada{{ form.categories.length !== 1 ? 's' : '' }}
        </span>
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

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.category-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.6rem 0.8rem;
  background: var(--color-white);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-weight: normal;
}

.category-checkbox:hover {
  border-color: var(--color-primary);
  background: rgba(107, 76, 154, 0.02);
}

.category-checkbox.selected {
  border-color: var(--color-primary);
  background: rgba(107, 76, 154, 0.05);
}

.category-checkbox input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.checkbox-custom svg {
  opacity: 0;
  color: white;
  transition: opacity var(--transition-fast);
}

.category-checkbox.selected .checkbox-custom {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.category-checkbox.selected .checkbox-custom svg {
  opacity: 1;
}

.category-name {
  font-size: 0.9rem;
  color: var(--color-text-primary);
}

.no-categories {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--color-text-muted);
  background: var(--color-background);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
}

.selected-count {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-top: var(--spacing-xs);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

