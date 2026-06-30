import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/actions'
import { EventForm } from '@/components/EventForm'
import { EventDetailActions } from '@/components/EventDetailActions'

export const dynamic = 'force-dynamic'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEventById(Number(id))

  if (!event) notFound()

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Editar Evento</h1>
      <EventForm event={event} />

      <div className="mt-6">
        <EventDetailActions eventId={event.id} eventTitle={event.title} />
      </div>
    </div>
  )
}
