<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '@/modules/auth'
import { salesService } from '@/modules/ventas/services/salesService'

const { user } = useAuth()

// Estado de ventas
const sales = ref([])
const isLoadingSales = ref(false)
const salesError = ref(null)

// Cargar ventas recientes
const loadRecentSales = async () => {
  isLoadingSales.value = true
  salesError.value = null
  
  try {
    const salesData = await salesService.getSales()
    // Limitar a las 10 ventas más recientes
    sales.value = salesData
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
  } catch (err) {
    console.error('Error al cargar ventas:', err)
    salesError.value = err.message || 'Error al cargar las ventas recientes'
  } finally {
    isLoadingSales.value = false
  }
}

// Formatear fecha
const formatDate = (dateString) => {
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
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price)
}

// Obtener nombre completo del usuario
const getUserName = (sale) => {
  const user = sale.user
  if (!user) return 'N/A'
  return `${user.name || ''} ${user.family_name || user.familyName || ''}`.trim() || user.email || 'Usuario'
}

// Obtener resumen de productos
const getProductsSummary = (sale) => {
  if (!sale.sales_lines || sale.sales_lines.length === 0) return 'Sin productos'
  
  const totalItems = sale.sales_lines.reduce((sum, line) => sum + line.quantity, 0)
  if (sale.sales_lines.length === 1) {
    return `${sale.sales_lines[0].quantity}x ${sale.sales_lines[0].product?.name || 'Producto'}`
  }
  return `${totalItems} productos (${sale.sales_lines.length} diferentes)`
}

// Cargar ventas al montar
onMounted(() => {
  loadRecentSales()
})
</script>

<template>
  <div class="dashboard-page">
    <header class="page-header">
      <div>
        <h1>¡Bienvenido de vuelta! 👋</h1>
        <p>{{ user?.email || 'Usuario' }} - Aquí está el resumen de tu negocio</p>
      </div>
    </header>

    <!-- Cards de estadísticas -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon sales">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">$12,450</span>
          <span class="stat-label">Ventas del mes</span>
        </div>
        <span class="stat-badge positive">+12%</span>
      </div>

      <div class="stat-card">
        <div class="stat-icon orders">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">89</span>
          <span class="stat-label">Pedidos</span>
        </div>
        <span class="stat-badge positive">+5%</span>
      </div>

      <div class="stat-card">
        <div class="stat-icon products">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">156</span>
          <span class="stat-label">Productos</span>
        </div>
        <span class="stat-badge neutral">0%</span>
      </div>

      <div class="stat-card">
        <div class="stat-icon customers">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">324</span>
          <span class="stat-label">Clientes</span>
        </div>
        <span class="stat-badge positive">+18%</span>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="dashboard-content">
      <div class="card recent-sales">
        <div class="card-header">
          <h3>Ventas Recientes</h3>
          <button 
            v-if="!isLoadingSales" 
            class="btn-refresh"
            @click="loadRecentSales"
            title="Actualizar ventas"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
          </button>
        </div>

        <!-- Estado de carga -->
        <div v-if="isLoadingSales" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando ventas...</p>
        </div>

        <!-- Estado de error -->
        <div v-else-if="salesError" class="error-state">
          <span class="error-icon">⚠️</span>
          <p>{{ salesError }}</p>
          <button class="btn-primary" @click="loadRecentSales">Reintentar</button>
        </div>

        <!-- Lista vacía -->
        <div v-else-if="sales.length === 0" class="empty-state">
          <span class="empty-icon">📦</span>
          <p>No hay ventas recientes</p>
        </div>

        <!-- Lista de ventas -->
        <div v-else class="sales-list">
          <div 
            v-for="sale in sales" 
            :key="sale._id"
            class="sale-item"
          >
            <div class="sale-header">
              <div class="sale-info">
                <div class="sale-user">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>{{ getUserName(sale) }}</span>
                </div>
                <div class="sale-date">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{{ formatDate(sale.createdAt) }}</span>
                </div>
              </div>
              <div class="sale-amount">
                {{ formatPrice(sale.total_ammount) }}
              </div>
            </div>
            
            <div class="sale-details">
              <div class="sale-products">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
                <span>{{ getProductsSummary(sale) }}</span>
              </div>
              <div class="sale-status">
                <span 
                  class="status-badge"
                  :class="{
                    'status-paid': sale.status === 'paid',
                    'status-pending': sale.status === 'pending',
                    'status-cancelled': sale.status === 'cancelled'
                  }"
                >
                  {{ sale.status === 'paid' ? 'Pagado' : sale.status === 'pending' ? 'Pendiente' : 'Cancelado' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card quick-actions">
        <h3>Acciones Rápidas</h3>
        <div class="actions-grid">
          <router-link to="/ventas/nueva" class="action-btn">
            <span class="action-icon">🛒</span>
            <span>Nueva Venta</span>
          </router-link>
          <router-link to="/inventarios/productos" class="action-btn">
            <span class="action-icon">📦</span>
            <span>Agregar Producto</span>
          </router-link>
          <router-link to="/usuarios/lista" class="action-btn">
            <span class="action-icon">👤</span>
            <span>Ver Usuarios</span>
          </router-link>
          <router-link to="/ventas/reportes" class="action-btn">
            <span class="action-icon">📊</span>
            <span>Ver Reportes</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  animation: fadeIn 0.5s ease-out;
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-header h1 {
  font-size: 1.75rem;
  margin-bottom: var(--spacing-xs);
}

.page-header p {
  color: var(--color-text-secondary);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: var(--color-white);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  position: relative;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.sales { background: linear-gradient(135deg, var(--color-secondary), var(--color-secondary-dark)); }
.stat-icon.orders { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); }
.stat-icon.products { background: linear-gradient(135deg, #F59E0B, #D97706); }
.stat-icon.customers { background: linear-gradient(135deg, var(--color-accent), #B91C1C); }

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.stat-badge {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.stat-badge.positive {
  background: rgba(45, 143, 92, 0.1);
  color: var(--color-secondary);
}

.stat-badge.negative {
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
}

.stat-badge.neutral {
  background: var(--color-background);
  color: var(--color-text-muted);
}

/* Dashboard Content */
.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-lg);
}

.card {
  background: var(--color-white);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.card h3 {
  font-size: 1.1rem;
  margin: 0;
  color: var(--color-text-primary);
}

.btn-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--color-background);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
}

.btn-refresh:hover {
  background: var(--color-primary);
  color: white;
  transform: rotate(180deg);
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  text-align: center;
  color: var(--color-text-muted);
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state .error-icon,
.empty-state .empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.error-state button {
  margin-top: var(--spacing-md);
}

.empty-state {
  padding: var(--spacing-2xl);
}

/* Lista de ventas */
.sales-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-height: 600px;
  overflow-y: auto;
}

.sale-item {
  padding: var(--spacing-md);
  background: var(--color-background);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  transition: all var(--transition-fast);
}

.sale-item:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
  border-color: var(--color-primary-light);
}

.sale-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.sale-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
}

.sale-user {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.sale-user svg {
  color: var(--color-text-secondary);
}

.sale-date {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.sale-date svg {
  color: var(--color-text-muted);
}

.sale-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-secondary);
}

.sale-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border);
}

.sale-products {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  flex: 1;
}

.sale-products svg {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-paid {
  background: rgba(45, 143, 92, 0.1);
  color: var(--color-secondary);
}

.status-pending {
  background: rgba(245, 158, 11, 0.1);
  color: #D97706;
}

.status-cancelled {
  background: rgba(229, 62, 62, 0.1);
  color: var(--color-error);
}

/* Quick Actions */
.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: var(--color-background);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
  font-size: 0.9rem;
}

.action-btn:hover {
  background: var(--color-primary);
  color: white;
  transform: scale(1.02);
}

.action-icon {
  font-size: 1.5rem;
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
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>

