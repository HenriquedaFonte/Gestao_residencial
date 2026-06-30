'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { deleteEvent } from '@/lib/actions'
import { Event } from '@/db/schema'
import { formatDate, formatDateShort, isToday, isPast } from '@/lib/utils'

type Props = {
  event: Event
  compact?: boolean
}

export function EventCard({ event, compact = false }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showDelete, setShowDelete] = useState(false)

  const past = isPast(event.date)
  const today = isToday(event.date)

  function handleDelete() {
    startTransition(async () => {
      await deleteEvent(event.id)
    })
  }

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all ${
        past
          ? 'border-gray-100 bg-gray-50 opacity-60'
          : today
          ? 'border-indigo-200 bg-indigo-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Date badge */}
        <div
          className={`flex flex-shrink-0 flex-col items-center rounded-xl px-3 py-1.5 text-center ${
            today
              ? 'bg-indigo-600 text-white'
              : past
              ? 'bg-gray-200 text-gray-500'
              : 'bg-indigo-100 text-indigo-700'
          }`}
        >
          <span className="text-xs font-semibold uppercase">
            {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
          </span>
          <span className="text-xl font-bold leading-none">
            {new Date(event.date + 'T12:00:00').getDate()}
          </span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <Link href={`/events/${event.id}`}>
            <h3 className="font-semibold text-gray-800">{event.title}</h3>
            {!compact && (
              <>
                <div className="mt-1 flex flex-wrap gap-2">
                  {event.time && (
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      🕐 {event.time}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      📍 {event.location}
                    </span>
                  )}
                </div>
                {event.notes && (
                  <p className="mt-1 truncate text-sm text-gray-400">{event.notes}</p>
                )}
              </>
            )}
            {compact && event.time && (
              <p className="text-sm text-gray-500">🕐 {event.time}</p>
            )}
            {today && (
              <span className="mt-1 inline-block rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                Hoje!
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
                className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDelete(true)}
              className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
