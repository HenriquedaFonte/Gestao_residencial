import { notFound } from 'next/navigation'
import { getTaskById } from '@/lib/actions'
import { TaskForm } from '@/components/TaskForm'
import { TaskDetailActions } from '@/components/TaskDetailActions'

export const dynamic = 'force-dynamic'

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getTaskById(Number(id))

  if (!result) notFound()

  const { task, user } = result

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Editar Tarefa</h1>

      {task.parentTaskId && (
        <div className="mb-4 rounded-xl bg-purple-50 px-4 py-3 text-sm text-purple-700">
          🔁 Esta é uma instância de uma tarefa recorrente
        </div>
      )}

      <TaskForm task={task} />

      <div className="mt-6">
        <TaskDetailActions taskId={task.id} taskTitle={task.title} />
      </div>
    </div>
  )
}
