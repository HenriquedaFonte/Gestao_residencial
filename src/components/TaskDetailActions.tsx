'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTask } from '@/lib/actions'

type Props = {
  taskId: number
  taskTitle: string
}

export function TaskDetailActions({ taskId, taskTitle }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Excluir "${taskTitle}"?`)) return
    startTransition(async () => {
      await deleteTask(taskId)
      router.push('/tasks')
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="w-full rounded-[14px] border border-red-200 py-3 text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60"
    >
      {isPending ? 'Excluindo...' : 'Excluir tarefa'}
    </button>
  )
}
