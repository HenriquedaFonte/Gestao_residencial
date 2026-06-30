import { TaskForm } from '@/components/TaskForm'

export default function NewTaskPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Nova Tarefa</h1>
      <TaskForm />
    </div>
  )
}
