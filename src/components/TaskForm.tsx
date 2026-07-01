'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTask, updateTask } from '@/lib/actions'
import { Task } from '@/db/schema'

const DAYS = [
  { value: '0', label: 'Dom' },
  { value: '1', label: 'Seg' },
  { value: '2', label: 'Ter' },
  { value: '3', label: 'Qua' },
  { value: '4', label: 'Qui' },
  { value: '5', label: 'Sex' },
  { value: '6', label: 'Sáb' },
]

const inputClass =
  'w-full rounded-[13px] border border-line bg-card px-4 py-3 text-[13px] font-medium text-ink placeholder-muted outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta-soft'

type Props = {
  task?: Task
}

export function TaskForm({ task }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring ?? false)
  const [selectedDays, setSelectedDays] = useState<string[]>(
    task?.recurrenceDays ? task.recurrenceDays.split(',') : []
  )
  const [error, setError] = useState('')

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (isRecurring && selectedDays.length === 0) {
      setError('Selecione pelo menos um dia para a recorrência.')
      return
    }

    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('isRecurring', String(isRecurring))
    formData.set('recurrenceDays', selectedDays.sort().join(','))

    startTransition(async () => {
      try {
        if (task) {
          await updateTask(task.id, formData)
        } else {
          await createTask(formData)
        }
        router.push('/tasks')
        router.refresh()
      } catch {
        setError('Ocorreu um erro. Tente novamente.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <label className="mb-1.5 block text-[11.5px] font-semibold text-muted">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          defaultValue={task?.title}
          required
          placeholder="Ex: Lavar a louça"
          className={inputClass}
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-[11.5px] font-semibold text-muted">
          Descrição <span className="text-muted font-normal">(opcional)</span>
        </label>
        <textarea
          name="description"
          defaultValue={task?.description ?? ''}
          placeholder="Detalhes adicionais..."
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Assignee */}
      <div>
        <label className="mb-1.5 block text-[11.5px] font-semibold text-muted">
          Responsável
        </label>
        <select
          name="assigneeId"
          defaultValue={task?.assigneeId ?? ''}
          className={inputClass}
        >
          <option value="">Qualquer um dos dois</option>
          <option value="1">Henrique</option>
          <option value="2">Josiane</option>
        </select>
      </div>

      {/* Recurring toggle */}
      <div className="rounded-[14px] border border-line bg-card p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <div
            onClick={() => setIsRecurring(!isRecurring)}
            className={`relative h-[22px] w-10 rounded-full transition-colors ${
              isRecurring ? 'bg-terracotta' : 'bg-line'
            }`}
          >
            <div
              className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${
                isRecurring ? 'translate-x-[20px]' : 'translate-x-[2px]'
              }`}
            />
          </div>
          <div>
            <div className="text-[12.5px] font-semibold text-ink">Tarefa recorrente</div>
            <div className="text-[10.5px] text-muted">Repete semanalmente</div>
          </div>
        </label>

        {isRecurring && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {DAYS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleDay(value)}
                className={`rounded-2xl px-3 py-1.5 text-[10.5px] font-semibold transition-colors ${
                  selectedDays.includes(value)
                    ? 'bg-terracotta text-white'
                    : 'bg-terracotta-soft/60 text-muted hover:bg-terracotta-soft'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
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
          task ? 'Salvar alterações' : 'Criar tarefa'
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
