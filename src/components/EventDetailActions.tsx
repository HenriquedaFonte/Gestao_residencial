'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEvent } from '@/lib/actions'

type Props = {
  eventId: number
  eventTitle: string
}

export function EventDetailActions({ eventId, eventTitle }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Excluir "${eventTitle}"?`)) return
    startTransition(async () => {
      await deleteEvent(eventId)
      router.push('/events')
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="w-full rounded-[14px] border border-red-200 py-3 text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60"
    >
      {isPending ? 'Excluindo...' : 'Excluir evento'}
    </button>
  )
}
