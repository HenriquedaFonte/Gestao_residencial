'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { completeTask, reopenTask, deleteTask } from '@/lib/actions'
import { useCurrentUser } from './UserContext'
import { Task, User } from '@/db/schema'
import { formatDateShort, isToday } from '@/lib/utils'

type Props = {
  task: Task
  user: User | null
  showDate?: boolean
}

const RecurringIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356M2.985 19.644v-4.992h4.993m.048-4.66a7.5 7.5 0 0 1 12.548-3.364L20.015 9.35M4.031 14.652 6.42 17.04a7.5 7.5 0 0 0 12.548-3.364" />
  </svg>
)

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
)

export function TaskCard({ task, user, showDate = false }: Props) {
  const { currentUser } = useCurrentUser()
  const [isPending, startTransition] = useTransition()
  const [showDelete, setShowDelete] = useState(false)

  const isCompleted = task.status === 'completed'
  const isHenrique = user?.name === 'Henrique'

  function handleToggle() {
    if (!currentUser) return
    startTransition(async () => {
      if (isCompleted) {
        await reopenTask(task.id)
      } else {
        await completeTask(task.id, currentUser.name, currentUser.id)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTask(task.id)
    })
  }

  return (
    <div
      className={`relative flex items-start gap-3 rounded-2xl border p-3 transition-all ${
        isCompleted
          ? 'border-success-soft bg-success-soft'
          : 'border-line bg-card'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`mt-0.5 flex h-[21px] w-[21px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          isCompleted
            ? 'border-success bg-success text-white'
            : 'border-line hover:border-terracotta/60'
        }`}
      >
        {isCompleted && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <Link href={`/tasks/${task.id}`} className="block">
          <p
            className={`text-[13.5px] font-semibold leading-snug ${
              isCompleted ? 'text-muted line-through' : 'text-ink'
            }`}
          >
            {task.title}
          </p>
          {task.description && !isCompleted && (
            <p className="mt-0.5 truncate text-xs text-muted">
              {task.description}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {user && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${
                  isHenrique
                    ? 'bg-henrique-soft text-henrique'
                    : 'bg-josiane-soft text-josiane'
                }`}
              >
                <span
                  className={`flex h-[15px] w-[15px] items-center justify-center rounded-full text-[8.5px] font-bold text-white ${
                    isHenrique ? 'bg-henrique' : 'bg-josiane'
                  }`}
                >
                  {user.name[0]}
                </span>
                {user.name}
              </span>
            )}
            {task.isRecurring && (
              <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-soft px-2 py-0.5 text-[10.5px] font-semibold text-terracotta">
                <RecurringIcon />
                Recorrente
              </span>
            )}
            {showDate && task.scheduledDate && (
              <span
                className={`text-[10.5px] font-semibold ${
                  isToday(task.scheduledDate)
                    ? 'text-terracotta'
                    : 'text-muted'
                }`}
              >
                {isToday(task.scheduledDate) ? 'Hoje' : formatDateShort(task.scheduledDate)}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Delete */}
      <div className="flex-shrink-0">
        {showDelete ? (
          <div className="flex gap-1">
            <button
              onClick={handleDelete}
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
  )
}
