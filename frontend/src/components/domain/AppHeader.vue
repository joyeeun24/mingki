<script setup lang="ts">
import { RotateCcwIcon, UserRoundIcon } from '@lucide/vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROLE_LABEL } from '@/lib/labels'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const isMock = import.meta.env.VITE_USE_MOCK === 'true'

/** 로그아웃 후 같은 화면으로 돌아오게 한다. 담당자 → 개발자로 바꿔 같은 작업을 이어 볼 때 쓴다 */
async function switchAccount() {
  const redirect = route.fullPath
  auth.logout()
  await router.push({ name: 'login', query: { redirect } })
}

async function resetDemo() {
  if (!isMock) return
  // 정적 import를 하면 운영 번들에 가짜 서버가 들어가므로 누를 때만 불러온다
  const { resetMock } = await import('@/mocks/browser')
  resetMock()
  toast.success('데모를 초기화했습니다')
  await router.push({ name: 'upload' })
}
</script>

<template>
  <header class="border-b bg-background">
    <div class="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
      <RouterLink :to="{ name: 'upload' }" class="font-semibold">Rule Ripple</RouterLink>
      <Badge v-if="isMock" variant="outline">가짜 서버</Badge>

      <div class="ml-auto flex items-center gap-2">
        <span v-if="auth.user" class="text-sm">
          {{ auth.user.displayName }}
          <Badge variant="secondary">{{ ROLE_LABEL[auth.user.role] }}</Badge>
        </span>

        <AlertDialog v-if="isMock">
          <AlertDialogTrigger as-child>
            <Button variant="outline" size="sm"><RotateCcwIcon />데모 초기화</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>데모를 초기화할까요?</AlertDialogTitle>
              <AlertDialogDescription class="break-keep">
                가짜 서버에 기록된 작업이 모두 지워집니다. 다른 창에서 보던 작업도 사라집니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction @click="resetDemo">초기화</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button variant="ghost" size="sm" @click="switchAccount">
          <UserRoundIcon />계정 전환
        </Button>
      </div>
    </div>
  </header>
</template>
