import Link from 'next/link'
import { getTasksForDashboard, getUpcomingEvents, seedUsers } from '@/lib/actions'
import { TaskCard } from '@/components/TaskCard'
import { DashboardHeader } from '@/components/DashboardHeader'
import { Event } from '@/db/schema'

export const dynamic = 'force-dynamic'

function dayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const label = new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function EventStrip({ events }: { events: Event[] }) {
  return (
    <div className="mt-5 -mx-4">
      <div className="mb-2.5 flex items-center justify-between px-4">
        <h2 className="font-serif text-[15px] font-semibold text-ink">Próximos Eventos</h2>
        <Link href="/events" className="text-[12px] font-semibold text-terracotta">
          Ver todos
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {events.map((event) => {
          const [y, m, d] = event.date.split('-').map(Number)
          const dateObj = new Date(y, m - 1, d)
          const monthShort = dateObj
            .toLocaleDateString('pt-BR', { month: 'short' })
            .replace('.', '')
            .toUpperCase()
          return (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="w-[118px] flex-shrink-0 overflow-hidden rounded-2xl border border-line bg-card"
            >
              <div className="bg-terracotta px-3 py-2 text-white">
                <p className="font-serif text-[26px] font-semibold leading-none">{d}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{monthShort}</p>
              </div>
              <div className="px-3 py-2.5">
                <p className="line-clamp-2 text-[11.5px] font-semibold leading-snug text-ink">
                  {event.title}
                </p>
                {event.time && (
                  <p className="mt-1 text-[10.5px] text-muted">{event.time}</p>
                )}
              </div>
            </Link>
          )
        })}

        <Link
          href="/events/new"
          className="flex w-[72px] flex-shrink-0 items-center justify-center rounded-2xl border border-dashed border-line bg-card text-2xl font-light text-muted"
        >
          +
        </Link>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  await seedUsers()

  const [{ oneOffTasks, recurringToday, upcomingThisWeek }, upcomingEvents] = await Promise.all([
    getTasksForDashboard(),
    getUpcomingEvents(8),
  ])

  const pendingCount = [
    ...oneOffTasks.filter(({ task }) => task.status === 'pending'),
    ...recurringToday.filter(({ task }) => task.status === 'pending'),
  ].length

  const upcomingByDay: Record<string, typeof upcomingThisWeek> = {}
  for (const item of upcomingThisWeek) {
    const date = item.task.scheduledDate!
    if (!upcomingByDay[date]) upcomingByDay[date] = []
    upcomingByDay[date].push(item)
  }
  const upcomingDays = Object.keys(upcomingByDay).sort()

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <DashboardHeader pendingCount={pendingCount} />

      {/* Events horizontal strip */}
      <EventStrip events={upcomingEvents} />

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

      {/* Upcoming this week */}
      {upcomingDays.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-serif text-[17px] font-semibold text-ink">Esta Semana</h2>
          <div className="flex flex-col gap-4">
            {upcomingDays.map((date) => (
              <div key={date}>
                <p className="mb-2 text-[10.5px] font-bold uppercase tracking-widest text-muted">
                  {dayLabel(date)}
                </p>
                <div className="flex flex-col gap-2">
                  {upcomingByDay[date].map(({ task, user }) => (
                    <TaskCard key={task.id} task={task} user={user} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAB */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-2">
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
