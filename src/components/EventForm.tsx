'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent, updateEvent } from '@/lib/actions'
import { Event } from '@/db/schema'
import { getTodayDateString } from '@/lib/utils'

type Props = {
  event?: Event
}

export function EventForm({ event }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        if (event) {
          await updateEvent(event.id, formData)
        } else {
          await createEvent(formData)
        }
        router.push('/events')
        router.refresh()
      } catch {
        setError('Ocorreu um erro. Tente novamente.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Title */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          defaultValue={event?.title}
          required
          placeholder="Ex: Consulta médica"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Date & Time row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Data <span className="text-red-500">*</span>
          </label>
          <input
            name="date"
            type="date"
            defaultValue={event?.date ?? getTodayDateString()}
            required
            min={getTodayDateString()}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Horário <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            name="time"
            type="time"
            defaultValue={event?.time ?? ''}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Local <span className="text-gray-400">(opcional)</span>
        </label>
        <input
          name="location"
          defaultValue={event?.location ?? ''}
          placeholder="Ex: Hospital das Clínicas"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Observações <span className="text-gray-400">(opcional)</span>
        </label>
        <textarea
          name="notes"
          defaultValue={event?.notes ?? ''}
          placeholder="Informações adicionais..."
          rows={3}
          className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
      >
        {isPending ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Salvando...
          </>
        ) : (
          event ? 'Salvar alterações' : 'Criar evento'
        )}
      </button>

      <button
        type="button"
        onClick={() => router.back()}
        className="py-3 text-sm font-medium text-gray-500"
      >
        Cancelar
      </button>
    </form>
  )
}
