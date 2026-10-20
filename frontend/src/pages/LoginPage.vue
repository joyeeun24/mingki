<script setup lang="ts">
import { CircleAlertIcon } from '@lucide/vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError } from '@/api/client'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { DEMO_ACCOUNTS, showDemoAccounts } from '@/lib/demoAccounts'
import { safeRedirect } from '@/router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const username = ref('')
const password = ref('')
const submitting = ref(false)
const failure = ref<string | null>(null)

async function submit(name = username.value, pass = password.value) {
  submitting.value = true
  failure.value = null
  try {
    await auth.login(name, pass)
  } catch (error) {
    failure.value =
      error instanceof ApiError && error.status === 401
        ? '아이디 또는 비밀번호가 맞지 않습니다'
        : '로그인할 수 없습니다. 서버 연결을 확인하세요'
    return
  } finally {
    submitting.value = false
  }
  // 로그인 뒤 화면 이동이 실패하면 로그인 실패가 아니다. 이동 오류는 router.onError(main.ts)가 처리한다
  await router.replace(safeRedirect(route.query.redirect) ?? { name: 'upload' })
}
</script>

<template>
  <div class="flex min-h-[70vh] items-center justify-center">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle class="text-xl">Rule Ripple</CardTitle>
        <CardDescription>규정이 바뀌면 고칠 곳을 찾아 수정안까지 만듭니다</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="submit()">
          <FieldGroup>
            <Field>
              <FieldLabel for="username">아이디</FieldLabel>
              <Input id="username" v-model="username" autocomplete="username" required />
            </Field>
            <Field>
              <FieldLabel for="password">비밀번호</FieldLabel>
              <Input
                id="password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                required
              />
            </Field>
          </FieldGroup>
          <Alert v-if="failure" variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>{{ failure }}</AlertTitle>
          </Alert>
          <Button type="submit" class="w-full" :disabled="submitting">
            <Spinner v-if="submitting" aria-hidden="true" />로그인
          </Button>
        </form>
      </CardContent>
      <CardFooter v-if="showDemoAccounts" class="flex-col items-stretch gap-2">
        <p class="text-muted-foreground text-xs">시연 계정</p>
        <Button
          v-for="account in DEMO_ACCOUNTS"
          :key="account.username"
          type="button"
          variant="outline"
          :disabled="submitting"
          @click="submit(account.username, account.password)"
        >
          {{ account.label }}
          <span class="text-muted-foreground text-xs">{{ account.hint }}</span>
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
