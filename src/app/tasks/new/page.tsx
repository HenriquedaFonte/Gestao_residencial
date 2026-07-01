import { TaskForm } from '@/components/TaskForm'

export default function NewTaskPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 font-serif text-2xl font-semibold text-ink">Nova Tarefa</h1>
      <TaskForm />
    </div>
  )
}
