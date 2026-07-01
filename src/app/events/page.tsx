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
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-ink">Eventos</h1>
        <Link
          href="/events/new"
          className="rounded-full bg-terracotta px-4 py-2 text-[12.5px] font-semibold text-white"
        >
          + Novo
        </Link>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-medium text-muted">Nenhum evento cadastrado</p>
          <Link href="/events/new" className="mt-3 inline-block text-[12px] font-semibold text-terracotta">
            + Criar primeiro evento
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-[10.5px] font-bold uppercase tracking-widest text-muted">
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
              <h2 className="mb-3 text-[10.5px] font-bold uppercase tracking-widest text-muted">
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
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta text-2xl font-light text-white shadow-md"
      >
        +
      </Link>
    </div>
  )
}
