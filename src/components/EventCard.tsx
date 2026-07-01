'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { deleteEvent } from '@/lib/actions'
import { Event } from '@/db/schema'
import { isToday, isPast } from '@/lib/utils'

type Props = {
  event: Event
  compact?: boolean
}

const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
)

const PinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
)

export function EventCard({ event, compact = false }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showDelete, setShowDelete] = useState(false)

  const past = isPast(event.date)
  const today = isToday(event.date)

  const dateObj = new Date(event.date + 'T12:00:00')
  const dayNum = dateObj.getDate()
  const monthStr = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '')

  function handleDelete() {
    startTransition(async () => {
      await deleteEvent(event.id)
    })
  }

  return (
    <div
      className={`relative rounded-2xl border p-3 transition-all ${
        past
          ? 'border-line bg-paper opacity-60'
          : today
          ? 'border-terracotta/40 bg-terracotta-soft'
          : 'border-line bg-card'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Date badge */}
        <div
          className={`flex flex-shrink-0 flex-col items-center rounded-xl px-2.5 py-1.5 text-center ${
            today
              ? 'bg-terracotta text-white'
              : past
              ? 'bg-line text-muted'
              : 'bg-terracotta-soft text-terracotta'
          }`}
        >
          <span className="text-[9px] font-bold tracking-wide">{monthStr}</span>
          <span className="font-serif text-xl font-semibold leading-none">{dayNum}</span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <Link href={`/events/${event.id}`}>
            <h3 className="text-[13.5px] font-semibold text-ink">{event.title}</h3>
            {!compact && (
              <div className="mt-1 flex flex-col gap-0.5">
                {event.time && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted">
                    <ClockIcon /> {event.time}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted">
                    <PinIcon /> {event.location}
                  </span>
                )}
                {event.notes && (
                  <p className="mt-0.5 truncate text-[11px] text-muted">{event.notes}</p>
                )}
              </div>
            )}
            {compact && (event.time || event.location) && (
              <p className="mt-0.5 text-[11px] text-muted">
                {[event.time, event.location].filter(Boolean).join(' · ')}
              </p>
            )}
            {today && (
              <span className="mt-1.5 inline-block rounded-full bg-terracotta px-2 py-0.5 text-[10px] font-semibold text-white">
                Hoje
              </span>
            )}
          </Link>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          {showDelete ? (
            <div className="flex gap-1">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-600"
              >
                Excluir
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="rounded-lg border border-line bg-card px-2 py-1 text-xs font-medium text-muted"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDelete(true)}
              className="rounded-lg p-1.5 text-line hover:bg-red-50 hover:text-red-400"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
