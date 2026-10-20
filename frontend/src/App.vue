<script setup lang="ts">
import { RouterView } from 'vue-router'

import AppHeader from '@/components/domain/AppHeader.vue'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="min-h-screen bg-muted/30">
    <AppHeader v-if="auth.isLoggedIn" />
    <main class="mx-auto w-full max-w-6xl px-4 py-6">
      <!-- 다른 작업으로 이동하면 작업 레이아웃(폴링)을 새로 시작한다 -->
      <RouterView v-slot="{ Component, route }">
        <component :is="Component" :key="String(route.params.id ?? route.path)" />
      </RouterView>
    </main>
    <!-- 화면이 바뀌어도 토스트가 남도록 RouterView 밖에 하나만 둔다 -->
    <Toaster position="top-center" rich-colors close-button />
  </div>
</template>
