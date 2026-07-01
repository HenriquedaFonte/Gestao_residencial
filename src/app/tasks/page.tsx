import Link from 'next/link'
import { getAllTasks } from '@/lib/actions'
import { TaskCard } from '@/components/TaskCard'

export const dynamic = 'force-dynamic'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'all' } = await searchParams
  const allTasks = await getAllTasks()

  const filtered = allTasks.filter(({ task }) => {
    if (filter === 'pending') return task.status === 'pending'
    if (filter === 'completed') return task.status === 'completed'
    return true
  })

  const pendingCount = allTasks.filter(({ task }) => task.status === 'pending').length
  const completedCount = allTasks.filter(({ task }) => task.status === 'completed').length

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-ink">Tarefas</h1>
        <Link
          href="/tasks/new"
          className="rounded-full bg-terracotta px-4 py-2 text-[12.5px] font-semibold text-white"
        >
          + Nova
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[
          { value: 'all', label: `Todas (${allTasks.length})` },
          { value: 'pending', label: `Pendentes (${pendingCount})` },
          { value: 'completed', label: `Concluídas (${completedCount})` },
        ].map(({ value, label }) => (
          <Link
            key={value}
            href={`/tasks?filter=${value}`}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition-colors ${
              filter === value
                ? 'bg-terracotta text-white'
                : 'bg-card text-muted ring-1 ring-line'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-medium text-muted">
            {filter === 'completed'
              ? 'Nenhuma tarefa concluída ainda'
              : 'Nenhuma tarefa pendente'}
          </p>
          {filter !== 'completed' && (
            <Link href="/tasks/new" className="mt-3 inline-block text-[12px] font-semibold text-terracotta">
              + Criar nova tarefa
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(({ task, user }) => (
            <TaskCard key={task.id} task={task} user={user} showDate />
          ))}
        </div>
      )}

      {/* FAB */}
      <Link
        href="/tasks/new"
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta text-2xl font-light text-white shadow-md"
      >
        +
      </Link>
    </div>
  )
}
