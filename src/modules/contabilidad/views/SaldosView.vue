<script setup>
import { ref, onMounted } from 'vue'
import { contabilidadService } from '../services/contabilidadService'

// Estado
const accounts = ref([])
const isLoading = ref(true)
const error = ref(null)

// Cargar cuentas
const loadAccounts = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    accounts.value = await contabilidadService.getAccounts()
  } catch (err) {
    console.error('Error al cargar cuentas:', err)
    error.value = err.message || 'Error al cargar las cuentas'
  } finally {
    isLoading.value = false
  }
}

// Formatear precio
const formatPrice = (price) => {
  if (price === undefined || price === null) return '$0.00'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price)
}

// Cargar datos al montar
onMounted(() => {
  loadAccounts()
})
</script>

<template>
  <div class="saldos-page">
    <header class="page-header">
      <div>
        <h1>Saldos</h1>
        <p>Resumen de cuentas del sistema</p>
      </div>
      <button class="btn-primary" @click="loadAccounts" :disabled="isLoading">
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
      <p>Cargando cuentas...</p>
    </div>

    <!-- Estado de error -->
    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
      <button class="btn-primary" @click="loadAccounts">Reintentar</button>
    </div>

    <!-- Grid de cuentas -->
    <div v-else class="accounts-grid">
      <div v-if="accounts.length === 0" class="empty-state">
        <span class="empty-icon">💰</span>
        <p>No hay cuentas disponibles</p>
      </div>

      <div 
        v-for="account in accounts" 
        :key="account._id"
        class="account-card"
      >
        <div class="account-header">
          <h3 class="account-label">{{ account.label }}</h3>
        </div>
        <div class="account-balance">
          {{ formatPrice(account.balance) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.saldos-page {
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

/* Grid de cuentas */
.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

/* Card de cuenta */
.account-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-xl);
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.account-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.account-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.account-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.account-balance {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-secondary);
  line-height: 1.2;
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
  .accounts-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .accounts-grid {
    grid-template-columns: 1fr;
  }
  
  .account-balance {
    font-size: 1.75rem;
  }
}
</style>

