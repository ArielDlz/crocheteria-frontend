<script setup>
// Módulo de Inventarios
</script>

<template>
  <div class="module-page">
    <header class="page-header">
      <div>
        <h1>📦 Inventarios</h1>
        <p>Gestiona el inventario de productos</p>
      </div>
      <button class="btn-primary">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Nuevo Producto
      </button>
    </header>

    <div class="card">
      <div class="empty-state">
        <span class="empty-icon">📦</span>
        <h3>Módulo de Inventarios</h3>
        <p>Aquí podrás gestionar los productos, categorías y stock de Crochetería</p>
        <p class="hint">Este módulo está en desarrollo</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.module-page {
  animation: fadeIn 0.5s ease-out;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.page-header h1 {
  font-size: 1.75rem;
  margin-bottom: var(--spacing-xs);
}

.page-header p {
  color: var(--color-text-secondary);
}

.card {
  background: var(--color-white);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: var(--spacing-lg);
}

.empty-state h3 {
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
}

.empty-state p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.hint {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-style: italic;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

