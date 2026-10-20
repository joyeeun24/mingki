<script setup lang="ts">
import { computed } from 'vue'

// unified diff를 줄마다 색으로 보여준다. 프로젝터에서도 보이게 배경을 진하게, +/- 기호는 그대로 둔다
const props = defineProps<{ diff: string }>()

type Kind = 'file' | 'hunk' | 'add' | 'del' | 'context'

const CLASS: Record<Kind, string> = {
  file: 'text-muted-foreground font-semibold',
  hunk: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  add: 'bg-emerald-200 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-50',
  del: 'bg-rose-200 text-rose-950 dark:bg-rose-900 dark:text-rose-50',
  context: '',
}

function kindOf(line: string): Kind {
  if (line.startsWith('+++') || line.startsWith('---')) return 'file'
  if (line.startsWith('@@')) return 'hunk'
  if (line.startsWith('+')) return 'add'
  if (line.startsWith('-')) return 'del'
  return 'context'
}

const lines = computed(() => props.diff.split('\n').map((text) => ({ text, kind: kindOf(text) })))
</script>

<template>
  <pre
    class="overflow-x-auto rounded-md border bg-background py-2 font-mono text-[13px] leading-6"
  ><code class="block min-w-max"><span
    v-for="(line, i) in lines"
    :key="i"
    :data-kind="line.kind"
    class="block px-3 whitespace-pre"
    :class="CLASS[line.kind]"
  >{{ line.text || ' ' }}</span></code></pre>
</template>
