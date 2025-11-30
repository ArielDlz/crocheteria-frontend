<script setup>
import LoginForm from '../components/LoginForm.vue'
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Panel izquierdo - Branding -->
      <div class="login-branding">
        <div class="branding-content">
          <div class="logo">
            <span class="logo-icon">🧶</span>
            <h1 class="logo-text">Crochetería</h1>
          </div>
          <p class="tagline">Sistema de Administración</p>
          <div class="decorative-yarn"></div>
        </div>
        <div class="branding-footer">
          <p>Gestiona tu negocio de manera simple y eficiente</p>
        </div>
      </div>

      <!-- Panel derecho - Formulario -->
      <div class="login-form-panel">
        <LoginForm />
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  padding: var(--spacing-lg);
}

.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  max-width: 1000px;
  min-height: 600px;
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: fadeIn 0.6s ease-out;
}

/* Panel de Branding */
.login-branding {
  background: linear-gradient(145deg, var(--color-primary) 0%, var(--color-secondary-dark) 100%);
  padding: var(--spacing-2xl);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.login-branding::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
  pointer-events: none;
}

.login-branding::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -30%;
  width: 80%;
  height: 80%;
  background: radial-gradient(circle, rgba(45, 143, 92, 0.3) 0%, transparent 60%);
  pointer-events: none;
}

.branding-content {
  position: relative;
  z-index: 1;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.logo-icon {
  font-size: 3.5rem;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}

.logo-text {
  color: var(--color-white);
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.tagline {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  font-weight: 500;
}

.decorative-yarn {
  margin-top: var(--spacing-2xl);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, var(--color-accent), transparent);
  border-radius: var(--radius-full);
}

.branding-footer {
  position: relative;
  z-index: 1;
}

.branding-footer p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.6;
}

/* Panel del Formulario */
.login-form-panel {
  padding: var(--spacing-2xl);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive */
@media (max-width: 768px) {
  .login-container {
    grid-template-columns: 1fr;
    max-width: 450px;
  }

  .login-branding {
    padding: var(--spacing-xl);
    min-height: auto;
  }

  .logo-icon {
    font-size: 2.5rem;
  }

  .logo-text {
    font-size: 1.8rem;
  }

  .decorative-yarn {
    margin-top: var(--spacing-lg);
  }

  .branding-footer {
    display: none;
  }

  .login-form-panel {
    padding: var(--spacing-xl);
  }
}
</style>

