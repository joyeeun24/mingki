<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { createTask } from '@/api/tasks'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { notifyError } from '@/lib/notify'

// 백엔드와 같은 검사를 보내기 전에 한 번 더 한다 (TaskService.readText)
const ALLOWED_EXT = ['md', 'markdown', 'txt']
const MAX_BYTES = 1024 * 1024

type Side = 'old' | 'new'

const router = useRouter()
const files = reactive<Record<Side, File | null>>({ old: null, new: null })
const errors = reactive<Record<Side, string | undefined>>({ old: undefined, new: undefined })
const title = ref('')
const submitting = ref(false)

function check(file: File | null): string | undefined {
  if (!file) return '파일을 고르세요'
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
  if (!ALLOWED_EXT.includes(ext)) return '.md · .markdown · .txt 파일만 올릴 수 있습니다'
  if (file.size === 0) return '빈 파일입니다'
  if (file.size > MAX_BYTES) return '1MB 이하 파일만 올릴 수 있습니다'
  return undefined
}

function pick(side: Side, event: Event) {
  files[side] = (event.target as HTMLInputElement).files?.[0] ?? null
  errors[side] = files[side] ? check(files[side]) : undefined
}

async function submit() {
  errors.old = check(files.old)
  errors.new = check(files.new)
  if (errors.old || errors.new) return

  submitting.value = true
  try {
    const { taskId } = await createTask({
      oldFile: files.old!,
      newFile: files.new!,
      title: title.value.trim() || undefined,
    })
    toast.success('규정을 올렸습니다', { description: '요건 추출을 시작합니다' })
    await router.push({ name: 'task-progress', params: { id: taskId } })
  } catch (error) {
    notifyError(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Card class="mx-auto max-w-2xl">
    <CardHeader>
      <CardTitle class="text-xl">규정 업로드</CardTitle>
      <CardDescription>
        바뀌기 전 · 바뀐 후 규정을 올리면 요건을 추출하고 고칠 곳을 찾습니다
      </CardDescription>
    </CardHeader>
    <form @submit.prevent="submit">
      <CardContent>
        <FieldGroup>
          <Field :data-invalid="errors.old ? true : undefined">
            <FieldLabel for="old-file">바뀌기 전 규정 (예: v3.md)</FieldLabel>
            <Input
              id="old-file"
              type="file"
              accept=".md,.markdown,.txt"
              :aria-invalid="errors.old ? true : undefined"
              @change="pick('old', $event)"
            />
            <FieldDescription>md · markdown · txt, 1MB 이하</FieldDescription>
            <FieldError v-if="errors.old">{{ errors.old }}</FieldError>
          </Field>
          <Field :data-invalid="errors.new ? true : undefined">
            <FieldLabel for="new-file">바뀐 후 규정 (예: v4.md)</FieldLabel>
            <Input
              id="new-file"
              type="file"
              accept=".md,.markdown,.txt"
              :aria-invalid="errors.new ? true : undefined"
              @change="pick('new', $event)"
            />
            <FieldError v-if="errors.new">{{ errors.new }}</FieldError>
          </Field>
          <Field>
            <FieldLabel for="title">작업 이름 (선택)</FieldLabel>
            <Input id="title" v-model="title" maxlength="200" placeholder="비우면 규정 이름으로" />
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter class="mt-6 justify-end">
        <Button type="submit" :disabled="submitting">
          <Spinner v-if="submitting" aria-hidden="true" />분석 시작
        </Button>
      </CardFooter>
    </form>
  </Card>
</template>
