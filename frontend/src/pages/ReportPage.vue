<script setup lang="ts">
import { DownloadIcon, ExternalLinkIcon, FileTextIcon } from '@lucide/vue'
import MarkdownIt from 'markdown-it'
import { computed } from 'vue'

import { getReport } from '@/api/tasks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTaskContext } from '@/composables/taskContext'
import { useTaskResource } from '@/composables/useTaskResource'
import { DELIVERY_KIND_LABEL } from '@/lib/labels'

// html: false라서 명세서 안의 HTML은 글자로 나온다. javascript: 같은 링크도 markdown-it이 막는다
const markdown = new MarkdownIt({ html: false, linkify: false })

const context = useTaskContext()
const { data } = useTaskResource(getReport)
const isMock = import.meta.env.VITE_USE_MOCK === 'true'

const report = computed(() => data.value?.report ?? null)
const html = computed(() => (report.value ? markdown.render(report.value.markdown) : ''))

function download() {
  if (!report.value) return
  const blob = new Blob([report.value.markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${context.detail.value!.task.title} 명세서.md`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <Skeleton v-if="!data" class="h-96 w-full" aria-busy="true" />

  <Empty v-else-if="!report" class="border">
    <EmptyHeader>
      <EmptyMedia variant="icon"><FileTextIcon /></EmptyMedia>
      <EmptyTitle>아직 명세서가 없습니다</EmptyTitle>
      <EmptyDescription>승인 뒤 PR · 티켓을 만들고 나면 변경 명세서가 나옵니다.</EmptyDescription>
    </EmptyHeader>
  </Empty>

  <div v-else class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <Card class="min-w-0">
      <CardHeader>
        <CardTitle>개발 변경 명세서</CardTitle>
        <CardDescription class="break-keep">{{ report.summary }}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" @click="download">
            <DownloadIcon />Markdown 다운로드
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <!-- eslint-disable-next-line vue/no-v-html -- html: false로 만든 markdown-it 결과 -->
        <article
          class="prose prose-neutral [&_td:first-child]:whitespace-nowrap prose-table:block prose-table:overflow-x-auto prose-code:before:content-none prose-code:after:content-none max-w-none break-keep"
          v-html="html"
        />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>결과물</CardTitle>
        <CardDescription v-if="isMock">가짜 서버의 예시 번호입니다</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>종류</TableHead>
              <TableHead>참조</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="d in data.deliveries" :key="d.id">
              <TableCell>
                <Badge :variant="d.kind === 'PR' ? 'default' : 'secondary'">
                  {{ DELIVERY_KIND_LABEL[d.kind] }}
                </Badge>
              </TableCell>
              <TableCell class="font-mono text-xs">
                <span v-if="isMock || !d.url">{{ d.externalRef }}</span>
                <a
                  v-else
                  :href="d.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 underline"
                >
                  {{ d.externalRef }}<ExternalLinkIcon class="size-3" aria-hidden="true" />
                </a>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
