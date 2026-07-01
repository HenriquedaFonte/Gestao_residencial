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

  const inputClass =
    'w-full rounded-[13px] border border-line bg-card px-4 py-3 text-[13px] font-medium text-ink placeholder-muted outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta-soft'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <label className="mb-1.5 block text-[11.5px] font-semibold text-muted">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          defaultValue={event?.title}
          required
          placeholder="Ex: Consulta médica"
          className={inputClass}
        />
      </div>

      {/* Date & Time row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[11.5px] font-semibold text-muted">
            Data <span className="text-red-500">*</span>
          </label>
          <input
            name="date"
            type="date"
            defaultValue={event?.date ?? getTodayDateString()}
            required
            min={getTodayDateString()}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11.5px] font-semibold text-muted">
            Horário <span className="text-muted font-normal">(opcional)</span>
          </label>
          <input
            name="time"
            type="time"
            defaultValue={event?.time ?? ''}
            className={inputClass}
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="mb-1.5 block text-[11.5px] font-semibold text-muted">
          Local <span className="text-muted font-normal">(opcional)</span>
        </label>
        <input
          name="location"
          defaultValue={event?.location ?? ''}
          placeholder="Ex: Hospital das Clínicas"
          className={inputClass}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1.5 block text-[11.5px] font-semibold text-muted">
          Observações <span className="text-muted font-normal">(opcional)</span>
        </label>
        <textarea
          name="notes"
          defaultValue={event?.notes ?? ''}
          placeholder="Informações adicionais..."
          rows={3}
          className={`${inputClass} resize-none`}
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
        className="mt-2 flex items-center justify-center gap-2 rounded-[14px] bg-terracotta py-3 text-[14px] font-semibold text-white transition-colors hover:bg-terracotta-dark disabled:opacity-60"
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
        className="py-2 text-sm font-medium text-muted"
      >
        Cancelar
      </button>
    </form>
  )
}
