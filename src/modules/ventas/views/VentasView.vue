<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { productsService } from '@/modules/inventarios/services/productsService'
import { categoriesService } from '@/modules/inventarios/services/categoriesService'
import { salesService } from '@/modules/ventas/services/salesService'
import { cashRegisterService } from '@/modules/ventas/services/cashRegisterService'
import { useAuth } from '@/modules/auth/composables/useAuth'
import api from '@/services/api'
import Modal from '@/components/common/Modal.vue'
import OpenCashRegisterModal from '@/modules/ventas/components/OpenCashRegisterModal.vue'

// Estado
const products = ref([])
const categories = ref([])
const isLoading = ref(true)
const error = ref(null)

// Orden actual (carrito)
const orderItems = ref([])

// Filtros
const searchQuery = ref('')
const selectedCategoryId = ref(null)

// Autenticación
const { user } = useAuth()

// Control de caja
const isCashRegisterOpen = ref(false)
const isCheckingCashRegister = ref(false)
const isOpenCashRegisterModalOpen = ref(false)

// Modal de pago
const isPaymentModalOpen = ref(false)
const paymentMethods = ref([])
const paymentMethodsList = ref([]) // Array de métodos de pago seleccionados
const currentPaymentMethod = ref(null) // Método de pago actualmente seleccionado para agregar
const currentPaymentAmount = ref(0) // Monto del método de pago actual
const isLoadingPaymentMethods = ref(false)
const isProcessingSale = ref(false)
const cashReceived = ref(0) // Efectivo recibido para el método actual

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

// Cargar categorías
const loadCategories = async () => {
  try {
    categories.value = await categoriesService.getCategories()
  } catch (err) {
    console.error('Error al cargar categorías:', err)
  }
}

// Validar estado de la caja
const checkCashRegisterStatus = async () => {
  isCheckingCashRegister.value = true
  try {
    const status = await cashRegisterService.getStatus()
    isCashRegisterOpen.value = status.isOpen === true
    
    // Si la caja no está abierta, mostrar el modal
    if (!isCashRegisterOpen.value) {
      isOpenCashRegisterModalOpen.value = true
    }
  } catch (err) {
    console.error('Error al validar estado de caja:', err)
    // Si hay error, asumimos que la caja no está abierta
    isCashRegisterOpen.value = false
    isOpenCashRegisterModalOpen.value = true
  } finally {
    isCheckingCashRegister.value = false
  }
}

// Manejar cierre del modal de apertura de caja
const handleOpenCashRegisterModalClose = async () => {
  isOpenCashRegisterModalOpen.value = false
  // Validar nuevamente el estado después de cerrar el modal (sin forzar mostrar el modal)
  isCheckingCashRegister.value = true
  try {
    const status = await cashRegisterService.getStatus()
    isCashRegisterOpen.value = status.isOpen === true
    // No forzamos mostrar el modal aquí, solo actualizamos el estado
  } catch (err) {
    console.error('Error al validar estado de caja:', err)
    isCashRegisterOpen.value = false
  } finally {
    isCheckingCashRegister.value = false
  }
}

// Manejar éxito al abrir la caja
const handleOpenCashRegisterSuccess = async () => {
  isOpenCashRegisterModalOpen.value = false
  // Validar nuevamente el estado después de abrir la caja
  await checkCashRegisterStatus()
}

// Productos filtrados
const filteredProducts = computed(() => {
  let filtered = products.value

  // Filtro por búsqueda
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(product => 
      product.name?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    )
  }

  // Filtro por categoría
  if (selectedCategoryId.value) {
    filtered = filtered.filter(product => 
      product.categories?.some(cat => 
        (typeof cat === 'string' ? cat : cat._id) === selectedCategoryId.value
      )
    )
  }

  return filtered
})

// Obtener stock disponible de un producto
const getProductStock = (productId) => {
  const product = products.value.find(p => p._id === productId)
  return product?.stock || 0
}

// Verificar si un producto puede agregarse a la orden
const canAddProduct = (product) => {
  const stock = product.stock || 0
  if (stock <= 0) return false
  
  const existingItem = orderItems.value.find(item => item.product._id === product._id)
  if (existingItem) {
    // Si ya existe, verificar que no exceda el stock actual del producto
    const currentStock = getProductStock(product._id)
    return existingItem.quantity < currentStock
  }
  return true
}

// Agregar producto a la orden
const addProductToOrder = (product) => {
  // Validar que el producto tenga stock disponible
  const stock = product.stock || 0
  if (stock <= 0) {
    return // No agregar productos sin stock
  }
  
  // Verificar si el producto ya está en la orden
  const existingItem = orderItems.value.find(item => item.product._id === product._id)
  
  if (existingItem) {
    // Si ya existe, incrementar cantidad solo si no excede el stock actual
    const currentStock = getProductStock(product._id)
    if (existingItem.quantity < currentStock) {
      existingItem.quantity += 1
      // Actualizar el stock guardado en el item
      existingItem.stock = currentStock
    }
  } else {
    // Si no existe, agregar nuevo item
    orderItems.value.push({
      product: {
        _id: product._id,
        name: product.name,
        sell_price: product.sell_price
      },
      stock: stock, // Guardar el stock disponible
      quantity: 1
    })
  }
}

// Remover producto de la orden
const removeProductFromOrder = (itemIndex) => {
  orderItems.value.splice(itemIndex, 1)
}

// Actualizar cantidad de un item
const updateItemQuantity = (itemIndex, newQuantity) => {
  if (newQuantity <= 0) {
    removeProductFromOrder(itemIndex)
  } else {
    const item = orderItems.value[itemIndex]
    // Verificar el stock actual del producto (puede haber cambiado)
    const currentStock = getProductStock(item.product._id)
    // Limitar la cantidad al stock disponible
    orderItems.value[itemIndex].quantity = Math.min(newQuantity, currentStock)
  }
}

// Verificar si se puede incrementar la cantidad de un item
const canIncrementQuantity = (item) => {
  const currentQuantity = item.quantity || 0
  // Verificar el stock actual del producto (puede haber cambiado)
  const currentStock = getProductStock(item.product._id)
  return currentQuantity < currentStock
}

// Calcular total por item
const getItemTotal = (item) => {
  return item.product.sell_price * item.quantity
}

// Calcular total de la orden
const orderTotal = computed(() => {
  return orderItems.value.reduce((total, item) => {
    return total + getItemTotal(item)
  }, 0)
})

// Formatear precio
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price)
}

// Seleccionar categoría
const selectCategory = (categoryId) => {
  if (selectedCategoryId.value === categoryId) {
    // Si ya está seleccionada, deseleccionar
    selectedCategoryId.value = null
  } else {
    selectedCategoryId.value = categoryId
  }
}

// Limpiar filtros
const clearFilters = () => {
  searchQuery.value = ''
  selectedCategoryId.value = null
}

// Cargar métodos de pago
const loadPaymentMethods = async () => {
  isLoadingPaymentMethods.value = true
  try {
    const response = await api.get('/templates/payment_options')
    paymentMethods.value = response.data?.options || []
  } catch (err) {
    console.error('Error al cargar métodos de pago:', err)
    paymentMethods.value = []
  } finally {
    isLoadingPaymentMethods.value = false
  }
}

// Abrir modal de pago
const openPaymentModal = async () => {
  if (orderItems.value.length === 0) return
  
  // Validar que la caja esté abierta antes de permitir el pago
  if (!isCashRegisterOpen.value) {
    error.value = 'La caja debe estar abierta para realizar ventas. Por favor, abre la caja primero.'
    // Mostrar el modal de apertura de caja
    isOpenCashRegisterModalOpen.value = true
    return
  }
  
  paymentMethodsList.value = []
  currentPaymentMethod.value = null
  currentPaymentAmount.value = 0
  cashReceived.value = 0
  await loadPaymentMethods()
  isPaymentModalOpen.value = true
}

// Verificar si el método de pago actual es efectivo
const isCashPayment = computed(() => {
  if (!currentPaymentMethod.value) return false
  const method = paymentMethods.value.find(m => m.value === currentPaymentMethod.value)
  return method && (method.value === 'cash' || method.label?.toLowerCase().includes('efectivo'))
})

// Calcular cambio para el método de pago actual
const changeAmount = computed(() => {
  if (!isCashPayment.value || !cashReceived.value) return 0
  const remaining = remainingAmount.value || orderTotal.value
  const amountToPay = Math.min(cashReceived.value, remaining)
  const change = cashReceived.value - amountToPay
  return change > 0 ? change : 0
})

// Calcular total pagado
const totalPaid = computed(() => {
  return paymentMethodsList.value.reduce((total, payment) => {
    return total + (payment.amount || 0)
  }, 0)
})

// Calcular restante por pagar
const remainingAmount = computed(() => {
  const remaining = orderTotal.value - totalPaid.value
  return remaining > 0 ? remaining : 0
})

// Obtener nombre del método de pago
const getPaymentMethodName = (methodValue) => {
  const method = paymentMethods.value.find(m => m.value === methodValue)
  return method?.label || methodValue
}

// Verificar si se puede agregar el método de pago sin exceder el total
const canAddPaymentMethod = computed(() => {
  if (!currentPaymentMethod.value) return false
  
  let amountToAdd = 0
  
  if (isCashPayment.value) {
    if (cashReceived.value <= 0) return false
    const remaining = remainingAmount.value || orderTotal.value
    amountToAdd = Math.min(cashReceived.value, remaining)
  } else {
    if (currentPaymentAmount.value <= 0) return false
    amountToAdd = currentPaymentAmount.value
  }
  
  // Verificar que el total pagado no exceda el total de la orden
  const newTotalPaid = totalPaid.value + amountToAdd
  return newTotalPaid <= orderTotal.value
})

// Agregar método de pago a la lista
const addPaymentMethod = () => {
  if (!currentPaymentMethod.value) return
  if (!canAddPaymentMethod.value) return
  
  let amount = 0
  let cashReceivedAmount = null
  let change = null
  
  if (isCashPayment.value) {
    // Para efectivo, el monto a pagar es el mínimo entre lo recibido y lo restante
    const remaining = remainingAmount.value || orderTotal.value
    amount = Math.min(cashReceived.value, remaining)
    cashReceivedAmount = cashReceived.value
  } else {
    // Para otros métodos, usar el monto especificado
    amount = currentPaymentAmount.value
  }
  
  if (amount <= 0) return
  
  // Validación final: asegurar que no exceda el total
  const newTotalPaid = totalPaid.value + amount
  if (newTotalPaid > orderTotal.value) {
    // Ajustar el monto para que no exceda el total
    amount = orderTotal.value - totalPaid.value
    if (amount <= 0) return
  }
  
  // Recalcular el cambio después de cualquier ajuste del monto (solo para efectivo)
  if (isCashPayment.value && cashReceivedAmount !== null) {
    change = cashReceivedAmount > amount ? cashReceivedAmount - amount : 0
  }
  
  const payment = {
    method: currentPaymentMethod.value,
    methodName: getPaymentMethodName(currentPaymentMethod.value),
    amount: amount,
    cashReceived: cashReceivedAmount,
    change: change
  }
  
  paymentMethodsList.value.push(payment)
  
  // Resetear campos
  currentPaymentMethod.value = null
  currentPaymentAmount.value = 0
  cashReceived.value = 0
}

// Eliminar método de pago de la lista
const removePaymentMethod = (index) => {
  paymentMethodsList.value.splice(index, 1)
}

// Verificar si se puede agregar más métodos de pago
const canAddMorePayments = computed(() => {
  return remainingAmount.value > 0
})

// Verificar si se puede confirmar el pago
const canConfirmPayment = computed(() => {
  if (paymentMethodsList.value.length === 0) return false
  // Si hay restante, no se puede confirmar
  if (remainingAmount.value > 0) return false
  // Si es efectivo y el monto recibido es menor al monto del pago, no se puede confirmar
  const cashPayments = paymentMethodsList.value.filter(p => 
    p.method === 'cash' || paymentMethods.value.find(m => m.value === p.method)?.label?.toLowerCase().includes('efectivo')
  )
  for (const payment of cashPayments) {
    if (payment.cashReceived && payment.cashReceived < payment.amount) {
      return false
    }
  }
  return true
})

// Cerrar modal de pago
const closePaymentModal = () => {
  isPaymentModalOpen.value = false
  paymentMethodsList.value = []
  currentPaymentMethod.value = null
  currentPaymentAmount.value = 0
  cashReceived.value = 0
  error.value = null
  isProcessingSale.value = false
}

// Validar que la suma de pagos no exceda el total
const validatePaymentsTotal = () => {
  const paymentsSum = paymentMethodsList.value.reduce((sum, payment) => {
    return sum + (payment.amount || 0)
  }, 0)
  
  return paymentsSum <= orderTotal.value
}

// Procesar pago y crear la venta
const processPayment = async () => {
  if (!canConfirmPayment.value) return
  
  // Validar que la caja esté abierta
  if (!isCashRegisterOpen.value) {
    error.value = 'La caja debe estar abierta para realizar ventas. Por favor, abre la caja primero.'
    // Mostrar el modal de apertura de caja
    isOpenCashRegisterModalOpen.value = true
    return
  }
  
  // Validación adicional: asegurar que la suma de pagos no exceda el total
  if (!validatePaymentsTotal()) {
    error.value = 'La suma de los pagos no puede exceder el total de la orden'
    return
  }
  
  // Validar que haya un usuario autenticado (soporta tanto _id como id)
  const userId = user.value?._id || user.value?.id
  if (!userId) {
    error.value = 'No hay un usuario autenticado. Por favor, inicia sesión.'
    return
  }
  
  // Validar que haya items en la orden
  if (orderItems.value.length === 0) {
    error.value = 'No hay productos en la orden'
    return
  }
  
  isProcessingSale.value = true
  error.value = null
  
  try {
    // Construir sales_lines
    const salesLines = orderItems.value.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      sell_price: item.product.sell_price,
      line_total: getItemTotal(item)
    }))
    
    // Construir payments
    const payments = paymentMethodsList.value.map(payment => {
      const paymentData = {
        payment_method: payment.method,
        ammount: payment.amount
      }
      
      // Si es efectivo, agregar payment_date
      if (payment.method === 'cash' || payment.methodName?.toLowerCase().includes('efectivo')) {
        paymentData.payment_date = new Date().toISOString()
      }
      
      return paymentData
    })
    
    // Obtener el ID del usuario (soporta tanto _id como id)
    const userId = user.value._id || user.value.id
    
    // Construir el objeto de venta
    const saleData = {
      user: userId,
      sales_lines: salesLines,
      total_ammount: orderTotal.value,
      payments: payments
    }
    
    // Validación final: asegurar que la suma de pagos no exceda el total
    const paymentsSum = payments.reduce((sum, p) => sum + p.ammount, 0)
    if (paymentsSum > orderTotal.value) {
      error.value = `La suma de los pagos (${formatPrice(paymentsSum)}) no puede exceder el total de la orden (${formatPrice(orderTotal.value)})`
      isProcessingSale.value = false
      return
    }
    // Validar que la suma sea igual al total (ya validado en canConfirmPayment, pero verificamos de nuevo)
    if (Math.abs(paymentsSum - orderTotal.value) > 0.01) {
      error.value = `La suma de los pagos (${formatPrice(paymentsSum)}) debe ser igual al total de la orden (${formatPrice(orderTotal.value)})`
      isProcessingSale.value = false
      return
    }
    
    // Enviar la venta al backend
    await salesService.createSale(saleData)
    
    // Limpiar la orden y cerrar el modal
    orderItems.value = []
    closePaymentModal()
    
    // Recargar productos para actualizar el stock
    await loadProducts()
    
  } catch (err) {
    console.error('Error al procesar la venta:', err)
    error.value = err.message || 'Error al procesar la venta. Por favor, intenta nuevamente.'
  } finally {
    isProcessingSale.value = false
  }
}

// Cargar datos al montar
onMounted(async () => {
  // Primero validar el estado de la caja
  await checkCashRegisterStatus()
  
  // Luego cargar productos y categorías
  await Promise.all([
    loadProducts(),
    loadCategories()
  ])
})
</script>

<template>
  <div class="pos-view">
    <!-- Panel izquierdo: Productos (2/3) -->
    <div class="products-panel">
      <!-- Buscador -->
      <div class="search-section">
        <div class="search-wrapper">
          <svg class="search-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Buscar productos..."
            autofocus
          />
          <button 
            v-if="searchQuery || selectedCategoryId"
            class="clear-search-btn"
            @click="clearFilters"
            title="Limpiar filtros"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Filtro de categorías -->
      <div class="categories-section">
        <div class="categories-wrapper">
          <button
            v-for="category in categories"
            :key="category._id"
            class="category-btn"
            :class="{ active: selectedCategoryId === category._id }"
            @click="selectCategory(category._id)"
          >
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- Grid de productos -->
      <div class="products-section">
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando productos...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <span class="error-icon">⚠️</span>
          <p>{{ error }}</p>
          <button class="btn-primary" @click="loadProducts">Reintentar</button>
        </div>

        <div v-else-if="filteredProducts.length === 0" class="empty-state">
          <span class="empty-icon">📦</span>
          <p v-if="searchQuery || selectedCategoryId">No se encontraron productos con los filtros aplicados</p>
          <p v-else>No hay productos disponibles</p>
        </div>

        <div v-else class="products-grid">
          <div
            v-for="product in filteredProducts"
            :key="product._id"
            class="product-card"
            :class="{ 'disabled': !canAddProduct(product) || (product.stock || 0) <= 0 }"
            @click="canAddProduct(product) && (product.stock || 0) > 0 ? addProductToOrder(product) : null"
          >
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p v-if="product.description" class="product-description">{{ product.description }}</p>
            </div>
            <div class="product-footer">
              <div class="product-price">{{ formatPrice(product.sell_price) }}</div>
              <div class="product-stock">
                <template v-if="(product.stock || 0) <= 0">
                  <span class="out-of-stock-text">Sin existencias</span>
                </template>
                <template v-else>
                  <span class="stock-label">Disponibles:</span>
                  <span class="stock-value">
                    {{ product.stock || 0 }}
                  </span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel derecho: Orden (1/3) -->
    <div class="order-panel">
      <div class="order-header">
        <h2>🛒 Orden</h2>
        <button 
          v-if="orderItems.length > 0"
          class="btn-clear-order"
          @click="orderItems = []"
          title="Limpiar orden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      <div class="order-content">
        <!-- Lista de items -->
        <div v-if="orderItems.length > 0" class="order-items">
          <div 
            v-for="(item, index) in orderItems" 
            :key="`${item.product._id}-${index}`"
            class="order-item-card"
          >
            <div class="item-info">
              <h3 class="item-name">{{ item.product.name }}</h3>
              <div class="item-controls">
                <button 
                  class="qty-btn"
                  @click="updateItemQuantity(index, item.quantity - 1)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                <span class="item-quantity">{{ item.quantity }}</span>
                <button 
                  class="qty-btn"
                  :disabled="!canIncrementQuantity(item)"
                  @click="updateItemQuantity(index, item.quantity + 1)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div class="item-total">
              <span class="total-label">Total:</span>
              <span class="total-amount">{{ formatPrice(getItemTotal(item)) }}</span>
            </div>
            <button 
              class="remove-item-btn"
              @click="removeProductFromOrder(index)"
              title="Eliminar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-else class="order-empty">
          <span class="empty-icon">🛒</span>
          <p>No hay productos en la orden</p>
          <p class="hint">Selecciona productos para comenzar</p>
        </div>

        <!-- Total de la orden -->
        <div v-if="orderItems.length > 0" class="order-footer">
          <div class="order-total">
            <span class="total-label">Total a cobrar:</span>
            <span class="total-amount-large">{{ formatPrice(orderTotal) }}</span>
          </div>
          <button class="btn-payment" @click="openPaymentModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Proceder al Pago
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Pago -->
    <Modal
      :is-open="isPaymentModalOpen"
      title="Confirmar Pago"
      size="large"
      @close="closePaymentModal"
    >
      <div class="payment-modal-content">
        <div class="payment-modal-layout">
          <!-- Columna izquierda: Ticket -->
          <div class="payment-modal-left">
            <div class="ticket">
          <!-- Encabezado del ticket -->
          <div class="ticket-header">
            <h3 class="ticket-title">Crochetería</h3>
            <p class="ticket-date">{{ new Date().toLocaleDateString('es-MX', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) }}</p>
          </div>

          <!-- Línea divisoria -->
          <div class="ticket-divider"></div>

          <!-- Items de la orden -->
          <div class="ticket-items">
            <div
              v-for="(item, index) in orderItems"
              :key="`ticket-${item.product._id}-${index}`"
              class="ticket-item"
            >
              <div class="ticket-item-info">
                <span class="ticket-item-name">{{ item.product.name }}</span>
                <span class="ticket-item-qty">x{{ item.quantity }}</span>
              </div>
              <span class="ticket-item-price">{{ formatPrice(getItemTotal(item)) }}</span>
            </div>
          </div>

          <!-- Línea divisoria -->
          <div class="ticket-divider"></div>

          <!-- Total -->
          <div class="ticket-total">
            <span class="ticket-total-label">Total:</span>
            <span class="ticket-total-amount">{{ formatPrice(orderTotal) }}</span>
          </div>
        </div>
          </div>

          <!-- Columna derecha: Métodos de Pago -->
          <div class="payment-modal-right">
        <!-- Resumen de pagos -->
        <div v-if="paymentMethodsList.length > 0" class="payments-summary">
          <h4 class="payment-method-title">Métodos de Pago Agregados</h4>
          <div class="payments-list">
            <div
              v-for="(payment, index) in paymentMethodsList"
              :key="index"
              class="payment-item"
            >
              <div class="payment-item-info">
                <span class="payment-item-method">{{ payment.methodName }}</span>
                <span class="payment-item-amount">{{ formatPrice(payment.amount) }}</span>
                <span v-if="payment.change !== null && payment.change > 0" class="payment-item-change">
                  Cambio: {{ formatPrice(payment.change) }}
                </span>
              </div>
              <button
                class="remove-payment-btn"
                @click="removePaymentMethod(index)"
                title="Eliminar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          <div class="payment-summary-totals">
            <div class="summary-row">
              <span>Total de la orden:</span>
              <span class="summary-amount">{{ formatPrice(orderTotal) }}</span>
            </div>
            <div class="summary-row">
              <span>Total pagado:</span>
              <span class="summary-amount paid">{{ formatPrice(totalPaid) }}</span>
            </div>
            <div v-if="remainingAmount > 0" class="summary-row">
              <span>Restante por pagar:</span>
              <span class="summary-amount remaining">{{ formatPrice(remainingAmount) }}</span>
            </div>
            <div v-else-if="totalPaid > orderTotal" class="summary-row">
              <span>Cambio total:</span>
              <span class="summary-amount change">{{ formatPrice(totalPaid - orderTotal) }}</span>
            </div>
          </div>
        </div>

        <!-- Agregar método de pago -->
        <div class="payment-method-section">
          <h4 class="payment-method-title">
            {{ paymentMethodsList.length > 0 ? 'Agregar Otro Método de Pago' : 'Método de Pago' }}
          </h4>
          
          <div v-if="isLoadingPaymentMethods" class="loading-payment-methods">
            <div class="spinner-small"></div>
            <span>Cargando métodos de pago...</span>
          </div>

          <div v-else-if="paymentMethods.length === 0" class="no-payment-methods">
            <p>No hay métodos de pago disponibles</p>
          </div>

          <div v-else>
            <div class="payment-methods-grid">
              <button
                v-for="method in paymentMethods"
                :key="method.value"
                class="payment-method-btn"
                :class="{ active: currentPaymentMethod === method.value }"
                @click="currentPaymentMethod = method.value"
              >
                <span class="payment-method-label">{{ method.label }}</span>
              </button>
            </div>

            <!-- Campos para el método de pago actual -->
            <div v-if="currentPaymentMethod" class="current-payment-form">
              <!-- Campo de monto (para métodos que no son efectivo) -->
              <div v-if="!isCashPayment" class="payment-amount-section">
                <label class="cash-input-label">
                  Monto a pagar:
                </label>
                <input
                  v-model.number="currentPaymentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  :max="remainingAmount || orderTotal"
                  class="cash-input"
                  placeholder="0.00"
                  @input="currentPaymentAmount = Math.max(0, Math.min(currentPaymentAmount || 0, Math.min(remainingAmount || orderTotal, orderTotal - totalPaid)))"
                />
                <div v-if="remainingAmount > 0" class="amount-hint">
                  Restante: {{ formatPrice(remainingAmount) }}
                </div>
              </div>

              <!-- Campo de efectivo recibido (solo para pago en efectivo) -->
              <div v-if="isCashPayment" class="cash-payment-section">
                <label class="cash-input-label">
                  Cantidad recibida:
                </label>
                <input
                  v-model.number="cashReceived"
                  type="number"
                  step="0.01"
                  min="0"
                  class="cash-input"
                  placeholder="0.00"
                  @input="cashReceived = Math.max(0, cashReceived || 0)"
                />
                
                <!-- Mostrar monto a pagar y cambio -->
                <div v-if="cashReceived > 0" class="change-section">
                  <div class="change-label">
                    <span>Monto a pagar:</span>
                    <span class="change-amount">{{ formatPrice(Math.min(cashReceived, remainingAmount || orderTotal)) }}</span>
                  </div>
                  <div v-if="changeAmount > 0" class="change-label">
                    <span>Cambio a entregar:</span>
                    <span class="change-amount">{{ formatPrice(changeAmount) }}</span>
                  </div>
                  <div v-if="cashReceived < (remainingAmount || orderTotal)" class="change-warning">
                    ⚠️ La cantidad recibida es menor al monto restante. Se aplicará el monto recibido.
                  </div>
                </div>
              </div>

              <!-- Mensaje de validación -->
              <div v-if="currentPaymentMethod && !canAddPaymentMethod" class="validation-error">
                ⚠️ El monto excedería el total de la orden. El total pagado no puede ser mayor al total de la orden.
              </div>

              <!-- Botón para agregar el método de pago -->
              <button
                class="btn-add-payment"
                :disabled="!canAddPaymentMethod"
                @click="addPaymentMethod"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Agregar Método de Pago
              </button>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>

      <!-- Mostrar errores si existen -->
      <div v-if="error" class="payment-error-message">
        <span class="error-icon">⚠️</span>
        <span>{{ error }}</span>
      </div>

      <template #footer>
        <button 
          type="button" 
          class="btn-outline" 
          :disabled="isProcessingSale"
          @click="closePaymentModal"
        >
          Cancelar
        </button>
        <button 
          type="button" 
          class="btn-primary"
          :disabled="!canConfirmPayment || isProcessingSale"
          @click="processPayment"
        >
          <span v-if="isProcessingSale" class="btn-loading">
            <div class="spinner-small"></div>
            Procesando...
          </span>
          <span v-else>Confirmar Pago</span>
        </button>
      </template>
    </Modal>

    <!-- Modal de Apertura de Caja -->
    <OpenCashRegisterModal
      :is-open="isOpenCashRegisterModalOpen"
      :user-id="user?._id || user?.id || ''"
      @close="handleOpenCashRegisterModalClose"
      @success="handleOpenCashRegisterSuccess"
    />
  </div>
</template>

<style scoped>
.pos-view {
  display: flex;
  height: calc(100vh - 80px);
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  overflow: hidden;
}

/* Panel izquierdo: Productos (2/3) */
.products-panel {
  flex: 0 0 66.666%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow: hidden;
}

/* Panel derecho: Orden (1/3) */
.order-panel {
  flex: 0 0 33.333%;
  display: flex;
  flex-direction: column;
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 2px solid var(--color-border);
  background: linear-gradient(135deg, var(--color-primary), #7C3AED);
  color: white;
}

.order-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.btn-clear-order {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
}

.btn-clear-order:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.order-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.order-items {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.order-item-card {
  position: relative;
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: all var(--transition-fast);
}

.order-item-card:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}

.item-info {
  margin-bottom: var(--spacing-sm);
}

.item-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.qty-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  background: var(--color-white);
  color: var(--color-text-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
}

.qty-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
}

.item-quantity {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  min-width: 40px;
  text-align: center;
}

.item-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-xs);
  border-top: 1px solid var(--color-border);
}

.total-label {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.total-amount {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary);
}

.remove-item-btn {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
}

.remove-item-btn:hover {
  background: var(--color-error);
  color: white;
  transform: scale(1.1);
}

.order-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.order-empty p {
  color: var(--color-text-secondary);
  margin: var(--spacing-xs) 0;
}

.hint {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.order-footer {
  padding: var(--spacing-lg);
  border-top: 2px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.total-amount-large {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary);
}

/* Buscador */
.search-section {
  flex-shrink: 0;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
}

.search-icon {
  position: absolute;
  left: var(--spacing-md);
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) 3.5rem;
  font-size: 1.25rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-white);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
}

.clear-search-btn:hover {
  color: var(--color-error);
  background: rgba(229, 62, 62, 0.1);
}

/* Filtro de categorías */
.categories-section {
  flex-shrink: 0;
}

.categories-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  justify-content: center;
}

.category-btn {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: 1.1rem;
  font-weight: 500;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-white);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 48px;
}

.category-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.category-btn.active {
  background: linear-gradient(135deg, var(--color-primary), #7C3AED);
  color: white;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

/* Grid de productos */
.products-section {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.product-card {
  padding: var(--spacing-lg);
  background: var(--color-white);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 180px;
}

.product-card:hover:not(.disabled) {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}

.product-card.disabled {
  background: #f5f5f5;
  border-color: #e0e0e0;
  cursor: not-allowed;
  opacity: 0.6;
  position: relative;
}

.product-card.disabled:hover {
  transform: none;
  box-shadow: none;
}

.product-info {
  flex: 1;
  margin-bottom: var(--spacing-md);
}

.product-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.product-description {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-footer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border);
}

.product-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.product-stock {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.stock-label {
  color: var(--color-text-secondary);
}

.stock-value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.out-of-stock-text {
  color: var(--color-error);
  font-weight: 700;
  font-size: 0.9rem;
}

/* Estados de carga y error */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  text-align: center;
}

.spinner {
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

.error-icon,
.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

/* Responsive para tablets */
/* Botón de Pago */
.btn-payment {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  margin-top: var(--spacing-md);
  background: linear-gradient(135deg, var(--color-primary), #7C3AED);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.btn-payment:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35);
}

.btn-payment:active {
  transform: translateY(0);
}

/* Modal de Pago */
.payment-modal-content {
  padding: var(--spacing-md) 0;
}

.payment-modal-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
}

.payment-modal-left {
  display: flex;
  flex-direction: column;
}

.payment-modal-right {
  display: flex;
  flex-direction: column;
}

/* Aumentar altura del modal para el modal de pago */
:deep(.modal-large) {
  max-width: 1200px;
  min-height: 700px;
  max-height: 90vh;
}

/* Responsive para el layout de dos columnas */
@media (max-width: 1024px) {
  .payment-modal-layout {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
}

/* Ticket */
.ticket {
  background: var(--color-white);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  font-family: 'Courier New', monospace;
}

.ticket-header {
  text-align: center;
  margin-bottom: var(--spacing-md);
}

.ticket-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.ticket-date {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.ticket-divider {
  height: 1px;
  background: repeating-linear-gradient(
    to right,
    var(--color-border) 0,
    var(--color-border) 8px,
    transparent 8px,
    transparent 16px
  );
  margin: var(--spacing-md) 0;
}

.ticket-items {
  margin-bottom: var(--spacing-md);
}

.ticket-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px dotted var(--color-border);
}

.ticket-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.ticket-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ticket-item-name {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.ticket-item-qty {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.ticket-item-price {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.ticket-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-md);
  border-top: 2px solid var(--color-border);
  font-size: 1.2rem;
}

.ticket-total-label {
  font-weight: 700;
  color: var(--color-text-primary);
}

.ticket-total-amount {
  font-weight: 700;
  color: var(--color-primary);
  font-size: 1.5rem;
}

/* Métodos de Pago */
.payment-method-section {
  margin-top: var(--spacing-xl);
}

.payment-method-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.loading-payment-methods,
.no-payment-methods {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--color-text-secondary);
}

.loading-payment-methods {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.payment-methods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.payment-method-btn {
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-white);
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.payment-method-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.payment-method-btn.active {
  background: linear-gradient(135deg, var(--color-primary), #7C3AED);
  color: white;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

.payment-method-label {
  display: block;
}

/* Campo de efectivo recibido */
.cash-payment-section {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.cash-input-label {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.cash-input {
  width: 100%;
  padding: var(--spacing-md);
  font-size: 1.25rem;
  font-weight: 600;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-white);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
  text-align: right;
}

.cash-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.cash-input::placeholder {
  color: var(--color-text-muted);
}

/* Sección de cambio */
.change-section {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.change-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.change-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.change-amount.insufficient {
  color: var(--color-error);
}

.change-warning {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  text-align: center;
}

/* Resumen de métodos de pago agregados */
.payments-summary {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.payments-list {
  margin-bottom: var(--spacing-md);
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-white);
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-sm);
  border: 1px solid var(--color-border);
}

.payment-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.payment-item-method {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.payment-item-amount {
  font-weight: 700;
  color: var(--color-primary);
  font-size: 1.1rem;
}

.payment-item-change {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.remove-payment-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
  flex-shrink: 0;
}

.remove-payment-btn:hover {
  background: var(--color-error);
  color: white;
  transform: scale(1.1);
}

.payment-summary-totals {
  padding-top: var(--spacing-md);
  border-top: 2px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
}

.summary-amount {
  font-weight: 700;
  font-size: 1.1rem;
}

.summary-amount.paid {
  color: var(--color-primary);
}

.summary-amount.remaining {
  color: var(--color-error);
}

.summary-amount.change {
  color: #10b981;
}

/* Formulario de método de pago actual */
.current-payment-form {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.payment-amount-section {
  margin-bottom: var(--spacing-md);
}

.amount-hint {
  margin-top: var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  text-align: right;
}

.btn-add-payment {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  margin-top: var(--spacing-md);
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.btn-add-payment:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
}

.btn-add-payment:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.validation-error {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  text-align: center;
  border: 1px solid rgba(229, 62, 62, 0.3);
}

.payment-error-message {
  margin: var(--spacing-md) var(--spacing-lg);
  padding: var(--spacing-md);
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  border: 1px solid rgba(229, 62, 62, 0.3);
}

.error-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  justify-content: center;
}

@media (max-width: 1024px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .pos-view {
    flex-direction: column;
    height: auto;
  }

  .order-panel {
    flex: 0 0 auto;
    max-height: 50vh;
  }

  .products-panel {
    flex: 1;
  }

  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
