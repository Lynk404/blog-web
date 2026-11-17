<script setup lang="ts">
import type { Component } from 'vue'
import { Bell, ChatDotRound, Reading } from '@element-plus/icons-vue'

interface Slide {
  tag: string
  title: string
  summary: string
  date: string
  icon: Component
}

// 占位公告：后端公告接口接入后替换此数组
const slides: Slide[] = [
  {
    tag: '系统公告',
    title: 'Yes论坛使用指南',
    summary: '从创建专栏到发布帖子，快速了解 Yes论坛的基本功能、内容组织方式与常用操作。',
    date: '2026-11-17',
    icon: Reading,
  },
  {
    tag: '社区公告',
    title: '社区公约',
    summary: '友善讨论、尊重原创、拒绝灌水。共同维护一个清晰、可持续的交流空间。',
    date: '2026-11-17',
    icon: ChatDotRound,
  },
  {
    tag: '功能预告',
    title: '消息中心建设中',
    summary: '消息接口接入后，铃铛入口会集中展示系统通知与互动提醒。',
    date: '2026-11-17',
    icon: Bell,
  },
]

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
</script>

<template>
  <section class="home-carousel" aria-label="站内公告">
    <el-carousel :interval="5000" :autoplay="!prefersReducedMotion" arrow="hover">
      <el-carousel-item v-for="(slide, index) in slides" :key="slide.title">
        <article class="slide" :class="`is-${index + 1}`">
          <div class="slide-content">
            <span class="slide-tag">{{ slide.tag }}</span>
            <h2 class="slide-title">{{ slide.title }}</h2>
            <p class="slide-summary">{{ slide.summary }}</p>
            <time class="slide-date">{{ slide.date }}</time>
          </div>
          <div class="slide-art" aria-hidden="true">
            <span class="art-disc">
              <el-icon :size="70"><component :is="slide.icon" /></el-icon>
            </span>
          </div>
        </article>
      </el-carousel-item>
    </el-carousel>
  </section>
</template>

<style scoped>
.home-carousel {
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--app-surface);
}

.home-carousel :deep(.el-carousel__container) {
  height: 320px;
}

.home-carousel :deep(.el-carousel__arrow) {
  width: 40px;
  height: 40px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color-overlay);
  color: var(--el-text-color-primary);
}

.home-carousel :deep(.el-carousel__arrow:hover) {
  border-color: var(--el-color-primary);
  background: var(--app-gold-soft);
  color: var(--el-color-primary-light-3);
}

.home-carousel :deep(.el-carousel__button) {
  width: 24px;
  height: 3px;
  border-radius: 999px;
  background: var(--el-text-color-placeholder);
  opacity: 0.55;
}

.home-carousel :deep(.el-carousel__indicator.is-active .el-carousel__button) {
  background: var(--el-color-primary);
  opacity: 1;
}

.slide {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  height: 100%;
  padding: 36px 56px;
  overflow: hidden;
}

.slide::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 82% 18%, var(--app-gold-soft) 0%, transparent 55%);
  pointer-events: none;
}

.slide.is-1 {
  background: var(--app-purple-gradient);
}

.slide.is-2 {
  background: var(--app-hot-gradient);
}

.slide.is-3 {
  background: var(--app-announce-gradient);
}

.slide-content {
  position: relative;
  z-index: 1;
  max-width: 620px;
  min-width: 0;
}

.slide-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border: 1px solid var(--el-color-primary);
  border-radius: 999px;
  background: var(--app-gold-soft);
  color: var(--el-color-primary-light-3);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.slide-title {
  margin: 16px 0 10px;
  color: var(--app-on-purple);
  font-size: clamp(22px, 2.4vw, 30px);
  font-weight: 600;
  line-height: 1.25;
}

.slide-summary {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--app-on-purple);
  font-size: 14px;
  line-height: 1.7;
  opacity: 0.72;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.slide-date {
  display: block;
  margin-top: 18px;
  color: var(--app-on-purple);
  font-size: 12px;
  opacity: 0.55;
}

.slide-art {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.art-disc {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 168px;
  height: 168px;
  border: 1px solid var(--el-color-primary);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, var(--app-gold-soft) 0%, transparent 68%);
  box-shadow: 0 0 0 12px var(--app-gold-soft);
  color: var(--el-color-primary-light-3);
}

@media (max-width: 820px) {
  .home-carousel :deep(.el-carousel__container) {
    height: 240px;
  }

  .slide {
    gap: 16px;
    padding: 24px 28px;
  }

  .slide-title {
    margin-top: 12px;
  }

  .art-disc {
    width: 128px;
    height: 128px;
  }
}

@media (max-width: 600px) {
  .home-carousel :deep(.el-carousel__container) {
    height: 200px;
  }

  .slide {
    padding: 20px 24px;
  }

  .slide-title {
    font-size: 21px;
  }

  .slide-summary {
    font-size: 13px;
    -webkit-line-clamp: 2;
  }

  .slide-date {
    margin-top: 12px;
  }

  .slide-art {
    display: none;
  }
}
</style>
