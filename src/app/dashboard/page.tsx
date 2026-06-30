import Link from 'next/link'
import { getTasksForDashboard, getUpcomingEvents, seedUsers } from '@/lib/actions'
import { TaskCard } from '@/components/TaskCard'
import { EventCard } from '@/components/EventCard'
import { DashboardHeader } from '@/components/DashboardHeader'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Ensure users are seeded on first run
  await seedUsers()

  const [{ oneOffTasks, recurringToday }, upcomingEvents] = await Promise.all([
    getTasksForDashboard(),
    getUpcomingEvents(5),
  ])

  const pendingCount = [
    ...oneOffTasks.filter(({ task }) => task.status === 'pending'),
    ...recurringToday.filter(({ task }) => task.status === 'pending'),
  ].length

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <DashboardHeader pendingCount={pendingCount} />

      {/* Today's Tasks */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Tarefas de Hoje</h2>
          <Link
            href="/tasks"
            className="text-sm font-medium text-indigo-600"
          >
            Ver todas →
          </Link>
        </div>

        {recurringToday.length === 0 && oneOffTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center">
            <div className="text-4xl">🎉</div>
            <p className="mt-2 font-medium text-gray-500">Nenhuma tarefa por hoje!</p>
            <Link
              href="/tasks/new"
              className="mt-3 inline-block text-sm font-medium text-indigo-600"
            >
              + Adicionar tarefa
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recurringToday.map(({ task, user }) => (
              <TaskCard key={task.id} task={task} user={user} />
            ))}
            {oneOffTasks.map(({ task, user }) => (
              <TaskCard key={task.id} task={task} user={user} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Events */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Próximos Eventos</h2>
          <Link
            href="/events"
            className="text-sm font-medium text-indigo-600"
          >
            Ver todos →
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center">
            <div className="text-4xl">📅</div>
            <p className="mt-2 font-medium text-gray-500">Nenhum evento agendado</p>
            <Link
              href="/events/new"
              className="mt-3 inline-block text-sm font-medium text-indigo-600"
            >
              + Adicionar evento
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} compact />
            ))}
          </div>
        )}
      </section>

      {/* FAB */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-2">
        <Link
          href="/events/new"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-indigo-600 shadow-lg ring-1 ring-indigo-100"
          title="Novo evento"
        >
          📅
        </Link>
        <Link
          href="/tasks/new"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg"
          title="Nova tarefa"
        >
          +
        </Link>
      </div>
    </div>
  )
}
