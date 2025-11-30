<script setup>
import { useAuth } from '@/modules/auth'

const { user } = useAuth()
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
        <h3>Ventas Recientes</h3>
        <div class="empty-state">
          <span class="empty-icon">📦</span>
          <p>Las ventas recientes aparecerán aquí</p>
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

.card h3 {
  font-size: 1.1rem;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
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

