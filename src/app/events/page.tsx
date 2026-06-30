import Link from 'next/link'
import { getAllEvents } from '@/lib/actions'
import { EventCard } from '@/components/EventCard'
import { getTodayDateString } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const allEvents = await getAllEvents()
  const today = getTodayDateString()

  const upcoming = allEvents.filter((e) => e.date >= today)
  const past = allEvents.filter((e) => e.date < today)

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Eventos</h1>
        <Link
          href="/events/new"
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm"
        >
          + Novo
        </Link>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-5xl">📅</div>
          <p className="mt-3 font-medium text-gray-500">Nenhum evento cadastrado</p>
          <Link
            href="/events/new"
            className="mt-3 inline-block text-sm font-medium text-indigo-600"
          >
            + Criar primeiro evento
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Próximos
              </h2>
              <div className="flex flex-col gap-2">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Passados
              </h2>
              <div className="flex flex-col gap-2">
                {past.reverse().map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* FAB */}
      <Link
        href="/events/new"
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg"
      >
        +
      </Link>
    </div>
  )
}
