<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <RouterLink to="/" class="brand" aria-label="返回首页">
    <span class="brand-text">Yes论坛</span>
  </RouterLink>
</template>

<style scoped>
.brand {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: 24px;
  font-weight: 600;
  color: var(--app-logo-color);
  white-space: nowrap;
  text-decoration: none;
  isolation: isolate;
}

/* 文字背后的蓝色光晕，缓慢明暗呼吸 */
.brand::before {
  content: '';
  position: absolute;
  inset: -20px -32px;
  z-index: -1;
  background: radial-gradient(ellipse at center, var(--app-logo-glow), transparent 70%);
  border-radius: 50%;
  filter: blur(14px);
  opacity: 0.85;
  pointer-events: none;
  animation: brand-aura 6s ease-in-out infinite;
}

/* 渐变扫光：高光带横向缓慢扫过文字 */
.brand-text {
  background: linear-gradient(
    100deg,
    var(--app-logo-color) 0%,
    var(--app-logo-color) 38%,
    var(--app-logo-shine) 50%,
    var(--app-logo-color) 62%,
    var(--app-logo-color) 100%
  );
  background-size: 260% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 6px var(--app-logo-glow));
  animation: brand-flow 7s linear infinite;
}

.brand:hover::before {
  opacity: 1;
}

@keyframes brand-flow {
  from {
    background-position: 220% 0;
  }

  to {
    background-position: -120% 0;
  }
}

@keyframes brand-aura {
  0%,
  100% {
    opacity: 0.65;
    transform: scale(0.98);
  }

  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

@media (max-width: 600px) {
  .brand {
    font-size: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand::before {
    animation: none;
    opacity: 0.7;
  }

  .brand-text {
    background: none;
    color: var(--app-logo-color);
    animation: none;
  }
}
</style>
