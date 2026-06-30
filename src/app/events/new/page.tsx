import { EventForm } from '@/components/EventForm'

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Novo Evento</h1>
      <EventForm />
    </div>
  )
}
