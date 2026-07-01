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
      <h1 className="mb-6 font-serif text-2xl font-semibold text-ink">Editar Tarefa</h1>

      {task.parentTaskId && (
        <div className="mb-4 rounded-[13px] border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-[12.5px] font-medium text-terracotta">
          Instância de tarefa recorrente
        </div>
      )}

      <TaskForm task={task} />

      <div className="mt-6">
        <TaskDetailActions taskId={task.id} taskTitle={task.title} />
      </div>
    </div>
  )
}
