'use client'

import { useRouter } from 'next/navigation'
import { Task, User } from '@/db/schema'

type HistoryEntry = {
  task: Task
  completedBy: User | null
  parentRecurrenceType: string | null
}

type Props = {
  history: HistoryEntry[]
  users: User[]
  currentMonth: string
  selectedUserId?: number
}

function taskPoints(recurrenceType: string | null): number {
  if (recurrenceType === 'monthly') return 5
  if (recurrenceType === 'weekly') return 3
  return 1
}

function pointsLabel(pts: number) {
  return `${pts} pt${pts !== 1 ? 's' : ''}`
}

function recurrenceLabel(recurrenceType: string | null) {
  if (recurrenceType === 'monthly') return 'Mensal'
  if (recurrenceType === 'weekly') return 'Semanal'
  if (recurrenceType === 'daily') return 'Diária'
  return 'Avulsa'
}

function formatMonthLabel(month: string) {
  const [year, mon] = month.split('-').map(Number)
  const date = new Date(year, mon - 1, 1)
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function navigateMonth(month: string, delta: number): string {
  const [year, mon] = month.split('-').map(Number)
  const d = new Date(year, mon - 1 + delta, 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function isCurrentMonth(month: string): boolean {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return month === `${y}-${m}`
}

function formatDateGroup(isoDate: string, timeZone = 'America/Toronto'): string {
  const d = new Date(isoDate)
  const label = d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone,
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatTime(date: Date | string, timeZone = 'America/Toronto'): string {
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  })
}

function localDateKey(date: Date | string, timeZone = 'America/Toronto'): string {
  return new Date(date).toLocaleDateString('en-CA', { timeZone }) // YYYY-MM-DD
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      {direction === 'left'
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      }
    </svg>
  )
}

export function HistoryClient({ history, users, currentMonth, selectedUserId }: Props) {
  const router = useRouter()
  const isCurrent = isCurrentMonth(currentMonth)

  function goMonth(delta: number) {
    const next = navigateMonth(currentMonth, delta)
    const userParam = selectedUserId ? `&user=${selectedUserId}` : ''
    router.push(`/history?month=${next}${userParam}`)
  }

  function setUserFilter(userId?: number) {
    const userParam = userId ? `&user=${userId}` : ''
    router.push(`/history?month=${currentMonth}${userParam}`)
  }

  // Group by local date
  const byDay: Record<string, HistoryEntry[]> = {}
  for (const entry of history) {
    const key = entry.task.completedAt ? localDateKey(entry.task.completedAt) : 'unknown'
    if (!byDay[key]) byDay[key] = []
    byDay[key].push(entry)
  }
  const days = Object.keys(byDay).sort().reverse()

  const totalPoints = history.reduce((sum, e) => sum + taskPoints(e.parentRecurrenceType), 0)

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-ink">Histórico</h1>
        <button
          onClick={() => router.push('/scores')}
          className="text-[12px] font-semibold text-terracotta"
        >
          Ver placar
        </button>
      </div>

      {/* Month selector */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
        <button onClick={() => goMonth(-1)} className="rounded-lg p-1 text-muted hover:text-ink">
          <ChevronIcon direction="left" />
        </button>
        <span className="text-[14px] font-semibold text-ink">{formatMonthLabel(currentMonth)}</span>
        <button
          onClick={() => goMonth(1)}
          disabled={isCurrent}
          className="rounded-lg p-1 text-muted hover:text-ink disabled:opacity-30"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      {/* User filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setUserFilter(undefined)}
          className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors ${
            !selectedUserId
              ? 'bg-terracotta text-white'
              : 'border border-line bg-card text-muted'
          }`}
        >
          Todos
        </button>
        {users.map((u) => {
          const isHenrique = u.name === 'Henrique'
          return (
            <button
              key={u.id}
              onClick={() => setUserFilter(u.id)}
              className={`rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors ${
                selectedUserId === u.id
                  ? isHenrique
                    ? 'bg-henrique text-white'
                    : 'bg-josiane text-white'
                  : 'border border-line bg-card text-muted'
              }`}
            >
              {u.name}
            </button>
          )
        })}
      </div>

      {/* Summary */}
      {history.length > 0 && (
        <p className="mb-4 text-[12px] text-muted">
          {history.length} tarefa{history.length !== 1 ? 's' : ''} · {totalPoints} ponto{totalPoints !== 1 ? 's' : ''}
        </p>
      )}

      {/* History list */}
      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-12 text-center">
          <p className="text-[13px] font-medium text-muted">
            Nenhuma tarefa concluída{selectedUserId ? ' por este usuário' : ''} neste mês
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {days.map((day) => (
            <div key={day}>
              <p className="mb-2 text-[10.5px] font-bold uppercase tracking-widest text-muted">
                {formatDateGroup(day + 'T12:00:00')}
              </p>
              <div className="flex flex-col gap-2">
                {byDay[day].map(({ task, completedBy, parentRecurrenceType }) => {
                  const pts = taskPoints(parentRecurrenceType)
                  const isHenrique = completedBy?.name === 'Henrique'
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5"
                    >
                      {/* User avatar */}
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-serif text-sm font-semibold text-white ${
                          completedBy
                            ? isHenrique ? 'bg-henrique' : 'bg-josiane'
                            : 'bg-line'
                        }`}
                      >
                        {completedBy ? completedBy.name[0] : '?'}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold text-ink">{task.title}</p>
                        <p className="text-[10.5px] text-muted">
                          {completedBy?.name ?? 'Desconhecido'} · {task.completedAt ? formatTime(task.completedAt) : ''}
                        </p>
                      </div>

                      {/* Points badge */}
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-serif text-[15px] font-semibold text-terracotta">
                          +{pointsLabel(pts)}
                        </span>
                        <span className="text-[9.5px] font-medium text-muted">
                          {recurrenceLabel(parentRecurrenceType)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
