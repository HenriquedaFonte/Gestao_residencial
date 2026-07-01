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
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-[17px] font-semibold text-ink">Tarefas de Hoje</h2>
          <Link href="/tasks" className="text-[12px] font-semibold text-terracotta">
            Ver todas
          </Link>
        </div>

        {recurringToday.length === 0 && oneOffTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-10 text-center">
            <p className="text-[13px] font-medium text-muted">Nenhuma tarefa por hoje</p>
            <Link href="/tasks/new" className="mt-2 inline-block text-[12px] font-semibold text-terracotta">
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
          <h2 className="font-serif text-[17px] font-semibold text-ink">Próximos Eventos</h2>
          <Link href="/events" className="text-[12px] font-semibold text-terracotta">
            Ver todos
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-10 text-center">
            <p className="text-[13px] font-medium text-muted">Nenhum evento agendado</p>
            <Link href="/events/new" className="mt-2 inline-block text-[12px] font-semibold text-terracotta">
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
          className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-card shadow-sm"
          title="Novo evento"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C2683F" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </Link>
        <Link
          href="/tasks/new"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-terracotta text-2xl font-light text-white shadow-md"
          title="Nova tarefa"
        >
          +
        </Link>
      </div>
    </div>
  )
}
