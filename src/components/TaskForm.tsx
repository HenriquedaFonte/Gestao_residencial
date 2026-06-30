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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Title */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          defaultValue={task?.title}
          required
          placeholder="Ex: Lavar a louça"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Descrição <span className="text-gray-400">(opcional)</span>
        </label>
        <textarea
          name="description"
          defaultValue={task?.description ?? ''}
          placeholder="Detalhes adicionais..."
          rows={3}
          className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Assignee */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Responsável
        </label>
        <select
          name="assigneeId"
          defaultValue={task?.assigneeId ?? ''}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">Qualquer um dos dois</option>
          <option value="1">👨 Henrique</option>
          <option value="2">👩 Josiane</option>
        </select>
      </div>

      {/* Recurring toggle */}
      <div className="rounded-xl border border-gray-200 p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <div
            onClick={() => setIsRecurring(!isRecurring)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              isRecurring ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                isRecurring ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
          <div>
            <div className="font-medium text-gray-700">Tarefa recorrente</div>
            <div className="text-xs text-gray-400">Repete semanalmente nos dias selecionados</div>
          </div>
        </label>

        {isRecurring && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-gray-600">
              Repetir nos dias:
            </p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDay(value)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedDays.includes(value)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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
        className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
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
        className="py-3 text-sm font-medium text-gray-500"
      >
        Cancelar
      </button>
    </form>
  )
}
